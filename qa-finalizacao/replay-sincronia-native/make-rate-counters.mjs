import {qa,makeCounter,run} from './media-tools.mjs';
import {join} from 'node:path';
const ntsc=makeCounter('ntsc-counter','30000/1001',0,660);
run(['-y','-i',join(qa,'counter-cam1.mkv'),'-f','lavfi','-i','sine=frequency=990:sample_rate=48000:duration=10','-t','10','-vf','select=not(mod(n\\,2))+not(mod(n\\,5))','-fps_mode','vfr','-map','0:v:0','-map','1:a:0','-c:v','libx264','-preset','ultrafast','-threads','1','-g','1','-c:a','pcm_s16le',join(qa,'vfr-counter.mkv')]);console.log('Counter fixtures ready: rational30000/1001, VFR33/67ms, 660/990Hz');
