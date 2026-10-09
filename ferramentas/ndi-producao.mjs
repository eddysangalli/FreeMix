// DistroAV control uses the real registered OBS types and outputs. No simulated ON state.
import {readFile,readdir} from 'node:fs/promises';
import {join} from 'node:path';
import {assertSdrOutputRequest,outputHdrContracts} from './saidas-hdr.mjs';
export const NDI_OUTPUT='NDI Main Output';
const pendingSettings=new WeakMap();
async function nativeRequest(obs,action,data={}) {
 const result=await obs.tryReq('CallVendorRequest',{vendorName:'freemix',requestType:'network_output',requestData:{protocol:'NDI',action,...data}}).catch(()=>null);
 const r=result?.responseData;
 return r&&typeof r.available==='boolean'?r:null;
}
export async function ndiRead(obs,{root,senderId=0}={}) {
 const [kinds,listed,native]=await Promise.all([obs.req('GetInputKindList'),obs.req('GetOutputList'),nativeRequest(obs,'state',{senderId})]);
 const sourceAvailable=kinds.inputKinds.includes('ndi_source');
 const outputs=listed.outputs.filter(x=>['ndi_output','freemix_ndi_output'].includes(x.outputKind));
 const output=outputs.find(x=>x.outputName===(native?.outputName||NDI_OUTPUT));
 let runtimeVersion=null,pluginVersion=null;
 if(root)try{
  const files=(await readdir(join(root,'config/obs-studio/logs'))).filter(x=>x.endsWith('.txt')).sort();
  if(files.length){const log=await readFile(join(root,'config/obs-studio/logs',files.at(-1)),'utf8');runtimeVersion=log.match(/NDI Library Version detected: ([\d.]+)/)?.[1]||null;pluginVersion=log.match(/you can haz DistroAV \(Version ([\d.]+)\)/)?.[1]||null;}
 }catch{}
 const controllable=Boolean(native?.available||output);
 return {hdrSupported:false,hdrContract:outputHdrContracts.NDI,installed:sourceAvailable,sourceAvailable,available:native?.available??sourceAvailable,outputAvailable:controllable,outputCreated:Boolean(output),outputActive:native?.active??Boolean(output?.outputActive),outputName:native?.outputName||NDI_OUTPUT,networkName:native?.networkName||null,groups:native?.groups||'',nativeBridge:Boolean(native),sourceIndependent:!!native?.sourceIndependent,audioSourceSelectable:!!native?.audioSourceSelectable,audioSourceUuid:native?.audioSourceUuid||'',audioTrackSelectable:!!native?.audioTrackSelectable,sendersPerProtocol:native?.sendersPerProtocol||1,senderId:native?.senderId||0,senders:native?.senders||[],fillKeySupported:!!native?.fillKeySupported,fillKey:!!native?.fillKey,keyName:native?.keyName||'',alphaSupported:!!native?.alphaSupported,alpha:!!native?.alpha,connections:native?.connections??-1,receiverStatus:native?.receiverStatus||'unknown',capturedFrames:native?.capturedFrames||0,backend:native?.backend||null,mode:native?.mode||'program',sourceUuid:native?.sourceUuid||'',audioTrack:native?.audioTrack||0,width:native?.width||0,height:native?.height||0,outputs,runtimeVersion,pluginVersion,needsOutputInitialization:sourceAvailable&&!controllable,initializationHint:sourceAvailable&&!controllable?'Ative Main Output nas configurações DistroAV para criar a saída. O plugin 6.2.1 não cria a saída quando ela está desligada na inicialização.':null};
}
export async function ndiConfigure(obs,{name,groups}={}) {
 const state=await ndiRead(obs);
 if(!state.outputAvailable)throw Object.assign(Error(state.initializationHint||'DistroAV + NDI Runtime compatível não estão carregados'),{code:'NDI_OUTPUT_NOT_INITIALIZED',capability:state});
 const settings={};
 if(name!==undefined){if(typeof name!=='string'||!name.trim())throw Error('Nome da saída NDI obrigatório');settings.ndi_name=name.trim();}
 if(groups!==undefined){if(typeof groups!=='string')throw Error('Grupos NDI devem ser texto');settings.ndi_groups=groups;}
 // Do not rename an active output: DistroAV may restart it and alter network identity.
 if(state.outputActive)throw Object.assign(Error('Pare a saída NDI antes de alterar nome ou grupos'),{code:'NDI_OUTPUT_ACTIVE'});
 if(state.nativeBridge){pendingSettings.set(obs,{name:settings.ndi_name,groups:settings.ndi_groups});return {pending:true,outputSettings:settings,appliesOnExplicitStart:true};}
 await obs.req('SetOutputSettings',{outputName:state.outputName,outputSettings:settings});
 return obs.req('GetOutputSettings',{outputName:state.outputName});
}
export async function ndiStart(obs,options={}) {
 assertSdrOutputRequest('NDI',options);
 const senderId=Number(options.senderId??0),state=await ndiRead(obs,{senderId});if(options.hdr||Number(options.precisionBits??8)!==8)throw Error('Esta rota NDI suporta SDR8; HDR/PA16 não estão configurados');
 if(!Number.isInteger(senderId)||senderId<0||senderId>=(state.sendersPerProtocol||1))throw Error('Sender NDI indisponível neste motor');
 if(options.fillKey&&(!state.fillKeySupported||options.mode!=='source'))throw Error('Fill+Key NDI exige SDK oficial e entrada independente');
 if(options.alpha&&(!state.alphaSupported||options.mode!=='source'))throw Error('Alpha exige entrada independente e suporte BGRA SDR do motor');
 const mode=options.mode||'program',audioTrack=Number(options.audioTrack??0),audioSourceUuid=String(options.audioSourceUuid||'');if(audioSourceUuid&&!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(audioSourceUuid))throw Error('Áudio independente exige UUID');if(audioSourceUuid&&!state.audioSourceSelectable)throw Error('Motor sem captura PCM independente por UUID');
 if(!['program','source'].includes(mode)||![0,1,2].includes(audioTrack))throw Error('Escolha Programa ou entrada e áudio Master/A/B para NDI');
 if(mode==='source'&&(!state.sourceIndependent||!options.sourceUuid))throw Error('Este motor não suporta NDI por entrada independente');
 if(audioTrack!==0&&!state.audioTrackSelectable)throw Error('Este motor não suporta seleção de bus NDI');
 if(!state.outputAvailable)throw Object.assign(Error(state.initializationHint||'DistroAV + NDI Runtime compatível não estão carregados'),{code:'NDI_OUTPUT_NOT_INITIALIZED',capability:state});
 if(state.nativeBridge){const result=await nativeRequest(obs,'start',{...pendingSettings.get(obs),...options,senderId,audioTrack,audioSourceUuid,mode,alpha:options.alpha===true});if(!result?.success||!result.active)throw Error(result?.error||'Motor não confirmou saída NDI ativa');return {...result,outputActive:result.active};}
 if(Object.keys(options).length&&!state.outputActive)await ndiConfigure(obs,options);
 if(!state.outputActive)await obs.req('StartOutput',{outputName:state.outputName});
 const status=await obs.req('GetOutputStatus',{outputName:state.outputName});
 if(!status.outputActive)throw Error('DistroAV não confirmou envio NDI ativo');
 return status;
}
export async function ndiStop(obs,{senderId=0}={}) {
 const state=await ndiRead(obs,{senderId});
 if(state.nativeBridge){let result=await nativeRequest(obs,'stop',{senderId});if(!result?.success)throw Error(result?.error||'Motor não confirmou parada NDI');for(let n=0;result.active&&n<60;n++){await new Promise(resolve=>setTimeout(resolve,50));result=await nativeRequest(obs,'state',{senderId});if(!result?.success)throw Error(result?.error||'Motor não confirmou estado NDI');}if(result.active)throw Error('Sender NDI ainda está encerrando a captura; aguarde');return {...result,outputActive:result.active};}
 if(!state.outputAvailable)return {outputActive:false,outputAvailable:false};
 if(state.outputActive)await obs.req('StopOutput',{outputName:state.outputName});
 const status=await obs.req('GetOutputStatus',{outputName:state.outputName});
 if(status.outputActive)throw Error('DistroAV não confirmou parada da saída NDI');
 return status;
}
export async function ndiCreateInput(obs,{sceneName,inputName,sourceName,framesync=true}={}) {
 if(!(await ndiRead(obs)).sourceAvailable)throw Error('Fonte NDI indisponível: carregue DistroAV e NDI Runtime 6.3+');
 if(!sceneName||!inputName||!sourceName)throw Error('Cena, nome da entrada e nome completo da fonte NDI são obrigatórios');
 return obs.req('CreateInput',{sceneName,inputName,inputKind:'ndi_source',inputSettings:{ndi_source_name:sourceName,ndi_framesync:Boolean(framesync),ndi_behavior:2},sceneItemEnabled:true});
}
