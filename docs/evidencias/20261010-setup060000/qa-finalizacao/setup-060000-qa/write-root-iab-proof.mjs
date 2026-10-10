import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=import.meta.dirname;
const context=JSON.parse(await fs.readFile(path.join(root,'browser-context.json')));
const url=new URL(context.apiUrl);
assert.equal(url.hostname,'127.0.0.1');
assert(![51911,18310].includes(Number(url.port)));
const files=[];
for(const name of ['mesa','srt','calls','replay-settings','hdr']){
 const file=`root-installed-${name}.jpg`,b=await fs.readFile(path.join(root,file));
 assert(b.length>30000&&b.subarray(0,2).toString('hex')==='ffd8');
 files.push({file,bytes:b.length,sha256:createHash('sha256').update(b).digest('hex')});
}
const proof={status:'PASS_ROOT_REVIEWED_INSTALLED_IAB_READONLY',at:new Date().toISOString(),version:'0.1.0-local.20261010060000',nativeCommit:'a04786090fcbe7ede495f18e5ad38ccaa9793478',ownApiPort:Number(url.port),operatorTouched:false,mutationCommandsSent:false,files,observations:['Mesa Online with own synthetic Color in Programa; Externo opens network outputs','SRT free output draft uses Destination, Content and audio, Review/start; no save or transmission by Root','Calls shows private director microphone, explicit talkback destinations and return explanation; no Calls in own fixture','Replay settings keeps cameras, retention and camera audio separated from operational players','HDR slot idle, zero frames, no HDR source and Start disabled'],limits:['Actual installed UI in IAB; Native editor visibility/focus/z-order not confirmed','No save/start/microphone/recording/output command by Root','Calls draft/timeout behavior has separate focused tests; empty guest fixture does not prove a real Call','No physical/WAN/endurance/PCM acceptance; custom return remains up to 5 fps']};
await fs.writeFile(path.join(root,'root-iab-proof.json'),JSON.stringify(proof,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({status:proof.status,files:files.length,ownApiPort:proof.ownApiPort}));
