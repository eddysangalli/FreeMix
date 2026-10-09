(()=>{
 const el=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));let selected='',revision='',mappingDirty=false;
 const sources=()=>window.FreeMixRemote?.getState().dataSources||[],current=()=>sources().find(s=>s.id===(el('data-source').value||selected));
 async function command(action,data={}){try{const result=await window.FreeMixRemote.command(action,data);render(true);return result;}catch{}}
 const options=()=>({name:el('data-name').value,scope:el('data-scope').value,format:el('data-format').value,delimiter:el('data-delimiter').value,sheet:el('data-sheet').value,jsonPath:el('data-path').value,intervalSeconds:Number(el('data-interval').value)});
 function render(force=false){const list=sources(),fingerprint=JSON.stringify([list,window.FreeMixRemote?.getState().sourceInputs,window.FreeMixRemote?.getState().inputs?.map(i=>[i.key,i.name])]);if(!force&&(fingerprint===revision||mappingDirty))return;if(document.activeElement?.dataset.cell)return;revision=fingerprint;
  const id=el('data-source').value||selected;el('data-source').innerHTML=list.map(s=>`<option value="${s.id}">${esc(s.name)} (${s.rowCount} linhas)</option>`).join('');if(list.some(s=>s.id===id))el('data-source').value=id;selected=el('data-source').value;
  const s=current();if(!s){el('data-status').textContent='Nenhuma tabela importada.';return;}el('data-status').textContent=s.error?'Erro: '+s.error:`${s.source} · atualizado ${new Date(s.updatedAt).toLocaleTimeString('pt-BR')}`;
  if(document.activeElement!==el('data-row'))el('data-row').value=s.selected+1;el('data-row').max=s.rowCount;el('data-preview').textContent=JSON.stringify(s.preview,null,2);
  const columns=Object.keys(s.rows[0]||{});el('data-table').innerHTML='<table><thead><tr><th>Linha</th>'+columns.map(c=>`<th>${esc(c)}</th>`).join('')+'</tr></thead><tbody>'+s.rows.map((r,i)=>`<tr><td>${i+1}</td>${columns.map(c=>`<td>${s.type==='manual'?`<input data-cell="${i}" data-column="${esc(c)}" value="${esc(r[c])}">`:esc(r[c])}</td>`).join('')}</tr>`).join('')+'</tbody></table>';
  if(!mappingDirty){el('data-kind').value=s.binding?.kind||'lower';el('data-auto').checked=!!s.binding?.autoPublish;renderMapping(s.binding?.mapping||{});}
 }
 function renderMapping(mapping={}){
 const columns=Object.keys(current()?.rows[0]||{}),kind=el('data-kind').value,fields=kind==='score'?['teamHome','teamAway','scoreHome','scoreAway','minutes','period']:kind==='person'?['title','subtitle','color','input','call']:kind==='lower'?['title','subtitle','color']:kind==='text'?['text']:kind==='inputName'?['name']:null;
 const labels={input:'Entrada (nome ou UUID)',call:'Call (nome, ID ou UUID)',title:'Nome',subtitle:'Cargo',color:'Cor',teamHome:'Casa',teamAway:'Visitante',scoreHome:'Pontos casa',scoreAway:'Pontos visitante',minutes:'Minutos',period:'Período',text:'Texto',name:'Nome da entrada'};
 el('data-add-mapping').hidden=!!fields;
 el('data-mapping').innerHTML=(fields||Object.keys(mapping).length&&Object.keys(mapping)||['nome']).map(f=>'<label>'+(fields?labels[f]:'<input data-field-name value="'+esc(f)+'" placeholder="Campo do template">')+'<select data-field="'+esc(f)+'"><option value="">Sem vínculo</option>'+columns.map(c=>'<option '+(mapping[f]===c?'selected':'')+' value="'+esc(c)+'">'+esc(c)+'</option>').join('')+'</select></label>').join('');
 const state=window.FreeMixRemote?.getState()||{},needs=['text','browser','inputName'].includes(kind);el('data-target-label').hidden=!needs;
 const inputs=kind==='inputName'?state.inputs||[]:(state.sourceInputs||[]).filter(s=>kind==='text'?/^text_(gdiplus|ft2)/.test(s.kind):s.kind==='browser_source');
 el('data-target').innerHTML='<option value="">Selecione</option>'+inputs.map(s=>'<option value="'+esc(s.key||s.inputUuid||s.sceneUuid||s.id)+'">'+esc(s.name||s.inputName||s.sceneName)+'</option>').join('');el('data-target').value=current()?.binding?.target||'';
 }
 el('data-import').onclick=()=>command('data_import',{...options(),text:el('data-text').value});
 el('data-upload').onchange=async e=>{const file=e.target.files[0];if(!file)return;if(file.size>5*1024*1024){el('message').textContent='Arquivo maior que 5 MB';return;}el('data-format').value=file.name.split('.').at(-1).toLowerCase();const bytes=new Uint8Array(await file.arrayBuffer());let binary='';for(let i=0;i<bytes.length;i+=32768)binary+=String.fromCharCode(...bytes.subarray(i,i+32768));await command('data_import',{...options(),base64:btoa(binary)});e.target.value='';};
 el('data-http').onclick=()=>command('data_http',{...options(),url:el('data-url').value});el('data-file').onclick=()=>command('data_file',{...options(),path:el('data-local').value});
 el('data-source').onchange=()=>{mappingDirty=false;render(true);};el('data-kind').onchange=()=>{mappingDirty=true;renderMapping();};el('data-mapping').onchange=()=>mappingDirty=true;el('data-auto').onchange=()=>mappingDirty=true;
 for(const [id,delta]of [['data-previous',-1],['data-next',1]])el(id).onclick=()=>{const s=current();if(s)command('data_select',{id:s.id,index:s.selected+delta});};el('data-select').onclick=()=>{const s=current();if(s)command('data_select',{id:s.id,index:Number(el('data-row').value)-1});};el('data-refresh').onclick=()=>{const s=current();if(s)command('data_refresh',{id:s.id});};
 el('data-table').onchange=e=>{const t=e.target,s=current();if(t.dataset.cell!==undefined&&s)command('data_edit',{id:s.id,row:Number(t.dataset.cell),column:t.dataset.column,value:t.value});};
 el('data-bind').onclick=async()=>{const s=current();if(!s)return;const mapping=Object.fromEntries([...el('data-mapping').querySelectorAll('select')].filter(e=>e.value).map(e=>[e.parentElement.querySelector('[data-field-name]')?.value||e.dataset.field,e.value]));const r=await command('data_bind',{id:s.id,kind:el('data-kind').value,mapping,target:el('data-target').value,autoPublish:el('data-auto').checked});if(r){mappingDirty=false;render(true);}};
 for(const [id,on]of [['data-publish',undefined],['data-on',true]])el(id).onclick=()=>{const s=current();if(s)command('data_publish',{id:s.id,on});};
 el('data-people').onclick=async()=>{mappingDirty=false;const before=new Set(sources().map(s=>s.id));await command('data_import',{name:el('data-name').value==='Tabela'?'Pessoas':el('data-name').value,scope:el('data-scope').value,format:'csv',text:'nome,cargo,input,call\nNovo convidado,,,'});selected=sources().find(s=>!before.has(s.id))?.id||selected;el('data-source').value=selected;render(true);};
 el('data-add-row').onclick=()=>{const s=current();if(s)command('data_append',{id:s.id,values:Object.fromEntries(Object.keys(s.rows[0]||{nome:''}).map(k=>[k,'']))});};
 el('data-delete-row').onclick=()=>{const s=current();if(s&&confirm('Excluir esta linha?'))command('data_remove_row',{id:s.id,row:s.selected});};
 el('data-delete').onclick=()=>{const s=current();if(s&&confirm('Excluir a tabela '+s.name+'?'))command('data_remove',{id:s.id});};
 el('data-move').onclick=()=>{const s=current();if(s)command('data_scope',{id:s.id,scope:s.scope==='global'?'project':'global'});};
 el('data-add-mapping').onclick=()=>{mappingDirty=true;const label=document.createElement('label');label.innerHTML='<input data-field-name placeholder="Campo"><select><option value="">Sem vínculo</option>'+Object.keys(current()?.rows[0]||{}).map(c=>'<option value="'+esc(c)+'">'+esc(c)+'</option>').join('')+'</select>';el('data-mapping').append(label);};
 el('data-target').onchange=()=>mappingDirty=true;el('data-mapping').oninput=()=>mappingDirty=true;
 setInterval(render,500);
})();
