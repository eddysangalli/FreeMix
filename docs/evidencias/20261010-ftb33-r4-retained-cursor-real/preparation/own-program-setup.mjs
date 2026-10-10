// OWN QA only. Finite setup; this module is never invoked by preparation.
import assert from 'node:assert/strict';
import {deadline} from './own-native-lifecycle.mjs';
export const PROGRAM_LIMITS=Object.freeze({setupMs:15000,confirmMs:5000,pollMs:100,maxRows:51});
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
export const OWN_SCENE='QA FTB32 R3 Own Program';
export async function prepareOwnProgram({req,fixture,result,onScene,onInput,now=Date.now,sleep=ms=>new Promise(r=>setTimeout(r,ms))}){
 assert(typeof req==='function'&&typeof onScene==='function'&&typeof onInput==='function');
 assert(!result.programSetup,'OWN_PROGRAM_SETUP_ALREADY_ATTEMPTED');
 const r=result.programSetup={status:'PREPARING',programSetsIssued:0,confirmations:[],sceneName:OWN_SCENE,originalSourceUuidRequired:true,privateCopyAliasAccepted:false};
 let until=now()+PROGRAM_LIMITS.setupMs;
 const call=(t,d)=>deadline(()=>req(t,d),until,{now});
 const initial=await call('GetSceneList'),collection=await call('GetSceneCollectionList'),studio=await call('GetStudioModeEnabled');
 assert(collection.currentSceneCollectionName==='QA'&&studio.studioModeEnabled===true,'OWN_PROGRAM_CONTEXT_INVALID');
 assert(initial.currentProgramSceneName==='QA'&&initial.scenes.length===1&&initial.scenes[0].sceneName==='QA','OWN_PROGRAM_SEED_NOT_EMPTY_QA');
 const created=await call('CreateScene',{sceneName:OWN_SCENE});
 assert(UUID.test(created.sceneUuid)&&created.sceneUuid!==initial.currentProgramSceneUuid,'OWN_PROGRAM_SCENE_UUID_INVALID');
 r.sceneUuid=created.sceneUuid;onScene({sceneName:OWN_SCENE,sceneUuid:created.sceneUuid});
 const input=await call('CreateInput',{sceneUuid:created.sceneUuid,inputName:'QA FTB32 Clock Own NTSC Fixture',inputKind:'ffmpeg_source',inputSettings:{is_local_file:true,local_file:fixture,looping:false,close_when_inactive:false,restart_on_activate:false,hw_decode:false,speed_percent:100},sceneItemEnabled:true});
 assert(UUID.test(input.inputUuid)&&Number.isInteger(input.sceneItemId),'OWN_PROGRAM_INPUT_IDENTITY_INVALID');
 r.sourceUuid=input.inputUuid;r.sceneItemId=input.sceneItemId;onInput(input);
 const identity={inputUuid:input.inputUuid};
 await call('SetInputAudioTracks',{...identity,inputAudioTracks:{1:true,2:false,3:false,4:false,5:false,6:false}});
 await call('SetInputAudioMonitorType',{...identity,monitorType:'OBS_MONITORING_TYPE_NONE'});
 await call('SetInputMute',{...identity,inputMuted:false});
 await call('SetInputVolume',{...identity,inputVolumeMul:1});
 const settings=(await call('GetInputSettings',identity)).inputSettings;
 assert(settings.speed_percent===100&&settings.looping===false&&settings.restart_on_activate===false&&settings.close_when_inactive===false,'OWN_PROGRAM_SETTINGS_MISMATCH');
 const tracks=(await call('GetInputAudioTracks',identity)).inputAudioTracks,monitor=await call('GetInputAudioMonitorType',identity),mute=await call('GetInputMute',identity),volume=await call('GetInputVolume',identity);
 assert(tracks&&Object.entries({1:true,2:false,3:false,4:false,5:false,6:false}).every(([k,v])=>tracks[k]===v),'OWN_PROGRAM_TRACKS_MISMATCH');
 assert(monitor.monitorType==='OBS_MONITORING_TYPE_NONE'&&mute.inputMuted===false&&volume.inputVolumeMul===1,'OWN_PROGRAM_AUDIO_READBACK_MISMATCH');
 const items=(await call('GetSceneItemList',{sceneUuid:created.sceneUuid})).sceneItems;
 assert(items.some(x=>x.sourceUuid===input.inputUuid&&x.sceneItemId===input.sceneItemId&&x.sceneItemEnabled===true),'OWN_PROGRAM_INPUT_NOT_IN_ORIGINAL_SCENE');
 const preCollection=await call('GetSceneCollectionList'),preStudio=await call('GetStudioModeEnabled');
 assert(preCollection.currentSceneCollectionName==='QA'&&preStudio.studioModeEnabled===true,'OWN_PROGRAM_CONTEXT_CHANGED');
 // Count BEFORE dispatch. A refused/unknown ACK is never retried.
 r.status='PROGRAM_SET_DISPATCHED';r.programSetsIssued++;
 await call('SetCurrentProgramScene',{sceneUuid:created.sceneUuid});
 r.setAcknowledged=true;r.status='CONFIRMING';until=now()+PROGRAM_LIMITS.confirmMs;
 for(let n=0;n<PROGRAM_LIMITS.maxRows&&now()<until;n++){
  const row={index:n,observedAt:now()};r.confirmations.push(row);
  row.collection=await call('GetSceneCollectionList');row.studio=await call('GetStudioModeEnabled');row.program=await call('GetCurrentProgramScene');row.active=await call('GetSourceActive',{sourceUuid:input.inputUuid});
  assert(row.collection.currentSceneCollectionName==='QA'&&row.studio.studioModeEnabled===true,'OWN_PROGRAM_CONTEXT_CHANGED');
  const programMatches=row.program.currentProgramSceneUuid===created.sceneUuid&&row.program.currentProgramSceneName===OWN_SCENE;
  if(programMatches&&row.active.videoActive===true&&row.active.videoShowing===true){r.status='CONFIRMED_ORIGINAL_UUID_ACTIVE';r.confirmed=true;return input;}
  // Same name/scene ACK alone is insufficient. Do not query/adopt private clones.
  await sleep(Math.min(PROGRAM_LIMITS.pollMs,Math.max(0,until-now())));
 }
 r.status='FAIL_ORIGINAL_UUID_NOT_ACTIVE';throw Object.assign(Error('OWN_PROGRAM_SOURCE_UUID_NOT_ACTIVE'),{code:'OWN_PROGRAM_SOURCE_UUID_NOT_ACTIVE'});
}
