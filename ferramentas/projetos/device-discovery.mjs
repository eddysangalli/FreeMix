import {createHash} from 'node:crypto';
const fail=code=>{throw Object.assign(Error(code),{code});},sha=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
// Root binds readNativeInventory to the offside C++ function after integration/qualification.
// No new endpoint is assumed to exist, and no existing operator source properties are queried.
export function createDeviceDiscovery({readNativeInventory,getConnection,timeoutMs=10000}) {
 let inFlight=false,poisoned=false,cached=null;
 return Object.freeze({getCached:()=>cached?structuredClone(cached):null,async scan({explicitScan=false,driverMetadataAcknowledged=false}={}) {
  if(explicitScan!==true||driverMetadataAcknowledged!==true)fail('SCAN_CONSENT_REQUIRED');
  if(typeof readNativeInventory!=='function')fail('DISCOVERY_HELPER_UNAVAILABLE');
  if(inFlight||poisoned)fail('SCAN_PENDING_OR_TIMEOUT');const connection=getConnection();if(!connection)fail('ENGINE_DISCONNECTED');
  inFlight=true;let timer;
  try{const raw=await Promise.race([readNativeInventory(connection),new Promise((_,reject)=>{timer=setTimeout(()=>{poisoned=true;reject(Object.assign(Error('SCAN_TIMEOUT'),{code:'SCAN_TIMEOUT'}));},timeoutMs);})]);if(getConnection()!==connection)fail('CONNECTION_CHANGED');cached=normalizeDeviceInventory(raw);return cached;}
  finally{clearTimeout(timer);inFlight=false;}
 }});
}
export function normalizeDeviceInventory(raw) {
 if(raw?.success!==true||raw?.contract!=='freemix-project-device-inventory-v1'||raw.captureStarted!==false||raw.existingSourceSettingsTouched!==false||raw.driverMetadataMayOpen!==true||!Array.isArray(raw.cameras)||!Array.isArray(raw.audio)||raw.cameras.length>64||raw.audio.length>128)fail('DISCOVERY_CONTRACT_INVALID');
 const seen=new Set(),validId=id=>typeof id==='string'&&id.length>0&&id.length<=4096&&!/[\x00-\x1f]/.test(id)&&!['default','placeholder'].includes(id);
 const cameras=raw.cameras.map(d=>{if(d.kind!=='dshow_input'||!validId(d.stableId)||seen.has('cam:'+d.stableId)||typeof d.label!=='string'||!Array.isArray(d.modes)||d.modes.length>256)fail('CAMERA_CAPABILITIES_INVALID');seen.add('cam:'+d.stableId);const modes=d.modes.filter(m=>m.disabled!==true).map(m=>{if(!Number.isInteger(m.width)||!Number.isInteger(m.height)||m.width<2||m.height<2||m.width>7680||m.height>7680||!Number.isSafeInteger(m.frameInterval)||m.frameInterval<41667||m.frameInterval>10000000)fail('CAMERA_MODE_INVALID');const g=gcd(10000000,m.frameInterval),fps=(10000000/g)+'/'+(m.frameInterval/g);return {id:sha([d.stableId,m.width,m.height,m.frameInterval]),width:m.width,height:m.height,fps,frameInterval:m.frameInterval,enabled:true,nativeSettings:{video_device_id:d.stableId,res_type:1,resolution:m.width+'x'+m.height,frame_interval:m.frameInterval}};});const unique=[...new Map(modes.map(m=>[m.id,m])).values()];return {stableId:d.stableId,label:d.label.slice(0,120),kind:d.kind,available:d.disabled!==true&&unique.length>0,disabled:d.disabled===true||!unique.length,reason:unique.length?'Modo listado pelo driver; captura ainda desativada.':'Nenhum modo explícito informado pelo driver.',modes:unique};});
 const audio=raw.audio.filter(d=>d.stableId!=='default').map(d=>{if(d.kind!=='wasapi_input_capture'||!validId(d.stableId)||seen.has('audio:'+d.stableId)||typeof d.label!=='string')fail('AUDIO_CAPABILITIES_INVALID');seen.add('audio:'+d.stableId);return {stableId:d.stableId,label:d.label.slice(0,120),kind:d.kind,available:d.disabled!==true,disabled:d.disabled===true,reason:'Captura WASAPI só será criada em ativação separada.'};});
 const capabilities=(raw.filterKinds||raw.filterKindsNative?.map(x=>x.id)||[]).filter(x=>typeof x==='string'&&x.length<=100); // Never infer Speex availability from kind alone.
 const normalized={cameras,audio,capabilities,discoveryAvailable:true,driverMetadataMayOpen:true,captureStarted:false,existingSourceSettingsTouched:false,reason:'Inventário consultado por clique explícito. O driver pode abrir handles de metadados; nenhuma captura iniciada.'};return {...normalized,revision:sha(normalized)};
}
function gcd(a,b){while(b){const v=a%b;a=b;b=v;}return a;}
