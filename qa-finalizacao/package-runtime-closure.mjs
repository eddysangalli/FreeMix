import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {runInNewContext} from 'node:vm';
import {runtimeDependencyClosure} from '../ferramentas/pacote-dependencias.mjs';
const source=await readFile('ferramentas/empacotar-limpo.mjs','utf8');
const literal=source.match(/const runtimeTools=(\[[^;]+\]);/)[1];
assert.match(literal,/^[\[\]'",.\w\s/-]+$/);
const entries=Array.from(runInNewContext(literal,Object.create(null),{timeout:1000}));
const actual=await runtimeDependencyClosure('ferramentas',entries,{copiedModuleRoots:[resolve('painel')]});
for(const critical of ['diagnostico-producao.mjs','diagnostico-zip.mjs','ndi-runtime.mjs','gc-html-producao.mjs','recuperacao-importacao.mjs','replay-preview.mjs','pacote-dependencias.mjs'])assert(actual.includes(critical),critical);
const scratch=await mkdtemp(join(tmpdir(),'FreeMix-QA-Closure-'));
try {
  await writeFile(join(scratch,'entry.mjs'),"import './missing.mjs';\n");
  await assert.rejects(runtimeDependencyClosure(scratch,['entry.mjs']),/ENOENT/);
  await writeFile(join(scratch,'entry.mjs'),"import '../outside.mjs';\n");
  await assert.rejects(runtimeDependencyClosure(scratch,['entry.mjs']),/fora das ferramentas/);
  await assert.rejects(runtimeDependencyClosure(scratch,['../outside.mjs']),/fora das ferramentas/);
}finally{assert(resolve(scratch).startsWith(resolve(tmpdir())+'\\'));await rm(scratch,{recursive:true,force:true});}
const receipt={status:'PASS',at:new Date().toISOString(),operatorTouched:false,sourceModulesNotExecuted:true,allowlistCount:entries.length,runtimeCount:actual.length,added:actual.filter(f=>!entries.includes(f)),missingAndTraversalRejected:true};
await writeFile('qa-finalizacao/resultado-package-runtime-closure.json',JSON.stringify(receipt,null,2));
console.log(JSON.stringify(receipt,null,2));
