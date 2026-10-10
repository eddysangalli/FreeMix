// Finite read-only settings snapshot. No Production.run/refresh/execute/journal/audio migration.
const GETS=new Set(['GetSceneCollectionList','GetVideoSettings','GetRecordDirectory','GetStreamServiceSettings','GetProfileParameter','GetStats','GetVirtualCamStatus']);
export async function readSettingsSnapshot(production,now=Date.now){
 const obs=production.getObs(),scope=production.scope,engine=production.settingsEngine;
 const check=()=>{if(!obs||!production.state.connected||production.getObs()!==obs||production.scope!==scope||typeof scope!=='string'||!scope)throw Error('O motor ou projeto mudou durante a consulta. Confira novamente.');};check();
 const request=async(type,data={})=>{check();if(!GETS.has(type)&&!(type==='CallVendorRequest'&&((data.vendorName==='freemix'&&data.requestType==='get_destinations'&&Object.keys(data.requestData||{}).length===0)||(data.vendorName==='freemix-preferences'&&data.requestType==='control'&&data.requestData?.action==='read'&&Object.keys(data.requestData).length===1))))throw Error('Consulta de configurações tentou um comando não permitido.');const r=await obs.req(type,data);check();return r;};
 const adapter={req:request,vendor:async(type,data={},name='downstream-keyer')=>{const r=await request('CallVendorRequest',{vendorName:name,requestType:type,requestData:data});if(r.responseData?.success===false)throw Error('Consulta de configurações recusada pelo motor');return r.responseData;}};
 const verifyScope=async()=>{const r=await request('GetSceneCollectionList');if(r.currentSceneCollectionName!==scope)throw Error('O projeto do motor mudou durante a consulta. Confira novamente.');};await verifyScope();
 if(typeof engine?.read!=='function'||typeof engine.preferences?.read!=='function')throw Error('Getter de configurações indisponível');
 // Getter functions are reused on disposable plain receivers: preferences.read may
 // cache fields, but cannot change the shared engine/cache or last mutation result.
 const reader={p:adapter,read:engine.read,preferences:{p:adapter,read:engine.preferences.read}};
 const settings=await reader.read();await verifyScope();check();
 if(!settings?.video||!settings?.values)throw Error('Resposta de configurações incompleta');
 return{success:true,settings,preset:scope,observedAt:now()};
}
