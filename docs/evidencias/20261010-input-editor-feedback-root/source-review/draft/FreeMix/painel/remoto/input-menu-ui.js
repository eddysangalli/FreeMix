// Presentation-only menu grouping. Existing buttons/attributes/handlers stay authoritative.
(() => {
 if(typeof renderPop!=='function')return;
 const kindLabel=kind=>({'dshow_input':'Câmera ou captura','wasapi_input_capture':'Microfone ou entrada de áudio','wasapi_output_capture':'Áudio do computador','browser_source':'Página web ou título','ffmpeg_source':'Arquivo ou fluxo de rede','image_source':'Imagem','color_source':'Cor','ndi_source':'Fonte NDI','omtsource':'Fonte OMT'}[kind]||'Fonte da entrada');
 const node=(tag,text,cls='')=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;if(tag==='details')n.addEventListener('toggle',()=>{if(st.pop==='menu'&&typeof placePop==='function')placePop();});return n;};
 function enhance(){
  const p=document.getElementById('pop');if(!p)return;p.classList.remove('input-menu-tasks');if(st.pop!=='menu')return;
  const old=p.querySelector('.menu');if(!old)return;p.classList.add('input-menu-tasks');
  const buttons=[...old.querySelectorAll('button[data-a]')],sources=window.FreeMixInputEditors.uniqueSources(st.items.get(st.popArg)||[]),body=node('div','','input-menu-body'),used=new Set();
  const place=(button,into,label)=>{if(!button)return;if(label)button.textContent=label;into.append(button);used.add(button);};
  const find=(a,v,key)=>buttons.find(b=>b.dataset.a===a&&(v===undefined||b.dataset.v===v)&&(!key||b.dataset.sourceKey===key));
  const ownAir=st.program===st.popArg||st.recursiveTally?.program?.includes(st.popArg);body.append(node('p',ownAir?'Entrada no ar. A configuração atua nesta entrada; retire do ar antes de excluir.':'Configuração desta entrada. As ações mantêm seus destinos identificados.','input-menu-hint'));
  const basic=node('div','','menu input-menu-basic');
  for(const s of sources)place(find('gcedit',s.name),basic,'Editar título: '+s.name);
  if(sources.length===1)place(find('props',sources[0].name,sources[0].key),basic,'Configurar: '+sources[0].name);
  place(find('layers'),basic,'Camadas e conteúdo da entrada…');place(find('minimizetoggle'),basic);body.append(basic);
  if(sources.length){
   const details=node('details','','input-menu-details'),summary=node('summary',sources.length>1?'Fontes desta entrada ('+sources.length+')':'Filtros e opções da fonte');details.append(summary,node('p','Cada fonte mantém sua configuração e filtros próprios. Configurar e Filtros abrem uma janela do motor; a mesa informa quando ela é observada.','input-menu-hint'));
   for(const s of sources){const section=node('section','','input-menu-source');section.append(node('h4',s.name),node('p',kindLabel(s.kind),'input-menu-hint'));const actions=node('div','','menu');if(sources.length>1)place(find('props',s.name,s.key),actions,'Configurar esta fonte…');place(find('filters',s.name,s.key),actions,'Filtros desta fonte…');place(find('calllink',s.name),actions,'Abrir Calls se esta fonte for uma chamada…');section.append(actions);details.append(section);}body.append(details);
  }else body.append(node('p','Esta entrada não tem fontes. Abra Camadas e conteúdo para montar sua imagem.','input-menu-hint'));
  const advanced=node('details','','input-menu-details');advanced.append(node('summary','Mais opções da entrada'));const advancedMenu=node('div','','menu');
  for(const action of ['audioadd','togglespeed','renameask','tag','projector'])place(find(action),advancedMenu,action==='togglespeed'?(st.showSpeed?.[st.popArg]?'Ocultar controle de velocidade':'Mostrar controle de velocidade'):undefined);
  const close=find('closeask');for(const b of buttons)if(!used.has(b)&&b!==close)place(b,advancedMenu);advanced.append(advancedMenu);body.append(advanced);
  if(close){const footer=node('div','','menu input-menu-footer');place(close,footer);body.append(footer);}
  old.replaceWith(body);if(typeof placePop==='function')placePop();
 }
 const original=renderPop;renderPop=function(...args){const result=original.apply(this,args);enhance();return result;};enhance();
})();
