import fs from 'node:fs/promises';import {join,resolve} from 'node:path';import {createHash} from 'node:crypto';
const qa=import.meta.dirname,root=resolve(qa,'../..'),sha=b=>createHash('sha256').update(b).digest('hex');
const report=JSON.parse(await fs.readFile(join(qa,'resultado.json')));if(report.status!=='PASS'||report.checks!==50||!report.sourceUnchanged)throw Error('QA not PASS');
for(const p of report.productPins)if(sha(await fs.readFile(join(root,p.path)))!==p.sha256)throw Error('Product changed after QA: '+p.path);
const names=['test.mjs','child.mjs','freeze.mjs','README.md','resultado.json','resultado-trusted.json','resultado-untrusted.json'];
const files=await Promise.all(names.map(async n=>{const b=await fs.readFile(join(qa,n));return{path:'qa-finalizacao/update-https-local/'+n,size:b.length,sha256:sha(b)};}));
await fs.writeFile(join(qa,'ALLOWLIST.json'),JSON.stringify({status:'PASS_HTTPS_LOCAL_NO_PRODUCT_CHANGE',at:new Date().toISOString(),checks:report.checks,productFiles:[],files,productPins:report.productPins,notes:'Only seven text QA artifacts; no certificates/private keys/media/raw logs/package/operator'},null,2),{flag:'wx'});
console.log(JSON.stringify({status:'PASS',files:files.length,allowlistSha256:sha(await fs.readFile(join(qa,'ALLOWLIST.json')))}));
