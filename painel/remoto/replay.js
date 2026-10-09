let replay = null, deck = 'A', busy = false, retentionDirty = false, eventsSignature = '';
    let historyState=null,historyIn=null,historyOut=null,historyConfirmed=null;
    if(new URLSearchParams(location.search).get('view')==='settings') {
      document.title='FreeMix · Configurações do Replay';
      document.getElementById('replay-camera-audio').open=true;
    }
    const anglesByEvent = new Map();
    const el = (id) => document.getElementById(id);
    async function request(action, data = {}) {
      if (busy) return;
      busy = true;
      el('import-btn').disabled=true;
      el('message').textContent = 'Confirmando operação…';
      try {
        const response = await fetch('/api/replay', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({action,...data}), signal:AbortSignal.timeout(action==='import'?600000:180000) });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || 'Operação recusada');
        if(action==='retention')retentionDirty=false;
        render(result.replay);
        if(Object.hasOwn(result.replay,'history'))renderHistory(result.replay.history);
        if(result.replay.historyFrame){const frame=result.replay.historyFrame;historyConfirmed=frame.cursor;el('history-seek').value=frame.cursor;el('history-cursor').value=frame.cursor.toFixed(3);el('history-image').src=frame.image;el('history-image').hidden=false;el('history-status').textContent=frame.cam+' · quadro em '+frame.cursor.toFixed(3)+' s';setHistoryButtons(true);}
        el('message').textContent = ['capture','mark-out','capture-range'].includes(action) ? 'Vídeo do lance salvo.' : 'Operação confirmada pelo motor.';
        if (navigator.vibrate) navigator.vibrate(25);
      } catch (error) { el('message').textContent = error.message; }
      finally { busy = false;el('import-btn').disabled=false;setHistoryButtons(historyConfirmed!==null); }
    }
    function renderBase(data) {
      replay = data;
      el('history-refresh').disabled=!data.historySupported;
      if(!data.historySupported)el('history-status').textContent='A timeline aguarda a atualização do serviço de controle. A gravação existente continua ativa.';
      renderCameraOptions(data);
      el('retention-save').disabled=!!data.rec;
      if(!retentionDirty){el('retention-enabled').checked=!!data.retention?.enabled;el('retention-minutes').value=data.retention?.minutes||30;}
      el('link-players').textContent=data.linked?'Desvincular players':'Vincular players';
      el('rec-status').textContent = data.rec ? 'SSD GRAVANDO' : 'SSD PARADO';
      el('rec-status').style.color = data.rec ? '#ff7b72' : '#aeb6c1';
      el('record-btn').textContent = data.rec ? 'Parar gravação SSD' : 'Iniciar gravação SSD';
      for (const player of ['A','B','C','D']) {
        const loaded = data.players?.[player];
        el('player-'+player).textContent = loaded ? loaded.cam + (data.program === 'REPLAY '+player ? ' — NO AR' : ' — carregado') : 'Nenhum lance carregado';
      }
      const cams = el('cam-select');
      const selected = [...cams.querySelectorAll('input:checked')].map((i)=>i.value);
      cams.replaceChildren();
      for (const [i,name] of (data.availableCams || []).entries()) {
        const label = document.createElement('label'), input = document.createElement('input');
        input.type='checkbox'; input.value=name; input.disabled=data.rec;
        input.checked=data.rec ? data.session.cams.some((c)=>c.name===name) : selected.length ? selected.includes(name) : i===0;
        label.append(input,document.createTextNode(name+' ')); cams.append(label);
      }
      const nextSignature=JSON.stringify((data.events||[]).map(e=>[e.id,e.name,e.cam,e.dur,e.imported,e.recovered,e.clips.map(c=>c.cam)]));if(nextSignature===eventsSignature)return;eventsSignature=nextSignature;
      const box = el('events-list'); box.replaceChildren();
      for (const [index,event] of (data.events || []).entries()) {
        const row=document.createElement('div'); row.className='ev-item';
        row.dataset.event=event.id;row.draggable=true;row.ondragstart=e=>{if(busy){e.preventDefault();return;}e.dataTransfer.setData('application/freemix-replay-id',event.id);e.dataTransfer.effectAllowed='move';};row.ondragover=e=>{if(!busy){e.preventDefault();row.classList.add('drag-over');}};row.ondragleave=()=>row.classList.remove('drag-over');row.ondrop=e=>{e.preventDefault();row.classList.remove('drag-over');reorderBefore(e.dataTransfer.getData('application/freemix-replay-id'),event.id);};
        const title=document.createElement('span'); title.className='ev-name'; title.textContent=(index+1)+'. '+event.name+' — '+Number(event.dur).toFixed(2)+' s'+(event.imported?' · importado':'')+(event.recovered?' · recuperado':'');
        const angles=document.createElement('select');
        for (const clip of event.clips) { const option=document.createElement('option'); option.textContent=clip.cam; option.selected=clip.cam===(anglesByEvent.get(event.id)||event.cam); angles.append(option); }
        angles.onchange=()=>anglesByEvent.set(event.id,angles.value);
        row.append(title,angles);
        for (const player of ['A','B','C','D']) { const button=document.createElement('button'); button.className='ev-btn'; button.textContent='▶ '+player; button.onclick=()=>playInDeck(player,event.id,angles.value); row.append(button); }
        const order=document.createElement('span');order.className='ev-order';for(const [label,delta]of [['↑',-1],['↓',1]]){const button=document.createElement('button');button.className='ev-btn';button.textContent=label;button.title=delta<0?'Mover para cima':'Mover para baixo';button.disabled=index+delta<0||index+delta>=data.events.length;button.onclick=()=>moveEvent(event.id,delta);order.append(button);}row.append(order);box.append(row);
      }
      if (!data.events?.length) box.textContent='Nenhum lance gravado. Inicie REC SSD e capture um lance.';
    }
    function time(ms){const s=Math.max(0,Number(ms)||0)/1000;return String(Math.floor(s/60)).padStart(2,'0')+':'+String(Math.floor(s%60)).padStart(2,'0');}
    function render(data){if(!data)return;renderBase(data);for(const player of ['A','B','C','D']){const media=data.players?.[player],slider=el('seek-'+player),duration=media?.mediaDuration||Number(media?.duration||0)*1000,cursor=media?.mediaCursor||0;slider.max=Math.max(0,duration);slider.disabled=!media;if(document.activeElement!==slider)slider.value=Math.min(cursor,duration);el('position-'+player).textContent=time(cursor)+' / '+time(duration)+(media?.mediaState==='OBS_MEDIA_STATE_PLAYING'?' · reproduzindo':media?.mediaState==='OBS_MEDIA_STATE_PAUSED'?' · pausado':'');}const recoverable=!data.rec&&data.markIn&&data.session&&data.markIn.sessionId===data.session.id;el('interruption').hidden=!recoverable&&!data.interrupted;el('recover-in').disabled=!recoverable;el('interruption-text').textContent=recoverable?'Há um IN aberto com gravação parada. Recupere o vídeo disponível até o fim (máximo 120 segundos).':data.interrupted?.reason||'';el('events-total').textContent=(data.events?.length||0)+' lances · '+time((data.events||[]).reduce((sum,e)=>sum+(Number(e.dur)||0)*1000,0))+' totais';}
    function seekPlayer(player,cursor){request('seek',{player,cursor:Number(cursor)});}
    function historyStep(){const parts=historyState?.frameRate?.split('/').map(Number);return parts?.[0]&&parts?.[1]?parts[1]/parts[0]:1/30;}
    function setHistoryButtons(confirmed){for(const id of ['history-back-frame','history-next-frame'])el(id).disabled=!historyState||busy;for(const id of ['history-in','history-out'])el(id).disabled=!confirmed;}
    function renderHistory(history){
      if(!history){stopHistoryVideo();historyState=null;historyIn=historyOut=historyConfirmed=null;setHistoryButtons(false);el('history-status').textContent='Nenhuma sessão gravada disponível.';return;}
      if(historyState?.sessionId!==history.sessionId){stopHistoryVideo();historyIn=historyOut=historyConfirmed=null;el('history-image').hidden=true;}
      historyState=history;const slider=el('history-seek'),cursor=el('history-cursor'),old=Number(slider.value),wasDisabled=slider.disabled;
      slider.min=cursor.min=history.start;slider.max=cursor.max=history.end;slider.step=cursor.step=historyStep();slider.disabled=cursor.disabled=false;
      slider.value=cursor.value=wasDisabled?Math.max(history.start,history.end-1):Math.min(history.end,Math.max(history.start,old));
      const camera=el('history-camera'),selected=camera.value;camera.replaceChildren();for(const name of history.cameras){const o=document.createElement('option');o.textContent=name;camera.append(o);}if(history.cameras.includes(selected))camera.value=selected;
      el('history-status').textContent='Histórico disponível: '+history.start.toFixed(3)+' até '+history.end.toFixed(3)+' s. Mova o cursor para conferir o quadro.';
      setHistoryButtons(historyConfirmed!==null);renderHistoryMarks();
    }
    function refreshHistory(){request('history');}
    function historyCursorChanged(){el('history-cursor').value=Number(el('history-seek').value).toFixed(3);historyConfirmed=null;setHistoryButtons(false);}
    function historyPositionChanged(){if(!historyState)return;el('history-seek').value=Math.min(historyState.end,Math.max(historyState.start,Number(el('history-cursor').value)));historyCursorChanged();previewHistory();}
    function previewHistory(){if(!historyState||busy)return;historyConfirmed=null;setHistoryButtons(false);if(replay?.historyPlaybackSupported)startHistoryVideo(Number(el('history-seek').value),false);else request('history-frame',{sessionId:historyState.sessionId,cam:el('history-camera').value,cursor:Number(el('history-seek').value)});}
    function stepHistory(delta){if(!historyState||busy)return;el('history-seek').value=Math.min(historyState.end,Math.max(historyState.start,Number(el('history-seek').value)+delta*historyStep()));historyCursorChanged();previewHistory();}
    function markHistory(which){if(historyConfirmed===null)return;if(which==='in')historyIn=historyConfirmed;else historyOut=historyConfirmed;renderHistoryMarks();renewHistoryPin();}
    function renderHistoryMarks(){const valid=historyIn!==null&&historyOut!==null&&historyOut-historyIn>=.2&&historyOut-historyIn<=120&&historyIn>=historyState.start&&historyOut<=historyState.end;el('history-range').textContent='IN: '+(historyIn===null?'—':historyIn.toFixed(3)+' s')+' · OUT: '+(historyOut===null?'—':historyOut.toFixed(3)+' s')+(valid?' · '+(historyOut-historyIn).toFixed(3)+' s':'');el('history-save').disabled=!valid;}
    function saveHistoryRange(){if(el('history-save').disabled||busy)return;request('capture-range',{sessionId:historyState.sessionId,start:historyIn,end:historyOut});}
    // This is a local, low-resolution monitoring proxy. Loaded replay players and
    // saved clips retain the original quality and their existing A/B/C/D contract.
    let historyPlayback=null,historyGeneration=0,historyRefreshAt=0,historyRefreshing=false,historyPinAt=0;
    const historyViewerId=crypto.randomUUID();
    async function historyApi(action,data={},signal){const response=await fetch('/api/replay',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...data}),signal:signal||AbortSignal.timeout(35000)});const result=await response.json();if(!response.ok||!result.success)throw Error(result.error||'Prévia indisponível');return result.replay;}
    function stopHistoryVideo(){historyGeneration++;const own=historyPlayback;historyPlayback=null;if(own){own.controller.abort();URL.revokeObjectURL(own.url);}const video=el('history-video');video.pause();video.removeAttribute('src');video.load();video.hidden=true;el('history-play').textContent='▶ Reproduzir histórico';}
    function updateHistoryVideoCursor(){const own=historyPlayback,video=el('history-video');if(!own||video.readyState<2)return;const cursor=Math.min(historyState.end,own.origin+video.currentTime);historyConfirmed=cursor;if(document.activeElement!==el('history-seek'))el('history-seek').value=cursor;el('history-cursor').value=cursor.toFixed(3);setHistoryButtons(true);}
    async function appendHistoryProxy(own,meta,bytes){
      if(own!==historyPlayback)return;
      const sb=own.buffer;await new Promise((resolve,reject)=>{const clear=()=>{sb.removeEventListener('updateend',done);sb.removeEventListener('error',fail);own.controller.signal.removeEventListener('abort',abort);};const done=()=>{clear();resolve();},fail=()=>{clear();reject(Error('O navegador recusou os quadros da prévia'));},abort=()=>{clear();reject(Error('Busca substituída'));};sb.addEventListener('updateend',done,{once:true});sb.addEventListener('error',fail,{once:true});own.controller.signal.addEventListener('abort',abort,{once:true});try{sb.timestampOffset=meta.start-own.origin;sb.appendWindowStart=Math.max(0,meta.start-own.origin);sb.appendWindowEnd=meta.end-own.origin+.035;sb.appendBuffer(bytes);}catch(e){clear();reject(e);}});
      if(own!==historyPlayback)return;own.end=meta.end;own.media.duration=Math.max(own.media.duration||0,meta.end-own.origin+.04);own.lastPrepareMs=meta.prepareMs;
      const cutoff=el('history-video').currentTime-24;if(cutoff>0&&!sb.updating){sb.remove(0,cutoff);await new Promise(resolve=>sb.addEventListener('updateend',resolve,{once:true}));}
    }
    async function getHistoryProxy(own,cursor,from){const result=await historyApi('history-preview',{sessionId:own.sessionId,cam:own.cam,cursor,viewerId:historyViewerId,...(from!==undefined?{from}: {})},own.controller.signal);if(own!==historyPlayback)throw Error('Busca substituída');const meta=result.historyPreview;if(!meta||!meta.url.startsWith('/api/replay-preview/'))throw Error('O serviço não forneceu vídeo de prévia');const response=await fetch(meta.url,{signal:own.controller.signal});if(!response.ok)throw Error('Prévia expirou; escolha o ponto novamente');return {meta,bytes:await response.arrayBuffer()};}
    async function startHistoryVideo(cursor,playing){
      if(!historyState)return;stopHistoryVideo();const generation=historyGeneration,video=el('history-video');
      if(!window.MediaSource||!MediaSource.isTypeSupported('video/mp4; codecs="avc1.42E02A,mp4a.40.2"')){el('history-status').textContent='Este navegador não oferece H.264/AAC para reprodução do histórico. Use os quadros ou o console em um navegador compatível.';request('history-frame',{sessionId:historyState.sessionId,cam:el('history-camera').value,cursor});return;}
      const media=new MediaSource(),url=URL.createObjectURL(media),own={media,url,controller:new AbortController(),sessionId:historyState.sessionId,cam:el('history-camera').value,generation,loading:true};historyPlayback=own;el('history-image').hidden=true;video.hidden=false;video.src=url;video.muted=!el('history-audio').checked;el('history-status').textContent='Preparando vídeo e áudio do ponto escolhido…';
      try{
        await new Promise((resolve,reject)=>{media.addEventListener('sourceopen',resolve,{once:true});own.controller.signal.addEventListener('abort',()=>reject(Error('Busca substituída')),{once:true});});
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
    async function autoHistory(){if(historyRefreshing||!replay?.historySupported||Date.now()-historyRefreshAt<(replay.rec?2500:6000))return;historyRefreshAt=Date.now();historyRefreshing=true;try{const result=await historyApi('history');const incoming=result.history;let expired=false;if(historyState&&incoming?.sessionId!==historyState.sessionId)stopHistoryVideo();if(historyPlayback&&incoming?.start>historyPlayback.origin+el('history-video').currentTime){stopHistoryVideo();historyConfirmed=null;expired=true;}if(historyIn!==null&&incoming?.start>historyIn){historyIn=historyOut=null;expired=true;}renderHistory(incoming);if(expired)el('history-status').textContent='O ponto expirou pela retenção. Escolha outro ponto.';el('history-play').disabled=!incoming||!result.historyPlaybackSupported;el('history-follow').disabled=!incoming||!result.historyPlaybackSupported;if(historyIn!==null&&Date.now()-historyPinAt>30000)renewHistoryPin();pumpHistoryVideo();}catch(e){if(!historyState)el('history-status').textContent=e.message;}finally{historyRefreshing=false;}}
    el('history-video').addEventListener('timeupdate',updateHistoryVideoCursor);el('history-video').addEventListener('seeked',updateHistoryVideoCursor);el('history-video').addEventListener('ended',()=>{if(historyPlayback){historyPlayback.resumeWhenReady=!!historyState?.recording;el('history-play').textContent='▶ Reproduzir histórico';}});
    setInterval(pumpHistoryVideo,500);window.addEventListener('pagehide',()=>{stopHistoryVideo();});
    let cameraSignature='';
    function renderCameraOptions(data){
      const choices=[...new Set([...(data.availableCams||[]),...Object.values(data.players||{}).map(p=>p.cam),...(data.events||[]).flatMap(e=>(e.clips||[]).map(c=>c.cam))])].filter(Boolean),signature=JSON.stringify(choices),select=el('audio-cam');
      if(signature!==cameraSignature){const old=select.value;select.replaceChildren();for(const cam of choices){const option=document.createElement('option');option.value=cam;option.textContent=cam;select.append(option);}if(choices.includes(old))select.value=old;cameraSignature=signature;showCameraOptions();}
      el('audio-record').disabled=!!data.rec;
      el('replay-audio').textContent=data.audioEnabled?'Áudio ligado':'Áudio silenciado';
      const sync=data.sync;el('sync-status').textContent=sync?`Desvio medido: ${Number(sync.differenceFrames).toFixed(2)} quadros · ${sync.frameRate} fps · ${sync.paused?'pausado':'em reprodução'}. Posição confirmada pelo motor; sincronismo das câmeras depende da calibração.`:'Vincule dois ângulos do mesmo lance com a mesma taxa constante para alinhar e avançar quadro a quadro.';
      for(const p of ['A','B','C','D']){const rate=data.players?.[p]?.frameRate?.split('/').map(Number);if(rate?.[0])el('seek-'+p).step=1000*rate[1]/rate[0];}
    }
    function showCameraOptions(){const value=replay?.cameraOptions?.[el('audio-cam').value]||{};el('audio-record').value=value.recordAudio||'input';el('audio-gain').value=value.gainDb||0;el('audio-muted').checked=!!value.muted;el('camera-offset').value=value.offsetFrames||0;}
    function saveCameraOptions(){request('camera-options',{cam:el('audio-cam').value,options:{recordAudio:el('audio-record').value,gainDb:Number(el('audio-gain').value),muted:el('audio-muted').checked,offsetFrames:Number(el('camera-offset').value)}});}
    function moveEvent(id,delta){const ids=(replay?.events||[]).map(e=>e.id),from=ids.indexOf(id),to=from+delta;if(from<0||to<0||to>=ids.length)return;[ids[from],ids[to]]=[ids[to],ids[from]];request('reorder',{ids});}
    function reorderBefore(source,target){if(!source||source===target)return;const ids=(replay?.events||[]).map(e=>e.id);if(!ids.includes(source)||!ids.includes(target))return;ids.splice(ids.indexOf(source),1);ids.splice(ids.indexOf(target),0,source);request('reorder',{ids});}
    function importClip(){const file=el('import-file').value.trim();if(!file){el('message').textContent='Informe o caminho completo do vídeo neste computador.';return;}request('import',{file,name:el('import-name').value.trim(),cam:el('import-cam').value.trim()});}
    function saveRetention(){request('retention',{enabled:el('retention-enabled').checked,minutes:Number(el('retention-minutes').value),segmentSeconds:60});}
    function selectDeck(value, element) { deck=value; document.querySelectorAll('.deck-cam').forEach((c)=>c.classList.remove('active')); element.classList.add('active'); }
    function toggleRecording() { request(replay?.rec ? 'stop' : 'start', {cams:[...el('cam-select').querySelectorAll('input:checked')].map((i)=>i.value)}); }
    function quickClip(seconds) { request('capture',{seconds}); }
    function markIn() { request('mark-in'); }
    function markOut() { request('mark-out'); }
    function setSpeed(speed) { request('speed',{speed:Number(speed)}); }
    function playInDeck(player,eventId,cam) { deck=player; request('load',{player,eventId,cam}); }
    function takeReplayAir() { request('air',{player:deck}); }
    function backToLive() { request('live'); }
    async function poll() {
      if (busy) return;
      try { const response=await fetch('/api/replay',{signal:AbortSignal.timeout(5000)}); const result=await response.json(); if (result.success){render(result.replay);autoHistory();} else el('rec-status').textContent=result.error; }
      catch { el('rec-status').textContent='Sem conexão com o FreeMix'; }
    }
    poll(); setInterval(poll,1500);
