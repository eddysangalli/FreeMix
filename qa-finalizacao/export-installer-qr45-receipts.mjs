import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {assertOwnedQa,fileHash} from '../scripts/installer-windows/qa/candidate-context.mjs';
import {redactDiagnostic} from '../ferramentas/diagnostico-producao.mjs';

const [planPath,outputPath]=process.argv.slice(2);
assert(planPath&&path.isAbsolute(planPath)&&outputPath&&path.isAbsolute(outputPath),'Explicit absolute plan and fresh QA output directory required');
const plan=JSON.parse(await fs.readFile(planPath,'utf8'));
await assertOwnedQa(plan.root,plan.receipts);
assert.equal(path.resolve(planPath),path.join(plan.root,'plan.json'));
assert.equal(plan.candidate?.version,'0.1.0-local.20261010004500','This export is pinned to04500 QR Native21; no implicit candidate');
const workspace=path.resolve('');
assert(path.resolve(outputPath).startsWith(path.join(workspace,'qa-finalizacao')+path.sep));
await fs.mkdir(outputPath);
const files=[];
function sanitize(value){
  if(typeof value==='string')return redactDiagnostic(value);
  if(Array.isArray(value))return value.map(sanitize);
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([key])=>!['log','registryKey'].includes(key)).map(([key,item])=>[key,sanitize(item)]));
  return value;
}
for(const phase of ['context','verify','distribution','credentials','report']){
  const original=path.join(plan.receipts,plan.receiptNames[phase]),receipt=JSON.parse(await fs.readFile(original,'utf8'));
  assert.equal(receipt.status,'PASS');
  const sanitized=sanitize(receipt);
  const text=JSON.stringify(sanitized,null,2);
  for(const secret of ['qa-websocket-secret-do-not-distribute','qa-streamkey-secret-12345','qa-cookie-session-12345','qa-srt-passphrase-12345','eyJabcdefghijk.abcdefghijkl.abcdefghijkl'])assert(!text.includes(secret),'Synthetic secret in receipt');
  const name=plan.receiptNames[phase];
  await fs.writeFile(path.join(outputPath,name),text,{flag:'wx'});
  files.push({path:name,sourceSha256:await fileHash(original),sha256:createHash('sha256').update(text).digest('hex'),sanitized:true,rawLogsCopied:false});
  const runPath=path.join(plan.root,'run-'+phase+'.json'),run=JSON.parse(await fs.readFile(runPath,'utf8'));
  assert.equal(run.status,'PASS');assert.equal(run.baselinePreserved,true);
  const runText=JSON.stringify(run,null,2);await fs.writeFile(path.join(outputPath,'run-'+phase+'.json'),runText,{flag:'wx'});
  files.push({path:'run-'+phase+'.json',sourceSha256:await fileHash(runPath),sha256:createHash('sha256').update(runText).digest('hex'),sanitized:true,rawLogsCopied:false});
}
const baseline=[];
for(const f of plan.baseline){assert.equal(await fileHash(f.path),f.sha256);assert.equal(await fileHash(f.preservedCopy),f.sha256);baseline.push({path:path.relative(workspace,f.path).split(path.sep).join('/'),sha256:f.sha256,preservedCopySha256:await fileHash(f.preservedCopy)});}
assert.equal(baseline.length,26);
const priorAllowlistPath=path.join(workspace,'qa-finalizacao/installer-real-233334-allowlist-20261009.json'),priorAllowlist=JSON.parse(await fs.readFile(priorAllowlistPath,'utf8'));
for(const f of priorAllowlist.files)assert.equal(await fileHash(path.join(workspace,f.path)),f.sha256,'Frozen233334 metadata changed');
for(const f of [...plan.sources,...plan.shims])assert.equal(await fileHash(f.path),f.sha256);
const summary={status:'PASS_REAL_SETUP_04500_QR_AWAIT_PARENT_SELECTION',candidate:plan.candidate,baselineArtifacts:baseline.length,baselinePreserved:true,baseline,prior233334:{allowlistSha256:await fileHash(priorAllowlistPath),filesPreserved:priorAllowlist.files.length},files,operatorTouched:false,nativeStarted:false,rawLogsCopied:false,crashesCopied:false,credentialsCopied:false,limits:['Native startup belongs to separate parent QA','Sanitization covers synthetic token/cookie/SRT/key/JWT and relative OAuth code/state in both installed collector ZIPs; ordinary product state preserved','No Authenticode, clean-Windows VM, physical hardware or WAN homologation','Selection requires separate parent review/startup evidence; this QA does not promote the sealed candidate']};
await fs.writeFile(path.join(outputPath,'evidence-copy.json'),JSON.stringify(summary,null,2),{flag:'wx'});
console.log(JSON.stringify({status:summary.status,files:files.length,baselineArtifacts:baseline.length,outputPath}));
