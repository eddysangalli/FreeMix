import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawn,spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const root=path.resolve('.'),native=path.join(root,'freemix-app');
const requested=process.argv[2];assert.match(requested||'',/^[a-f0-9]{40}$/);
const git=args=>{const r=spawnSync('git',['-C',native,...args],{encoding:'utf8',windowsHide:true});assert.equal(r.status,0,r.stderr);return r.stdout.trim();};
assert.equal(git(['rev-parse','HEAD']),requested);assert.equal(git(['status','--porcelain','--untracked-files=no']),'');
assert.notEqual(requested,'fb98b14c071fa89146f74dc8c26157c2ce9026ee','Require actual remediation commit');
const build=path.join(native,'build_2026'),rundir=path.join(build,'rundir/RelWithDebInfo');
const cmake='C:/Program Files/Microsoft Visual Studio/18/Community/Common7/IDE/CommonExtensions/Microsoft/CMake/CMake/bin/cmake.exe';
const suffix=requested.slice(0,7)+'-configured',frozen=path.join(root,'qa-finalizacao/native-build-frozen-'+suffix);
const record=frozen+'.json',log=path.join(root,'qa-finalizacao/build-native-remediation-'+suffix+'.log');
for(const file of [frozen,record,log])assert.equal(await fs.access(file).then(()=>true,()=>false),false,'Preserve earlier artifacts: '+file);
const lockFile=path.join(build,'.freemix-build-lock'),lock=await fs.open(lockFile,'wx');
const started=new Date().toISOString();
try{
 await lock.writeFile(JSON.stringify({pid:process.pid,head:requested,started,scope:'Root production build, QA instrumentation OFF'}));
 const output=await fs.open(log,'wx');let exitCode;
 const run=args=>new Promise((resolve,reject)=>{
   const child=spawn(cmake,args,{cwd:native,env:{...process.env,_CL_:'/MP2'},windowsHide:true,stdio:['ignore',output.fd,output.fd]});child.once('error',reject);child.once('exit',resolve);
 });
 try{assert.equal(await run(['-S',native,'-B',build]),0,'Configuration failed');
   const versionSource=await fs.readFile(path.join(build,'libobs/obsversion.c'),'utf8');
   assert(versionSource.includes('-g'+requested.slice(0,7)),'Generated engine version must identify the requested commit');
   exitCode=await run(['--build',build,'--config','RelWithDebInfo','--target','obs-studio','rtmp-services','--parallel','2']);
 }finally{await output.close();}
 assert.equal(exitCode,0,'Build failed; inspect own new build log');
 assert.equal(git(['rev-parse','HEAD']),requested);assert.equal(git(['status','--porcelain','--untracked-files=no']),'');
 await fs.cp(rundir,frozen,{recursive:true,errorOnExist:true,force:false,filter:async source=>{
   const stat=await fs.lstat(source);assert.equal(stat.isSymbolicLink(),false,'No links in frozen runtime');
   return stat.isDirectory()||! /\.(?:pdb|ilk|log|dmp)$/i.test(source);
 }});
 const hash=async file=>createHash('sha256').update(await fs.readFile(file)).digest('hex'),files=[];
 async function walk(folder){for(const e of await fs.readdir(folder,{withFileTypes:true})){const file=path.join(folder,e.name);if(e.isDirectory())await walk(file);else{assert(e.isFile());files.push({path:path.relative(frozen,file).replaceAll('\\','/'),bytes:(await fs.stat(file)).size,sha256:await hash(file)});}}}
 await walk(frozen);files.sort((a,b)=>a.path.localeCompare(b.path));
 const names=['bin/64bit/FreeMix.exe','bin/64bit/obs.dll','bin/64bit/obs-frontend-api.dll','obs-plugins/64bit/decklink.dll','obs-plugins/64bit/obs-ffmpeg.dll','obs-plugins/64bit/rtmp-services.dll'];
 const pins=Object.fromEntries(names.map(name=>{const f=files.find(f=>f.path===name);assert(f,name);return[name,f.sha256];}));
 const receipt={status:'BUILD_FROZEN_FOR_QA_NOT_RELEASED',at:new Date().toISOString(),started,head:requested,root:frozen,pins,files,build:{exitCode,targets:['obs-studio','rtmp-services'],parallel:2,qaAllocatorInstrumentation:false,configureExplicit:true,generatedVersionSource:await fs.readFile(path.join(build,'libobs/obsversion.c'),'utf8'),log},operatorTouched:false,mediaApproved:false};
 await fs.writeFile(record,JSON.stringify(receipt,null,2),{flag:'wx'});
 console.log(JSON.stringify({status:receipt.status,head:requested,files:files.length,receipt:record,receiptSha256:await hash(record),pins,operatorTouched:false}));
}finally{await lock.close();await fs.rm(lockFile);}
