const fail=code=>{throw Object.assign(Error(code),{code});};
const safeCode=e=>typeof e?.code==='string'&&/^[A-Z_]{1,80}$/.test(e.code)?e.code:'PROJECT_OPERATION_UNCONFIRMED';
export function publicProjectReceipt(value){if(!value)return undefined;const {operationId,planHash,status,phase,projectName,originalRestored,rollbackCode,failureCode,createdProjectRequiresExplicitOpen,devicesRequireExplicitActivation}=value;return {operationId,planHash,status,phase,projectName,originalRestored,rollbackCode,failureCode,createdProjectRequiresExplicitOpen,devicesRequireExplicitActivation,scenes:(value.scenes||[]).map(({uuid,label,state})=>({uuid,label,state})),compositions:(value.compositions||[]).map(({uuid,name,preset,linked})=>({uuid,name,preset,linked})),savedProof:value.savedProof,devicesActivated:false,externalOutputsStarted:false};}
// Pure routing adapter; Root calls after actual auth/origin/local checks. Does not start HTTP.
export async function routeProjectApi({pathname,method,query={},body={},local,authorized,originAllowed},binding){
 const operations={'/api/project/read':'readPreviewContext','/api/project/scan':'scanDevices','/api/project/preview':'previewProject','/api/project/apply':'applyProject'},operation=operations[pathname];
 if(!operation)return null;
 if(local!==true||authorized!==true||originAllowed!==true)return {status:403,data:{success:false,error:'PROJECT_LOCAL_AUTH_REQUIRED'}};
 if(Object.keys(query).length)return {status:400,data:{success:false,error:'PROJECT_QUERY_REFUSED'}};
 if(method!==(operation==='readPreviewContext'?'GET':'POST'))return {status:405,data:{success:false,error:'PROJECT_METHOD_REFUSED'}};
 if(!body||Array.isArray(body)||typeof body!=='object'||JSON.stringify(body).length>65536)return {status:400,data:{success:false,error:'PROJECT_BODY_INVALID'}};
 if(binding.gate.status().busy)return {status:409,data:{success:false,error:'PROJECT_TRANSACTION_BUSY',projectTransaction:binding.gate.status()}};
 try{const result=await binding.host[operation](body);return {status:200,data:{success:true,data:operation==='applyProject'?publicProjectReceipt(result):result,projectTransaction:binding.gate.status()}};}
 catch(e){return {status:409,data:{success:false,error:safeCode(e),receipt:publicProjectReceipt(e.receipt),projectTransaction:binding.gate.status()}};}
}
