import fs from 'node:fs/promises';import crypto from 'node:crypto';import vm from 'node:vm';import assert from 'node:assert/strict';const q=import.meta.dirname,p=q+'/draft/servidor-api.mjs',bytes=await fs.readFile(p),sha=b=>crypto.createHash('sha256').update(b).digest('hex');let s=bytes.toString();
const helper=String.raw`
function publicOperation(receipt){
  if(!receipt||typeof receipt!=='object')return undefined;
  const {id,action,scope,targetKey,targetName,receivedAt,startedAt,engineConfirmedAt,finishedAt,stage,replayed}=receipt;
  const error=receipt.error?String(receipt.error).replace(/(password|key|secret|token)\s*[:=]\s*[^\s,]+/gi,'$1=[omitido]').slice(0,500):undefined;
  return {id,action,scope,targetKey,targetName,receivedAt,startedAt,engineConfirmedAt,finishedAt,stage,...(replayed!==undefined?{replayed}:{}),...(error?{error}: {})};
}
`;
const old="const clean=(s=production.state)=>({...s,replay:replay.state,iso:iso.state,ips:ips()});";if(s.split(old).length!==2)throw Error('clean anchor');
s=s.replace(old,helper+"\r\nconst clean=(s=production.state)=>({...s,operation:publicOperation(s.operation),operationReceipts:(s.operationReceipts||[]).map(publicOperation).filter(Boolean),replay:replay.state,iso:iso.state,ips:ips()});");
const a=s.indexOf('  const {id,action,scope,targetKey,targetName,receivedAt,startedAt,engineConfirmedAt,finishedAt,stage}=receipt;',s.indexOf('function controlReceipt')),b=s.indexOf('\n}',a);if(a<0||b<0)throw Error('receipt anchor');s=s.slice(0,a)+'  return publicOperation(receipt);'+s.slice(b);
await fs.writeFile(q+'/draft/servidor-api-public.mjs',s);
const secret='OWN_SYNTHETIC_MARKER',receipt={id:'own',scope:'Own QA',action:'cut',targetKey:'uuid',targetName:'Own Source',stage:'confirmed',replayed:true,receivedAt:1,startedAt:2,engineConfirmedAt:3,finishedAt:4,signature:secret,arbitrary:secret,error:'token='+secret},production={state:{connected:true,operation:receipt,operationReceipts:[receipt,null]}},replay={state:{rec:false}},iso={state:{rec:false}},ips=()=>['127.0.0.1'];
const cleanSource=s.slice(s.indexOf('function publicOperation'),s.indexOf('function originAllowed'));const f=vm.runInNewContext(cleanSource+';({clean,publicOperation})',{production,replay,iso,ips});const out=f.clean();assert.equal(out.connected,true);assert.equal(out.operation.id,'own');assert.equal(out.operation.replayed,true);assert.equal(out.operationReceipts.length,1);assert.equal('signature' in out.operation,false);assert.equal('arbitrary' in out.operation,false);assert.equal(JSON.stringify(out).includes(secret),false);assert.equal(out.operation.finishedAt,4);assert.equal(out.replay.rec,false);assert.equal(f.publicOperation(null),undefined);
await fs.writeFile(q+'/api-public-result.json',JSON.stringify({status:'PASS_PUBLIC_SUCCESS_METADATA_PROJECTION_VM',cases:8,baselineDraftSha256:sha(bytes),publicDraftSha256:sha(s),limits:['Actual clean/publicOperation source extracted into VM; no HTTP server or Native started.','Other production fields preserve prior spread behavior; scope is only operation and operationReceipts.']},null,2)+'\n');console.log('PASS_PUBLIC_PROJECTION_8');
