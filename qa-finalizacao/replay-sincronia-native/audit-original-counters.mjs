import {run,qa} from './media-tools.mjs';
import {join} from 'node:path';
import {writeFile} from 'node:fs/promises';
const sequences=[0,1].map(i=>{const bytes=run(['-i',join(qa,'original-native-clips',`cam-${i}.mp4`),'-vf','crop=640:2:0:40,scale=16:1:flags=neighbor','-f','rawvideo','-pix_fmt','rgb24','pipe:1'],true);return Array.from({length:bytes.length/48},(_,n)=>{let v=0;for(let i=0;i<16;i++)if((bytes[n*48+i*3]+bytes[n*48+i*3+1]+bytes[n*48+i*3+2])/3>128)v+=2**i;return v;});});
const offset=sequences[0][0]-sequences[1][0];
const differences=sequences[0].flatMap((a,n)=>n+offset>=0&&n+offset<sequences[1].length?[{frameA:n,frameB:n+offset,counterA:a,counterB:sequences[1][n+offset],difference:Math.abs(a-sequences[1][n+offset])}]:[]);
const report={offset,lengths:sequences.map(x=>x.length),max:Math.max(...differences.map(x=>x.difference)),histogram:differences.reduce((h,x)=>{h[x.difference]=(h[x.difference]||0)+1;return h;},{}),sequences,differences};
await writeFile(join(qa,'original-cadence-counter-audit.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({offset,lengths:report.lengths,max:report.max,histogram:report.histogram,around163:differences.filter(x=>x.counterA>=159&&x.counterA<=168)}));
