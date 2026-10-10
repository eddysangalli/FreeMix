import fs from 'node:fs/promises';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex');
const files=[];
for(const [actual,expected] of [['saidas.html','panel/saidas.html'],['saidas.js','panel/saidas.js'],['saidas-contexto-ui.js','panel/saidas-contexto-ui.js'],['saidas-srt-conexao-ui.js','panel/saidas-srt-conexao-ui.js'],['saidas-operacao-ui.js','draft/saidas-operacao-ui.js'],['operacao.css','draft/operacao.css']]){
 const a='FreeMix/painel/remoto/'+actual,b='qa-finalizacao/ux-operacao-20261010/'+expected,bytes=await fs.readFile(a);
 assert.equal(sha(bytes),sha(await fs.readFile(b)),a);files.push({path:a,sha256:sha(bytes),bytes:bytes.length});
}
const runtime=JSON.parse(await fs.readFile('qa-finalizacao/ux-operacao-20261010/preview-runtime.json'));
const proof=await fetch('http://127.0.0.1:'+runtime.port+'/__qa/proof').then(r=>r.json());
assert.equal(proof.fixture,true);assert.equal(proof.nativeConnected,false);assert.equal(proof.operatorTouched,false);
assert.ok(proof.events.some(e=>e.action==='outputs_start'&&e.index===0));
assert.ok(proof.events.some(e=>e.action==='outputs_stop'&&e.index===0));
assert.equal(proof.events.filter(e=>['outputs_start','outputs_stop'].includes(e.action)).every(e=>e.index===0),true);
const capture='qa-finalizacao/ux-operacao-20261010/capturas/11-multistream-parada.png';
await fs.writeFile('qa-finalizacao/ux-operacao-20261010/CANONICAL-AND-BROWSER-PROOF.json',JSON.stringify({status:'PASS_CANONICAL_EQUALS_TESTED_AND_BROWSER_FIXTURE_STOP',at:new Date().toISOString(),files,capture:{path:capture,sha256:sha(await fs.readFile(capture))},events:proof.events,limits:{nativeConnected:false,operatorTouched:false,realMediaOrReceiverVerified:false}},null,2),{flag:'wx'});
console.log(JSON.stringify({status:'PASS',canonicalFiles:files.length,browserFixtureStopConfirmed:true}));
