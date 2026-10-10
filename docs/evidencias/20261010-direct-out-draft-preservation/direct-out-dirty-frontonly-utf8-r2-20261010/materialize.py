from pathlib import Path
import hashlib,difflib,json
R=Path(__file__).parent
old=(R/'BASELINE.js').read_bytes();assert hashlib.sha256(old).hexdigest()=='d5173ff3418b85b675e297c1b1b13db9837dec95fcac712b949792422548e706'
s=old.decode();before=s
def replace(a,b):
 global s
 assert s.count(a)==1,(a[:80],s.count(a));s=s.replace(a,b)
start=s.index('function directFields(');end=s.index('\nfunction renderRouting(',start)
replace(s[start:end],'''// One draft for the selected public source. No request is made by editing,
// discarding, polling or observing a different collection/source.
let directDraft=null,directOwner=null,directRevision=0,directConnectionEpoch=0,directWasOnline=false,directApplying=false;
function directOnline(){return E('connection').textContent==='Motor conectado';}
function directIdentity(){const source=E('direct-source').value,scope=state?.scope,routing=state?.routing;if(!directOnline()||!scope||!source||![...(routing?.sources||[]),...(routing?.buses||[])].some(s=>s.key===source))return null;return JSON.stringify([scope,source,directConnectionEpoch]);}
function directOwnerSync(){const online=directOnline();if(directWasOnline&&!online)directConnectionEpoch++;directWasOnline=online;const next=directIdentity();if(next!==directOwner){const changed=!!directDraft;directOwner=next;directDraft=null;directRevision++;if(changed)E('message').textContent='A produção, conexão ou fonte mudou. Ajustes pendentes de Direct Out descartados; nenhum comando novo enviado.';}return next;}
function directValues(){return{device:E('direct-device').value,volume:E('direct-volume').value,delayMs:E('direct-delay').value,enabled:E('direct-enabled').checked};}
function directButtons(){const cap=state?.routing?.capabilities||{};E('direct-save').disabled=busy||directApplying||!directIdentity()||(!directStopRequested()&&(!cap.directOut||cap.renderInventoryKnown!==true||!cap.renderDevices?.some(d=>d.id===E('direct-device').value)));const discard=E('direct-discard');if(discard)discard.disabled=busy||directApplying||!directDraft;}
function directFields(){directOwnerSync();const item=state?.routing?.directOut?.find(x=>x.key===E('direct-source').value),draft=directDraft?.owner===directOwner?directDraft.values:null,values=draft||{enabled:item?.enabled??false,volume:item?.volume??80,delayMs:item?.delayMs??0,device:item?.device||''};E('direct-enabled').checked=values.enabled;E('direct-volume').value=values.volume;E('direct-delay').value=values.delayMs;const cap=state?.routing?.capabilities||{};options(E('direct-device'),cap.renderDevices||[],values.device,true,cap.renderInventoryKnown!==true);directButtons();}
function directChanged(){if(!directOwnerSync()){E('message').textContent='Confira a conexão e selecione uma fonte antes de editar Direct Out.';directButtons();return;}directDraft={owner:directOwner,revision:++directRevision,values:directValues()};E('message').textContent='Ajustes de Direct Out pendentes. Aplicar confirma; Descarta ajustes não envia comandos.';directButtons();}
function directDiscard(){if(busy||directApplying)return;const hadDraft=!!directDraft;directDraft=null;directRevision++;directFields();if(hadDraft)E('message').textContent='Ajustes de Direct Out descartados; nenhum comando enviado.';}
async function directApply(){if(busy||directApplying||!directOwnerSync()){directButtons();return;}const owner=directOwner,revision=directRevision,source=E('direct-source').value,values=directValues();if(directIdentity()!==owner)return;if(!directDraft)directDraft={owner,revision,values};directApplying=true;try{const pending=routingCommand('audio_routing_direct',{key:source,device:values.device,volume:Number(values.volume),delayMs:Number(values.delayMs),enabled:values.enabled});directButtons();const confirmed=await pending;directOwnerSync();if(confirmed&&directOwner===owner&&directRevision===revision){directDraft=null;directRevision++;directFields();}else if(confirmed)E('message').textContent='Confirmação anterior recebida. O contexto ou os ajustes atuais não foram aplicados por esse comando.';}finally{directApplying=false;directButtons();}}
function directObserveConnection(){directOwnerSync();directButtons();}
const directOriginalPoll=poll;poll=async function(...args){try{return await directOriginalPoll(...args);}finally{directObserveConnection();}};''')
replace("Plugin carregado; nenhum driver ASIO instalado foi encontrado.","Consulta não retornou drivers ASIO. Atualize dispositivos; a lista não confirma funcionamento do driver.")
replace("function renderRouting(){const routing=state?.routing;if(!routing)return;const signature=JSON.stringify(routing);", "function renderRouting(){directOwnerSync();const routing=state?.routing;if(!routing)return;const signature=JSON.stringify([state?.scope,directConnectionEpoch,directOnline(),routing]);")
replace("async function routingCommand(action,data={}){if(busy)return;busy=true;try{", "async function routingCommand(action,data={}){if(busy)return false;busy=true;let confirmed=false;try{")
replace("routingSignature='';}catch(e)","routingSignature='';confirmed=true;}catch(e)")
replace("finally{busy=false;await poll(true);}}", "finally{busy=false;await poll(true);}return confirmed;}")
replace("E('direct-save').onclick=()=>routingCommand('audio_routing_direct',{key:E('direct-source').value,device:E('direct-device').value,volume:Number(E('direct-volume').value),delayMs:Number(E('direct-delay').value),enabled:E('direct-enabled').checked});", "E('direct-save').onclick=directApply;")
start=s.index("E('direct-enabled').addEventListener('change'");end=s.index("\nE('asio-output-console').addEventListener",start)
replace(s[start:end],'''for(const id of ['direct-enabled','direct-device','direct-volume','direct-delay']){E(id).addEventListener('input',directChanged);E(id).addEventListener('change',directChanged);}
const directDiscardButton=document.createElement('button');directDiscardButton.id='direct-discard';directDiscardButton.type='button';directDiscardButton.textContent='Descartar ajustes';directDiscardButton.disabled=true;directDiscardButton.onclick=directDiscard;E('direct-save').insertAdjacentElement('afterend',directDiscardButton);
E('asio-output-driver').addEventListener('change',renderAsioOutput);E('asio-device').addEventListener('change',()=>{const cap=state?.routing?.capabilities||{};E('asio-create').disabled=!cap.asio||cap.asioInventoryKnown!==true||!cap.asioDrivers?.some(d=>d.id===E('asio-device').value);});''')
(R/'DRAFT.js').write_bytes(s.encode())
(R/'direct-out-dirty.patch').write_text(''.join(difflib.unified_diff(before.splitlines(True),s.splitlines(True),fromfile='a/FreeMix/painel/remoto/audio-buses.js',tofile='b/FreeMix/painel/remoto/audio-buses.js')),encoding='utf-8',newline='\n')
(R/'PRODUCT-PIN.json').write_text(json.dumps({'path':'FreeMix/painel/remoto/audio-buses.js','baseline':hashlib.sha256(old).hexdigest(),'draft':hashlib.sha256(s.encode()).hexdigest(),'eol':'LF','nativeRuntime':False,'canonicalChanged':False},indent=2)+'\n',encoding='utf-8')
print('OFFSIDE one-file draft materialized')
