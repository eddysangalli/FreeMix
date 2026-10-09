import {readFile,writeFile,readdir} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const here=dirname(fileURLToPath(import.meta.url)),workspace=resolve(here,'../../..');
const allowlist=[
 'scripts/installer-windows/Setup.cs','scripts/installer-windows/Uninstall.cs','scripts/installer-windows/build.mjs','scripts/installer-windows/README.md',
 'obs-vmix/ferramentas/instalar-portatil.mjs','obs-vmix/ferramentas/preparar-portatil.mjs','obs-vmix/ferramentas/iniciar-freemix.mjs','obs-vmix/ferramentas/iniciar-api.mjs',
 'obs-vmix/ferramentas/recuperacao-importacao.mjs','obs-vmix/ferramentas/recuperacao-inicializacao.mjs','obs-vmix/ferramentas/recuperacao-producao.mjs','obs-vmix/ferramentas/recuperacao-estados.mjs','obs-vmix/ferramentas/diagnostico-producao.mjs',
 'obs-vmix/painel/remoto/settings-help.js','obs-vmix/painel/remoto/settings.html','obs-vmix/painel/remoto/settings.js','obs-vmix/painel/remoto/recuperacao.html','obs-vmix/painel/remoto/recuperacao.js','obs-vmix/painel/remoto/diagnosticos.html','obs-vmix/painel/remoto/studio-dialog.css',
 ...(await readdir(here)).filter(f=>/\.(mjs|ps1)$/.test(f)).map(f=>'scripts/installer-windows/qa/'+f)
];
async function entry(path){const hash=createHash('sha256');let bytes=0;for await(const b of createReadStream(resolve(workspace,path))){hash.update(b);bytes+=b.length;}return {path,bytes,sha256:hash.digest('hex')};}
for(const path of allowlist.filter(p=>/\.(mjs|js)$/.test(p)))execFileSync(process.execPath,['--check',resolve(workspace,path)],{windowsHide:true,stdio:'pipe'});
const receipts=['qa-distribution.json','qa-migration-guards.json','qa-preparation.json','qa-recovery-state.json','qa-startup-api.json','qa-setup-verify.json','ui-matrix/receipt.json'];
const evidence=[];for(const name of receipts){const path='scripts/installer-windows/build/'+name,report=JSON.parse(await readFile(resolve(workspace,path),'utf8'));if(report.status!=='PASS')throw Error('Recibo não passou: '+name);evidence.push({...await entry(path),status:report.status,qaRoot:report.qaRoot||report.root||null,checks:report.checks?.length||report.actions?.length||0});}
const result={at:new Date().toISOString(),status:'READY_FOR_INTEGRATION',owner:'installer_exe',sources:await Promise.all(allowlist.map(entry)),artifacts:await Promise.all(['scripts/installer-windows/build/FreeMix-Setup-Stub.exe','scripts/installer-windows/build/FreeMix-Uninstall.exe'].map(entry)),evidence,operatorTouched:false,finalReleaseGenerated:false,syntaxChecks:'PASS',integration:{centralPatchRequired:false,responseKey:'recovery',actions:['recovery_import_preview','recovery_import'],payload:{projectPath:'absolute external UUID.fmx directory',name:'new collection name',expectedManifestHash:'sha256 from preview; mandatory for apply'},idleRequired:true,replayJournal:false,credentialsCopied:false,outputsStarted:false,automationsStarted:false},limits:['No Authenticode certificate','No clean Windows VM','No physical-device homologation','Native online import requires principal integration verification; offline import tested with media/output fixtures','UI matrix uses API mocks','Previous sealed ZIP/EXE remain unchanged; new source requires packaging after integration','Conservative uninstall retains its own executable/receipts and user data'],registryQa:{key:'HKCU/Software/Microsoft/Windows/CurrentVersion/Uninstall/FreeMixStudio-72d6c7c1e1409391',verifiedAbsentAfterUninstall:true}};
await writeFile(resolve(here,'../build/integration-allowlist.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({status:result.status,sources:result.sources.length,evidence:result.evidence.length,syntaxChecks:result.syntaxChecks,artifacts:result.artifacts,report:'scripts/installer-windows/build/integration-allowlist.json'}));
