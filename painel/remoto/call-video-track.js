// Isolated QA draft. Generated track only; no canvas/JPEG capture fallback.
export const VIDEO_BYTES=640*360*4;
const bad=code=>{throw Object.assign(new Error(code),{code});};
const supported=(n,d)=>(d===1&&(n===25||n===30))||(d===1001&&n===30000);
const positive=n=>typeof n==='bigint'&&n>0n&&n<=0xffffffffffffffffn;
export function videoCapabilities(scope=globalThis){
  const required={VideoFrame:typeof scope.VideoFrame==='function',MediaStreamTrackGenerator:typeof scope.MediaStreamTrackGenerator==='function',RTCPeerConnection:typeof scope.RTCPeerConnection==='function'};
  return {available:Object.values(required).every(Boolean),required};
}
export function decodeVideoMessage(data,{slot,generation,fpsNumerator=30,fpsDenominator=1}){
  if(!supported(fpsNumerator,fpsDenominator))bad('VIDEO_FPS');
  if(!(data instanceof ArrayBuffer)||data.byteLength!==64+VIDEO_BYTES)bad('VIDEO_WIRE_SIZE');
  const h=new DataView(data),bytes=new Uint8Array(data);
  if(bytes[0]!==70||bytes[1]!==77||bytes[2]!==86||bytes[3]!==70||h.getUint16(4,true)!==1||h.getUint16(6,true)!==64||h.getUint16(8,true)!==640||h.getUint16(10,true)!==360||h.getUint16(12,true)!==1||h.getUint16(14,true)!==0||h.getUint32(16,true)!==2560||h.getUint32(20,true)!==VIDEO_BYTES||h.getUint32(24,true)!==slot||h.getUint32(28,true)!==generation||h.getUint32(48,true)!==fpsNumerator||h.getUint32(52,true)!==fpsDenominator||h.getBigUint64(56,true)!==0n)bad('VIDEO_WIRE_HEADER');
  return {slot,generation,fpsNumerator,fpsDenominator,sequence:h.getBigUint64(32,true),pts:h.getBigUint64(40,true),rgba:bytes.subarray(64)};
}
// One write-in-flight and one latest pending. No capture timer; offer is native-frame-driven.
export class BoundedTrackWriter {
  constructor({writer,createFrame,slot,generation,fpsNumerator=30,fpsDenominator=1,ptsBase=null,onFault=()=>{},deadlineMs=2000}){
    if(!supported(fpsNumerator,fpsDenominator)||!writer||typeof writer.write!=='function'||typeof createFrame!=='function'||!Number.isInteger(slot)||slot<0||slot>1||!Number.isInteger(generation)||generation<1||generation>0xffffffff||!Number.isFinite(deadlineMs)||deadlineMs<10||deadlineMs>5000||(ptsBase!==null&&(typeof ptsBase!=='bigint'||ptsBase<0n)))bad('WRITER_CONFIG');
    this.fpsNumerator=fpsNumerator;this.fpsDenominator=fpsDenominator;this.writer=writer;this.createFrame=createFrame;this.slot=slot;this.generation=generation;this.ptsBase=ptsBase;this.onFault=onFault;this.deadlineMs=deadlineMs;
    this.pendingBuffer=new Uint8Array(VIDEO_BYTES);this.pending=null;this.active=null;this.closed=false;this.lastSequence=0n;this.lastPts=null;this.lastTimestamp=-1;
    this.metrics={offered:0,written:0,dropped:0,faults:0,closedFrames:0,maxPending:0};
  }
  offer(frame){
    if(this.closed)return false;
    if(frame.slot!==this.slot||frame.generation!==this.generation||frame.fpsNumerator!==this.fpsNumerator||frame.fpsDenominator!==this.fpsDenominator)bad('WRITER_GENERATION');
    if(!positive(frame.sequence)||typeof frame.pts!=='bigint'||frame.pts<0n||frame.pts>0xffffffffffffffffn||!(frame.rgba instanceof Uint8Array)||frame.rgba.byteLength!==VIDEO_BYTES)bad('WRITER_FRAME');
    if(frame.sequence<=this.lastSequence||(this.lastPts!==null&&frame.pts<=this.lastPts))bad('WRITER_CLOCK');
    if(this.ptsBase===null)this.ptsBase=frame.pts;
    const delta=frame.pts-this.ptsBase;if(delta<0n||delta/1000n>BigInt(Number.MAX_SAFE_INTEGER))bad('WRITER_TIMESTAMP');
    const timestamp=Number(delta/1000n);if(timestamp<=this.lastTimestamp)bad('WRITER_TIMESTAMP');
    this.lastSequence=frame.sequence;this.lastPts=frame.pts;this.lastTimestamp=timestamp;this.metrics.offered++;
    if(this.pending)this.metrics.dropped++;
    this.pendingBuffer.set(frame.rgba);this.pending={timestamp,sequence:frame.sequence,pts:frame.pts};this.metrics.maxPending=1;
    this.drain();return true;
  }
  drain(){
    if(this.closed||this.active||!this.pending)return;
    const pending=this.pending;this.pending=null;let videoFrame;
    try{videoFrame=this.createFrame(this.pendingBuffer,{format:'RGBA',codedWidth:640,codedHeight:360,timestamp:pending.timestamp,duration:Number(pending.sequence*1000000n*BigInt(this.fpsDenominator)/BigInt(this.fpsNumerator)-(pending.sequence-1n)*1000000n*BigInt(this.fpsDenominator)/BigInt(this.fpsNumerator))});}
    catch(error){this.fault(error);return;}
    // VideoFrame(raw BufferSource) copies pixels by contract. Only one such frame is retained.
    const active={videoFrame,closed:false,timer:null};this.active=active;
    const closeFrame=()=>{if(active.closed)return;active.closed=true;try{videoFrame.close();}finally{this.metrics.closedFrames++;}};
    active.closeFrame=closeFrame;
    active.timer=setTimeout(()=>this.fault(Object.assign(new Error('VIDEO_WRITE_DEADLINE'),{code:'VIDEO_WRITE_DEADLINE'})),this.deadlineMs);
    Promise.resolve().then(()=>{if(this.closed)throw Object.assign(new Error('VIDEO_WRITER_CLOSED'),{code:'VIDEO_WRITER_CLOSED'});return this.writer.write(videoFrame);}).then(()=>{
      if(!this.closed)this.metrics.written++;
    },error=>{if(!this.closed)this.fault(error);}).finally(()=>{
      clearTimeout(active.timer);closeFrame();if(this.active===active)this.active=null;if(!this.closed)this.drain();
    });
  }
  fault(error){if(this.closed)return;this.metrics.faults++;this.close(error);try{this.onFault({code:error?.code||'VIDEO_WRITE_FAILED'});}catch{/* observers never retain the stream */}}
  close(reason=Object.assign(new Error('VIDEO_WRITER_CLOSED'),{code:'VIDEO_WRITER_CLOSED'})){
    if(this.closed)return;this.closed=true;if(this.pending){this.pending=null;this.metrics.dropped++;}this.pendingBuffer.fill(0);
    if(this.active){clearTimeout(this.active.timer);this.active.closeFrame();}
    try{Promise.resolve(this.writer.abort?.(reason)).catch(()=>{});}catch{/* bounded teardown, no retry */}
  }
  get pendingFrames(){return (this.active?1:0)+(this.pending?1:0);}
}
export function generatedVideoTrack(scope=globalThis){
  const capabilities=videoCapabilities(scope);if(!capabilities.available)bad('VIDEO_CAPABILITY_UNAVAILABLE');
  const track=new scope.MediaStreamTrackGenerator({kind:'video'});
  if(!track.writable||typeof track.writable.getWriter!=='function'){track.stop();bad('VIDEO_WRITABLE_UNAVAILABLE');}
  return {track,writer:track.writable.getWriter(),createFrame:(data,init)=>new scope.VideoFrame(data,init),capabilities};
}
