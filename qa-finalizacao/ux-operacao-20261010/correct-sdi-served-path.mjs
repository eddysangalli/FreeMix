import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const hash=b=>createHash('sha256').update(b).digest('hex');
const target='FreeMix/painel/remoto/';
const source='obs-vmix/painel/remoto/';
const allow=JSON.parse(await fs.readFile('qa-finalizacao/sdi-hdr-allowlist-final-20261009.json'));
const original=await fs.readFile(target+'saidas.html');
assert.equal(hash(original),'66d75d463500b10fe56d93411a152ceab2eef6e8fc1f2632c6da82114bd7eea8');
const expected=await fs.readFile(source+'saidas.html');
assert.equal(hash(expected),allow.hashes.find(f=>f.path===source+'saidas.html').sha256);
let revised=original.toString();
const before='Esta rota usa SDR; HDR físico deve ser homologado na ferramenta original do dispositivo.';
const after='O modo padrão usa SDR. HDR opaco possui configuração própria abaixo e exige preflight do driver e homologação física.';
if(!revised.includes(before)){
 const at=revised.indexOf('Somente dispositivos, modos e keyers');
 throw new Error('Expected SDR description missing: '+revised.slice(at,at+440));
}
revised=revised.replace(before,after).replace('<script src="saidas-omt-hdr-ui.js"></script>','<script src="saidas-omt-hdr-ui.js"></script><script src="saidas-sdi-hdr-ui.js"></script>');
assert.equal(revised,expected.toString(),'Only reviewed HDR description and script reference may differ');
const helper=await fs.readFile(source+'saidas-sdi-hdr-ui.js');
assert.equal(hash(helper),allow.hashes.find(f=>f.path===source+'saidas-sdi-hdr-ui.js').sha256);
assert.equal(hash(await fs.readFile('FreeMix/remoto/saidas-sdi-hdr-ui.js')),hash(helper));
assert.equal(await fs.access(target+'saidas-sdi-hdr-ui.js').then(()=>true,()=>false),false);
await fs.writeFile(target+'saidas.html',revised);
await fs.writeFile(target+'saidas-sdi-hdr-ui.js',helper);
await fs.writeFile('qa-finalizacao/ux-operacao-20261010/SDI-SERVED-PATH-CORRECTED.json',JSON.stringify({status:'CORRECTED_SOURCE_PATH_ONLY',at:new Date().toISOString(),files:[{path:target+'saidas.html',before:hash(original),after:hash(expected)},{path:target+'saidas-sdi-hdr-ui.js',before:null,after:hash(helper)}],operatorTouched:false,sealedPackagesTouched:false,physicalHdrValidated:false},null,2),{flag:'wx'});
console.log('PASS: actual served path corrected, no operator/package changes');
