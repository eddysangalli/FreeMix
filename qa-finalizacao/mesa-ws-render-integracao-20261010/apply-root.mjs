import fs from 'node:fs/promises';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import vm from 'node:vm';
const base='qa-finalizacao/mesa-ws-render-integracao-20261010',sha=b=>createHash('sha256').update(b).digest('hex');
const allow=JSON.parse(await fs.readFile(base+'/ALLOWLIST.json'));assert.equal(allow.checks,19);assert.equal(allow.result,'PASS_DRAFT_CONTRACT_NO_NATIVE');
for(const f of allow.files)assert.equal(sha(await fs.readFile(base+'/'+f.path)),f.sha256,f.path);
const file='FreeMix/painel/mesa.html',before=await fs.readFile(file),after=await fs.readFile(base+'/draft-mesa.html');
assert.equal(sha(before),'6d1d2b76c4dfdb21cb12a03aa6f86dd4bd1927bfdc17e46910e456196bd787c9');assert.equal(sha(after),'b4406f2a3051ebac406aeeccfe3c5a5107e6589a073289a3dad7e914f3bfb14a');
let scripts=0;for(const match of after.toString().matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))if(match[1].trim()){new vm.Script(match[1]);scripts++;}
await fs.writeFile(file,after);
await fs.writeFile(base+'/ALLOWLIST-APPLIED-ROOT.json',JSON.stringify({status:'APPLIED_SOURCE_WS_RENDER_ONLY_NATIVE_BROWSER_QA_PENDING',at:new Date().toISOString(),file,before:sha(before),after:sha(after),scriptsParsed:scripts,checks:19,operatorTouched:false,sealedPackagesTouched:false},null,2),{flag:'wx'});
for(const f of [...allow.files,{path:'ALLOWLIST.json'},{path:'ALLOWLIST-APPLIED-ROOT.json'},{path:'apply-root.mjs'}]){const out='FreeMix/'+base+'/'+f.path;await fs.mkdir(out.replace(/[^/]+$/,''),{recursive:true});await fs.copyFile(base+'/'+f.path,out);}
await fs.appendFile('FreeMix/.gitattributes','\nqa-finalizacao/mesa-ws-render-integracao-20261010/** -text -whitespace\n');
console.log(JSON.stringify({status:'APPLIED',scriptsParsed:scripts,checks:19,operatorTouched:false}));
