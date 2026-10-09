import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {DiskReplay} from '../../ferramentas/replay-disco.mjs';
import {frameTargets,seekTargets} from '../../ferramentas/replay-sincronia.mjs';
const qa=resolve('qa-finalizacao/replay-sincronia-native/rates');await mkdir(qa,{recursive:true});
const ffmpeg=resolve('obs-vmix/runtime/ffmpeg.exe'),ffprobe=resolve('obs-vmix/runtime/ffprobe.exe');
const run=args=>execFileSync(ffmpeg,['-hide_banner','-v','error','-nostdin','-threads','1',...args],{windowsHide:true});
const ntsc=join(qa,'ntsc.mkv'),vfr=join(qa,'vfr.mkv');
run(['-y','-f','lavfi','-i','testsrc2=size=320x180:rate=30000/1001:duration=10','-c:v','libx264','-preset','ultrafast','-threads','1','-g','1',ntsc]);
run(['-y','-f','lavfi','-i','testsrc2=size=320x180:rate=30:duration=10','-vf','select=not(mod(n\\,2))+not(mod(n\\,5))','-fps_mode','vfr','-c:v','libx264','-preset','ultrafast','-threads','1','-g','1',vfr]);
const replay=new DiskReplay({root:qa,getObs:()=>null});replay.ffprobe=ffprobe;
const metadata={ntsc:await replay.probe(ntsc,true),vfr:await replay.probe(vfr,true)};
const timestamps=file=>JSON.parse(execFileSync(ffprobe,['-v','error','-select_streams','v:0','-show_entries','frame=best_effort_timestamp_time','-show_frames','-of','json',file],{encoding:'utf8',windowsHide:true,maxBuffer:4*1024*1024})).frames.map(x=>Number(x.best_effort_timestamp_time));
const pts={ntsc:timestamps(ntsc),vfr:timestamps(vfr)};
const deltas=p=>[...new Set(p.slice(1).map((x,i)=>Math.round((x-p[i])*1000)))];
await writeFile(join(qa,'resultado-after-fix-metadata.json'),JSON.stringify({status:metadata.vfr.variableFrameRate?'PASS':'FAIL',failure:'Metadata avg_frame_rate/r_frame_rate can both report30 while actual VFR intervals differ',metadata,actualPtsDeltasMs:{ntsc:deltas(pts.ntsc),vfr:deltas(pts.vfr)}},null,2));assert(metadata.vfr.variableFrameRate,'Irregular frame PTS must be detected');assert(!metadata.ntsc.variableFrameRate);
const p={A:{...metadata.ntsc,duration:10,offsetFrames:0},B:{...metadata.ntsc,duration:10,offsetFrames:3}};
const plan=frameTargets(p,'A',1000,1);assert.equal(plan.targets.A.frame,31);assert.equal(plan.targets.A.cursor,1034);assert.equal(plan.targets.B.cursor,1134);
assert.throws(()=>frameTargets({A:metadata.vfr},'A',1000,1),/taxa constante/);
const mixed=seekTargets({A:metadata.ntsc,B:metadata.vfr},'A',1000);assert.equal(mixed.mode,'time');
const result={status:'PASS',metadata,actualPtsDeltasMs:{ntsc:deltas(pts.ntsc),vfr:deltas(pts.vfr)},rationalFrameTargets:plan,mixedSeek:mixed,nativeTest:false};await writeFile(join(qa,'resultado.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));await replay.dispose();


