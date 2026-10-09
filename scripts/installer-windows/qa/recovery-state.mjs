import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile} from 'node:fs/promises';
import {join,resolve,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {SessionRecovery} from '../../../obs-vmix/ferramentas/sessao-producao.mjs';
import {stateMutations} from '../../../obs-vmix/ferramentas/recuperacao-estados.mjs';
const root=await mkdtemp(join(tmpdir(),'FreeMix-QA-RecoveryState-')),captures=[];
const p={root,scope:'QA Horizontal/Vertical',recoveryEngine:{backup:async options=>{captures.push(options);return {id:randomUUID(),files:[]};}},macroEngine:{normalize(){throw Error('Session history is not a replayable macro');}}};
const session=new SessionRecovery(p);await mkdir(session.directory,{recursive:true});session.current={id:randomUUID(),scope:p.scope,lastSnapshot:randomUUID()};session.prune=async()=>{};
for(const action of ['input_variant','input_link','input_content_undo']){assert(stateMutations.has(action));await session.journal(action,{});}
const records=(await session.journalRecords(session.current.id)).records;
assert.equal(captures.length,3);assert(records.every(r=>r.stateSnapshotId&&r.step===null&&!r.stateCaptureError));assert(captures.every(c=>c.automatic&&c.includeMedia&&c.nativeOutputs&&c.kind==='journal'));
const result={status:'PASS',root,operatorTouched:false,actions:records.map(r=>({action:r.action,stateSnapshotId:r.stateSnapshotId,macroReplay:false})),assertion:'Variant, link/unlink through input_link, and content undo preserve final project state snapshots rather than replaying undo history.'};
const evidence=resolve(dirname(fileURLToPath(import.meta.url)),'../build/qa-recovery-state.json');await writeFile(evidence,JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
