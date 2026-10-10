import {randomUUID} from 'node:crypto';
const contract='experimental-master-final-video-gate-v1',coverage='main-video-only-after-composition';
const uuid=v=>typeof v==='string'&&/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(v),uint=v=>Number.isInteger(v)&&v>0&&v<=0x7fffffff;
const tags=new WeakMap(),pause=ms=>new Promise(r=>setTimeout(r,ms));
const tag=c=>{if(!tags.has(c))tags.set(c,'gate_'+randomUUID().replaceAll('-',''));return tags.get(c);};
const connected=(p,c)=>{if(!c||p.getObs()!==c)throw Error('A conexão mudou. Confira o motor antes de tentar novamente.');};
const timeoutText=mutation=>mutation?'Sem confirmação em5s. O comando pode ter sido aplicado; confira o motor antes de tentar novamente.':'O motor não respondeu em5s. Confira a conexão e use Conferir motor.';
function deadline(p,ms,mutation){let timer;return Promise.race([p,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error(timeoutText(mutation))),Math.max(1,ms));})]).finally(()=>clearTimeout(timer));}
function validate(s){
 if(s?.success===false)throw Error(s.error||'O motor recusou a etapa final de vídeo.');
 if(s?.contractVersion!==1||s.contract!==contract||s.coverage!==coverage||s.audioPolicy!=='unchanged'||s.experimental!==true)throw Error('Esta versão não oferece o contrato experimental do vídeo Master. Nenhum FTB-v2 ou Fade será usado.');
 if(s.success!==true||!s.scope||typeof s.scope!=='string'||!s.contextToken||typeof s.contextToken!=='string'||!uuid(s.programUuid)||!uuid(s.previewUuid)||!uuid(s.outputSourceUuid))throw Error('Programa, Preview ou contexto do Master não identificado.');
 for(const k of ['available','enabled','requestedActive','transitionRunning','blackStageApplied','identityStageApplied','captureMismatch','clockFault','resetRequired','pixelsVerified','independentProgramRoutesCovered','callsProgramVerified'])if(typeof s[k]!=='boolean')throw Error('Estado experimental do Master incompleto.');
 if(!uint(s.mixIdentity)||!uint(s.generation)||!Number.isInteger(s.commandSerial)||s.commandSerial<0||!Number.isInteger(s.frameSeq)||s.frameSeq<0||s.frameSeq>0xffffffff||!Number.isInteger(s.gainQ24)||s.gainQ24<0||s.gainQ24>16777216)throw Error('Identidade ou quadro do Master não confirmado.');
 return s;
}
async function vendor(p,c,data,ms){connected(p,c);const r=await deadline(c.req('CallVendorRequest',{vendorName:'freemix',requestType:'final_program_gate',requestData:data}),ms,data.command==='set');connected(p,c);return r?.responseData;}
// Read-only. Qualification is trusted startup state, never a request-body opt-in.
export async function readFinalProgramGate(p,c,ms=5000){const s=validate(await vendor(p,c,{command:'state'},ms));return {...s,nativeAvailable:s.available,qualified:p.finalProgramGateQualified===true,available:s.available&&p.finalProgramGateQualified===true,description:'Beta de vídeo Master/Mix1. O áudio continua audível. Saídas de origem própria, clean, Preview, Mix2 e máscaras são excluídas; saídas Program independentes exigem vínculo e prova próprios.'};}
export function matchesFinalProgramGate(receipt,s){
 const f=receipt.finalProgramGate;if(!f||s.scope!==receipt.scope||s.contextToken!==f.contextToken||s.mixIdentity!==f.mixIdentity||s.generation!==f.generation||s.programUuid!==f.programUuid||s.outputSourceUuid!==f.outputSourceUuid||s.transitionRunning||s.captureMismatch||s.resetRequired||s.clockFault||s.frameSeq<=f.beforeFrameSeq)return false;
 if(f.acceptedSerial!==undefined&&s.commandSerial!==f.acceptedSerial)return false;
 return s.enabled===f.enabled&&s.requestedActive===f.active&&(f.active?s.blackStageApplied&&s.gainQ24===0:s.identityStageApplied&&s.gainQ24===16777216);
}
export async function dispatchFinalProgramGate(p,operation,data,c,onDispatch,{deadlineMs=5000,pollMs=25}={}){
 if(p.finalProgramGateQualified!==true)throw Error('FTB geral ainda não está habilitado. Este beta de vídeo Master exige qualificação explícita; áudio permanece audível.');
 if(!/^[A-Za-z0-9_-]{1,80}$/.test(String(operation.id||'')))throw Error('ID de operação obrigatório para impedir repetição.');
 if(data.mixId!==0||data.experimentalOptIn!==true||data.audioPolicy!=='unchanged'||typeof data.enabled!=='boolean'||typeof data.active!=='boolean'||data.active&&!data.enabled||!Number.isInteger(data.durationMs)||data.durationMs<50||data.durationMs>20000)throw Error('Use Mix1/Master (mixId0), enabled/active explícitos, duração50..20000ms e áudio unchanged. Não há toggle.');
 const expires=(operation.receivedAt??Date.now())+deadlineMs;
 if(Date.now()>=expires)throw Error('O comando aguardou demais. Nenhuma etapa final foi enviada; confira o motor.');
 const before=await readFinalProgramGate(p,c,expires-Date.now());
 if(before.scope!==operation.scope||p.scope!==before.scope)throw Error('O projeto mudou; consulte sem reenviar.');
 if(!before.available||before.transitionRunning||before.captureMismatch||before.clockFault||before.resetRequired||before.requestedActive&&!before.blackStageApplied||!before.requestedActive&&!before.identityStageApplied)throw Error('Master ou transição não confirmado; consulte o motor antes de enviar.');
 Object.assign(operation,{targetKey:before.programUuid,targetName:p.state.inputs?.find(i=>i.key===before.programUuid)?.name||p.state.program||'Programa',finalProgramGate:{active:data.active,enabled:data.enabled,durationMs:data.durationMs,contextToken:before.contextToken,programUuid:before.programUuid,outputSourceUuid:before.outputSourceUuid,previewUuid:before.previewUuid,mixIdentity:before.mixIdentity,generation:before.generation,beforeFrameSeq:before.frameSeq,audioPolicy:'unchanged'}});
 const request={command:'set',experimentalOptIn:true,audioPolicy:'unchanged',enabled:data.enabled,active:data.active,durationMs:data.durationMs,operationId:operation.id,connectionId:tag(c),expectedScope:before.scope,expectedContextToken:before.contextToken,expectedProgramUuid:before.programUuid,expectedPreviewUuid:before.previewUuid,expectedOutputSourceUuid:before.outputSourceUuid,expectedMixIdentity:before.mixIdentity,expectedGeneration:before.generation};
 if(Date.now()>=expires)throw Error('A confirmação inicial demorou. Nenhuma etapa final foi enviada; confira o motor.');
 onDispatch();const accepted=validate(await vendor(p,c,request,expires-Date.now()));
 if(accepted.accepted!==true||!uint(accepted.acceptedSerial))throw Error('O aceite não confirmou o quadro de vídeo; confira o motor sem repetir este ID.');
 operation.finalProgramGate.acceptedSerial=accepted.acceptedSerial;
 do{
  if(Date.now()>=expires)throw Error(timeoutText(true));
  const s=await readFinalProgramGate(p,c,expires-Date.now());
  if(s.scope!==before.scope||s.contextToken!==before.contextToken||s.mixIdentity!==before.mixIdentity||s.generation!==before.generation)throw Error('Contexto ou mix mudou após envio; consulte sem repetir.');
  if(matchesFinalProgramGate(operation,s))return s;
  await pause(Math.min(pollMs,Math.max(1,expires-Date.now())));
 }while(true);
}
