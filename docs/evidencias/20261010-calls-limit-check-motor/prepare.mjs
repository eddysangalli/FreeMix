import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const own=import.meta.dirname,root=path.resolve(own,'../..'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const prior=JSON.parse(await fs.readFile(path.join(root,'qa-finalizacao/roteiro-operacao-calls-saidas-readonly-20261010/SOURCE-PINS.json'),'utf8').then(t=>t.replace(/^\uFEFF/,'')));
await fs.mkdir(path.join(own,'baseline'),{recursive:true});await fs.mkdir(path.join(own,'draft'),{recursive:true});await fs.mkdir(path.join(own,'patches'),{recursive:true});
for(const pin of prior.files){const b=await fs.readFile(path.join(root,pin.path));if(sha(b)!==pin.sha256)throw Error('Read baseline changed: '+pin.path);}
for(const name of ['calls.html','calls.js']){const b=await fs.readFile(path.join(root,'FreeMix/painel/remoto',name));await fs.writeFile(path.join(own,'baseline',name),b);await fs.writeFile(path.join(own,'draft',name),b);}
let html=await fs.readFile(path.join(own,'draft/calls.html'),'utf8');
html=html.replace('<p id="return-status" role="status"></p>','<p id="return-status" role="status"></p><p id="return-video-limit" role="status"></p><button id="check-motor" type="button">Conferir motor</button><p id="check-motor-status" role="status" aria-live="polite"></p>');
html=html.replace('Programa usa a câmera virtual; uma entrada/composição escolhida usa imagem local até 5 fps. ','O limite de vídeo informado pelo motor aparece acima. ');
let js=await fs.readFile(path.join(own,'draft/calls.js'),'utf8');
function replace(a,b){if(!js.includes(a))throw Error('Draft anchor missing');js=js.replace(a,b);}
replace("let held=false,starting=false,lease=null,timer=null,pinging=false,holdEpoch=0;", "let held=false,starting=false,lease=null,timer=null,pinging=false,holdEpoch=0;\n let checkingMotor=false,checkedState=null,disposed=false;");
replace(" function message(text,error=false)", ` function videoLimit(c){
  const reported=typeof c.videoReturnLimit==='string'&&c.videoReturnLimit.trim()?c.videoReturnLimit.trim():'Limite de vídeo não informado pelo motor.';
  const mode=c.experimentalContinuousVideo===true?'Captura contínua experimental':c.experimentalContinuousVideo===false?'Modo padrão':'Modo de captura não informado pelo motor';
  const capability=c.capability==='individual-PCM-WebRTC'?'Retornos individuais':c.capability==='shared-return-B'?'Retorno compartilhado':c.capability?'Capacidade de retorno não reconhecida':'Capacidade de retorno não informada';
  return mode+' · '+reported+' · '+capability+(c.videoReturnAvSyncProven===true?'':' · Sincronismo A/V não homologado.');
 }
 async function checkMotor(){
  if(checkingMotor||disposed)return;
  const ownScope=scope;checkingMotor=true;E('check-motor').disabled=true;E('check-motor-status').textContent='Consultando o estado atual…';
  let deadline;
  try{
   const controller=new AbortController();
   const read=(async()=>{const response=await fetch('/api/json',{method:'GET',cache:'no-store',credentials:'same-origin',signal:controller.signal});const result=await response.json();if(!response.ok||result.success===false)throw Error(result.error||'Consulta do motor recusada.');return result;})();
   const timeout=new Promise((_,reject)=>{deadline=setTimeout(()=>{controller.abort();reject(Error('O motor não respondeu em 5s. Confira a conexão e tente Conferir motor.'));},5000);});
   const result=await Promise.race([read,timeout]);
   const latest=window.FreeMixRemote?.getState()||{};
   if(disposed||scope!==ownScope||latest.preset!==ownScope||result.preset!==ownScope){if(!disposed)E('check-motor-status').textContent='O projeto mudou. Confira o motor no projeto atual.';return;}
   if(!result.connected||!latest.connected||!Number.isFinite(result.updatedAt)||Date.now()-result.updatedAt>2500||result.updatedAt>Date.now()+1000||(latest.updatedAt||0)>result.updatedAt||!Array.isArray(result.calls?.guests)||!Array.isArray(result.calls?.returns))throw Error('Estado do motor indisponível ou antigo. A confirmação continua pendente; não envie novamente.');
   const pending=[...guestDrafts].filter(([,d])=>['awaitEcho','echoTimeout'].includes(d.phase));
   const matched=pending.filter(([key,d])=>result.calls.guests.some(g=>g.key===key)&&result.calls.returns.some(r=>r.key===key&&routeSignature(r)===routeSignature(d))).length;
   checkedState=result;refresh();
   E('check-motor-status').textContent=pending.length?(matched===pending.length?'Configuração confirmada pelo estado atual do motor; não pelo ACK original.':'O estado atual ainda não coincide com o retorno salvo. A confirmação continua pendente; não envie novamente.'):'Estado atual consultado. Isso não comprova recepção pelo convidado.';
  }catch(e){if(!disposed&&scope===ownScope)E('check-motor-status').textContent=e.message;}
  finally{clearTimeout(deadline);checkingMotor=false;if(!disposed)E('check-motor').disabled=false;}
 }
 E('check-motor').onclick=checkMotor;
 window.addEventListener('pagehide',()=>{disposed=true;checkedState=null;});
 function message(text,error=false)`);
replace("savedAudioMode==='custom'?'Fontes escolhidas, sem a própria voz'", "savedAudioMode==='custom'?'Fontes escolhidas, sem a própria voz'+(c.conference!==false?' + outros convidados':'')");
replace("state=window.FreeMixRemote?.getState()||{};const c=calls(),nextScope=state.preset||'';", "const remote=window.FreeMixRemote?.getState()||{};if(checkedState&&(remote.preset!==checkedState.preset||!remote.connected||(remote.updatedAt||0)>checkedState.updatedAt||Date.now()-checkedState.updatedAt>2500))checkedState=null;state=checkedState||remote;const c=calls(),nextScope=state.preset||'';");
replace("E('return-status').textContent=c.capability", "E('return-video-limit').textContent=videoLimit(c);\n  E('return-status').textContent=c.capability");
await fs.writeFile(path.join(own,'draft/calls.html'),html);await fs.writeFile(path.join(own,'draft/calls.js'),js);
for(const name of ['calls.html','calls.js']){let diff='';try{diff=execFileSync('git',['diff','--no-index','--no-ext-diff','--','baseline/'+name,'draft/'+name],{cwd:own,encoding:'utf8'});}catch(e){if(e.status!==1)throw e;diff=e.stdout;}diff=diff.replaceAll('a/baseline/'+name,'a/painel/remoto/'+name).replaceAll('b/draft/'+name,'b/painel/remoto/'+name);await fs.writeFile(path.join(own,'patches',name+'.patch'),diff);}
const extra=['FreeMix/painel/remoto/controle.js','FreeMix/ferramentas/servidor-api.mjs'];const pins=[...prior.files];for(const p of extra){const b=await fs.readFile(path.join(root,p));pins.push({path:p,bytes:b.length,sha256:sha(b)});}
await fs.writeFile(path.join(own,'SOURCE-PINS.json'),JSON.stringify({schema:1,files:pins,scope:'offside UI draft only; /api/json GET contract inspected, no API execution'},null,2)+'\n');
console.log(JSON.stringify({status:'PREPARED_NO_PRODUCT_WRITES',files:2,sourcePins:pins.length}));
