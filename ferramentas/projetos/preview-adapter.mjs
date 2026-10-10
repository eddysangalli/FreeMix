// Backend integration adapter. Only explicit reads; never production.run/refresh/tick.
import {createHash,randomUUID} from 'node:crypto';
import {planProject} from './wizard-model.js';
const fail=code=>{throw Object.assign(Error(code),{code});};
const connections=new WeakMap();
export const nativeReads=Object.freeze(['GetInputList','GetInputKindList','GetSceneCollectionList','GetProfileList','GetRecordStatus','GetStreamStatus','GetVirtualCamStatus','GetOutputList','GetSourceFilterKindList']);
const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const boundedStrings=rows=>rows.filter(x=>typeof x==='string'&&x.length<=200).slice(0,500);
export function safeRead(req,type,data={}) {
 if(!nativeReads.includes(type)||Object.keys(data).length)fail('READ_NOT_ALLOWLISTED');
 return req(type,{});
}
export function createPreviewAdapter({getConnection,readState,readActivity,timeoutMs=4000}) {
 if(typeof getConnection!=='function'||typeof readState!=='function'||!Number.isInteger(timeoutMs)||timeoutMs<100||timeoutMs>10000)fail('ADAPTER_INVALID');
 let tail=Promise.resolve(),blockedConnection=null;
 const snapshot=async()=>{
  const connection=getConnection();if(!connection||typeof connection.req!=='function')fail('ENGINE_DISCONNECTED');
  if(blockedConnection===connection)fail('PREVIOUS_READ_TIMEOUT_RECONNECT_REQUIRED');
  if(!connections.has(connection))connections.set(connection,randomUUID());
  const req=async(type)=>{
   let timer;try{return await Promise.race([safeRead(connection.req.bind(connection),type),new Promise((_,reject)=>{timer=setTimeout(()=>{const current=getConnection()===connection;if(current)blockedConnection=connection;const code=current?'READ_TIMEOUT':'CONNECTION_CHANGED';reject(Object.assign(Error(code),{code}));},timeoutMs);})]);}finally{clearTimeout(timer);}
  };
  // Serial, bounded allowlist. Avoid unbounded discovery/probes/device properties.
  const rows={};for(const type of nativeReads){rows[type]=await req(type);if(getConnection()!==connection)fail('CONNECTION_CHANGED');}
  const after=await req('GetSceneCollectionList');
  if(after.currentSceneCollectionName!==rows.GetSceneCollectionList.currentSceneCollectionName)fail('SCOPE_CHANGED');
  const profileAfter=await req('GetProfileList');if(typeof profileAfter.currentProfileName!=='string'||!profileAfter.currentProfileName||profileAfter.currentProfileName!==rows.GetProfileList.currentProfileName)fail('PROFILE_CHANGED_OR_UNKNOWN');
  const state=readState();if(!state||state.connected!==true)fail('STATE_NOT_READY');
  if(state.preset!==after.currentSceneCollectionName)fail('STATE_SCOPE_NOT_READY');
  if(getConnection()!==connection)fail('CONNECTION_CHANGED');
  const inputKinds=boundedStrings(rows.GetInputKindList.inputKinds||[]),capabilities=boundedStrings(rows.GetSourceFilterKindList.sourceFilterKinds||[]);
  // Existing inputs are evidence of installed kinds, NOT evidence of camera device IDs/modes.
  const inventory={revision:'',cameras:[],audio:[],capabilities,inputKinds,existingCaptures:(rows.GetInputList.inputs||[]).filter(i=>/dshow_input|wasapi_input_capture/.test(i.unversionedInputKind||i.inputKind||'')).slice(0,64).map(i=>({uuid:i.inputUuid,label:String(i.inputName||'').slice(0,120),kind:i.unversionedInputKind||i.inputKind})),discoveryAvailable:false,reason:'A API atual lista fontes existentes, mas não descobre com segurança câmeras e modos sem criar uma fonte. Escolha espaços vazios ou aguarde o adaptador de descoberta.'};
  const outputs=rows.GetOutputList.outputs;
  if(!Array.isArray(outputs))fail('OUTPUT_STATE_UNKNOWN');
  if(typeof rows.GetRecordStatus.outputActive!=='boolean'||typeof rows.GetStreamStatus.outputActive!=='boolean'||typeof rows.GetVirtualCamStatus.outputActive!=='boolean')fail('ACTIVITY_STATE_UNKNOWN');
  // Public summaries do not expose all leases. Root binds this to existing owner fields,
  // e.g. macroEngine.controller/callEngine.lease/queueEngine.running. Missing blocks.
  const activity=typeof readActivity==='function'?readActivity():null;
  const activityKnown=!!activity&&['macroRunning','controllerActive','queueRunning','callLease','unresolvedOperations'].every(k=>typeof activity[k]==='boolean');
  const callLease=activity?.callLease!==false;
  const busy=rows.GetRecordStatus.outputActive||rows.GetStreamStatus.outputActive||rows.GetVirtualCamStatus.outputActive||outputs.some(o=>o.outputActive!==false)||!activityKnown||Object.values(activity||{}).some(v=>v===true)||['pending','uncertain'].includes(state.operation?.stage);
  const context={scope:after.currentSceneCollectionName,connectionId:connections.get(connection),idle:activityKnown&&!busy,recording:rows.GetRecordStatus.outputActive,streaming:rows.GetStreamStatus.outputActive,virtualCamera:rows.GetVirtualCamStatus.outputActive,outputsActive:outputs.some(o=>o.outputActive!==false),callLease,operationUncertain:!activityKnown||['pending','uncertain'].includes(state.operation?.stage),profiles:boundedStrings((rows.GetProfileList.profiles||[]).map(p=>typeof p==='string'?p:p.profileName)),collections:boundedStrings((after.sceneCollections||[]).map(p=>typeof p==='string'?p:p.sceneCollectionName)),evidence:'native-read-only',applicationSupported:false};
  context.profile=profileAfter.currentProfileName;inventory.revision=digest({inventory,context});return {schema:1,inventory,context};
 };
 const readPreviewContext=()=>{const work=tail.then(snapshot);tail=work.catch(()=>{});return work;};
 return Object.freeze({readPreviewContext,async preview(d){const latest=await readPreviewContext();return {plan:await planProject(d,latest.inventory,latest.context),executable:false,mutationsSent:0};},apply(){fail('APPLICATION_NOT_IMPLEMENTED');}});
}
