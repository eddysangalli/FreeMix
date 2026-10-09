import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn,execFileSync} from 'node:child_process';
import {qa,workspace,hash} from './prepare.mjs';
import {connect,sleep} from '../../ferramentas/obsws.mjs';
import {DiskReplay} from '../../ferramentas/replay-disco.mjs';
assert.equal(process.env.FREEMIX_QA_MATRIX_RELEASED,'1','Wait for root to release the production matrix');
const prep=JSON.parse(await fs.readFile(path.join(qa,'prepared.json'))),root=prep.root;
assert.match(root,/Temp[\\/]FreeMix-QA-MultiCorder-Replay-[a-f0-9]{32}$/);
for(const [file,pin]of Object.entries(prep.pins))assert.equal(await hash(path.join(root,file)),pin);
const child=spawn(path.join(root,'bin/64bit/FreeMix.exe'),['--portable','--multi','--disable-updater','--minimize-to-tray','--verbose','--profile','QA','--collection','QA'],{cwd:path.join(root,'bin/64bit'),env:{...process.env,NDI_RUNTIME_DIR_V6:path.join(root,'runtime/ndi-v6')},windowsHide:true,stdio:'ignore'});
const exit=new Promise(r=>child.once('exit',(code,signal)=>r({code,signal})));
const result={status:'RUNNING',at:new Date().toISOString(),root,pid:child.pid,nativeHead:prep.nativeHead,pins:prep.pins,sourceRecordSha256:prep.sourceRecordSha256,programTouched:false,operatorTouched:false,directPlayerFilter:false,cycles:[]};
let obs,replay,iso;
const vendor=async(type,data={})=>(await obs.req('CallVendorRequest',{vendorName:'freemix',requestType:type,requestData:data})).responseData;
const outputs=async()=>(await obs.req('GetOutputList')).outputs.map(x=>({name:x.outputName,active:x.outputActive}));
const waitOutputs=async()=>{const start=Date.now();for(let i=0;i<24;i++){const list=await outputs();if(!list.some(x=>x.active))return {ms:Date.now()-start,list};await sleep(250);}throw Error('Outputs remained active more than 6s after stop');};
const inspectFile=async file=>{const before=await fs.stat(file);await sleep(250);const after=await fs.stat(file);assert.equal(before.size,after.size,'Stopped ISO file still growing');const data=JSON.parse(execFileSync(path.join(root,'runtime/ffprobe.exe'),['-v','error','-show_streams','-show_format','-of','json',file],{encoding:'utf8',windowsHide:true,timeout:10000}));assert(data.streams.some(s=>s.codec_type==='video'&&s.codec_name==='h264'));assert(Number(data.format.duration)>0);execFileSync(path.join(root,'runtime/ffmpeg.exe'),['-v','error','-nostdin','-i',file,'-map','0:v:0','-f','null','-'],{windowsHide:true,timeout:10000});return {file,bytes:after.size,duration:Number(data.format.duration),sha256:await hash(file),decode:'PASS'};};
try{
 for(let n=0;n<180;n++){try{obs=await connect({root});break;}catch{await sleep(250);}}assert(obs);
 let iface;for(let n=0;n<160;n++){try{iface=await vendor('get_interface');if(iface?.pid)break;}catch{}await sleep(250);}assert(iface,'Native vendor API did not finish startup');assert.equal(iface.pid,child.pid);assert.equal(path.resolve(iface.executable).toLowerCase(),path.join(root,'bin/64bit/FreeMix.exe').toLowerCase());
 await obs.req('SetRecordDirectory',{recordDirectory:path.join(root,'gravacoes')});result.recordDirectory=(await obs.req('GetRecordDirectory')).recordDirectory;assert.equal(path.resolve(result.recordDirectory).toLowerCase(),path.join(root,'gravacoes').toLowerCase());
 await obs.req('SetStudioModeEnabled',{studioModeEnabled:true});
 replay=new DiskReplay({root,getObs:()=>obs,namespace:'qa-container-replay'});
 iso=new DiskReplay({root,getObs:()=>obs,namespace:'qa-container-iso',filter:'Gravação ISO',recordingFolder:'iso'});
 await replay.command('import',{file:prep.clip});const event=replay.state.events[0];await replay.command('load',{player:'A',eventId:event.id});
 await obs.req('SetCurrentPreviewScene',{sceneName:'QA'});
 await obs.req('CreateScene',{sceneName:'QA Composição MultiGravação'});await obs.req('CreateSceneItem',{sceneName:'QA Composição MultiGravação',sourceName:'REPLAY A'});
 const inventory=await iso.command('status');assert(inventory.availableCams.includes('QA Composição MultiGravação'));assert(!inventory.availableCams.includes('REPLAY A'));result.selectedScene='QA Composição MultiGravação';
 await iso.command('configure',{options:{format:'mpegts',prefix:'container',encoder:'obs_x264',crf:28,audio:'input',directory:path.join(root,'gravacoes'),perInput:{}}});
 for(const [index,speed]of [30,50,100].entries()){
  await replay.command('speed',{speed});await replay.command('seek',{player:'A',cursor:1000});await replay.command('transport',{player:'A',command:'PAUSE'});
  const cycle={speed,stopCondition:index===2?'EOF':'paused-offair',before:await obs.req('GetMediaInputStatus',{inputName:'Replay Player A'})};
  await iso.command('start',{cams:['QA Composição MultiGravação']});cycle.started=await outputs();assert(cycle.started.some(x=>x.active));
  const filter=(await obs.req('GetSourceFilter',{sourceName:'QA Composição MultiGravação',filterName:'Gravação ISO'}));assert.equal(filter.filterKind,'source_record_filter');
  assert(!(await obs.req('GetSourceFilterList',{sourceName:'Replay Player A'})).filters.some(x=>x.filterKind==='source_record_filter'));
  await replay.command('transport',{player:'A',command:'PLAY'});await sleep(700);await replay.command('seek',{player:'A',cursor:3500});await sleep(350);await replay.command('transport',{player:'A',command:'PAUSE'});
  if(index===2){const duration=(await obs.req('GetMediaInputStatus',{inputName:'Replay Player A'})).mediaDuration;await replay.command('seek',{player:'A',cursor:duration-200});await replay.command('transport',{player:'A',command:'PLAY'});cycle.ended=await replay.waitFor('GetMediaInputStatus',{inputName:'Replay Player A'},x=>x.mediaState==='OBS_MEDIA_STATE_ENDED');}
  cycle.beforeStop={media:await obs.req('GetMediaInputStatus',{inputName:'Replay Player A'}),active:await obs.req('GetSourceActive',{sourceName:'QA Composição MultiGravação'}),outputs:await outputs()};
  const started=Date.now();await iso.command('stop');cycle.stopMs=Date.now()-started;cycle.returnedRec=iso.state.rec;cycle.immediateOutputs=await outputs();cycle.drain=await waitOutputs();assert.equal(iso.state.rec,false);
  cycle.file=await inspectFile(iso.state.session.cams[0].file);assert.equal((await obs.req('GetCurrentProgramScene')).currentProgramSceneName,'QA');
  result.cycles.push(cycle);await fs.writeFile(path.join(qa,'resultado.json'),JSON.stringify(result,null,2));
 }
 result.beforeCleanup=await outputs();await iso.dispose();await replay.dispose();
 const filterList=(await obs.req('GetSourceFilterList',{sourceName:'QA Composição MultiGravação'})).filters;if(filterList.some(x=>x.filterName==='Gravação ISO'))await obs.req('RemoveSourceFilter',{sourceName:'QA Composição MultiGravação',filterName:'Gravação ISO'});
 await obs.req('SetCurrentPreviewScene',{sceneName:'QA'});await obs.req('RemoveScene',{sceneName:'QA Composição MultiGravação'});await obs.req('RemoveScene',{sceneName:'REPLAY A'});await obs.req('RemoveInput',{inputName:'Replay Player A'}).catch(()=>{});
 result.finalOutputs=await outputs();assert(!result.finalOutputs.some(x=>x.active));result.shutdownResponse=await vendor('shutdown_idle',{qaClose:true});assert.equal(result.shutdownResponse.success,true,'Native refused shutdown');const started=Date.now();result.exit=await Promise.race([exit,sleep(12000).then(()=>null)]);result.shutdownMs=Date.now()-started;assert.equal(result.exit?.code,0);result.status='PASS';
}catch(error){result.status='FAIL';result.error=error.stack;try{result.failureOutputs=await outputs();result.failureSourceStatus=await vendor('get_sources_status');}catch{}if(child.exitCode===null){try{const stacks=execFileSync(path.join(workspace,'qa-finalizacao/replay-sincronia-native/qa-native-stacks.exe'),[String(child.pid),path.join(root,'bin/64bit/FreeMix.exe'),path.join(workspace,'qa-finalizacao/native-build-frozen-6cbf076-configured/bin/64bit')],{windowsHide:true,timeout:15000,maxBuffer:1024*1024});await fs.writeFile(path.join(qa,'stacks-fail.txt'),stacks);}catch(e){result.stackError=e.message;}}}
finally{obs?.close();if(child.exitCode===null){result.ownForcedCleanup=true;child.kill();await Promise.race([exit,sleep(1500)]);}await fs.writeFile(path.join(qa,'resultado.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({status:result.status,error:result.error,cycles:result.cycles.map(x=>({speed:x.speed,stopMs:x.stopMs,drainMs:x.drain.ms,immediateActive:x.immediateOutputs.filter(y=>y.active).length})),shutdownMs:result.shutdownMs,exit:result.exit,root,pid:child.pid}));}
if(result.status!=='PASS')process.exitCode=1;
