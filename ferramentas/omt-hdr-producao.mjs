// Explicit route, separate from existing SDR/alpha senders. Never auto-starts.
async function request(obs,requestData){
 const result=await obs.tryReq('CallVendorRequest',{vendorName:'freemix',requestType:'omt_hdr_output',requestData});
 return result?.responseData;
}
function sender(value=0){const id=Number(value);if(!Number.isInteger(id)||id<0||id>3)throw Error('Selecione envio HDR1 a4');return id;}
export async function omtHdrRead(obs,{senderId=0}={}){
 try{return await request(obs,{action:'state',senderId:sender(senderId)})||{available:false,active:false};}
 catch{return {available:false,active:false,hdrAlphaSupported:false,hdrTransferSignaled:false,autoStart:false,requiresUpdate:true};}
}
export async function omtHdrExecute(obs,{command,senderId=0,...options}){
 if(!['configure','start','stop','preflight'].includes(command))throw Error('Comando HDR OMT inválido');
 const data={action:command,senderId:sender(senderId)};
 if(['configure','preflight'].includes(command)){
  if(!['pq','hlg'].includes(options.transfer)||options.receiverTransfer!==options.transfer||options.manualReceiverConfirmed!==true)
   throw Error('Confirme PQ/HLG igual no receptor OMT; a transferência não é anunciada automaticamente');
  if(options.alpha||options.fillKey)throw Error('HDR usa P216 opaco. Alpha/FillKey HDR não são suportados nesta rota');
  data.config={name:String(options.name||'').trim(),transfer:options.transfer,receiverTransfer:options.receiverTransfer,manualReceiverConfirmed:true,sourceUuid:String(options.sourceUuid||''),audioTrack:Number(options.audioTrack??0),audioSourceUuid:String(options.audioSourceUuid||''),alpha:false,fillKey:false};
 }
 const state=await request(obs,data);
 if(!state?.success)throw Error(state?.error||'Motor não oferece o caminho HDR OMT manual');
 if(command==='start'&&!state.active)throw Error('Motor não confirmou HDR OMT ativo');
 if(command==='stop'&&state.active)throw Error('Motor ainda está encerrando HDR OMT');
 return state;
}
