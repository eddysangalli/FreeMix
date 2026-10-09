import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,cp,rename,readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {randomUUID} from 'node:crypto';
import {resolve,join} from 'node:path';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {randomBytes,createHash} from 'node:crypto';
import {connect,sleep} from '../../ferramentas/obsws.mjs';

const qa=resolve('qa-finalizacao/localvocal-shutdown');
const tag=process.argv[2]||'native';assert.match(tag,/^[a-z0-9-]+$/);
const cancelOnly=process.argv.includes('--cancel-only');
const suite=true;
const ndi=true;
const baseRoot=(await readFile(join(qa,'runtime-path.txt'),'utf8')).trim();
const root=join(tmpdir(),'FreeMix-QA-LocalVocal-'+randomUUID().replaceAll('-',''));
for(const dir of ['bin','data','obs-plugins'])await cp(join(baseRoot,dir),join(root,dir),{recursive:true});
const nativeRundir=process.env.FREEMIX_QA_NATIVE_RUNDIR?resolve(process.env.FREEMIX_QA_NATIVE_RUNDIR):resolve('freemix-app/build_2026/rundir/RelWithDebInfo');
await cp(join(nativeRundir,'bin/64bit'),join(root,'bin/64bit'),{recursive:true,force:true});
if(process.env.FREEMIX_QA_OBS_FFMPEG){
 const candidate=resolve(process.env.FREEMIX_QA_OBS_FFMPEG),hash=createHash('sha256').update(await readFile(candidate)).digest('hex');
 assert.equal(hash,process.env.FREEMIX_QA_OBS_FFMPEG_SHA256,'Unpinned QA obs-ffmpeg module');
 await cp(candidate,join(root,'obs-plugins/64bit/obs-ffmpeg.dll'));
 await writeFile(resolve('qa-finalizacao/replay-sincronia-native/native-patch/module-receipt.json'),JSON.stringify({candidate,hash,root},null,2));
}
assert.equal(createHash('sha256').update(await readFile(join(root,'bin/64bit/FreeMix.exe'))).digest('hex'),process.env.FREEMIX_QA_NATIVE_SHA256||'1c045e5d43bae20eca9b15df50d73d297b9d433e381027eb861f0ff21f014744');
const nativeReceipt={root,nativeRundir,at:new Date().toISOString(),files:[]};
for(const name of ['FreeMix.exe','obs.dll','obs-frontend-api.dll']){
 const hash=createHash('sha256').update(await readFile(join(root,'bin/64bit',name))).digest('hex');
 if(name==='obs.dll'&&process.env.FREEMIX_QA_OBS_SHA256)assert.equal(hash,process.env.FREEMIX_QA_OBS_SHA256);
 if(name==='obs-frontend-api.dll'&&process.env.FREEMIX_QA_FRONTEND_SHA256)assert.equal(hash,process.env.FREEMIX_QA_FRONTEND_SHA256);
 nativeReceipt.files.push({name,hash});
}
await writeFile(resolve('qa-finalizacao/replay-sincronia-native/native-receipt.json'),JSON.stringify(nativeReceipt,null,2));
await mkdir(join(root,'runtime'),{recursive:true});
for(const name of ['ffmpeg.exe','ffprobe.exe'])await cp(resolve('obs-vmix/runtime',name),join(root,'runtime',name));
await writeFile(resolve('qa-finalizacao/replay-sincronia-native/runtime-path.txt'),root);
assert.match(root,/Temp[\\/]FreeMix-QA-LocalVocal-[a-f0-9]{32}$/);
const dll=resolve(qa,'build/RelWithDebInfo/obs-localvocal.dll');
await cp(dll,join(root,'obs-plugins/64bit/obs-localvocal.dll'));
// NDI is outside this test; its missing-runtime modal would block startup in this minimal clone.
await mkdir(join(root,'disabled-qa-plugins'),{recursive:true});
await rename(join(root,'obs-plugins/64bit/distroav.dll'),join(root,'disabled-qa-plugins/distroav.dll')).catch(()=>{});
const childEnv={...process.env};
if(process.env.FREEMIX_QA_PCM_DLL){
 const plugin=resolve(process.env.FREEMIX_QA_PCM_DLL),hash=createHash('sha256').update(await readFile(plugin)).digest('hex');
 assert.equal(hash,process.env.FREEMIX_QA_PCM_SHA256,'Unpinned QA PCM probe');
 await cp(plugin,join(root,'obs-plugins/64bit/qa-replay-pcm.dll'));
 childEnv.FREEMIX_QA_PCM_DIRECTORY=join(root,'qa-pcm');await mkdir(childEnv.FREEMIX_QA_PCM_DIRECTORY,{recursive:true});
}
if(ndi){
 const sdk=resolve('obs-vmix/runtime/ndi-v6/Processing.NDI.Lib.x64.dll');
 assert.equal(createHash('sha256').update(await readFile(sdk)).digest('hex'),'2b6602075868ba4401f82f417d72424805d69b11ca86078023d0d489ff45dd84');
 await mkdir(join(root,'runtime/ndi-v6'),{recursive:true});await cp(sdk,join(root,'runtime/ndi-v6/Processing.NDI.Lib.x64.dll'));
 await rename(join(root,'disabled-qa-plugins/distroav.dll'),join(root,'obs-plugins/64bit/distroav.dll'));
 childEnv.NDI_RUNTIME_DIR_V6=join(root,'runtime/ndi-v6');
}
if(suite){
 for(const name of ['advanced-scene-switcher.dll','advanced-scene-switcher-lib.dll'])await cp(resolve('qa-finalizacao/sceneswitcher-shutdown/build/RelWithDebInfo',name),join(root,'obs-plugins/64bit',name));
} else await rename(join(root,'obs-plugins/64bit/advanced-scene-switcher.dll'),join(root,'disabled-qa-plugins/advanced-scene-switcher.dll')).catch(()=>{});
const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
const port=server.address().port;await new Promise(r=>server.close(r));
await rename(join(root,'config'),join(root,'config-initial-qa-snapshot')).catch(()=>{});
await mkdir(join(root,'config/obs-studio/basic/profiles/QA'),{recursive:true});
await mkdir(join(root,'config/obs-studio/basic/scenes'),{recursive:true});
await mkdir(join(root,'config/obs-studio/plugin_config/obs-websocket'),{recursive:true});
await writeFile(join(root,'config/obs-studio/global.ini'),'[General]\nFirstRun=false\nEnableAutoUpdates=false\nLanguage=pt-BR\nProcessPriority=Normal\nBrowserHWAccel=true\n[Basic]\nProfile=QA\nProfileDir=QA\nSceneCollection=QA\nSceneCollectionFile=QA\n[Video]\nRenderer=Direct3D 11\n[Locations]\nConfiguration=../../config\nSceneCollections=../../config\nProfiles=../../config\nPluginManagerSettings=../../config\n');
await writeFile(join(root,'config/obs-studio/basic/profiles/QA/basic.ini'),'[General]\nName=QA\n[Video]\nBaseCX=640\nBaseCY=360\nOutputCX=640\nOutputCY=360\nFPSType=0\nFPSCommon=30\n[Audio]\nSampleRate=48000\nChannelSetup=Stereo\n');
await writeFile(join(root,'config/obs-studio/user.ini'),'[Basic]\nProfile=QA\nProfileDir=QA\nSceneCollection=QA\nSceneCollectionFile=QA\n[General]\nFirstRun=false\n');
await writeFile(join(root,'config/obs-studio/basic/scenes/QA.json'),JSON.stringify({name:'QA',current_scene:'QA',current_program_scene:'QA',scene_order:[{name:'QA'}],sources:[{name:'QA',id:'scene',versioned_id:'scene',settings:{items:[]}}],DesktopAudioDevice1:null,DesktopAudioDevice2:null,AuxAudioDevice1:null,AuxAudioDevice2:null,AuxAudioDevice3:null,AuxAudioDevice4:null}));
await writeFile(join(root,'config/obs-studio/plugin_config/obs-websocket/config.json'),JSON.stringify({server_enabled:true,server_port:port,auth_required:true,server_password:randomBytes(20).toString('hex'),alerts_enabled:false}));
const child=spawn(join(root,'bin/64bit/FreeMix.exe'),['--portable','--multi','--disable-updater','--minimize-to-tray','--verbose','--profile','QA','--collection','QA'],{cwd:join(root,'bin/64bit'),env:childEnv,windowsHide:true,stdio:'ignore'});
const exit=new Promise(r=>child.once('exit',(code,signal)=>r({code,signal})));

export {root,child,exit,port};

