import {AsyncLocalStorage} from 'node:async_hooks';
const fail=code=>{throw Object.assign(Error(code),{code});};
// A cooperative admission gate, not a lock on Native UI or another SDK client.
// Root must route ALL background work/SDK calls through these hooks before enabling apply.
export function createProjectIsolationGate({getConnection,readBaseline,verifyBaseline,drainMs=15000,clock=()=>Date.now(),sleep=ms=>new Promise(r=>setTimeout(r,ms))}){
 if(typeof getConnection!=='function'||typeof readBaseline!=='function'||typeof verifyBaseline!=='function'||!Number.isInteger(drainMs)||drainMs<100||drainMs>30000)fail('GATE_DEPENDENCIES_REQUIRED');
 const context=new AsyncLocalStorage(),jobs=new Set(),wires=new Set(),wrapped=new WeakMap();let phase='IDLE',blockCode=null,owner=null,lastBaseline=null,discardedEvents=0;
 function assertPublic(){const ctx=context.getStore();if(phase==='IDLE'||phase==='DRAINING'&&ctx?.job&&jobs.has(ctx.job))return;fail('PROJECT_TRANSACTION_BUSY');}
 async function publicRun(work){assertPublic();const previous=context.getStore();if(previous?.job&&jobs.has(previous.job))return work();const job={};jobs.add(job);try{return await context.run({job},work);}finally{jobs.delete(job);}}
 async function wire(method,type,data){const ctx=context.getStore();if(!(ctx?.owner===owner&&owner&&phase==='LOCKED'))assertPublic();const token={};wires.add(token);try{return await method(type,data);}finally{wires.delete(token);}}
 function wrapConnection(raw){
  if(!raw)return null;if(wrapped.has(raw))return wrapped.get(raw);if(typeof raw.req!=='function'||typeof raw.tryReq!=='function')fail('SDK_INTERFACE_UNEXPECTED');
  const guarded={req:(type,data)=>wire(raw.req.bind(raw),type,data),tryReq:(type,data)=>wire(raw.tryReq.bind(raw),type,data),close:()=>raw.close()};wrapped.set(raw,guarded);return guarded;
 }
 async function withExclusive(work){
  if(phase!=='IDLE')fail('PROJECT_TRANSACTION_BUSY');phase='DRAINING';const until=clock()+drainMs;
  while(jobs.size||wires.size){if(clock()>=until){phase='BLOCKED';blockCode='EXISTING_WORK_DRAIN_UNCONFIRMED';fail(blockCode);}await sleep(10);}
  owner={};phase='LOCKED';const connection=getConnection();let result,error;
  try{return await context.run({owner},async()=>{
   lastBaseline=await readBaseline();if(getConnection()!==connection)fail('CONNECTION_CHANGED');
   try{result=await work();}catch(e){error=e;}
   // Never release to ticks/refresh if a timed-out wire still exists or context is not restored.
   if(wires.size||getConnection()!==connection||await verifyBaseline(lastBaseline)!==true){phase='BLOCKED';blockCode='PROJECT_CONTEXT_RESTORE_UNCONFIRMED';if(error)throw error;fail(blockCode);}
   phase='IDLE';owner=null;if(error)throw error;return result;
  });}catch(e){if(phase!=='IDLE'){phase='BLOCKED';blockCode??='PROJECT_TRANSACTION_UNCONFIRMED';}throw e;}
 }
 function shouldSkipBackground(){return phase!=='IDLE';}
 function acceptNativeEvent(type){if(phase==='IDLE')return true;if(type==='ExitStarted')return true;discardedEvents=Math.min(100000,discardedEvents+1);return false;}
 async function resumeAfterExplicitReview(){if(phase!=='BLOCKED'||jobs.size||wires.size||!lastBaseline)fail('GATE_RESUME_REFUSED');owner={};phase='LOCKED';try{const ok=await context.run({owner},()=>verifyBaseline(lastBaseline));if(ok!==true)fail('GATE_RESUME_CONTEXT_UNCONFIRMED');phase='IDLE';owner=null;blockCode=null;}catch(e){phase='BLOCKED';throw e;}}
 return Object.freeze({publicRun,wrapConnection,withExclusive,shouldSkipBackground,acceptNativeEvent,resumeAfterExplicitReview,assertPublic,status:()=>({phase,busy:phase!=='IDLE',blockCode,jobs:jobs.size,wires:wires.size,discardedEvents})});
}
