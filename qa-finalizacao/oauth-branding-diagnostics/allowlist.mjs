import {readdir,readFile,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
const qa=resolve(import.meta.dirname),files=[];
for(const name of (await readdir(qa)).filter(n=>n!=='ALLOWLIST.json').sort()){
 const raw=await readFile(join(qa,name));files.push({path:name,bytes:raw.length,sha256:createHash('sha256').update(raw).digest('hex')});
}
await writeFile(join(qa,'ALLOWLIST.json'),JSON.stringify({status:'FROZEN',createdAt:new Date().toISOString(),scope:'Only OAuth/default branding and relative OAuth query diagnostic sanitization. No Native build/runtime OAuth or sealed release claim.',files},null,2)+'\n');
console.log(JSON.stringify({files:files.length,sha256:createHash('sha256').update(await readFile(join(qa,'ALLOWLIST.json'))).digest('hex')}));
