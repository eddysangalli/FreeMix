import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile,readdir,stat,unlink} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {DiskReplay} from '../../ferramentas/replay-disco.mjs';
const root=resolve('qa-finalizacao/replay-completo/fixture'),ffmpeg=process.env.FREEMIX_FFMPEG||resolve('runtime/ffmpeg.exe'),ffprobe=process.env.FREEMIX_FFPROBE||resolve('runtime/ffprobe.exe'),checks=[];
await mkdir(root,{recursive:true});
const run=(args,binary=false)=>execFileSync(ffmpeg,['-hide_banner','-v','error','-nostdin',...args],{windowsHide:true,maxBuffer:12*1024*1024,encoding:binary?undefined:'utf8'});
run(['-y','-f','lavfi','-i','testsrc2=size=320x180:rate=30','-f','lavfi','-i','sine=frequency=440:sample_rate=48000','-t','32','-c:v','libx264','-preset','ultrafast','-threads','2','-g','30','-bf','0','-pix_fmt','yuv420p','-c:a','aac','-f','segment','-segment_time','8','-reset_timestamps','1',join(root,'part-%02d.ts')]);
const requests=[];const obs={req:async(type,data)=>{requests.push({type,data});if(type==='GetSceneCollectionList')return {currentSceneCollectionName:'ReplayCompleteQA'};if(type==='GetSceneList')return {currentProgramSceneName:'LIVE',currentPreviewSceneName:'CAM 1',scenes:[{sceneName:'CAM 1'},{sceneName:'CAM 2'}]};if(type==='GetSourceFilter')return {filterEnabled:true,filterSettings:{record_mode:1}};return {};}};
const r=new DiskReplay({root,getObs:()=>obs,namespace:'qa-complete'});r.ffmpeg=ffmpeg;r.ffprobe=ffprobe;r.scope='ReplayCompleteQA';r.file=join(root,'config/obs-studio/plugin_config/qa-complete/state.json');
const files=(await readdir(root)).filter(n=>/^part-\d+\.ts$/.test(n)).sort(),segments=[];let start=0;
for(const name of files){const file=join(root,name),p=await r.probe(file);segments.push({name,file,start,duration:p.duration,frameRate:p.frameRate,closed:true});start+=p.duration;}
r.state.session={id:'complete-qa',dir:root,startedAt:Date.now(),segmented:true,retention:{minutes:30},cams:[{index:1,name:'CAM 1',source:'CAM 1',segments},{index:2,name:'CAM 2',source:'CAM 2',segments:structuredClone(segments)}]};
const timings=[];const preview=async(cursor,from)=>{const started=performance.now(),result=await r.command('history-preview',{sessionId:'complete-qa',cam:'CAM 1',cursor,...(from!==undefined?{from}: {})});timings.push({cursor,from,elapsedMs:performance.now()-started,...result.historyPreview});return result.historyPreview;};
const initial=await preview(2);assert.equal(initial.start,0);assert.equal(initial.end,8);assert(initial.hasAudio);assert.equal(initial.frameRate,'30/1');assert(initial.prepareMs<8000,'Preparation must be faster than playback duration on this fixture');
const own=await r.previewFile(initial.token);assert.equal(own.bytes,(await stat(own.file)).size);
const probe=JSON.parse(execFileSync(ffprobe,['-v','error','-show_packets','-show_entries','packet=stream_index,pts_time,dts_time:stream=index,codec_name,codec_type,width,height','-of','json',own.file],{encoding:'utf8',windowsHide:true,maxBuffer:4*1024*1024}));
assert(probe.streams.some(s=>s.codec_name==='h264'&&s.width===640&&s.height===360));assert(probe.streams.some(s=>s.codec_name==='aac'));
for(const s of probe.streams){const pts=probe.packets.filter(p=>p.stream_index===s.index).map(p=>Number(p.pts_time));assert(pts.every((x,i)=>i===0||x>=pts[i-1]));assert(pts[0]>=0&&pts[0]<.06);}
checks.push('Real fragmented H.264/AAC proxy, monotonic PTS and original 30 fps; bounded 8 seconds');
const cached=await preview(2);assert.equal(cached.token,initial.token);assert(cached.cacheHit);checks.push('Repeated seek reuses immutable cache rather than re-encoding');
const across=await preview(7,7),acrossFile=await r.previewFile(across.token);assert.equal(across.start,7);assert.equal(across.end,15);
const first=(file,at=0)=>run(['-ss',String(at),'-i',file,'-vf','scale=640:360:flags=bilinear','-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1'],true);
const source=first(segments[0].file,7),actual=first(acrossFile.file);assert.equal(source.length,actual.length);const mae=source.reduce((s,v,i)=>s+Math.abs(v-actual[i]),0)/source.length;assert(mae<5,`Frame at historical IN: RGB MAE ${mae}`);checks.push('Cross-segment 7–15 second proxy starts at requested frame (RGB MAE '+mae.toFixed(3)+')');
const audio=run(['-i',acrossFile.file,'-map','0:a:0','-t','2','-ar','48000','-ac','1','-f','f32le','pipe:1'],true),samples=new Float32Array(audio.buffer.slice(audio.byteOffset,audio.byteOffset+audio.byteLength));let energy=0;for(const x of samples)energy+=x*x;const rms=Math.sqrt(energy/samples.length);assert(rms>.07&&rms<.1);checks.push('Decoded preview contains real PCM audio, RMS '+rms.toFixed(5));
// In-flight browser responses hold a lease even while unrelated cache entries expire.
r.preview.maxEntries=0;await r.preview.prune();assert((await stat(own.file)).size>0);assert((await stat(acrossFile.file)).size>0);own.release();own.release();acrossFile.release();await r.preview.prune();await assert.rejects(stat(own.file));checks.push('Cache eviction preserves active HTTP read leases; idempotent release permits bounded cleanup');
r.preview.maxEntries=24;
const a=preview(1),b=preview(10),c=preview(20);const concurrent=await Promise.allSettled([a,b,c]);assert.equal(concurrent[1].status,'rejected');assert.equal(concurrent[2].status,'fulfilled');checks.push('Only one encoder and one pending seek; newest request supersedes older requests during metadata discovery');
await assert.rejects(r.command('history-preview',{sessionId:'old',cam:'CAM 1',cursor:1}),/sessão mudou/);await assert.rejects(r.command('history-preview',{sessionId:'complete-qa',cam:'CAM 1',cursor:200}),/histórico/);await assert.rejects(r.previewFile('../file'),/Token/);checks.push('Old sessions, invalid positions and arbitrary file tokens are rejected');
assert(!requests.some(x=>['SetSourceFilterSettings','SetCurrentProgramScene','TriggerMediaInputAction'].includes(x.type)));checks.push('History playback never stops REC, changes Programme or controls A/B/C/D players');
const receipt={status:'PASS',at:new Date().toISOString(),operatorTouched:false,nativeTransportMocked:true,proxyMediaReal:true,checks,timings,frameMAE:mae,audioRMS:rms,sourceDuration:start};await writeFile('qa-finalizacao/replay-completo/resultado-real.json',JSON.stringify(receipt,null,2));console.log(JSON.stringify(receipt));
export {r,root};
