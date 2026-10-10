// Saved clips only. No full scan of live recordings; no Native/decoder seek.
import {spawn} from 'node:child_process';
import {stat} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';

export const CADENCE_LIMITS = Object.freeze({
  maxSeconds:120.5, maxFrames:29000, maxOutputBytes:4*1024*1024,
  deadlineMs:8000, maxEntries:32, maxOutstanding:1,
});
const unknown = (reason,identity=null) => ({
  method:'finite-full-decoded-pts',status:'unknown',entireFile:false,reason,identity,
});

export function classifyClipPts(pts,{duration,frameMs,videoStart,maxFrames=CADENCE_LIMITS.maxFrames}={}) {
  if(!Array.isArray(pts)||pts.length<2||pts.length>maxFrames||
     !Number.isFinite(duration)||duration<=0||!Number.isFinite(frameMs)||
     frameMs<1000/240||frameMs>1000)return unknown('invalid-or-incomplete-pts');
  if(pts.some(n=>!Number.isFinite(n)))return unknown('missing-or-invalid-pts');
  if(!Number.isFinite(videoStart)||Math.abs((pts[0]-videoStart)*1000)>1.5)
    return unknown('decoded-start-does-not-match-stream');
  let minMs=Infinity,maxMs=-Infinity,irregular=0;
  for(let i=1;i<pts.length;i++) {
    const ms=(pts[i]-pts[i-1])*1000;
    if(ms<=0)return unknown('non-increasing-pts');
    minMs=Math.min(minMs,ms);maxMs=Math.max(maxMs,ms);
    // Same tolerance as the previous sampled classifier; not expanded for QA.
    if(Math.abs(ms-frameMs)>Math.max(1.5,frameMs*.005))irregular++;
  }
  const spanMs=(pts.at(-1)-pts[0])*1000;
  // A clean exit can still follow a damaged stream which silently ends early.
  if(Math.abs(spanMs+frameMs-duration*1000)>Math.max(50,2*frameMs))
    return unknown('decoded-span-does-not-cover-clip');
  return {method:'finite-full-decoded-pts',status:irregular?'vfr':'cfr',entireFile:true,
    frames:pts.length,firstPts:pts[0],lastPts:pts.at(-1),minMs,maxMs,irregularIntervals:irregular};
}

async function fileIdentity(file) {
  const s=await stat(file);if(!s.isFile())throw Error('CADENCE_NOT_FILE');
  // Invalidation identity, not cryptographic certification of file contents.
  return createHash('sha256').update(JSON.stringify([
    resolve(file),s.dev,s.ino,s.size,s.mtimeMs,s.ctimeMs,
  ])).digest('hex');
}

function scan(tool,file,limits,jobs) {
  return new Promise((resolveResult,reject)=>{
    let bytes=0,error=null,settled=false,exited=false,reap;
    const chunks=[],child=spawn(tool,[
      '-v','error','-threads','1','-select_streams','v:0',
      '-show_entries','frame=best_effort_timestamp_time','-of','json',file,
    ],{windowsHide:true,stdio:['ignore','pipe','pipe']});
    const job={child,cancel:()=>stop('CADENCE_CANCELLED')};jobs.add(job);
    function settle(e,output) {
      if(settled)return;settled=true;
      if(e)reject(e);else resolveResult(output);
    }
    function stop(code) {
      if(error||exited)return;error=Error(code);chunks.length=0;
      child.kill();
      // Bound the caller even if the OS fails to reap. Keep the job registered
      // until actual close: callers can observe quiescent=false and fail closed.
      reap=setTimeout(()=>settle(Error('CADENCE_CHILD_NOT_REAPED')),2000);
    }
    const timer=setTimeout(()=>stop('CADENCE_DEADLINE'),limits.deadlineMs);
    child.stdout.on('data',b=>{
      if(error)return;bytes+=b.length;
      if(bytes>limits.maxOutputBytes){stop('CADENCE_OUTPUT_BUDGET');return;}
      chunks.push(b);
    });
    child.stderr.on('data',()=>{});
    child.once('error',e=>{
      clearTimeout(timer);
      // spawn failure has no process to reap. Do not leave a phantom owner job.
      if(!child.pid){exited=true;jobs.delete(job);}
      else stop('CADENCE_PROCESS_ERROR');
      settle(e);
    });
    child.once('close',code=>{
      exited=true;clearTimeout(timer);clearTimeout(reap);jobs.delete(job);
      settle(error||(code!==0?Error('CADENCE_DECODE_FAILED'):null),
        Buffer.concat(chunks).toString('utf8'));
    });
  });
}

export class ReplayCadence {
  constructor({ffprobe,limits={},decode=scan,identity=fileIdentity}={}) {
    this.ffprobe=ffprobe;this.limits={...CADENCE_LIMITS,...limits};
    if(typeof ffprobe!=='string'||!ffprobe||typeof decode!=='function'||typeof identity!=='function')
      throw Error('CADENCE_CONFIG');
    for(const k of Object.keys(CADENCE_LIMITS)) {
      if(!Number.isFinite(this.limits[k])||this.limits[k]<=0||this.limits[k]>CADENCE_LIMITS[k]||
         (k!=='maxSeconds'&&!Number.isInteger(this.limits[k])))throw Error('CADENCE_BUDGET');
    }
    this.decode=decode;this.identity=identity;this.cache=new Map();this.pending=new Map();
    this.jobs=new Set();this.closed=false;this.generation=0;this.closePromise=null;
    this.metrics={scans:0,cacheHits:0,coalesced:0};
  }
  async matches(file,id) {
    if(this.closed||typeof id!=='string')return false;
    try{return await this.identity(file)===id;}catch{return false;}
  }
  async probe(file,{duration,frameMs,videoStart}={}) {
    if(this.closed)return unknown('owner-closed');
    let id;try{id=await this.identity(file);}catch{return unknown('file-unavailable');}
    if(this.closed)return unknown('owner-closed');
    if(!Number.isFinite(duration)||duration<=0||duration>this.limits.maxSeconds)
      return unknown('clip-duration-budget',id);
    if(!Number.isFinite(frameMs)||frameMs<1000/240||frameMs>1000)
      return unknown('frame-rate-unconfirmed',id);
    if(!Number.isFinite(videoStart))return unknown('stream-start-unconfirmed',id);
    const key=JSON.stringify([id,duration,frameMs,videoStart,this.ffprobe]);
    if(this.cache.has(key)) {
      const data=this.cache.get(key);this.cache.delete(key);this.cache.set(key,data);
      this.metrics.cacheHits++;return structuredClone(data);
    }
    if(this.pending.has(key)) {
      this.metrics.coalesced++;return structuredClone(await this.pending.get(key));
    }
    if(this.pending.size>=this.limits.maxOutstanding||this.jobs.size>=this.limits.maxOutstanding)
      return unknown('scan-busy',id);
    const generation=this.generation;
    const task=(async()=>{
      let result;
      try {
        this.metrics.scans++;
        const raw=await this.decode(this.ffprobe,file,this.limits,this.jobs);
        if(Buffer.byteLength(raw)>this.limits.maxOutputBytes)return unknown('output-budget',id);
        const frames=JSON.parse(raw).frames;
        if(!Array.isArray(frames)||frames.length>this.limits.maxFrames)
          return unknown('frame-count-budget',id);
        const pts=frames.map(f=>typeof f?.best_effort_timestamp_time==='string'&&
          f.best_effort_timestamp_time.trim()?Number(f.best_effort_timestamp_time):NaN);
        result=classifyClipPts(pts,{duration,frameMs,videoStart,maxFrames:this.limits.maxFrames});
      }catch{return unknown(this.closed?'owner-closed':'scan-failed-or-budget',id);}
      if(this.closed||generation!==this.generation)return unknown('owner-changed',id);
      if(!await this.matches(file,id))return unknown('file-changed-during-scan',id);
      if(this.closed||generation!==this.generation)return unknown('owner-changed',id);
      result.identity=id;
      if(result.status!=='unknown') {
        while(this.cache.size>=this.limits.maxEntries)this.cache.delete(this.cache.keys().next().value);
        this.cache.set(key,structuredClone(result));
      }
      return result;
    })();
    this.pending.set(key,task);
    try{return structuredClone(await task);}
    finally{if(this.pending.get(key)===task)this.pending.delete(key);}
  }
  async close() {
    if(!this.closePromise) {
      this.closed=true;this.generation++;this.cache.clear();
      for(const job of this.jobs)job.cancel();
      this.closePromise=(async()=>{
        await Promise.allSettled([...this.pending.values()]);this.pending.clear();
      })();
    }
    await this.closePromise;
    // A failed reap is retained, and a later actual close can be observed.
    return {quiescent:this.jobs.size===0,jobs:this.jobs.size};
  }
}
