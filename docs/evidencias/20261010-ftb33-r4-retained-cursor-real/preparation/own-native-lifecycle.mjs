// QA ONLY. Never force terminates a process. Callbacks target reviewed own root only.
import path from 'node:path';
const norm=p=>path.resolve(p).toLowerCase(),fault=code=>Object.assign(Error(code),{code});
export async function deadline(task,until,{now=Date.now,set=setTimeout,clear=clearTimeout}={}){
 const left=until-now();if(left<=0)throw fault('OWN_DEADLINE');let timer;
 try{return await Promise.race([typeof task==='function'?Promise.resolve().then(task):Promise.resolve(task),new Promise((_,reject)=>{timer=set(()=>reject(fault('OWN_DEADLINE')),left);})]);}finally{clear(timer);}
}
export async function ownIdentity(c,{pid,executable,until,now=Date.now}){
 if(!Number.isSafeInteger(pid)||pid<=0)throw fault('OWN_PID_UNAVAILABLE');
 const r=(await deadline(()=>c.req('CallVendorRequest',{vendorName:'freemix',requestType:'get_interface',requestData:{}}),until,{now})).responseData;
 if(r?.pid!==pid||typeof r.executable!=='string'||norm(r.executable)!==norm(executable))throw fault('OWN_NATIVE_IDENTITY');
 return{pid,executable:path.resolve(executable)};
}
export async function idle(c,{until,now=Date.now}){
 const req=(t,d)=>deadline(()=>c.req(t,d),until,{now}),outputs=(await req('GetOutputList')).outputs;
 if(!Array.isArray(outputs)||outputs.some(o=>o.outputActive))throw fault('OWN_OUTPUTS_ACTIVE_OR_UNKNOWN');
 if((await req('GetRecordStatus')).outputActive!==false||(await req('GetStreamStatus')).outputActive!==false)throw fault('OWN_OUTPUTS_ACTIVE_OR_UNKNOWN');
 return outputs;
}
export async function waitOwnReady({connect,pid,executable,exited=()=>false,deadlineMs=120000,expectedVideo={baseWidth:1280,baseHeight:720,fpsNumerator:30000,fpsDenominator:1001},now=Date.now,sleep=ms=>new Promise(r=>setTimeout(r,ms)),onSnapshot=()=>{}}){
 if(deadlineMs<=0||deadlineMs>120000)throw fault('OWN_READINESS_BUDGET');if(!Number.isSafeInteger(pid)||pid<=0)throw fault('OWN_PID_UNAVAILABLE');
 const start=now(),until=start+deadlineMs;let last='OWN_CONNECT_NOT_READY';
 while(now()<until){if(exited())throw fault('OWN_NATIVE_EXITED');let c;
  try{const pending=Promise.resolve().then(connect);pending.then(v=>{if(now()>=until)v.close();},()=>{});c=await deadline(pending,until,{now});const identity=await ownIdentity(c,{pid,executable,until,now});const req=(t,d)=>deadline(()=>c.req(t,d),until,{now});
   const profiles=await req('GetProfileList'),collections=await req('GetSceneCollectionList'),scenes=await req('GetSceneList'),video=await req('GetVideoSettings');
   if(profiles.currentProfileName!=='QA'||collections.currentSceneCollectionName!=='QA'||scenes.currentProgramSceneName!=='QA'||!Array.isArray(scenes.scenes)||scenes.scenes.some(s=>s.sceneName!=='QA'))throw fault('OWN_QA_CONTEXT_NOT_READY');
   if(Object.entries(expectedVideo).some(([k,v])=>video[k]!==v))throw fault('OWN_VIDEO_NOT_READY');
   await idle(c,{until,now});const studio=await req('GetStudioModeEnabled');
   // No mode mutation during readiness. Root must seed ownQA Studio before launch.
   if(studio.studioModeEnabled!==true)throw fault('OWN_STUDIO_NOT_READY');
   if(exited())throw fault('OWN_NATIVE_EXITED');onSnapshot({elapsedMs:now()-start,identity,profileQA:true,collectionQA:true,programQA:true,studio:true,videoMatchesSeed:true,video,idle:true});return c;
  }catch(e){c?.close();last=e.code||'OWN_READINESS_REQUEST_FAILED';onSnapshot({elapsedMs:now()-start,code:last});if(last==='OWN_NATIVE_IDENTITY'||last==='OWN_NATIVE_EXITED')throw e;await sleep(Math.min(250,Math.max(0,until-now())));}
 }throw fault('OWN_READINESS120S_EXPIRED:'+last);
}
export async function cooperativeClose({connect,existing=null,pid,executable,exited=()=>false,exit,ownedCleanup=async()=>{},deadlineMs=10000,now=Date.now}){
 const result={success:false,forced:false,shutdownRequested:false,shutdownAccepted:false,identityConfirmed:false,connectionClosed:false,preservedProcess:null};let c=existing,connecting=false;const until=now()+deadlineMs;
 const preserve=reason=>{result.preservedProcess={pid:pid??null,executable:path.resolve(executable),reason};};
 try{if(exited()){result.exitedBeforeClose=true;result.exit=await deadline(exit,until,{now});result.success=result.exit?.code===0;if(!result.success)result.code='OWN_EXIT_NOT_ZERO';return result;}
  if(!Number.isSafeInteger(pid)||pid<=0)throw fault('OWN_PID_UNAVAILABLE');
  if(!c){connecting=true;const pending=Promise.resolve().then(connect);pending.then(v=>{connecting=false;if(now()>=until){v.close();result.lateConnectionClosed=true;}},()=>{connecting=false;});c=await deadline(pending,until,{now});}
  await ownIdentity(c,{pid,executable,until,now});result.identityConfirmed=true;
  // A pending cleanup can settle late; it may never submit another Native action
  // after our close deadline. Already-submitted requests remain uncertain.
  const bounded=Object.create(c);bounded.req=(...args)=>deadline(()=>c.req(...args),until,{now});
  await deadline(()=>ownedCleanup(bounded),until,{now});
  result.outputs=await idle(c,{until,now});result.shutdownRequested=true;
  const r=(await deadline(()=>c.req('CallVendorRequest',{vendorName:'freemix',requestType:'shutdown_idle',requestData:{qaClose:true}}),until,{now})).responseData;result.shutdown=r;result.shutdownAccepted=r?.success===true;
  if(!result.shutdownAccepted)throw fault('OWN_SHUTDOWN_REFUSED_OR_UNKNOWN');result.exit=await deadline(exit,until,{now});if(result.exit?.code!==0)throw fault('OWN_EXIT_NOT_ZERO');result.success=true;
 }catch(e){result.code=e.code||(/^OWN_[A-Z0-9_]+$/.test(e.message)?e.message:'OWN_CLOSE_UNCONFIRMED');preserve(result.code);}
 finally{c?.close();result.connectionClosed=!!c||!connecting;result.connectionPending=connecting;}
 return result;
}
