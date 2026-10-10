import fs from 'node:fs/promises';import path from 'node:path';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const base=path.resolve('qa-finalizacao/distribution-031500'),original=path.resolve('qa-finalizacao/installer-next-candidate-runner.mjs');
const hash=b=>createHash('sha256').update(b).digest('hex');const raw=await fs.readFile(original,'utf8');let next=raw;const changes=[];
function change(from,to,count=1){assert.equal(next.split(from).length-1,count,'Substitution count '+from);next=next.split(from).join(to);changes.push({from,to,count});}
change("from '../scripts/installer-windows/qa/candidate-context.mjs'","from '../../scripts/installer-windows/qa/candidate-context.mjs'");
change("from '../obs-vmix/ferramentas/diagnostico-producao.mjs'","from '../../entregas/FreeMix-Completo-0.1.0-local.20261010031500/ferramentas/diagnostico-producao.mjs'");
change("path.dirname(fileURLToPath(import.meta.url)),'..'","path.dirname(fileURLToPath(import.meta.url)),'../..'");
change("const output=path.join(receipts,receiptNames[phase]);","shim=shim.replaceAll(pathToFileURL(path.join(workspace,'obs-vmix/ferramentas')).href,pathToFileURL(path.join(workspace,'entregas/FreeMix-Completo-0.1.0-local.20261010031500/ferramentas')).href);const output=path.join(receipts,receiptNames[phase]);");
const target=path.join(base,'run-candidate.mjs');await fs.writeFile(target,next,{flag:'wx'});
await fs.writeFile(path.join(base,'qa-derivation.json'),JSON.stringify({status:'PREPARED_NOT_EXECUTED',original,originalSha256:hash(raw),target,sha256:hash(next),changes,installedLogicUnchanged:true,oldReceiptsPreserved:true,productModulesFromSealedPackage:true},null,2),{flag:'wx'});
console.log(JSON.stringify({target,sha256:hash(next)}));
