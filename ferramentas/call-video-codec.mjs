// QA draft, no product imports. Fixed RGBA contract; borrowed payload valid only during callback.
import {timingSafeEqual} from 'node:crypto';
export const WIDTH=640,HEIGHT=360,STRIDE=2560,PAYLOAD=921600,HEADER=64,AUTH=48;
const fail=code=>{throw Object.assign(new Error(code),{code});};
const uint=n=>Number.isInteger(n)&&n>=0&&n<=0xffffffff;
export function authPacket({token,slot,generation}){
  if(!Buffer.isBuffer(token)||token.length!==32||!uint(slot)||!uint(generation))fail('AUTH_CONFIG');
  const b=Buffer.alloc(AUTH);b.write('FMVA');b.writeUInt32LE(1,4);b.writeUInt32LE(slot,8);b.writeUInt32LE(generation,12);token.copy(b,16);return b;
}
const supportedFps=(num,den)=>(den===1&&(num===25||num===30))||(den===1001&&num===30000);
export function frameHeader({slot,generation,sequence,pts,fpsNumerator=30,fpsDenominator=1}){
  if(!supportedFps(fpsNumerator,fpsDenominator))fail("FPS_CONTRACT");
  if(!uint(slot)||!uint(generation)||typeof sequence!=='bigint'||sequence<1n||sequence>0xffffffffffffffffn||typeof pts!=='bigint'||pts<0n||pts>0xffffffffffffffffn)fail('FRAME_CONFIG');
  const b=Buffer.alloc(HEADER);b.write('FMVF');b.writeUInt16LE(1,4);b.writeUInt16LE(HEADER,6);b.writeUInt16LE(WIDTH,8);b.writeUInt16LE(HEIGHT,10);b.writeUInt16LE(1,12);b.writeUInt32LE(STRIDE,16);b.writeUInt32LE(PAYLOAD,20);b.writeUInt32LE(slot,24);b.writeUInt32LE(generation,28);b.writeBigUInt64LE(sequence,32);b.writeBigUInt64LE(pts,40);b.writeUInt32LE(fpsNumerator,48);b.writeUInt32LE(fpsDenominator,52);return b;
}
export class FrameDecoder {
  constructor({token,slot,generation,onFrame,fpsNumerator=30,fpsDenominator=1}){
    if(!supportedFps(fpsNumerator,fpsDenominator))fail("FPS_CONTRACT");this.fpsNumerator=fpsNumerator;this.fpsDenominator=fpsDenominator;
    if(!Buffer.isBuffer(token)||token.length!==32||!uint(slot)||!uint(generation)||typeof onFrame!=='function')fail('DECODER_CONFIG');
    this.token=Buffer.from(token);this.slot=slot;this.generation=generation;this.onFrame=onFrame;
    this.auth=Buffer.alloc(AUTH);this.header=Buffer.alloc(HEADER);this.rgba=Buffer.alloc(PAYLOAD);
    this.stage='auth';this.position=0;this.sequence=0n;this.pts=null;this.frames=0;this.closed=false;
    this.allocatedPayloadBytes=PAYLOAD;
  }
  feed(chunk){
    if(this.closed)fail('DECODER_CLOSED');if(!Buffer.isBuffer(chunk))fail('CHUNK_TYPE');
    try{let pos=0;while(pos<chunk.length){
      const target=this.stage==='auth'?this.auth:this.stage==='header'?this.header:this.rgba;
      const count=Math.min(target.length-this.position,chunk.length-pos);chunk.copy(target,this.position,pos,pos+count);pos+=count;this.position+=count;
      if(this.position!==target.length)continue;
      this.position=0;
      if(this.stage==='auth'){
        if(this.auth.toString('ascii',0,4)!=='FMVA'||this.auth.readUInt32LE(4)!==1||this.auth.readUInt32LE(8)!==this.slot||this.auth.readUInt32LE(12)!==this.generation||!timingSafeEqual(this.auth.subarray(16),this.token))fail('AUTH_REJECTED');
        this.auth.fill(0);this.token.fill(0);this.stage='header';continue;
      }
      if(this.stage==='header'){
        const h=this.header;
        if(h.toString('ascii',0,4)!=='FMVF'||h.readUInt16LE(4)!==1||h.readUInt16LE(6)!==HEADER||h.readUInt16LE(8)!==WIDTH||h.readUInt16LE(10)!==HEIGHT||h.readUInt16LE(12)!==1||h.readUInt16LE(14)!==0||h.readUInt32LE(16)!==STRIDE||h.readUInt32LE(20)!==PAYLOAD||h.readUInt32LE(24)!==this.slot||h.readUInt32LE(28)!==this.generation||h.readUInt32LE(48)!==this.fpsNumerator||h.readUInt32LE(52)!==this.fpsDenominator||h.readBigUInt64LE(56)!==0n)fail('HEADER_REJECTED');
        const sequence=h.readBigUInt64LE(32),pts=h.readBigUInt64LE(40);
        if(sequence<=this.sequence||(this.pts!==null&&pts<=this.pts))fail('REPLAY_OR_CLOCK');
        this.next={slot:this.slot,generation:this.generation,sequence,pts,fpsNumerator:this.fpsNumerator,fpsDenominator:this.fpsDenominator};this.stage='payload';continue;
      }
      this.sequence=this.next.sequence;this.pts=this.next.pts;this.frames++;
      // Consumer must copy/lease to its fixed pool synchronously; no retained view of this buffer.
      this.onFrame({...this.next,rgba:this.rgba});this.next=null;this.stage='header';
    }}catch(e){this.close();throw e;}
  }
  end(){if(this.closed)return;if(this.stage!=='header'||this.position!==0){this.close();fail('TRUNCATED_STREAM');}this.close();}
  close(){this.closed=true;this.token.fill(0);this.auth.fill(0);this.next=null;}
}

// One immutable in-flight buffer plus one latest pending buffer. Never grows with consumer delay.
export class LatestFrames {
  constructor(){this.buffers=[Buffer.alloc(PAYLOAD),Buffer.alloc(PAYLOAD)];this.pending=null;this.inflight=null;this.dropped=0;this.offered=0;this.delivered=0;this.closed=false;this.allocatedPayloadBytes=PAYLOAD*2;}
  offer(frame){
    if(this.closed)return false;if(!Buffer.isBuffer(frame.rgba)||frame.rgba.length!==PAYLOAD)fail('PAYLOAD_SIZE');
    const slot=this.pending?.poolSlot??(this.inflight?.poolSlot===0?1:0);
    if(this.pending)this.dropped++;
    frame.rgba.copy(this.buffers[slot]);this.pending={slot:frame.slot,generation:frame.generation,sequence:frame.sequence,pts:frame.pts,fpsNumerator:frame.fpsNumerator,fpsDenominator:frame.fpsDenominator,poolSlot:slot};this.offered++;return true;
  }
  take(){
    if(this.closed||this.inflight||!this.pending)return null;
    const meta=this.pending;this.pending=null;
    const lease={...meta,rgba:this.buffers[meta.poolSlot],released:false};this.inflight=lease;this.delivered++;
    return lease;
  }
  release(lease){if(!lease||lease!==this.inflight||lease.released)fail('LEASE_INVALID');lease.released=true;this.inflight=null;}
  close(){this.closed=true;this.pending=null;/* a borrowed buffer stays valid until its owner releases */}
  get queuedBytes(){return (this.pending?PAYLOAD:0)+(this.inflight?PAYLOAD:0);}
}
