import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url)),run=promisify(execFile);
const hash=async file=>{const h=createHash('sha256');for await(const chunk of createReadStream(file))h.update(chunk);return h.digest('hex');};
const receiptPath=path.join(here,'package-native-startup-000500-native21.json'),receipt=JSON.parse(await fs.readFile(receiptPath));
assert.equal(receipt.status,'PASS');assert.equal(receipt.nativeCommit,'4793d1a40f56ea9b6e887eb49189d937758e3b7f');
assert.equal(receipt.version,'0.1.0-local.20261010000500');assert.equal(receipt.candidateSha256,'7baea35b64c444ba193928a18eae38e901dc8f62d7e65f8a70dea541a792750b');
assert.equal(await hash(path.join(here,'candidate-release-000500.json')),receipt.candidateSha256,'Candidate changed after startup captured SHA');
assert.equal(receipt.nativeSha256,'53d10913ee0e14aa8c5d58a9bd35cf0af72a9072a3214f92444e688cda983e27');
assert.equal(receipt.manifestHash,'6fbf37845536e8b3a6478ec15274f5ce9f7bf14051e10703f2c197550f417619');
assert(receipt.nativeClosed&&receipt.apiClosed&&receipt.shutdownAccepted);assert.equal(receipt.newCrashArtifacts,0);assert.deepEqual(receipt.nativeUnfreedAllocations,[0]);
assert(receipt.launcher.ready&&receipt.launcher.busesReady&&receipt.launcher.ndiLoaded);
for(const log of receipt.logs){assert.equal(await hash(log.path),log.sha256);assert(log.nativeVersionConfirmed);assert(!log.doubleDestroyWarnings&&!log.remainingObjectWarnings);}
for(const pid of [receipt.nativePid,receipt.apiPid]){
 const state=JSON.parse((await run(path.join(receipt.root,'runtime/freemix-process-info.exe'),[String(pid)],{windowsHide:true})).stdout)[0];assert(state.exited,'Own QA PID is not closed');
}
const preparation=JSON.parse(await fs.readFile(path.join(here,'native21-startup-preparation/preparation-receipt.json')));
assert.equal(await hash(preparation.originalPath),preparation.originalSha256);assert.equal(await hash(preparation.derivedPath),preparation.derivedSha256);
assert.equal(await hash(path.join(here,'native21-startup-preparation/original-native20.mjs.txt')),preparation.originalSha256);
for(const item of preparation.preservedReceipts)assert.equal(await hash(item.path),item.sha256,'Previous233334 receipt changed');
const files=[];for(const name of ['package-native-startup-native21.mjs','package-native-startup-000500-native21.json','native21-startup-preparation/preparation-receipt.json','freeze-package-startup-native21.mjs'])files.push({path:name,sha256:await hash(path.join(here,name)),bytes:(await fs.stat(path.join(here,name))).size});
const allowlist={status:'STARTUP_NATIVE21_PASS_FROZEN',selectedRelease:false,files,candidateSha256:receipt.candidateSha256,previous233334Preserved:true,originalHarnessPreserved:true,nativeClosed:true,apiClosed:true,rawLogsIncluded:false,logHashes:receipt.logs.map(log=>log.sha256),limits:receipt.limits};
const output=path.join(here,'package-native-startup-000500-native21-allowlist.json');await fs.writeFile(output,JSON.stringify(allowlist,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({status:allowlist.status,receiptSha256:await hash(receiptPath),allowlistSha256:await hash(output),allocations:receipt.nativeUnfreedAllocations,closeMs:receipt.nativeCloseMs,meterWarnings:receipt.logs.reduce((sum,log)=>sum+log.expiredMeterWarnings,0)}));
