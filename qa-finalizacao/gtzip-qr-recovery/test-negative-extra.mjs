import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {join,resolve,relative,isAbsolute} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {collectStaticDependencies} from '../../ferramentas/recuperacao-dependencias.mjs';
import {GT_QR_RUNTIME_SCRIPT,GT_QR_LICENSE} from '../../ferramentas/gtzip-qr.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex'),runtime=Buffer.from(GT_QR_RUNTIME_SCRIPT),license=Buffer.from(GT_QR_LICENSE);
const scratch=await fs.mkdtemp(join(tmpdir(),'FreeMix-QA-QR-Recovery-Negative-')),checks=[];
try{
 const run=async(name,mutate,pattern)=>{const dir=join(scratch,name);await fs.mkdir(dir);const manifest={format:2,sourceFormat:'GTZIP',fields:[{type:'QRCode'}],files:[{path:'gt-qr.js',size:runtime.length,sha256:sha(runtime)},{path:'QR-LICENSE.txt',size:license.length,sha256:sha(license)}]};await fs.writeFile(join(dir,'index.html'),'<script src="gt-qr.js"></script>');await fs.writeFile(join(dir,'gt-qr.js'),runtime);await fs.writeFile(join(dir,'QR-LICENSE.txt'),license);await mutate(dir,manifest);await fs.writeFile(join(dir,'manifest.json'),JSON.stringify(manifest));await assert.rejects(collectStaticDependencies([{path:dir,status:'directory'}]),pattern);checks.push({name,pass:true});};
 await run('missing-encoder',async dir=>fs.rename(join(dir,'gt-qr.js'),join(dir,'encoder.hidden')),/Dependência estática ausente/);
 await run('missing-encoder-manifest-record',async(_,m)=>{m.files=m.files.filter(f=>f.path!=='gt-qr.js');},/Registro QR GTZIP não corresponde/);
 await run('manifest-without-QR-field',async(_,m)=>{m.fields=[];},/Contrato QR GTZIP inválido/);
 await run('different-bundle-filename-not-exempt',async dir=>{await fs.rename(join(dir,'gt-qr.js'),join(dir,'custom.js'));await fs.writeFile(join(dir,'index.html'),'<script src="custom.js"></script>');},/Dependência estática ausente/);
 await fs.writeFile(join(import.meta.dirname,'resultado-negative-extra.json'),JSON.stringify({status:'PASS',at:new Date().toISOString(),checks,operatorTouched:false},null,2),{flag:'wx'});console.log(JSON.stringify({status:'PASS',checks:checks.length}));
}finally{const r=relative(resolve(tmpdir()),resolve(scratch));assert(r&&!r.startsWith('..')&&!isAbsolute(r));await fs.rm(scratch,{recursive:true,force:true});}
