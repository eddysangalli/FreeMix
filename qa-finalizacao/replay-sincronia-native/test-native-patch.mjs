import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,cp} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {root,child,exit} from './bootstrap.mjs';
import {qa,screenshot,clipFrame,clipAudio,run} from './media-tools.mjs';
import {connect,sleep} from '../../ferramentas/obsws.mjs';
import {rawPcmAnalysis} from './audio-pcm-analysis.mjs';
import {DiskReplay} from '../../ferramentas/replay-disco.mjs';
const result={status:'RUNNING',at:new Date().toISOString(),root,pid:child.pid,operatorTouched:false,physicalGenlock:false,programTouched:false,samples:[]};let obs,replay,error;
const vendor=async(type,data={})=>(await obs.req('CallVendorRequest',{vendorName:'freemix',requestType:type,requestData:data})).responseData;
const pcmCapture=async(player,action)=>(await obs.req('CallVendorRequest',{vendorName:'qa-replay-pcm',requestType:'capture',requestData:{player,action}})).responseData;
async function pair(label){const shot=await screenshot(obs,'QA Playback Pair',label),rgb=run(['-i',shot.file,'-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1'],true);const counters=[0,320].map(offset=>{let n=0;for(let i=0;i<16;i++){const at=(20*640+offset+i*20+10)*3;if((rgb[at]+rgb[at+1]+rgb[at+2])/3>128)n+=2**i;}return n;});return {file:shot.file,counters,differenceFrames:Math.abs(counters[0]-counters[1])};}
try{
 for(let n=0;n<180;n++){try{obs=await connect({root});break;}catch{await sleep(250);}}assert(obs);let id;for(let n=0;n<180;n++){try{id=await vendor('get_interface');break;}catch{await sleep(250);}}assert.equal(id.pid,child.pid);assert.equal(resolve(id.executable).toLowerCase(),resolve(root,'bin/64bit/FreeMix.exe').toLowerCase());
 const dir=join(root,'gravacoes');await mkdir(dir,{recursive:true});await obs.req('SetRecordDirectory',{recordDirectory:dir});await obs.req('SetStudioModeEnabled',{studioModeEnabled:true});assert.equal(resolve((await obs.req('GetRecordDirectory')).recordDirectory).toLowerCase(),resolve(dir).toLowerCase());
 const prior=JSON.parse(await readFile(join(qa,'resultado-composite.json'),'utf8')),media=join(root,'qa-media');await mkdir(media,{recursive:true});const clips=[];for(const [i,c]of prior.clips.entries()){const file=join(media,'cam-'+i+'.mp4');await cp(c.file,file);clips.push({...c,file});}
 const cams=clips.map(c=>c.cam);for(const c of clips){await obs.req('CreateScene',{sceneName:c.cam});await obs.req('CreateInput',{sceneName:c.cam,inputName:c.cam+' Media',inputKind:'ffmpeg_source',inputSettings:{local_file:c.file,is_local_file:true,looping:true,restart_on_activate:false},sceneItemEnabled:true});}
 process.env.FREEMIX_REPLAY_ENCODER='obs_x264';replay=new DiskReplay({root,getObs:()=>obs,namespace:'qa-final-sync',filter:'QA Final Sync REC'});await replay.command('start',{cams});assert(resolve(replay.state.session.dir).toLowerCase().startsWith(resolve(root).toLowerCase()+'\\'));const program=(await obs.req('GetCurrentProgramScene')).currentProgramSceneName;assert.equal(program,'QA');
 const event={id:randomUUID(),name:'QA reused native real32s clips',createdAt:Date.now(),dur:32,clips};replay.state.events.push(event);await replay.save();for(const [i,p]of ['A','B'].entries())await replay.command('load',{player:p,eventId:event.id,cam:cams[i]});
 const offset=clipFrame(clips[0].file,0).value-clipFrame(clips[1].file,0).value;await replay.command('camera-options',{cam:cams[1],options:{offsetFrames:offset}});result.offsetFrames=offset;
 await obs.req('CreateScene',{sceneName:'QA Playback Pair'});for(const [i,p]of ['A','B'].entries()){const item=await obs.req('CreateSceneItem',{sceneName:'QA Playback Pair',sourceName:'Replay Player '+p});await obs.req('SetSceneItemTransform',{sceneName:'QA Playback Pair',sceneItemId:item.sceneItemId,sceneItemTransform:{positionX:i*320,positionY:0,scaleX:.5,scaleY:.5}});if(!process.env.FREEMIX_QA_HOLD_VIEW)await obs.req('CreateSourceFilter',{sourceName:'Replay Player '+p,filterName:'QA Pair Render',filterKind:'source_record_filter',filterSettings:{path:join(root,'qa-playback-render'),filename_formatting:p,record_mode:1,rec_format:'mpegts',encoder:'obs_x264',crf:28}});}
 if(process.env.FREEMIX_QA_HOLD_VIEW){result.holdView=await pcmCapture('A','hold-view');assert.equal(result.holdView.success,true);}
 await sleep(1000);await replay.command('link',{enabled:true});const h=(await replay.command('history')).history;result.historyBefore=h;
 for(const speed of [30,50,100]){
  await replay.command('speed',{speed});await replay.command('seek',{player:'A',cursor:1000});await replay.command('transport',{player:'A',command:'PLAY'});
  for(let n=0;n<10;n++){
   await sleep(700);let injected=null;if(n===2||n===6){const a=await obs.req('GetMediaInputStatus',{inputName:'Replay Player A'});const target=Math.floor(a.mediaCursor+offset*1000/30+200);await obs.req('SetMediaInputCursor',{inputName:'Replay Player B',mediaCursor:target});await sleep(150);injected={target,pre:await Promise.all(['A','B'].map(p=>obs.req('GetMediaInputStatus',{inputName:'Replay Player '+p})))};}
   const before=performance.now(),s=await replay.command('status'),elapsedMs=performance.now()-before;const displayed=await pair('native-patch-'+speed+'-'+n);const sample={speed,n,injected,elapsedMs,sync:s.sync,displayed};result.samples.push(sample);if(!s.sync.confirmed||s.sync.differenceFrames>1||displayed.differenceFrames>1)(result.visualFailures??=[]).push(sample);
  }
  if(speed===30&&Number(process.env.FREEMIX_QA_ENDURANCE_SECONDS)>0){
   await replay.command('transport',{player:'A',command:'PAUSE'});await replay.command('seek',{player:'A',cursor:1000});await replay.command('transport',{player:'A',command:'PLAY'});
   await pcmCapture('A','start');const file=join(root,'qa-pcm','A.f32');
   const seconds=Number(process.env.FREEMIX_QA_ENDURANCE_SECONDS),started=performance.now();result.endurance={seconds,speed:30,inducedDrift:false,file,samples:[]};
   for(let n=0;performance.now()-started<seconds*1000;n++){await sleep(1000);const at=performance.now();await replay.align(false);const sample={n,atMs:performance.now()-started,elapsedMs:performance.now()-at,sync:structuredClone(replay.state.sync),displayed:await pair('endurance-'+n)};result.endurance.samples.push(sample);if(!sample.sync.confirmed||sample.sync.differenceFrames>1||sample.displayed.differenceFrames>1)(result.visualFailures??=[]).push(sample);}
   result.endurance.capture=await pcmCapture('A','stop');assert(!result.endurance.capture.error);assert(!result.endurance.capture.overflow);result.endurance.pcm=rawPcmAnalysis(file,result.endurance.capture.sampleRate,132);result.endurance.samplesFile=join(root,'qa-pcm','continuous.f32');await cp(file,result.endurance.samplesFile);await cp(result.endurance.capture.packetsFile,join(root,'qa-pcm','continuous.csv'));assert(result.endurance.pcm.tone.power>.001);

  }
  await replay.command('transport',{player:'A',command:'PAUSE'});
 }
 result.offProgramAudio=await Promise.all(['A','B'].map(async p=>({player:p,...await obs.req('GetInputMute',{inputName:'Replay Player '+p})})));assert(result.offProgramAudio.every(x=>x.inputMuted));result.originalIndependentAudio=clips.map(c=>({cam:c.cam,...clipAudio(c.file)}));
 await replay.command('link',{enabled:false});result.playbackAudio=[];
 for(const rate of [30,50,100]){await replay.command('speed',{speed:rate});for(const p of ['A','B']){
  await replay.command('seek',{player:p,cursor:1000});await replay.command('transport',{player:p,command:'PLAY'});const started=await pcmCapture(p,'start');assert(!started.error);await sleep(1800);const capture=await pcmCapture(p,'stop');assert(!capture.error);assert(!capture.overflow);const expected=(p==='A'?440:880)*rate/100,pcm=rawPcmAnalysis(capture.file,capture.sampleRate,expected),file=join(root,'qa-pcm',p+'-'+rate+'.f32');await cp(capture.file,file);await cp(capture.packetsFile,join(root,'qa-pcm',p+'-'+rate+'.csv'));await replay.command('transport',{player:p,command:'PAUSE'});const muted=await Promise.all(['A','B'].map(p=>obs.req('GetInputMute',{inputName:'Replay Player '+p})));result.playbackAudio.push({player:p,speed:rate,file,capture,pcm,muted,programStillQA:true});assert(pcm.seconds>1.5);assert(pcm.tone.power>.001);assert(Math.abs(pcm.tone.frequency-expected)<=2);assert(muted.every(m=>m.inputMuted));
 }} const rates=join(qa,'rates');for(const [name,file]of [['NTSC',join(qa,'ntsc-counter.mkv')],['VFR',join(qa,'vfr-counter.mkv')]]){const own=join(media,name+'.mkv');await cp(file,own);event.clips.push({cam:name,file:own,duration:10,start:0,end:10});}await replay.save();
 await replay.command('load',{player:'C',eventId:event.id,cam:'NTSC'});await replay.command('frame',{player:'C',delta:31});result.ntsc={state:replay.state.players.C,frame:replay.state.frame,status:await obs.req('GetMediaInputStatus',{inputName:'Replay Player C'})};result.ntsc.displayed=await screenshot(obs,'Replay Player C','native-patch-ntsc31');result.ntsc.expected=clipFrame(event.clips.find(c=>c.cam==='NTSC').file,31);assert.equal(result.ntsc.displayed.value,result.ntsc.expected.value);assert.equal(result.ntsc.displayed.value,31);assert.equal(result.ntsc.frame.targets.C.frame,31);assert(Math.abs(result.ntsc.status.mediaCursor-1034)<3);
 await replay.command('load',{player:'D',eventId:event.id,cam:'VFR'});assert(replay.state.players.D.variableFrameRate);await assert.rejects(replay.command('frame',{player:'D',delta:1}),/taxa constante/);await replay.command('seek',{player:'D',cursor:3000});result.vfr={state:replay.state.players.D,status:await obs.req('GetMediaInputStatus',{inputName:'Replay Player D'})};result.vfr.displayed=await screenshot(obs,'Replay Player D','native-patch-vfr3000');assert.equal(result.vfr.displayed.value,90);assert(Math.abs(result.vfr.status.mediaCursor-3000)<=100);
 await replay.command('link',{enabled:true});await replay.command('seek',{player:'C',cursor:2000});result.mixedSync=(await replay.command('status')).sync;assert.equal(result.mixedSync.mode,'time');assert(result.mixedSync.confirmed);
 assert(replay.state.rec);assert.equal((await obs.req('GetCurrentProgramScene')).currentProgramSceneName,program);result.historyAfter=(await replay.command('history')).history;assert(result.historyAfter.end>h.end+15);assert.equal(resolve((await obs.req('GetRecordDirectory')).recordDirectory).toLowerCase(),resolve(dir).toLowerCase());assert.equal(result.visualFailures?.length||0,0,'Visual sync failures preserved in visualFailures');result.status='PASS';
}catch(e){error=e;result.status='FAIL';result.error=e.stack;}
finally{
 if(obs)for(const p of ['A','B'])await pcmCapture(p,'stop').catch(()=>{});
 if(replay?.state.rec)await replay.command('stop').catch(e=>{result.status='FAIL';result.cleanupError=e.message;});
 if(obs){
  if(process.env.FREEMIX_QA_HOLD_VIEW){result.holdViewRelease=await pcmCapture('A','release-view').catch(e=>({error:e.message}));await sleep(250);result.sourceActiveAfterRelease=await Promise.all(['A','B'].map(p=>obs.req('GetSourceActive',{sourceName:'Replay Player '+p})));}
  for(const p of ['A','B']){await obs.req('SetSourceFilterSettings',{sourceName:'Replay Player '+p,filterName:'QA Pair Render',filterSettings:{record_mode:0}}).catch(()=>{});await obs.req('SetSourceFilterEnabled',{sourceName:'Replay Player '+p,filterName:'QA Pair Render',filterEnabled:false}).catch(()=>{});}result.filtersWhileStopping=await Promise.all(['A','B'].map(p=>obs.req('GetSourceFilter',{sourceName:'Replay Player '+p,filterName:'QA Pair Render'}).catch(e=>({error:e.message}))));
  const started=Date.now();for(let n=0;n<80;n++){const outputs=await obs.req('GetOutputList').catch(e=>({error:e.message}));result.outputsWhileDraining=outputs;if(outputs.error||outputs.outputs&&!outputs.outputs.some(o=>o.outputActive))break;await sleep(250);}result.drainMs=Date.now()-started;
  if(result.outputsWhileDraining?.outputs?.some(o=>o.outputActive)){result.status='FAIL';result.cleanupError='Own outputs remained active before removing QA filters';}
  else{for(const p of ['A','B'])await obs.req('SetSourceFilterEnabled',{sourceName:'Replay Player '+p,filterName:'QA Pair Render',filterEnabled:false}).catch(()=>{});await sleep(500);for(const p of ['A','B'])await obs.req('RemoveSourceFilter',{sourceName:'Replay Player '+p,filterName:'QA Pair Render'}).catch(()=>{});}
 }
 await replay?.dispose();
 if(obs){const at=Date.now();result.outputsBeforeClose=await obs.req('GetOutputList').catch(e=>({error:e.message}));result.shutdownResponse=await vendor('shutdown_idle',{qaClose:true}).catch(e=>({error:e.message}));result.exit=await Promise.race([exit,sleep(12000).then(()=>null)]);result.shutdownMs=Date.now()-at;result.activeOutputsBeforeClose=result.outputsBeforeClose.outputs?.filter(o=>o.outputActive).map(o=>o.outputName)||[];if(result.activeOutputsBeforeClose.length||result.shutdownResponse?.success!==true||!result.exit||result.exit.code!==0)result.status='FAIL';obs.close();}
 if(child.exitCode===null){try{const symbols=resolve('qa-finalizacao/native-build-frozen-fb98b14/bin/64bit')+';'+resolve('qa-finalizacao/native-build-frozen-fb98b14/obs-plugins/64bit')+';'+resolve('archived/limpeza-demo-20261009/qa-portatil/source-record-private/build/RelWithDebInfo');const stack=execFileSync(join(qa,'qa-native-stacks.exe'),[String(child.pid),join(root,'bin/64bit/FreeMix.exe'),symbols],{windowsHide:true,timeout:15000,maxBuffer:1024*1024});await writeFile(join(qa,'stacks-full-stop-first.txt'),stack);result.stackFile=join(qa,'stacks-full-stop-first.txt');}catch(e){result.stackError=e.message;}result.ownForcedCleanup=true;child.kill();await Promise.race([exit,sleep(1500)]);}
 await writeFile(join(qa,'resultado-native-patch.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({status:result.status,error:result.error,samples:result.samples.length,root,pid:child.pid,shutdownMs:result.shutdownMs}));
}
if(error||result.status!=='PASS')process.exitCode=1;





