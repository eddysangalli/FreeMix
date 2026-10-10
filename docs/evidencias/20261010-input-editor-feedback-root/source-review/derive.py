from pathlib import Path
import hashlib,json,difflib
base=Path(__file__).resolve().parent
root=base.parents[1]
paths=['FreeMix/painel/mesa.html','FreeMix/painel/remoto/input-menu-ui.js','freemix-app/frontend/widgets/OBSBasic_MainControls.cpp','freemix-app/frontend/widgets/FreeMixMultistream.cpp','freemix-app/plugins/obs-websocket/src/requesthandler/RequestHandler_Ui.cpp','freemix-app/plugins/obs-websocket/src/utils/Obs_ArrayHelper.cpp','FreeMix/ferramentas/controle-producao.mjs']
pins=[]
for rel in paths:
 p=root/rel;b=p.read_bytes();pins.append({'path':rel,'sha256':hashlib.sha256(b).hexdigest(),'bytes':len(b)})
 (base/'baseline'/rel).parent.mkdir(parents=True,exist_ok=True);(base/'baseline'/rel).write_bytes(b)
(base/'BASELINE.json').write_text(json.dumps(pins,indent=2)+'\n',encoding='utf8')
rel=paths[0];original=(root/rel).read_bytes();text=original.decode('utf8').replace('\r\n','\n')
def replace(a,b,count=1):
 global text
 assert text.count(a)==count,(a[:90],text.count(a),count)
 text=text.replace(a,b)
replace('({ name: i.sourceName, kind: i.inputKind })','({ name: i.sourceName, kind: i.inputKind, key: i.sourceUuid })')
replace('  <div class="toast" id="toast"></div>', '''  <div id="input-editor-status" role="status" hidden style="position:fixed;bottom:46px;left:12px;right:12px;z-index:1999;background:#27313c;color:white;padding:8px;border:1px solid #8aa1b7"><span id="input-editor-message"></span> <button data-a="editorcheck">Conferir janela</button> <button data-a="editorrelease">Liberar controle sem repetir</button> <button data-a="editordismiss">Ocultar aviso</button></div>
  <div class="toast" id="toast"></div>''')
integration='''  let inputEditorController;
  const editorContext=()=>({on:st.on&&!mesaDisposed,scope:st.preset,connection:ws,sceneKeys:st.sceneKeys,items:st.items});
  const sceneButtonIdentity=d=>window.FreeMixInputEditors?.sceneMatches(editorContext(),{owner:d.v,ownerKey:d.ownerKey,scope:d.scope});
  const sceneButtonAttrs=n=>`data-owner-key="${esc(st.sceneKeys[n]||'')}" data-scope="${esc(st.preset||'')}"`;
  function editorController(){
    if(inputEditorController)return inputEditorController;
    inputEditorController=window.FreeMixInputEditors.create({context:editorContext,request:(type,data)=>req(type,data),publish:s=>{
      const region=$('input-editor-status');region.hidden=false;$('input-editor-message').textContent=(s.sourceName?s.sourceName+': ':'')+s.message;
      for(const a of ['editorcheck','editorrelease'])region.querySelector(`[data-a="${a}"]`).hidden=!s.pending;
      region.querySelector('[data-a="editordismiss"]').hidden=s.pending;
    }});return inputEditorController;
  }
  function openInputEditor(d,kind){
    const target={kind,key:d.sourceKey,name:d.v,owner:d.owner,ownerKey:d.ownerKey,scope:d.scope};
    closePop();run(editorController().open(target));
  }

'''
replace('  const run = (p) => p?.catch?.((e) => toast(e.message, true));', '  const run = (p) => p?.catch?.((e) => toast(e.message, true));\n'+integration)
replace('props: (d) => { closePop(); run(req("OpenInputPropertiesDialog", { inputName: d.v })); },','props: (d) => openInputEditor(d,"properties"),')
replace('filters: (d) => { closePop(); run(req("OpenInputFiltersDialog", { inputName: d.v })); },','filters: (d) => openInputEditor(d,"filters"),\n    editorcheck:()=>run(editorController().observe()),\n    editorrelease:()=>editorController().abandon(),\n    editordismiss:()=>{if(!inputEditorController?.pending())$("input-editor-status").hidden=true;},')
replace('closeask: (d) => {if(st.locked)return A.lockmsg();st.closeTarget={key:st.sceneKeys[d.v],name:d.v,scope:st.preset};openPop("close",d.v);},','closeask: (d) => {if(st.locked)return A.lockmsg();if(!sceneButtonIdentity(d))return toast("Esta entrada mudou. Abra a confirmação novamente.",true);st.closeTarget={key:d.ownerKey,name:d.v,scope:d.scope};openPop("close",d.v);},')
replace('minimizetoggle: (d) => {\n      st.minimized', 'minimizetoggle: (d) => {\n      if(!sceneButtonIdentity(d))return toast("Esta entrada mudou. Atualize o cartão antes de recolher.",true);\n      st.minimized')
# Keep collapse itself local: only add explicit feedback inside its exact body.
replace('store.set("mesa.minimized", st.minimized); renderTiles();\n      if (st.pop === "menu") renderPop();','store.set("mesa.minimized", st.minimized); renderTiles();\n      if (st.pop === "menu") renderPop();\n      toast(st.minimized[d.v]?"Cartão recolhido. A entrada continua no motor.":"Cartão expandido.");')
for action,count in [('minimizetoggle',3),('closeask',3)]:
 a=f'data-a="{action}" data-v="${{v}}"';replace(a,a+' ${sceneButtonAttrs('+('name' if action=='minimizetoggle' else 'name')+')}',count)
replace('Clique para restaurar entrada ${v}','Clique para expandir o cartão ${v}')
replace('title="Minimizar entrada"','title="Recolher cartão; mantém a entrada no motor"')
replace('title="Fechar esta entrada"','title="Excluir entrada do projeto"')
replace('title="Remove esta entrada">Close','title="Excluir entrada do projeto">Excluir')
replace('title="Está no ar: tire do programa antes de fechar">Close','title="Está no ar: tire do programa antes de excluir">Excluir')
replace('Expandir entrada" : "Minimizar entrada','Expandir cartão" : "Recolher cartão')
replace('>Fechar entrada</button>', '>Excluir entrada</button>',2)
replace('<h3>Fechar "${esc(st.popArg)}"?</h3>','<h3>Excluir "${esc(st.popArg)}" do projeto?</h3>')
replace('ins = st.items.get(name) || [];','ins = window.FreeMixInputEditors.uniqueSources(st.items.get(name) || []);')
for a in ['props','filters']:
 old=f'data-a="{a}" data-v="${{esc(i.name)}}"'
 replace(old,old+' data-source-key="${esc(i.key||\'\')}" data-owner="${v}" ${sceneButtonAttrs(name)}')
replace("button.setAttribute('data-a', 'closeask'); button.setAttribute('data-v', name); button.title = 'Fechar esta entrada';", "button.setAttribute('data-a', 'closeask'); button.setAttribute('data-v', name); button.title = 'Excluir entrada do projeto';")
replace("      const audio = tile.querySelector('[data-role=\"input-audio\"]');", "      for(const b of tile.querySelectorAll('[data-a=\"closeask\"],[data-a=\"minimizetoggle\"]')){b.dataset.ownerKey=st.sceneKeys[name]||'';b.dataset.scope=st.preset||'';}\n      const audio = tile.querySelector('[data-role=\"input-audio\"]');")
replace('<script src="remoto/input-menu-ui.js"></script>','<script src="remoto/input-editor-feedback.js"></script>\n<script src="remoto/input-menu-ui.js"></script>')
# Normalize only the draft to the canonical CRLF convention.
text=text.replace('\r\n','\n').replace('\n','\r\n')
draft=base/'draft'/rel;draft.parent.mkdir(parents=True,exist_ok=True);draft.write_bytes(text.encode('utf8'))
rel=paths[1];a=(root/rel).read_text(encoding='utf8');b=a.replace('sources=st.items.get(st.popArg)||[]','sources=window.FreeMixInputEditors.uniqueSources(st.items.get(st.popArg)||[])').replace('Cada fonte mantém sua configuração e filtros próprios.','Cada fonte mantém sua configuração e filtros próprios. Configurar e Filtros abrem uma janela do motor; a mesa informa quando ela é observada.');assert b!=a
b=b.replace("const find=(a,v)=>buttons.find(b=>b.dataset.a===a&&(v===undefined||b.dataset.v===v));","const find=(a,v,key)=>buttons.find(b=>b.dataset.a===a&&(v===undefined||b.dataset.v===v)&&(!key||b.dataset.sourceKey===key));")
b=b.replace("find('props',sources[0].name)","find('props',sources[0].name,sources[0].key)").replace("find('props',s.name)","find('props',s.name,s.key)").replace("find('filters',s.name)","find('filters',s.name,s.key)")
draft=base/'draft'/rel;draft.parent.mkdir(parents=True,exist_ok=True);draft.write_bytes(b.replace('\r\n','\n').replace('\n','\r\n').encode('utf8'))
new=base/'draft/FreeMix/painel/remoto/input-editor-feedback.js';new.write_bytes((base/'input-editor-feedback.js').read_bytes())
patch=''
for rel in paths[:2]:
 a=(base/'baseline'/rel).read_text(encoding='utf8').splitlines(True);b=(base/'draft'/rel).read_text(encoding='utf8').splitlines(True);patch+=''.join(difflib.unified_diff(a,b,fromfile='a/'+rel,tofile='b/'+rel))
(base/'input-editor-feedback.patch').write_text(patch,encoding='utf8',newline='\n')
