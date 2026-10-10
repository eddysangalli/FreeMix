import fs from 'node:fs/promises';import os from 'node:os';import path from 'node:path';import assert from 'node:assert/strict';import vm from 'node:vm';import {createHash} from 'node:crypto';import {spawnSync} from 'node:child_process';
const base='qa-finalizacao/operacao-responsiva-20261010',sha=b=>createHash('sha256').update(b).digest('hex');
for(const name of ['ALLOWLIST-DRAFT.json','ALLOWLIST-API-PUBLIC.json']){const a=JSON.parse(await fs.readFile(base+'/'+name));for(const f of a.files||a.pins)assert.equal(sha(await fs.readFile(base+'/'+f.path)),f.sha256,f.path);}
const work=await fs.mkdtemp(path.join(os.tmpdir(),'FreeMix-QA-MergeOperations-')),before=new Map();
for(const relative of ['painel/mesa.html','ferramentas/controle-producao.mjs','ferramentas/servidor-api.mjs']){const bytes=await fs.readFile('FreeMix/'+relative);before.set(relative,bytes);await fs.mkdir(path.dirname(path.join(work,relative)),{recursive:true});await fs.writeFile(path.join(work,relative),bytes.toString().replaceAll('\r\n','\n'));}
assert.equal(sha(before.get('painel/mesa.html')),'b4406f2a3051ebac406aeeccfe3c5a5107e6589a073289a3dad7e914f3bfb14a');
// The backend/API still need their exact frozen baselines; mesa intentionally includes the separately reviewed render patch.
for(const name of ['controle-producao.mjs','servidor-api.mjs']){const actual=before.get('ferramentas/'+name),frozen=await fs.readFile(base+'/baseline-canonical/'+name);assert.equal(sha(actual),sha(frozen),name);}
for(const patch of ['mesa.html.patch','controle-producao.mjs.patch','servidor-api-public-combined.patch']){
 const file=path.join(work,patch);await fs.writeFile(file,(await fs.readFile(base+'/'+patch,'utf8')).replaceAll('\r\n','\n'));
 for(const check of [true,false]){const r=spawnSync('git',['-c','core.autocrlf=false','apply',...(check?['--check']:[]),file],{cwd:work,encoding:'utf8',windowsHide:true});assert.equal(r.status,0,r.stderr);}
}
const merged=[];
for(const [relative,bytes] of before){const after=await fs.readFile(path.join(work,relative));
 if(relative.endsWith('.mjs')){const r=spawnSync(process.execPath,['--check',path.join(work,relative)],{encoding:'utf8',windowsHide:true});assert.equal(r.status,0,r.stderr);}else{for(const match of after.toString().matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))if(match[1].trim())new vm.Script(match[1]);assert.ok(after.toString().includes('function paintTileState()'));assert.ok(after.toString().includes('finish_input_panel'));}
 assert.equal(sha(await fs.readFile('FreeMix/'+relative)),sha(bytes),'Concurrent change '+relative);merged.push({path:relative,before:sha(bytes),after:sha(after),bytes:after.length});
}
for(const f of merged)await fs.copyFile(path.join(work,f.path),'FreeMix/'+f.path);
await fs.writeFile(base+'/ALLOWLIST-APPLIED-ROOT.json',JSON.stringify({status:'APPLIED_REVIEWED_OPERATIONS_WITH_RENDER_PATCH_NATIVE_QA_PENDING',at:new Date().toISOString(),files:merged,checks:{backendAndUI:31,apiError:6,apiPublicFields:8,renderWs:19},operatorTouched:false,sealedPackagesTouched:false,work},null,2),{flag:'wx'});
console.log(JSON.stringify({status:'APPLIED',files:merged,operatorTouched:false}));
