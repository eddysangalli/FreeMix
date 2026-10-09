import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm,mkdir} from 'node:fs/promises';
import {join,resolve} from 'node:path';import {tmpdir} from 'node:os';import {createHash} from 'node:crypto';
import {inspectPackageComponents,copyPackageComponents} from '../ferramentas/pacote-componentes.mjs';
const scratch=await mkdtemp(join(tmpdir(),'FreeMix-QA-Package-Components-')), checks=[];
try {
 const original=join(scratch,'plugin.dll'),manifest=join(scratch,'components.json'),dest=join(scratch,'new-package');
 const bytes=Buffer.from('isolated packaging fixture'),sha256=createHash('sha256').update(bytes).digest('hex');await writeFile(original,bytes);await mkdir(dest);
 const file={source:original,target:'obs-plugins/64bit/example.dll',sha256,component:'example',sourceVersion:'fixture'};
 const save=async(files)=>writeFile(manifest,JSON.stringify({format:1,files}));
 await save([file]);const inspected=await inspectPackageComponents(manifest),receipt=await copyPackageComponents(dest,inspected);
 assert.deepEqual(await readFile(join(dest,file.target)),bytes);assert.deepEqual(await readFile(original),bytes);assert.equal(receipt[0].sha256,sha256);assert(!('source' in receipt[0]));checks.push('Componente verificado copiado só na nova raiz, origem preservada e recibo sem caminhos privados');
 await save([{...file,sha256:'0'.repeat(64)}]);await assert.rejects(inspectPackageComponents(manifest),/Hash/);
 await save([file,{...file}]);await assert.rejects(inspectPackageComponents(manifest),/duplicado/);
 for(const target of ['../config/local.js','config/obs-studio/user.ini','obs-plugins/64bit/../../oops.dll']){await save([{...file,target}]);await assert.rejects(inspectPackageComponents(manifest),/Destino/);}
 checks.push('Hash incorreto, caminhos de configuração, traversal e duplicatas rejeitados');
 await save([file]);const stale=await inspectPackageComponents(manifest);await writeFile(original,'changed after preflight');await assert.rejects(copyPackageComponents(dest,stale),/mudou durante/);checks.push('Arquivo alterado entre prévia e cópia impede selar pacote');
 const final={status:'PASS',at:new Date().toISOString(),operatorTouched:false,checks};await writeFile('qa-finalizacao/resultado-package-components.json',JSON.stringify(final,null,2));console.log(JSON.stringify(final));
}finally{assert(resolve(scratch).startsWith(resolve(tmpdir())+'\\'));await rm(scratch,{recursive:true,force:true});}
