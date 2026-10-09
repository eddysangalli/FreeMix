// The aliases below are the public SimpleOutput profile values from the native OBS engine.
const aliases=[
 ['x264',['obs_x264'],'h264'],['x264_lowcpu',['obs_x264'],'h264'],
 ['nvenc',['obs_nvenc_h264_tex','ffmpeg_nvenc'],'h264'],
 ['nvenc_hevc',['obs_nvenc_hevc_tex','ffmpeg_hevc_nvenc'],'hevc'],
 ['nvenc_av1',['obs_nvenc_av1_tex'],'av1'],
 ['qsv',['obs_qsv11_v2'],'h264'],['qsv_av1',['obs_qsv11_av1'],'av1'],
 ['amd',['h264_texture_amf'],'h264'],['amd_hevc',['h265_texture_amf'],'hevc'],
 ['amd_av1',['av1_texture_amf'],'av1'],
 ['apple_h264',['com.apple.videotoolbox.videoencoder.ave.avc'],'h264'],
 ['apple_hevc',['com.apple.videotoolbox.videoencoder.ave.hevc'],'hevc'],
];
export const recordingFormats=['mkv','mp4','fragmented_mp4','hybrid_mp4','mov','fragmented_mov','hybrid_mov'];
export function normalizeProtocols(native){return(native.protocols||[]).map(p=>({...p,videoCodecs:Array.isArray(p.videoCodecs)?p.videoCodecs:String(p.videoCodecs||'').split(';').filter(Boolean),audioCodecs:Array.isArray(p.audioCodecs)?p.audioCodecs:String(p.audioCodecs||'').split(';').filter(Boolean)}));}
export function simpleEncoderChoices(native){
 const encoders=Array.isArray(native?.encoders)?native.encoders:[];
 return aliases.flatMap(([id,ids,codec])=>{const encoder=ids.map(v=>encoders.find(e=>e.id===v)).find(Boolean);return encoder?[{id,nativeId:encoder.id,codec,label:(encoder.name||encoder.label||encoder.id)+(id==='x264_lowcpu'?' — CPU reduzida':''),protocols:normalizeProtocols(native).filter(p=>p.available&&p.videoCodecs.includes(codec)).map(p=>p.id)}]:[];});
}
export function streamProtocol(service,server=''){
 if(service.streamServiceType==='freemix_hls'||/hls/i.test(service.streamServiceSettings?.service||''))return'hls';
 const protocol=/^(rtmps?|srt|rist):\/\//i.exec(server)?.[1]?.toLowerCase();return protocol||'native';
}
export function validateEncoder(before,id,category,protocol){
 const available=before.capabilities?.simpleEncoders;
 if(!Array.isArray(available)||!available.length)throw Error('O motor não informou os encoders disponíveis; atualize o status ou use as configurações completas');
 const encoder=available.find(e=>e.id===id);if(!encoder)throw Error('Este encoder não está disponível neste motor/computador');
 if(category==='streaming'){
  const output=before.capabilities.protocols?.find(p=>p.id===protocol&&p.available);
  if(!output||(output.videoCodecs||[]).every(c=>c!==encoder.codec))throw Error('Codec '+encoder.codec.toUpperCase()+' incompatível com '+String(protocol).toUpperCase());
 }
 return encoder;
}
export function validateStreamTarget(protocol,server){
 if(!['rtmp','rtmps','srt','rist','hls'].includes(protocol)||typeof server!=='string'||server.length>1000||/[\x00-\x20]/.test(server))throw Error('Protocolo ou endereço da transmissão inválido');
 let url;try{url=new URL(server);}catch{throw Error('Endereço completo da transmissão obrigatório');}
 if(!url.hostname||url.username||url.password||url.hash)throw Error('Endereço da transmissão inválido');
 if(protocol==='hls'){if(!['https:','http:'].includes(url.protocol)||![url.pathname,url.searchParams.get('file')||''].some(v=>v.toLowerCase().endsWith('.m3u8')))throw Error('HLS requer endpoint HTTP/HTTPS com playlist .m3u8 (caminho ou parâmetro file) para envio PUT');}
 else if(url.protocol!==protocol+':')throw Error('O endereço não corresponde ao protocolo escolhido');
 return server;
}
