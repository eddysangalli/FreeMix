import fs from 'node:fs/promises';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const base='qa-finalizacao/ux-operacao-v2-20261010',sha=b=>createHash('sha256').update(b).digest('hex');
const result=JSON.parse(await fs.readFile(base+'/test/result.json'));assert.equal(result.status,'PASS_DOM_VM_NO_NATIVE');assert.equal(result.checks,22);
for(const f of result.pins)assert.equal(sha(await fs.readFile(base+'/'+f.path)),f.sha256,f.path);
for(const n of ['saidas.html','saidas.js','saidas-contexto-ui.js','saidas-srt-conexao-ui.js'])assert.equal(sha(await fs.readFile('FreeMix/painel/remoto/'+n)),sha(await fs.readFile(base+'/panel/'+n)),n);
const file='FreeMix/painel/remoto/saidas-operacao-ui.js',before=await fs.readFile(file),after=await fs.readFile(base+'/draft/saidas-operacao-ui.js');assert.equal(sha(before),'1ae1d0987cc058a22f3038b43efe92dcd31404002957622c44aea90b5e266827');
await fs.writeFile(file,after);
await fs.writeFile(base+'/ALLOWLIST-APPLIED.json',JSON.stringify({status:'APPLIED_CANONICAL_DEFAULTS_ONLY',at:new Date().toISOString(),files:[{path:file,before:sha(before),after:sha(after)}],checks:22,operatorTouched:false,sealedPackagesTouched:false},null,2),{flag:'wx'});
const files=[];for(const p of ['PROVENANCE.json','apply-root.mjs','ALLOWLIST-APPLIED.json','test/dom.mjs','test/outputs-vm.mjs','test/result.json','draft/saidas-operacao-ui.js','draft/operacao.css',...['saidas.html','saidas.js','saidas-contexto-ui.js','saidas-srt-conexao-ui.js'].map(p=>'panel/'+p)]){const b=await fs.readFile(base+'/'+p);files.push({path:p,bytes:b.length,sha256:sha(b)});}
await fs.writeFile(base+'/ALLOWLIST.json',JSON.stringify({status:'FROZEN_APPLIED_22PASS',at:new Date().toISOString(),files,physicalNativeChanges:false},null,2),{flag:'wx'});
for(const f of [...files,{path:'ALLOWLIST.json'}]){await fs.mkdir('FreeMix/'+base+'/'+f.path.replace(/[^/]+$/,''),{recursive:true});await fs.copyFile(base+'/'+f.path,'FreeMix/'+base+'/'+f.path);}
await fs.appendFile('FreeMix/.gitattributes','\nqa-finalizacao/ux-operacao-v2-20261010/** -text -whitespace\n');
console.log('PASS:22 contracts, applied canonical MultiStream Program default without opening outputs');
