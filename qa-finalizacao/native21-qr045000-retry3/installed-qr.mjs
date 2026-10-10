import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,cp,rename,lstat,access} from 'node:fs/promises';
import {join,resolve,relative,isAbsolute} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const here=fileURLToPath(new URL('.',import.meta.url)),run=promisify(execFile),hash=b=>createHash('sha256').update(b).digest('hex');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
export async function validateInstalledQr({root,obs,apiPort}){
 const out=join(root,'qa-qr-evidence');await mkdir(out,{recursive:false});
 const receipt={status:'RUNNING',installedApi:true,renderEngine:'Native obs-browser / CEF',captures:[],operatorTouched:false,outputsStarted:false};
 try{
  const require=createRequire('C:/Users/eddyr/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json'),JSZip=require('jszip');
  const xml='<Composition Width="640" Height="360"><QRCode Name="Link" Dimensions="170,170,0" Location="24,32,0" Text="FreeMix"/><Path Name="OwnPath" Dimensions="60,40,0" Location="220,32,0" Data="M0 0 L60 0 L30 40 Z"/></Composition>';
  const zip=new JSZip();zip.file('document.xml',xml);const source=join(out,'own-qr.gtzip'),bytes=await zip.generateAsync({type:'nodebuffer'});await writeFile(source,bytes,{flag:'wx'});receipt.fixtureSha256=hash(bytes);
  const control=async(action,data={})=>{const response=await fetch('http://127.0.0.1:'+apiPort+'/api/control',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...data}),signal:AbortSignal.timeout(90000)});const result=await response.json();assert(response.ok&&result.success,result.error||action+' failed');return action.startsWith('gc_library_')?result.gcLibrary:result.recovery;};
  const gt=payload=>control('gc_library_import',{payload:{format:1,kind:'freemix-gtzip-import',...payload}});
  const before=(await obs.req('GetSceneList')).scenes.map(s=>s.sceneUuid).sort();
  const preview=await gt({operation:'preview',sourcePath:source});assert.equal(preview.sourceSha256,hash(bytes));
  const imported=await gt({operation:'import',sourcePath:source,expectedSha256:preview.sourceSha256,name:'QA Own Offline QR'});assert(imported.imported&&!imported.scenesCreated&&!imported.outputsStarted);const id=imported.id;assert.match(id,/^[a-f0-9-]{36}$/);receipt.id=id;
  assert.deepEqual((await obs.req('GetSceneList')).scenes.map(s=>s.sceneUuid).sort(),before);
  const {verifyImportedGtTitle}=await import(pathToFileURL(join(root,'ferramentas/gc-gtzip.mjs')).href);
  const scope=(await obs.req('GetSceneCollectionList')).currentSceneCollectionName;
  const recordFor=async name=>{const metadata=join(root,'config/obs-studio/plugin_config/freemix-gc',hash(name).slice(0,24)+'.json'),state=JSON.parse(await readFile(metadata,'utf8'));const record=state.imports.find(r=>r.id===id);assert(record);return record;};
  let record=await recordFor(scope),manifest=await verifyImportedGtTitle(join(root,'painel'),record);for(const name of ['gc.js','gt-qr.js','QR-LICENSE.txt'])assert(manifest.files.some(f=>f.path===name),name+' must be self-contained');receipt.immutableDependencies=manifest.files.map(f=>({path:f.path,sha256:f.sha256}));
  const decoder=resolve(here,'../gtzip-qr/decode.py'),python='C:/Users/eddyr/AppData/Local/Programs/Python/Python310/python.exe';await access(decoder);await access(python);
  const waitProgram=async name=>{for(let n=0;n<80;n++){const state=await fetch('http://127.0.0.1:'+apiPort+'/api/json').then(r=>r.json());if(state.program===name)return;await sleep(100);}throw Error('Installed API program did not converge');};
  const capture=async(label,input,expected)=>{const originalProgram=(await obs.req('GetCurrentProgramScene')).currentProgramSceneName,scene=input.replace(/ HTML$/,'');assert((await obs.req('GetSceneList')).scenes.some(s=>s.sceneName===scene));receipt.ownProgramActivation=true;receipt.waitBeforeActivationMs=5000;await sleep(5000);try{await obs.req('SetCurrentProgramScene',{sceneName:scene});await waitProgram(scene);const active=await obs.req('GetSourceActive',{sourceName:input});assert(active.videoActive,'QA source did not become active');const expectedFile=join(out,label+'.txt');await writeFile(expectedFile,expected,{flag:'wx'});const attemptRecords=[];for(let i=0;i<12;i++){await sleep(1000);const settings=await obs.req('GetInputSettings',{inputName:input});assert.equal(settings.inputKind,'browser_source');assert(settings.inputSettings.url.startsWith('file:'));const shot=await obs.req('GetSourceScreenshot',{sourceName:input,imageFormat:'png',imageWidth:640,imageHeight:360});assert.match(shot.imageData,/^data:image\/png;base64,/);const png=Buffer.from(shot.imageData.split(',')[1],'base64'),file=join(out,label+'-'+i+'.png');await writeFile(file,png,{flag:'wx'});let decoded;try{decoded=JSON.parse((await run(python,[decoder,file,expectedFile],{windowsHide:true,maxBuffer:65536})).stdout.trim());}catch(e){try{decoded=JSON.parse(String(e.stdout).trim());}catch{decoded={matches:false,decoderError:'Independent decoder failed'};}}attemptRecords.push({path:file,sha256:hash(png),...decoded});if(decoded.matches){receipt.captures.push({label,input,expectedSha256:hash(expected),attempts:attemptRecords});return;}}receipt.captures.push({label,input,attempts:attemptRecords});throw Error('CEF QR did not decode expected fixture value: '+label);}finally{await obs.req('SetCurrentProgramScene',{sceneName:originalProgram});await waitProgram(originalProgram);assert(!(await obs.req('GetOutputList')).outputs.some(o=>o.outputActive));}};
  let prepared=await gt({operation:'prepare',id});assert(prepared.prepared&&!prepared.outputsStarted);await capture('initial',prepared.input,'FreeMix');
  const updated='São Paulo — https://example.invalid/live';const saved=await gt({operation:'save',id,values:{Link:updated}});assert(saved.saved&&!saved.scenesCreated);prepared=await gt({operation:'prepare',id});await capture('updated',prepared.input,updated);
  const backup=await control('recovery_backup',{includeMedia:true});assert(backup.id&&backup.mediaIncluded);for(const filename of ['index.html','gc.js','gt-qr.js','QR-LICENSE.txt'])assert(backup.assets.some(a=>a.original.includes('gt_'+id)&&a.original.endsWith(filename)),filename+' must be backed up');
  const projectPath=join(out,backup.id+'.fmx');await cp(join(root,'projetos/recuperacao',backup.id+'.fmx'),projectPath,{recursive:true,errorOnExist:true,force:false});receipt.backupManifestSha256=hash(await readFile(join(projectPath,'manifest.json')));
  const folder=join(root,'painel/gc/gt_titles','gt_'+id);const rel=relative(resolve(root),resolve(folder));assert(rel&&!rel.startsWith('..')&&!isAbsolute(rel));for(const target of [source,folder]){assert(!(await lstat(target)).isSymbolicLink());await rename(target,target+'.qa-hidden');}assert.equal(await access(source).then(()=>true,()=>false),false);assert.equal(await access(folder).then(()=>true,()=>false),false);receipt.originalGtzipAndConvertedFolderUnavailable=true;
  const name='QA QR Restored '+Date.now(),plan=await control('recovery_import_preview',{projectPath,name});assert(plan.manifestHash);const restored=await control('recovery_import',{projectPath,name,expectedManifestHash:plan.manifestHash});assert(restored.imported&&!restored.outputsStarted&&!restored.automationsStarted&&!restored.credentialsCopied);assert.equal((await obs.req('GetSceneCollectionList')).currentSceneCollectionName,name);
  record=await recordFor(name);assert.equal(record.values.Link,updated);await verifyImportedGtTitle(join(root,'painel'),record);prepared=await gt({operation:'prepare',id});await capture('recovered',prepared.input,updated);
  assert(!(await obs.req('GetOutputList')).outputs.some(o=>o.outputActive));assert.equal((await obs.req('GetRecordStatus')).outputActive,false);assert.equal((await obs.req('GetStreamStatus')).outputActive,false);
  receipt.status='PASS';receipt.recoveryCollection=name;receipt.limits=['Synthetic own QR and path only; no licensed reference assets','CEF source screenshot decodes actual payload; no all-dialog visual approval','No physical devices or live outputs used'];
 }catch(e){receipt.status='FAIL';receipt.error=String(e.message);throw e;}
 finally{receipt.at=new Date().toISOString();await writeFile(join(out,'receipt.json'),JSON.stringify(receipt,null,2),{flag:'wx'});}
 return receipt;
}
