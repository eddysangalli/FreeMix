import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {randomUUID,randomBytes,createHash} from 'node:crypto';
import {createServer} from 'node:net';
import {fileURLToPath} from 'node:url';
export const qa=path.dirname(fileURLToPath(import.meta.url));
export const workspace=path.resolve(qa,'../..');
export const hash=async file=>createHash('sha256').update(await fs.readFile(file)).digest('hex');
export async function prepare(){
 const frozen=JSON.parse(await fs.readFile(path.join(workspace,'qa-finalizacao/native-build-frozen-6cbf076-configured.json')));
 assert.equal(frozen.head,'6cbf07641c501cb6b319c6bf7000b805fdce625c');
 const root=path.join(tmpdir(),'FreeMix-QA-MultiCorder-Replay-'+randomUUID().replaceAll('-',''));
 await fs.mkdir(root,{recursive:true});
 for(const folder of ['bin','data','obs-plugins']){
  await fs.cp(path.join(workspace,'obs-vmix',folder),path.join(root,folder),{recursive:true});
  await fs.cp(path.join(frozen.root,folder),path.join(root,folder),{recursive:true,force:true});
 }
 const overlays=JSON.parse(await fs.readFile(path.join(workspace,'qa-finalizacao/package-plugin-overlays.json')));
 for(const file of overlays.files.filter(x=>x.target.startsWith('obs-plugins/'))){assert.equal(await hash(file.source),file.sha256);await fs.cp(file.source,path.join(root,file.target));}
 for(const [file,pin]of Object.entries(frozen.pins))assert.equal(await hash(path.join(root,file)),pin);
 assert.equal(await hash(path.join(root,'obs-plugins/64bit/source-record.dll')),'63e4f4c4fe77382b24eb03085a62e3da7ac8e77554be5f6f94dcf17c885987e8');
 assert(!(await fs.readdir(path.join(root,'obs-plugins/64bit'))).includes('qa-replay-pcm.dll'));
 await fs.mkdir(path.join(root,'runtime/ndi-v6'),{recursive:true});
 for(const name of ['ffmpeg.exe','ffprobe.exe'])await fs.cp(path.join(workspace,'obs-vmix/runtime',name),path.join(root,'runtime',name));
 const ndi='Processing.NDI.Lib.x64.dll';await fs.cp(path.join(workspace,'obs-vmix/runtime/ndi-v6',ndi),path.join(root,'runtime/ndi-v6',ndi));
 assert.equal(await hash(path.join(root,'runtime/ndi-v6',ndi)),'2b6602075868ba4401f82f417d72424805d69b11ca86078023d0d489ff45dd84');
 const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const port=server.address().port;await new Promise(r=>server.close(r));
 const cfg=path.join(root,'config/obs-studio');
 for(const name of ['basic/profiles/QA','basic/scenes','plugin_config/obs-websocket'])await fs.mkdir(path.join(cfg,name),{recursive:true});
 await fs.writeFile(path.join(root,'portable_mode.txt'),'');
 await fs.writeFile(path.join(cfg,'global.ini'),'[General]\nFirstRun=false\nEnableAutoUpdates=false\nLanguage=pt-BR\nProcessPriority=Normal\nBrowserHWAccel=true\n[Basic]\nProfile=QA\nProfileDir=QA\nSceneCollection=QA\nSceneCollectionFile=QA\n[Video]\nRenderer=Direct3D 11\n[Locations]\nConfiguration=../../config\nSceneCollections=../../config\nProfiles=../../config\nPluginManagerSettings=../../config\n');
 const rec=path.join(root,'gravacoes');await fs.mkdir(rec,{recursive:true});
 await fs.writeFile(path.join(cfg,'basic/profiles/QA/basic.ini'),'[General]\nName=QA\n[Video]\nBaseCX=640\nBaseCY=360\nOutputCX=640\nOutputCY=360\nFPSType=0\nFPSCommon=30\n[Output]\nMode=Simple\n[SimpleOutput]\nFilePath='+rec.replaceAll('\\','/')+'\n[Audio]\nSampleRate=48000\nChannelSetup=Stereo\n');
 await fs.writeFile(path.join(cfg,'user.ini'),'[Basic]\nProfile=QA\nProfileDir=QA\nSceneCollection=QA\nSceneCollectionFile=QA\n[General]\nFirstRun=false\n');
 await fs.writeFile(path.join(cfg,'basic/scenes/QA.json'),JSON.stringify({name:'QA',current_scene:'QA',current_program_scene:'QA',scene_order:[{name:'QA'}],sources:[{name:'QA',id:'scene',versioned_id:'scene',settings:{items:[]}}],DesktopAudioDevice1:null,DesktopAudioDevice2:null,AuxAudioDevice1:null,AuxAudioDevice2:null,AuxAudioDevice3:null,AuxAudioDevice4:null}));
 await fs.writeFile(path.join(cfg,'plugin_config/obs-websocket/config.json'),JSON.stringify({server_enabled:true,server_port:port,auth_required:true,server_password:randomBytes(20).toString('hex'),alerts_enabled:false}));
 const clip=path.join(root,'synthetic-tone.mp4');await fs.cp(path.join(workspace,'qa-finalizacao/replay-sincronia-native/seek-tone.mp4'),clip);
 const receipt={root,port,clip,nativeHead:frozen.head,pins:frozen.pins,sourceRecordSha256:await hash(path.join(root,'obs-plugins/64bit/source-record.dll')),at:new Date().toISOString(),operatorTouched:false,nativeStarted:false};
 await fs.writeFile(path.join(qa,'prepared.json'),JSON.stringify(receipt,null,2));console.log(JSON.stringify({status:'PREPARED_NOT_STARTED',root,port}));return receipt;
}
if(process.argv.includes('--prepare'))await prepare();
