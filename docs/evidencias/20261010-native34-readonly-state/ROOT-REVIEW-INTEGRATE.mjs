import fs from 'node:fs/promises';import path from 'node:path';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import {execFileSync} from 'node:child_process';
const qa=import.meta.dirname,root=path.resolve(qa,'..'),dir=path.join(qa,'network-state-readonly-offside-r3-20261010'),hash=b=>createHash('sha256').update(b).digest('hex'),sha=async p=>hash(await fs.readFile(p));
const expected='8c4a1cf8ebfef4e499a2389327d54b022229b6c6562801ef2e842ecd53068b05';
assert.equal(await sha(path.join(dir,'ALLOWLIST.json')),expected);const al=JSON.parse(await fs.readFile(path.join(dir,'ALLOWLIST.json')));
for(const f of al.files){const b=await fs.readFile(path.join(dir,f.path));assert.equal(b.length,f.bytes);assert.equal(hash(b),f.sha256);}
const target=path.join(root,'freemix-app',al.sourcePath);assert.equal(await sha(target),al.productionBeforeSha256);
const before=await fs.readFile(path.join(dir,'before/FreeMixMultistream.cpp')),after=await fs.readFile(path.join(dir,'draft/FreeMixMultistream.cpp')),edits=JSON.parse(await fs.readFile(path.join(dir,'EDITS.json')));
assert.equal(hash(after),al.productionAfterSha256);assert.equal(after.includes(Buffer.from('\r\n')),before.includes(Buffer.from('\r\n')));
let restored=after.toString('utf8');for(const e of [...edits.edits].reverse()){assert.equal(restored.split(e.new).length,2);restored=restored.replace(e.new,e.old);}assert.equal(restored,before.toString('utf8'));
const git=(...args)=>execFileSync('git',['-C',path.join(root,'freemix-app'),...args],{encoding:'utf8',windowsHide:true}).trim();assert.equal(git('rev-parse','HEAD'),al.baselineHead);assert.equal(git('status','--porcelain','--untracked-files=no'),'');
if(!process.argv.includes('--integrate')){
 const own=path.join(qa,'network-state-root-review-20261010');await fs.mkdir(own,{recursive:false});for(const f of al.files){const to=path.join(own,f.path);await fs.mkdir(path.dirname(to),{recursive:true});await fs.copyFile(path.join(dir,f.path),to,fs.constants.COPYFILE_EXCL);}
 const result=execFileSync(process.execPath,[path.join(own,'test.mjs')],{encoding:'utf8',windowsHide:true,timeout:30000,cwd:root});console.log(result.trim());
 const receipt={status:'ROOT_SOURCE_REVIEW_40_MODELS_PASS_RUNTIME_PENDING',allowlistSha256:expected,source:al.sourcePath,beforeSha256:hash(before),afterSha256:hash(after),sourceChanges:1,edits:8,RootFullPatchRead:true,RootRequestAndSdkAndTimerRead:true,models:40,NativeStarted:false,canonicalChanged:false,SDKLoadingTimingChanged:true,SDKTelemetryInternalPurityProven:false,QtTimerHardDeadlineProven:false};
 await fs.writeFile(path.join(qa,'root-network-state-r3-review.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({status:receipt.status}));
}else{
 const review=JSON.parse(await fs.readFile(path.join(qa,'root-network-state-r3-review.json')));assert.equal(review.allowlistSha256,expected);assert.equal(review.models,40);
 const ftb=JSON.parse(await fs.readFile(path.join(qa,'ftb-native33-retained-cursor-observation-preparation-r4/root-ftb33-clock-real-result.json')));assert(ftb.cleanup.success&&ftb.cleanup.exit.code===0&&ftb.afterPins.match);
 const ownCount=execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',"@(Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'FreeMix.exe' -and $_.ExecutablePath -like '*FreeMix-QA-*' }).Count"],{encoding:'utf8',windowsHide:true}).trim();assert.equal(ownCount,'0');
 await fs.writeFile(path.join(qa,'root-network-state-r3-before.cpp'),before,{flag:'wx'});assert.equal(await sha(target),hash(before));await fs.writeFile(target,after);assert.equal(await sha(target),hash(after));
 const diff=git('diff','--stat');git('diff','--check');await fs.writeFile(path.join(qa,'root-network-state-r3-integration.json'),JSON.stringify({...review,status:'ROOT_INTEGRATED_ONE_NATIVE_SOURCE_BUILD_PENDING',canonicalChanged:true,at:new Date().toISOString(),priorFtbOwnClosed:true,diff},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({status:'ROOT_INTEGRATED_ONE_NATIVE_SOURCE_BUILD_PENDING',afterSha256:hash(after)}));
}
