import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {readFileSync} from 'node:fs';
export function rawPcmAnalysis(file,rate=48000,expected=null){return analyse(readFileSync(file),rate,expected);}
export function pcmAnalysis(file,maxSeconds=120){
 const bytes=execFileSync(resolve('obs-vmix/runtime/ffmpeg.exe'),['-hide_banner','-v','error','-nostdin','-threads','1','-i',file,'-t',String(maxSeconds),'-map','0:a:0','-ac','1','-ar','48000','-f','f32le','pipe:1'],{windowsHide:true,maxBuffer:32*1024*1024});
 return analyse(bytes,48000);
}
function analyse(bytes,rate,expected=null){
 const data=new Float32Array(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));
 const windows=[];let silence=0,maxSilence=0;
 for(let first=0;first<data.length;first+=rate){const last=Math.min(data.length,first+rate);let sum=0,crossings=0,peak=0;for(let i=first;i<last;i++){const v=data[i];sum+=v*v;peak=Math.max(peak,Math.abs(v));if(i>first&&data[i-1]<=0&&v>0)crossings++;if(Math.abs(v)<1e-5){silence++;maxSilence=Math.max(maxSilence,silence);}else silence=0;}windows.push({start:first/rate,seconds:(last-first)/rate,rms:Math.sqrt(sum/(last-first)),frequency:crossings/((last-first)/rate),peak});}
 let tone=null;
 if(expected&&data.length>rate/2){const first=data.length-Math.floor(rate/2),length=data.length-first;let best={frequency:0,power:0};for(let frequency=Math.max(1,expected-20);frequency<=expected+20;frequency+=.5){const coefficient=2*Math.cos(2*Math.PI*frequency/rate);let a=0,b=0;for(let i=first;i<data.length;i++){const next=data[i]+coefficient*a-b;b=a;a=next;}const power=(a*a+b*b-coefficient*a*b)/(length*length);if(power>best.power)best={frequency,power};}tone=best;}
 return {sampleRate:rate,seconds:data.length/rate,maxSilentRunMs:maxSilence*1000/rate,windows,tone};
}
