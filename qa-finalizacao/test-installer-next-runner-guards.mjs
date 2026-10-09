import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const run=promisify(execFile),runner=path.resolve('qa-finalizacao/installer-next-candidate-runner.mjs');
const plan=process.env.FREEMIX_QA_NEXT_PLAN;assert.ok(plan&&path.isAbsolute(plan),'Explicit own plan required');
const checks=[];
async function reject(name,args,pattern){await assert.rejects(run(process.execPath,[runner,...args],{windowsHide:true}),e=>pattern.test(e.stderr));checks.push({name,status:'PASS',setupExecuted:false});}
await reject('Missing explicit own plan',['check'],/absolute owned plan/);
await reject('Unknown option refused',['check','--unsafe=x'],/Unknown\/duplicate\/empty option/);
await reject('Existing context receipt preserved',['run','--plan='+plan,'--phase=context'],/Preserve existing phase receipt/);
await reject('No implicit candidate fallback',['run','--plan='+plan,'--phase=verify'],/Explicit candidate --package-root required/);
await reject('Old sealed213415 version refused before reading/executing input',['run','--plan='+plan,'--phase=verify','--package-root=C:\\QA-never-accessed','--setup-exe=C:\\QA-never-executed.exe','--setup-sha256='+'0'.repeat(64),'--version=0.1.0-local.20261009213415'],/Previous sealed213415 candidate/);
await run(process.execPath,[runner,'check','--plan='+plan],{windowsHide:true});
const p=JSON.parse(await fs.readFile(plan));assert.equal(p.candidate,null);
const result={status:'PASS',plan,checks,candidateUsed:false,setupExecuted:false,nativeStarted:false,operatorTouched:false,baselinePreserved:true};
const file='qa-finalizacao/installer-next-runner-guards.json';await fs.writeFile(file,JSON.stringify(result,null,2),{flag:'wx'});console.log(JSON.stringify(result,null,2));
