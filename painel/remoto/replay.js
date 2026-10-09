let replay = null, deck = 'A', busy = false, retentionDirty = false, eventsSignature = '';
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
        el('message').textContent = action === 'capture' || action === 'mark-out' ? 'Vídeo do lance salvo.' : 'Operação confirmada pelo motor.';
        if (navigator.vibrate) navigator.vibrate(25);
      } catch (error) { el('message').textContent = error.message; }
      finally { busy = false;el('import-btn').disabled=false; }
    }
    function renderBase(data) {
      replay = data;
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
      try { const response=await fetch('/api/replay',{signal:AbortSignal.timeout(5000)}); const result=await response.json(); if (result.success) render(result.replay); else el('rec-status').textContent=result.error; }
      catch { el('rec-status').textContent='Sem conexão com o FreeMix'; }
    }
    poll(); setInterval(poll,1500);
