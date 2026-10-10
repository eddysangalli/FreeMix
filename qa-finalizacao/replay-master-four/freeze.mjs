import {readFile,readdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
const qa=import.meta.dirname,r=JSON.parse(await readFile(join(qa,'resultado.json'))),log=JSON.parse(await readFile(join(qa,'native-log-build-summary.json')));
if(r.status!=='PASS'||log.memoryLeaks.some(x=>x!==0)||log.crashMarkers!==0)throw Error('Freeze requires media and close PASS');
const files=[];
for(const name of (await readdir(qa)).sort()){
 if(name==='ALLOWLIST.json'||! /\.(mjs|cpp|cmd|md|json)$/.test(name))continue;
 const b=await readFile(join(qa,name));files.push({path:name,bytes:b.length,sha256:createHash('sha256').update(b).digest('hex')});
}
const receipt={status:'FROZEN_MASTER_DIGITAL_FOUR_PASS',at:new Date().toISOString(),productChanged:false,nativeHead:r.native.head,nativeReceiptSha256:log.frozenNativeReceiptSha256,files,excluded:['compiled QA probe DLL/LIB/OBJ/EXP','build-deps','raw PCM/packets CSV','media/images/native rawlogs','operator/config credentials'],limits:r.limits};
await writeFile(join(qa,'ALLOWLIST.json'),JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify({files:files.length,sha256:createHash('sha256').update(await readFile(join(qa,'ALLOWLIST.json'))).digest('hex')}));
