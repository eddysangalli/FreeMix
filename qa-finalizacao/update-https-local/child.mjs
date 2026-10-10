import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {OnlineUpdateEngine,httpsBytes,updateURL} from '../../obs-vmix/ferramentas/atualizacao-online.mjs';
const [mode,root,origin,wrongOrigin]=process.argv.slice(2),checks=[],sha=b=>createHash('sha256').update(b).digest('hex');
const check=(name,condition,extra={})=>{assert(condition,name);checks.push({name,pass:true,...extra});};
const expect=async(name,fn,pattern)=>{let failure;try{await fn();}catch(e){failure=e;}assert(failure,name+' expected refusal');assert.match(failure.message,pattern,name);checks.push({name,pass:true,errorCode:failure.code||null,error:failure.message});};
const engine=async label=>{const folder=join(root,label);await fs.mkdir(folder,{recursive:true});await fs.writeFile(join(folder,'version.json'),JSON.stringify({version:'1.0.0'}));await fs.copyFile(join(root,'update-public.pem'),join(folder,'update-public.pem'));return new OnlineUpdateEngine(folder);};
const configure=async(e,label,base=origin)=>e.execute('update_configure',{url:base+'/cases/'+label+'/feed.json'});
const noStage=async e=>{const dirs=await fs.readdir(join(e.root,'updates/downloads')).catch(err=>{if(err.code==='ENOENT')return [];throw err;});check('failed-download-no-partial-or-final-'+e.label,dirs.length===0);};
try{
 assert.equal(process.env.NODE_TLS_REJECT_UNAUTHORIZED,undefined,'QA must not weaken TLS');
 if(mode==='untrusted'){
  assert.equal(process.env.NODE_EXTRA_CA_CERTS,undefined);await expect('untrusted-development-CA-rejected',()=>httpsBytes(new URL(origin+'/cases/good/feed.json'),65536),/certificate|issuer|self.signed|verify/i);
 }else{
  assert(process.env.NODE_EXTRA_CA_CERTS?.endsWith('ca.pem'));const good=await engine('good');await configure(good,'good');const ready=await good.execute('update_check');check('signed-HTTPS-feed-available',ready.status==='available'&&ready.version==='1.0.1'&&ready.fileCount===2);
  const downloaded=await good.execute('update_download');check('real-HTTPS-streamed-download-completed',downloaded.status==='downloaded'&&!!downloaded.packagePath);
  const signed=JSON.parse(await fs.readFile(join(downloaded.packagePath,'manifest.json')));for(const file of signed.files){const b=await fs.readFile(join(downloaded.packagePath,file.path));check('download-size-sha-'+file.path,b.length===file.size&&sha(b)===file.sha256);}
  check('download-does-not-apply-update',JSON.parse(await fs.readFile(join(good.root,'version.json'))).version==='1.0.0');
  const persisted=new OnlineUpdateEngine(good.root);const reread=await persisted.execute('update_read');check('feed-persisted-and-reloaded',reread.url===origin+'/cases/good/feed.json'&&reread.currentVersion==='1.0.0');
  for(const [label,pattern]of [['bad-signature',/Assinatura/],['tampered-manifest',/Assinatura/],['old-version',/não posterior/],['traversal',/Caminho|Fora|fora|inseguro|recusado/],['cross-origin',/mesma origem/],['redirect-feed',/redirecionar/],['redirect-manifest',/redirecionar/],['encoded-feed',/redirecionar/]]){const e=await engine(label);await configure(e,label);await expect(label,()=>e.execute('update_check'),pattern);check('failed-check-not-available-'+label,e.summary().status==='error'&&!e.checked);}
  for(const [label,pattern]of [['bad-hash',/Hash ou tamanho/],['oversize',/tamanho permitido|tamanho assinado/],['chunked-oversize',/tamanho permitido|tamanho assinado/],['redirect-file',/redirecionar/],['truncated-file',/aborted|terminated|socket|reset|Hash ou tamanho/i],['version-mismatch',/version.json diverge/]]){const e=await engine(label);e.label=label;await configure(e,label);await e.execute('update_check');await expect(label,()=>e.execute('update_download'),pattern);check('failed-download-state-safe-'+label,e.summary().status==='error'&&!e.summary().packagePath);await noStage(e);}
  await expect('trusted-CA-wrong-hostname-rejected',()=>httpsBytes(new URL(wrongOrigin+'/cases/good/feed.json'),65536),/altname|altnames|hostname|IP|certificate/i);
  await expect('HTTPS-request-timeout-bounded',()=>httpsBytes(new URL(origin+'/slow'),65536,{timeout:200}),/esgotado/);
  for(const [name,url]of [['http-not-accepted','http://127.0.0.1/feed.json'],['credentials-not-accepted',origin.replace('https://','https://user:pass@')+'/feed.json'],['query-not-accepted',origin+'/feed.json?token=own'],['fragment-not-accepted',origin+'/feed.json#own']]){assert.throws(()=>updateURL(url));check(name,true);}
 }
 const report={status:'PASS',mode,checks,at:new Date().toISOString(),TLSGuard:'rejectUnauthorized=true; no product transport injection',trust:mode==='trusted'?'NODE_EXTRA_CA_CERTS for this QA subprocess only':'Default system trust; own development CA omitted'};await fs.writeFile(join(root,'receipt-'+mode+'.json'),JSON.stringify(report,null,2),{flag:'wx'});console.log(JSON.stringify({status:'PASS',mode,checks:checks.length}));
}catch(e){await fs.writeFile(join(root,'receipt-'+mode+'-fail.json'),JSON.stringify({status:'FAIL',mode,error:e.message,checks},null,2),{flag:'wx'});console.error(e.stack);process.exitCode=1;}
