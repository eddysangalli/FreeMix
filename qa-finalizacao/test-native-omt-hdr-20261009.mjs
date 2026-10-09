import{hostname}from'node:os';import fs from'node:fs/promises';import path from'node:path';import assert from'node:assert/strict';import{spawn,execFileSync}from'node:child_process';import{createHash}from'node:crypto';
import{connect,sleep}from'../obs-vmix/ferramentas/obsws.mjs';import{prepareNdiRuntime}from'../obs-vmix/ferramentas/ndi-runtime.mjs';
const q=JSON.parse(await fs.readFile('qa-finalizacao/qa-transport-conclusion-root.json'));
assert.equal(q.root,'C:/Users/eddyr/AppData/Local/Temp/FreeMix-QA-TransportConclusion-20261009');
const expected=process.argv[2];assert.match(expected||'',/^[0-9a-f]{64}$/,'Explicit parent-approved HDR build hash required');
const source='freemix-app/build_2026/rundir/RelWithDebInfo/bin/64bit/FreeMix.exe';const bytes=await fs.readFile(source);assert.equal(createHash('sha256').update(bytes).digest('hex'),expected);await fs.copyFile(source,q.root+'/bin/64bit/FreeMix.exe');
const omtStorage=q.root+'/config/qa-omt-hdr';await fs.mkdir(omtStorage,{recursive:true});
await fs.writeFile(omtStorage+'/settings.xml','<?xml version="1.0"?><Settings><DiscoveryServer></DiscoveryServer><NetworkPortStart>18690</NetworkPortStart><NetworkPortEnd>18699</NetworkPortEnd></Settings>');
const env={...process.env,FREEMIX_ROOT:q.root,FREEMIX_API_PORT:String(q.apiPort),OMT_STORAGE_PATH:omtStorage};await prepareNdiRuntime(q.root,{env});
const child=spawn(q.root+'/bin/64bit/FreeMix.exe',['--portable','--multi','--disable-updater','--disable-missing-files-check','--minimize-to-tray'],{cwd:q.root+'/bin/64bit',env,windowsHide:true,stdio:'ignore'});let obs,vendor,exit,capture;
const simultaneousCaptures=[];const done=new Promise(r=>child.once('exit',(code,signal)=>{exit={code,signal};r(exit);}));
const receipt={status:'RUNNING',started:new Date().toISOString(),pid:child.pid,root:q.root,operatorTouched:false,buildSha256:expected,physicalHdrMonitorVerified:false,automaticHdrMetadata:false,cases:[]};
const save=()=>fs.writeFile('qa-finalizacao/resultado-native-omt-hdr-20261009.json',JSON.stringify(receipt,null,2));await save();
async function proveProfileRestart(){
 const again=spawn(q.root+'/bin/64bit/FreeMix.exe',['--portable','--multi','--disable-updater','--disable-missing-files-check','--minimize-to-tray'],{cwd:q.root+'/bin/64bit',env,windowsHide:true,stdio:'ignore'});let connection,call,closed;
 const ended=new Promise(r=>again.once('exit',(code,signal)=>{closed={code,signal};r(closed);}));
 try{
  let identity;for(let n=0;n<450&&!closed;n++){try{connection=await connect({root:q.root});call=async(type,requestData={})=>(await connection.req('CallVendorRequest',{vendorName:'freemix',requestType:type,requestData})).responseData;identity=await call('get_interface');if(identity.pid===again.pid)break;connection.close();connection=null;}catch{connection?.close();connection=null;}await sleep(200);}assert.equal(identity?.pid,again.pid);
  const states=[];for(let senderId=0;senderId<4;senderId++){const state=await call('omt_hdr_output',{action:'state',senderId});assert.equal(state.active,false);assert.equal(state.autoStart,false);assert.equal(state.config.name,'FreeMix-QA-HDR-Four-'+senderId);states.push({senderId,name:state.config.name,sourceUuid:state.config.sourceUuid,active:state.active,autoStart:state.autoStart});}receipt.persistedAcrossNativeRestart={pid:again.pid,states};
 }finally{if(connection&&call&&!closed)await call('shutdown_idle',{qaClose:true});connection?.close();const result=await Promise.race([ended,sleep(8000).then(()=>null)]);assert.equal(result?.code,0);if(receipt.persistedAcrossNativeRestart)receipt.persistedAcrossNativeRestart.exit=result;}
}
try{
 let identity;for(let n=0;n<450&&!exit;n++){try{obs=await connect({root:q.root});vendor=async(type,requestData={})=>(await obs.req('CallVendorRequest',{vendorName:'freemix',requestType:type,requestData})).responseData;identity=await vendor('get_interface');if(identity.pid===child.pid)break;obs.close();obs=null;}catch{obs?.close();obs=null;}await sleep(200);}assert.ok(obs,'QA Websocket unavailable');assert.equal(identity?.pid,child.pid);
 const sceneName='QA OMT HDR '+Date.now();await obs.req('CreateSceneCollection',{sceneCollectionName:sceneName});await obs.req('CreateScene',{sceneName});
 const pic=await obs.req('CreateInput',{sceneName,inputName:sceneName+' SDR',inputKind:'image_source',inputSettings:{file:path.resolve('qa-portatil/srt444-alpha-20261009/analytic-rgba.png')},sceneItemEnabled:true});
 const tone=path.resolve('qa-finalizacao/srt-key-silent-evidencias/tone.wav');await obs.req('CreateInput',{sceneName,inputName:sceneName+' tone',inputKind:'ffmpeg_source',inputSettings:{is_local_file:true,local_file:tone,looping:true,close_when_inactive:false,restart_on_activate:false},sceneItemEnabled:true});await obs.req('SetCurrentProgramScene',{sceneName});
 const template={name:'FreeMix-QA-HDR',transfer:'pq',sourceUuid:pic.inputUuid,audioTrack:0,audioSourceUuid:'',manualReceiverConfirmed:true,receiverTransfer:'pq',alpha:false,fillKey:false};
 const sdr=await vendor('omt_hdr_output',{action:'preflight',senderId:0,config:template});assert.equal(sdr.success,false);assert.match(sdr.error,/does not declare HDR/);receipt.sdrRefused=true;
 const capability=await vendor('omt_hdr_output',{action:'state',senderId:0});assert.equal(capability.hdrTransferSignaled,false);assert.equal(capability.hdrAlphaSupported,false);assert.equal(capability.autoStart,false);
 let lastHdrConfig;
 for(const transfer of ['pq','hlg']){
  const file=path.resolve('qa-finalizacao/hdr-evidencias/'+transfer+'.mkv');const input=await obs.req('CreateInput',{sceneName,inputName:sceneName+' '+transfer,inputKind:'ffmpeg_source',inputSettings:{is_local_file:true,local_file:file,looping:true,close_when_inactive:false,restart_on_activate:false},sceneItemEnabled:true});
  const name='FreeMix-QA-HDR-'+transfer.toUpperCase();const config={...template,name,transfer,receiverTransfer:transfer,sourceUuid:input.inputUuid};
  lastHdrConfig=config;
  const stream=JSON.parse(execFileSync(q.root+'/runtime/ffprobe.exe',['-v','error','-read_intervals','%+#1','-show_frames','-of','json',file],{windowsHide:true,encoding:'utf8'})).frames[0];assert.equal(stream.pix_fmt,'yuv420p10le');assert.equal(stream.color_transfer,transfer==='pq'?'smpte2084':'arib-std-b67');
  let preflight;for(let n=0;n<60;n++){preflight=await vendor('omt_hdr_output',{action:'preflight',senderId:0,config});if(preflight.success)break;await sleep(100);}assert.equal(preflight.success,true,JSON.stringify(preflight));
  for(const wrong of [{...config,manualReceiverConfirmed:false},{...config,receiverTransfer:transfer==='pq'?'hlg':'pq'},{...config,alpha:true},{...config,fillKey:true}])assert.equal((await vendor('omt_hdr_output',{action:'preflight',senderId:0,config:wrong})).success,false);
  assert.equal((await vendor('omt_hdr_output',{action:'configure',senderId:0,config})).success,true);
  const state=await vendor('omt_hdr_output',{action:'start',senderId:0});assert.ok(state.success&&state.active,JSON.stringify(state));
  assert.equal((await vendor('omt_hdr_output',{action:'configure',senderId:0,config:{...config,name:'must-not-change'}})).success,false,'Active HDR sender cannot be reconfigured');
  capture=spawn('python',['qa-finalizacao/capture-omt-hdr.py',hostname()+' ('+name+')',transfer],{windowsHide:true,stdio:['ignore','pipe','pipe']});let output='';capture.stdout.on('data',b=>output+=b);capture.stderr.on('data',b=>output+=b);const captured=new Promise(r=>capture.once('exit',r));
  await sleep(3000);assert.ok((await vendor('omt_hdr_output',{action:'stop',senderId:0})).success);await sleep(500);const restarted=await vendor('omt_hdr_output',{action:'start',senderId:0});assert.ok(restarted.success&&restarted.active,JSON.stringify(restarted));assert.equal(restarted.config.transfer,transfer);assert.equal(restarted.config.sourceUuid,input.inputUuid);
  const status=await Promise.race([captured,sleep(18000).then(()=>null)]);const result=JSON.parse(await fs.readFile('qa-finalizacao/hdr-evidencias/capture-'+transfer+'.json'));receipt.cases.push({transfer,source:{format:stream.pix_fmt,colorTransfer:stream.color_transfer,primaries:stream.color_primaries},preflight,restartedFromPersistedConfig:true,capture:result});await save();assert.equal(status,0,output);assert.equal(result.passed,true);
  assert.ok((await vendor('omt_hdr_output',{action:'stop',senderId:0})).success);
 }
 for(let senderId=0;senderId<4;senderId++)assert.ok((await vendor('omt_hdr_output',{action:'stop',senderId})).success);
 const duplicate={...lastHdrConfig,name:'FreeMix-QA-HDR-Collision'};
 for(const senderId of [0,1])assert.ok((await vendor('omt_hdr_output',{action:'configure',senderId,config:duplicate})).success,'Same name may be saved while both are inactive');
 assert.ok((await vendor('omt_hdr_output',{action:'start',senderId:0})).active);
 const rejectedDuplicate=await vendor('omt_hdr_output',{action:'start',senderId:1});assert.equal(rejectedDuplicate.success,false);assert.equal(rejectedDuplicate.active,false);assert.match(rejectedDuplicate.error,/unique active OMT SDR\/Key\/HDR sender name/);assert.ok((await vendor('omt_hdr_output',{action:'stop',senderId:0})).success);receipt.duplicateActiveIdentityRefused=true;
 const fillName='FreeMix-QA-OMT-CrossFill',keyName='FreeMix-QA-OMT-CrossKey';
 for(const [senderId,name]of [[0,fillName],[1,keyName]])assert.ok((await vendor('omt_hdr_output',{action:'configure',senderId,config:{...lastHdrConfig,name}})).success);
 const sdrConfig={protocol:'OMT',senderId:0,mode:'source',sourceUuid:pic.inputUuid,audioTrack:0,fillKey:true,name:fillName,keyName};
 assert.ok((await vendor('network_output',{...sdrConfig,action:'start'})).active);
 for(const senderId of [0,1]){const rejected=await vendor('omt_hdr_output',{action:'start',senderId});assert.equal(rejected.success,false);assert.equal(rejected.active,false);assert.match(rejected.error,/unique active OMT/);}
 assert.ok((await vendor('network_output',{protocol:'OMT',senderId:0,action:'stop'})).success);
 const hdrIdentity='FreeMix-QA-OMT-CrossHdr';assert.ok((await vendor('omt_hdr_output',{action:'configure',senderId:0,config:{...lastHdrConfig,name:hdrIdentity}})).success);assert.ok((await vendor('omt_hdr_output',{action:'start',senderId:0})).active);
 for(const conflicting of [{...sdrConfig,fillKey:false,name:hdrIdentity},{...sdrConfig,name:fillName,keyName:hdrIdentity}]){const rejected=await vendor('network_output',{...conflicting,action:'start'});assert.equal(rejected.success,false);assert.equal(rejected.active,false);assert.match(rejected.error,/unique OMT SDR\/Key\/HDR/);}
 assert.ok((await vendor('omt_hdr_output',{action:'stop',senderId:0})).success);receipt.crossSdrFillKeyHdrIdentityRefused=true;
 const simultaneous=[];
 for(let senderId=0;senderId<4;senderId++){
  const config={...lastHdrConfig,name:'FreeMix-QA-HDR-Four-'+senderId};
  assert.ok((await vendor('omt_hdr_output',{action:'configure',senderId,config})).success);
  const active=await vendor('omt_hdr_output',{action:'start',senderId});assert.ok(active.success&&active.active);simultaneous.push({senderId,name:config.name,sourceUuid:config.sourceUuid});
 }
 const fourCaptured=simultaneous.map(({senderId,name})=>{const label='four-'+senderId,p=spawn('python',['qa-finalizacao/capture-omt-hdr.py',hostname()+' ('+name+')',lastHdrConfig.transfer,label],{windowsHide:true,stdio:['ignore','pipe','pipe']});simultaneousCaptures.push(p);let output='';p.stdout.on('data',b=>output+=b);p.stderr.on('data',b=>output+=b);return new Promise(resolve=>p.once('exit',async code=>{const result=JSON.parse(await fs.readFile('qa-finalizacao/hdr-evidencias/capture-'+label+'.json'));resolve({senderId,code,result,output});}));});
 const fourResults=await Promise.race([Promise.all(fourCaptured),sleep(18000).then(()=>null)]);assert.ok(fourResults,'Four SDK receivers timed out');for(const result of fourResults){assert.equal(result.code,0,result.output);assert.equal(result.result.passed,true);}
 for(const {senderId,name,sourceUuid}of simultaneous){const state=await vendor('omt_hdr_output',{action:'state',senderId});assert.ok(state.active&&state.capturedFrames>30);assert.equal(state.config.name,name);assert.equal(state.config.sourceUuid,sourceUuid);assert.equal(state.autoStart,false);if(state.hdrSources)assert.ok(state.hdrSources.some(s=>s.uuid===sourceUuid));assert.ok((await vendor('omt_hdr_output',{action:'stop',senderId})).success);const persisted=await vendor('omt_hdr_output',{action:'state',senderId});assert.equal(persisted.active,false);assert.equal(persisted.config.name,name);}
 receipt.fourSenders={passed:true,simultaneous,sdkReceivers:fourResults.map(({senderId,result})=>({senderId,...result})),configurationPersisted:true,autoStart:false};
 receipt.status='PASS';
}catch(e){receipt.status='FAIL';receipt.error=e.stack;process.exitCode=1;}finally{
 if(capture&&capture.exitCode===null)capture.kill();
 for(const p of simultaneousCaptures)if(p.exitCode===null)p.kill();
 if(vendor&&obs&&!exit){for(let senderId=0;senderId<4;senderId++)await vendor('omt_hdr_output',{action:'stop',senderId}).catch(()=>{});await vendor('network_output',{protocol:'OMT',senderId:0,action:'stop'}).catch(()=>{});await vendor('shutdown_idle',{qaClose:true}).catch(e=>receipt.closeError=e.message);}obs?.close();receipt.nativeExit=await Promise.race([done,sleep(8000).then(()=>null)]);if(!receipt.nativeExit||receipt.nativeExit.code!==0){receipt.status='FAIL';process.exitCode=1;}if(receipt.status==='PASS')try{await proveProfileRestart();}catch(e){receipt.status='FAIL';receipt.profileRestartError=e.stack;process.exitCode=1;}receipt.finished=new Date().toISOString();await save();console.log(JSON.stringify(receipt,null,2));
}
