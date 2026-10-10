import fs from 'node:fs/promises';import path from 'node:path';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const root=path.resolve('.'),qa=path.join(root,'qa-finalizacao/ux-operacao-20261010'),target=path.join(root,'FreeMix/painel/remoto');
const hash=b=>createHash('sha256').update(b).digest('hex'),result=JSON.parse(await fs.readFile(path.join(qa,'test/result.json'),'utf8'));
assert.equal(result.status,'PASS_DOM_VM_NO_NATIVE');assert.equal(result.checks,21);
for(const pin of result.pins)assert.equal(hash(await fs.readFile(path.join(qa,pin.path))),pin.sha256,pin.path);
const files=[];
for(const name of ['saidas.html','saidas.js','saidas-contexto-ui.js','saidas-srt-conexao-ui.js']){
 const original=await fs.readFile(path.join(root,'obs-vmix/painel/remoto',name));
 assert.equal(hash(await fs.readFile(path.join(target,name))),hash(original),'Canonical baseline changed '+name);
 files.push({path:'painel/remoto/'+name,before:hash(original)});
}
for(const name of ['saidas-operacao-ui.js','operacao.css'])assert.equal(await fs.access(path.join(target,name)).then(()=>true,()=>false),false,'New file already exists');
let html=await fs.readFile(path.join(target,'saidas.html'),'utf8');
assert.equal(html.split('<script src="saidas-srt-simples-ui.js"></script>').length,2);
html=html.replace('<script src="saidas-srt-simples-ui.js"></script>','<script src="saidas-operacao-ui.js"></script>');
html=html.replace('</head>','<link rel="stylesheet" href="operacao.css"></head>');
assert.equal(hash(Buffer.from(html)),result.pins.find(f=>f.path==='panel/saidas.html').sha256,'Preview HTML differs');
await fs.writeFile(path.join(target,'saidas.html'),html);
for(const name of ['saidas-operacao-ui.js','operacao.css'])await fs.copyFile(path.join(qa,'draft',name),path.join(target,name));
for(const file of files)file.after=hash(await fs.readFile(path.join(root,'FreeMix',file.path)));
for(const name of ['saidas-operacao-ui.js','operacao.css'])files.push({path:'painel/remoto/'+name,before:null,after:hash(await fs.readFile(path.join(target,name)))});
await fs.writeFile(path.join(qa,'ALLOWLIST-APPLIED.json'),JSON.stringify({status:'APPLIED_CANONICAL_UI_ONLY_NATIVE_CEF_QA_PENDING',at:new Date().toISOString(),files,checks:21,operatorTouched:false,sealedPackagesTouched:false},null,2),{flag:'wx'});
console.log(JSON.stringify({applied:files.filter(f=>f.before!==f.after).map(f=>f.path),operatorTouched:false}));
