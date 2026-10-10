// Local history preview only: immutable, bounded H.264/AAC proxies; never touches REC/PGM.
import {spawn} from 'node:child_process';
import {createHash,randomUUID} from 'node:crypto';
import {mkdir,lstat,stat,writeFile,rename,unlink} from 'node:fs/promises';
import {join,resolve} from 'node:path';
export const PREVIEW_SECONDS=8;
export const PREVIEW_CODECS='avc1.42E02A,mp4a.40.2';
export class ReplayPreview {
 constructor({root,ffmpeg,probe,session}){Object.assign(this,{root,ffmpeg,probe,session});this.entries=new Map();this.reading=new Set();this.active=null;this.pending=null;this.directory=join(root,'gravacoes','replay-preview',randomUUID());this.maxBytes=128*1024*1024;this.maxEntries=24;}
 isReadingSource(file){return this.reading.has(resolve(file));}
 async prepare(plan){
  if(this.closing)throw Error('A prévia está encerrando');
  const signature=JSON.stringify([plan.sessionId,plan.cam,plan.start,plan.end,plan.parts.map(p=>plan.immutable?[p.file]:[p.file,p.size,p.mtimeMs])]);
  const key=createHash('sha256').update(signature).digest('hex'),cached=this.entries.get(key);
  if(cached){cached.used=Date.now();return this.describe(cached,plan.cursor,true);}
  return new Promise((resolve,reject)=>{const task={plan,key,resolve,reject};if(!this.active)this.run(task);else{this.pending?.reject(Error('Prévia substituída por uma busca mais recente'));this.pending=task;}});
 }
 describe(entry,cursor,cacheHit){return {token:entry.token,start:entry.start,end:entry.end,cursor:Math.min(entry.end,Math.max(entry.start,cursor)),mime:'video/mp4',codecs:entry.hasAudio?PREVIEW_CODECS:'avc1.42E02A',bytes:entry.bytes,url:'/api/replay-preview/'+entry.token,hasAudio:entry.hasAudio,frameRate:entry.frameRate,prepareMs:entry.prepareMs,cacheHit};}
 async run(task){this.active=task;this.activeDone=(async()=>{try{task.resolve(await this.build(task));}catch(e){task.reject(e);}finally{this.active=null;this.child=null;const next=this.pending;this.pending=null;if(next&&!this.closing)this.run(next);}})();}
 async build({plan,key}){
  if(this.session()?.id!==plan.sessionId)throw Error('A sessão mudou. Atualize a timeline');
  const started=Date.now(),token=randomUUID().replaceAll('-',''),file=join(this.directory,token+'.mp4'),temporary=file+'.tmp.mp4',list=join(this.directory,token+'.txt');
  try{
   for(const part of plan.parts){const info=await lstat(part.file);if(!info.isFile()||info.isSymbolicLink())throw Error('Arquivo histórico irregular');this.reading.add(resolve(part.file));}
   await mkdir(this.directory,{recursive:true});const dirInfo=await lstat(this.directory);if(!dirInfo.isDirectory()||dirInfo.isSymbolicLink())throw Error('Cache de prévia irregular');
   const concat=plan.parts.length>1;
   if(concat)await writeFile(list,plan.parts.map(p=>{if(/[\r\n]/.test(p.file))throw Error('Caminho histórico inválido');return "file '"+p.file.replaceAll('\\','/').replaceAll("'","'\\''")+"'";}).join('\n'),'utf8');
   const offset=plan.start-plan.parts[0].start;
   const input=concat?['-f','concat','-safe','0','-i',list]:['-i',plan.parts[0].file];
   // Input seek uses the demux index; decode/encode only this eight-second window.
   const args=['-hide_banner','-v','error','-nostdin','-y','-threads','2','-filter_threads','1','-ss',String(offset),...input,'-t',String(plan.end-plan.start),'-map','0:v:0','-map','0:a:0?','-vf','scale=640:360:force_original_aspect_ratio=decrease,pad=640:360:(ow-iw)/2:(oh-ih)/2,setsar=1,setpts=PTS-STARTPTS','-af','asetpts=PTS-STARTPTS','-c:v','libx264','-preset','ultrafast','-crf','25','-threads','2','-profile:v','baseline','-level:v','4.2','-pix_fmt','yuv420p','-bf','0','-g','30','-sc_threshold','0','-fps_mode','passthrough','-c:a','aac','-b:a','96k','-ac','2','-ar','48000','-avoid_negative_ts','make_zero','-movflags','empty_moov+frag_keyframe+default_base_moof','-frag_duration','1000000',temporary];
   // delay_moov writes the first fragment after both AAC/video timestamps are
   // known, avoiding a stretched first video sample at each chunk boundary.
   args[args.indexOf('empty_moov+frag_keyframe+default_base_moof')]='delay_moov+frag_keyframe+default_base_moof';
   await new Promise((accept,reject)=>{const child=spawn(this.ffmpeg,args,{windowsHide:true,stdio:['ignore','ignore','pipe']});this.child=child;let error='',timedOut=false;const timeout=setTimeout(()=>{timedOut=true;child.kill();},30000);child.stderr.on('data',b=>error=(error+b).slice(-1600));child.on('error',e=>{clearTimeout(timeout);reject(e);});child.on('close',code=>{clearTimeout(timeout);timedOut?reject(Error('Prévia excedeu 30 segundos; reduza carga ou volte no histórico')):code===0?accept():reject(Error('Falha na prévia histórica: '+error));});});
   const info=await stat(temporary),media=await this.probe(temporary);
   if(!info.size||info.size>32*1024*1024||!media.hasVideo||Math.abs(media.duration-(plan.end-plan.start))>.18)throw Error('Prévia incompleta; o ponto pode ainda estar sendo gravado');
   if(this.session()?.id!==plan.sessionId)throw Error('A sessão mudou durante a prévia');
   await rename(temporary,file);
   const entry={key,token,file,sessionId:plan.sessionId,start:plan.start,end:plan.end,bytes:info.size,hasAudio:media.audio,frameRate:media.frameRate,prepareMs:Date.now()-started,used:Date.now(),leases:0};this.entries.set(key,entry);await this.prune();return this.describe(entry,plan.cursor,false);
  }finally{for(const part of plan.parts)this.reading.delete(resolve(part.file));await unlink(list).catch(()=>{});await unlink(temporary).catch(()=>{});}
 }
 async file(token){
  if(typeof token!=='string'||!/^[a-f0-9]{32}$/.test(token))throw Error('Token de prévia inválido');
  const entry=[...this.entries.values()].find(e=>e.token===token);
  if(!entry||entry.sessionId!==this.session()?.id)throw Error('Prévia expirada ou sessão diferente');
  const info=await lstat(entry.file);if(!info.isFile()||info.isSymbolicLink()||info.size!==entry.bytes)throw Error('Prévia alterada');
  entry.used=Date.now();entry.leases++;let released=false;
  return {file:entry.file,bytes:entry.bytes,mime:'video/mp4',release:()=>{if(!released){released=true;entry.leases--;if(this.closing&&!entry.leases)unlink(entry.file).then(()=>this.entries.delete(entry.key)).catch(()=>{});}}};
 }
 async prune(){let bytes=[...this.entries.values()].reduce((sum,e)=>sum+e.bytes,0);for(const entry of [...this.entries.values()].sort((a,b)=>a.used-b.used)){if(entry.leases)continue;if(entry.sessionId===this.session()?.id&&this.entries.size<=this.maxEntries&&bytes<=this.maxBytes&&Date.now()-entry.used<300000)continue;await unlink(entry.file).catch(e=>{if(e.code!=='ENOENT')throw e;});bytes-=entry.bytes;this.entries.delete(entry.key);}}
 async close(){this.closing=true;this.pending?.reject(Error('A prévia está encerrando'));this.pending=null;this.child?.kill();await this.activeDone;for(const entry of this.entries.values()){if(entry.leases)continue;await unlink(entry.file).catch(()=>{});this.entries.delete(entry.key);}}
}
