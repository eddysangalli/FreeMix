import fs from 'node:fs/promises';import path from 'node:path';import crypto from 'node:crypto';import vm from 'node:vm';import assert from 'node:assert/strict';
const q=import.meta.dirname,root=path.resolve(q,'../..'),p='FreeMix/ferramentas/servidor-api.mjs',sha=b=>crypto.createHash('sha256').update(b).digest('hex'),b=await fs.readFile(path.join(root,p));await fs.writeFile(q+'/baseline-canonical/servidor-api.mjs',b);let s=b.toString();
const helper=String.raw`
function controlReceipt(request){
  if(!request||typeof request.id!=='string'||typeof request.scope!=='string')return undefined;
  const receipt=production.operationReceipts?.get(request.scope+':'+request.id);
  if(!receipt||receipt.id!==request.id||receipt.scope!==request.scope)return undefined;
  const {id,action,scope,targetKey,targetName,receivedAt,startedAt,engineConfirmedAt,finishedAt,stage}=receipt;
  const error=receipt.error?String(receipt.error).replace(/(password|key|secret|token)\s*[:=]\s*[^\s,]+/gi,'$1=[omitido]').slice(0,500):undefined;
  return {id,action,scope,targetKey,targetName,receivedAt,startedAt,engineConfirmedAt,finishedAt,stage,...(error?{error}: {})};
}
`;
function once(a,v){if(s.split(a).length!==2)throw Error('API anchor');s=s.replace(a,v);}
once('const server=createServer(async(req,res)=>{',''+helper+'\r\nconst server=createServer(async(req,res)=>{\r\n  let controlOperation;');
once('const state=await production.run(d.action,d);','controlOperation={id:d.operationId,scope:d.expectedScope};const state=await production.run(d.action,d);');
once('}catch(e){json(res,400,{success:false,error:e.message});}','}catch(e){const operation=controlReceipt(controlOperation);json(res,400,{success:false,error:e.message,...(operation?{operation}: {})});}');
await fs.writeFile(q+'/draft/servidor-api.mjs',s);
const production={operationReceipts:new Map(),state:{operation:{id:'own',scope:'scope',stage:'confirmed'}}},fn=vm.runInNewContext(helper+';controlReceipt',{production});const r={id:'own',scope:'scope',action:'cut',stage:'rejected',signature:'PRIVATE_INTERNAL',privateSecret:'PRIVATE_DATA',error:'token=SYNTHETIC_SECRET',receivedAt:1};production.operationReceipts.set('scope:own',r);
assert.equal(fn(null),undefined);assert.equal(fn({id:'other',scope:'scope'}),undefined);assert.equal(fn({id:'own',scope:'other'}),undefined);const out=fn({id:'own',scope:'scope'});assert.equal(out.stage,'rejected');assert.equal('signature' in out,false);assert.equal('privateSecret' in out,false);assert.equal(JSON.stringify(out).includes('SYNTHETIC_SECRET'),false);
const clean=(s=production.state)=>({...s,replay:{},iso:{},ips:[]});assert.equal(clean({operation:r,operationReceipts:[r]}).operationReceipts[0].id,'own');
await fs.writeFile(q+'/api-draft-result.json',JSON.stringify({status:'PASS_6_API_RECEIPT_CASES_NO_SERVER_NO_NATIVE',cases:6,baseline:{path:p,sha256:sha(b)},draft:{path:'draft/servidor-api.mjs',sha256:sha(s)},notes:['Only the failed request ID/scope matching a cached receipt is exposed; fields are projected, internal signature and arbitrary fields excluded.','clean(state) is a spread in actual source and preserves receipts; existing authorization stays before control request body/dispatch.','This VM fixture does not launch actual HTTP API.']},null,2)+'\n');console.log('PASS_API_RECEIPT_6');
