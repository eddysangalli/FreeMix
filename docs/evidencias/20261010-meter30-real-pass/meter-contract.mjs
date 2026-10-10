import assert from 'node:assert/strict';
export const METER_SUBSCRIPTION=1<<16;
export function toneWav(frequency,duration=6){
 assert([440,660,880].includes(frequency));assert.equal(duration,6);const rate=48000,frames=rate*duration,b=Buffer.alloc(44+frames*4);
 b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(2,22);b.writeUInt32LE(rate,24);b.writeUInt32LE(rate*4,28);b.writeUInt16LE(4,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(frames*4,40);
 for(let i=0;i<frames;i++){const sample=Math.round(8192*Math.sin(2*Math.PI*frequency*i/rate));b.writeInt16LE(sample,44+i*4);b.writeInt16LE(sample,46+i*4);}return b;
}
export function validateRows(data){
 assert(Array.isArray(data?.inputs));assert(data.inputs.length<=1000);const own=data.inputs.filter(x=>/^QA Meter Own[ABC]$/.test(x?.inputName||''));assert(new Set(own.map(x=>x.inputUuid)).size===own.length);
 return own.map(x=>{assert(typeof x.inputUuid==='string'&&x.inputUuid.length>10);assert(Array.isArray(x.inputLevelsMul)&&x.inputLevelsMul.length<=8);for(const channel of x.inputLevelsMul){assert(Array.isArray(channel)&&channel.length===3);assert(channel.every(n=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=5));}const levels=x.inputLevelsMul.flat();return {name:x.inputName,uuid:x.inputUuid,channels:x.inputLevelsMul.length,min:levels.length?Math.min(...levels):null,max:levels.length?Math.max(...levels):null,samples:x.inputLevelsMul.slice(0,2).map(ch=>ch.map(n=>Number(n.toFixed(6))))};});
}
export function createObservation(label,now){
 const state={label,identified:false,closed:false,events:0,firstMs:null,lastMs:null,lastRows:[],samples:[],error:null};
 return {state,onEvent(type,data){if(type!=='InputVolumeMeters')return;try{const at=Math.round(now());const rows=validateRows(data);state.events++;state.firstMs??=at;state.lastMs=at;state.lastRows=rows;if(state.samples.length<12)state.samples.push({atMs:at,rows});}catch(e){state.error=String(e.message||e).slice(0,150);}},snapshot(){return JSON.parse(JSON.stringify(state));}};
}
export function containsAllPositive(state,uuids){return !state.error&&uuids.every(uuid=>state.lastRows.some(r=>r.uuid===uuid&&r.channels>0&&r.max>0.01));}
export function containsAllQuiet(state,uuids){return !state.error&&uuids.every(uuid=>state.lastRows.some(r=>r.uuid===uuid&&r.channels>0&&r.max<=0.00001));}
