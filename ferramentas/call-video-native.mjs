// Isolated draft. No Native start outside explicit local opt-in + publisher capability.
import net from 'node:net';
import {randomBytes,timingSafeEqual} from 'node:crypto';
import {FrameDecoder,frameHeader,HEADER,PAYLOAD} from './call-video-codec.mjs';
const PACKET=HEADER+PAYLOAD,CONTRACT='rgba640x360-derived-fps-opaque-pts-v1';
const fail=code=>Object.assign(Error(code),{code});
const supported=(n,d)=>(d===1&&(n===25||n===30))||(d===1001&&n===30000);
function bounded(promise,ms){let timer;return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(fail('NATIVE_VIDEO_ACK_DEADLINE')),ms);})]).finally(()=>clearTimeout(timer));}
// Two fixed packet buffers per publisher: immutable in-flight + replaceable latest.
export class VideoBinaryRelay{
 constructor(ws,onFault=()=>{}){this.ws=ws;this.onFault=onFault;this.buffers=[Buffer.alloc(PACKET),Buffer.alloc(PACKET)];this.pending=null;this.active=null;this.closed=false;this.metrics={offered:0,sent:0,replaced:0,maxPending:0};}
 offer(frame){if(this.closed)return;this.metrics.offered++;const slot=this.pending??(this.active===0?1:0);if(this.pending!==null)this.metrics.replaced++;
  frameHeader({slot:frame.slot,generation:frame.generation,sequence:frame.sequence,pts:frame.pts,fpsNumerator:frame.fpsNumerator,fpsDenominator:frame.fpsDenominator}).copy(this.buffers[slot]);frame.rgba.copy(this.buffers[slot],HEADER);this.pending=slot;this.metrics.maxPending=Math.max(this.metrics.maxPending,(this.active!==null?1:0)+1);this.flush();
 }
 flush(){if(this.closed||this.active!==null||this.pending===null)return;
  if(this.ws.readyState!==1||this.ws.bufferedAmount+PACKET>2*PACKET){this.close();this.onFault('VIDEO_WS_BACKPRESSURE');return;}
  const slot=this.pending;this.pending=null;this.active=slot;
  this.timer=setTimeout(()=>{this.close();this.onFault('VIDEO_WS_SEND_DEADLINE');},500);this.timer.unref?.();
  try{this.ws.send(this.buffers[slot],{binary:true},error=>{clearTimeout(this.timer);if(this.closed)return;this.active=null;if(error){this.close();this.onFault('VIDEO_WS_SEND_FAILED');}else{this.metrics.sent++;this.flush();}});}catch{this.close();this.onFault('VIDEO_WS_SEND_FAILED');}
 }
 close(){if(this.closed)return;this.closed=true;clearTimeout(this.timer);this.pending=null;/* in-flight bytes stay immutable until socket releases them */}
}
export class NativeCallVideo{
 constructor(vendor,{onMode=()=>{},getConnection=()=>null,deadlineMs=1500,pulseMs=1000}={}){this.vendor=vendor;this.getConnection=getConnection;this.connectionIdentity=null;this.onMode=onMode;this.deadlineMs=deadlineMs;this.entries=new Map();this.blocked=new Map();this.stops=new Set();this.epoch=0;this.enabled=false;this.scope=null;this.closed=false;this.capability=null;this.lastCapability=0;this.busy=false;this.last={routes:[],clients:new Map(),inputs:[]};this.timer=setInterval(()=>this.pulse(),pulseMs);this.timer.unref?.();}
 setEnabled(value){this.enabled=value===true;if(!this.enabled){this.blocked.clear();for(const e of [...this.entries.values()])this.retire(e,'EXPERIMENT_DISABLED');}}
 retrySource(uuid){if(!this.enabled||this.closed)return false;return this.blocked.delete(uuid);} // Explicit future user action only.
 status(){return {experimental:true,enabled:this.enabled,audioIncluded:false,avSyncProven:false,contract:CONTRACT,nativeAvailable:this.capability?.available===true,sources:[...this.entries.values()].map(e=>({sourceUuid:e.uuid,stage:e.frames?'receiving':e.decoder?'authenticated':e.owned?'accepted':'starting',slot:e.owned?.slot??null,generation:e.owned?.generation??null,clients:e.clients.size,frames:e.frames,fault:e.fault||null}))};}
 mode(client,mode,extra={}){if(client.videoMode===mode&&client.videoSlot===extra.slot&&client.videoGeneration===extra.generation&&client.videoReason===(extra.reason||null))return;client.videoMode=mode;client.videoSlot=extra.slot;client.videoGeneration=extra.generation;client.videoReason=extra.reason||null;try{this.onMode(client,{mode,audioIncluded:false,avSyncProven:false,...extra});}catch{/* observer cannot retain Native session */}}
 async reconcile(routes,clients,inputs,scope){this.last={routes,clients,inputs};const connection=this.getConnection();if(this.scope!==scope||this.connectionIdentity!==connection){this.connectionIdentity=connection;this.scope=scope;this.epoch++;for(const e of [...this.entries.values()])this.retire(e,'SCOPE_CHANGED');this.blocked.clear();this.capability=null;}
  const desired=new Map();for(const route of routes){const client=clients.get(route.key);if(!client||client.ws.readyState!==1)continue;
   if(route.video==='program'||!route.video){this.mode(client,'virtual-camera');continue;}
   const input=inputs.find(i=>i.key===route.video);
   if(!this.enabled||!client.videoCapability?.experimentalOptIn||!client.videoCapability?.available||!input){this.mode(client,'jpeg5');continue;}
   // p.state.inputs key is sceneUuid in current Production, not first child/inputUuid.
   const uuid=input.key;if(typeof uuid!=='string'||!uuid||uuid.length>128){this.mode(client,'jpeg5');continue;}
   if(this.blocked.has(uuid)){this.mode(client,'jpeg5',{reason:this.blocked.get(uuid)});continue;}
   if(!desired.has(uuid))desired.set(uuid,new Map());desired.get(uuid).set(route.key,client);
  }
  for(const e of [...this.entries.values()]){const wanted=desired.get(e.uuid);for(const [key,row]of e.clients)if(!wanted?.has(key)||wanted.get(key)!==row.client){row.relay.close();e.clients.delete(key);}
   if(!wanted?.size)this.retire(e,'NO_SUBSCRIBERS');else this.attach(e,wanted);
  }
  if(this.closed||!connection||!this.enabled||!desired.size||this.busy)return;this.busy=true;const epoch=this.epoch;
  try{if(!this.capability||Date.now()-this.lastCapability>2000){const cap=await bounded(this.dispatch({action:'state'},connection),this.deadlineMs);if(epoch!==this.epoch||this.closed||connection!==this.getConnection())return;this.capability=cap;this.lastCapability=Date.now();}
   const cap=this.capability;if(cap?.available!==true||cap.contract!==CONTRACT||cap.experimental!==true||cap.audioIncluded!==false||!supported(cap.outputFpsNumerator,cap.outputFpsDenominator)){for(const wanted of desired.values())for(const c of wanted.values())this.mode(c,'jpeg5',{reason:'NATIVE_CAPABILITY_UNAVAILABLE'});return;}
   for(const [uuid,wanted]of desired){if(epoch!==this.epoch||this.closed||!this.enabled)return;if(this.entries.has(uuid))continue;
    if(this.entries.size>=2){for(const c of wanted.values())this.mode(c,'jpeg5',{reason:'UNIQUE_SOURCE_LIMIT'});continue;}
    await this.start(uuid,wanted,{num:cap.outputFpsNumerator,den:cap.outputFpsDenominator},epoch,connection);
   }
  }catch{for(const wanted of desired.values())for(const c of wanted.values())if(![...this.entries.values()].some(e=>e.clients.has(c.key)))this.mode(c,'jpeg5',{reason:'NATIVE_VIDEO_UNCONFIRMED'});}finally{this.busy=false;}
 }
 attach(e,wanted){for(const [key,client]of wanted)if(!e.clients.has(key)){const relay=new VideoBinaryRelay(client.ws,code=>{client.ws.close();this.unsubscribe(key,client);});e.clients.set(key,{client,relay});if(e.owned)this.mode(client,'continuous',{slot:e.owned.slot,generation:e.owned.generation,fpsNumerator:e.fps.num,fpsDenominator:e.fps.den});}}
 async start(uuid,wanted,fps,epoch,connection){wanted=new Map([...wanted].filter(([key,client])=>this.last.clients.get(key)===client&&client.ws.readyState===1&&this.last.routes.some(r=>r.key===key&&r.video===uuid)));if(!wanted.size)return;const e={uuid,fps,epoch,connection,token:randomBytes(32),clients:new Map(),attempts:new Set(),owned:null,auth:null,held:[],heldBytes:0,frames:0,cancelled:false};this.entries.set(uuid,e);this.attach(e,wanted);
  e.server=net.createServer(socket=>this.connection(e,socket));e.server.on('error',()=>this.retire(e,'LISTENER_FAILED'));e.server.once('listening',()=>{if(e.cancelled)e.server.close();});
  try{await new Promise((resolve,reject)=>{e.server.once('error',reject);e.server.listen(0,'127.0.0.1',resolve);});if(e.cancelled||epoch!==this.epoch){this.retire(e,'STALE_START');return;}
   const port=e.server.address().port,request={action:'start',experimentalContinuousVideo:true,sourceUuid:uuid,loopbackPort:port,secretHex:e.token.toString('hex')};
   // Late accepted ACK still stops the exact owned slot; mutations are never retried.
   const operation=Promise.resolve().then(()=>this.dispatch(request,e.connection));operation.then(ack=>{delete request.secretHex;if(e.cancelled&&this.validAck(ack))this.stopOnce(e,ack);},()=>{delete request.secretHex;});
   const ack=await bounded(operation,this.deadlineMs);delete request.secretHex;
   if(!this.validAck(ack))throw fail('NATIVE_VIDEO_ACK_INVALID');e.owned={slot:ack.slot,generation:ack.generation};e.lastFrame=Date.now();
   if(e.cancelled||epoch!==this.epoch||!e.clients.size){this.stopOnce(e,e.owned);return;}
   this.activate(e);if(e.cancelled)return;if(!e.decoder){e.authTimer=setTimeout(()=>this.retire(e,'NATIVE_VIDEO_AUTH_DEADLINE'),this.deadlineMs);e.authTimer.unref();}for(const {client}of e.clients.values())this.mode(client,'continuous',{...e.owned,fpsNumerator:fps.num,fpsDenominator:fps.den});
  }catch{this.retire(e,'NATIVE_VIDEO_START_FAILED');}
 }
 validAck(a){return a?.success===true&&Number.isInteger(a.slot)&&a.slot>=0&&a.slot<2&&Number.isInteger(a.generation)&&a.generation>0&&a.generation<=0xffffffff;}
 connection(e,socket){if(e.connection!==this.getConnection()||e.cancelled||e.socket||e.attempts.size>=2){socket.destroy();return;}e.attempts.add(socket);let auth=Buffer.alloc(48),position=0,authenticated=false;
  const timeout=setTimeout(()=>socket.destroy(),500);timeout.unref();socket.on('error',()=>{});
  socket.on('close',()=>{clearTimeout(timeout);e.attempts.delete(socket);if(e.socket===socket&&!e.cancelled)this.retire(e,'NATIVE_VIDEO_DISCONNECTED');});
  socket.on('data',chunk=>{try{
   if(!authenticated){const n=Math.min(48-position,chunk.length);chunk.copy(auth,position,0,n);position+=n;chunk=chunk.subarray(n);if(position<48)return;
    if(auth.toString('ascii',0,4)!=='FMVA'||auth.readUInt32LE(4)!==1||auth.readUInt32LE(8)>1||!auth.readUInt32LE(12)||!timingSafeEqual(auth.subarray(16),e.token)||e.socket)throw fail('NATIVE_VIDEO_AUTH_REJECTED');
    authenticated=true;clearTimeout(timeout);e.socket=socket;e.auth=auth;for(const other of e.attempts)if(other!==socket)other.destroy();this.activate(e);
   }
   if(!chunk.length)return;if(e.decoder)e.decoder.feed(chunk);else{if(e.heldBytes+chunk.length>2*PACKET)throw fail('NATIVE_VIDEO_PREACK_BOUND');e.held.push(Buffer.from(chunk));e.heldBytes+=chunk.length;socket.pause();}
  }catch{socket.destroy();if(authenticated)this.retire(e,'NATIVE_VIDEO_PROTOCOL_FAILED');}finally{if(e.decoder&&!e.cancelled)socket.resume();}});
 }
 activate(e){if(e.cancelled||e.decoder||!e.owned||!e.auth)return;
  if(e.auth.readUInt32LE(8)!==e.owned.slot||e.auth.readUInt32LE(12)!==e.owned.generation){this.retire(e,'NATIVE_VIDEO_GENERATION_MISMATCH');return;}
  clearTimeout(e.authTimer);e.decoder=new FrameDecoder({token:e.token,...e.owned,fpsNumerator:e.fps.num,fpsDenominator:e.fps.den,onFrame:frame=>{if(e.connection!==this.getConnection()){this.retire(e,'NATIVE_VIDEO_CONNECTION_CHANGED');return;}e.frames++;e.lastFrame=Date.now();for(const {relay}of e.clients.values())relay.offer(frame);}});
  try{e.decoder.feed(e.auth);e.auth.fill(0);e.token.fill(0);for(const chunk of e.held)e.decoder.feed(chunk);e.held=[];e.heldBytes=0;e.socket.resume();}catch{this.retire(e,'NATIVE_VIDEO_PROTOCOL_FAILED');}
 }
 unsubscribe(key,client){for(const e of [...this.entries.values()]){const row=e.clients.get(key);if(row&&(!client||row.client===client)){row.relay.close();e.clients.delete(key);}if(!e.clients.size)this.retire(e,'NO_SUBSCRIBERS');}}
 stopOwned(owned,connection){const op=(async()=>{try{await bounded(this.dispatch({action:'stop',experimentalContinuousVideo:true,slot:owned.slot,generation:owned.generation},connection),this.deadlineMs);}catch{/* uncertain stop: Native lease5s remains required; no repeated mutation */}})();this.stops.add(op);op.finally(()=>this.stops.delete(op));return op;}
 stopOnce(e,owned){if(e.stopRequested)return;e.stopRequested=true;return this.stopOwned(owned,e.connection);}
 retire(e,code){if(e.cancelled)return;e.cancelled=true;e.fault=code;clearTimeout(e.authTimer);this.entries.delete(e.uuid);if(!['EXPERIMENT_DISABLED','SCOPE_CHANGED','NO_SUBSCRIBERS','DISPOSED','STALE_START'].includes(code))this.blocked.set(e.uuid,code);for(const {client,relay}of e.clients.values()){relay.close();this.mode(client,'jpeg5',{reason:code});}e.clients.clear();e.decoder?.close();e.auth?.fill(0);e.token.fill(0);e.held=[];e.heldBytes=0;for(const socket of e.attempts)socket.destroy();e.socket?.destroy();if(e.server?.listening)e.server.close();if(e.owned)this.stopOnce(e,e.owned);}
 async dispatch(request,connection){if(!connection||connection!==this.getConnection())throw fail('NATIVE_VIDEO_CONNECTION_CHANGED');const result=await this.vendor(request,connection);if(connection!==this.getConnection())throw fail('NATIVE_VIDEO_CONNECTION_CHANGED');if(result?.success===false)throw fail('NATIVE_VIDEO_REFUSED');return result;}
 async pulse(){for(const e of [...this.entries.values()]){if(e.cancelled||!e.owned||!e.clients.size||e.pulsing)continue;if(e.decoder&&Date.now()-e.lastFrame>2000){this.retire(e,'NATIVE_VIDEO_FRAME_DEADLINE');continue;}e.pulsing=true;try{await bounded(this.dispatch({action:'pulse',experimentalContinuousVideo:true,...e.owned},e.connection),this.deadlineMs);}catch{this.retire(e,'NATIVE_VIDEO_LEASE_UNCONFIRMED');}finally{e.pulsing=false;}}}
 async dispose(){if(this.closed)return;this.closed=true;this.epoch++;clearInterval(this.timer);for(const e of [...this.entries.values()])this.retire(e,'DISPOSED');await Promise.allSettled([...this.stops]);}
}
