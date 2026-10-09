import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,stat,mkdir,readdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {root,child,exit} from './cef-bootstrap.mjs';
import {connect,sleep} from '../../obs-vmix/ferramentas/obsws.mjs';
import {DiskReplay} from '../../obs-vmix/ferramentas/replay-disco.mjs';
import {servePreviewMedia} from '../../obs-vmix/ferramentas/midia-preview-http.mjs';
const qa=resolve('qa-finalizacao/replay-completo/cef-native');await mkdir(qa,{recursive:true});
const reports=[],actions=[],previews=[],errors=[];
let obs,replay,browser,server,doneResolve,timeoutTimer,snapshotTimer;const done=new Promise(r=>doneResolve=r);
const receipt={at:new Date().toISOString(),status:'RUNNING',root,pid:child.pid,operatorTouched:false,audibleOutput:false,realNativeRecording:true,realCEF:true,productionHttpServerUsed:false};
const flush=()=>writeFile(join(qa,'progress.json'),JSON.stringify({...receipt,reports:reports.length,last:reports.at(-1),previews:previews.length},null,2));
const vendor=async(type,data={})=>(await obs.req('CallVendorRequest',{vendorName:'freemix',requestType:type,requestData:data})).responseData;
let failure;
try{
 for(let i=0;i<160;i++){try{obs=await connect({root});break;}catch{await sleep(250);}}assert(obs,'own websocket connected');
 let identity;for(let i=0;i<160;i++){try{identity=await vendor('get_interface');break;}catch{await sleep(250);}}assert.equal(identity.pid,child.pid);assert.equal(resolve(identity.executable).toLowerCase(),resolve(root,'bin/64bit/FreeMix.exe').toLowerCase());
 receipt.nativeSha256=createHash('sha256').update(await readFile(join(root,'bin/64bit/FreeMix.exe'))).digest('hex');assert.equal(receipt.nativeSha256,'1c045e5d43bae20eca9b15df50d73d297b9d433e381027eb861f0ff21f014744');
 assert(!(await obs.req('GetOutputList')).outputs.some(o=>o.outputActive));assert(!(await obs.req('GetInputList')).inputs.some(i=>/wasapi|asio|capture/i.test(i.inputKind)));
 const ownRecording=join(root,'gravacoes');await mkdir(ownRecording,{recursive:true});await obs.req('SetRecordDirectory',{recordDirectory:ownRecording});assert.equal(resolve((await obs.req('GetRecordDirectory')).recordDirectory).toLowerCase(),resolve(ownRecording).toLowerCase());
 process.env.FREEMIX_REPLAY_ENCODER='obs_x264';
 replay=new DiskReplay({root,getObs:()=>obs,namespace:'qa-cef-native',filter:'QA CEF Replay Rec'});
 const cameras=[];
 for(let i=1;i<=2;i++){
  const name='QA CEF Camera '+i;await obs.req('CreateScene',{sceneName:name});
  const source=await obs.req('CreateInput',{sceneName:name,inputName:name+' Media',inputKind:'ffmpeg_source',inputSettings:{is_local_file:true,local_file:resolve('qa-finalizacao/replay-completo/fixture/part-00.ts'),looping:true,restart_on_activate:false},sceneItemEnabled:true});
  await obs.req('SetInputAudioMonitorType',{inputUuid:source.inputUuid,monitorType:'OBS_MONITORING_TYPE_NONE'});
  await obs.req('SetInputAudioTracks',{inputUuid:source.inputUuid,inputAudioTracks:{1:true,2:false,3:false,4:false,5:false,6:false}});cameras.push(name);
 }
 await replay.command('start',{cams:cameras});assert.equal(resolve((await obs.req('GetRecordDirectory')).recordDirectory).toLowerCase(),resolve(ownRecording).toLowerCase());receipt.sessionId=replay.state.session.id;receipt.sessionDir=replay.state.session.dir;assert(resolve(receipt.sessionDir).toLowerCase().startsWith(resolve(root).toLowerCase()+'\\'));
 await sleep(7000);receipt.firstHistory=(await replay.command('history')).history;assert(receipt.firstHistory.end>5);
 server=createServer(async(req,res)=>{try{
  const path=new URL(req.url,'http://127.0.0.1').pathname;
  if(path==='/qa-report'){const chunks=[];for await(const c of req)chunks.push(c);const report=JSON.parse(Buffer.concat(chunks));reports.push(report);if(['fatal','error'].includes(report.type))errors.push(report);res.end('ok');await flush();if(report.type==='done'||report.type==='fatal')doneResolve(report);return;}
  if(path==='/api/replay'){let value;if(req.method==='POST'){const chunks=[];for await(const c of req)chunks.push(c);const {action,...data}=JSON.parse(Buffer.concat(chunks));actions.push({at:Date.now(),action});const started=performance.now();value=await replay.command(action,data);if(action==='history-preview')previews.push({at:Date.now(),elapsed:performance.now()-started,...value.historyPreview});}else value=await replay.command('status');res.setHeader('Content-Type','application/json');res.end(JSON.stringify({success:true,replay:value}));return;}
  if(path.startsWith('/api/replay-preview/')){await servePreviewMedia(req,res,await replay.previewFile(path.slice('/api/replay-preview/'.length)));return;}
  if(path==='/controle.js'){res.setHeader('Content-Type','application/javascript');res.end('');return;}
  if(path==='/cef-instrument.js'){res.setHeader('Content-Type','application/javascript');res.end(await readFile('qa-finalizacao/replay-completo/cef-instrument.js'));return;}
  const name=path==='/'||path==='/replay'?'replay.html':path.slice(1);if(!['replay.html','replay.js','controle.css'].includes(name)){res.writeHead(404).end();return;}
  res.setHeader('Content-Type',name.endsWith('.js')?'application/javascript':name.endsWith('.css')?'text/css':'text/html');let content=await readFile('obs-vmix/painel/remoto/'+name,'utf8');if(name==='replay.html')content=content.replace('</body>','<script src="/cef-instrument.js"></script></body>');res.end(content);
 }catch(e){res.writeHead(400,{'Content-Type':'application/json'}).end(JSON.stringify({success:false,error:e.message}));}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));receipt.httpPort=server.address().port;
 browser=await obs.req('CreateInput',{sceneName:'QA',inputName:'QA CEF Replay Panel',inputKind:'browser_source',inputSettings:{url:'http://127.0.0.1:'+receipt.httpPort+'/replay',width:1100,height:900,fps:30,reroute_audio:true,shutdown:false,restart_when_active:false,css:''},sceneItemEnabled:true});
 await obs.req('SetInputAudioMonitorType',{inputUuid:browser.inputUuid,monitorType:'OBS_MONITORING_TYPE_NONE'});await obs.req('SetInputAudioTracks',{inputUuid:browser.inputUuid,inputAudioTracks:{1:false,2:false,3:false,4:false,5:false,6:false}});
 await obs.req('SetCurrentProgramScene',{sceneName:'QA'});await flush();
 snapshotTimer=setInterval(async()=>{try{const image=await obs.req('GetSourceScreenshot',{sourceName:'QA CEF Replay Panel',imageFormat:'png',imageWidth:1100,imageHeight:900});await writeFile(join(qa,'cef-panel.png'),Buffer.from(image.imageData.split(',')[1],'base64'));}catch(e){receipt.screenshotError=e.message;}},60000);
 const outcome=await Promise.race([done,new Promise(r=>{timeoutTimer=setTimeout(()=>r({type:'fatal',message:'20 minute CEF callback timeout'}),1250000);})]);clearInterval(snapshotTimer);clearTimeout(timeoutTimer);assert.equal(outcome.type,'done',outcome.message);
 receipt.boot=reports.find(r=>r.type==='boot');assert(receipt.boot?.ua.includes('OBS/'),'real embedded browser user agent');assert(receipt.boot.mse&&receipt.boot.codec);
 receipt.audio=reports.find(r=>r.type==='audio');assert(receipt.audio.initialMuted);assert.equal(receipt.audio.mutedAfterOptIn,false);assert.equal(receipt.audio.audibleOutputGain,0);assert(Math.abs(receipt.audio.frequency-440)<20);assert(receipt.audio.peakDb>-80);
 receipt.seeks=reports.filter(r=>r.type==='seek');assert(receipt.seeks.length>=3);assert(receipt.seeks.every(r=>r.elapsed<5000));
 receipt.marks=reports.find(r=>r.type==='marks');assert(receipt.marks);const event=replay.state.events.at(-1);assert(event&&Math.abs(event.dur-3)<.15&&event.clips.length===2);receipt.savedClips=[];for(const clip of event.clips){assert((await stat(clip.file)).size>0);const info=await replay.probe(clip.file);assert(Math.abs(info.duration-3)<.15);receipt.savedClips.push({cam:clip.cam,duration:info.duration});}
 receipt.finalHistory=(await replay.command('history')).history;assert(receipt.finalHistory.end>receipt.firstHistory.end+1190);assert(replay.state.rec);assert.equal((await obs.req('GetCurrentProgramScene')).currentProgramSceneName,'QA');
 receipt.samples=reports.filter(r=>r.type==='sample');assert(receipt.samples.length>=570);assert(outcome.wall>=1200000-34,'20 minute timer within one video frame');receipt.final=outcome;receipt.totalFrames=outcome.frames;receipt.droppedFrames=outcome.dropped;receipt.waiting=reports.filter(r=>r.type==='waiting');
 const stable=receipt.samples.filter(s=>s.wall>45000&&s.seekCount===3);receipt.stalls=[];for(let i=1;i<stable.length;i++){const a=stable[i-1],b=stable[i];if(b.cursor-a.cursor<.4&&b.wall-a.wall>1500)receipt.stalls.push({before:a,after:b});}assert.equal(receipt.stalls.length,0,'no recurring playback stalls after seeks');assert.equal(errors.length,0,'CEF JavaScript errors');assert(outcome.frames>33000);assert(outcome.dropped/Math.max(1,outcome.frames)<.01);
 const image=await obs.req('GetSourceScreenshot',{sourceName:'QA CEF Replay Panel',imageFormat:'png',imageWidth:1100,imageHeight:900});await writeFile(join(qa,'cef-panel-final.png'),Buffer.from(image.imageData.split(',')[1],'base64'));
 receipt.status='PASS';
}catch(e){failure=e;receipt.status='FAIL';receipt.error=e.stack;}
finally{
 clearInterval(snapshotTimer);clearTimeout(timeoutTimer);
 receipt.errors=errors;receipt.actions=actions;receipt.previewRequests=previews;await writeFile(join(qa,'browser-reports.json'),JSON.stringify(reports,null,2));
 if(replay?.state.rec)await replay.command('stop').catch(e=>{receipt.cleanupError=e.message;receipt.status='FAIL';});await replay?.dispose();
 if(obs){const stopped=Date.now();await vendor('shutdown_idle',{qaClose:true}).catch(e=>receipt.shutdownError=e.message);const ended=await Promise.race([exit,sleep(12000).then(()=>null)]);receipt.shutdownMs=Date.now()-stopped;receipt.exit=ended;if(!ended||ended.code!==0){receipt.status='FAIL';receipt.closeFailed=true;}obs.close();}
 if(child.exitCode===null){receipt.ownForcedCleanup=true;child.kill();await Promise.race([exit,sleep(1500)]);}
 if(server){server.closeAllConnections();await new Promise(r=>server.close(r));}
 const logs=(await readdir(join(root,'config/obs-studio/logs')).catch(()=>[])).sort();if(logs.length)await writeFile(join(qa,'native.log'),await readFile(join(root,'config/obs-studio/logs',logs.at(-1))));
 await writeFile(join(qa,'resultado-cef-native.json'),JSON.stringify(receipt,null,2));console.log(JSON.stringify({status:receipt.status,error:receipt.error,root,pid:child.pid,httpPort:receipt.httpPort,frames:receipt.totalFrames,dropped:receipt.droppedFrames,shutdownMs:receipt.shutdownMs}));
}
if(failure||receipt.status!=='PASS')process.exitCode=1;
