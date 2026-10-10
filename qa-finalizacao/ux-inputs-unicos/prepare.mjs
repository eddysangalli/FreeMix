import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
const root=path.resolve('D:/DRIVE/IA/antigravity/vmixtwste'),out=path.join(root,'qa-finalizacao/ux-inputs-unicos');
const pins=[];
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
async function read(p){const b=await fs.readFile(path.join(root,p));pins.push({path:p,sha256:sha(b),bytes:b.length});await fs.mkdir(path.join(out,'before',path.dirname(p)),{recursive:true});await fs.writeFile(path.join(out,'before',p),b);return b.toString('utf8');}
function replace(s,a,b){if(s.split(a).length!==2)throw Error('Expected exactly one anchored insertion');return s.replace(a,b);}
async function write(p,s){await fs.mkdir(path.join(out,'draft',path.dirname(p)),{recursive:true});await fs.writeFile(path.join(out,'draft',p),s);const r=spawnSync('git',['-c','core.autocrlf=false','diff','--no-index','--','before/'+p,'draft/'+p],{cwd:out,encoding:'utf8'});if(![0,1].includes(r.status))throw Error(r.stderr);await fs.writeFile(path.join(out,path.basename(p)+'.patch'),r.stdout.replaceAll('a/before/','a/').replaceAll('b/draft/','b/'));}
let mesa=await read('obs-vmix/painel/mesa.html');const nl=mesa.includes('\r\n')?'\r\n':'\n';
const helpers=`  let creatingInput = false;
  function markInputCreating(active) {
    for (const el of $('pop').querySelectorAll('input,select,button')) {
      if (active) { if (el.dataset.inputWasDisabled === undefined) el.dataset.inputWasDisabled = el.disabled ? '1' : '0'; el.disabled = true; }
      else if (el.dataset.inputWasDisabled !== undefined) { el.disabled = el.dataset.inputWasDisabled === '1'; delete el.dataset.inputWasDisabled; }
    }
    $('pop').setAttribute('aria-busy', String(active));
  }
  async function finishInputPanel(editor = '', inputName = '') {
    if (location.protocol === 'file:' && new URLSearchParams(location.search).has('pop')) {
      const r = await req('CallVendorRequest', {vendorName:'freemix', requestType:'finish_input_panel', requestData:{url:location.href, editor, inputName}});
      if (!r.responseData?.success) throw Error(r.responseData?.error || 'A entrada foi criada. Feche esta janela e abra sua engrenagem para configurar o dispositivo.');
      return;
    }
    if (editor) await req(editor === 'filters' ? 'OpenInputFiltersDialog' : 'OpenInputPropertiesDialog', {inputName});
    if (new URLSearchParams(location.search).has('pop')) window.close(); else closePop();
  }
`;
mesa=replace(mesa,'  const A = {',helpers.replaceAll('\n',nl)+'  const A = {');
const start=mesa.indexOf('    add: () => run((async () => {'),end=mesa.indexOf('    menu: (d) =>',start);if(start<0||end<0)throw Error('Missing add handler');
let add=mesa.slice(start,end);
add=replace(add,'    add: () => run((async () => {','    add: () => { if (creatingInput) return; return run((async () => {');
add=replace(add,'      const w = st.video?',`      creatingInput = true; markInputCreating(true); const created = []; let pendingScene = ''; let complete = false;
      try {
      const w = st.video?`.replaceAll('\n',nl));
add=replace(add,'        await req("CreateScene", { sceneName: name });','        await req("CreateScene", { sceneName: name }); pendingScene = name;');
add=replace(add,'        if (!kind) continue;','        if (!kind) { created.push(name); pendingScene = \'\'; continue; }');
add=replace(add,'        await tryReq("SetSceneItemTransform",','        created.push(name); pendingScene = \'\';'+nl+'        await tryReq("SetSceneItemTransform",');
const tailStart=add.indexOf('      closePop(); st.addName = "";');
add=add.slice(0,tailStart)+`      complete = true; st.addName = '';
      if (t.id === 'call') { st.callId = ''; await launchPanel('calls'); await finishInputPanel(); return; }
      if (!kind) { toast('Entrada vazia criada. Monte as camadas pela engrenagem.'); await finishInputPanel(); return; }
      if (!t.fields && n === 1) await finishInputPanel('properties', last);
      else { if (n > 1 && !t.fields) toast(n + ' entradas criadas. Use a engrenagem de cada uma para escolher o dispositivo.'); await finishInputPanel(); }
      } catch (error) {
        const kept = [...created, ...(pendingScene ? [pendingScene + ' (cena sem fonte confirmada)'] : [])];
        const note = kept.length ? ' Preservado na mesa: ' + kept.join(', ') + '. Confira antes de tentar novamente.' : '';
        throw Error((complete ? 'Entrada criada; a próxima janela não foi confirmada. ' : '') + error.message + note);
      } finally { creatingInput = false; markInputCreating(false); }
    })()); },
`.replaceAll('\n',nl);
mesa=mesa.slice(0,start)+add+mesa.slice(end);
mesa=replace(mesa,'close: () => {if(new URLSearchParams(location.search).has(\'pop\'))window.close();else closePop();}',"close: () => { if (creatingInput) return; if (new URLSearchParams(location.search).has('pop')) run(finishInputPanel()); else closePop(); }");
mesa=replace(mesa,'if (e.key === "Escape") return closePop();','if (e.key === "Escape") { if (creatingInput) { e.preventDefault(); return; } return A.close(); }');
mesa=replace(mesa,'if (e.key === "Enter" && st.pop === "add") return A.add();','if (e.key === "Enter" && st.pop === "add") { e.preventDefault(); return A.add(); }');
await write('obs-vmix/painel/mesa.html',mesa);
let main=await read('freemix-app/frontend/widgets/OBSBasic_MainControls.cpp');const mn=main.includes('\r\n')?'\r\n':'\n';
main=replace(main,'#include <QDesktopServices>','#include <QDesktopServices>'+mn+'#include <QApplication>'+mn+'#include <QPointer>'+mn+'#include <QWindow>');
main=replace(main,'void OBSBasic::CreatePropertiesWindow(obs_source_t *source)',`// Keep OBSBasic as QObject owner; only the transient native window follows the requesting panel.
static void FreeMixRaiseInputDialog(QWidget *dialog, QWidget *main, const QPointer<QWidget> &requester)
{
    if (requester && requester != dialog && requester->isWindow() &&
        (requester == main || main->isAncestorOf(requester)) && dialog->windowHandle() && requester->windowHandle())
        dialog->windowHandle()->setTransientParent(requester->windowHandle());
    dialog->raise();
    dialog->activateWindow();
}

void OBSBasic::CreatePropertiesWindow(obs_source_t *source)`.replaceAll('\n',mn));
for(const[k,type]of [['properties','OBSBasicProperties'],['filters','OBSBasicFilters']]){
 main=replace(main,`void OBSBasic::Create${k==='properties'?'Properties':'Filters'}Window(obs_source_t *source)${mn}{`, `void OBSBasic::Create${k==='properties'?'Properties':'Filters'}Window(obs_source_t *source)${mn}{${mn}\tconst QPointer<QWidget> requester = QApplication::activeWindow();`);
 main=replace(main,`${k}->setAttribute(Qt::WA_DeleteOnClose, true);`,`${k}->setAttribute(Qt::WA_DeleteOnClose, true);${mn}\tFreeMixRaiseInputDialog(${k}, this, requester);`);
}
await write('freemix-app/frontend/widgets/OBSBasic_MainControls.cpp',main);
let multi=await read('freemix-app/frontend/widgets/FreeMixMultistream.cpp');const nn=multi.includes('\r\n')?'\r\n':'\n';
const finish=`// UI handoff: validate first; closing a CEF page must not require a second request from that page.
void RequestFinishInputPanel(obs_data_t *request, obs_data_t *response, void *)
{
 const std::string key = obs_data_get_string(request, "url");
 const std::string editor = obs_data_get_string(request, "editor");
 const std::string name = obs_data_get_string(request, "inputName");
 QMetaObject::invokeMethod(OBSBasic::Get(), [key, editor, name, response]() {
  auto *main = OBSBasic::Get();
  if (!main || main->isClosing() || frontendClosing || panelDeletionDepth) { obs_data_set_bool(response,"success",false); obs_data_set_string(response,"error","O FreeMix está encerrando ou fechando outra janela. Tente novamente."); return; }
  if (!editor.empty() && editor != "properties" && editor != "filters") { obs_data_set_bool(response,"success",false); obs_data_set_string(response,"error","Editor de entrada inválido."); return; }
  const auto found = panelWindows.find(key);
  const QPointer<QDialog> panel = found == panelWindows.end() ? nullptr : found->second;
  OBSSourceAutoRelease retained = editor.empty() ? nullptr : obs_get_source_by_name(name.c_str());
  OBSSource source(retained);
  if (!panel || (!editor.empty() && (!source || obs_source_removed(source)))) { obs_data_set_bool(response,"success",false); obs_data_set_string(response,"error","Janela ou entrada não encontrada. A mesa foi preservada."); return; }
  const QPointer<OBSBasic> owner = main;
  QTimer::singleShot(0, main, [owner, panel, editor, source]() {
   if (!owner || owner->isClosing() || frontendClosing || !panel) return;
   if (!panel->close()) { blog(LOG_WARNING,"FreeMix input handoff: panel refused close; input preserved"); return; }
   if (editor.empty()) return;
   // Wait for the existing cooperative CEF destructor, including its nested Qt event loops.
   auto *timer = new QTimer(owner);
   timer->setInterval(25);
   QObject::connect(timer, &QTimer::timeout, owner, [owner, panel, editor, source, timer, tries=0]() mutable {
    if (!owner || owner->isClosing() || frontendClosing || ++tries > 160 || obs_source_removed(source)) { blog(LOG_WARNING,"FreeMix input handoff cancelled or timed out; input preserved"); timer->stop(); timer->deleteLater(); return; }
    if (panel || panelDeletionDepth) return;
    timer->stop(); timer->deleteLater();
    if (editor == "properties") owner->CreatePropertiesWindow(source);
    else owner->CreateFiltersWindow(source);
   });
   timer->start();
  });
  obs_data_set_bool(response,"success",true); obs_data_set_bool(response,"queued",true);
 }, Qt::BlockingQueuedConnection);
}

`;
multi=replace(multi,'void RequestClosePanel(obs_data_t *request, obs_data_t *response, void *)',finish.replaceAll('\n',nn)+'void RequestClosePanel(obs_data_t *request, obs_data_t *response, void *)');
multi=replace(multi,'obs_websocket_vendor_register_request(vendor, "close_panel", RequestClosePanel, nullptr);','obs_websocket_vendor_register_request(vendor, "close_panel", RequestClosePanel, nullptr);'+nn+' obs_websocket_vendor_register_request(vendor, "finish_input_panel", RequestFinishInputPanel, nullptr);');
await write('freemix-app/frontend/widgets/FreeMixMultistream.cpp',multi);
await fs.writeFile(path.join(out,'base-pins.json'),JSON.stringify({created:new Date().toISOString(),mode:'DRAFT_ONLY',pins},null,2)+'\n');
