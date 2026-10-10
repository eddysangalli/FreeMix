// Readonly purpose-built requests, only caller-supplied own UUIDs, finite 12s bound.
const uuid=/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
const states=new Set(['OBS_MEDIA_STATE_NONE','OBS_MEDIA_STATE_PLAYING','OBS_MEDIA_STATE_OPENING','OBS_MEDIA_STATE_BUFFERING','OBS_MEDIA_STATE_PAUSED','OBS_MEDIA_STATE_STOPPED','OBS_MEDIA_STATE_ENDED','OBS_MEDIA_STATE_ERROR']);
export async function readFailureContext(obs,inputs,now,{timeoutMs=12000}={}){
 if(!Array.isArray(inputs)||inputs.length>3||inputs.some(i=>!uuid.test(i?.uuid||'')))throw Error('Readonly context requires max3 own UUIDs');
 if(!Number.isSafeInteger(timeoutMs)||timeoutMs<=0||timeoutMs>12000)throw Error('Readonly diagnostic deadline bounded12s');
 let timer;const work=Promise.all(inputs.map(async input=>{
  const [media,volume]=await Promise.allSettled([obs.req('GetMediaInputStatus',{inputUuid:input.uuid}),obs.req('GetInputVolume',{inputUuid:input.uuid})]);
  return {uuid:input.uuid,state:media.status==='fulfilled'&&states.has(media.value?.mediaState)?media.value.mediaState:null,inputVolumeMul:volume.status==='fulfilled'&&typeof volume.value?.inputVolumeMul==='number'&&Number.isFinite(volume.value.inputVolumeMul)?volume.value.inputVolumeMul:null,mediaReadOK:media.status==='fulfilled',volumeReadOK:volume.status==='fulfilled'};
 }));
 try{const rows=await Promise.race([work,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Readonly context deadline')),timeoutMs);})]);return {atMs:now(),completed:true,rows};}
 catch{return {atMs:now(),completed:false,rows:[],reason:'READONLY_CONTEXT_FAILED_OR_DEADLINE',noForce:true};}finally{clearTimeout(timer);}
}
