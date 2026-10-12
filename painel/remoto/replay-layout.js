// Replay console layout only. No recording, transport or other POST on navigation.
(()=>{'use strict';
 if(new URLSearchParams(location.search).get('view')==='settings')return;
 const byId=id=>document.getElementById(id),node=(tag,cls)=>{const n=document.createElement(tag);n.className=cls;return n;};
 const body=document.body,header=document.querySelector('header');body.classList.add('vd','replay-console');
 const work=node('main','replay-workspace');header.after(work);
 const nav=document.querySelector('nav[aria-label="Replay"]');nav.classList.add('replay-main-nav');header.append(nav);
 const help=byId('replay-view-help');help.hidden=true;
 document.querySelector('.badge-role').hidden=true;
 const title=document.querySelector('.title span');if(title)title.textContent='Instant Replay';
 const toolbar=node('div','replay-console-toolbar'),mark=node('div','replay-mark-tools');work.append(toolbar);
 const preparation=byId('replay-preparation'),record=byId('record-btn');preparation.open=false;preparation.querySelector('summary').textContent='Câmeras';preparation.classList.remove('task-details');
 toolbar.append(preparation,record);
 const capture=byId('replay-capture');capture.classList.add('replay-quick-capture');for(const c of [...capture.children])if(!c.matches('.clip-quick-row,.mark-row'))c.hidden=true;
 mark.append(capture);toolbar.append(mark);
 const tabbar=node('div','replay-console-tabs'),views=node('section','replay-event-views');views.setAttribute('aria-label','Lances e preparação');
 const list=byId('replay-events'),playlist=byId('replay-playlists'),curve=byId('replay-curve-host');
 const panels=[['Lances',list],['Listas',playlist],['Curvas',curve]].filter(([,p])=>p);
 let selected=0;function showTab(index){selected=index;panels.forEach(([,panel],i)=>{panel.classList.toggle('replay-tab-hidden',i!==index);tabbar.children[i].classList.toggle('vd-on',i===index);tabbar.children[i].setAttribute('aria-selected',String(i===index));});}
 panels.forEach(([label,panel],i)=>{const button=node('button','replay-view-tab');button.type='button';button.textContent=label;button.setAttribute('role','tab');button.addEventListener('click',()=>showTab(i));tabbar.append(button);if(panel.tagName==='DETAILS')panel.open=true;views.append(panel);});
 tabbar.setAttribute('role','tablist');views.prepend(tabbar);
 const middle=node('div','replay-middle'),history=byId('replay-history');middle.append(views,history);work.append(middle);
 history.querySelector('h2').textContent='Buscar na gravação';history.querySelector('p').hidden=true;
 const tools=node('div','replay-history-tools'),camera=byId('history-camera');tools.append(camera.parentElement,byId('history-refresh'));history.querySelector('h2').after(tools);
 const preview=node('div','replay-history-preview');preview.append(byId('history-image'),byId('history-video'));tools.after(preview);
 const noFrame=node('p','replay-frame-empty');noFrame.textContent='Selecione uma posição para conferir o quadro';preview.append(noFrame);
 const observer=new MutationObserver(()=>{noFrame.hidden=!byId('history-image').hidden||!byId('history-video').hidden;});observer.observe(preview,{subtree:true,attributes:true,attributeFilter:['hidden']});
 const timeline=node('section','replay-position'),readout=node('div','replay-position-readout'),seek=byId('history-seek'),cursor=byId('history-cursor');timeline.setAttribute('aria-label','Agulha e marcação do replay');
 readout.append(byId('history-status'),cursor.parentElement,byId('history-range'));timeline.append(readout,seek);
 const points=node('div','replay-position-buttons');for(const [id,label] of [['history-back-frame','Quadro −1'],['history-next-frame','Quadro +1'],['history-in','IN'],['history-out','OUT'],['history-save','Salvar lance']]){const button=byId(id);button.textContent=label;points.append(button);}timeline.append(points);work.append(timeline);
 const videoActions=history.querySelector('.mark-row');if(videoActions){videoActions.classList.add('replay-history-play-tools');history.append(videoActions);}
 const players=byId('replay-players');players.querySelector('h2').textContent='Players de reprodução';players.querySelector('p').hidden=true;work.append(players);
 const transport=node('div','replay-console-transport'),speed=byId('replay-speed'),buttons=byId('replay-transport');buttons.querySelector('h3').hidden=true;buttons.querySelector('p').hidden=true;transport.append(buttons,speed);
 const presets=node('div','replay-speed-presets');for(const value of [25,33,50,75,100]){const b=node('button','replay-speed-preset');b.type='button';b.textContent=value+'%';b.dataset.speed=String(value);b.addEventListener('click',()=>{const range=speed.querySelector('input');if(range.disabled)return;setSpeed(value);});presets.append(b);}speed.prepend(presets);
 function paintSpeed(data){const range=speed.querySelector('input'),value=Number(data?.speed);if(data&&Number.isFinite(value)&&value>=10&&value<=100&&document.activeElement!==range){range.value=String(value);byId('speed-lbl').textContent=value+'%';}for(const b of presets.children){b.disabled=range.disabled;b.classList.toggle('vd-on',Number(b.dataset.speed)===Number(range.value));}}
 new MutationObserver(()=>paintSpeed()).observe(speed,{subtree:true,attributes:true,attributeFilter:['disabled','value']});speed.querySelector('input').addEventListener('input',()=>paintSpeed());if(typeof window.render==='function'){const previousRender=window.render;window.render=function(...args){const result=previousRender.apply(this,args);paintSpeed(args[0]);return result;};}paintSpeed();work.append(transport);
 const footer=node('footer','replay-console-footer'),air=document.querySelector('.bottom-air');footer.append(byId('replay-ready'),air,byId('message'));air.querySelector('.live').textContent='REPLAY NO AR';work.append(footer);
 const initial=byId('replay-events').querySelector('h2');if(initial)initial.hidden=true;
 showTab(selected);
})();
