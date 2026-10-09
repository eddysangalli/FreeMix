import assert from 'node:assert/strict';import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {join,resolve} from 'node:path';import {tmpdir} from 'node:os';import {randomUUID,createHash} from 'node:crypto';
import {gtRecoveryDependencies,restoreGtTitles} from '../ferramentas/recuperacao-gtzip.mjs';
const scratch=await mkdtemp(join(tmpdir(),'FreeMix-QA-Recovery-GT-')),checks=[];
try {
 const source=join(scratch,'original'),target=join(scratch,'new-installation'),id=randomUUID(),record={id,name:'Own fixture',values:{Image:'library:'+'f'.repeat(64)+'.png'}},metadata={imports:[record]};
 const dependencies=gtRecoveryDependencies(source,[metadata]);assert.equal(dependencies.length,2);assert(dependencies.some(d=>d.path.endsWith('gt_'+id)));assert(dependencies.some(d=>d.path.endsWith('f'.repeat(64)+'.png')));checks.push('Backup descobre pasta inteira de título não preparado e imagem library por token');
 const files=new Map([['metadata/freemix-gc.json',Buffer.from(JSON.stringify(metadata))]]),manifest={files:[],assets:[]};
 for(const [name,text] of [['index.html','<p>Own fixture</p>'],['manifest.json','{"format":1}'],['assets/example.png','own image bytes']]) {
   const original=join(source,'painel/gc/gt_titles','gt_'+id,name),path='media/'+name.replaceAll('/','_');await mkdir(join(original,'..'),{recursive:true});await writeFile(original,text);const bytes=Buffer.from(text);bytes.source=original;files.set(path,bytes);manifest.assets.push({original,path});manifest.files.push({path,size:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});
 }
 const copied=await restoreGtTitles(target,manifest,files);assert.equal(copied.restoredFiles,3);assert.equal(copied.titles,1);assert.equal(await readFile(join(target,'painel/gc/gt_titles','gt_'+id,'index.html'),'utf8'),'<p>Own fixture</p>');
 assert.equal((await restoreGtTitles(target,manifest,files)).restoredFiles,0);checks.push('Arquivos retornam à pasta canônica em instalação nova; segunda recuperação reutiliza bytes idênticos');
 const changed=join(target,'painel/gc/gt_titles','gt_'+id,'index.html');await writeFile(changed,'changed original');await assert.rejects(restoreGtTitles(target,manifest,files),/existente mudou/);assert.equal(await readFile(changed,'utf8'),'changed original');checks.push('Conteúdo existente diferente é preservado e impede sobrescrita');
 const empty={files:[],assets:[]};await assert.rejects(restoreGtTitles(join(scratch,'missing'),empty,files),/Backup sem/);
 const bad={...manifest,assets:[{original:join(source,'painel/gc/gt_titles','gt_'+id).replaceAll('\\','/')+'/../escape.html',path:manifest.assets[0].path}]};await assert.rejects(restoreGtTitles(join(scratch,'traversal'),bad,files),/Caminho/);
 await assert.rejects(restoreGtTitles(join(scratch,'bad-hash'),{...manifest,files:manifest.files.map(f=>({...f,sha256:'0'.repeat(64)}))},files),/mudou após/);checks.push('Título sem mídia, traversal e hash divergente são recusados antes de restaurar');
 const receipt={status:'PASS',at:new Date().toISOString(),operatorTouched:false,externalDataSent:false,checks};await writeFile('qa-finalizacao/resultado-recovery-gtzip.json',JSON.stringify(receipt,null,2));console.log(JSON.stringify(receipt));
}finally{assert(resolve(scratch).startsWith(resolve(tmpdir())+'\\'));await rm(scratch,{recursive:true,force:true});}
