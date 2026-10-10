// Navigation only: no transport, recording or audio command is sent here.
(()=>{'use strict';
 const q=new URLSearchParams(location.search),byId=id=>document.getElementById(id);
 document.querySelectorAll('[data-open-details]').forEach(link=>link.addEventListener('click',()=>{const details=byId(link.dataset.openDetails);if(details)details.open=true;}));
 if(location.hash==='#audio-advanced'&&byId('audio-advanced'))byId('audio-advanced').open=true;
 if(byId('settings-task-links')){
  const update=()=>{const selected=document.querySelector('#categories button.selected');byId('settings-task-links').hidden=selected?.dataset.category!=='audio';};
  new MutationObserver(update).observe(byId('categories'),{childList:true,subtree:true,attributes:true,attributeFilter:['class']});update();
 }
 if(!byId('replay-preparation'))return;
 const settings=q.get('view')==='settings';document.body.dataset.replayMode=settings?'settings':'operation';
 byId('replay-view-help').textContent=settings?'Escolha câmeras, retenção e fonte do áudio gravado com REC parado. Volume e silêncio ajustam a reprodução. Abra Operar Replay para buscar, salvar e colocar os lances no ar.':'Selecione as câmeras e inicie REC. Busque o trecho, salve o lance e carregue um player. Só REPLAY NO AR leva o player ao Programa.';
 if(settings){const audio=byId('replay-camera-audio'),note=document.createElement('p'),link=document.createElement('a');note.textContent='Para alinhar pelo áudio comum, primeiro carregue ângulos do mesmo lance e vincule os players no console de operação. O estado do motor aparece abaixo; configurar uma câmera não cria o vínculo. ';link.href='/replay#replay-transport';link.textContent='Abrir controles dos players';note.append(link);audio.append(note);}
 const heading=document.querySelector('.title span');if(settings&&heading)heading.textContent='Configurações do Replay';
 const nav=document.querySelector('nav[aria-label="Replay"]'),preparation=byId('replay-preparation');nav.after(byId('replay-view-help'));byId('replay-view-help').after(preparation);
 if(settings){preparation.open=true;byId('replay-camera-audio').open=true;const raw=location.hash;if(raw==='#replay-config'){history.replaceState(null,'',location.pathname+location.search);window.scrollTo(0,0);}}
 else{
  let anchor=preparation;for(const id of ['replay-history','replay-capture','replay-events','replay-players','replay-speed','replay-transport']){const node=byId(id);if(node){anchor.after(node);anchor=node;}}
 }
 document.querySelectorAll('.deck-cam').forEach(card=>{card.setAttribute('role','group');const player=card.querySelector('.deck-cam-title')?.textContent.trim().replace('PLAYER ','');if(!['A','B','C','D'].includes(player))return;const select=document.createElement('button');select.type='button';select.textContent='Selecionar player '+player;select.addEventListener('click',()=>selectDeck(player,card));card.prepend(select);});
 const air=document.querySelector('.bottom-air .live'),back=document.querySelector('.bottom-air .back'),ready=document.createElement('p');ready.id='replay-ready';ready.setAttribute('role','status');ready.setAttribute('data-replay-operacao','');document.querySelector('.bottom-air').before(ready);
 function paintReady(){
  const state=typeof replay==='object'&&replay,player=typeof deck==='string'?deck:'A',loaded=state?.players?.[player];
  const available=!!loaded&&typeof loaded.eventId==='string'&&!!loaded.eventId&&typeof loaded.cam==='string'&&!!loaded.cam&&typeof loaded.file==='string'&&!!loaded.file&&loaded.metadataProbed===true&&loaded.hasVideo===true;
  const knownProgram=typeof state?.program==='string'&&!!state.program,canReturn=!knownProgram||/^REPLAY [ABCD]$/.test(state.program);
  if(air.disabled===available)air.disabled=!available;if(back.disabled===canReturn)back.disabled=!canReturn;
  const text=available?'Player '+player+' carregado. REPLAY NO AR solicita sua entrada no Programa.':'Carregue um lance no player '+player+' antes de colocar no ar.';if(ready.textContent!==text)ready.textContent=text;
 }
 // Same functions, same command path; the decoration only derives UI readiness.
 const originalRender=render;render=function(...args){const result=originalRender.apply(this,args);paintReady();return result;};
 const originalSelect=selectDeck;selectDeck=function(...args){const result=originalSelect.apply(this,args);paintReady();return result;};paintReady();
})();
