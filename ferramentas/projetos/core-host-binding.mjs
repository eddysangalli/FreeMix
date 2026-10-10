import {createProjectIsolationGate} from './project-isolation-gate.mjs';
import {createPreviewAdapter} from './preview-adapter.mjs';
import {createDeviceDiscovery} from './device-discovery.mjs';
import {createWizardHost} from './wizard-host.mjs';
import {createProjectJournalStore,verifySavedProject} from './project-files.mjs';
import {createCompositionPort} from './composition-port.mjs';
const fail=code=>{throw Object.assign(Error(code),{code});};
export function normalizeCreationPolicy(value){
 if(value?.success!==true||value.evidence!=='native-creation-policy-read-only'||!['firstRunCompleted','profileAudioDefaultsCompatible','monitoringDefaultsCompatible','contextReloadSafe'].every(k=>typeof value[k]==='boolean')||!Number.isSafeInteger(value.sourceCount)||value.sourceCount<0||value.sourceCount>1001)fail('NATIVE_CREATION_POLICY_INVALID');
 return {evidence:value.evidence,firstRunCompleted:value.firstRunCompleted,profileAudioDefaultsCompatible:value.profileAudioDefaultsCompatible,monitoringDefaultsCompatible:value.monitoringDefaultsCompatible,contextReloadSafe:value.contextReloadSafe,sourceCount:value.sourceCount};
}
const baseline=async c=>{const [sc,p,s,v,m]=await Promise.all([c.req('GetSceneCollectionList'),c.req('GetProfileList'),c.req('GetSceneList'),c.req('GetVideoSettings'),c.req('GetStudioModeEnabled')]);if(!sc.currentSceneCollectionName||!p.currentProfileName||!s.currentProgramSceneUuid||typeof m.studioModeEnabled!=='boolean')fail('BASELINE_CONTEXT_UNKNOWN');return {scope:sc.currentSceneCollectionName,profile:p.currentProfileName,program:s.currentProgramSceneUuid,preview:s.currentPreviewSceneUuid||null,studio:m.studioModeEnabled,video:Object.fromEntries(['baseWidth','baseHeight','outputWidth','outputHeight','fpsNumerator','fpsDenominator'].map(k=>[k,v[k]]))};};
// readActivity is bound to all actual owners, not inferred from public state or an idle-looking UI.
export function createCoreProjectBinding({root,InputEngine,getConnection,readState,readActivity,coverageQualified=false,nativeQueriesQualified=false,nativeRequestNames}){
 let gated=null;
 const gate=createProjectIsolationGate({getConnection,readBaseline:async()=>baseline(getConnection()),verifyBaseline:async saved=>JSON.stringify(await baseline(getConnection()))===JSON.stringify(saved)});
 const wrapConnection=raw=>gate.wrapConnection(raw); // Root assigns ONLY this wrapped object to obs, Production, Replay and ISO.
 const readVendor=async (name,requestData={})=>{if(nativeQueriesQualified!==true||!name)fail('NATIVE_PROJECT_QUERY_UNAVAILABLE');const r=await getConnection().req('CallVendorRequest',{vendorName:'freemix',requestType:name,requestData});return r.responseData;};
 const readCreationPolicy=async()=>normalizeCreationPolicy(await readVendor(nativeRequestNames?.policy));
 const strictActivity=()=>{const state=readActivity();const keys=['macroRunning','macroRecording','controllerActive','queueRunning','callLease','callReturnsActive','replayBusy','isoBusy','networkActive','updateBusy','diagnosticsBusy','recoveryBusy','unresolvedOperations'];if(!state||!keys.every(k=>typeof state[k]==='boolean'))fail('PROJECT_OWNER_STATE_UNKNOWN');return state;};
 const previewAdapter=createPreviewAdapter({getConnection,readState,readActivity:strictActivity});
 const discovery=createDeviceDiscovery({getConnection,readNativeInventory:async()=>gate.withExclusive(()=>readVendor(nativeRequestNames?.inventory,{confirmDriverMetadataQuery:true}))});
 const host=createWizardHost({previewAdapter,discovery,getConnection,readActivity:strictActivity,readCreationPolicy,withExclusiveProjectLock:cb=>gate.withExclusive(cb),journalStore:createProjectJournalStore(root),compositionPort:createCompositionPort({root,InputEngine}),verifySavedProject:ledger=>verifySavedProject(root,ledger),discoveryEnabled:nativeQueriesQualified===true,executionEnabled:coverageQualified===true&&nativeQueriesQualified===true});
 gated=Object.freeze({gate,host,wrapConnection,readCreationPolicy,coverageQualified:coverageQualified===true,nativeQueriesQualified:nativeQueriesQualified===true});return gated;
}
