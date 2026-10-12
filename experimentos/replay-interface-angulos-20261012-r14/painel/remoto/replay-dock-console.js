// Shared Replay console. The same template/controller is mounted in the Mesa
// dock and the external /replay document. No operator command on mount/render.
(() => {'use strict';
 function waitReplayMediaEvent(target,event,{signal,timeoutMs=8000,operation=()=>{}}={}){
  return new Promise((resolve,reject)=>{
   let done=false,timer=null;
   const clean=()=>{clearTimeout(timer);target.removeEventListener(event,complete);target.removeEventListener('error',failed);signal?.removeEventListener('abort',aborted);};
   const finish=error=>{if(done)return;done=true;clean();error?reject(error):resolve();};
   const complete=()=>finish(),failed=()=>finish(Error('A prévia recusou a operação de mídia')),aborted=()=>finish(signal.reason||Error('Prévia encerrada'));
   if(signal?.aborted){aborted();return;}
   target.addEventListener(event,complete,{once:true});target.addEventListener('error',failed,{once:true});signal?.addEventListener('abort',aborted,{once:true});timer=setTimeout(()=>finish(Error('Tempo esgotado na operação da prévia')),timeoutMs);
   try{operation();}catch(error){finish(error);}
  });
 }
 const instances=new WeakMap();let documentInstance=null;
 window.FreeMixReplayDock={mount(host,{endpoint='/api/replay',onState=()=>{},onSettings=()=>{},onRetention=()=>{},getScope=()=>null}={}){
  if(!host||host.ownerDocument!==document)throw Error('REPLAY_HOST');
  if(instances.has(host))return instances.get(host);
  if(documentInstance)throw Error('ONE_REPLAY_COMPONENT_PER_DOCUMENT');
  const apiURL=new URL(endpoint,location.href);if(!['http:','https:'].includes(apiURL.protocol)||apiURL.pathname!=='/api/replay')throw Error('REPLAY_ENDPOINT');
  const endpointURL=apiURL.href;
  host.classList.add('rp-common');host.innerHTML=TEMPLATE;
  const el=id=>host.querySelector('[id="'+id+'"]'),make=tag=>document.createElement(tag);
  let replay=null,deck='A',busy=false,disposed=false,page=1,eventSignature='',historyState=null,historyIn=null,historyOut=null,historyConfirmed=null,admissionEpoch=0,pendingPosts=0;
  const backendScope=()=>replay?.playlist?.preparation?.scopeToken??null;
  const beginRead=()=>({epoch:admissionEpoch,scope:getScope(),sessionId:replay?.session?.id??null,backendScope:backendScope()});
  const beginWrite=()=>{pendingPosts++;return {epoch:++admissionEpoch,scope:getScope(),backendScope:backendScope()};};
  const endWrite=()=>{pendingPosts=Math.max(0,pendingPosts-1);admissionEpoch++;};
  function acceptWrite(token,data){if(disposed||token.epoch!==admissionEpoch||token.scope!==getScope()||(token.backendScope&&backendScope()!==token.backendScope)||(data?.playlist?.preparation?.scopeToken!==undefined&&token.backendScope&&data.playlist.preparation.scopeToken!==token.backendScope))return false;monitorAdmitted=true;acceptState(data);return true;}
  function acceptRead(token,data){if(disposed||pendingPosts||!token||token.epoch!==admissionEpoch||token.scope!==getScope())return false;monitorAdmitted=true;render(data);return true;}
  const anglesByEvent=new Map(),checkedEvents=new Set(),ab=['A','B'],componentAbort=new AbortController();
  // This is the actual managed A/B input screenshot, never Program or a file.
  // A cached Mesa startup render is not admission to a Native monitor request.
  let monitorAdmitted=false,monitorFlight=null,monitorLastLaunch=0,monitorNext=0,monitorUncertain=false;
  const monitors=new Map(ab.map(player=>[player,{key:null,generation:0,frame:null,capturedAt:null,scopeToken:null}]));
  function monitorIdentity(player){const p=replay?.players?.[player];return p?.metadataProbed===true&&p.hasVideo===true&&typeof p.file==='string'&&p.file&&typeof p.eventId==='string'&&p.eventId&&typeof p.cam==='string'&&p.cam?JSON.stringify([getScope(),replay.session?.id??null,backendScope(),player,p.eventId,p.cam,p.file,p.playbackSpeed??null,p.preparedEffect?.kind??null,admissionEpoch]):null;}
  function clearMonitor(player,text){const m=monitors.get(player),image=el('preview-'+player);m.generation++;m.frame=null;m.capturedAt=null;m.scopeToken=null;image.hidden=true;image.removeAttribute('src');image.removeAttribute('data-captured-at');image.removeAttribute('title');el('preview-status-'+player).textContent=text;if(monitorFlight?.player===player)monitorFlight.controller.abort(new DOMException('Player alterado','AbortError'));}
  function paintMonitors(){for(const player of ab){const m=monitors.get(player),key=monitorIdentity(player);if(key!==m.key){m.key=key;clearMonitor(player,key?'Aguardando captura local do player.':'Nenhum lance verificado carregado.');}if(monitorUncertain){el('preview-status-'+player).textContent='Captura nativa com término desconhecido; monitor parado até recuperação verificada.';continue;}if(m.capturedAt!==null)el('preview-status-'+player).textContent='Captura local · '+Math.max(0,(Date.now()-m.capturedAt)/1000).toFixed(1)+' s atrás';}}
  function monitorVisible(player){const e=el('preview-box-'+player);if(document.visibilityState==='hidden'||!e.getClientRects().length)return false;const r=e.getBoundingClientRect(),view=e.ownerDocument.defaultView;return r.width>0&&r.height>0&&r.bottom>0&&r.right>0&&r.top<view.innerHeight&&r.left<view.innerWidth;}
  async function monitorPlayers(){
   paintMonitors();if(disposed||!monitorAdmitted||pendingPosts||monitorFlight||monitorUncertain||Date.now()-monitorLastLaunch<500)return;
   let player=null;for(let i=0;i<ab.length;i++){const candidate=ab[(monitorNext+i)%ab.length];if(monitors.get(candidate).key&&monitorVisible(candidate)){player=candidate;monitorNext=(ab.indexOf(candidate)+1)%ab.length;break;}}if(!player)return;
   const m=monitors.get(player),key=m.key,generation=m.generation,admission=beginRead(),p=replay.players[player],controller=new AbortController(),composed=composeAbort(controller.signal,7000),own={player,controller};monitorFlight=own;monitorLastLaunch=Date.now();el('preview-status-'+player).textContent='Capturando Replay '+player+' no motor…';
   const current=()=>!disposed&&monitorFlight===own&&m.generation===generation&&m.key===key&&monitorIdentity(player)===key&&admission.epoch===admissionEpoch&&admission.scope===getScope()&&monitorVisible(player);
   try{
    const url=new URL('/api/replay-player-preview',endpointURL);url.searchParams.set('player',player);const response=await fetch(url,{signal:scopedSignal(composed.signal),cache:'no-store'}),result=await response.json();if(!current())return;
    if(!response.ok||result.success!==true){if(result.preview?.uncertain===true||result.code==='PREVIEW_NATIVE_UNCERTAIN'||result.code==='PREVIEW_DEADLINE'){monitorUncertain=true;for(const id of ab)clearMonitor(id,'Monitor parado; término da captura nativa desconhecido.');}else el('preview-status-'+player).textContent=result.error||'Captura local temporariamente indisponível.';return;}
    const preview=result.preview;if(preview?.available!==true){clearMonitor(player,preview?.reason||'Nenhuma imagem confirmada para este player.');return;}
    if(preview.player!==player||preview.eventId!==p.eventId||preview.cam!==p.cam||!/^[a-f0-9]{24}$/.test(preview.scopeToken||'')||!Number.isFinite(preview.capturedAt)||preview.capturedAt>Date.now()+5000||typeof preview.image!=='string'||!/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(preview.image)||preview.image.length>1400000)throw Error('Resposta da captura não corresponde ao player atual.');
    // Decode off-screen; keep a stale or undecodable response out of the deck.
    const frame=new Image();const decoded=waitReplayMediaEvent(frame,'load',{signal:composed.signal,timeoutMs:8000,operation:()=>{frame.src=preview.image;}});await decoded;if(typeof frame.decode==='function')await waitReplayMediaEvent(frame,'decoded',{signal:composed.signal,timeoutMs:8000,operation:()=>{frame.decode().then(()=>frame.dispatchEvent(new Event('decoded')),()=>frame.dispatchEvent(new Event('error')));}});if(!current())return;if(!frame.complete||frame.naturalWidth<=0||frame.naturalHeight<=0)throw Error('A imagem local não foi decodificada.');
    m.frame=frame;m.capturedAt=preview.capturedAt;m.scopeToken=preview.scopeToken;frame.id='preview-'+player;frame.alt='Prévia local de Replay '+player;frame.dataset.capturedAt=String(preview.capturedAt);frame.title='Captura local de Replay '+player+' · '+new Date(preview.capturedAt).toLocaleTimeString();frame.hidden=false;el('preview-'+player).replaceWith(frame);paintMonitors();
   }catch(error){if(current()){if(composed.signal.aborted&&!controller.signal.aborted){monitorUncertain=true;for(const id of ab)clearMonitor(id,'Monitor parado; resposta da captura não confirmada.');}else el('preview-status-'+player).textContent=error.message;}}
   finally{composed.cleanup();if(monitorFlight===own)monitorFlight=null;}
  }
  const monitorTimer=setInterval(monitorPlayers,500);
  function scopedSignal(signal){
   if(typeof AbortSignal.any==='function')return AbortSignal.any([signal,componentAbort.signal]);
   const controller=new AbortController(),onAbort=()=>controller.abort(signal.aborted?signal.reason:componentAbort.signal.reason),clean=()=>{signal.removeEventListener('abort',onAbort);componentAbort.signal.removeEventListener('abort',onAbort);};
   if(signal.aborted||componentAbort.signal.aborted)onAbort();else{signal.addEventListener('abort',onAbort,{once:true});componentAbort.signal.addEventListener('abort',onAbort,{once:true});controller.signal.addEventListener('abort',clean,{once:true});}return controller.signal;
  }
  const message=text=>{el('message').textContent=text;};
  const paintTime=seconds=>{if(!Number.isFinite(Number(seconds)))return '—';const ms=Math.max(0,Number(seconds))*1000;return String(Math.floor(ms/60000)).padStart(2,'0')+':'+String(Math.floor(ms/1000)%60).padStart(2,'0')+'.'+String(Math.floor(ms%1000)).padStart(3,'0');};
  function selectDeck(id){if(!ab.includes(id))return;deck=id;paintState();}
  async function request(action,data={}){
   if(disposed||busy)return;
   if(data.player!==undefined&&!ab.includes(data.player)){message('Escolha Replay A ou Replay B.');return;}
   const admission=beginWrite();busy=true;paintState();window.FreeMixReplayPlaylist?.refreshLocks?.();window.FreeMixReplayCurve?.refreshLocks?.();message('Confirmando no motor…');
   try{
    const response=await fetch(endpointURL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...data}),signal:scopedSignal(AbortSignal.timeout(action==='history-frame'?35000:180000))});
    const result=await response.json();if(!response.ok||result.success!==true||!result.replay)throw Error(result.error||'Operação recusada');
    if(!acceptWrite(admission,result.replay))throw Error('O contexto mudou durante a confirmação; confira o estado atual.');message(['capture','mark-out','capture-range'].includes(action)?'Vídeo do lance salvo.':'Operação confirmada pelo motor.');return result.replay;
   }catch(error){if(!disposed)message(error.message);}
   finally{endWrite();busy=false;if(!disposed){paintState();setHistoryButtons(historyConfirmed!==null);window.FreeMixReplayPlaylist?.refreshLocks?.();window.FreeMixReplayCurve?.refreshLocks?.();}}
  }
  function acceptState(data){render(data);onState(data);}
  function paintState(){
   const current=replay||{},prepared=ab.some(id=>current.players?.[id]?.playbackSpeed===100),loaded=current.players?.[deck],preparingPost=window.FreeMixReplayCurve?.isPosting?.()||window.FreeMixReplayPlaylist?.isPosting?.();
   for(const b of host.querySelectorAll('[data-replay-command]'))b.disabled=busy;
   for(const id of ab){const p=current.players?.[id],seek=el('seek-'+id),duration=Math.max(0,Number(p?.mediaDuration)||Number(p?.duration||0)*1000);el('deck-'+id).classList.toggle('on',deck===id);el('player-'+id).textContent=p?`${p.cam} · ${paintTime((p.mediaCursor||0)/1000)} / ${paintTime(duration/1000)}`:'Nenhum lance carregado';seek.max=String(duration);seek.disabled=busy||!p;if(document.activeElement!==seek)seek.value=String(Math.min(duration,Math.max(0,Number(p?.mediaCursor)||0)));}
   const canAir=!!loaded&&typeof loaded.eventId==='string'&&!!loaded.eventId&&typeof loaded.cam==='string'&&!!loaded.cam&&typeof loaded.file==='string'&&!!loaded.file&&loaded.metadataProbed===true&&loaded.hasVideo===true;
   el('replay-air').disabled=busy||!canAir;el('replay-ready').textContent=canAir?'Replay '+deck+' carregado; No Ar solicita sua entrada no Programa.':'Carregue um lance em Replay '+deck+' antes de colocar no ar.';
   el('replay-live').disabled=busy||!/^REPLAY [AB]$/.test(current.program||'');
   el('record-btn').textContent=current.rec?'■ REC SSD':'● REC SSD';el('record-btn').classList.toggle('live',!!current.rec);el('record-btn').classList.toggle('on',!current.rec);
   el('link-players').classList.toggle('on',!!current.linked);
   const value=prepared?100:(Number(current.speed)||100),range=el('replay-speed-range');range.disabled=busy||preparingPost||prepared;if(document.activeElement!==range)range.value=String(value);
   el('speed-lbl').textContent=prepared?'Velocidade incorporada · reprodução 100%':value+'%';
   for(const b of host.querySelectorAll('[data-replay-speed]')){b.disabled=busy||preparingPost||prepared;b.classList.toggle('on',Number(b.dataset.replaySpeed)===value);}
   el('replay-tc').textContent=current.rec?'Gravando SSD':'SSD parado';
   for(const b of el('replay-pages').children)b.classList.toggle('on',Number(b.dataset.replayPage)===page);
   paintMonitors();
  }
  function renderEvents(){
   const events=replay?.events||[],signature=JSON.stringify([page,events.map(e=>[e.id,e.name,e.dur,e.clips?.map(c=>[c.cam,c.file,c.start,c.end,c.duration,c.playbackSpeed])])]);if(signature===eventSignature)return;eventSignature=signature;
   const body=el('events-list'),scroll=el('events-scroll').scrollTop;body.replaceChildren();
   for(const event of events.slice((page-1)*20,page*20)){
    const row=make('tr');row.className='ev-item';row.classList.toggle('sel',checkedEvents.has(event.id));row.dataset.event=event.id;
    const cell=child=>{const td=make('td');typeof child==='string'?td.textContent=child:td.append(child);row.append(td);return td;};
    const checked=make('input');checked.type='checkbox';checked.title='Marcar linha para referência na tabela';checked.checked=checkedEvents.has(event.id);checked.onchange=()=>{checked.checked?checkedEvents.add(event.id):checkedEvents.delete(event.id);row.classList.toggle('sel',checked.checked);};cell(checked);
    const first=event.clips?.[0]||{};cell(paintTime(first.start));cell(paintTime(first.end));cell(paintTime(event.dur));cell(first.playbackSpeed===100?'100%':(Number(replay.speed)||100)+'%');
    const select=player=>{const value=make('select'),key=event.id+':'+player;value.setAttribute('aria-label',event.name+' · câmera Replay '+player);for(const clip of event.clips||[]){const o=make('option');o.value=clip.cam;o.textContent=clip.cam;value.append(o);}const selected=anglesByEvent.get(key)||event.cam;if(Array.from(value.options).some(o=>o.value===selected))value.value=selected;value.onchange=()=>anglesByEvent.set(key,value.value);return value;};
    const a=select('A'),b=select('B');cell(a);cell(b);const actions=make('span');
    for(const id of ab){const button=make('button');button.type='button';button.className='b ev-btn';button.textContent='▶ '+id;button.title='Carregar em Replay '+id;button.onclick=()=>{if(busy)return;deck=id;request('load',{player:id,eventId:event.id,cam:(id==='A'?a:b).value});};actions.append(button);}
    const remove=make('button');remove.type='button';remove.className='b';remove.textContent='✕';remove.title='Excluir lance da lista';remove.onclick=()=>request('delete',{eventId:event.id});actions.append(remove);cell(actions);body.append(row);
   }
   if(!body.children.length){const row=make('tr'),td=make('td');td.colSpan=8;td.textContent='Nenhum evento gravado nesta página. Use [-5], [-10], [-20] ou In / Out.';row.append(td);body.append(row);}el('events-scroll').scrollTop=scroll;
  }
  function render(data){
   if(disposed||!data)return;
   if(replay&&(Object.hasOwn(data,'session')&&replay.session?.id!==data.session?.id||backendScope()&&data.playlist?.preparation?.scopeToken&&backendScope()!==data.playlist.preparation.scopeToken)){admissionEpoch++;stopHistoryVideo();historyState=null;historyIn=historyOut=historyConfirmed=null;el('history-image').hidden=true;el('history-seek').disabled=el('history-cursor').disabled=true;el('history-range').textContent='IN: — · OUT: —';el('history-save').disabled=true;setHistoryButtons(false);el('history-status').textContent='Contexto alterado; aguardando o histórico correspondente.';}
   if(!replay&&ab.includes(data.activePlayer))deck=data.activePlayer;
   replay={...(replay||{}),...data};window.FreeMixReplayPlaylist?.render(replay);window.FreeMixReplayCurve?.render(replay);renderEvents();paintState();if(Object.hasOwn(data,'history'))renderHistory(data.history);autoHistory();
  }

    function historyStep(){const parts=historyState?.frameRate?.split('/').map(Number);return parts?.[0]&&parts?.[1]?parts[1]/parts[0]:1/30;}
    function setHistoryButtons(confirmed){for(const id of ['history-back-frame','history-next-frame'])el(id).disabled=!historyState||busy;for(const id of ['history-in','history-out'])el(id).disabled=!confirmed;}
    function renderHistory(history){if(disposed)return;
      if(history&&history.sessionId!==(replay?.session?.id??null))return;
      if(!history){stopHistoryVideo();historyState=null;historyIn=historyOut=historyConfirmed=null;setHistoryButtons(false);el('history-status').textContent='Nenhuma sessão gravada disponível.';return;}
      if(historyState?.sessionId!==history.sessionId){stopHistoryVideo();historyIn=historyOut=historyConfirmed=null;el('history-image').hidden=true;}
      historyState=history;const slider=el('history-seek'),cursor=el('history-cursor'),old=Number(slider.value),wasDisabled=slider.disabled;
      slider.min=cursor.min=history.start;slider.max=cursor.max=history.end;slider.step=cursor.step=historyStep();slider.disabled=cursor.disabled=false;
      slider.value=cursor.value=wasDisabled?Math.max(history.start,history.end-1):Math.min(history.end,Math.max(history.start,old));
      const camera=el('history-camera'),selected=camera.value;camera.replaceChildren();for(const name of history.cameras){const o=document.createElement('option');o.textContent=name;camera.append(o);}if(history.cameras.includes(selected))camera.value=selected;
      if(historyConfirmed===null&&!framePresentation)el('history-status').textContent='Histórico disponível: '+history.start.toFixed(3)+' até '+history.end.toFixed(3)+' s. Mova o cursor para conferir o quadro.';
      setHistoryButtons(historyConfirmed!==null);renderHistoryMarks();
    }
    function refreshHistory(){request('history-refresh');}
    function historyCursorChanged(dragging){cancelFramePresentation();el('history-cursor').value=Number(el('history-seek').value).toFixed(3);historyConfirmed=null;setHistoryButtons(false);historyDragging=!!dragging;if(dragging)scrubHistory(Number(el('history-seek').value));}
    function historyBuffered(local){const ranges=el('history-video').buffered;for(let i=0;i<ranges.length;i++)if(local>=ranges.start(i)&&local<=ranges.end(i)-historyStep())return true;return false;}
    function scrubHistory(cursor){
      if(busy||!historyState)return;
      const own=historyPlayback,video=el('history-video');
      if(own){
        const local=cursor-own.origin;
        if(local>=0&&historyBuffered(local)){
          scrubGeneration++;scrubPendingCursor=null;scrubController?.abort();
          if(!video.paused){video.pause();own.resumeWhenReady=false;el('history-play').textContent='▶ Reproduzir histórico';}
          el('history-image').hidden=true;video.hidden=false;
          video.currentTime=local;
          return;
        }
      }
      scrubPendingCursor=cursor;
      if(!scrubInFlight)runScrubFetch();
    }
    let framePresentation=null;
    function captureHistoryFrameContext(data={}){
      return {epoch:scrubEpoch,generation:++scrubGeneration,sessionId:data.sessionId||historyState?.sessionId,cam:data.cam||el('history-camera').value,cursor:Number(data.cursor??el('history-seek').value)};
    }
    function isHistoryFrameCurrent(context){
      return !!context&&context.epoch===scrubEpoch&&context.generation===scrubGeneration&&historyState?.sessionId===context.sessionId&&el('history-camera').value===context.cam&&Number.isFinite(context.cursor)&&Math.abs(Number(el('history-seek').value)-context.cursor)<=historyStep()/2;
    }
    function cancelFramePresentation(){framePresentation?.cancel();}
    function presentHistoryFrame(frame,context){
      if(!isHistoryFrameCurrent(context))return Promise.resolve(false);
      if(!frame||typeof frame.image!=='string'||frame.cam!==context.cam||!Number.isFinite(Number(frame.cursor))||Math.abs(Number(frame.cursor)-context.cursor)>historyStep()/2||frame.sessionId!==undefined&&frame.sessionId!==context.sessionId)return Promise.reject(Error('Quadro não corresponde à busca atual'));
      cancelFramePresentation();historyConfirmed=null;setHistoryButtons(false);
      const image=el('history-image'),expectedURL=new URL(frame.image,endpointURL).href;
      image.hidden=true;
      return new Promise((resolve,reject)=>{
        let settled=false,timer=null;
        const own={context,cancel:()=>finish(null,false)};
        const finish=(error,confirmed)=>{
          if(settled)return;settled=true;clearTimeout(timer);image.removeEventListener('load',loaded);image.removeEventListener('error',failed);
          if(framePresentation===own)framePresentation=null;
          error?reject(error):resolve(confirmed);
        };
        const failed=()=>{if(!isHistoryFrameCurrent(context)){finish(null,false);return;}historyConfirmed=null;setHistoryButtons(false);finish(Error('O navegador não conseguiu decodificar o quadro'),false);};
        const loaded=async()=>{
          try{
            if(typeof image.decode==='function')await image.decode();
            if(settled||framePresentation!==own||!isHistoryFrameCurrent(context)){finish(null,false);return;}
            if(!image.complete||image.naturalWidth<=0||image.naturalHeight<=0||(image.currentSrc||image.src)!==expectedURL)throw Error('O quadro solicitado ainda não foi apresentado');
            if(historyPlayback)el('history-video').hidden=true;
            image.hidden=false;historyConfirmed=Number(frame.cursor);setHistoryButtons(true);
            el('history-status').textContent=frame.cam+' · quadro em '+Number(frame.cursor).toFixed(3)+' s';
            finish(null,true);
          }catch(error){if(isHistoryFrameCurrent(context)){historyConfirmed=null;setHistoryButtons(false);finish(error,false);}else finish(null,false);}
        };
        framePresentation=own;image.addEventListener('load',loaded,{once:true});image.addEventListener('error',failed,{once:true});
        timer=setTimeout(()=>{if(!isHistoryFrameCurrent(context)){finish(null,false);return;}historyConfirmed=null;setHistoryButtons(false);finish(Error('Tempo esgotado ao decodificar o quadro'),false);},8000);
        image.src=expectedURL;if(image.complete&&image.naturalWidth>0)queueMicrotask(loaded);
      });
    }

    function cancelScrub(){cancelFramePresentation();scrubEpoch++;scrubGeneration++;scrubPendingCursor=null;historyDragging=false;if(scrubTimer){clearTimeout(scrubTimer);scrubTimer=null;}scrubController?.abort();scrubController=null;scrubInFlight=false;}
    function composeAbort(signal,ms){
      if(typeof AbortSignal.any==='function')return {signal:AbortSignal.any([signal,AbortSignal.timeout(ms)]),cleanup(){}};
      const controller=new AbortController(),onAbort=()=>controller.abort(signal.reason);
      signal.addEventListener('abort',onAbort,{once:true});
      const timer=setTimeout(()=>controller.abort(new DOMException('Tempo esgotado','TimeoutError')),ms);
      return {signal:controller.signal,cleanup(){clearTimeout(timer);signal.removeEventListener('abort',onAbort);}};
    }
    async function runScrubFetch(){
      if(scrubPendingCursor===null||!historyState)return;
      const epoch=scrubEpoch,wait=120-(Date.now()-scrubLastSentAt);
      if(wait>0){scrubInFlight=true;scrubTimer=setTimeout(()=>{scrubTimer=null;if(scrubEpoch===epoch)runScrubFetch();else scrubInFlight=false;},wait);return;}
      const cursor=scrubPendingCursor,cam=el('history-camera').value,sessionId=historyState.sessionId,generation=++scrubGeneration;
      scrubPendingCursor=null;scrubInFlight=true;scrubLastSentAt=Date.now();scrubController=new AbortController();
      const composed=composeAbort(scrubController.signal,35000);
      try{
        const result=await historyApi('history-frame',{sessionId,cam,cursor},composed.signal);
        if(epoch!==scrubEpoch||generation!==scrubGeneration)return;
        if(!historyState||historyState.sessionId!==sessionId||el('history-camera').value!==cam)return;
        const frame=result.historyFrame;
        if(!frame||Math.abs(Number(el('history-seek').value)-frame.cursor)>historyStep()/2)return;
        await presentHistoryFrame(frame,{epoch,generation,sessionId,cam,cursor});
      }catch(e){const context={epoch,generation,sessionId,cam,cursor};if(isHistoryFrameCurrent(context))el('history-status').textContent=e.message;}
      finally{composed.cleanup();if(epoch===scrubEpoch){scrubInFlight=false;scrubController=null;if(scrubPendingCursor!==null)runScrubFetch();}}
    }
    function historyPositionChanged(){if(!historyState)return;el('history-seek').value=Math.min(historyState.end,Math.max(historyState.start,Number(el('history-cursor').value)));historyCursorChanged();previewHistory();}
    function previewHistory(){if(!historyState||busy)return;cancelScrub();historyConfirmed=null;setHistoryButtons(false);if(replay?.historyPlaybackSupported)startHistoryVideo(Number(el('history-seek').value),false);else {scrubPendingCursor=Number(el('history-seek').value);runScrubFetch();}}
    function stepHistory(delta){if(!historyState||busy)return;el('history-seek').value=Math.min(historyState.end,Math.max(historyState.start,Number(el('history-seek').value)+delta*historyStep()));historyCursorChanged();previewHistory();}
    function markHistory(which){if(historyConfirmed===null)return;if(which==='in')historyIn=historyConfirmed;else historyOut=historyConfirmed;renderHistoryMarks();renewHistoryPin();}
    function renderHistoryMarks(){const valid=historyIn!==null&&historyOut!==null&&historyOut-historyIn>=.2&&historyOut-historyIn<=120&&historyIn>=historyState.start&&historyOut<=historyState.end;el('history-range').textContent='IN: '+(historyIn===null?'—':historyIn.toFixed(3)+' s')+' · OUT: '+(historyOut===null?'—':historyOut.toFixed(3)+' s')+(valid?' · '+(historyOut-historyIn).toFixed(3)+' s':'');el('history-save').disabled=!valid;}
    function saveHistoryRange(){if(el('history-save').disabled||busy)return;request('capture-range',{sessionId:historyState.sessionId,start:historyIn,end:historyOut});}
    // This is a local, low-resolution monitoring proxy. Loaded replay players and
    // saved clips retain the original quality and their existing A/B contract.
    let historyPlayback=null,historyGeneration=0,historyRefreshAt=0,historyRefreshing=false,historyPinAt=0,scrubEpoch=0,scrubGeneration=0,scrubInFlight=false,scrubPendingCursor=null,scrubLastSentAt=0,scrubTimer=null,scrubController=null,historyDragging=false;
    const historyViewerId=crypto.randomUUID();
    async function historyApi(action,data={},signal){if(disposed)throw Error("Replay fechado");const response=await fetch(endpointURL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...data}),signal:scopedSignal(signal||AbortSignal.timeout(35000))});const result=await response.json();if(!response.ok||!result.success)throw Error(result.error||'Prévia indisponível');return result.replay;}
    function stopHistoryVideo(){historyGeneration++;cancelScrub();const own=historyPlayback;historyPlayback=null;if(own){own.controller.abort();URL.revokeObjectURL(own.url);}const video=el('history-video');video.pause();video.removeAttribute('src');video.load();video.hidden=true;el('history-play').textContent='▶ Reproduzir histórico';}
    function updateHistoryVideoCursor(){const own=historyPlayback,video=el('history-video');if(!own||video.readyState<2)return;const cursor=Math.min(historyState.end,own.origin+video.currentTime);if(!historyDragging)el('history-seek').value=cursor;el('history-cursor').value=cursor.toFixed(3);if(Math.abs(Number(el('history-seek').value)-cursor)<=historyStep()/2){historyConfirmed=cursor;setHistoryButtons(true);}}
    async function appendHistoryProxy(own,meta,bytes){
      if(own!==historyPlayback)return;
      const sb=own.buffer;await waitReplayMediaEvent(sb,'updateend',{signal:own.controller.signal,timeoutMs:8000,operation:()=>{sb.timestampOffset=meta.start-own.origin;sb.appendWindowStart=Math.max(0,meta.start-own.origin);sb.appendWindowEnd=meta.end-own.origin+.035;sb.appendBuffer(bytes);}});
      if(own!==historyPlayback)return;own.end=meta.end;own.media.duration=Math.max(own.media.duration||0,meta.end-own.origin+.04);own.lastPrepareMs=meta.prepareMs;
      const cutoff=el('history-video').currentTime-24;if(cutoff>0&&!sb.updating)await waitReplayMediaEvent(sb,'updateend',{signal:own.controller.signal,timeoutMs:8000,operation:()=>sb.remove(0,cutoff)});
    }
    async function getHistoryProxy(own,cursor,from){const deadline=composeAbort(own.controller.signal,35000);try{const result=await historyApi('history-preview',{sessionId:own.sessionId,cam:own.cam,cursor,viewerId:historyViewerId,...(from!==undefined?{from}: {})},deadline.signal);if(own!==historyPlayback)throw Error('Busca substituída');const meta=result.historyPreview;if(!meta||!meta.url.startsWith('/api/replay-preview/'))throw Error('O serviço não forneceu vídeo de prévia');const response=await fetch(new URL(meta.url,endpointURL),{signal:scopedSignal(deadline.signal)});if(!response.ok)throw Error('Prévia expirou; escolha o ponto novamente');return {meta,bytes:await response.arrayBuffer()};}finally{deadline.cleanup();}}
    async function startHistoryVideo(cursor,playing){
      if(!historyState)return;stopHistoryVideo();const generation=historyGeneration,video=el('history-video');
      if(!window.MediaSource||!MediaSource.isTypeSupported('video/mp4; codecs="avc1.42E02A,mp4a.40.2"')){el('history-status').textContent='Este navegador não oferece H.264/AAC para reprodução do histórico. Use os quadros ou o console em um navegador compatível.';scrubPendingCursor=cursor;runScrubFetch();return;}
      const media=new MediaSource(),url=URL.createObjectURL(media),own={media,url,controller:new AbortController(),sessionId:historyState.sessionId,cam:el('history-camera').value,generation,loading:true};historyPlayback=own;el('history-image').hidden=true;video.hidden=false;video.src=url;video.muted=!el('history-audio').checked;el('history-status').textContent='Preparando vídeo e áudio do ponto escolhido…';
      try{
        if(media.readyState!=='open')await waitReplayMediaEvent(media,'sourceopen',{signal:own.controller.signal,timeoutMs:8000});
        const {meta,bytes}=await getHistoryProxy(own,cursor);own.origin=meta.start;own.buffer=media.addSourceBuffer('video/mp4; codecs="'+meta.codecs+'"');own.buffer.mode='segments';await appendHistoryProxy(own,meta,bytes);if(own!==historyPlayback)return;
        video.currentTime=Math.max(0,meta.cursor-own.origin);own.loading=false;el('history-status').textContent='Prévia local · '+own.cam+' · vídeo e áudio'+(meta.hasAudio?'':' (sem áudio gravado)')+' · '+meta.prepareMs+' ms para preparar';
        if(playing){await video.play();el('history-play').textContent='⏸ Pausar histórico';}updateHistoryVideoCursor();pumpHistoryVideo();
      }catch(e){if(own!==historyPlayback)return;stopHistoryVideo();el('history-status').textContent=e.message;}
    }
    async function pumpHistoryVideo(){
      const own=historyPlayback,video=el('history-video');if(!own||own.loading||own.end-own.origin-video.currentTime>5||!historyState)return;
      const safeEnd=historyState.end-(historyState.recording ? .25 : 0);if(safeEnd-own.end<.5)return;
      own.loading=true;try{const wasPaused=video.paused,{meta,bytes}=await getHistoryProxy(own,own.end+.001,own.end);if(own!==historyPlayback)return;if(meta.end<=own.end)return;await appendHistoryProxy(own,meta,bytes);if(!wasPaused||own.resumeWhenReady){await video.play();own.resumeWhenReady=false;el('history-play').textContent='⏸ Pausar histórico';}}catch(e){if(own===historyPlayback&&!own.controller.signal.aborted)el('history-status').textContent=e.message;}finally{own.loading=false;}
    }
    function toggleHistoryPlayback(){const video=el('history-video');if(!historyPlayback){startHistoryVideo(Number(el('history-seek').value),true);return;}if(video.paused){historyPlayback.resumeWhenReady=true;video.play().then(()=>{el('history-play').textContent='⏸ Pausar histórico';}).catch(e=>el('history-status').textContent=e.message);}else{video.pause();historyPlayback.resumeWhenReady=false;el('history-play').textContent='▶ Reproduzir histórico';}}
    function historyMonitorAudio(){el('history-video').muted=!el('history-audio').checked;}
    function followHistoryEnd(){if(historyState)startHistoryVideo(Math.max(historyState.start,historyState.end-2),true);}
    async function renewHistoryPin(){if(historyIn===null||!historyState)return;historyPinAt=Date.now();try{await historyApi('history-pin',{sessionId:historyState.sessionId,start:historyIn,end:historyOut!==null&&historyOut>=historyIn&&historyOut-historyIn<=120?historyOut:Math.min(historyIn+120,historyState.end)});}catch(e){el('history-status').textContent=e.message;}}
    async function autoHistory(){
      if(disposed||!host.getClientRects().length||historyRefreshing||!replay?.historySupported||Date.now()-historyRefreshAt<(replay.rec?2500:6000))return;
      const admission=beginRead(),sessionId=replay?.session?.id??null;
      historyRefreshAt=Date.now();historyRefreshing=true;
      try{
        const result=await historyApi('history'),incoming=result.history;
        if(disposed||pendingPosts||admission.epoch!==admissionEpoch||admission.scope!==getScope()||(replay?.session?.id??null)!==sessionId||(incoming&&incoming.sessionId!==sessionId))return;
        let expired=false;if(historyState&&incoming?.sessionId!==historyState.sessionId)stopHistoryVideo();
        if(historyPlayback&&incoming?.start>historyPlayback.origin+el('history-video').currentTime){stopHistoryVideo();historyConfirmed=null;expired=true;}
        if(historyIn!==null&&incoming?.start>historyIn){historyIn=historyOut=null;expired=true;}
        renderHistory(incoming);if(expired)el('history-status').textContent='O ponto expirou pela retenção. Escolha outro ponto.';
        el('history-play').disabled=!incoming||!result.historyPlaybackSupported;el('history-follow').disabled=!incoming||!result.historyPlaybackSupported;
        if(historyIn!==null&&Date.now()-historyPinAt>30000)renewHistoryPin();pumpHistoryVideo();
      }catch(error){if(!disposed&&!historyState)el('history-status').textContent=error.message;}finally{historyRefreshing=false;}
    }
    el('history-video').addEventListener('timeupdate',updateHistoryVideoCursor);el('history-video').addEventListener('seeked',updateHistoryVideoCursor);el('history-video').addEventListener('ended',()=>{if(historyPlayback){historyPlayback.resumeWhenReady=!!historyState?.recording;el('history-play').textContent='▶ Reproduzir histórico';}});
    const pumpTimer=setInterval(()=>{if(!disposed&&host.getClientRects().length)pumpHistoryVideo();},500);

// Browser-only compact controls; no fetch, timer or automatic preparation.
// Root binds callbacks to the approved command/epoch integration.
window.createSpeedCurveControls=function createSpeedCurveControls(host,{getEvents,getBusy,onPrepare,onCancel}={}){
  if(!host||[getEvents,getBusy,onPrepare,onCancel].some(f=>typeof f!=='function'))throw Error('CURVE_UI_CONTRACT');
  const document=host.ownerDocument;
  const box=document.createElement('details');box.className='replay-curve-controls task-details';box.id='replay-curve-controls';
  const summary=document.createElement('summary');summary.textContent='Efeito de velocidade';box.append(summary);
  const field=document.createElement('fieldset');field.style.cssText='margin:8px 0;padding:10px;border:1px solid #52616f;border-radius:3px;font:12px Segoe UI,Arial,sans-serif;';
  const make=(tag,text)=>{const e=document.createElement(tag);if(text)e.textContent=text;return e;};
  const row=(label,control)=>{const l=make('label',label+' ');l.style.cssText='display:flex;align-items:center;gap:8px;margin-bottom:7px;';l.append(control);field.append(l);};
  const event=make('select'),cam=make('select'),preset=make('select');event.id='curve-event';cam.id='curve-camera';preset.id='curve-preset';
  row('Lance',event);row('Câmera',cam);
  for(const [value,label]of[['fast-slow-fast','Rápido → lento → rápido'],['fast-slow','Rápido → lento'],['custom','Personalizado']]){const o=make('option',label);o.value=value;preset.append(o);}row('Curva',preset);
  const table=make('table');table.id='curve-points';table.style.cssText='width:100%;border-collapse:collapse;margin:8px 0;';
  const head=make('thead'),heading=make('tr');for(const text of['Posição no lance (%)','Velocidade (%)',''])heading.append(make('th',text));head.append(heading);table.append(head);
  const body=make('tbody');table.append(body);field.append(table);
  const add=make('button','Adicionar ponto');add.id='curve-add-point';add.type='button';field.append(add);
  const acknowledgment=make('input');acknowledgment.id='curve-audio-silent';acknowledgment.type='checkbox';
  row('Preparar com áudio silencioso',acknowledgment);
  field.append(make('p','O efeito cria um novo lance. A velocidade já estará incorporada; o original continua intacto.'));
  const status=make('p');status.id='curve-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.style.cssText='margin:8px 0;min-height:18px;';field.append(status);
  const prepare=make('button','Preparar efeito'),cancel=make('button','Cancelar preparação');prepare.id='curve-prepare';cancel.id='curve-cancel';prepare.type=cancel.type='button';field.append(prepare,cancel);cancel.disabled=true;
  box.append(field);host.append(box);
  let activeJob=null,pending=false,uncertain=false,requestId=null,epoch=0;
  const presets={'fast-slow-fast':[{position:0,speed:200},{position:40,speed:50},{position:65,speed:50},{position:100,speed:200}],'fast-slow':[{position:0,speed:200},{position:100,speed:50}]};
  function point(position,speed){
    const tr=make('tr'),x=make('input'),v=make('input'),remove=make('button','Remover');x.type=v.type='number';x.min='0';x.max='100';x.step='0.1';v.min='25';v.max='400';v.step='1';x.value=position;v.value=speed;remove.type='button';
    x.dataset.role='curve-position';v.dataset.role='curve-speed';remove.dataset.role='curve-remove-point';
    x.setAttribute('aria-label','Posição no lance em porcentagem');v.setAttribute('aria-label','Velocidade em porcentagem');
    for(const control of[x,v,remove]){const cell=make('td');cell.style.cssText='padding:3px;';cell.append(control);tr.append(cell);}body.append(tr);
    const changed=()=>{preset.value='custom';update();};x.oninput=v.oninput=changed;remove.onclick=()=>{if(pending||activeJob||getBusy())return;tr.remove();preset.value='custom';update();};
  }
  function setPreset(){if(preset.value==='custom')return;body.replaceChildren();for(const p of presets[preset.value])point(p.position,p.speed);}
  function fillCameras(){const chosen=cam.value,source=getEvents().find(e=>e.id===event.value);cam.replaceChildren();for(const clip of source?.clips||[]){const o=make('option',clip.cam);o.value=clip.cam;cam.append(o);}if([...cam.options].some(o=>o.value===chosen))cam.value=chosen;update();}
  function points(){return [...body.rows].map(r=>({position:Number(r.cells[0].firstChild.value)/100,speed:Number(r.cells[1].firstChild.value)/100}));}
  function update(){
    const locked=pending||uncertain||!!activeJob||getBusy();for(const c of field.querySelectorAll('input,select,button'))c.disabled=locked;
    add.disabled=locked||body.rows.length>=12;prepare.disabled=locked||!event.value||!cam.value||!acknowledgment.checked;cancel.disabled=!activeJob||pending;
  }
  function refreshEvents(){
    const signature=JSON.stringify(getEvents().map(e=>[e.id,e.name,e.clips?.map(c=>c.cam)]));
    if(event.dataset.signature!==signature&&!activeJob&&!pending&&!uncertain){const chosen=event.value;event.replaceChildren();const blank=make('option','Selecione um lance salvo');blank.value='';event.append(blank);
      for(const e of getEvents()){const o=make('option',e.name);o.value=e.id;event.append(o);}if([...event.options].some(o=>o.value===chosen))event.value=chosen;event.dataset.signature=signature;fillCameras();}update();
  }
  event.onchange=()=>{if(!pending&&!activeJob&&!getBusy())fillCameras();};cam.onchange=update;acknowledgment.onchange=update;
  preset.onchange=()=>{if(pending||activeJob||getBusy())return;setPreset();update();};
  add.onclick=()=>{if(pending||activeJob||getBusy()||body.rows.length>=12)return;point(50,100);preset.value='custom';update();};
  prepare.onclick=async()=>{
    if(prepare.disabled)return;const own=++epoch;pending=true;requestId=crypto.randomUUID();update();status.textContent='Preparando novo lance com áudio silencioso…';
    try{const result=await onPrepare({requestId,eventId:event.value,cam:cam.value,points:points(),audioMode:'silence',audioAcknowledged:acknowledgment.checked});
      if(own!==epoch)return;if(result?.accepted!==true||typeof result.jobId!=='string'||result.requestId!==requestId)throw Error('O serviço não confirmou este pedido de preparação');
      if(result.state==='ready'){activeJob=null;status.textContent='Novo lance pronto · curva incorporada · áudio silencioso.';}
      else if(['error','cancelled'].includes(result.state)){activeJob=null;status.textContent=result.error||'Preparação anterior encerrada. Use um novo pedido para tentar novamente.';}
      else{activeJob=result.jobId;status.textContent='Preparação aceita; aguardando vídeo e áudio verificados.';}
    }catch(error){if(own===epoch){uncertain=error.definitiveRejected!==true;status.textContent=uncertain?'Resposta não confirmada. Confira o estado da preparação antes de tentar novamente.':error.message;}}finally{if(own===epoch){pending=false;update();}}
  };
  cancel.onclick=async()=>{if(cancel.disabled)return;const sentJob=activeJob;pending=true;update();try{const r=await onCancel({jobId:sentJob});if(r?.jobId!==sentJob)throw Error('O serviço não confirmou o cancelamento deste job');if(r.cancelled!==true||r.cleanupPending!==false){status.textContent='Aguardando encerramento cooperativo da preparação.';return;}activeJob=null;status.textContent='Preparação cancelada.';}catch(error){uncertain=true;status.textContent=error.message;}finally{pending=false;update();}};
  function setStatus(snapshot){
    // A lost POST acknowledgement must not unlock a second render. Only a fresh
    // successful status response can reconcile the same client request token.
    const found=snapshot?.confirmed===true&&requestId
      ?[snapshot.active,...(snapshot.recent||[])].find(j=>j?.requestId===requestId&&typeof j.id==='string')
      :null;
    // An unrelated or delayed empty GET cannot prove that our POST was rejected.
    // Only the server's receipt for this exact client nonce can reconcile it.
    const reconciled=!!found;
    if(uncertain&&reconciled){activeJob=found.id;uncertain=false;}
    else if(uncertain){status.textContent='Resposta ainda não confirmada para este pedido. Aguardando o estado correspondente; não repita com outro pedido.';}
    const job=snapshot?.active||snapshot?.recent?.findLast?.(j=>j.id===activeJob);
    if(job?.id===activeJob){
      const text={validating:'Conferindo lance original…',preparing:'Preparando curva…',verifying:'Conferindo todos os quadros e o áudio silencioso…',publishing:'Salvando novo lance…',ready:'Novo lance pronto · curva incorporada · áudio silencioso.',cancelling:'Cancelando…','cleanup-pending':'Aguardando encerramento cooperativo da preparação.',cancelled:'Preparação cancelada.',error:job.error||'Falha ao preparar efeito.'};
      status.textContent=text[job.state]||job.state;if(['ready','cancelled','error'].includes(job.state)&&!snapshot.active){activeJob=null;refreshEvents();}
    }update();return {reconciled,uncertain};
  }
  setPreset();refreshEvents();
  return {element:box,refreshEvents,setStatus,isUncertain:()=>uncertain,close(){epoch++;box.remove();}};
};

// Compact, explicit editor. Viewing, tab changes and pagehide send no POST.
(() => {
  const byId=el;
  const copy=value=>JSON.parse(JSON.stringify(value));
  let incoming=null,draft={name:'Melhores lances',endMode:'HOLD',items:[]},dirty=true,posting=false,cancelling=false,selectedId='';
  let definitionsKey='',eventsKey='',draftContext=null,editorSignature=null,editorItemsRef=null;
  const angleIdentifier=value=>typeof value==='string'&&value.length>0&&value.length<=128&&value.trim().length>0&&Array.from(value).every(character=>character.charCodeAt(0)>=32&&character.charCodeAt(0)!==127);
  const currentDraftContext=()=>angleIdentifier(incoming?.session?.id)&&/^[a-f0-9]{64}$/.test(incoming?.playlist?.preparation?.scopeToken||'')?JSON.stringify([incoming.session.id,incoming.playlist.preparation.scopeToken]):null;
  const currentAngle=item=>angleIdentifier(item?.eventId)&&angleIdentifier(item?.cam)&&Array.isArray(incoming?.events)&&incoming.events.some(event=>event?.id===item.eventId&&!event.playlist&&Array.isArray(event.clips)&&event.clips.some(clip=>clip?.cam===item.cam));
  const currentDraftItems=()=>Array.isArray(draft.items)&&draft.items.every(item=>currentAngle(item)&&item.transition&&typeof item.transition==='object'&&(item.transition.type==='CUT'&&item.transition.durationMs===0||item.transition.type==='FADE'&&Number.isInteger(item.transition.durationMs)&&item.transition.durationMs>=40&&item.transition.durationMs<=2000));
  const validAngleCatalog=()=>Array.isArray(incoming?.events)&&incoming.events.every(event=>event&&typeof event==='object'&&angleIdentifier(event.id)&&Array.isArray(event.clips)&&event.clips.every(clip=>clip&&typeof clip==='object'&&angleIdentifier(clip.cam)));
  let preparationOperation=null,preparationRequest=null,preparationUncertain=false;
  const status=message=>{byId('playlist-message').textContent=message;};
  const locked=()=>preparationUncertain||!!preparationOperation||!!incoming?.playlist?.preparation?.blocked||posting||cancelling||(typeof busy!=='undefined'&&busy)||window.FreeMixReplayCurve?.isPosting?.()||window.FreeMixReplayCurve?.isPreparing?.()||!!incoming?.curves?.active||!!incoming?.playlist?.busy||incoming?.playlist?.phase==='READY';
  function preparationReceipt(store){
   if(!preparationRequest||!preparationOperation)return null;
   return [store?.preparation?.active,...(store?.preparation?.receipts||[])].find(r=>r?.operationId===preparationOperation&&r.scopeToken===preparationRequest.scopeToken&&(r.definitionId===preparationRequest.id&&r.player===preparationRequest.player||r.state==='CANCELLED'&&r.definitionId===null&&r.player===null))||null;
  }
  function reconcilePreparation(store){
   const receipt=preparationReceipt(store);if(!receipt)return false;
   if(!['PREPARING','CANCELLING','READY','INVALIDATED','CANCELLED','FAILED'].includes(receipt.state))return false;
   preparationUncertain=false;
   if(['READY','INVALIDATED','CANCELLED','FAILED'].includes(receipt.state)&&receipt.cleanupPending===false&&!store.preparation.blocked){preparationOperation=null;preparationRequest=null;}
   return true;
  }
  const label=item=>{
    const event=incoming?.events?.find(e=>e?.id===item.eventId);
    return `${event?.name||'Lance indisponível'} · ${item.cam}`;
  };
  function normalizeLast(){if(draft.items.length)draft.items.at(-1).transition={type:'CUT',durationMs:0};}
  const editorKey=()=>JSON.stringify([draft.items,!!locked(),draft.items.map(label)]);
  function editRows(){
    const key=editorKey();if(editorItemsRef===draft.items&&editorSignature===key)return;editorItemsRef=draft.items;editorSignature=key;
    const box=byId('playlist-order');box.replaceChildren();
    draft.items.forEach((item,index)=>{
      const row=document.createElement('div');row.className='playlist-row';
      const text=document.createElement('span');text.textContent=`${index+1}. ${label(item)}`;
      const kind=document.createElement('select');kind.setAttribute('aria-label',`Transição após lance ${index+1}`);
      for(const value of ['CUT','FADE']){const option=document.createElement('option');option.value=value;option.textContent=value;kind.append(option);}
      kind.value=item.transition.type;kind.disabled=locked()||index===draft.items.length-1;
      const milliseconds=document.createElement('input');milliseconds.type='number';milliseconds.min='40';milliseconds.max='2000';milliseconds.step='10';milliseconds.value=item.transition.durationMs||300;milliseconds.setAttribute('aria-label',`Duração do FADE após lance ${index+1}, ms`);milliseconds.style.width='70px';milliseconds.disabled=locked()||kind.value!=='FADE'||index===draft.items.length-1;
      kind.onchange=()=>{if(locked())return;item.transition={type:kind.value,durationMs:kind.value==='FADE'?Number(milliseconds.value):0};dirty=true;editRows();};
      milliseconds.oninput=milliseconds.onchange=()=>{if(locked())return;item.transition.durationMs=Number(milliseconds.value);dirty=true;editorSignature=editorKey();controls();};
      row.append(text,kind,milliseconds);
      for(const [title,delta]of [['Subir',-1],['Descer',1]]){const button=document.createElement('button');button.type='button';button.textContent=delta<0?'↑':'↓';button.title=title;button.disabled=locked()||index+delta<0||index+delta>=draft.items.length;button.onclick=()=>{if(locked())return;[draft.items[index],draft.items[index+delta]]=[draft.items[index+delta],draft.items[index]];normalizeLast();dirty=true;editorSignature=null;editRows();};row.append(button);}
      const remove=document.createElement('button');remove.type='button';remove.textContent='Remover';remove.disabled=locked();remove.onclick=()=>{if(locked())return;draft.items.splice(index,1);normalizeLast();dirty=true;editRows();};row.append(remove);box.append(row);
    });
    if(!draft.items.length)box.textContent='Adicione lances salvos na ordem de reprodução.';
  }
  function controls(){
    for(const id of ['playlist-list','playlist-new','playlist-name','playlist-event','playlist-camera','playlist-add','playlist-end','playlist-player','playlist-save'])byId(id).disabled=locked();
    byId('playlist-add').disabled=locked()||draft.items.length>=8||!byId('playlist-event').value;
    byId('playlist-save').disabled=locked()||!draft.items.length;
    byId('playlist-prepare').disabled=locked()||dirty||!selectedId||!/^[a-f0-9]{64}$/.test(incoming?.playlist?.preparation?.scopeToken||'');
    byId('playlist-start').disabled=preparationUncertain||!!preparationOperation||!!incoming?.playlist?.preparation?.blocked||posting||cancelling||incoming?.playlist?.phase!=='READY';
    byId('playlist-stop').disabled=cancelling||(!preparationOperation&&!preparationUncertain&&!posting&&!incoming?.playlist?.busy&&!['READY','ENDED','FAULT','INTERRUPTED'].includes(incoming?.playlist?.phase));
    editRows();
  }
  async function post(action,data={},cancel=false){if(disposed)return;
    if(cancel&&cancelling||posting&&!cancel)return;const ownBusy=!cancel;
    if(action==='playlist-prepare'&&(preparationUncertain||preparationOperation))return;
    const admission=beginWrite();if(ownBusy)posting=true;else cancelling=true;
    if(action==='playlist-prepare'){preparationOperation=crypto.randomUUID();preparationRequest={...copy(data),scopeToken:incoming?.playlist?.preparation?.scopeToken};data={...data,operationId:preparationOperation};}
    controls();window.FreeMixReplayCurve?.refreshLocks?.();
    status(action==='playlist-prepare'?'Preparando fora do ar; aguarde ou cancele.':'Confirmando operação…');
    try {
      const response=await fetch(endpointURL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...data}),signal:scopedSignal(AbortSignal.timeout(action==='playlist-prepare'?180000:20000))});
      const result=await response.json();if(!response.ok||!result.success){const error=Error(result.error||'Operação recusada');error.definitiveRejected=response.status===400;throw error;}
      if(!result.replay||typeof result.replay!=='object')throw Error('Confirmação inválida do serviço');
      if((action==='playlist-prepare'||action==='playlist-stop'&&preparationOperation)&&!preparationReceipt(result.replay.playlist))throw Error('O serviço não confirmou o identificador desta preparação');
      if(!acceptWrite(admission,result.replay))throw Error('O contexto mudou durante a confirmação da lista');incoming=result.replay;
      if(action==='playlist-save'){
        const saved=incoming.playlist?.definitions?.find(d=>d.id===draft.id)||incoming.playlist?.definitions?.find(d=>d.name===draft.name&&JSON.stringify(d.items)===JSON.stringify(draft.items));
        if(!saved)throw Error('O serviço não confirmou a lista salva');selectedId=saved.id;draft=copy(saved);dirty=false;
      }
      window.FreeMixReplayPlaylist.render(incoming);window.FreeMixReplayCurve?.render?.(incoming);
      status(incoming.playlist?.message||'Operação confirmada');
    }catch(error){if(preparationOperation&&(preparationUncertain||error.definitiveRejected!==true))preparationUncertain=true;else if(action==='playlist-prepare'&&error.definitiveRejected===true){preparationOperation=null;preparationRequest=null;}status(preparationUncertain?'Confirmação desconhecida deste pedido. Aguarde o receipt correspondente ou cancele o mesmo pedido; não prepare outra lista.':error.message);}
    finally {endWrite();if(ownBusy)posting=false;else cancelling=false;controls();window.FreeMixReplayCurve?.refreshLocks?.();}
  }
  function cameras(){const event=incoming?.events?.find(e=>e.id===byId('playlist-event').value),select=byId('playlist-camera'),old=select.value;select.replaceChildren();for(const clip of event?.clips||[]){const o=document.createElement('option');o.value=clip.cam;o.textContent=clip.cam;select.append(o);}if([...select.options].some(o=>o.value===old))select.value=old;}
  byId('playlist-list').onchange=()=>{if(locked())return;selectedId=byId('playlist-list').value;const saved=incoming?.playlist?.definitions?.find(d=>d.id===selectedId);if(saved){draft=copy(saved);draftContext=currentDraftContext();dirty=false;byId('playlist-name').value=draft.name;byId('playlist-end').value=draft.endMode;}controls();};
  byId('playlist-new').onclick=()=>{if(locked())return;selectedId='';draft={name:'Nova lista',endMode:'HOLD',items:[]};draftContext=currentDraftContext();dirty=true;byId('playlist-name').value=draft.name;byId('playlist-end').value=draft.endMode;controls();};
  byId('playlist-name').oninput=()=>{if(locked())return;draft.name=byId('playlist-name').value;dirty=true;controls();};
  byId('playlist-end').onchange=()=>{if(locked())return;draft.endMode=byId('playlist-end').value;dirty=true;controls();};
  byId('playlist-event').onchange=cameras;
  byId('playlist-add').onclick=()=>{if(locked()||!Array.isArray(draft.items)||!validAngleCatalog()||draft.items.length>=8)return;const eventId=byId('playlist-event').value,cam=byId('playlist-camera').value,context=currentDraftContext();if(!context||!currentAngle({eventId,cam})||draft.items.length&&(draftContext!==context||!currentDraftItems())){status('O rascunho pertence a outro contexto ou contém um ângulo indisponível. Crie uma nova lista.');return;}draftContext=context;draft.items.push({eventId,cam,transition:{type:'CUT',durationMs:0}});dirty=true;controls();};
  byId('playlist-save').onclick=()=>post('playlist-save',{definition:copy(draft)});
  byId('playlist-prepare').onclick=()=>{if(!dirty&&selectedId)post('playlist-prepare',{id:selectedId,player:byId('playlist-player').value});};
  byId('playlist-start').onclick=()=>post('playlist-start');
  byId('playlist-stop').onclick=()=>post('playlist-stop',preparationOperation?{operationId:preparationOperation}:{},true);
  window.FreeMixReplayPlaylist={
    isDraftLocked:()=>disposed||locked()||incoming?.playlist?.phase==='ON_AIR'||!Array.isArray(draft.items)||!validAngleCatalog(),
    addDraftAngles(request){
      if(disposed||locked()||incoming?.playlist?.phase==='ON_AIR')return {accepted:false,reason:'A lista está ocupada; aguarde a confirmação ou cancele.'};
      if(!Array.isArray(draft.items)||!validAngleCatalog())return {accepted:false,reason:'Os dados dos lances ou do rascunho estão incompletos. Atualize o contexto antes de montar a lista.'};
      if(!incoming?.playlist||!incoming?.session?.id||request?.sessionId!==incoming.session.id||request?.scopeToken!==incoming.playlist.preparation?.scopeToken||!/^[a-f0-9]{64}$/.test(request?.scopeToken||''))return {accepted:false,reason:'A sessão mudou. Selecione os ângulos novamente.'};
      const context=currentDraftContext();if(!context||draft.items.length&&(draftContext!==context||!currentDraftItems()))return {accepted:false,reason:'O rascunho pertence a outro contexto ou contém um ângulo indisponível. Crie uma nova lista.'};
      if(!Array.isArray(request.items)||request.items.length<1||draft.items.length+request.items.length>8)return {accepted:false,reason:'A lista comporta até oito ângulos. Remova itens ou crie outra lista.'};
      const additions=[],seen=new Set();
      for(const item of request.items){
        if(!currentAngle(item))return {accepted:false,reason:'Ângulo inválido.'};
        const event=incoming.events.find(event=>event?.id===item.eventId&&!event.playlist&&!event.preparedEffect);
        const clip=Array.isArray(event?.clips)?event.clips.find(clip=>clip?.cam===item.cam):null;const key=JSON.stringify([item.eventId,item.cam]);
        if(!clip||seen.has(key))return {accepted:false,reason:'Um ângulo selecionado não está mais disponível.'};
        seen.add(key);additions.push({eventId:item.eventId,cam:item.cam,transition:{type:'CUT',durationMs:0}});
      }
      draftContext=context;draft.items.push(...additions);normalizeLast();dirty=true;controls();
      status('Ângulos adicionados ao rascunho. Ajuste a ordem e CUT/FADE; salvar e preparar são ações separadas.');
      return {accepted:true,count:additions.length};
    },isPosting:()=>posting||cancelling,isPreparing:()=>preparationUncertain||!!preparationOperation||!!incoming?.playlist?.preparation?.blocked||!!incoming?.playlist?.busy,refreshLocks(){controls();},render(data){
    if(!data)return;incoming=data;
    const store=data.playlist;reconcilePreparation(store);
    byId('playlist-controls').hidden=!store;
    if(!store){status('Listas aguardam atualização do serviço; reprodução existente preservada.');return;}
    const definitionSignature=JSON.stringify(store.definitions||[]);
    if(definitionSignature!==definitionsKey){definitionsKey=definitionSignature;const select=byId('playlist-list');select.replaceChildren();const empty=document.createElement('option');empty.value='';empty.textContent='Nova lista';select.append(empty);for(const d of store.definitions||[]){const o=document.createElement('option');o.value=d.id;o.textContent=d.name;select.append(o);}select.value=selectedId;}
    const eventSignature=JSON.stringify((data.events||[]).filter(e=>!e.playlist).map(e=>[e.id,e.name,e.clips?.map(c=>c.cam)]));
    if(eventSignature!==eventsKey){eventsKey=eventSignature;const select=byId('playlist-event'),old=select.value;select.replaceChildren();for(const event of (data.events||[]).filter(e=>!e.playlist)){const o=document.createElement('option');o.value=event.id;o.textContent=event.name;select.append(o);}if([...select.options].some(o=>o.value===old))select.value=old;cameras();}
    if(!posting)status(preparationUncertain?'Confirmação desconhecida deste pedido. Não repita com outro identificador.':store.message+(store.phase==='ON_AIR'?` · lance ${(store.itemIndex||0)+1}`:''));controls();
  }};
  controls();
})();

// Real product command binding. Startup/render/navigation perform no POST.
(() => {
  const host=el('replay-curve-host');if(!host)return;
  let incoming=null,posting=false,unknownPost=false;
  const controls=window.createSpeedCurveControls(host,{
    getEvents:()=>Array.isArray(incoming?.events)?incoming.events.filter(e=>!e.playlist&&!e.preparedEffect):[],
    getBusy:()=>posting||(typeof busy!=='undefined'&&busy)||window.FreeMixReplayPlaylist?.isPosting?.()||window.FreeMixReplayPlaylist?.isPreparing?.()||!!incoming?.playlist?.busy||['READY','ON_AIR'].includes(incoming?.playlist?.phase)||!!incoming?.curves?.active,
    onPrepare:async data=>(await post('curve-prepare',data)).curvePreparation,
    onCancel:async data=>(await post('curve-cancel',data)).curveCancellation,
  });
  async function post(action,data){if(disposed)throw Error("Replay fechado");
    const admission=beginWrite();posting=true;window.FreeMixReplayPlaylist?.refreshLocks?.();
    try{
      const response=await fetch(endpointURL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...data}),signal:scopedSignal(AbortSignal.timeout(20000))});
      const result=await response.json();
      if(!response.ok||result.success!==true){const error=Error(result.error||'Operação recusada');error.definitiveRejected=response.status===400;throw error;}
      if(!result.replay||typeof result.replay!=='object')throw Error('Confirmação inválida do serviço');
      const ack=action==='curve-prepare'?result.replay.curvePreparation:result.replay.curveCancellation;
      if(action==='curve-prepare'&&(ack?.accepted!==true||typeof ack.jobId!=='string'||ack.requestId!==data.requestId)||action==='curve-cancel'&&ack?.jobId!==data.jobId)throw Error('O serviço não confirmou este identificador de preparação/cancelamento');
      if(!acceptWrite(admission,result.replay))throw Error('O contexto mudou durante a confirmação da curva');unknownPost=false;incoming={...(incoming||{}),...result.replay};window.FreeMixReplayCurve.render(incoming);window.FreeMixReplayPlaylist?.render?.(incoming);return result.replay;
    }catch(error){if(error.definitiveRejected!==true)unknownPost=true;throw error;}
    finally{endWrite();posting=false;window.FreeMixReplayPlaylist?.refreshLocks?.();}
  }
  window.FreeMixReplayCurve={isPosting:()=>posting,isPreparing:()=>unknownPost||controls.isUncertain()||!!incoming?.curves?.active,refreshLocks(){controls.refreshEvents();},render(data){
    if(!data)return;incoming=data;
    host.hidden=data.curves?.supported!==true;
    if(data.curves){const result=controls.setStatus({...data.curves,confirmed:true});if(result.reconciled)unknownPost=false;}
    controls.refreshEvents();
    // A prepared movie already contains its speed. All loaded prepared players
    // must keep100%; show that boundary on the existing common speed controls.
    const prepared=['A','B'].some(id=>data.players?.[id]?.playbackSpeed===100);
    const speed=el('replay-speed');
    if(speed){for(const c of speed.querySelectorAll('input,button,select')){c.disabled=prepared||posting||(typeof busy!=='undefined'&&busy);if(prepared)c.title='Velocidade incorporada no vídeo preparado';else c.removeAttribute('title');}}
    const label=el('speed-lbl'),slider=speed?.querySelector('input[type="range"]');
    if(label)label.textContent=prepared?'Velocidade incorporada · reprodução 100%':`${Number(data.speed)||50}%`;
    if(slider&&document.activeElement!==slider)slider.value=prepared?'100':String(Number(data.speed)||50);
  }};
  host.hidden=true;
})();

  for(let n=1;n<=20;n++){const button=make('button');button.type='button';button.className='rp-page-btn';button.dataset.replayPage=String(n);button.textContent=String(n);button.onclick=()=>{page=n;renderEvents();paintState();};el('replay-pages').append(button);}
  for(const tab of host.querySelectorAll('[data-replay-tab]'))tab.onclick=()=>{for(const panel of host.querySelectorAll('[data-replay-panel]'))panel.hidden=panel.dataset.replayPanel!==tab.dataset.replayTab;for(const button of host.querySelectorAll('[data-replay-tab]')){const selected=button===tab;button.classList.toggle('on',selected);button.setAttribute('aria-selected',String(selected));}if(tab.dataset.replayTab==='Curvas')el('replay-curve-controls').open=true;};
  for(const b of host.querySelectorAll('[data-replay-command]'))b.onclick=()=>request(b.dataset.replayCommand);
  for(const b of host.querySelectorAll('[data-replay-capture]'))b.onclick=()=>request('capture',{seconds:Number(b.dataset.replayCapture)});
  for(const b of host.querySelectorAll('[data-replay-transport]'))b.onclick=()=>request('transport',{command:b.dataset.replayTransport,player:deck});
  for(const b of host.querySelectorAll('[data-replay-air]'))b.onclick=()=>request('air',{player:b.dataset.replayAir});
  for(const b of host.querySelectorAll('[data-replay-speed]'))b.onclick=()=>{if(!b.disabled)request('speed',{speed:Number(b.dataset.replaySpeed)});};
  el('replay-speed-range').onchange=e=>{if(!e.target.disabled)request('speed',{speed:Number(e.target.value)});};
  for(const id of ab){el('deck-'+id).onclick=()=>selectDeck(id);el('seek-'+id).onchange=e=>request('seek',{player:id,cursor:Number(e.target.value)});}
  el('link-players').onclick=()=>request('link',{enabled:!replay?.linked});
  el('record-btn').onclick=()=>{if(replay?.rec){request('stop');return;}const selected=Array.isArray(replay?.cams)&&replay.cams.length?replay.cams:(replay?.session?.cams||[]).map(c=>c.name);if(selected.length&&selected.every(cam=>replay.availableCams?.includes(cam)))request('start',{cams:selected});else message('Escolha as câmeras em Configurações do Replay antes de iniciar REC SSD.');};
  el('replay-air').onclick=()=>request('air',{player:deck});el('replay-live').onclick=()=>request('live');el('replay-settings').onclick=onSettings;el('replay-retention').onclick=onRetention;
  el('history-refresh').onclick=refreshHistory;el('history-camera').onchange=previewHistory;el('history-cursor').onchange=historyPositionChanged;
  el('history-seek').oninput=()=>historyCursorChanged(true);el('history-seek').onchange=()=>{historyDragging=false;previewHistory();};
  el('history-back-frame').onclick=()=>stepHistory(-1);el('history-next-frame').onclick=()=>stepHistory(1);el('history-in').onclick=()=>markHistory('in');el('history-out').onclick=()=>markHistory('out');el('history-save').onclick=saveHistoryRange;
  el('history-play').onclick=toggleHistoryPlayback;el('history-follow').onclick=followHistoryEnd;el('history-audio').onchange=historyMonitorAudio;
  const emptyObserver=new MutationObserver(()=>{const empty=el('history-empty'),hidden=!el('history-image').hidden||!el('history-video').hidden;if(empty.hidden!==hidden)empty.hidden=hidden;});emptyObserver.observe(el('replay-history'),{subtree:true,attributes:true,attributeFilter:['hidden']});
  const curveNamespace=window.FreeMixReplayCurve,playlistNamespace=window.FreeMixReplayPlaylist;
  const instance={render,beginRead,acceptRead,beginExternalWrite:beginWrite,endExternalWrite:endWrite,acceptExternalWrite:acceptWrite,isPosting:()=>pendingPosts>0,close(){if(disposed)return;disposed=true;admissionEpoch++;clearInterval(monitorTimer);monitorFlight?.controller.abort(new DOMException('Replay fechado','AbortError'));componentAbort.abort(new DOMException('Replay fechado','AbortError'));clearInterval(pumpTimer);stopHistoryVideo();cancelScrub();emptyObserver.disconnect();for(const element of host.querySelectorAll('button,input,select'))element.disabled=true;window.removeEventListener('pagehide',onPageHide);if(window.FreeMixReplayCurve===curveNamespace)delete window.FreeMixReplayCurve;if(window.FreeMixReplayPlaylist===playlistNamespace)delete window.FreeMixReplayPlaylist;instances.delete(host);if(documentInstance===instance)documentInstance=null;}};
  function onPageHide(){instance.close();}window.addEventListener('pagehide',onPageHide);
  instances.set(host,instance);documentInstance=instance;paintState();return instance;
 }};
 const TEMPLATE=String.raw`<div class="rp-dock-ctrl">
 <div class="row rp-config-row"><button class="b" id="replay-settings">⚙ Configurações do Replay</button></div>
 <div id="replay-pages" class="rp-pages-bar" aria-label="Páginas de lances"></div>
 <div class="rp-common-tabs" role="tablist"><button class="b replay-view-tab on" data-replay-tab="Lances" role="tab" aria-selected="true">Lances</button><button class="b replay-view-tab" data-replay-tab="Listas" role="tab" aria-selected="false">Listas</button><button class="b replay-view-tab" data-replay-tab="Curvas" role="tab" aria-selected="false">Curvas</button></div>
 <div id="replay-events" class="rp-dock-events-wrap" data-replay-panel="Lances"><div id="events-scroll" class="rp-events-scroll"><table class="rp-events-table"><thead><tr><th></th><th>In</th><th>Out</th><th>Duration</th><th>Speed</th><th class="rp-output-a">1 Output 1</th><th>2 Output 2</th><th>Ações</th></tr></thead><tbody id="events-list"></tbody></table></div></div>
 <div data-replay-panel="Listas" hidden><details data-replay-operacao id="replay-playlists" class="task-details" open>
    <style>.playlist-row{display:flex;align-items:center;gap:4px;flex-wrap:wrap;padding:4px;border-bottom:1px solid var(--border)}.playlist-row>span{flex:1;min-width:160px;font-size:12px}</style>
    <summary>Listas de lances · CUT / FADE</summary>
    <div style="padding:10px" id="playlist-controls">
      <div style="display:flex;gap:6px;flex-wrap:wrap"><label>Lista <select id="playlist-list"><option value="">Nova lista</option></select></label><button id="playlist-new" type="button">Nova</button><label>Nome <input id="playlist-name" maxlength="80" value="Melhores lances"></label></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px"><label>Lance <select id="playlist-event"></select></label><label>Câmera <select id="playlist-camera"></select></label><button id="playlist-add" type="button">Adicionar à lista</button></div>
      <div id="playlist-order" style="display:grid;gap:4px;margin:8px 0;max-height:180px;overflow:auto"></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap"><label>Ao terminar <select id="playlist-end"><option value="HOLD">Manter último quadro</option><option value="LIVE">Voltar à entrada ao vivo</option></select></label><label>Preparar em <select id="playlist-player"><option>A</option><option>B</option></select></label><button id="playlist-save" type="button">Salvar ordem</button><button id="playlist-prepare" type="button">Preparar fora do ar</button><button id="playlist-start" type="button">LISTA NO AR</button><button id="playlist-stop" type="button">Parar / cancelar</button></div>
      <p style="margin-top:6px;color:var(--text-muted)">Até 8 lances / 120 s. A preparação gera um vídeo com CUT e FADE; não muda o Programa. Para alterar ordem ou velocidade, pare e prepare outra lista. Curvas preparadas entram como novos lances.</p>
    </div>
    <p id="playlist-message" role="status" style="padding:0 10px 10px">Lista não preparada.</p>
  </details></div>
 <div data-replay-panel="Curvas" hidden><section id="replay-curve-host" hidden aria-label="Efeito de velocidade de lance salvo"></section></div>
 <div class="rp-dock-actions">
  <div class="row"><span class="rp-mark-label">Mark ao vivo:</span><button class="b" data-replay-command="mark-in" title="Marcar o tempo atual da gravação contínua">In</button><button class="b" data-replay-command="mark-out" title="Fechar o lance no tempo atual da gravação contínua">Out</button><button class="b on" data-replay-capture="5">- 5</button><button class="b on" data-replay-capture="10">- 10</button><button class="b on" data-replay-capture="20">- 20</button><span class="rp-action-sep"></span><button class="b" id="link-players">A|B</button><button class="b" data-replay-transport="PAUSE">Pausa</button><button class="b" data-replay-transport="PLAY">Play</button><button class="b" data-replay-air="A">Ar A</button><button class="b" data-replay-air="B">Ar B</button><button class="b" id="replay-retention">Retenção</button><button class="b" id="deck-A">A</button><button class="b" id="deck-B">B</button></div>
  <div class="row rp-bottom-row"><div class="row"><button class="b on" id="record-btn">● REC SSD</button><button class="b live" id="replay-air">No Ar</button><button class="b" id="replay-live">Voltar ao vivo</button></div><div class="row" id="replay-speed"><span class="rp-speed-label">Velocidade:</span><button class="b replay-speed-preset" data-replay-speed="25">25%</button><button class="b replay-speed-preset" data-replay-speed="33">33%</button><button class="b replay-speed-preset" data-replay-speed="50">50%</button><button class="b replay-speed-preset" data-replay-speed="75">75%</button><button class="b replay-speed-preset" data-replay-speed="100">100%</button><input id="replay-speed-range" type="range" min="10" max="100" step="1" value="100" aria-label="Velocidade dos players"><span id="speed-lbl">100%</span></div></div>
  <div class="rp-deck-info"><div class="deck-cam"><span>Replay A</span><div id="preview-box-A" class="rp-player-preview"><img id="preview-A" alt="Prévia local de Replay A" hidden></div><span id="preview-status-A" role="status">Nenhum lance verificado carregado.</span><span id="player-A">Nenhum lance carregado</span><input id="seek-A" type="range" min="0" max="0" value="0" step="40" disabled aria-label="Posição Replay A"></div><div class="deck-cam"><span>Replay B</span><div id="preview-box-B" class="rp-player-preview"><img id="preview-B" alt="Prévia local de Replay B" hidden></div><span id="preview-status-B" role="status">Nenhum lance verificado carregado.</span><span id="player-B">Nenhum lance carregado</span><input id="seek-B" type="range" min="0" max="0" value="0" step="40" disabled aria-label="Posição Replay B"></div></div>
  <div class="rp-tc-row"><span class="rp-tc-display" id="replay-tc">SSD parado</span><span id="replay-ready" role="status">Carregue um lance antes de colocar no ar.</span></div>
  <section id="replay-history" class="rp-history" aria-label="Buscar no histórico"><div class="row"><label>Câmera <select id="history-camera"></select></label><button class="b" id="history-refresh">Atualizar histórico</button><label>Posição <input id="history-cursor" type="number" step="0.001" disabled></label></div><div class="rp-history-preview"><img id="history-image" alt="Quadro confirmado da busca" hidden><video id="history-video" playsinline muted hidden></video><span id="history-empty">Selecione uma posição para conferir o quadro</span></div><input id="history-seek" class="rp-timeline-bar" type="range" min="0" max="0" value="0" step="0.001" disabled aria-label="Agulha do histórico"><div class="row"><button class="b" id="history-back-frame" disabled>Quadro −1</button><button class="b" id="history-next-frame" disabled>Quadro +1</button><button class="b" id="history-in" title="Busca no histórico: marcar o quadro decodificado exibido" disabled>IN</button><button class="b" id="history-out" title="Busca no histórico: marcar o quadro decodificado exibido" disabled>OUT</button><button class="b" id="history-save" disabled>Salvar lance</button><button class="b" id="history-play" disabled>▶ Reproduzir histórico</button><button class="b" id="history-follow" disabled>Ir ao fim gravado</button><label><input id="history-audio" type="checkbox"> Ouvir prévia neste computador</label></div><div class="row"><span id="history-status" role="status">Nenhuma sessão gravada disponível.</span><span id="history-range">IN: — · OUT: —</span></div></section>
  <p id="message" role="status"></p>
 </div>
</div>
`;
})();
