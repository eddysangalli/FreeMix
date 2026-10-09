import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve,join} from 'node:path';
import assert from 'node:assert/strict';
const qa=resolve('qa-finalizacao/replay-completo/cef-native');
const state=JSON.parse(await readFile(join(qa,'progress.json'),'utf8'));
const file=join(state.sessionDir,'cam-1.ts');assert(resolve(file).toLowerCase().startsWith(resolve(state.root).toLowerCase()+'\\'));
const start=Math.max(0,state.last.end-8);
const bytes=execFileSync(join(state.root,'runtime/ffmpeg.exe'),['-v','error','-threads','1','-ss',String(start),'-i',file,'-t','5','-map','0:a:0','-ac','1','-ar','48000','-f','f32le','pipe:1'],{windowsHide:true,maxBuffer:2*1024*1024});
const data=new Float32Array(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));
const windows=[];for(let i=0;i+4800<=data.length;i+=4800){const part=data.subarray(i,i+4800);windows.push(Math.sqrt(part.reduce((s,x)=>s+x*x,0)/part.length));}
const rms=Math.sqrt(data.reduce((s,x)=>s+x*x,0)/data.length),crossings=data.reduce((s,x,i)=>s+(i>0&&data[i-1]<=0&&x>0?1:0),0);
const result={at:new Date().toISOString(),operatorTouched:false,audibleOutput:false,decoder:'FFmpeg AAC, separate from CEF opt-in measurement',source:file,startSeconds:start,durationSeconds:data.length/48000,rms,estimatedFrequency:crossings/(data.length/48000),windowSeconds:.1,windowRms:windows,quietWindows:windows.filter(r=>r<.001).length};
assert(data.length>48000*4.8);assert(rms>.03&&rms<.2);assert(Math.abs(result.estimatedFrequency-440)<20);await writeFile(join(qa,'recorded-audio-near-tail.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({...result,windowRms:undefined}));
