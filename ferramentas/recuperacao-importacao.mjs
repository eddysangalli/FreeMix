// Explicit .fmx directory import. Never opens the engine, downloads resources or copies installation credentials.
import {readFile,writeFile,mkdir,lstat,readdir,rename,rm} from 'node:fs/promises';
import {createReadStream,createWriteStream} from 'node:fs';
import {pipeline} from 'node:stream/promises';
import {resolve,join,dirname,basename,relative,isAbsolute} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash,randomUUID} from 'node:crypto';
import net from 'node:net';
import {RecoveryEngine,disableRecoveredAutomations} from './recuperacao-producao.mjs';
import {safeRecoveredMetadata,restoreGcAssets} from './recuperacao-estados.mjs';
import {restoreRemoteSources} from './recuperacao-remota.mjs';
import {installationPreflight} from './recuperacao-instalabilidade.mjs';

const digest=b=>createHash('sha256').update(b).digest('hex');
const scopeKey=name=>digest(name).slice(0,24);
const secretKey=/(?:password|passwd|passphrase|secret|token|credential|authorization|cookie|api[_-]?key|stream[_-]?key|access[_-]?key)|^(?:key|pin|login|username)$/i;
const nested=(root,path)=>{const rel=relative(root,path);return !rel||(!rel.startsWith('..')&&!isAbsolute(rel));};
export async function noRecoveryLinks(path){for(let p=resolve(path);;p=dirname(p)){const s=await lstat(p).catch(e=>{if(e.code==='ENOENT')return null;throw e;});if(s?.isSymbolicLink())throw Error('Links e junções não são aceitos no projeto ou destino');if(dirname(p)===p)break;}}
function safeRelative(path){if(typeof path!=='string'||!path||path.length>512||path.split('/').some(p=>!p||p==='.'||p==='..'||/[\\<>:"|?*\x00-\x1f]/.test(p)||/[. ]$/.test(p)||/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(p)))throw Error('Caminho de projeto inválido');return path;}
function publicURL(value){try{const u=new URL(value);if(!/^(?:https?|rtmps?|rtsp|srt|rist|udp|turns?):$/.test(u.protocol))return value;u.username='';u.password='';for(const k of [...u.searchParams.keys()])if(secretKey.test(k)||/^(?:auth|sid|session|streamid)$/i.test(k))u.searchParams.delete(k);return u.href;}catch{return value;}}
export function sanitizeImportedState(value,credentialContext=false){
 if(!value||typeof value!=='object')return value;
 const context=credentialContext||Object.hasOwn(value,'server')||Object.hasOwn(value,'protocol')||Object.hasOwn(value,'streamKey')||Object.hasOwn(value,'apiKey');
 for(const[k,v]of Object.entries(value)){
  if(secretKey.test(k)&&typeof v==='string'&&(k.toLowerCase()!=='key'||context))value[k]='';
  else if(/^(?:autoStart|autostart|startOnLaunch|runOnStartup|recordWhenStreaming|replayWhileStreaming|autoRecord|keepRecording|keepReplay)$/i.test(k))value[k]=typeof v==='boolean'?false:0;
  else if(typeof v==='string')value[k]=publicURL(v);
  else sanitizeImportedState(v,context||/^(?:destinations|credentials|authorization|authentication)$/i.test(k));
 }
 return value;
}
function disableImportedOutputs(value){if(!value||typeof value!=='object')return value;for(const[k,v]of Object.entries(value)){if(['enabled','active','running','autoStart','manuallyStarted'].includes(k)&&typeof v==='boolean')value[k]=false;else disableImportedOutputs(v);}return value;}
export function sanitizeImportedProfile(text,name){
 return String(text).split(/\r?\n/).map(line=>{const m=/^([^=;#]+)=(.*)$/.exec(line);if(!m)return line;const key=m[1].trim();if(key==='Name')return 'Name='+name;if(secretKey.test(key))return key+'=';if(/^(?:RecordWhenStreaming|KeepRecording|ReplayBufferWhileStreaming|KeepReplayBuffer|AutoStart|AutoRecord|StartReplayBuffer)$/i.test(key))return key+'=false';return key+'='+publicURL(m[2]);}).join('\n');
}
async function externalLoad(project){
 project=resolve(project);await noRecoveryLinks(project);const info=await lstat(project);
 if(!info.isDirectory()||!/^([a-f0-9-]{36})\.fmx$/i.test(basename(project)))throw Error('Selecione a pasta UUID.fmx criada pela Recuperação do FreeMix; arquivos ZIP não são executados nem extraídos');
 const id=basename(project).slice(0,-4),engine=new RecoveryEngine({root:dirname(project)});engine.directory=dirname(project);
 const raw=await readFile(join(project,'manifest.json'));if(raw.length>16*1024**2)throw Error('Manifesto de projeto excessivo');
 const loaded=await engine.load(id);let total=0;const names=new Set();
 for(const f of loaded.manifest.files){safeRelative(f.path);const lower=f.path.toLowerCase();if(names.has(lower))throw Error('Arquivos do projeto colidem no Windows');names.add(lower);total+=f.size;if(total>2*1024**3)throw Error('Projeto excede 2 GB');}
 for(const d of loaded.manifest.directories||[])safeRelative(d.path);
 return {...loaded,project,manifestHash:digest(raw),bytes:total};
}
export async function inspectRecoveryImport(root,project,{name}={}){
 root=resolve(root);await noRecoveryLinks(root);const loaded=await externalLoad(project);if(nested(loaded.project,root)||nested(root,loaded.project))throw Error('Origem e destino de importação devem ser separados, sem aninhamento');
 const collection=JSON.parse(loaded.files.get('collection.json'));if(!Array.isArray(collection.sources)||!collection.sources.length)throw Error('Projeto sem fontes');
 const proposed=String(name||loaded.manifest.name+' importado').trim();if(!proposed||proposed.length>80||/[\x00-\x1f]/.test(proposed))throw Error('Informe um nome novo de até 80 caracteres');
 const sceneFolder=join(root,'config/obs-studio/basic/scenes');for(const f of await readdir(sceneFolder,{withFileTypes:true}).catch(()=>[])){if(f.isFile()&&f.name.endsWith('.json')){const parsed=JSON.parse(await readFile(join(sceneFolder,f.name),'utf8'));if(parsed.name===proposed)throw Error('Esse nome de produção já existe no destino');}}
 const bundled=new Set((loaded.manifest.assets||[]).map(a=>String(a.original).replaceAll('\\','/').toLowerCase()));
 const dependencies=[];for(const dependency of loaded.manifest.dependencies||[]){const covered=bundled.has(String(dependency.path).replaceAll('\\','/').toLowerCase())||(loaded.manifest.directories||[]).some(d=>nested(resolve(d.original),resolve(dependency.path)));let status='missing';if(covered)status='bundled';else {const stat=await lstat(dependency.path).catch(()=>null);status=stat?.isSymbolicLink()?'link-refused':stat?.isFile()?'external-file':stat?.isDirectory()?'external-directory':'missing';}dependencies.push({path:dependency.path,status});}
 const plugins=loaded.manifest.inventory?.plugins||[],preflight=await installationPreflight(root,plugins);
 return {success:true,preview:true,project:loaded.project,manifestHash:loaded.manifestHash,name:proposed,sourceName:loaded.manifest.name,files:loaded.manifest.files.length,bytes:loaded.bytes,dependencies,plugins:preflight,devices:loaded.manifest.inventory?.devices||[],fonts:loaded.manifest.inventory?.fonts?.requestedFaces||[],appStarted:false,originalPreserved:true,credentialsCopied:false,limit:'Importação de projeto local verificado por hashes; não instala plugins/fontes/drivers nem homologa dispositivos. Recursos externos ausentes precisam de mapeamento e conferência. A mídia copiada pelo usuário pode conter dados privados.'};
}
export async function stageRecoveryImport(root,project,options={}){
 const preview=await inspectRecoveryImport(root,project,options);if(!options.expectedManifestHash||options.expectedManifestHash!==preview.manifestHash)throw Error('Confira a prévia do projeto antes de confirmar a importação');
 const loaded=await externalLoad(project);if(loaded.manifestHash!==preview.manifestHash)throw Error('O projeto mudou durante a importação');
 const directory=join(resolve(root),'projetos/recuperacao');await noRecoveryLinks(directory);await mkdir(directory,{recursive:true});
 const id=randomUUID(),folder=join(directory,id+'.fmx'),temp=folder+'.tmp';await mkdir(temp);const files=[],sourceFiles=new Map();
 try{
  for(const f of loaded.manifest.files){const path=join(temp,safeRelative(f.path));await mkdir(dirname(path),{recursive:true});const entry=loaded.files.get(f.path);let data;
   if(f.path==='collection.json')data=Buffer.from(JSON.stringify(disableRecoveredAutomations(sanitizeImportedState(JSON.parse(entry))),null,2));
   else if(f.path.startsWith('metadata/')){const state=safeRecoveredMetadata(basename(f.path,'.json'),sanitizeImportedState(JSON.parse(entry),/^(?:metadata\/native-output-config|metadata\/freemix-output)/.test(f.path)));if(f.path==='metadata/native-output-config.json')disableImportedOutputs(state);data=Buffer.from(JSON.stringify(state,null,2));}
   else if(f.path.startsWith('profile/')){if(f.path.endsWith('.ini'))data=Buffer.from(sanitizeImportedProfile(entry.toString('utf8'),preview.name+' · importado'));else{const state=sanitizeImportedState(JSON.parse(entry),/^profile\/(?:service|freemix-destinos)(?:\.|$)/i.test(f.path));if(/^profile\/freemix-destinos(?:\.|$)/i.test(f.path))disableImportedOutputs(state);data=Buffer.from(JSON.stringify(state,null,2));}}
   else if(entry?.source){await noRecoveryLinks(entry.source);await pipeline(createReadStream(entry.source),createWriteStream(path,{flags:'wx'}));const h=createHash('sha256');for await(const b of createReadStream(path))h.update(b);if(h.digest('hex')!==f.sha256)throw Error('Mídia mudou durante importação');files.push({...f});sourceFiles.set(f.path,{source:path});continue;}
   else throw Error('Conteúdo de projeto inesperado');
   await writeFile(path,data,{flag:'wx'});files.push({path:f.path,size:data.length,sha256:digest(data)});sourceFiles.set(f.path,data);
  }
  for(const d of loaded.manifest.directories||[])await mkdir(join(temp,safeRelative(d.path)),{recursive:true});
  const manifest=sanitizeImportedState({...loaded.manifest,id,schema:2,files,kind:'import',name:preview.name,createdAt:Date.now(),sourceManifestHash:preview.manifestHash,credentialsRemoved:true,autoStartDisabled:true,sessionId:null});
  const encoded=JSON.stringify(manifest,null,2);await writeFile(join(temp,'manifest.json'),encoded,{flag:'wx'});await writeFile(join(temp,'manifest.sha256'),digest(encoded),{flag:'wx'});await rename(temp,folder);
  return {id,folder,preview,manifest};
 }catch(e){if(!nested(directory,temp)||temp===directory)throw Error('Destino temporário inseguro');await noRecoveryLinks(temp);await rm(temp,{recursive:true,force:true});throw e;}
}
function remapState(value,mapping){if(!value||typeof value!=='object')return;for(const[k,v]of Object.entries(value)){if(typeof v==='string'){const mapped=mapping.get(v.replaceAll('\\','/').toLowerCase());if(mapped)value[k]=mapped;else if(/^file:\/\//i.test(v)){try{const u=new URL(v),m=mapping.get(fileURLToPath(u).replaceAll('\\','/').toLowerCase());if(m)value[k]=pathToFileURL(m).href+u.search+u.hash;}catch{}}}else remapState(v,mapping);}}
function updateIni(text,section,values){const lines=String(text).split(/\r?\n/),out=[];let current='',found=false,remaining={...values};const flush=()=>{for(const[k,v]of Object.entries(remaining))out.push(k+'='+v);remaining={};};for(const line of lines){const match=/^\[([^\]]+)\]$/.exec(line.trim());if(match){if(current===section)flush();current=match[1];if(current===section)found=true;}const field=/^([^=]+)=/.exec(line);if(current===section&&field&&Object.hasOwn(remaining,field[1])){out.push(field[1]+'='+remaining[field[1]]);delete remaining[field[1]];}else out.push(line);}if(current===section)flush();if(!found){out.push('['+section+']');flush();}return out.join('\n');}
export async function importRecoveryOffline(root,project,options={}){
 root=resolve(root);await noRecoveryLinks(root);const receiptPath=join(root,'installation.json'),receipt=JSON.parse(await readFile(receiptPath,'utf8'));if(receipt.status!=='installed'||resolve(receipt.root)!==root||receipt.appStarted!==false)throw Error('Importação offline exige instalação nova com recibo válido');
 for(const port of [receipt.apiPort,receipt.wsPort]){if(!Number.isInteger(port)||port<1||port>65535)throw Error('Recibo com portas inválidas');await new Promise((done,reject)=>{const server=net.createServer();server.once('error',()=>reject(Error('A instalação ou sua porta está em uso; feche a instalação antes da importação offline')));server.listen({host:'127.0.0.1',port,exclusive:true},()=>server.close(done));});}
 if(await lstat(join(root,'project-import.json')).catch(()=>null))throw Error('Esta instalação já importou um projeto; use Recuperação para criar outra produção');
 const staged=await stageRecoveryImport(root,project,options),engine=new RecoveryEngine({root}),loaded=await engine.load(staged.id),collection=JSON.parse(loaded.files.get('collection.json')),name=staged.preview.name,token='FreeMix_Import_'+staged.id.replaceAll('-',''),profileName=name+' · importado';
 const map=new Map((loaded.manifest.assets||[]).map(a=>[a.original.replaceAll('\\','/').toLowerCase(),loaded.files.get(a.path)?.source]));for(const d of loaded.manifest.directories||[])map.set(d.original.replaceAll('\\','/').toLowerCase(),join(staged.folder,d.path));
 collection.name=name;remapState(collection,map);const remoteDiagnostics=restoreRemoteSources(collection,loaded.manifest,loaded.files);disableRecoveredAutomations(collection);
 const scene=join(root,'config/obs-studio/basic/scenes',token+'.json'),profile=join(root,'config/obs-studio/basic/profiles',token);await noRecoveryLinks(scene);await noRecoveryLinks(profile);await mkdir(profile);
 let profileFound=false;for(const[path,content]of loaded.files){if(path.startsWith('profile/')){const data=path.endsWith('.ini')?sanitizeImportedProfile(content.toString('utf8'),profileName):content;await writeFile(join(profile,basename(path)),data,{flag:'wx'});if(path==='profile/basic.ini')profileFound=true;}}
 if(!profileFound){const existing=join(root,'config/obs-studio/basic/profiles/Estudio/basic.ini');await writeFile(join(profile,'basic.ini'),sanitizeImportedProfile(await readFile(existing,'utf8'),profileName),{flag:'wx'});}
 // Native uses this per-profile file. Preserve target/source settings with credentials and all output starts disabled.
 if(loaded.files.has('metadata/native-output-config.json')){const outputs=disableImportedOutputs(JSON.parse(loaded.files.get('metadata/native-output-config.json')));if(!Array.isArray(outputs.destinations)||outputs.destinations.length!==4)throw Error('Configuração nativa de destinos inválida');for(const d of outputs.destinations)Object.assign(d,{enabled:false,autoStart:false,active:false,manuallyStarted:false});await writeFile(join(profile,'freemix-destinos.json'),JSON.stringify({destinations:outputs.destinations},null,2));}
 for(const[path,content]of loaded.files){if(!path.startsWith('metadata/freemix-'))continue;const ns=basename(path,'.json'),state=safeRecoveredMetadata(ns,JSON.parse(content));remapState(state,map);if(ns==='freemix-macros')for(const t of state.triggers||[])t.enabled=false;if(['freemix-replay','freemix-iso'].includes(ns))Object.assign(state,{rec:false,markIn:null,linked:false,back:null,audioEnabled:false});const target=join(root,'config/obs-studio/plugin_config',ns,scopeKey(name)+'.json');await noRecoveryLinks(target);await mkdir(dirname(target),{recursive:true});await writeFile(target,JSON.stringify(state,null,2),{flag:'wx'});}
 await restoreGcAssets(root,loaded.manifest,loaded.files);await writeFile(scene,JSON.stringify(collection,null,2),{flag:'wx'});
 const userIni=join(root,'config/obs-studio/user.ini');await noRecoveryLinks(userIni);const original=await readFile(userIni,'utf8');await writeFile(userIni+'.pre-import',original,{flag:'wx'});await writeFile(userIni,updateIni(original,'Basic',{SceneCollection:name,SceneCollectionFile:token,Profile:profileName,ProfileDir:token}));
 const report={format:1,status:'imported',id:staged.id,name,profile:profileName,manifestHash:staged.preview.manifestHash,sourcePreserved:true,credentialsCopied:false,appStarted:false,outputsStarted:false,automationsStarted:false,dependencies:staged.preview.dependencies,plugins:staged.preview.plugins,devices:staged.preview.devices,fonts:staged.preview.fonts,remoteDiagnostics,outputConfigurationStatus:loaded.files.has('metadata/native-output-config.json')?'restored-disabled-in-new-profile':'profile-snapshot-only',createdAt:new Date().toISOString()};await writeFile(join(root,'project-import.json'),JSON.stringify(report,null,2),{flag:'wx'});return report;
}
if(resolve(process.argv[1]||'')===fileURLToPath(import.meta.url))try{const args=Object.fromEntries(process.argv.slice(2).map(a=>{const i=a.indexOf('=');return i<0?[a,true]:[a.slice(0,i),a.slice(i+1)];}));for(const k of Object.keys(args))if(!['--root','--project','--name','--apply','--expected-hash'].includes(k))throw Error('Argumento desconhecido');if(!args['--root']||!args['--project'])throw Error('Use --root=INSTALACAO --project=UUID.fmx [--name=NOME] para conferir; confirme com --apply --expected-hash=HASH_DA_PREVIA');const options={name:args['--name'],expectedManifestHash:args['--expected-hash']};console.log(JSON.stringify(args['--apply']?await importRecoveryOffline(args['--root'],args['--project'],options):await inspectRecoveryImport(args['--root'],args['--project'],options)));}catch(e){console.error('FreeMix: importação não concluída: '+e.message);process.exitCode=1;}
