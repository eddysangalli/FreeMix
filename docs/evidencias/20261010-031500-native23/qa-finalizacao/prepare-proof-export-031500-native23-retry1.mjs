import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const workspace=path.resolve(import.meta.dirname,'..');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const readJson=async p=>JSON.parse(await fs.readFile(path.resolve(workspace,p),'utf8'));
const out=path.join(workspace,'qa-finalizacao/proof-export-031500-native23-retry1');
await fs.mkdir(out,{recursive:false});
const inputs=[['composite','qa-finalizacao/package-native-startup-031500-composite-allowlist.json','artifacts'],['distribution','qa-finalizacao/distribution-031500/ALLOWLIST.json','files'],['native23-handoff','qa-finalizacao/native23-input-handoff-retry1/ALLOWLIST.json','files']];
const files=new Map(),excluded=[],binaryReferences=[];
async function add(file,group,expected){
 const absolute=path.resolve(workspace,file),relative=path.relative(workspace,absolute).replaceAll('\\','/');
 assert(!relative.startsWith('../')&&!path.isAbsolute(relative));
 const ext=path.extname(relative).toLowerCase();
 if(!['.json','.mjs','.md','.py','.ps1','.cs'].includes(ext)){excluded.push({path:relative,reason:'Non-text export (raw logs and binaries excluded)'});return;}
 assert(!/(^|\/)(config|configs|logs|crashes)(\/|$)/i.test(relative));
 const body=await fs.readFile(absolute);if(expected)assert.equal(sha(body),expected,'Frozen hash changed: '+relative);
 assert(!body.includes(0),'Unexpected binary');
 files.set(relative,{sourceAbsolute:absolute,sourceRelative:relative,targetRelative:'docs/evidencias/20261010-031500-native23/'+relative,sha256:sha(body),bytes:body.length,group});
}
for(const[group,file,key]of inputs){const list=await readJson(file);await add(file,group);for(const item of list[key])await add(item.path,group,item.sha256);binaryReferences.push(...(list.images||list.binaries||[]));}
for(const file of ['qa-finalizacao/candidate-release-031500.json','qa-finalizacao/full-payload-verificado-031500.json','qa-finalizacao/full-zip-verificado-031500.json','entregas/FreeMix-Studio-Setup-0.1.0-local.20261010031500.exe.build.json','qa-finalizacao/prepare-distribution-031500.mjs','qa-finalizacao/native-build-frozen-500ced5-configured.json','qa-finalizacao/native-build-frozen-709f101-configured.json','qa-finalizacao/native23-outputs-served.mjs','qa-finalizacao/native23-outputs-served/preparation.json','qa-finalizacao/native23-outputs-served/runtime-ready.json','qa-finalizacao/native23-outputs-served/receipt.json','qa-finalizacao/prepare-proof-export-031500-native23.mjs'])await add(file,'provenance-and-runtime');
const receipt=await readJson('qa-finalizacao/native23-outputs-served/receipt.json');
assert.equal(receipt.status,'PASS_PINNED_HTTP_REAL_RUNTIME_AND_CEF_PANEL_LIFECYCLE');assert(receipt.shutdownAccepted&&receipt.nativeClosed&&receipt.apiClosed);assert.equal(receipt.crashArtifacts,0);assert(receipt.logs.every(l=>l.allocations.length&&l.allocations.every(n=>n===0)));
const captures=[];
for(const name of ['12-srt-native23-real-parado.png','13-multistream-native23-real-parado.png']){const file=path.join(workspace,'qa-finalizacao/ux-operacao-20261010/capturas',name),body=await fs.readFile(file);assert.equal(body.readUInt16BE(0),0xffd8,'Expected preserved JPEG bytes');let offset=2,width,height;while(offset<body.length){assert.equal(body[offset],255);const marker=body[offset+1];offset+=2;if(marker===217||marker===218)break;const size=body.readUInt16BE(offset);if([192,193,194].includes(marker)){height=body.readUInt16BE(offset+3);width=body.readUInt16BE(offset+5);break;}assert(size>=2);offset+=size;}assert(width&&height,'JPEG dimensions must be read');captures.push({path:file,sha256:sha(body),bytes:body.length,width,height,actualFormat:'JPEG/JFIF',extensionMatchesFormat:false,surface:'IAB browser with actual isolated Native23/API backend',cefVisualProof:false,rootReportedNoSaveOrStart:true});}
const review={status:'HASHED_IAB_CAPTURE_REFERENCES_AND_CLOSED_OWN_RUNTIME',captures,runtimeReceiptSha256:sha(await fs.readFile(path.join(workspace,'qa-finalizacao/native23-outputs-served/receipt.json'))),ownNativePid:receipt.nativePid,ownApiPid:receipt.apiPid,shutdownAccepted:true,nativeClosed:true,apiClosed:true,allocations:receipt.logs.map(l=>l.allocations),crashArtifacts:0,configurationUnchangedProved:false,limits:['Capabilities were captured before browser navigation; output config files were not hashed before/after that navigation','Parent reported only UI drafts were changed, no save/start clicked','IAB walkthrough is separate from API confirmation of actual CEF window lifecycle','API process was terminated only after own executable identity verification; Native used accepted shutdown_idle']};
const reviewFile=path.join(out,'IAB-CAPTURES-AND-CLOSURE.json');await fs.writeFile(reviewFile,JSON.stringify(review,null,2)+'\n',{flag:'wx'});await add(reviewFile,'runtime-review');
// Reject actual credentials from the known own installation, never emit their values.
const configFile=path.join(receipt.root,'config/obs-studio/plugin_config/obs-websocket/config.json');
const credentialConfig=await fs.readFile(configFile,'utf8').then(JSON.parse).catch(()=>null);const secrets=[];
function collect(v){if(!v||typeof v!=='object')return;for(const[k,x]of Object.entries(v)){if(/password|secret|token/i.test(k)&&typeof x==='string'&&x.length>=8)secrets.push(x);else if(x&&typeof x==='object')collect(x);}}
collect(credentialConfig);
for(const f of files.values()){const text=await fs.readFile(f.sourceAbsolute,'utf8');assert(!secrets.some(s=>text.includes(s)),'Actual own credential found: '+f.sourceRelative);}
const result={status:'TEXT_ONLY_EXPORT_ALLOWLIST_FROZEN',at:new Date().toISOString(),copiedToGit:false,operatorTouched:false,selectionChanged:false,files:[...files.values()].sort((a,b)=>a.sourceRelative.localeCompare(b.sourceRelative)),excluded,binaryReferences:[...binaryReferences,...captures],checks:{originalFrozenHashesVerified:true,preservedFailReceipts:true,rawLogsExported:false,installationConfigsExported:false,actualOwnCredentialScanPerformed:secrets.length>0},limits:['Text paths under TEMP are evidence references only; no TEMP files/configuration included','Original SHA preserved; parent performs canonical Git copy/commit','Credential test receipts contain assertions only, no credential values','Native23 is an isolated QA composition, not a signed new release']};
const target=path.join(out,'ALLOWLIST.json');await fs.writeFile(target,JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({status:result.status,files:result.files.length,excluded:excluded.length,captures:captures.length,allowlist:target,sha256:sha(await fs.readFile(target)),reviewSha256:sha(await fs.readFile(reviewFile)),actualOwnCredentialScanPerformed:result.checks.actualOwnCredentialScanPerformed}));
