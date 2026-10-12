// Standalone-only placement over the SAME qualified common controller/template.
// No network/API/media command, added player, cloned feed or automatic capture.
(() => {'use strict';
 const instances=new WeakMap(),assetBase=new URL('replay-icons/',document.currentScript.src).href;
 window.FreeMixReplayPresentation={attach(host,{isPosting,mode='dock'}={}){
  if(!host||host.ownerDocument!==document||!host.classList.contains('rp-common'))throw Error('FULLSCREEN_COMMON_HOST_REQUIRED');
  if(instances.has(host))return instances.get(host);
  if(typeof isPosting!=='function')throw Error('FULLSCREEN_POST_GUARD');
  if(!['dock','fullscreen'].includes(mode))throw Error('REPLAY_PRESENTATION_MODE');
  const originalNodes=[host,...host.querySelectorAll('*')],beforeTree=originalNodes.map(node=>({node,children:Array.from(node.childNodes),attributes:Array.from(node.attributes,attribute=>[attribute.name,attribute.value])})),bodyClass=document.body.className;
  const byID=new Map(Array.from(host.querySelectorAll('[id]'),node=>[node.id,node]));let reparenting=true,disposed=false;const failedCleanup=[];
  // Resolve original nodes while their subtrees are temporarily detached. Once
  // assembled, never use this cache for dynamic replacement image elements.
  const el=id=>host.querySelector('[id="'+id+'"]')||(reparenting?byID.get(id):null),make=(tag,className)=>{const n=document.createElement(tag);if(className)n.className=className;return n;};
  try{
  const control=host.querySelector('.rp-dock-ctrl'),actions=host.querySelector('.rp-dock-actions'),decks=host.querySelector('.rp-deck-info'),history=el('replay-history'),historyPreview=host.querySelector('.rp-history-preview'),message=el('message'),tabs=host.querySelector('.rp-common-tabs'),configRow=host.querySelector('.rp-config-row'),panels=Array.from(host.querySelectorAll('[data-replay-panel]')),markRow=actions?.querySelector('.row');
  if(!control||!actions||!decks||!history||!historyPreview||!message||!tabs||!configRow||!markRow||panels.length!==3)throw Error('FULLSCREEN_COMPONENT_CONTRACT');
  const originalIDs=Array.from(host.querySelectorAll('[id]')).map(node=>({id:node.id,node}));if(new Set(originalIDs.map(item=>item.id)).size!==originalIDs.length)throw Error('FULLSCREEN_DUPLICATE_ORIGINAL_ID');
  const top=make('div','rp-fullscreen-top'),left=make('div','rp-fullscreen-left'),search=make('div','rp-fullscreen-search'),toolbar=make('div','rp-fullscreen-toolbar'),workspace=make('div','rp-fullscreen-workspace'),historyControls=make('div','rp-full-history-controls'),grid=make('div','rp-camera-grid'),timeline=make('div','rp-fullscreen-timeline'),tc=make('output');
  const searchTitle=make('span','rp-fullscreen-search-title'),modeControls=make('div','row rp-presentation-modes'),monitorMode=make('button','b'),searchMode=make('button','b');searchTitle.textContent='Busca no histórico · quadro selecionado';monitorMode.type=searchMode.type='button';monitorMode.textContent='Monitores A/B';searchMode.textContent='Busca no histórico';modeControls.append(monitorMode,searchMode);search.hidden=true;
  tc.setAttribute('aria-label','Posição selecionada no histórico');tc.textContent='—';const track=make('div','rp-fullscreen-track'),ruler=make('div','rp-fullscreen-ruler');ruler.setAttribute('aria-label','Régua do intervalo gravado');
  left.append(decks,search);top.append(left,grid);toolbar.append(tabs,modeControls,configRow);
  for(const panel of panels)workspace.append(panel);
  const slider=el('history-seek');for(const child of Array.from(history.children))if(child!==historyPreview&&child!==slider)historyControls.append(child);
  const playerPositions={A:el('seek-A'),B:el('seek-B')},positionLabel=make('span','rp-position-label');positionLabel.id='replay-position-context';for(const [id,input]of Object.entries(playerPositions)){input.classList.add('rp-timeline-bar');input.dataset.rpPositionPlayer=id;}
  monitorMode.id='replay-position-monitors';searchMode.id='replay-position-history';monitorMode.dataset.rpPositionMode='monitors';searchMode.dataset.rpPositionMode='history';
  track.append(slider,playerPositions.A,playerPositions.B,ruler);timeline.append(positionLabel,track,tc);historyControls.append(timeline);search.append(searchTitle,history);
  let presentationView='monitors';
  function setView(view){presentationView=view;decks.hidden=view==='history';search.hidden=view!=='history';monitorMode.classList.toggle('on',view!=='history');searchMode.classList.toggle('on',view==='history');monitorMode.setAttribute('aria-pressed',String(view!=='history'));searchMode.setAttribute('aria-pressed',String(view==='history'));}
  monitorMode.onclick=()=>{if(!disposed){setView('monitors');placeHistory();}};searchMode.onclick=()=>{if(!disposed){setView('history');placeHistory();}};setView('monitors');
  const slots=[];for(let i=0;i<8;i++){
   const slot=make('div','rp-camera-slot'),note=make('div','rp-camera-note'),button=make('button');button.type='button';button.disabled=true;button.textContent=(i+1)+' · Não configurada';button.setAttribute('aria-pressed','false');
   slot.dataset.rpCameraSlot=String(i+1);button.dataset.rpCameraSelect=String(i+1);note.textContent='Sem câmera gravada';slot.append(note,button);grid.append(slot);slots.push({slot,note,button,name:null});
   button.onclick=()=>{if(disposed||button.disabled||isPosting()!==false||!slots[i].name)return;const camera=el('history-camera');if(!Array.from(camera.options).some(o=>o.value===slots[i].name))return;const changed=camera.value!==slots[i].name;camera.value=slots[i].name;setView('history');placeHistory();if(changed)camera.dispatchEvent(new Event('change',{bubbles:true}));};
  }
  const filter=make('input'),clearFilter=make('button','b'),searchControls=make('div','row rp-event-search');filter.type='search';filter.id='replay-event-filter';filter.placeholder='Filtrar lances nesta página';filter.setAttribute('aria-label','Filtrar por nome ou câmera na página atual');clearFilter.type='button';clearFilter.id='replay-event-filter-clear';clearFilter.title='Limpar filtro local';searchControls.append(filter,clearFilter);toolbar.insertBefore(searchControls,toolbar.lastElementChild);
  const previous=make('button','b'),next=make('button','b'),supported=make('div','row rp-event-navigation');previous.type=next.type='button';previous.title='Carregar o lance anterior no player selecionado';next.title='Carregar o próximo lance no player selecionado';supported.append(previous,next);
  markRow.append(supported);
  const unavailable=[['repeat','Loop','Reprodução em loop ainda indisponível'],['music','Música','Música durante a reprodução ainda indisponível'],['expand','Quad View','Monitor simultâneo de quatro câmeras ainda indisponível'],['download','Exportar clips','Exportação de clips ainda indisponível']];for(const [icon,label,reason]of unavailable){const button=make('button','b');button.type='button';button.disabled=true;button.title=reason;button.dataset.rpUnavailableIcon=icon;button.dataset.rpUnavailableLabel=label;supported.append(button);}
  actions.append(message);control.replaceChildren(top,toolbar,el('replay-pages'),workspace,actions,historyControls);
  if(mode==='dock')top.hidden=true;
  for(const item of originalIDs){const matches=host.querySelectorAll('[id="'+item.id+'"]');if(matches.length!==1||matches[0]!==item.node)throw Error('FULLSCREEN_ORIGINAL_NODE_LOST');}
  reparenting=false;
  host.dataset.replayPresentation=mode;host.classList.add('rp-presentation-'+mode);if(mode==='fullscreen')document.body.classList.add('rp-fullscreen-window');
  let rulerKey=null,latest=null,selectedEventID=null,angleContext=null;const chosenAngles=new Map();
  const advanced=make('details','rp-dock-history-tools'),summary=make('summary'),advancedBody=make('div','rp-advanced-body'),historyMarks=make('div','row rp-history-marks');summary.textContent='Ferramentas de busca';advanced.append(summary,advancedBody);
  const historyLabel=make('span','rp-mark-label');historyLabel.textContent='Busca:';historyMarks.append(historyLabel);for(const id of ['history-back-frame','history-next-frame','history-in','history-out','history-save'])historyMarks.append(el(id));
  for(const node of Array.from(historyControls.children))if(node!==timeline)advancedBody.append(node);historyControls.replaceChildren(historyMarks,advanced,timeline);
  const currentMarkLabel=markRow.querySelector('.rp-mark-label');if(currentMarkLabel){currentMarkLabel.textContent='Mark';currentMarkLabel.title='Marcar ao vivo: tempo atual da gravação contínua';}
  markRow.classList.add('rp-main-mark-row');const transportRow=actions.querySelector('.rp-bottom-row');transportRow.classList.add('rp-main-transport-row');
  const mainTransport=transportRow.firstElementChild;for(const command of ['PAUSE','PLAY'])mainTransport.append(host.querySelector('[data-replay-transport="'+command+'"]'));mainTransport.append(previous,next);
  for(const button of Array.from(supported.children))if(button!==previous&&button!==next)advancedBody.append(button);supported.remove();
  for(const button of host.querySelectorAll('[data-replay-air]'))advancedBody.append(button);advancedBody.append(el('replay-retention'));
  const statusRow=actions.querySelector('.rp-tc-row');if(statusRow)advancedBody.append(statusRow);historyMarks.append(message);previous.classList.add('rp-neighbour');next.classList.add('rp-neighbour');
  const matrix=make('div','rp-angle-matrix'),matrixButtons=[];for(const player of ['A','B']){const row=make('div','rp-angle-row'),label=make('span');label.textContent=player;row.append(label);for(let i=0;i<8;i++){const button=make('button','b rp-angle-button');button.type='button';button.textContent=String(i+1);button.dataset.rpAnglePlayer=player;button.dataset.rpAngleIndex=String(i);button.disabled=true;row.append(button);matrixButtons.push(button);}matrix.append(row);}markRow.append(historyMarks,matrix);
  if(mode==='dock'){monitorMode.textContent='Player A/B';searchMode.textContent='Histórico';timeline.insertBefore(modeControls,positionLabel);}
  const speedAtTime=make('span','rp-position-speed');timeline.append(speedAtTime);
  const angleQueue=make('button','b rp-angle-queue');angleQueue.type='button';angleQueue.textContent='Montar lista (0)';angleQueue.setAttribute('aria-label','Montar lista de ângulos');angleQueue.title='Adicionar os ângulos marcados ao rascunho; ordenar em Listas antes de salvar e preparar';toolbar.insertBefore(angleQueue,configRow);
  const angleLocked=()=>disposed||isPosting()!==false||window.FreeMixReplayPlaylist?.isDraftLocked?.()!==false;
  const angleKey=(eventId,cam)=>JSON.stringify([eventId,cam]);
  const angleIdentifier=value=>typeof value==='string'&&value.length>0&&value.length<=128&&value.trim().length>0&&Array.from(value).every(character=>character.charCodeAt(0)>=32&&character.charCodeAt(0)!==127);
  function currentEvents(){return Array.isArray(latest?.events)?latest.events.filter(event=>event&&typeof event==='object'&&angleIdentifier(event.id)):[];}
  function playerClip(eventId,cam){if(!angleIdentifier(eventId)||!angleIdentifier(cam))return null;const event=currentEvents().find(event=>event.id===eventId);return Array.isArray(event?.clips)?event.clips.find(clip=>clip?.cam===cam)||null:null;}
  function angleClip(eventId,cam){const event=currentEvents().find(event=>event.id===eventId&&!event.playlist&&!event.preparedEffect);return event?playerClip(eventId,cam):null;}
  function paintAngleQueue(){angleQueue.textContent='Montar lista ('+chosenAngles.size+')';angleQueue.disabled=angleLocked()||chosenAngles.size===0;}
  angleQueue.onclick=()=>{
   if(angleLocked()||!chosenAngles.size)return;
   const request={sessionId:latest?.session?.id,scopeToken:latest?.playlist?.preparation?.scopeToken,items:Array.from(chosenAngles.values())};
   const result=window.FreeMixReplayPlaylist?.addDraftAngles?.(request);
   if(result?.accepted!==true){message.textContent=result?.reason||'A lista não confirmou estes ângulos.';return;}
   chosenAngles.clear();paintCameraMetadata({});host.querySelector('[data-replay-tab="Listas"]').click();
  };
  function paintTime(value){if(!Number.isFinite(value))return '—';const cs=Math.round(Math.max(0,value)*100);return String(Math.floor(cs/360000)).padStart(2,'0')+':'+String(Math.floor(cs/6000)%60).padStart(2,'0')+':'+String(Math.floor(cs/100)%60).padStart(2,'0')+'.'+String(cs%100).padStart(2,'0');}
  function placeHistory(){
   if(disposed)return;const camera=el('history-camera'),names=Array.from(camera.options).map(o=>o.value);
   for(let i=0;i<slots.length;i++){const item=slots[i];item.name=names[i]||null;item.button.textContent=(i+1)+' · '+(item.name||'Não configurada');item.button.disabled=!item.name||isPosting()!==false;item.button.title=item.name?'Selecionar esta câmera na busca do histórico; não é monitor ao vivo':'Nenhuma câmera gravada nesta posição';const active=!!item.name&&item.name===camera.value;item.button.setAttribute('aria-pressed',String(active));item.note.textContent=item.name?(active?'Busca selecionada · imagem à esquerda':'Histórico · selecione para conferir'):'Sem câmera gravada';}
   // The product exposes ONE selected historical camera preview, not eight
   // concurrent live camera feeds. Its real node stays in the large search
   // monitor at left, explicitly distinct from the loaded A/B player monitors.
   const image=el('history-image'),video=el('history-video'),empty=el('history-empty'),hideEmpty=!image.hidden||!video.hidden;if(empty.hidden!==hideEmpty)empty.hidden=hideEmpty;
   const deck=el('deck-B').classList.contains('on')?'B':'A',historyMode=presentationView==='history',range=historyMode?slider:playerPositions[deck],scale=historyMode?1:.001;
   slider.hidden=!historyMode;for(const [id,input]of Object.entries(playerPositions))input.hidden=historyMode||id!==deck;
   positionLabel.textContent=historyMode?'Busca gravada':'Replay '+deck;positionLabel.dataset.mode=historyMode?'history':'player';
   const start=Number(range.min)*scale,end=Number(range.max)*scale,rangeKnown=!range.disabled&&Number.isFinite(start)&&Number.isFinite(end)&&end>start,key=rangeKnown?JSON.stringify([presentationView,deck,start,end]):null;
   const cursor=historyMode?Number(slider.value):Number(latest?.players?.[deck]?.mediaCursor)*.001;tc.textContent=rangeKnown?paintTime(cursor):'—';
   const baked=latest?.players?.[deck]?.playbackSpeed===100;speedAtTime.textContent=latest?(baked?'100%':String(Number(latest.speed)||100)+'%'):'—';
   message.title=message.textContent;el('replay-air').title=el('replay-ready').textContent;el('speed-lbl').title=el('speed-lbl').textContent;
   if(key!==rulerKey){rulerKey=key;ruler.replaceChildren();if(rangeKnown)for(let i=0;i<=6;i++){const label=make('span');label.dataset.rpRulerTick=String(i);label.textContent=paintTime(start+(end-start)*i/6);ruler.append(label);}}
  }
  const cameraObserver=new MutationObserver(placeHistory);failedCleanup.push(()=>cameraObserver.disconnect());cameraObserver.observe(el('history-camera'),{childList:true,subtree:true});
  failedCleanup.push(()=>{byID.get('history-camera')?.removeEventListener('change',placeHistory);slider.removeEventListener('input',placeHistory);slider.removeEventListener('change',placeHistory);byID.get('history-video')?.removeEventListener('timeupdate',placeHistory);});
  el('history-camera').addEventListener('change',placeHistory);slider.addEventListener('input',placeHistory);slider.addEventListener('change',placeHistory);el('history-video').addEventListener('timeupdate',placeHistory);
  const frameObserver=new MutationObserver(placeHistory);failedCleanup.push(()=>frameObserver.disconnect());frameObserver.observe(historyPreview,{subtree:true,attributes:true,attributeFilter:['hidden']});
  function cameraNames(){
   const names=[],valid=value=>typeof value==='string'&&value.length>0&&value.length<=128&&value.trim().length>0&&Array.from(value).every(character=>character.charCodeAt(0)>=32&&character.charCodeAt(0)!==127);
   const add=name=>{if(valid(name)&&!names.includes(name)&&names.length<8)names.push(name);};
   for(const camera of Array.isArray(latest?.session?.cams)?latest.session.cams:[])add(camera?.name);
   for(const event of Array.isArray(latest?.events)?latest.events:[])for(const clip of Array.isArray(event?.clips)?event.clips:[])add(clip?.cam);
   return names;
  }
  function paintCameraMetadata(data){
   if(disposed||!data||typeof data!=='object')return;
   if(Object.hasOwn(data,'session')&&latest?.session?.id!==data.session?.id)latest=null;
   latest={...(latest||{}),...data};
   const context=JSON.stringify([latest.session?.id||null,latest.playlist?.preparation?.scopeToken||null]);
   if(context!==angleContext){angleContext=context;chosenAngles.clear();}
   for(const [key,item]of chosenAngles)if(!angleClip(item.eventId,item.cam))chosenAngles.delete(key);
   const events=currentEvents(),names=cameraNames();
   const header=host.querySelector('.rp-events-table thead tr'),body=el('events-list');if(!header||!body)return;
   for(let i=2;i<8;i++){let label=header.querySelector('[data-rp-angle="'+i+'"]');if(!label){label=make('th','rp-angle-metadata');label.dataset.rpAngle=String(i);header.insertBefore(label,header.lastElementChild);}label.textContent=(i+1)+' '+(names[i]||'Câmera não gravada');label.title='Marcar ângulo para a lista; a ordem pode ser editada em Listas';}
   for(let i=0;i<2;i++){const label=header.children[5+i];label.textContent=(i+1)+' '+(names[i]||'Câmera não gravada');label.title='Marcar ângulo para a lista; seletor abaixo escolhe a câmera para Replay '+(i===0?'A':'B');}
   const byID=new Map(events.map(event=>[event.id,event]));
   for(const row of body.children){
    if(!row.dataset.event){if(row.children.length===1)row.firstElementChild.colSpan=14;continue;}
    const event=byID.get(row.dataset.event);
    for(let i=0;i<8;i++){
     let cell=i<2?row.children[5+i]:row.querySelector('[data-rp-angle="'+i+'"]');
     if(!cell){cell=make('td','rp-angle-metadata');cell.dataset.rpAngle=String(i);row.insertBefore(cell,row.lastElementChild);}
     const cam=names[i],clip=angleClip(event?.id,cam),key=angleKey(event?.id,cam);let check=cell.querySelector('[data-rp-angle-flag]');
     if(!check){check=make('input');check.type='checkbox';check.dataset.rpAngleFlag=String(i);cell.prepend(check);}
     check.checked=chosenAngles.has(key);check.disabled=angleLocked()||!clip||(!check.checked&&chosenAngles.size>=8);
     check.setAttribute('aria-label','Lance '+(event?.name||event?.id||'indisponível')+' · ângulo '+(cam||i+1));check.title=clip?'Marcar este ângulo para a sequência; a ordem segue a seleção e pode ser editada':'Ângulo não gravado neste lance';
     check.onchange=()=>{if(angleLocked()||!angleClip(event?.id,cam)){check.checked=chosenAngles.has(key);return;}if(check.checked){if(chosenAngles.size>=8){check.checked=false;message.textContent='Selecione até oito ângulos por lista.';return;}chosenAngles.set(key,{eventId:event.id,cam});}else chosenAngles.delete(key);paintCameraMetadata({});};
     if(i>=2){let label=cell.querySelector('span');if(!label){label=make('span');cell.append(label);}label.textContent=clip?(typeof event?.name==='string'?event.name:cam):'—';}
     cell.title=clip?'Ângulo '+cam+' disponível neste lance':'Nenhum clip desta câmera neste lance';
    }
   }
   paintAngleQueue();
  }
  function decorate(button,icon,label){if(!button)return;const key=icon+'|'+label;if(button.dataset.rpIcon===key&&button.querySelector('.rp-icon'))return;const image=make('img','rp-icon');image.src=new URL(icon+'.svg',assetBase).href;image.alt='';image.setAttribute('aria-hidden','true');const text=make('span');text.textContent=label;button.replaceChildren(image,text);button.dataset.rpIcon=key;button.setAttribute('aria-label',label||button.title||'Replay');}
  function paintIcons(){
   decorate(el('replay-settings'),'gear','Configurações do Replay');decorate(el('record-btn'),'circle','REC SSD');decorate(el('replay-air'),'play','No Ar');decorate(el('replay-live'),'rotate-left','Voltar ao vivo');
   decorate(host.querySelector('[data-replay-transport="PAUSE"]'),'pause','Pausa');decorate(host.querySelector('[data-replay-transport="PLAY"]'),'play','Play');
   decorate(el('history-back-frame'),'backward-step','Quadro −1');decorate(el('history-next-frame'),'forward-step','Quadro +1');
   decorate(el('history-play'),el('history-video').paused?'play':'pause',el('history-video').paused?'Reproduzir histórico':'Pausar histórico');decorate(el('history-refresh'),'magnifying-glass','Atualizar histórico');
   for(const button of host.querySelectorAll('.ev-btn')){const player=button.textContent.trim().endsWith('A')?'A':'B';decorate(button,'play',player);}for(const button of host.querySelectorAll('.rp-events-table .b:not(.ev-btn)'))decorate(button,'xmark','Excluir');
   decorate(clearFilter,'xmark','Limpar');decorate(previous,'backward-fast','Anterior');decorate(next,'forward-fast','Próximo');for(const button of advancedBody.querySelectorAll('[data-rp-unavailable-icon]'))decorate(button,button.dataset.rpUnavailableIcon,button.dataset.rpUnavailableLabel);
  }
  function paintFilter(){
   const query=filter.value.trim().toLocaleLowerCase(),events=new Map(currentEvents().map(event=>[event.id,event]));
   for(const row of el('events-list').children){const event=events.get(row.dataset.event);if(!event)continue;const text=[event.name,...(Array.isArray(event.clips)?event.clips:[]).map(clip=>clip?.cam)].filter(value=>typeof value==='string').join(' ').toLocaleLowerCase();row.hidden=!!query&&!text.includes(query);
    if(!row.dataset.rpSelectionBound){row.dataset.rpSelectionBound='true';row.addEventListener('click',event=>{if(disposed||event.target.closest('button,input,select'))return;const check=row.querySelector('input[type="checkbox"]');if(check){check.checked=!check.checked;check.dispatchEvent(new Event('change',{bubbles:true}));}});}
   }
   previous.disabled=next.disabled=isPosting()!==false||!latest?.events?.length;
  }
  function loadNeighbour(direction){
   if(disposed||isPosting()!==false)return;const deck=el('deck-B').classList.contains('on')?'B':'A',events=currentEvents(),at=events.findIndex(event=>event.id===latest?.players?.[deck]?.eventId),index=at<0?0:at+direction;if(index<0||index>=events.length)return;
   const page=Math.floor(index/20)+1,pageButton=el('replay-pages').querySelector('[data-replay-page="'+page+'"]');if(!pageButton)return;pageButton.click();const row=Array.from(el('events-list').children).find(value=>value.dataset.event===events[index].id),button=row&&Array.from(row.querySelectorAll('.ev-btn')).find(value=>value.textContent.trim().endsWith(deck));if(button)button.click();
  }
  function selectedRow(){const rows=Array.from(el('events-list').children);return rows.find(row=>row.dataset.event===selectedEventID&&row.querySelector('input[type="checkbox"]')?.checked)||rows.find(row=>row.querySelector('input[type="checkbox"]')?.checked)||null;}
  function paintMatrix(){const row=selectedRow(),event=currentEvents().find(value=>value.id===row?.dataset.event);for(const button of matrixButtons){const player=button.dataset.rpAnglePlayer,index=Number(button.dataset.rpAngleIndex),select=row?.querySelectorAll('select')[player==='A'?0:1],clip=playerClip(event?.id,cameraNames()[index]);button.disabled=isPosting()!==false||!select||select.disabled||!clip||!Array.from(select.options).some(option=>option.value===clip.cam);button.classList.toggle('on',!!clip&&select?.value===clip.cam);button.title=clip?'Replay '+player+' · '+clip.cam+' no lance selecionado; carregar pelo botão '+player:'Nenhum clip para este ângulo no lance selecionado';}}
  for(const button of matrixButtons)button.onclick=()=>{if(disposed||button.disabled||isPosting()!==false)return;const row=selectedRow(),event=currentEvents().find(value=>value.id===row?.dataset.event),clip=playerClip(event?.id,cameraNames()[Number(button.dataset.rpAngleIndex)]),select=row?.querySelectorAll('select')[button.dataset.rpAnglePlayer==='A'?0:1];if(!clip||!select||select.disabled||!Array.from(select.options).some(option=>option.value===clip.cam))return;select.value=clip.cam;select.dispatchEvent(new Event('change',{bubbles:true}));paintMatrix();};
  filter.oninput=paintFilter;clearFilter.onclick=()=>{if(disposed)return;filter.value='';paintFilter();};previous.onclick=()=>loadNeighbour(-1);next.onclick=()=>loadNeighbour(1);
  const tableObserver=new MutationObserver(()=>{if(disposed)return;paintCameraMetadata({});paintFilter();paintMatrix();paintIcons();});failedCleanup.push(()=>tableObserver.disconnect());tableObserver.observe(el('events-list'),{childList:true});
  const onHostClick=event=>{if(disposed)return;const row=event.target.closest('tr[data-event]');if(row&&host.contains(row))selectedEventID=row.dataset.event;placeHistory();paintMatrix();};failedCleanup.push(()=>host.removeEventListener('click',onHostClick));host.addEventListener('click',onHostClick);
  const instance={render(data){paintCameraMetadata(data);placeHistory();paintFilter();paintMatrix();paintIcons();},close(){if(disposed)return;disposed=true;cameraObserver.disconnect();frameObserver.disconnect();tableObserver.disconnect();host.removeEventListener('click',onHostClick);el('history-camera').removeEventListener('change',placeHistory);slider.removeEventListener('input',placeHistory);slider.removeEventListener('change',placeHistory);el('history-video').removeEventListener('timeupdate',placeHistory);monitorMode.onclick=searchMode.onclick=filter.oninput=clearFilter.onclick=previous.onclick=next.onclick=null;for(const slot of slots)slot.button.onclick=null;for(const button of matrixButtons)button.onclick=null;angleQueue.onclick=null;chosenAngles.clear();for(const check of host.querySelectorAll("[data-rp-angle-flag]"))check.onchange=null;instances.delete(host);}};
  instances.set(host,instance);placeHistory();return instance;
  }catch(error){
   disposed=true;for(const clean of failedCleanup){try{clean();}catch{}}
   instances.delete(host);reparenting=true;
   // Restore original node ownership/ordering/attributes before the wrapper
   // calls the REAL common close, whose helpers need the original host tree.
   for(const item of beforeTree.slice().reverse()){item.node.replaceChildren(...item.children);for(const attribute of Array.from(item.node.attributes))item.node.removeAttribute(attribute.name);for(const [name,value]of item.attributes)item.node.setAttribute(name,value);}
   document.body.className=bodyClass;throw error;
  }
 }};
 // The COMMON factory/controller stays byte-identical. A narrow public-method
 // wrapper adds only presentation after successful existing DOM admissions.
 // No original internal command/handler, polling timer or endpoint is replaced.
 const common=window.FreeMixReplayDock;if(!common||typeof common.mount!=='function')throw Error('COMMON_REPLAY_FACTORY_REQUIRED');const mount=common.mount,attached=new WeakMap();
 common.mount=function(host,options={}){
  let presentation=null;const onState=options.onState;
  const component=mount.call(this,host,{...options,onState(data){presentation?.render(data);return onState?.(data);}});
  if(attached.has(host))return component;
  try{presentation=window.FreeMixReplayPresentation.attach(host,{isPosting:component.isPosting,mode:options.presentationMode||(host.id==='replay-dock-root'?'fullscreen':'dock')});}
  catch(error){try{component.close();}catch(closeError){throw new AggregateError([error,closeError],'Replay presentation failed; common close also refused');}throw error;}
  attached.set(host,presentation);
  for(const name of ['render','acceptRead','acceptExternalWrite']){const original=component[name];component[name]=function(...args){const result=original.apply(this,args);if(name==='render'||result===true)presentation.render(name==='render'?args[0]:args[1]);return result;};}
  const close=component.close;component.close=function(...args){presentation.close();attached.delete(host);return close.apply(this,args);};return component;
 };
})();
