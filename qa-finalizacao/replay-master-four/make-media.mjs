import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
const qa=import.meta.dirname,p=JSON.parse(await readFile(join(qa,'prepared.json'))),media=join(p.root,'qa-media');await mkdir(media,{recursive:true});
const clips=[];
for(const [i,frequency]of [440,660,880,1100].entries()){
 const file=join(media,'camera-'+i+'.mkv'),bits=[];
 for(let b=0;b<16;b++)bits.push(`drawbox=x=${b*20}:y=10:w=19:h=20:color=white:t=fill:enable='eq(mod(floor(n/${2**b}),2),1)'`);
 execFileSync(join(p.root,'runtime/ffmpeg.exe'),['-hide_banner','-v','error','-nostdin','-y','-f','lavfi','-i',`color=c=${['blue','red','green','purple'][i]}:s=320x180:r=30:d=60`,'-f','lavfi','-i',`sine=frequency=${frequency}:sample_rate=48000:duration=60`,'-vf',bits.join(','),'-c:v','ffv1','-threads','1','-pix_fmt','yuv420p','-c:a','pcm_s16le',file],{windowsHide:true,maxBuffer:1024*1024});
 clips.push({cam:'QA Camera '+String.fromCharCode(65+i),file,frequency,duration:60,start:0,end:60});
}
await writeFile(join(qa,'media.json'),JSON.stringify(clips,null,2)+'\n');console.log('Four private synthetic media fixtures generated.');
