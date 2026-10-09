// The caller has already verified and, for external imports, sanitized the snapshot.
// Restore configuration only: the engine starts no destination here.
const fields=['protocol','enhancedRtmp','name','server','key','mode','sourceUuid','width','height','bitrate','audioTrack','audioSourceUuid','mixId','stingerAudio','fill','encoder','chroma','alphaMode','fpsDivisor','overlaysMask','overlayChannels'];
export function recoveredNativeDestinations(destinations,sceneUUIDs,inputUUIDs){
 if(!Array.isArray(destinations)||destinations.length!==4)throw Error('Configuração de destinos inválida');
 return destinations.map(d=>{
  if(!d||typeof d!=='object'||Array.isArray(d))throw Error('Destino recuperado inválido');
  if(d.mode==='source'&&d.sourceUuid&&!sceneUUIDs.has(d.sourceUuid))throw Error('UUID de saída não existe na cópia recuperada: '+d.sourceUuid);
  if(d.audioSourceUuid&&!inputUUIDs.has(d.audioSourceUuid))throw Error('Fonte de áudio da saída não existe na cópia recuperada: '+d.audioSourceUuid);
  return {...Object.fromEntries(fields.filter(k=>d[k]!==undefined).map(k=>[k,d[k]])),enabled:false,autoStart:false};
 });
}
