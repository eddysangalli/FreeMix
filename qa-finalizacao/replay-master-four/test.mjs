import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {spawn} from 'node:child_process';
import {randomUUID,createHash} from 'node:crypto';
import {connect,sleep} from '../../ferramentas/obsws.mjs';
import {DiskReplay} from '../../ferramentas/replay-disco.mjs';
const qa=import.meta.dirname,p=JSON.parse(await readFile(join(qa,'prepared.json'))),clips=JSON.parse(await readFile(join(qa,'media.json'))),players=['A','B','C','D'];
for(const [file,pin]of Object.entries(p.pins))assert.equal(createHash('sha256').update(await readFile(join(p.root,file))).digest('hex'),pin);
assert.equal(createHash('sha256').update(await readFile(join(p.root,'obs-plugins/64bit/qa-master-four.dll'))).digest('hex'),p.probePin);
const child=spawn(join(p.root,'bin/64bit/FreeMix.exe'),['--portable','--multi','--disable-updater','--minimize-to-tray','--profile','QA','--collection','QA'],{cwd:join(p.root,'bin/64bit'),env:{...process.env,NDI_RUNTIME_DIR_V6:join(p.root,'runtime/ndi-v6'),FREEMIX_QA_MASTER_DIRECTORY:join(p.root,'qa-master')},windowsHide:true,stdio:'ignore'});
const exit=new Promise(r=>child.once('exit',(code,signal)=>r({code,signal}))),result={status:'RUNNING',at:new Date().toISOString(),root:p.root,pid:child.pid,pins:p.pins,probePin:p.probePin,operatorTouched:false,hardwareAudio:false,sourceRecordUsed:false,segments:[],marks:[]};
let obs,replay,error,captured=false;
const vendor=async(type,data={})=>(await obs.req('CallVendorRequest',{vendorName:'freemix',requestType:type,requestData:data})).responseData;
const probe=async action=>(await obs.req('CallVendorRequest',{vendorName:'qa-master-four',requestType:'capture',requestData:{action}})).responseData;
async function segment(label,desired,action){await action();await sleep(650);const start=await probe('mark');await sleep(2250);const end=await probe('mark');result.segments.push({label,desired,startNs:Number(start.wallNs),endNs:Number(end.wallNs),muted:await Promise.all(players.map(async id=>({player:id,...await obs.req('GetInputMute',{inputName:'Replay Player '+id})}))),program:(await obs.req('GetCurrentProgramScene')).currentProgramSceneName});}
async function choose(id){await obs.req('SetCurrentProgramScene',{sceneName:id?'REPLAY '+id:'QA'});await replay.applyPlayerAudio();}
try{
 for(let n=0;n<200;n++){try{obs=await connect({root:p.root});const ready=await vendor('get_interface');if(ready.pid===child.pid)break;obs.close();obs=null;}catch{}await sleep(250);}assert(obs,'Native21 readiness');
 await obs.req('SetStudioModeEnabled',{studioModeEnabled:true});
 replay=new DiskReplay({root:p.root,getObs:()=>obs,namespace:'qa-master-four'});await replay.scopeState();replay.state.speed=100;
 const event={id:randomUUID(),name:'Four private synthetic tones',createdAt:Date.now(),dur:60,clips};replay.state.events.push(event);await replay.save();
 for(const [i,id]of players.entries()){
  await obs.req('CreateScene',{sceneName:clips[i].cam});await obs.req('CreateInput',{sceneName:clips[i].cam,inputName:clips[i].cam+' Original',inputKind:'ffmpeg_source',inputSettings:{local_file:clips[i].file,is_local_file:true,looping:true,restart_on_activate:false,close_when_inactive:false},sceneItemEnabled:true});
  await obs.req('SetInputMute',{inputName:clips[i].cam+' Original',inputMuted:true});await obs.req('SetInputAudioMonitorType',{inputName:clips[i].cam+' Original',monitorType:'OBS_MONITORING_TYPE_NONE'});
  await replay.command('load',{player:id,eventId:event.id,cam:clips[i].cam});
 }
 await obs.req('CreateScene',{sceneName:'QA Four Players'});
 for(const [i,id]of players.entries()){const item=await obs.req('CreateSceneItem',{sceneName:'QA Four Players',sourceName:'Replay Player '+id});await obs.req('SetSceneItemTransform',{sceneName:'QA Four Players',sceneItemId:item.sceneItemId,sceneItemTransform:{positionX:i%2*320,positionY:Math.floor(i/2)*180,scaleX:1,scaleY:1}});}
 assert.equal((await probe('view')).success,true);
 for(const id of players)await replay.command('transport',{player:id,command:'PLAY'});
 await sleep(1200);result.start=await probe('start');assert.equal(result.start.success,true);captured=true;
 for(const [i,id]of players.entries())await segment('PGM '+id,clips[i].frequency,()=>choose(id));
 await segment('audio-disabled',null,()=>replay.command('audio',{enabled:false}));
 await segment('off-air',null,async()=>{await choose(null);await replay.command('audio',{enabled:true});});
 await segment('A gain -6dB',440,async()=>{replay.state.cameraOptions[clips[0].cam]={gainDb:-6,muted:false,offsetFrames:0,recordAudio:'input'};await choose('A');});
 await choose('D');await obs.req('SetInputSettings',{inputName:'Replay Player D',inputSettings:{local_file:clips[0].file}});
 await segment('file-replaced-muted',null,()=>replay.applyPlayerAudio());
 result.invalidFileWarning=replay.state.players.D.audioUnavailable;assert(result.invalidFileWarning);
 result.stop=await probe('stop');captured=false;assert.equal(result.stop.success,true);assert.equal(result.stop.overflow,false);
 result.status='CAPTURED_PENDING_ANALYSIS';
}catch(e){error=e;result.status='FAIL';result.error=e.message;}
finally{
 if(obs){if(captured)result.cleanupCapture=await probe('stop').catch(e=>({error:e.message}));await obs.req('SetCurrentProgramScene',{sceneName:'QA'}).catch(()=>{});await obs.req('SetCurrentPreviewScene',{sceneName:'QA'}).catch(()=>{});
  for(const id of players){await obs.req('SetInputMute',{inputName:'Replay Player '+id,inputMuted:true}).catch(()=>{});await obs.req('TriggerMediaInputAction',{inputName:'Replay Player '+id,mediaAction:'OBS_WEBSOCKET_MEDIA_INPUT_ACTION_STOP'}).catch(()=>{});}
  result.viewReleased=await probe('release-view').catch(e=>({error:e.message}));await replay?.dispose();
  for(const name of ['QA Four Players',...players.map(id=>'REPLAY '+id),...clips.map(c=>c.cam)])await obs.req('RemoveScene',{sceneName:name}).catch(()=>{});
  for(const name of [...players.map(id=>'Replay Player '+id),...clips.map(c=>c.cam+' Original')])await obs.req('RemoveInput',{inputName:name}).catch(()=>{});
  await sleep(500);result.outputs=(await obs.req('GetOutputList').catch(()=>({outputs:[]}))).outputs;
  const at=Date.now();result.shutdown=await vendor('shutdown_idle',{qaClose:true}).catch(e=>({error:e.message}));result.exit=await Promise.race([exit,sleep(10000).then(()=>null)]);result.shutdownMs=Date.now()-at;
  if(result.outputs.some(o=>o.outputActive)||result.shutdown.success!==true||result.exit?.code!==0||result.viewReleased?.success!==true)result.status='FAIL';obs.close();
 }
 if(child.exitCode===null){result.ownForcedCleanup=true;child.kill();await Promise.race([exit,sleep(1500)]);result.status='FAIL';}
 await writeFile(join(qa,'resultado-native.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({status:result.status,pid:child.pid,segments:result.segments.length,shutdown:result.shutdown,exit:result.exit,shutdownMs:result.shutdownMs,error:result.error}));
}
if(error||result.status==='FAIL')process.exitCode=1;
