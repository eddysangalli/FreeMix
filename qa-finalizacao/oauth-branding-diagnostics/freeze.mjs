import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join,resolve,basename} from 'node:path';
import {createHash} from 'node:crypto';
const qa=resolve(import.meta.dirname),root=resolve(qa,'../..'),hash=b=>createHash('sha256').update(b).digest('hex');
const native=['frontend/oauth/AuthListener.cpp','frontend/oauth/YoutubeAuth.cpp','frontend/wizards/AutoConfigStreamPage.cpp','frontend/dialogs/OBSYoutubeActions.cpp','frontend/importers/studio.cpp'];
const sources=[];
for(const file of native){const before=await readFile(join(qa,basename(file)+'.before')),after=await readFile(join(root,'freemix-app',file));if(/(?<!\r)\n/.test(after.toString()))throw Error('CRLF mismatch');await writeFile(join(qa,basename(file)+'.after'),after);sources.push({path:'freemix-app/'+file,patchPath:file,beforeSha256:hash(before),sha256:hash(after),bytes:after.length,crlf:true,snapshot:basename(file)+'.after'});}
const diag='ferramentas/diagnostico-producao.mjs',before=await readFile(join(root,'FreeMix',diag)),after=await readFile(join(root,'obs-vmix',diag));
const stripped=after.toString().replace(/\/\/ OAuth callbacks can be logged[\s\S]*?(?=export function redactDiagnostic)/,'').replace(/ s=redactRelativeOAuthQueries\(s\);\r?\n/,'');
if(stripped!==before.toString())throw Error('Diagnostic baseline differs beyond approved helper');
await writeFile(join(qa,'diagnostico-producao.mjs.before'),before);await writeFile(join(qa,'diagnostico-producao.mjs.after'),after);sources.push({path:'obs-vmix/'+diag,patchPath:diag,beforeSha256:hash(before),sha256:hash(after),bytes:after.length,snapshot:'diagnostico-producao.mjs.after',baseline:'Unmodified FreeMix mirror; exact helper/call-only difference verified'});
const receipt=JSON.parse(await readFile(join(qa,'resultado.json')));if(receipt.status!=='PASS')throw Error('QA not passed');
await writeFile(join(qa,'FONTE-FREEZE.json'),JSON.stringify({status:'SOURCE_QA_PASS_NATIVE_BUILD_PENDING',createdAt:new Date().toISOString(),sources,qaCases:receipt.cases,networkUsed:false,nativeBuildPerformed:false,operatorChanged:false,sealedPackageChanged:false,scope:'Five authorized Native files and diagnostic redactor only; no broader branding claim.'},null,2)+'\n');
console.log(JSON.stringify({sources:sources.length,status:'SOURCE_QA_PASS_NATIVE_BUILD_PENDING'}));
