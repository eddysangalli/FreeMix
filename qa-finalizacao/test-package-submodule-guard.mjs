import fs from 'node:fs/promises';import os from 'node:os';import path from 'node:path';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';import {createHash} from 'node:crypto';
const hash=b=>createHash('sha256').update(b).digest('hex'),temp=await fs.mkdtemp(path.join(os.tmpdir(),'FreeMix-QA-PackageSubmoduleGuard-'));
const version='0.1.0-local.20261010031500',head='500ced5ea0928453f9f27dc7d5649531e2671e28',checks=[];
const selectedBefore=await fs.readFile('entregas/INSTALADOR-ATUAL.json');
try{
 await fs.cp('FreeMix/fork',temp+'/fork',{recursive:true});await fs.cp('FreeMix/docs/native-source',temp+'/docs/native-source',{recursive:true});await fs.mkdir(temp+'/scripts');await fs.copyFile('FreeMix/scripts/reconstruir-motor.mjs',temp+'/scripts/reconstruir-motor.mjs');
 const manifest=JSON.parse(await fs.readFile(temp+'/fork/manifest.json')),module=manifest.submodules.find(m=>m.path==='plugins/obs-browser');assert.equal(module.patches.length,1);
 const env={...process.env,FREEMIX_PACKAGE_VERSION:version,FREEMIX_NATIVE_COMMIT:head,FREEMIX_NATIVE_RUNDIR:path.resolve('qa-finalizacao/native-build-frozen-500ced5-configured'),FREEMIX_SOURCE_ROOT:temp,FREEMIX_PLUGIN_MANIFEST:path.resolve('qa-finalizacao/package-plugin-overlays.json')};
 for(const [label,relative] of [['patch','fork/'+module.patches[0].path],['raw-commit','fork/'+module.patches[0].rawCommitPath],['source-snapshot','docs/native-source/'+module.sourceFiles[0].path]]){
  const file=path.join(temp,relative),before=await fs.readFile(file);await fs.appendFile(file,'\nQA alteration');
  const r=spawnSync(process.execPath,['obs-vmix/ferramentas/empacotar-limpo.mjs','--check'],{env,windowsHide:true,encoding:'utf8',maxBuffer:2*1024*1024});assert.notEqual(r.status,0,label);assert.match(r.stderr,/SHA mismatch/);assert(!r.stdout.includes('SOURCE_READY'));await fs.writeFile(file,before);checks.push({label,refused:true,destinationCreated:false});
 }
 assert.equal(hash(await fs.readFile('entregas/INSTALADOR-ATUAL.json')),hash(selectedBefore));assert.equal(await fs.access('entregas/FreeMix-Completo-'+version).then(()=>true,()=>false),false);
 await fs.writeFile('qa-finalizacao/package-submodule-guard.json',JSON.stringify({status:'PASS',at:new Date().toISOString(),checks,version,head,selectedUnchanged:true,operatorTouched:false,externalNetworkStarted:false},null,2),{flag:'wx'});console.log(JSON.stringify({status:'PASS',negativeChecks:checks.length}));
}finally{const actual=await fs.realpath(temp);assert(actual.toLowerCase().startsWith((await fs.realpath(os.tmpdir())).toLowerCase()+path.sep));assert(path.basename(actual).startsWith('FreeMix-QA-PackageSubmoduleGuard-'));await fs.rm(actual,{recursive:true});}
