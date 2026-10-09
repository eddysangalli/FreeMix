// Optional, inspection-only adapter for upstream d81f40b769c4f1460132d8bc06207027c681e359.
// It deliberately exposes no output/configuration mutations and never auto-polls.
export const MULTI_RTMP_VENDOR='sorayuki.multi_rtmp';
const text=(v,max=160)=>typeof v==='string'?v.slice(0,max):'';
const metric=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0?v:null;
export function externalTarget(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||typeof value.id!=='string'||!value.id||value.id.length>200)throw Error('Resposta externa inválida');
 return {key:'external:multi-rtmp:'+value.id,id:value.id,name:text(value.name),protocol:text(value.protocol,32),active:value.isRunning===true,activityKnown:typeof value.isRunning==='boolean',bitrateBps:metric(value.bitrateValue),fps:metric(value.fpsValue),duration:typeof value.duration==='string'&&/^\d{2,}:\d{2}:\d{2}$/.test(value.duration)?value.duration:null,syncStart:value.syncStart===true,syncStop:value.syncStop===true};
}
export class MultiRTMPAdapter {
 constructor(req){this.req=req;this.state={available:null,status:'unread',message:'Consulta manual do plugin externo',observedAt:null,targets:[]};}
 summary(){return structuredClone(this.state);}
 async read({id}={}){
  if(id!==undefined&&(typeof id!=='string'||!id||id.length>200||/[\x00-\x1f]/.test(id)))throw Error('ID externo inválido');
  const at=Date.now();
  try{
   const r=await this.req('CallVendorRequest',{vendorName:MULTI_RTMP_VENDOR,requestType:id?'get_target_state':'list_targets',requestData:id?{id}:{}}),data=r?.responseData;
   if(!data||typeof data!=='object'||Array.isArray(data))throw Error('Resposta externa inválida');
   if(data.error)throw Error('O plugin recusou a consulta');
   if(id){if(data.id!==id)throw Error('ID externo divergente');const stats=(await this.req('CallVendorRequest',{vendorName:MULTI_RTMP_VENDOR,requestType:'get_target_stats',requestData:{id}}))?.responseData;if(!stats||stats.error||stats.id!==id)throw Error('Telemetria externa inválida');const target=externalTarget({...data,...stats,protocol:data.protocol});const old=this.state.targets.filter(t=>t.id!==id);this.state={available:true,status:'ready',message:'Leitura manual · atividade do motor; recepção remota não confirmada',observedAt:at,targets:[...old,target]};}
   else{if(!Array.isArray(data.targets)||data.targets.length>512)throw Error('Lista externa inválida');const targets=data.targets.map(externalTarget);if(new Set(targets.map(t=>t.id)).size!==targets.length)throw Error('IDs externos duplicados');this.state={available:true,status:'ready',message:'Leitura manual · atividade do motor; recepção remota não confirmada',observedAt:at,targets};}
  }catch(error){const absent=/vendor.*(?:not found|does not exist|not registered|not available)|VendorNotFound/i.test(String(error?.message));this.state={available:absent?false:null,status:absent?'absent':'unavailable',message:absent?'Plugin externo não instalado':'Plugin externo indisponível ou resposta inválida; confira a conexão e a versão',observedAt:at,targets:[]};}
  return this.summary();
 }
}
