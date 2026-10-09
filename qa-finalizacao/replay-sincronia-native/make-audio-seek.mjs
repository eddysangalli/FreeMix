import {run,qa} from './media-tools.mjs';
import {join} from 'node:path';
run(['-y','-i',join(qa,'counter-cam1.mkv'),'-f','lavfi','-i',"aevalsrc='0.176*sin(2*PI*if(lt(t,5),440,880)*t)':s=48000:d=12",'-t','12','-map','0:v:0','-map','1:a:0','-c:v','libx264','-preset','ultrafast','-crf','18','-threads','1','-c:a','aac','-b:a','192k',join(qa,'seek-tone.mp4')]);
console.log('QA tone 440 before5s, 880 after5s');
