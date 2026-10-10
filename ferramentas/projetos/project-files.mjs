import {lstat,readFile,readdir,mkdir,open,rename} from 'node:fs/promises';
import {resolve,relative,join,sep} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
const fail=code=>{throw Object.assign(Error(code),{code});},sha=b=>createHash('sha256').update(b).digest('hex');
export async function checkedPath(root,path,{createParents=false}={}){
 root=resolve(root);path=resolve(path);const rel=relative(root,path);if(rel==='..'||rel.startsWith('..'+sep)||resolve(path)===root||rel.includes(':'))fail('PATH_OUTSIDE_ROOT');
 const roots=root.split(sep);let current=roots.shift()+sep;const rootStat=await lstat(root);if(!rootStat.isDirectory()||rootStat.isSymbolicLink())fail('ROOT_INVALID');
 for(const part of [...roots,...rel.split(sep)].filter(Boolean)){
  current=join(current,part);let st;try{st=await lstat(current);}catch(e){if(e.code!=='ENOENT')throw e;if(current===path)return path;if(!createParents||!relative(root,current)||relative(root,current).startsWith('..'))fail('PATH_PARENT_MISSING');await mkdir(current);st=await lstat(current);}
  if(st.isSymbolicLink())fail('REPARSE_PATH_REFUSED');if(current!==path&&!st.isDirectory())fail('PATH_PARENT_NOT_DIRECTORY');
 }
 return path;
}
export function createProjectJournalStore(root){
 const base=join(resolve(root),'config','obs-studio','plugin_config','freemix-project-wizard');
 const file=id=>{if(!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id))fail('OPERATION_ID_INVALID');return join(base,id+'.json');};
 return Object.freeze({async read(id){const target=await checkedPath(root,file(id),{createParents:true});try{const st=await lstat(target);if(!st.isFile()||st.size>2*1024**2)fail('LEDGER_FILE_INVALID');return JSON.parse(await readFile(target,'utf8'));}catch(e){if(e.code==='ENOENT')return null;throw e;}},async write(id,value){const target=await checkedPath(root,file(id),{createParents:true}),data=Buffer.from(JSON.stringify(value,null,2)+'\n');if(data.length>2*1024**2)fail('LEDGER_TOO_LARGE');const temp=await checkedPath(root,target+'.'+randomUUID()+'.tmp');const handle=await open(temp,'wx');try{await handle.writeFile(data);await handle.sync();}finally{await handle.close();}await checkedPath(root,target);await rename(temp,target);}});
}
// No writes to Native profile/collection files. Verify what the actual engine saved.
export async function verifySavedProject(root,ledger){
 const dir=await checkedPath(root,join(root,'config/obs-studio/basic/scenes'));
 const files=await readdir(dir);if(files.length>1000)fail('COLLECTION_FILE_LIMIT');let found;
 for(const name of files.filter(n=>n.endsWith('.json'))){const file=await checkedPath(root,join(dir,name)),st=await lstat(file);if(!st.isFile()||st.size>32*1024**2)fail('COLLECTION_FILE_INVALID');const bytes=await readFile(file),value=JSON.parse(bytes);if(value.name!==ledger.projectName)continue;if(found)fail('COLLECTION_NAME_AMBIGUOUS');found={file,bytes,value};}
 if(!found||!Array.isArray(found.value.sources))fail('SAVED_COLLECTION_NOT_FOUND');
 const sources=found.value.sources,expected=[...ledger.scenes,...(ledger.compositions||[])];for(const s of expected)if(!sources.some(v=>v.uuid===s.uuid&&v.name===(s.label||s.name)&&v.id==='scene'))fail('SAVED_SCENE_NOT_CONFIRMED');
 for(const cap of ledger.captures){const source=sources.find(v=>v.uuid===cap.uuid);if(!source||source.id!=='dshow_input'||source.settings?.active!==false||source.settings?.video_device_id!==cap.stableId||source.muted!==true||source.mixers!==0||source.monitoring_type!==0)fail('SAVED_CAPTURE_NOT_INACTIVE');}
 const profileDir=await checkedPath(root,join(root,'config/obs-studio/basic/profiles')),profiles=await readdir(profileDir);if(profiles.length>1000)fail('PROFILE_FILE_LIMIT');let profile;
 for(const name of profiles){const path=await checkedPath(root,join(profileDir,name));if(!(await lstat(path)).isDirectory())continue;const ini=await checkedPath(root,join(path,'basic.ini'));const st=await lstat(ini);if(!st.isFile()||st.size>1024**2)fail('PROFILE_FILE_INVALID');const bytes=await readFile(ini),sections={};let section='';for(const line of bytes.toString('utf8').replace(/^\uFEFF/,'').split(/\r?\n/)){const match=line.match(/^\[([^\]]+)\]$/);if(match){section=match[1];continue;}const i=line.indexOf('=');if(i>0)sections[section+':'+line.slice(0,i)]=line.slice(i+1);}if(sections['General:Name']!==ledger.projectName)continue;if(profile)fail('PROFILE_NAME_AMBIGUOUS');profile={bytes};}
 if(!profile)fail('SAVED_PROFILE_NOT_FOUND');
 return {verified:true,sceneCount:expected.length,capturesInactive:true,collectionSha256:sha(found.bytes),profileSha256:sha(profile.bytes)};
}
