import {execFileSync} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
const ffmpeg=resolve('obs-vmix/runtime/ffmpeg.exe');
export const qa=resolve('qa-finalizacao/replay-sincronia-native');
await mkdir(qa,{recursive:true});
export function run(args,binary=false){return execFileSync(ffmpeg,['-hide_banner','-v','error','-nostdin','-threads','1',...args],{windowsHide:true,maxBuffer:2*1024*1024,encoding:binary?undefined:'utf8'});}
export function makeCounter(name,rate='30/1',offset=0,frequency=440){
 const file=join(qa,name+'.mkv'),bits=[];
 bits.push('drawbox=x=0:y=0:w=320:h=40:color=black:t=fill');
 for(let i=0;i<16;i++)bits.push(`drawbox=x=${i*20}:y=0:w=20:h=40:color=white:t=fill:enable='eq(mod(floor((n+${offset})/${2**i}),2),1)'`);
 run(['-y','-f','lavfi','-i',`color=c=${offset?'red':'blue'}:s=320x180:r=${rate}:d=70`,'-f','lavfi','-i',`sine=frequency=${frequency}:sample_rate=48000:duration=70`,'-vf',bits.join(','),'-c:v','ffv1','-level','3','-threads','1','-pix_fmt','yuv420p','-c:a','pcm_s16le',file]);return file;
}
export function decodeCounter(rgb,width=640,scale=2){let value=0;const intensities=[];for(let i=0;i<16;i++){const x=Math.round((i*20+10)*scale),y=Math.round(20*scale),at=(y*width+x)*3;const level=(rgb[at]+rgb[at+1]+rgb[at+2])/3;intensities.push(level);if(level>128)value+=2**i;}return {value,intensities};}
export async function screenshot(obs,input,label){const r=await obs.req('GetSourceScreenshot',{sourceName:input,imageFormat:'png',imageWidth:640,imageHeight:360});const file=join(qa,label+'.png');await writeFile(file,Buffer.from(r.imageData.split(',')[1],'base64'));const rgb=run(['-i',file,'-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1'],true);return {file,...decodeCounter(rgb)};}
export function clipFrame(file,frame){const rgb=run(['-i',file,'-vf',`select=eq(n\\,${frame}),scale=640:360`,'-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1'],true);return decodeCounter(rgb);}
export function clipAudio(file){const bytes=run(['-i',file,'-t','2','-map','0:a:0','-ar','48000','-ac','1','-f','f32le','pipe:1'],true);const d=new Float32Array(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));const crossings=d.reduce((n,x,i)=>n+(i>0&&d[i-1]<=0&&x>0?1:0),0);return {frequency:crossings/(d.length/48000),rms:Math.sqrt(d.reduce((s,x)=>s+x*x,0)/d.length),seconds:d.length/48000};}
