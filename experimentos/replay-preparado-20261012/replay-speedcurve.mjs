// Prepared effects only: this module never changes a live decoder's speed.
// Runtime ownership, tool hashes, PID/CIM, cooperative q and byte caps are supplied
// by the root-owned finite executor. No fallback to PATH or process.env exists.
import {randomUUID} from 'node:crypto';
import {resolve, join} from 'node:path';

export const SPEED_CURVE_LIMITS = Object.freeze({minSpeed:.25,maxSpeed:4,maxPoints:12,
  maxSourceSeconds:30,maxOutputSeconds:120,maxFrames:7200,maxWidth:1920,maxHeight:1080,
  encodeMs:90000,verifyMs:90000,maxFileBytes:100*1024*1024,maxTextBytes:2*1024*1024});
export const SPEED_CURVE_PRESETS = Object.freeze({
  'fast-slow-fast': [{position:0,speed:2},{position:.4,speed:.5},{position:.65,speed:.5},{position:1,speed:2}],
  'fast-slow': [{position:0,speed:2},{position:1,speed:.5}],
});
const finite=(n,label)=>{if(typeof n!=='number'||!Number.isFinite(n))throw Error(label);return n;};
const decimal=n=>Number(n.toPrecision(15)).toString();
function rateOf(rate){
  if(!rate||!Number.isInteger(rate.num)||!Number.isInteger(rate.den)||rate.num<=0||rate.den<=0||rate.num>240000||rate.den>10000)throw Error('CURVE_FRAME_RATE');
  const value=rate.num/rate.den;if(value<1||value>60)throw Error('CURVE_FRAME_RATE');return value;
}
function area(segment,x){const d=Math.max(0,Math.min(segment.length,x));return Math.abs(segment.slope)<1e-12?d/segment.speed:Math.log1p(segment.slope*d/segment.speed)/segment.slope;}

export function buildSpeedCurvePlan({durationSeconds,frameRate,points,audioMode,audioAcknowledged}={}) {
  const duration=finite(durationSeconds,'CURVE_DURATION');const fps=rateOf(frameRate);
  if(duration<2/fps||duration>SPEED_CURVE_LIMITS.maxSourceSeconds)throw Error('CURVE_DURATION');
  // Variable speed audio is deliberately unavailable until a real pitch-preserving
  // continuous warp is qualified. Silence requires an explicit human selection.
  if(audioMode!=='silence'||audioAcknowledged!==true)throw Error('CURVE_AUDIO_REQUIRES_EXPLICIT_SILENCE');
  if(!Array.isArray(points)||points.length<2||points.length>SPEED_CURVE_LIMITS.maxPoints)throw Error('CURVE_POINTS');
  const normalized=points.map(p=>{
    const position=finite(p?.position,'CURVE_POSITION'),speed=finite(p?.speed,'CURVE_SPEED');
    if(position<0||position>1||speed<SPEED_CURVE_LIMITS.minSpeed||speed>SPEED_CURVE_LIMITS.maxSpeed)throw Error('CURVE_POINT_RANGE');
    return {position,speed};
  });
  if(normalized[0].position!==0||normalized.at(-1).position!==1)throw Error('CURVE_ENDPOINTS');
  let output=0;const segments=[];
  for(let i=1;i<normalized.length;i++){
    const a=normalized[i-1],b=normalized[i],length=(b.position-a.position)*duration;
    if(length<1/fps-1e-9)throw Error('CURVE_POINTS_MUST_BE_ORDERED_AND_ONE_SOURCE_FRAME_APART');
    const s={sourceStart:a.position*duration,sourceEnd:b.position*duration,length,speed:a.speed,endSpeed:b.speed,slope:(b.speed-a.speed)/length,outputStart:output};
    output+=area(s,length);s.outputEnd=output;segments.push(s);
  }
  const outputFrames=Math.ceil(output*fps-1e-9),presentationDurationSeconds=outputFrames/fps;
  if(presentationDurationSeconds>SPEED_CURVE_LIMITS.maxOutputSeconds||outputFrames>SPEED_CURVE_LIMITS.maxFrames)throw Error('CURVE_OUTPUT_BUDGET');
  const sourceToOutputSeconds=t=>{
    finite(t,'CURVE_SOURCE_TIME');if(t<0||t>duration)throw Error('CURVE_SOURCE_TIME_RANGE');
    const s=segments.find(s=>t<=s.sourceEnd)||segments.at(-1);return s.outputStart+area(s,t-s.sourceStart);
  };
  const outputToSourceSeconds=t=>{
    finite(t,'CURVE_OUTPUT_TIME');if(t<0||t>presentationDurationSeconds+1e-9)throw Error('CURVE_OUTPUT_TIME_RANGE');
    if(t>=output)return duration;
    const s=segments.find(s=>t<=s.outputEnd)||segments.at(-1),dt=t-s.outputStart;
    const x=Math.abs(s.slope)<1e-12?dt*s.speed:s.speed*Math.expm1(s.slope*dt)/s.slope;
    return Math.max(s.sourceStart,Math.min(s.sourceEnd,s.sourceStart+x));
  };
  // Speed is linearly interpolated in SOURCE time. Presentation time is exactly
  // integral dx / speed(x), rather than a mean-speed approximation.
  let expr=decimal(output);
  for(let i=segments.length-1;i>=0;i--){const s=segments[i],x=`max(0,min(${decimal(s.length)},T-${decimal(s.sourceStart)}))`;
    const integral=Math.abs(s.slope)<1e-12?`(${x})/${decimal(s.speed)}`:`log(1+${decimal(s.slope)}*(${x})/${decimal(s.speed)})/${decimal(s.slope)}`;
    expr=`if(lt(T,${decimal(s.sourceEnd)}),${decimal(s.outputStart)}+(${integral}),${expr})`;
  }
  return {version:1,interpolation:'linear-in-source-time',durationSeconds:duration,frameRate:{...frameRate},fps,
    points:normalized,segments,idealDurationSeconds:output,presentationDurationSeconds,outputFrames,
    // fps repeats/drops actual source frames; no optical-flow invented frames.
    setptsExpression:`(${expr})/TB`,tailPadFrames:Math.ceil(fps/(fps*SPEED_CURVE_LIMITS.minSpeed))+2,
    audio:{policy:'explicit-silent-stereo',sampleRate:48000,channels:2,pitchPreservation:false},
    sourceToOutputSeconds,outputToSourceSeconds};
}

export function speedCurveFilter(plan,{startSeconds=0}={}) {
  finite(startSeconds,'CURVE_START');if(startSeconds<0||startSeconds>86400)throw Error('CURVE_START');
  const end=startSeconds+plan.durationSeconds,rate=`${plan.frameRate.num}/${plan.frameRate.den}`;
  return `trim=start=${decimal(startSeconds)}:end=${decimal(end)},setpts=PTS-STARTPTS,settb=AVTB,setpts='${plan.setptsExpression}',fps=${rate}:start_time=0:round=near,tpad=stop_mode=clone:stop=${plan.tailPadFrames},trim=end_frame=${plan.outputFrames},setpts=N/((${rate})*TB)`;
}

function decodeRows(text){
  if(typeof text!=='string')throw Error('CURVE_DECODE_TEXT');
  const rows=text.split(/\r?\n/).filter(x=>x&&!x.startsWith('#')).map(x=>x.split(',').map(x=>x.trim()));
  if(rows.some(r=>r.length!==6||!/^-?\d+$/.test(r[2])||!/^\d+$/.test(r[3])||!/^\d+$/.test(r[4])||! /^[0-9a-f]{32}$/i.test(r[5])))throw Error('CURVE_DECODE_ROWS');return rows;
}
function signature(identity){return JSON.stringify(identity);}

// Required adapter:
// assertFile(file,{root,maxBytes}) -> stable content identity, rejecting any
// parent reparse point/link and nlink!=1; assertOutput(file,{root}) -> absent and
// no-link checked parent; probe({file,deadlineMs,signal}) -> full counted-video
// metadata; execute({...}) -> waits actual owned close, throws on deadline or
// decode error, pinned tools only, byte caps DURING writes, q without force;
// commit({temporary,final,root}) -> rename absent-only, recheck parents; cleanup
// only after actual quiescence. verifySilentPcm does finite streaming audio decode.
export async function renderPreparedSpeedCurve({adapter,sourceFile,sourceRoot,outputRoot,startSeconds=0,
  durationSeconds,frameRate,points,audioMode,audioAcknowledged,scopeToken,epochValid,signal,onProgress=()=>{}}={}) {
  const required=['assertFile','assertOutput','probe','execute','commit','cleanup','verifySilentPcm'];
  if(!adapter||required.some(k=>typeof adapter[k]!=='function')||typeof epochValid!=='function'||!scopeToken)throw Error('CURVE_OWNED_ADAPTER_REQUIRED');
  const plan=buildSpeedCurvePlan({durationSeconds,frameRate,points,audioMode,audioAcknowledged});
  const source=resolve(sourceFile),root=resolve(outputRoot),id=randomUUID(),temporary=join(root,`${id}.part.mov`),final=join(root,`${id}.mov`);
  const check=()=>{if(signal?.aborted||epochValid(scopeToken)!==true)throw Error('CURVE_CANCELLED_OR_SCOPE_CHANGED');};
  check();const identity=await adapter.assertFile(source,{root:resolve(sourceRoot),maxBytes:SPEED_CURVE_LIMITS.maxFileBytes});
  await adapter.assertOutput(temporary,{root});await adapter.assertOutput(final,{root});check();
  const original=await adapter.probe({file:source,deadlineMs:10000,signal});check();
  const video=original?.streams?.find(s=>s.codec_type==='video');
  if(!video||!Number.isInteger(video.width)||!Number.isInteger(video.height)||video.width<=0||video.height<=0||video.width>SPEED_CURVE_LIMITS.maxWidth||video.height>SPEED_CURVE_LIMITS.maxHeight||video.width%2||video.height%2||video.field_order!=='progressive')throw Error('CURVE_PROGRESSIVE_VIDEO_REQUIRED');
  // Require a saved CFR clip already qualified by its decoded cadence. A frame
  // rate label alone must not silently certify a variable-frame-rate source.
  if(original.cadence?.status!=='cfr'||original.cadence.entireFile!==true||original.cadence.durationEvidence!=='full-decoded-pts-plus-one-cfr-frame'||!Number.isFinite(original.cadence.measuredDurationSeconds)||!Number.isFinite(Number(original.duration))||!Number.isFinite(Number(video.duration))||startSeconds+plan.durationSeconds>Math.min(original.cadence.measuredDurationSeconds,Number(video.duration))+1e-6)throw Error('CURVE_COMPLETE_CFR_SOURCE_REQUIRED');
  const actualRate=video.avg_frame_rate?.split('/').map(Number);
  if(!actualRate||actualRate.length!==2||actualRate[0]*frameRate.den!==frameRate.num*actualRate[1])throw Error('CURVE_SOURCE_RATE_MISMATCH');
  const filter=speedCurveFilter(plan,{startSeconds});let committed=false;
  try{
    onProgress({state:'preparing',id,audio:plan.audio});
    await adapter.execute({kind:'ffmpeg',args:['-hide_banner','-v','error','-xerror','-threads','2','-i',source,'-f','lavfi','-i','anullsrc=channel_layout=stereo:sample_rate=48000','-filter_threads','2','-vf',filter,'-map','0:v:0','-map','1:a:0','-c:v','libx264','-preset','ultrafast','-crf','18','-g','1','-bf','0','-pix_fmt','yuv420p','-threads','2','-c:a','pcm_s16le','-t',decimal(plan.presentationDurationSeconds),'-f','mov','-n',temporary],deadlineMs:SPEED_CURVE_LIMITS.encodeMs,signal,maxStdoutBytes:65536,outputFiles:[{file:temporary,maxBytes:SPEED_CURVE_LIMITS.maxFileBytes}],maxTotalBytes:SPEED_CURVE_LIMITS.maxFileBytes});check();
    onProgress({state:'verifying',id});
    await adapter.assertFile(temporary,{root,maxBytes:SPEED_CURVE_LIMITS.maxFileBytes});
    const result=await adapter.probe({file:temporary,deadlineMs:10000,signal,countFrames:true});check();
    const v=result?.streams?.find(s=>s.codec_type==='video'),a=result?.streams?.find(s=>s.codec_type==='audio');
    const resultRate=String(v?.avg_frame_rate||'').split('/').map(Number);
    if(!v||Number(v.nb_read_frames)!==plan.outputFrames||v.width!==video.width||v.height!==video.height||resultRate.length!==2||resultRate[0]*frameRate.den!==frameRate.num*resultRate[1]||!a||a.codec_name!=='pcm_s16le'||a.channels!==2||Number(a.sample_rate)!==48000||!Number.isFinite(Number(result.duration))||Math.abs(Number(result.duration)-plan.presentationDurationSeconds)>1/plan.fps+.002)throw Error('CURVE_OUTPUT_METADATA_MISMATCH');
    const decoded=await adapter.execute({kind:'ffmpeg',args:['-hide_banner','-v','error','-xerror','-threads','2','-i',temporary,'-map','0:v:0','-an','-frames:v',String(plan.outputFrames),'-f','framemd5','pipe:1'],deadlineMs:SPEED_CURVE_LIMITS.verifyMs,signal,maxStdoutBytes:SPEED_CURVE_LIMITS.maxTextBytes,outputFiles:[]});check();
    const rows=decodeRows(decoded.stdout);
    if(rows.length!==plan.outputFrames||rows.some((r,i)=>Number(r[2])!==i||Number(r[3])!==1))throw Error('CURVE_FULL_DECODE_CADENCE_MISMATCH');
    const pcm=await adapter.verifySilentPcm({file:temporary,expectedSamples:Math.round(plan.presentationDurationSeconds*48000),sampleRate:48000,channels:2,toleranceSamples:2,signal,deadlineMs:SPEED_CURVE_LIMITS.verifyMs,maxBytes:Math.ceil(plan.presentationDurationSeconds*48000*4)+16});check();
    if(pcm?.allZero!==true||pcm?.verified!==true)throw Error('CURVE_SILENT_PCM_NOT_VERIFIED');
    if(signature(await adapter.assertFile(source,{root:resolve(sourceRoot),maxBytes:SPEED_CURVE_LIMITS.maxFileBytes}))!==signature(identity))throw Error('CURVE_SOURCE_CHANGED');
    await adapter.commit({temporary,final,root});committed=true;check();
    const effect={kind:'speed-curve',version:1,sourceFile:source,sourceIdentity:identity,sourceRange:{start:startSeconds,end:startSeconds+plan.durationSeconds},points:plan.points,interpolation:plan.interpolation,segments:plan.segments,idealDurationSeconds:plan.idealDurationSeconds,presentationDurationSeconds:plan.presentationDurationSeconds,audio:plan.audio,codec:{video:'h264',crf:18,pixelFormat:'yuv420p',lossless:false,audio:'pcm_s16le'},decodedVerified:true};
    const artifact={id,file:final,duration:plan.presentationDurationSeconds,frameRate:plan.frameRate,playbackSpeed:100,preparedEffect:effect,decodedVerified:true};
    onProgress({state:'ready',id,artifact});return artifact;
  }catch(error){onProgress({state:signal?.aborted?'cancelled':'error',id,message:error.message});await adapter.cleanup({files:[committed?final:temporary],root,requireQuiescent:true});throw error;}
}
