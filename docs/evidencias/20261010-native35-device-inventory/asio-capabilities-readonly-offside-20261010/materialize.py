from pathlib import Path
import json, hashlib, difflib
R=Path(__file__).parent
def read(p): return (R/'baseline'/p).read_bytes().decode('utf-8').replace('\r\n','\n')
files={}
def edit(p,old,new):
 s=files.get(p,read(p)); assert s.count(old)==1,(p,old[:90],s.count(old));files[p]=s.replace(old,new)
p='freemix-app/frontend/widgets/FreeMixAsioOutput.hpp'
edit(p,'Drivers(); // read-only registry enumeration, no COM driver open','Drivers(bool *complete=nullptr); // explicit registry inventory; never opens COM')
p='freemix-app/frontend/widgets/FreeMixAsioOutput.cpp'
s=read(p); start=s.index('std::vector<FreeMixAsioDriver> FreeMixAsioOutput::Drivers()'); end=s.index('\nsize_t FreeMixAsioOutput::SampleBytes',start)
edit(p,s[start:end],'''std::vector<FreeMixAsioDriver> FreeMixAsioOutput::Drivers(bool *complete){
 if(complete)*complete=false;
 std::vector<FreeMixAsioDriver> list;HKEY root=nullptr;
 const auto opened=RegOpenKeyExW(HKEY_LOCAL_MACHINE,L"SOFTWARE\\\\ASIO",0,KEY_READ|KEY_WOW64_64KEY,&root);
 if(opened!=ERROR_SUCCESS){if(complete)*complete=opened==ERROR_FILE_NOT_FOUND;return list;}
 bool okay=true,ended=false;
 for(DWORD index=0;index<256;index++){
  wchar_t name[256]{};DWORD len=256;const auto enumerated=RegEnumKeyExW(root,index,name,&len,nullptr,nullptr,nullptr,nullptr);
  if(enumerated==ERROR_NO_MORE_ITEMS){ended=true;break;}if(enumerated!=ERROR_SUCCESS){okay=false;break;}
  HKEY key=nullptr;if(RegOpenKeyExW(root,name,0,KEY_READ,&key)!=ERROR_SUCCESS){okay=false;continue;}
  wchar_t clsid[128]{},description[512]{};DWORD bytes=sizeof(clsid);const auto result=RegGetValueW(key,nullptr,L"CLSID",RRF_RT_REG_SZ,nullptr,clsid,&bytes);
  bytes=sizeof(description);RegGetValueW(key,nullptr,L"Description",RRF_RT_REG_SZ,nullptr,description,&bytes);RegCloseKey(key);
  CLSID guid{};if(result==ERROR_SUCCESS&&SUCCEEDED(CLSIDFromString(clsid,&guid)))list.push_back({UTF8(clsid),UTF8(*description?description:name)});else okay=false;
 }
 RegCloseKey(root);if(complete)*complete=okay&&ended;return list;
}''')
p='freemix-app/frontend/widgets/FreeMixAudioRouting.cpp'
edit(p,'#include <QWidget>','#include <QWidget>\n#include <mmdeviceapi.h>\n#include <propsys.h>')
edit(p,'void List(obs_data_t *response,const char *key,const char *kind,const char *property){','bool List(obs_data_t *response,const char *key,const char *kind,const char *property){')
edit(p,'obs_data_set_array(response,key,rows);if(props)obs_properties_destroy(props);','const bool complete=p&&obs_property_get_type(p)==OBS_PROPERTY_LIST;obs_data_set_array(response,key,rows);if(props)obs_properties_destroy(props);return complete;')
edit(p,'struct AsioSession {','''// Separate process-local inventories: output CLSIDs are not capture-plugin IDs.
struct AsioInventory {
 std::vector<FreeMixAsioDriver> outputs,inputs,render;
 bool outputsKnown=false,inputsKnown=false,renderKnown=false;std::string outputError,inputError,renderError;
};
AsioInventory &Inventory(){static AsioInventory value;return value;}
bool RenderInventory(std::vector<FreeMixAsioDriver> &rows){
 // Explicit GUI-thread discovery only. Unlike the void libobs enumerator, a
 // failed or partial enumeration is observable and never becomes known-empty.
 const auto initialized=CoInitializeEx(nullptr,COINIT_APARTMENTTHREADED);const bool uninit=SUCCEEDED(initialized);
 if(FAILED(initialized)&&initialized!=RPC_E_CHANGED_MODE)return false;
 const PROPERTYKEY friendlyName={{0xa45c254e,0xdf1c,0x4efd,{0x80,0x20,0x67,0xd1,0x46,0xa8,0x50,0xe0}},14}; // PKEY_Device_FriendlyName, no new link dependency.
 IMMDeviceEnumerator *enumerator=nullptr;IMMDeviceCollection *collection=nullptr;UINT count=0;bool okay=false;
 HRESULT hr=CoCreateInstance(__uuidof(MMDeviceEnumerator),nullptr,CLSCTX_ALL,__uuidof(IMMDeviceEnumerator),reinterpret_cast<void **>(&enumerator));
 if(SUCCEEDED(hr))hr=enumerator->EnumAudioEndpoints(eRender,DEVICE_STATE_ACTIVE,&collection);
 if(SUCCEEDED(hr))hr=collection->GetCount(&count);
 if(SUCCEEDED(hr)&&count<=256){okay=true;for(UINT i=0;i<count;i++){
  IMMDevice *device=nullptr;IPropertyStore *properties=nullptr;LPWSTR id=nullptr;PROPVARIANT name{};
  hr=collection->Item(i,&device);if(SUCCEEDED(hr))hr=device->GetId(&id);if(SUCCEEDED(hr))hr=device->OpenPropertyStore(STGM_READ,&properties);if(SUCCEEDED(hr))hr=properties->GetValue(friendlyName,&name);
  if(SUCCEEDED(hr)&&id&&name.vt==VT_LPWSTR&&name.pwszVal){
   const auto utf8=[](const wchar_t *value){const int size=WideCharToMultiByte(CP_UTF8,0,value,-1,nullptr,0,nullptr,nullptr);std::string result(size>1&&size<=4096?size:0,0);if(!result.empty()){if(WideCharToMultiByte(CP_UTF8,0,value,-1,result.data(),size,nullptr,nullptr)!=size)return std::string{};result.pop_back();}return result;};
   auto deviceId=utf8(id),deviceName=utf8(name.pwszVal);if(deviceId.empty()||deviceName.empty())okay=false;else rows.push_back({std::move(deviceId),std::move(deviceName)});
  }else okay=false;
  PropVariantClear(&name);if(id)CoTaskMemFree(id);if(properties)properties->Release();if(device)device->Release();
 }}
 if(collection)collection->Release();if(enumerator)enumerator->Release();if(uninit)CoUninitialize();return okay;
}
void DiscoverAsio(){
 auto &cache=Inventory();bool complete=false;auto outputs=FreeMixAsioOutput::Drivers(&complete);
 cache.outputsKnown=complete;cache.outputError=complete?"":"Inventário ASIO de saída incompleto; atualize dispositivos";
 if(complete)cache.outputs=std::move(outputs); // Preserve last good choices after a failed scan.
 OBSDataAutoRelease result=obs_data_create();const bool inputComplete=List(result,"drivers","asio_input_capture","device_id");
 cache.inputsKnown=inputComplete;cache.inputError=inputComplete?"":"Inventário ASIO de entrada indisponível; atualize dispositivos";
 if(inputComplete){std::vector<FreeMixAsioDriver> next;OBSDataArrayAutoRelease rows=obs_data_get_array(result,"drivers");for(size_t i=0;i<obs_data_array_count(rows);i++){OBSDataAutoRelease row=obs_data_array_item(rows,i);next.push_back({obs_data_get_string(row,"id"),obs_data_get_string(row,"name")});}cache.inputs=std::move(next);}
 std::vector<FreeMixAsioDriver> render;cache.renderKnown=RenderInventory(render);cache.renderError=cache.renderKnown?"":"Inventário de reprodução incompleto; atualize dispositivos";if(cache.renderKnown)cache.render=std::move(render);
}
struct AsioSession {''')
edit(p,'QTimer *timer=nullptr;bool configured=false;','QTimer *timer=nullptr;bool lifecycleRegistered=false,configured=false;')
edit(p,'void Stop(){for(auto *tap:taps)','void Stop(){if(timer)timer->stop();for(auto *tap:taps)')
edit(p,'void Init(){if(timer)return;','''void InitLifecycle(){if(lifecycleRegistered)return;lifecycleRegistered=true;QObject::connect(qApp,&QCoreApplication::aboutToQuit,qApp,[this](){Stop();});obs_frontend_add_event_callback(Event,this);}
 void Init(){if(timer){timer->start();return;}''')
edit(p,'timer->start();QObject::connect(qApp,&QCoreApplication::aboutToQuit,qApp,[this](){Stop();});obs_frontend_add_event_callback(Event,this);}','timer->start();}')
edit(p,'lastCallbacks=0;lastCallbackAt=os_gettime_ns();for(auto *tap:taps)','Init();lastCallbacks=0;lastCallbackAt=os_gettime_ns();for(auto *tap:taps)')
edit(p,'void State(obs_data_t *response){Init();const auto metrics=output.Metrics();','''static void State(obs_data_t *response,const AsioSession *session){
  const auto metrics=session?session->output.Metrics():FreeMixAsioMetrics{};
  const bool configured=session&&session->configured;const uint32_t rate=session?session->rate:0;const long buffer=session?session->buffer:0;
  static const std::string empty;static const std::vector<FreeMixAsioRoute> noRoutes;
  const auto &driverId=session?session->driverId:empty;const auto &error=session?session->error:empty;const auto &routes=session?session->routes:noRoutes;
  const auto &cache=Inventory();''')
edit(p,'for(const auto &driver:FreeMixAsioOutput::Drivers()){','for(const auto &driver:cache.outputs){')
edit(p,'obs_data_set_array(status,"drivers",devices);','obs_data_set_array(status,"drivers",devices);obs_data_set_bool(status,"inventoryKnown",cache.outputsKnown);obs_data_set_string(status,"inventoryError",cache.outputError.c_str());')
edit(p,'AsioSession &Asio(){static auto *session=new AsioSession;return *session;} // process lifetime; qApp stop owns cleanup','''AsioSession *&AsioPointer(){static AsioSession *session=nullptr;return session;}
AsioSession &Asio(){auto *&session=AsioPointer();if(!session){session=new AsioSession;session->InitLifecycle();}return *session;} // explicit actions only; lifecycle owns stop, no getter allocation''')
start=files[p].index('  auto &asio=Asio();');end=files[p].index('  // Audio Monitor properties',start)
edit(p,files[p][start:end],'''  const std::string asioAction=obs_data_get_string(request,"asioAction");bool asioOkay=true;std::string actionError;
  if(!asioAction.empty()&&asioAction!="state"&&asioAction!="configure"&&asioAction!="start"&&asioAction!="stop"&&asioAction!="control-panel"){
   AsioSession::State(response,AsioPointer());obs_data_set_bool(response,"success",false);obs_data_set_string(response,"error","Ação ASIO inválida");return;
  }
  const bool discover=obs_data_get_bool(request,"discoverAsio");
  if(discover&&(!asioAction.empty()&&asioAction!="state")){obs_data_set_bool(response,"success",false);obs_data_set_string(response,"error","Separe a atualização de dispositivos da operação ASIO");return;}
  if(discover)DiscoverAsio(); // Only the explicitly authorized refresh request probes inventories.
  if(asioAction=="configure"||asioAction=="start"){auto &asio=Asio();asioOkay=asioAction=="configure"?asio.Configure(request):asio.Start();actionError=asio.error;}
  else if(auto *asio=AsioPointer()){
   if(asioAction=="stop"){asio->Stop();asio->error.clear();}else if(asioAction=="control-panel"){asioOkay=asio->output.ControlPanel(asio->error);actionError=asio->error;}
  }else if(asioAction=="control-panel"){asioOkay=false;actionError="Inicie ASIO antes de abrir o painel do driver";}
  AsioSession::State(response,AsioPointer());if(!asioOkay){obs_data_set_bool(response,"success",false);obs_data_set_string(response,"error",actionError.c_str());return;}
''')
start=files[p].index('  // Audio Monitor properties');end=files[p].index('  OBSDataAutoRelease recordDefaults=',start)
edit(p,files[p][start:end],'''  // No WASAPI/COM discovery during state/open/poll. The explicit scan above
  // updates a separate render inventory without touching any saved route.
  const auto &renderInventory=Inventory();OBSDataArrayAutoRelease devices=obs_data_array_create();
  for(const auto &device:renderInventory.render){OBSDataAutoRelease row=obs_data_create();obs_data_set_string(row,"id",device.id.c_str());obs_data_set_string(row,"name",device.name.c_str());obs_data_array_push_back(devices,row);}obs_data_set_array(response,"renderDevices",devices);
  obs_data_set_bool(response,"renderInventoryKnown",renderInventory.renderKnown);obs_data_set_string(response,"renderInventoryError",renderInventory.renderError.c_str());
''')
edit(p,'  List(response,"asioDrivers","asio_input_capture","device_id");','''  const auto &inventory=Inventory();OBSDataArrayAutoRelease captured=obs_data_array_create();
  for(const auto &driver:inventory.inputs){OBSDataAutoRelease row=obs_data_create();obs_data_set_string(row,"id",driver.id.c_str());obs_data_set_string(row,"name",driver.name.c_str());obs_data_array_push_back(captured,row);}obs_data_set_array(response,"asioDrivers",captured);
  obs_data_set_bool(response,"asioInventoryKnown",inventory.inputsKnown);obs_data_set_string(response,"asioInventoryError",inventory.inputError.c_str());''')
p='FreeMix/ferramentas/audio-buses-producao.mjs'
edit(p,"this.p.vendor('audio_capabilities',{},'freemix')","this.p.vendor('audio_capabilities',{discoverAsio:force===true},'freemix');if(native.success===false)throw Error(native.error||'Consulta de áudio recusada');this.asioOutput=native.asioOutputCapabilities||this.asioOutput")
edit(p,'renderDevices:native.renderDevices||[],asioDrivers:native.asioDrivers||[],hardwareVerified:false','renderDevices:native.renderDevices||this.capabilities?.renderDevices||[],renderInventoryKnown:native.renderInventoryKnown===true,renderInventoryError:native.renderInventoryError||null,asioDrivers:native.asioDrivers||this.capabilities?.asioDrivers||[],asioInventoryKnown:native.asioInventoryKnown===true,asioInventoryError:native.asioInventoryError||null,hardwareVerified:false')
edit(p,'const caps=await this.discover(true);if(!caps.directOut)','const caps=await this.discover();if(!caps.directOut)')
edit(p,"if(target.key===nativeDirector)throw Error('O microfone privado não pode usar saída direta');const caps=await this.discover();", """if(target.key===nativeDirector)throw Error('O microfone privado não pode usar saída direta');if(d.enabled===false){const filters=(await this.p.req('GetSourceFilterList',{sourceUuid:target.key})).filters,existing=filters.find(f=>f.filterName===DIRECT_FILTER);if(existing&&existing.filterKind!=='audio_monitor')throw Error('Nome da saída direta reservado por outro filtro');if(existing)await this.p.req('SetSourceFilterEnabled',{sourceUuid:target.key,filterName:DIRECT_FILTER,filterEnabled:false});const saved=this.config.nodes[target.key]?.directOut;if(saved){this.config.nodes[target.key]={...this.config.nodes[target.key],directOut:{...saved,enabled:false}};await this.save();}return saved?{...saved,enabled:false}:null;}const caps=await this.discover();""")
edit(p,"if(!caps.directOut)throw Error('Filtro Audio Monitor indisponível');", "if(!caps.directOut)throw Error('Filtro Audio Monitor indisponível');if(!caps.renderInventoryKnown)throw Error('Atualize dispositivos antes de configurar a saída direta');")
edit(p,"const caps=await this.discover(true);if(!caps.asio||!caps.asioDrivers.some(x=>x.id===d.device))", "const caps=await this.discover();if(!caps.asioInventoryKnown)throw Error('Atualize dispositivos antes de criar uma entrada ASIO');if(!caps.asio||!caps.asioDrivers.some(x=>x.id===d.device))")
edit(p,"if(typeof d.driverId!=='string'", "if(this.asioOutput?.inventoryKnown!==true)throw Error('Atualize dispositivos antes de configurar ASIO');if(typeof d.driverId!=='string'")
p='FreeMix/painel/remoto/audio-buses.js'
edit(p,'function directFields(){','function directStopRequested(){return E(\'direct-enabled\').checked===false&&(state?.routing?.directOut||[]).some(item=>item.key===E(\'direct-source\').value&&item.enabled===true);}\nfunction directFields(){')
edit(p,'function options(select,rows,selected){select.replaceChildren();','function options(select,rows,selected,preserveMissing=false,unknown=true){select.replaceChildren();if(preserveMissing&&selected&&!rows.some(row=>(row.key||row.id)===selected)){const saved=new Option(unknown?\'Seleção salva · atualizar dispositivos\':\'Seleção salva indisponível\',selected);saved.disabled=true;select.add(saved);}')
edit(p,"options(E('direct-device'),cap.renderDevices||[],E('direct-device').value);E('direct-save').disabled=!cap.directOut||!cap.renderDevices?.length||!E('direct-source').value;", "options(E('direct-device'),cap.renderDevices||[],E('direct-device').value||(routing.directOut||[]).find(d=>d.key===E('direct-source').value)?.device,true,cap.renderInventoryKnown!==true);E('direct-save').disabled=!cap.directOut||cap.renderInventoryKnown!==true||!cap.renderDevices?.some(d=>d.id===E('direct-device').value)||!E('direct-source').value;")
edit(p,"options(E('asio-device'),cap.asioDrivers||[],E('asio-device').value);E('asio-create').disabled=!cap.asio||!cap.asioDrivers?.length;", "options(E('asio-device'),cap.asioDrivers||[],E('asio-device').value,true,cap.asioInventoryKnown!==true);E('asio-create').disabled=!cap.asio||cap.asioInventoryKnown!==true||!cap.asioDrivers?.some(d=>d.id===E('asio-device').value);")
edit(p,"+(routing.error?' · '+routing.error:'');", "+(cap.renderInventoryKnown!==true?' · '+(cap.renderInventoryError||'Dispositivos de reprodução não consultados; Atualizar dispositivos'):'')+(routing.error?' · '+routing.error:'');")
edit(p,"!cap.asio?'Plugin ASIO indisponível':!cap.asioDrivers?.length?", "!cap.asio?'Plugin ASIO indisponível':cap.asioInventoryKnown!==true?(cap.asioInventoryError||'Drivers ainda não consultados. Clique em Atualizar dispositivos.'):!cap.asioDrivers?.length?")
edit(p,'output.configuredBufferFrames,output.drivers,asioOutputSources()','output.configuredBufferFrames,output.drivers,output.inventoryKnown,asioOutputSources()')
edit(p,"config.driverId||E('asio-output-driver').value);", "config.driverId||E('asio-output-driver').value,true,output.inventoryKnown!==true);")
edit(p,"E('asio-output-add').disabled=active||!output.drivers?.length;E('asio-output-configure').disabled=active||!output.drivers?.length;", "E('asio-output-add').disabled=active||output.inventoryKnown!==true||!output.drivers?.length;E('asio-output-configure').disabled=active||output.inventoryKnown!==true||!output.drivers?.some(d=>d.id===E('asio-output-driver').value);")
edit(p,"(active?'ASIO ativo':'ASIO parado')+' · '","(active?'ASIO ativo':'ASIO parado')+(output.inventoryKnown!==true?' · '+(output.inventoryError||'Drivers não consultados; Atualizar dispositivos'):'')+' · '")
edit(p,"E('asio-output-console').addEventListener('input'", "E('asio-output-driver').addEventListener('change',renderAsioOutput);for(const id of ['asio-device','direct-device'])E(id).addEventListener('change',()=>{const cap=state?.routing?.capabilities||{};E('asio-create').disabled=!cap.asio||cap.asioInventoryKnown!==true||!cap.asioDrivers?.some(d=>d.id===E('asio-device').value);E('direct-save').disabled=!cap.directOut||cap.renderInventoryKnown!==true||!cap.renderDevices?.some(d=>d.id===E('direct-device').value)||!E('direct-source').value;});\nE('asio-output-console').addEventListener('input'")
# Stop never requires inventory; only the verified existing-filter backend branch runs.
old="E('direct-save').disabled=!cap.directOut||cap.renderInventoryKnown!==true||!cap.renderDevices?.some(d=>d.id===E('direct-device').value)||!E('direct-source').value;"
assert files[p].count(old)==2
files[p]=files[p].replace(old,"E('direct-save').disabled=!directStopRequested()&&(!cap.directOut||cap.renderInventoryKnown!==true||!cap.renderDevices?.some(d=>d.id===E('direct-device').value)||!E('direct-source').value);")
edit(p,"E('direct-device').value=item.device;}","E('direct-device').value=item.device;const cap=state?.routing?.capabilities||{};E('direct-save').disabled=!directStopRequested()&&(!cap.directOut||cap.renderInventoryKnown!==true||!cap.renderDevices?.some(d=>d.id===E('direct-device').value)||!E('direct-source').value);}")
edit(p,"E('asio-output-driver').addEventListener('change',renderAsioOutput);", "E('direct-enabled').addEventListener('change',()=>{const cap=state?.routing?.capabilities||{};E('direct-save').disabled=!directStopRequested()&&(!cap.directOut||cap.renderInventoryKnown!==true||!cap.renderDevices?.some(d=>d.id===E('direct-device').value)||!E('direct-source').value);});\nE('asio-output-driver').addEventListener('change',renderAsioOutput);")
# An explicit scan must populate choices even if routes are dirty, without resetting them.
edit(p,"let asioOutputDirty=false,asioOutputSignature='';", "let asioOutputDirty=false,asioOutputSignature='',asioOutputDriverSignature='';")
edit(p,"const signature=JSON.stringify([output.driverId", "const driverSignature=JSON.stringify([output.inventoryKnown,output.drivers]);if(driverSignature!==asioOutputDriverSignature){asioOutputDriverSignature=driverSignature;const saved=output.configured?output.driverId:state.routing.asioOutputConfig?.driverId;options(E('asio-output-driver'),output.drivers||[],E('asio-output-driver').value||saved,true,output.inventoryKnown!==true);}const signature=JSON.stringify([output.driverId")
patch=[];entries=[]
for p,s in files.items():
 old=(R/'baseline'/p).read_bytes();eol='\r\n' if b'\r\n' in old else '\n';data=s.replace('\n',eol).encode('utf-8');dest=R/'draft'/p;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(data)
 patch.extend(difflib.unified_diff(read(p).splitlines(True),s.splitlines(True),fromfile='a/'+p,tofile='b/'+p))
 entries.append({'path':p,'baseline':hashlib.sha256(old).hexdigest(),'draft':hashlib.sha256(data).hexdigest(),'eol':'CRLF' if eol=='\r\n' else 'LF'})
(R/'readonly-asio.patch').write_text(''.join(patch),encoding='utf-8',newline='\n')
(R/'PRODUCT-PINS.json').write_text(json.dumps(entries,indent=2)+'\n',encoding='utf-8')
print('Materialized',len(entries),'OFFSIDE files')
