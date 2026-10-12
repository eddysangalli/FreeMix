// Bridge to the shared root-owned worker. No child_process or raw filesystem
// mutation surface here. The worker author owns all process and path checks.
import {resolve,relative,isAbsolute,sep} from 'node:path';
const contained=(root,file)=>{const r=relative(resolve(root),resolve(file));return r!==''&&r!=='..'&&!r.startsWith('..'+sep)&&!isAbsolute(r);};
function complete(result){if(result?.closed!==true||result?.actualClosed!==true||result.exitCode!==0)throw Error('CURVE_ACTUAL_CLOSE_NOT_CONFIRMED');return result;}

export function measureSpeedCurveSourceCadence(json){
  const duration=Number(json?.format?.duration),video=json?.streams?.find(s=>s.codec_type==='video');
  if(!Number.isFinite(duration)||duration<=0||!video)throw Error('CURVE_PROBE_METADATA');
  const rate=String(video.avg_frame_rate).split('/').map(Number),fps=rate[0]/rate[1];
  const pts=(json.frames||[]).map(f=>f.best_effort_timestamp_time===null||f.best_effort_timestamp_time===undefined||f.best_effort_timestamp_time===''?NaN:Number(f.best_effort_timestamp_time));
  if(!Number.isFinite(fps)||fps<1||fps>60||pts.length<2||pts.length>1801||pts.some(x=>!Number.isFinite(x)))throw Error('CURVE_SOURCE_CADENCE_UNKNOWN');
  const intervalTolerance=Math.max(.0015,1/fps*.005),coverageTolerance=Math.max(.05,2/fps);
  if(Math.abs(pts[0])>intervalTolerance||pts.some((p,i)=>i>0&&(p<=pts[i-1]||Math.abs(p-pts[i-1]-1/fps)>intervalTolerance)))throw Error('CURVE_SOURCE_CADENCE_UNKNOWN');
  const measuredDurationSeconds=pts.at(-1)+1/fps;
  // A packet-count bound is not an entire-file proof by itself. Compare the
  // observed final decoded frame against the independent container duration.
  if(Math.abs(measuredDurationSeconds-duration)>coverageTolerance)throw Error('CURVE_SOURCE_DECODE_DOES_NOT_COVER_FORMAT');
  const reported=Number(video.duration),hasReported=video.duration!==undefined&&video.duration!==null&&video.duration!==''&&video.duration!=='N/A';
  if(hasReported&&(!Number.isFinite(reported)||reported<=0||Math.abs(measuredDurationSeconds-reported)>coverageTolerance))throw Error('CURVE_SOURCE_STREAM_DURATION_CONFLICT');
  return {status:'cfr',entireFile:true,frames:pts.length,measuredDurationSeconds,
    durationEvidence:'full-decoded-pts-plus-one-cfr-frame',normalizedVideo:{...video,duration:hasReported?video.duration:String(measuredDurationSeconds)},streamDurationDerived:!hasReported};
}
export function createSpeedCurveWorkerAdapter(worker){
  if(!worker||typeof worker.root!=='string'||['execute','assertFile','assertOutput','commitAbsent','cleanupQuiescent','getLedger'].some(k=>typeof worker[k]!=='function'))throw Error('CURVE_SHARED_WORKER_REQUIRED');
  const identities=new Map();
  const assertFile=async(file,{root,maxBytes}={})=>{
    file=resolve(file);if(root&&!contained(root,file))throw Error('CURVE_SOURCE_ROOT_CONTAINMENT');
    const info=await worker.assertFile(file);
    if(!Number.isSafeInteger(info.bytes)||maxBytes&&info.bytes>maxBytes||typeof info.sha256!=='string'||!/^[0-9a-f]{64}$/i.test(info.sha256)||!Number.isFinite(info.mtimeMs))throw Error('CURVE_CRYPTOGRAPHIC_FILE_IDENTITY_REQUIRED');
    identities.set(file,info);return info;
  };
  const input=file=>{file=resolve(file);const id=identities.get(file);if(!id)throw Error('CURVE_INPUT_NOT_CHECKED');return {path:file,identity:id};};
  const execute=async(spec)=>{
    const inputs=[];for(let i=0;i<spec.args.length;i++)if(spec.args[i]==='-i'){
      const file=spec.args[++i];if(file==='anullsrc=channel_layout=stereo:sample_rate=48000')continue;inputs.push(input(file));
    }
    if(spec.kind==='ffprobe')inputs.push(input(spec.args.at(-1)));
    return complete(await worker.execute({kind:spec.kind,args:spec.args,label:spec.kind==='ffprobe'?'probe':spec.outputFiles?.length?'speedcurve-prepare':'decode-verify',
      inputs,outputFiles:(spec.outputFiles||[]).map(x=>typeof x==='string'?x:x.file),stdoutMode:'text',timeoutMs:spec.deadlineMs,
      maxStdoutBytes:spec.maxStdoutBytes,maxOutputBytes:Math.min(...(spec.outputFiles||[]).map(x=>x.maxBytes||100*1024*1024),100*1024*1024),signal:spec.signal}));
  };
  return {
    assertFile,
    assertOutput:async(file,{root}={})=>{if(root&&!contained(root,file))throw Error('CURVE_OUTPUT_ROOT_CONTAINMENT');return worker.assertOutput(file);},
    execute,
    async probe({file,signal,deadlineMs=10000,countFrames=false}){
      await assertFile(file);
      const entries='stream=codec_type,codec_name,width,height,field_order,avg_frame_rate,duration,nb_read_frames,sample_rate,channels:format=duration'+(countFrames?'':':frame=best_effort_timestamp_time');
      const args=['-v','error',...(countFrames?['-count_frames']:['-select_streams','v:0','-read_intervals','%+#9999','-show_frames']),'-show_streams','-show_format',
        '-show_entries',entries,'-of','json',file];
      const result=await execute({kind:'ffprobe',args,signal,deadlineMs,maxStdoutBytes:2*1024*1024,outputFiles:[]});
      const json=JSON.parse(result.stdout),duration=Number(json.format?.duration);
      if(!Number.isFinite(duration)||duration<=0||!Array.isArray(json.streams))throw Error('CURVE_PROBE_METADATA');
      let cadence;
      if(!countFrames){
        const measured=measureSpeedCurveSourceCadence(json);
        json.streams=json.streams.map(s=>s.codec_type==='video'?measured.normalizedVideo:s);
        const {normalizedVideo,...evidence}=measured;cadence=evidence;
      }
      return {duration,streams:json.streams,cadence};
    },
    async verifySilentPcm({file,expectedSamples,sampleRate,channels,toleranceSamples,signal,deadlineMs,maxBytes}){
      if(sampleRate!==48000||channels!==2||!Number.isInteger(expectedSamples)||expectedSamples<=0)throw Error('CURVE_PCM_CONTRACT');
      await assertFile(file);
      // f32le enables the worker's finite streaming zero/NaN analysis.
      const result=complete(await worker.execute({kind:'ffmpeg',label:'pcm-analysis',args:['-v','error','-xerror','-i',file,'-t',String(Math.min(120,(expectedSamples+toleranceSamples)/sampleRate+.001)),'-map','0:a:0','-vn','-ac','2','-ar','48000','-f','f32le','pipe:1'],inputs:[input(file)],outputFiles:[],stdoutMode:'pcm-zero',timeoutMs:deadlineMs,maxStdoutBytes:maxBytes*2,signal}));
      const samples=result.bytes/(channels*4);
      if(!Number.isInteger(samples)||Math.abs(samples-expectedSamples)>toleranceSamples)throw Error('CURVE_PCM_DURATION_MISMATCH');
      return {verified:true,allZero:result.pcmZero===true,samples};
    },
    async commit({temporary,final,root}){if(!contained(root,temporary)||!contained(root,final))throw Error('CURVE_COMMIT_ROOT');return worker.commitAbsent(temporary,final);},
    async cleanup({files,root,requireQuiescent}){if(requireQuiescent!==true||files.some(file=>!contained(root,file)))throw Error('CURVE_CLEANUP_ROOT');return worker.cleanupQuiescent(files);},
    quiescent(){const ledger=worker.getLedger();return !ledger.readingFiles?.length&&ledger.jobs.every(j=>!j.pid||j.actualClosed===true);},
  };
}
