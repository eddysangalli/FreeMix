// Bounded stereo queue; resample from the engine rate to AudioContext rate.
class CallPCM extends AudioWorkletProcessor {
 constructor(){super();this.queue=[];this.offset=0;this.rate=48000;this.samples=0;this.ticks=0;this.dropped=0;this.port.onmessage=e=>{const p=e.data;if(p.flush){this.queue=[];this.offset=0;this.samples=0;return;}if(!Number.isFinite(p.rate)||p.rate<8000||p.rate>192000||!(p.pcm instanceof Float32Array)||p.pcm.length%2||p.pcm.length>p.rate)return;if(p.rate!==this.rate){this.queue=[];this.samples=0;this.offset=0;}this.rate=p.rate;this.queue.push(p.pcm);this.samples+=p.pcm.length/2;while(this.samples>this.rate*.25&&this.queue.length>1){this.samples-=this.queue.shift().length/2;this.offset=0;this.dropped++;}};}
 process(inputs,outputs){const channels=outputs[0];if(!channels?.length)return true;for(let f=0;f<channels[0].length;f++){
  while(this.queue.length&&this.offset>=this.queue[0].length/2){const size=this.queue.shift().length/2;this.samples-=size;this.offset-=size;}
  const data=this.queue[0],index=Math.floor(this.offset);
  for(let ch=0;ch<channels.length;ch++){const v=data?data[index*2+Math.min(ch,1)]:0;channels[ch][f]=Number.isFinite(v)?Math.max(-1,Math.min(1,v)):0;}
  if(data)this.offset+=this.rate/sampleRate;
 }if(++this.ticks%300===0)this.port.postMessage({type:'diagnostic',queuedMs:Math.max(0,(this.samples-this.offset)/this.rate*1000),dropped:this.dropped});return true;}
}
registerProcessor('freemix-call-pcm',CallPCM);
