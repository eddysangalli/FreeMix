'use strict';
(() => {
 const E=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let state={},scope='',selection=null,saving=false,selectionMessage='',selectionError=false,echo=null,guestFingerprint='',targetFingerprint='',selectionEpoch=0;
 let held=false,starting=false,lease=null,timer=null,pinging=false,holdEpoch=0;
 const guestDrafts=new Map(),pendingRoutes=new Map();let draftRevision=0;
 const routeValues=v=>({video:v.video||'program',audio:v.audio||'program',gain:Number(v.gain??1),audioSources:v.audio==='custom'?[...new Set(v.audioSources||[])].sort():[]});
 const routeSignature=v=>JSON.stringify(routeValues(v));
 const allowedAudio=g=>(calls().audioChoices||[]).filter(a=>a.key!==g&&a.key!==calls().director?.key);
 function reconcileDrafts(){let confirmed=false;for(const[key,d]of guestDrafts){if(d.phase!=='awaitEcho'&&d.phase!=='echoTimeout')continue;const saved=calls().returns?.find(r=>r.key===key);if(saved&&routeSignature(saved)===routeSignature(d)){guestDrafts.delete(key);guestFingerprint='';confirmed=true;}else if(d.phase==='awaitEcho'&&Date.now()>d.until){d.phase='echoTimeout';guestFingerprint='';}}if(confirmed&&![...guestDrafts.values()].some(d=>d.phase==='awaitEcho')&&E('message').textContent==='Retorno salvo no motor. Aguardando atualização do estado…')message('Retorno salvo.');}
 const signature=value=>JSON.stringify(value===null?null:[...(value||[])].sort());
 const calls=()=>state.calls||{},guests=()=>calls().guests||[],targetKeys=()=>selection===null?guests().map(g=>g.key):selection||[];
 async function request(action,data={}){
  const response=await fetch('/api/control',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...data}),keepalive:action==='call_talk_stop',signal:AbortSignal.timeout(5000)});
  const result=await response.json();if(!response.ok||!result.success)throw Error(result.error||'Falha no controle de Calls');return result;
 }
 function message(text,error=false){E('message').textContent=text;E('message').className=error?'error':'ok';}
 function stop(){
  held=false;holdEpoch++;clearInterval(timer);timer=null;E('talk').classList.remove('active','pending');E('talk').setAttribute('aria-pressed','false');E('talk').textContent='Segure para falar';
  const old=lease;lease=null;if(old)request('call_talk_stop',{lease:old}).catch(e=>message(e.message,true));
 }
 function readiness(){
  const c=calls(),keys=targetKeys();
  if(!state.connected)return 'Sem conexão com o FreeMix.';
  if(saving)return 'Salvando quem recebe o talkback…';
  if(!c.director)return 'Configure o microfone do diretor.';
  if(!c.nativeWatchdog)return 'Atualize o motor para usar o fechamento automático do microfone.';
  if(!keys.length)return 'Selecione pelo menos um convidado.';
  if(keys.some(key=>!guests().some(g=>g.key===key)))return 'A seleção contém um Call removido. Escolha os convidados novamente.';
  if(c.capability!=='individual-PCM-WebRTC')return 'Prepare os retornos individuais para falar com os convidados escolhidos.';
  if(keys.some(key=>!c.returns?.some(r=>r.key===key&&r.publisher==='publishing')))return 'Aguardando o retorno dos convidados selecionados. Use Preparar retornos.';
  if(c.talking&&!lease&&!starting)return 'O diretor está falando por outro controle. Aguarde soltar.';
  return '';
 }
 async function start(){
  if(held||starting||E('talk').disabled)return;
  const reason=readiness();if(reason){message(reason,true);return;}
  held=true;starting=true;const epoch=++holdEpoch;const targets=[...targetKeys()];
  E('talk').classList.add('pending');E('talk').textContent='Abrindo microfone…';
  try{
   const result=await request('call_talk_start',{targets}),newLease=result.call?.lease;
   if(!newLease)throw Error('O motor não confirmou o microfone aberto.');
   if(!held||epoch!==holdEpoch){await request('call_talk_stop',{lease:newLease});return;}
   lease=newLease;E('talk').classList.remove('pending');E('talk').classList.add('active');E('talk').setAttribute('aria-pressed','true');E('talk').textContent='FALANDO · solte para parar';
   timer=setInterval(async()=>{if(pinging||!lease)return;const current=lease;pinging=true;try{await request('call_talk_ping',{lease:current});}catch(e){if(lease===current){stop();message(e.message,true);}}finally{pinging=false;}},350);
  }catch(e){if(epoch===holdEpoch){stop();message(e.message,true);}}
  finally{starting=false;renderHealth();}
 }
 function renderHealth(){
  const c=calls(),keys=targetKeys(),names=keys.map(key=>guests().find(g=>g.key===key)?.person?.name||guests().find(g=>g.key===key)?.name||'Call removido');
  E('talk-targets').textContent=names.length?'Sua voz vai para: '+names.join(', ')+'.':'Ninguém selecionado.';
  const reason=readiness();E('talk').disabled=!!reason;
  if(reason&&held)stop();
  E('talk-status').textContent=held&&lease?'Microfone aberto apenas para os destinos acima.':starting?'Aguardando confirmação do motor…':reason||'Pronto. Segure para falar.';
  E('destination-mode').disabled=saving||held||starting;
  for(const checkbox of E('targets').querySelectorAll('[data-target]'))checkbox.disabled=saving||held||starting||selection===null;
  E('selection-status').textContent=selectionMessage||(selection===null?'Todos os Calls, inclusive os adicionados depois.':'Seleção salva para Calls e para a mesa.');E('selection-status').classList.toggle('error',selectionError);
  E('director').textContent=c.director?'Microfone: '+c.director.name:'Microfone do diretor não preparado.';
 }
 function renderTargets(){
  const hash=JSON.stringify([guests().map(g=>[g.key,g.person?.name||g.name]),selection,saving,held,starting]);if(hash===targetFingerprint){renderHealth();return;}targetFingerprint=hash;
  E('destination-mode').value=selection===null?'all':'selected';const selected=new Set(targetKeys());
  E('targets').innerHTML=guests().map(g=>'<label class="target check'+(selected.has(g.key)?' selected':'')+'"><input type="checkbox" data-target="'+esc(g.key)+'"'+(selected.has(g.key)?' checked':'')+'><span>'+esc(g.person?.name||g.name)+'</span></label>').join('')||'<p>Nenhum Call criado. Adicione uma entrada Call na mesa.</p>';renderHealth();
 }
 async function saveSelection(next){
  if(saving)return;stop();const previous=selection===null?null:[...selection],oldScope=scope,epoch=++selectionEpoch;
  selection=next===null?null:[...next];saving=true;selectionMessage='Salvando seleção…';selectionError=false;renderTargets();
  try{
   await request('call_rapid_targets',{targets:selection});
   if(scope!==oldScope)return;
   echo={expected:signature(selection),previous:signature(previous),until:Date.now()+2500};selectionMessage='Seleção salva para Calls e para a mesa.';
  }catch(e){if(scope===oldScope){selection=previous;echo=null;selectionMessage='Não foi possível salvar. A seleção anterior foi restaurada. '+e.message;selectionError=true;}}
  finally{if(epoch===selectionEpoch){saving=false;renderTargets();}}
 }
 E('targets').addEventListener('change',e=>{if(!e.target.dataset.target||saving||selection===null)return;const next=new Set(selection);if(e.target.checked)next.add(e.target.dataset.target);else next.delete(e.target.dataset.target);saveSelection([...next]);});
 E('destination-mode').onchange=()=>saveSelection(E('destination-mode').value==='all'?null:guests().map(g=>g.key));
 E('talk').onpointerdown=e=>{if(e.button!==0)return;e.preventDefault();E('talk').setPointerCapture(e.pointerId);start();};
 for(const event of ['pointerup','pointercancel','lostpointercapture'])E('talk').addEventListener(event,stop);
 E('talk').onkeydown=e=>{if([' ','Enter'].includes(e.key)){e.preventDefault();if(!e.repeat)start();}};E('talk').onkeyup=e=>{if([' ','Enter'].includes(e.key)){e.preventDefault();stop();}};
 document.addEventListener('keydown',e=>{if(e.ctrlKey&&e.code==='Space'&&!e.repeat&&!/INPUT|SELECT|TEXTAREA|BUTTON/.test(e.target.tagName)){e.preventDefault();start();}});document.addEventListener('keyup',e=>{if(e.code==='Space')stop();});
 window.addEventListener('blur',stop);window.addEventListener('pagehide',stop);document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
 async function act(button,action,data,success){
  const ownScope=scope,key=action==='call_return_route'?data.key:null,oldDraft=key?guestDrafts.get(key):null,revision=oldDraft?.revision??0,operation=key?++draftRevision:null;
  if(key&&pendingRoutes.has(key))return;if(key&&!guestDrafts.has(key)&&guestDrafts.size>=8){message('Há rascunhos para oito convidados. Resolva os atuais antes de salvar outro.',true);return;}if(key)pendingRoutes.set(key,operation);
  stop();button.disabled=true;
  try{await request(action,data);if(scope!==ownScope||key&&pendingRoutes.get(key)!==operation)return;
   if(key){const latest=guestDrafts.get(key);if((latest?.revision??0)!==revision){message('Retorno salvo no motor. Há novas alterações não salvas.');}else{guestDrafts.set(key,{...routeValues(data),revision,phase:'awaitEcho',until:Date.now()+2500});message('Retorno salvo no motor. Aguardando atualização do estado…');}}else message(success);guestFingerprint='';
  }catch(e){if(scope===ownScope&&(!key||pendingRoutes.get(key)===operation))message(e.message,true);}
  finally{if(key&&pendingRoutes.get(key)===operation)pendingRoutes.delete(key);button.disabled=false;}
 }
 E('mic-open').onclick=()=>{E('mic-details').open=!E('mic-details').open;if(E('mic-details').open)E('mic').focus();};
 E('prepare').onclick=()=>act(E('prepare'),'call_director',{input:E('mic').value},'Microfone privado preparado.');
 E('create-mic').onclick=()=>act(E('create-mic'),'call_director_create',{},'Microfone privado padrão criado. Confira o dispositivo nas propriedades.');
 E('returns').onclick=()=>act(E('returns'),'call_returns_prepare',{},'Retornos preparados. Aguarde conectar e envie os links atualizados.');
 E('returns-stop').onclick=()=>act(E('returns-stop'),'call_returns_stop',{},'Retornos parados.');
 E('conference').onchange=()=>act(E('conference'),'call_conference',{enabled:E('conference').checked},'Conversa entre convidados atualizada.');
 E('ice-import').onclick=()=>{E('ice-file').value='';E('ice-file').click();};E('ice-file').onchange=async()=>{try{const file=E('ice-file').files[0];if(!file)return;if(file.size>16384)throw Error('Arquivo ICE excede16KB');await request('call_ice_import',{document:JSON.parse(await file.text())});message('Configuração TURN salva. Prepare novamente os retornos.');}catch(e){message(e.message,true);}};
 E('ice-reset').onclick=()=>act(E('ice-reset'),'call_ice_reset',{},'Rede automática restaurada. Prepare novamente os retornos.');
 E('guests').addEventListener('click',e=>{
  const remove=e.target.closest('button[data-remove-audio]');if(remove){const card=remove.closest('.call');remove.closest('label').remove();captureGuestDraft({target:card.querySelector('[data-audio]')});message('Fonte removida do rascunho. Clique Salvar retorno para aplicar.');return;}
  const button=e.target.closest('button[data-route]');if(!button)return;const card=button.closest('.call'),key=button.dataset.route;
  if(button.dataset.copy){navigator.clipboard.writeText(card.querySelector('[data-link]').value).then(()=>message('Link copiado.')).catch(()=>message('Selecione e copie o link do convidado.',true));return;}
  if(button.dataset.reconnect){act(button,'call_reconnect',{key},'Reconexão solicitada.');return;}
  const draft=guestDrafts.get(key);if(pendingRoutes.has(key)||['awaitEcho','echoTimeout'].includes(draft?.phase)){message('O retorno já foi confirmado. Aguarde ou confira o estado antes de salvar novamente.',true);return;}
  if(card.querySelector('[data-audio]').value==='custom'&&[...card.querySelectorAll('[data-sources]:checked')].some(el=>!allowedAudio(key).some(a=>a.key===el.value))){message('Há fonte de áudio indisponível ou privada. Remova-a da seleção ou escolha outro modo antes de salvar.',true);return;}
  if(card.querySelector('[data-video]').selectedOptions[0]?.disabled){message('A entrada de retorno não está disponível. Escolha outra antes de salvar.',true);return;}
  act(button,'call_return_route',{key,video:card.querySelector('[data-video]').value,audio:card.querySelector('[data-audio]').value,gain:Number(card.querySelector('[data-gain]').value)/100,audioSources:[...card.querySelectorAll('[data-sources]:checked')].map(el=>el.value)},'Retorno salvo.');
 });
 E('guests').addEventListener('change',e=>{if(!e.target.matches('[data-audio]'))return;e.target.closest('.call').querySelector('[data-custom]').hidden=e.target.value!=='custom';});
 function captureGuestDraft(e){
  if(!e.target.matches('[data-video],[data-audio],[data-gain],[data-sources]'))return;
  const card=e.target.closest('.call'),key=card?.querySelector('button[data-route]')?.dataset.route;if(!key)return;
  if(!guestDrafts.has(key)&&guestDrafts.size>=8){message('Há rascunhos para oito convidados. Salve ou resolva os atuais antes de editar outro.',true);return;}
  guestDrafts.set(key,{...routeValues({video:card.querySelector('[data-video]').value,audio:card.querySelector('[data-audio]').value,gain:Number(card.querySelector('[data-gain]').value)/100,audioSources:[...card.querySelectorAll('[data-sources]:checked')].map(el=>el.value)}),revision:++draftRevision,phase:'dirty'});
 }
 E('guests').addEventListener('input',captureGuestDraft);E('guests').addEventListener('change',captureGuestDraft);
 function renderGuests(){
  reconcileDrafts();const c=calls(),individual=c.capability==='individual-PCM-WebRTC';
  const hash=JSON.stringify([c.guests,c.returns,c.audioChoices,state.inputs?.map(i=>[i.key,i.name])]);
  if(hash===guestFingerprint||E('guests').contains(document.activeElement)&&/INPUT|SELECT/.test(document.activeElement.tagName))return;guestFingerprint=hash;
  const open=new Set([...E('guests').querySelectorAll('details[open]')].map(d=>d.dataset.key));
  E('guests').innerHTML=guests().map(g=>{
   const r=c.returns?.find(r=>r.key===g.key),d=r?.diagnostics,videoName=!r?.video||r.video==='program'?'Programa':state.inputs?.find(i=>i.key===r.video)?.name||'Entrada removida';
   const values=guestDrafts.get(g.key)||r,video=values?.video||'program',audioMode=values?.audio||'program',savedAudioMode=r?.audio||'program',audioName=savedAudioMode==='silent'?'Somente o diretor enquanto você fala':savedAudioMode==='custom'?'Fontes escolhidas, sem a própria voz':'Programa sem a própria voz'+(c.conference!==false?' + outros convidados':'');
   const options=(state.inputs||[]).map(i=>'<option value="'+esc(i.key)+'"'+(video===i.key?' selected':'')+'>'+esc(i.name)+'</option>').join('')+(video!=='program'&&!(state.inputs||[]).some(i=>i.key===video)?'<option value="'+esc(video)+'" selected disabled>Entrada indisponível · escolha outra</option>':'');
   const choices=allowedAudio(g.key),audio=choices.map(a=>'<label><input type="checkbox" data-sources value="'+esc(a.key)+'"'+(values?.audioSources?.includes(a.key)?' checked':'')+'>'+esc(a.name)+'</label>').join('')+(audioMode==='custom'?(values?.audioSources||[]).filter(key=>!choices.some(a=>a.key===key)).map(key=>'<label><input type="checkbox" data-sources checked disabled value="'+esc(key)+'">Fonte indisponível ou privada <button type="button" data-remove-audio="'+esc(key)+'">Remover da seleção</button></label>').join(''):'');
   const draft=guestDrafts.get(g.key),draftNote=draft?.phase==='awaitEcho'?'Salvo no motor · aguardando atualização do estado…':draft?.phase==='echoTimeout'?'O estado ainda não refletiu o retorno confirmado. Confira o motor; não envie novamente.':draft?'Alterações não salvas.':'';
   return '<article class="call"><div class="call-heading"><strong>'+esc(g.person?.name||g.name)+'</strong><span class="badge">'+esc(r?.publisher==='publishing'?(r.peerConnectionVerified?'Retorno conectado':'Retorno pronto · aguarda convidado'):'Retorno não preparado')+'</span></div><p class="summary">O convidado vê: <strong>'+esc(videoName)+'</strong><br>O convidado ouve: <strong>'+esc(audioName)+'</strong></p><label>Link do convidado<div class="call-link"><input data-link readonly value="'+esc(g.guest)+'"><button data-route="'+esc(g.key)+'" data-copy="1">Copiar link</button></div></label><details data-key="'+esc(g.key)+'"'+(open.has(g.key)?' open':'')+'><summary>Ajustar o que este convidado vê e ouve</summary><div class="call-grid"><label>Vídeo<select data-video><option value="program">Programa</option>'+options+'</select></label><label>Áudio<select data-audio>'+['program','custom','silent'].map((v,i)=>'<option value="'+v+'"'+(audioMode===v?' selected':'')+'>'+['Programa sem a própria voz','Escolher fontes de áudio','Somente talkback'][i]+'</option>').join('')+'</select></label><div data-custom'+(audioMode!=='custom'?' hidden':'')+'>Fontes escolhidas<div class="sources">'+audio+'</div></div></div><p role="status">'+esc(draftNote)+'</p><button data-route="'+esc(g.key)+'"'+(pendingRoutes.has(g.key)||['awaitEcho','echoTimeout'].includes(draft?.phase)?' disabled':'')+'>Salvar retorno</button> <button data-route="'+esc(g.key)+'" data-reconnect="1"'+(!individual?' disabled':'')+'>Reconectar</button><details data-key="'+esc(g.key)+'-advanced"'+(open.has(g.key+'-advanced')?' open':'')+'><summary>Nível e diagnóstico avançado</summary><label>Nível do retorno (%)<input data-gain type="number" min="0" max="200" step="5" value="'+Math.round((values?.gain??1)*100)+'"></label><p>'+esc(d?`${d.ice||'Sem ICE'} · ${d.transport||'Sem transporte'} · RTT ${d.rttMs===null?'—':Math.round(d.rttMs)+'ms'} · fila ${Math.round(d.queuedMs)}ms`:'Sem diagnóstico de retorno.')+'</p></details></details>'+(r?.error?'<p role="alert">'+esc(r.error)+'</p>':'')+'</article>';
  }).join('')||'<p>Nenhuma entrada Call criada.</p>';
 }
 function renderAvailability(){
  const present=guests().length>0;
  E('calls-empty').hidden=present||!state.connected;
  for(const id of ['calls-returns','calls-talkback','calls-network'])E(id).hidden=!present;
 }
 function refresh(){
  state=window.FreeMixRemote?.getState()||{};const c=calls(),nextScope=state.preset||'';
  if(scope!==nextScope){stop();scope=nextScope;guestDrafts.clear();pendingRoutes.clear();selection=c.rapidTargets??null;saving=false;selectionEpoch++;echo=null;selectionMessage='';selectionError=false;guestFingerprint='';targetFingerprint='';}
  if(!saving){const value=c.rapidTargets??null,sig=signature(value);if(echo&&sig===echo.expected)echo=null;if(!echo||sig!==echo.previous||Date.now()>echo.until){if(signature(selection)!==sig){stop();selection=value===null?null:[...value];selectionMessage='';selectionError=false;}echo=null;}}
  const liveGuestKeys=new Set(guests().map(g=>g.key));for(const key of guestDrafts.keys())if(!liveGuestKeys.has(key)){guestDrafts.delete(key);pendingRoutes.delete(key);}
  for(const key of pendingRoutes.keys())if(!liveGuestKeys.has(key))pendingRoutes.delete(key);
  renderTargets();renderGuests();renderAvailability();
  E('conference').checked=c.conference!==false;
  E('return-status').textContent=c.capability==='individual-PCM-WebRTC'?'Retorno individual por convidado.':'Clique Preparar retornos para configurar o retorno de cada convidado.';
  E('return-compatibility').textContent=c.capability==='individual-PCM-WebRTC'?'Cada pessoa recebe o próprio retorno, sem ouvir a própria voz.':'O retorno B antigo é compartilhado e não garante seleção por convidado.';
  E('ice-status').textContent=c.ice?.configured?'TURN configurado · '+c.ice.servers+'servidor(es) · '+c.ice.transportPolicy+' · credenciais ocultas.':'Rede automática.';
  if(document.activeElement!==E('mic')){const previous=E('mic').value;E('mic').innerHTML=(state.audioInputs||[]).filter(i=>['wasapi_input_capture','ffmpeg_source'].includes(i.kind)).map(i=>'<option value="'+esc(i.name)+'">'+esc(i.name)+'</option>').join('');if([...E('mic').options].some(o=>o.value===previous))E('mic').value=previous;}
 }
 refresh();setInterval(refresh,500);
})();
