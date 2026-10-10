// Own synthetic QA observers. Never modify PCM, AudioData, routing or writable ownership.
export function pcmMetrics(){return{blocks:0,frames:0,samples:0,nonzero:0,aboveToneThreshold:0,nonfinite:0,peak:0,squares:0,rms:0,firstTimestamp:null,lastTimestamp:null,backwards:0,shapes:[],shapesTruncated:0,readbackErrors:0};}
export function observePcm(m,bytes,{frames,channels,timestamp}){
 if(!(bytes instanceof Uint8Array)||!Number.isInteger(frames)||frames<1||frames>4800||channels!==2||bytes.byteLength!==frames*channels*4||!Number.isSafeInteger(timestamp)||timestamp<0){m.readbackErrors++;return false;}
 m.blocks++;m.frames+=frames;m.firstTimestamp??=timestamp;if(m.lastTimestamp!==null&&timestamp<=m.lastTimestamp)m.backwards++;m.lastTimestamp=timestamp;
 const key=frames+'/'+channels,previous=m.shapes.at(-1);if(previous?.key!==key){if(m.shapes.length<16)m.shapes.push({key,frames,channels});else m.shapesTruncated++;}
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);for(let i=0;i<bytes.byteLength;i+=4){const value=view.getFloat32(i,true);m.samples++;if(!Number.isFinite(value)){m.nonfinite++;continue;}const amplitude=Math.abs(value);if(amplitude>0)m.nonzero++;if(amplitude>.1)m.aboveToneThreshold++;m.peak=Math.max(m.peak,amplitude);m.squares+=value*value;}m.rms=Math.sqrt(m.squares/m.samples);return true;
}
export function observeAudioData(m,data){try{const size=data.allocationSize({planeIndex:0,format:'f32'});if(size<1||size>4800*2*4)throw Error('DIAG_READBACK_BOUND');const bytes=new Uint8Array(size);data.copyTo(bytes,{planeIndex:0,format:'f32'});return observePcm(m,bytes,{frames:data.numberOfFrames,channels:data.numberOfChannels,timestamp:data.timestamp});}catch{m.readbackErrors++;return false;}}
export function trackState(track){return track?{kind:track.kind,enabled:track.enabled,muted:track.muted,readyState:track.readyState}:null;}
export function finiteTrackRecord(list,role,event,track,atMs){const row={role,event,atMs,...trackState(track)};if(list.length<64)list.push(row);return row;}
export function heartbeatStore(){return{messages:0,truncated:0,first:null,last:null,rows:[],invalid:0};}
export function acceptHeartbeat(store,m){
 const keys=['processCalls','emptyCalls','inputFrames','inputSamples','nonzeroSamples','aboveToneThreshold','nonfiniteSamples','maxInputChannels','maxInputFrames','peak','rms','frame','contextTime','sampleRate','emitted'];
 if(m?.type!=='audio-diagnostic'||!['receiver','synthetic-local'].includes(m.role)||keys.some(k=>typeof m[k]!=='number'||!Number.isFinite(m[k])||m[k]<0)||m.emitted>128||m.maxInputChannels>32||m.maxInputFrames>4096){store.invalid++;return false;}
 store.messages++;store.first??={...m};store.last={...m};if(store.rows.length<128)store.rows.push({...m});else store.truncated++;return true;
}
