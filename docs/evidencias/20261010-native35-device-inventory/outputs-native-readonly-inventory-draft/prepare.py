from pathlib import Path
import json,hashlib,difflib
OWN=Path(__file__).resolve().parent;ROOT=OWN.parents[1]
H=lambda b:hashlib.sha256(b).hexdigest()
targets={
 'FreeMixVideoTransports.hpp':'freemix-app/frontend/widgets/FreeMixVideoTransports.hpp',
 'FreeMixSdiOutput.hpp':'freemix-app/frontend/widgets/FreeMixSdiOutput.hpp',
 'FreeMixMultistream.cpp':'freemix-app/frontend/widgets/FreeMixMultistream.cpp',
 'saidas-producao.mjs':'FreeMix/ferramentas/saidas-producao.mjs',
 'saidas.js':'FreeMix/painel/remoto/saidas.js',
 'saidas-sdi-hdr-ui.js':'FreeMix/painel/remoto/saidas-sdi-hdr-ui.js'}
base={n:(OWN/'input'/n).read_bytes() for n in targets}
for n,p in targets.items():assert (ROOT/p).read_bytes()==base[n],p
text={n:b.decode('utf8') for n,b in base.items()}
head='''// Read-only cached DeckLink metadata. Driver properties are explicit operations.
#pragma once
#include <obs.hpp>
#include <obs-properties.h>
#include <string>
#include <mutex>
#include <cstdint>

namespace freemix_transport_inventory {
struct Cache { std::mutex mutex; std::string decklinkJson; uint64_t revision=0; bool probeFailed=false; };
inline Cache &Store(){static Cache value;return value;}
inline bool Registered(){const char *id=nullptr;for(size_t n=0;obs_enum_output_types(n,&id);++n)if(id&&std::string(id)=="decklink_output")return true;return false;}
inline uint64_t Revision(){auto &cache=Store();std::lock_guard<std::mutex> lock(cache.mutex);return cache.revision;}
inline bool Publish(obs_data_t *decklink,bool complete,uint64_t expectedRevision){
 // Copy owned JSON before locking; no OBS objects or driver callbacks survive.
 const std::string json=complete?obs_data_get_json(decklink):"";
 auto &cache=Store();std::lock_guard<std::mutex> lock(cache.mutex);
 if(cache.revision!=expectedRevision)return false; // reentrant context reset/another probe
 if(complete)cache.decklinkJson=json;
 cache.probeFailed=!complete;++cache.revision;return true;
}
}
inline void FreeMixResetVideoTransportInventory(){
 auto &cache=freemix_transport_inventory::Store();std::lock_guard<std::mutex> lock(cache.mutex);
 cache.decklinkJson.clear();cache.probeFailed=false;++cache.revision;
}
inline OBSDataAutoRelease FreeMixVideoTransports(){
 std::string json;uint64_t revision;bool failed;
 {auto &cache=freemix_transport_inventory::Store();std::lock_guard<std::mutex> lock(cache.mutex);json=cache.decklinkJson;revision=cache.revision;failed=cache.probeFailed;}
 OBSDataAutoRelease result=obs_data_create(),decklink=json.empty()?obs_data_create():obs_data_create_from_json(json.c_str());
 const bool known=!json.empty()&&decklink;if(!decklink)decklink=obs_data_create();
 const bool loaded=freemix_transport_inventory::Registered();obs_video_info info={};
 const bool matches=known&&obs_get_video_info(&info)&&obs_data_get_int(decklink,"inventoryFpsNum")==info.fps_num&&obs_data_get_int(decklink,"inventoryFpsDen")==info.fps_den;
 if(!known){OBSDataArrayAutoRelease empty=obs_data_array_create();obs_data_set_array(decklink,"devices",empty);obs_data_set_bool(decklink,"hardwareAvailable",false);obs_data_set_bool(decklink,"hdrOutputImplemented",false);}
 obs_data_set_bool(decklink,"pluginLoaded",loaded);obs_data_set_string(decklink,"outputId","decklink_output");obs_data_set_string(decklink,"configuration","native-tools-decklink");
 obs_data_set_bool(decklink,"inventoryKnown",known);obs_data_set_bool(decklink,"hardwareAvailabilityKnown",known);obs_data_set_bool(decklink,"hdrImplementationKnown",known);
 obs_data_set_int(decklink,"inventoryRevision",(long long)revision);obs_data_set_bool(decklink,"inventoryProbeFailed",failed);
 obs_data_set_bool(decklink,"inventoryMatchesVideoSettings",matches);obs_data_set_bool(decklink,"inventorySnapshotUsable",known&&loaded&&!failed&&matches);
 obs_data_set_string(decklink,"inventoryStatus",failed?(known?"probe-failed-cached":"probe-failed-unknown"):known?"cached":"unknown");
 obs_data_set_bool(decklink,"inventoryRequiresExplicitRefresh",true);obs_data_set_string(decklink,"inventoryFreshness","last-explicit-probe-not-hotplug-observation");
 obs_data_set_string(decklink,"hdrStatus","requires_explicit_driver_preflight");obs_data_set_bool(decklink,"hdrSupported",false);obs_data_set_bool(decklink,"hdrPhysicalVerified",false);
 obs_data_set_obj(result,"decklink",decklink);obs_data_set_int(result,"networkPrecisionBits",8);obs_data_set_string(result,"networkColorSpace","BT709 SDR");
 obs_data_set_bool(result,"networkHdrSupported",false);obs_data_set_bool(result,"networkHighPrecisionAlpha",false);return result;
}

// Call only from an explicit GUI-thread SDI refresh/configure/preflight/start.
inline OBSDataAutoRelease FreeMixRefreshVideoTransportInventory()
{
 OBSDataAutoRelease decklink=obs_data_create();
 const uint64_t expectedRevision=freemix_transport_inventory::Revision();
 const bool loaded=freemix_transport_inventory::Registered();
'''
old=text['FreeMixVideoTransports.hpp']
body=old[old.index(' OBSDataArrayAutoRelease devices='):old.index(' obs_data_set_obj(result,"decklink",decklink);')]
body=body.replace(' // decklink_output_properties explicitly ignores context (original OBS source).',' // This explicit action queries real driver metadata; it is not a read/poll.')
body=body.replace(' if(props)obs_properties_destroy(props);',' const bool complete=loaded&&props&&list;\n if(props)obs_properties_destroy(props);')
tail=''' obs_video_info info={};if(obs_get_video_info(&info)){obs_data_set_int(decklink,"inventoryFpsNum",info.fps_num);obs_data_set_int(decklink,"inventoryFpsDen",info.fps_den);}
 const bool accepted=freemix_transport_inventory::Publish(decklink,complete,expectedRevision);
 OBSDataAutoRelease result=FreeMixVideoTransports(),snapshot=obs_data_get_obj(result,"decklink");obs_data_set_bool(snapshot,"inventoryProbeAccepted",complete&&accepted);
 return result;
}
'''
text['FreeMixVideoTransports.hpp']=head+body+tail
def once(n,a,b):
 assert text[n].count(a)==1,(n,a)
 text[n]=text[n].replace(a,b)
once('FreeMixSdiOutput.hpp','OBSDataAutoRelease transports=FreeMixVideoTransports(),deck=obs_data_get_obj(transports,"decklink");','OBSDataAutoRelease transports=FreeMixRefreshVideoTransportInventory(),deck=obs_data_get_obj(transports,"decklink");')
once('FreeMixSdiOutput.hpp','else if(!valid)error="Dispositivo, modo FPS ou keyer SDI não anunciado pelo driver";', 'else if(!obs_data_get_bool(deck,"inventorySnapshotUsable")||!obs_data_get_bool(deck,"inventoryProbeAccepted"))error="Inventário SDI desconhecido, contexto alterado ou sondagem inconclusiva; consulte placas e modos explicitamente";\n   else if(!valid)error="Dispositivo, modo FPS ou keyer SDI não anunciado pelo driver";')
once('FreeMixSdiOutput.hpp','}else if(action=="preflight"){OBSDataAutoRelease proposed=obs_data_get_obj(request,"config");auto *c=proposed?proposed.Get():config.Get();if(!obs_data_get_bool(c,"hdr"))error="Preflight HDR requer HDR habilitado";else error=HdrPreflight(c,isPrivate,hdrProof);', '''}else if(action=="refresh"){
  if(active)error="Pare SDI antes de consultar placas e modos";
  else{OBSDataAutoRelease transports=FreeMixRefreshVideoTransportInventory(),deck=obs_data_get_obj(transports,"decklink");if(!obs_data_get_bool(deck,"inventorySnapshotUsable")||!obs_data_get_bool(deck,"inventoryProbeAccepted"))error="Sondagem SDI inconclusiva ou contexto alterado; inventário não confirmado";}
 }else if(action=="preflight"){OBSDataAutoRelease proposed=obs_data_get_obj(request,"config");auto *c=proposed?proposed.Get():config.Get();
  if(active)error="Pare SDI antes de verificar fonte e driver";
  else if(!obs_data_get_bool(c,"hdr"))error="Preflight HDR requer HDR habilitado";
  else{OBSDataAutoRelease transports=FreeMixRefreshVideoTransportInventory(),deck=obs_data_get_obj(transports,"decklink");if(!obs_data_get_bool(deck,"inventorySnapshotUsable")||!obs_data_get_bool(deck,"inventoryProbeAccepted"))error="Inventário SDI desconhecido, contexto alterado ou sondagem inconclusiva";else error=HdrPreflight(c,isPrivate,hdrProof);}''')
once('FreeMixMultistream.cpp','networkOutputs.clear();networkMedia.clear();freemix_sdi::Stop();','networkOutputs.clear();networkMedia.clear();freemix_sdi::Stop();\n FreeMixResetVideoTransportInventory(); // metadata only; profile/collection/exit invalidate, never scan')
once('saidas-producao.mjs',"['configure','preflight','start','stop','state'].includes(d.command)","['configure','preflight','start','stop','state','refresh'].includes(d.command)")
once('saidas.js',"(d.hardwareAvailable?d.devices.map", "(!d.inventoryKnown?'inventário não consultado':!d.inventorySnapshotUsable?'inventário em cache; consulte placas e modos':d.hardwareAvailable?d.devices.map")
lines=text['saidas.js'].splitlines(True)
new_sdi='''function paintSdi(){const state=outputs?.sdi||{},deck=state.capabilities?.decklink||{},devices=deck.devices||[],device=E('sdi-device'),signature=JSON.stringify([devices,deck.inventoryKnown,deck.inventorySnapshotUsable]);
 if(!E('sdi-refresh')){const button=document.createElement('button');button.id='sdi-refresh';button.type='button';button.textContent='Consultar placas e modos';E('sdi-status').before(button);button.onclick=()=>cmd('outputs_sdi',{command:'refresh'}).catch(()=>{});}
 if(device.dataset.signature!==signature){const old=device.dataset.initialized?device.value:String(state.config?.deviceHash||'');device.dataset.initialized='true';device.dataset.signature=signature;device.innerHTML='<option value="">Selecione uma placa</option>'+devices.map(d=>'<option value="'+esc(d.hash)+'">'+esc(d.name)+'</option>').join('');if(old&&!devices.some(d=>d.hash===old)){const option=new Option('Placa salva/selecionada não confirmada',old);option.disabled=true;device.add(option);}device.value=old;paintSdiModes();}
 const list=E('sdi-source'),sources=FreeMixRemote.getState().inputs||[],sig=JSON.stringify(sources.map(i=>[i.key,i.name]));if(list.dataset.signature!==sig){list.dataset.signature=sig;const old=list.value;list.innerHTML='<option value="">Programa principal</option>'+sources.map(i=>'<option value="'+esc(i.key)+'">'+esc(i.name)+'</option>').join('');list.value=old;}
 const selected=devices.find(d=>d.hash===device.value),mode=E('sdi-mode').value,keyer=E('sdi-keyer').value,valid=!!deck.inventorySnapshotUsable&&!!selected&&mode!==''&&keyer!==''&&selected.modes?.some(m=>String(m.value)===mode)&&selected.keyers?.some(k=>String(k.value)===keyer);
 for(const id of ['sdi-configure','sdi-start'])E(id).disabled=!valid||!!state.active;E('sdi-stop').disabled=!state.active;E('sdi-refresh').disabled=!!state.active;
 E('sdi-status').textContent=state.active?'SDI ATIVO':!deck.inventoryKnown?'Inventário SDI não consultado · clique Consultar placas e modos':!deck.inventorySnapshotUsable?'Último inventário em cache; consulte novamente antes de configurar':devices.length?'SDI parado · último inventário consultado; configurar/iniciar revalidam o driver':'Consulta concluída: nenhuma placa anunciada pelo driver';E('network-precision').options[1].disabled=!outputs?.omt?.pa16Supported||E('network-mode').value!=='source';}
'''
new_modes='''function paintSdiModes(){const hash=E('sdi-device').value,d=outputs?.sdi?.capabilities?.decklink?.devices?.find(d=>d.hash===hash),config=outputs?.sdi?.config||{};for(const[key,id,field]of [['modes','sdi-mode','modeId'],['keyers','sdi-keyer','keyer']]){const el=E(id),same=el.dataset.device===hash,old=same&&el.dataset.initialized?el.value:!el.dataset.initialized&&config.deviceHash===hash?String(config[field]??''):'';el.dataset.initialized='true';el.dataset.device=hash;el.innerHTML='<option value="">Selecione '+(key==='modes'?'modo':'keyer')+'</option>'+(d?.[key]||[]).map(v=>'<option value="'+v.value+'">'+esc(v.name)+'</option>').join('');if(old&&!(d?.[key]||[]).some(v=>String(v.value)===old)){const option=new Option('Seleção não confirmada no inventário',old);option.disabled=true;el.add(option);}el.value=old;}}
'''
for i,line in enumerate(lines):
 if line.startswith('function paintSdi(){'):lines[i]=new_sdi
 elif line.startswith('function paintSdiModes(){'):lines[i]=new_modes
text['saidas.js']=''.join(lines)
# Existing readonly poll paints status. Repaint valid mode controls after explicit selection.
once('saidas.js',"E('sdi-device').onchange=paintSdiModes;", "E('sdi-device').onchange=()=>{paintSdiModes();paintSdi();};for(const id of ['sdi-mode','sdi-keyer'])E(id).addEventListener('change',paintSdi);")
once('saidas-sdi-hdr-ui.js',"supported=state.capabilities?.decklink?.hdrOutputImplemented", "deck=state.capabilities?.decklink||{},supported=deck.inventorySnapshotUsable&&deck.hdrImplementationKnown&&deck.hdrOutputImplemented")
once('saidas-sdi-hdr-ui.js',"source.innerHTML=rows.length?rows.map(s=>`<option value=\"${esc(s.uuid)}\">${esc(s.name)}</option>`).join(''):'<option value=\"\">Nenhuma fonte HDR reconhecida</option>';if(rows.some(s=>s.uuid===old))source.value=old;", "const selected=source.dataset.initialized?old:config.hdr?String(config.sourceUuid||''):'';source.dataset.initialized='true';source.innerHTML='<option value=\"\">Selecione uma fonte HDR</option>'+rows.map(s=>`<option value=\"${esc(s.uuid)}\">${esc(s.name)}</option>`).join('');if(selected&&!rows.some(s=>s.uuid===selected)){const option=new Option('Fonte salva/selecionada não confirmada',selected);option.disabled=true;source.add(option);}source.value=selected;")
once('saidas-sdi-hdr-ui.js',"mode.innerHTML=modes.map(m=>`<option value=\"${m.value}\">${esc(m.name)}</option>`).join('');if(modes.some(m=>String(m.value)===oldMode))mode.value=oldMode;", "const device=E('sdi-device').value,selected=mode.dataset.initialized&&mode.dataset.device===device?oldMode:!mode.dataset.initialized&&config.hdr&&config.deviceHash===device?String(config.modeId):'';mode.dataset.initialized='true';mode.dataset.device=device;mode.innerHTML='<option value=\"\">Selecione um modo HDR</option>'+modes.map(m=>`<option value=\"${m.value}\">${esc(m.name)}</option>`).join('');if(selected&&!modes.some(m=>String(m.value)===selected)){const option=new Option('Modo salvo/selecionado não confirmado',selected);option.disabled=true;mode.add(option);}mode.value=selected;")
once('saidas-sdi-hdr-ui.js',"if(!dirty&&saved!==signature&&config.hdr)mode.value=String(config.modeId);", "if(!dirty&&saved!==signature&&config.hdr){const selected=String(config.modeId);if(![...mode.options].some(o=>o.value===selected)){const option=new Option('Modo salvo não confirmado',selected);option.disabled=true;mode.add(option);}mode.value=selected;}")
once('saidas-sdi-hdr-ui.js',"if(!rows.some(s=>s.uuid===config.sourceUuid))source.add(new Option('Fonte salva indisponível',config.sourceUuid));", "if(![...source.options].some(o=>o.value===config.sourceUuid)){const option=new Option('Fonte salva não confirmada',config.sourceUuid);option.disabled=true;source.add(option);}")
once('saidas-sdi-hdr-ui.js',"for(const action of ['configure','preflight'])E('sdi-hdr-'+action).disabled=!supported||!!state.active||!source.value;", "const selectionValid=rows.some(s=>s.uuid===source.value)&&modes.some(m=>String(m.value)===mode.value);for(const action of ['configure','preflight'])E('sdi-hdr-'+action).disabled=!supported||!!state.active||!selectionValid;")
once('saidas-sdi-hdr-ui.js',"E('sdi-hdr-start').disabled=!supported||!!state.active||dirty||!config.hdr;", "E('sdi-hdr-start').disabled=!supported||!!state.active||dirty||!config.hdr||!selectionValid;")
once('saidas-sdi-hdr-ui.js',"message||(!supported?'Motor/DeckLink ainda não oferece o contrato HDR'", "!deck.hdrImplementationKnown?'Contrato HDR não consultado · consulte placas e modos':!deck.inventorySnapshotUsable?'Inventário HDR em cache; consulte placas e modos':message||(!supported?'A consulta não anunciou o contrato HDR nesta versão do plugin'")
out=OWN/'draft';out.mkdir(exist_ok=True);patches=OWN/'patches';patches.mkdir(exist_ok=True);rows=[]
for name,p in targets.items():
 dest=out/p;dest.parent.mkdir(parents=True,exist_ok=True);after=text[name].encode('utf8');dest.write_bytes(after)
 diff=''.join(difflib.unified_diff(base[name].decode('utf8').splitlines(True),text[name].splitlines(True),fromfile='a/'+p,tofile='b/'+p)).encode('utf8');(patches/(name+'.patch')).write_bytes(diff)
 rows.append({'path':p,'beforeSha256':H(base[name]),'afterSha256':H(after),'patch':'patches/'+name+'.patch','patchSha256':H(diff),'draft':'draft/'+p})
(OWN/'TARGETS.json').write_text(json.dumps({'status':'OFFSIDE_PENDING_ROOT_REVIEW_NO_BUILD_OR_RUNTIME','targets':rows,'nativeHeadExpected':'a73b97c','canonicalModified':False},indent=2)+'\n')
print(json.dumps({'status':'OWN_DRAFT_ONLY','targets':len(rows)}))
