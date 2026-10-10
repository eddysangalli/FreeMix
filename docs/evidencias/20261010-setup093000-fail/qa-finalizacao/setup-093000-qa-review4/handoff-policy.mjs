// Pure timing/decision model only. No timers, filesystem, process, API, browser or automatic Root events.
const ownError=code=>Object.assign(new Error(code),{code});
const ACTIONS=new Set(['inspect','minimize','restore','preview','cut','capture','proof-save']);
export function createHandoff({id,contextSha256,readyAt,overallMs=600000,cleanupReserveMs=40000,liveIdleMs=120000}){
 if(typeof id!=='string'||!/^[A-Za-z0-9_-]{12,80}$/.test(id)||!/^[a-f0-9]{64}$/.test(contextSha256)||!Number.isSafeInteger(readyAt)||readyAt<0||overallMs!==600000||cleanupReserveMs!==40000||liveIdleMs!==120000)throw ownError('INVALID_HANDOFF_CONFIG');
 return {id,contextSha256,phase:'READY_WAIT_ACK',readyAt,overallDeadlineAt:readyAt+overallMs,interactionDeadlineAt:readyAt+overallMs-cleanupReserveMs,cleanupReserveMs,liveIdleMs,acknowledgedAt:null,lastHeartbeatAt:null,lastRootSequence:-1,liveDeadlineAt:null,lastObservedAt:readyAt,proofValidated:false,closeReason:null,cleanupRequested:false,forceAllowed:false};
}
const close=(s,now,reason)=>({...s,phase:'CLOSING',lastObservedAt:now,closeReason:reason,cleanupRequested:true,forceAllowed:false,apiCloseDeadlineAt:Math.min(now+20000,s.overallDeadlineAt-20000),nativeCloseDeadlineAt:Math.min(now+40000,s.overallDeadlineAt),cleanupModes:{api:'own-child-ipc-self-SIGTERM',native:'own-identity-idle-shutdown_idle'}});
export function tick(s,now){
 if(!Number.isSafeInteger(now)||now<s.lastObservedAt)throw ownError('NON_MONOTONIC_OBSERVATION');
 if(s.phase==='READY_WAIT_ACK'&&now>=s.interactionDeadlineAt)return close(s,now,'TOTAL_INTERACTION_BUDGET_EXPIRED_WITHOUT_ACK');
 if(s.phase==='ROOT_LIVE'&&now>=Math.min(s.interactionDeadlineAt,s.liveDeadlineAt))return close(s,now,now>=s.interactionDeadlineAt?'TOTAL_INTERACTION_BUDGET_EXPIRED':'ROOT_LIVE_HEARTBEAT_EXPIRED');
 return {...s,lastObservedAt:now};
}
export function acceptRootEvent(s,event,now){
 const at=tick(s,now),refuse=code=>({state:at,accepted:false,code});
 if(at.phase==='CLOSING'||at.phase==='FINISHED')return refuse('HANDOFF_ALREADY_CLOSING');
 if(!event||event.handoffId!==s.id||event.contextSha256!==s.contextSha256||event.role!=='root'||event.ownOnly!==true)return refuse('FOREIGN_OR_UNSCOPED_ROOT_EVENT');
 if(!Number.isSafeInteger(event.sequence)||event.sequence!==s.lastRootSequence+1)return refuse('ROOT_SEQUENCE_NOT_NEXT');
 if(event.kind==='ack'){
  if(at.phase!=='READY_WAIT_ACK'||event.sequence!==0)return refuse('ACK_NOT_EXPECTED');
  return {accepted:true,state:{...at,phase:'ROOT_LIVE',acknowledgedAt:now,lastHeartbeatAt:now,lastRootSequence:0,liveDeadlineAt:Math.min(now+s.liveIdleMs,s.interactionDeadlineAt)}};
 }
 if(at.phase!=='ROOT_LIVE')return refuse('ROOT_ACK_REQUIRED_FIRST');
 if(event.kind==='heartbeat'){
  if(!ACTIONS.has(event.action))return refuse('UNKNOWN_ACTION_HEARTBEAT');
  return {accepted:true,state:{...at,lastRootSequence:event.sequence,lastHeartbeatAt:now,liveDeadlineAt:Math.min(now+s.liveIdleMs,s.interactionDeadlineAt)}};
 }
 if(event.kind==='proof-ready'){
  if(event.proofValidated!==true||event.nativeReadbackValidated!==true)return refuse('PROOF_AND_NATIVE_READBACK_REQUIRED');
  return {accepted:true,state:close({...at,lastRootSequence:event.sequence,proofValidated:true},now,'ROOT_PROOF_AND_NATIVE_READBACK_COMPLETE')};
 }
 if(event.kind==='close-request')return {accepted:true,state:close({...at,lastRootSequence:event.sequence},now,'ROOT_CLOSE_WITHOUT_COMPLETE_PROOF')};
 return refuse('UNKNOWN_ROOT_EVENT');
}
export function observeCleanup(s,observation,now){
 const at=tick(s,now);if(at.phase!=='CLOSING')throw ownError('CLEANUP_NOT_REQUESTED');
 const closed=observation?.ownIdentityConfirmed===true&&observation.outputsIdle===true&&observation.apiClosed===true&&observation.apiExitCode===0&&observation.nativeShutdownAccepted===true&&observation.nativeClosed===true;
 const guards=observation?.fullNativePinsVerified===true&&observation.runtimePinsVerified===true&&observation.counter===0&&observation.crash===0;
 return {...at,phase:'FINISHED',cleanupObserved:closed,postGuardsObserved:guards,finishedAt:now,lateObservation:now>s.overallDeadlineAt,result:closed&&guards&&s.proofValidated&&now<=s.overallDeadlineAt?'PASS_HANDOFF_REQUIRES_REAL_EXTERNAL_PROOFS':'FAIL_OR_UNPROVED',forceAllowed:false,retainUnknownProcessForRoot:!closed,meterWarnings:observation?.meterWarnings??null};
}
export function validateRootProof(p,{handoffId,contextSha256,programBefore,previewTarget,programAfter}){
 if(!p||p.ownOnly!==true||p.backendReal!==true||p.reviewed!==true||p.handoffId!==handoffId||p.contextSha256!==contextSha256)throw ownError('ROOT_PROOF_CONTEXT_MISMATCH');
 for(const step of ['minimized','restored','preview','cut','tally'])if(p.steps?.[step]!==true)throw ownError('ROOT_PROOF_STEP_MISSING');
 if(p.nativeExpected?.programBefore!==programBefore||p.nativeExpected?.previewTarget!==previewTarget||p.nativeExpected?.programAfter!==programAfter)throw ownError('ROOT_PROOF_TARGET_MISMATCH');
 if(!Array.isArray(p.files)||p.files.length<2||p.files.length>10)throw ownError('ROOT_PROOF_IMAGE_COUNT');const names=new Set();
 for(const f of p.files){if(!/^[A-Za-z0-9_-]+\.(?:jpg|jpeg|png)$/.test(f.file)||names.has(f.file)||!Number.isSafeInteger(f.bytes)||f.bytes<=500||f.bytes>10*1024*1024||!/^[a-f0-9]{64}$/.test(f.sha256)||!['image/jpeg','image/png'].includes(f.mime))throw ownError('ROOT_PROOF_IMAGE_METADATA');names.add(f.file);}
 return {metadataValid:true,filesStillRequireActualHashAndMimeChecks:true,nativeSnapshotsStillRequireActualReadback:true,visualProofIsRootIabOnly:true};
}
