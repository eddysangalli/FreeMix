import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,readdir} from 'node:fs/promises';
import {join,resolve} from 'node:path';import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';import {execFile} from 'node:child_process';import {promisify} from 'node:util';import net from 'node:net';import {pathToFileURL} from 'node:url';
import {installPortable} from '../ferramentas/instalar-portatil.mjs';
const run=promisify(execFile),candidate=JSON.parse(await readFile('qa-finalizacao/candidate-release.json','utf8'));
assert(candidate.packageRoot&&['PACKAGE_VERIFIED','SETUP_VERIFIED'].includes(candidate.status),'Candidate is not sealed/verified');
const root=await mkdtemp(join(tmpdir(),'FreeMix-QA-Package-Startup-')),checks=[],receipt={status:'RUNNING',root,version:candidate.version,operatorTouched:false,firewallApplied:false,shortcutsCreated:false};let obs,apiPid,nativePid,error;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const freePort=async()=>{const s=net.createServer();await new Promise(r=>s.listen(0,'127.0.0.1',r));const p=s.address().port;await new Promise(r=>s.close(r));return p;};
const info=async pid=>JSON.parse((await run(join(root,'runtime/freemix-process-info.exe'),[String(pid)],{windowsHide:true})).stdout)[0];
const belongs=async(pid,exe)=>{const state=await info(pid);assert(state.exited||resolve(state.path).toLowerCase()===resolve(exe).toLowerCase(),'PID does not belong to this QA');return state;};
try {
 const apiPort=await freePort(),wsPort=await freePort();assert.notEqual(apiPort,wsPort);await installPortable(candidate.packageRoot,root,{apiPort,wsPort});checks.push('Pacote completo assinado instalado em TEMP novo, credenciais locais geradas e zero abertura automática');
 const installedVersion=JSON.parse(await readFile(join(root,'version.json'),'utf8'));assert.equal(installedVersion.version,candidate.version);
 const started=await run(join(root,'runtime/node.exe'),[join(root,'ferramentas/iniciar-freemix.mjs'),'--minimized'],{env:{...process.env,FREEMIX_ROOT:root,FREEMIX_API_PORT:String(apiPort)},windowsHide:true,timeout:90000,maxBuffer:4*1024*1024});
 const launch=JSON.parse(started.stdout.trim());assert(launch.success&&launch.ready&&launch.ndiLoaded);nativePid=launch.pid;await belongs(nativePid,join(root,'bin/64bit/FreeMix.exe'));
 const health=await fetch('http://127.0.0.1:'+apiPort+'/api/health').then(r=>r.json());assert.equal(health.installationId,createHash('sha256').update(root.toLowerCase()).digest('hex'));apiPid=health.pid;await belongs(apiPid,join(root,'runtime/node.exe'));
 const {connect}=await import(pathToFileURL(join(root,'ferramentas/obsws.mjs')).href);obs=await connect({root});const native=(await obs.req('CallVendorRequest',{vendorName:'freemix',requestType:'get_interface',requestData:{}})).responseData;assert.equal(native.pid,nativePid);assert.equal(resolve(native.executable).toLowerCase(),resolve(root,'bin/64bit/FreeMix.exe').toLowerCase());assert(!(await obs.req('GetOutputList')).outputs.some(o=>o.outputActive));assert.equal((await obs.req('GetRecordStatus')).outputActive,false);assert.equal((await obs.req('GetStreamStatus')).outputActive,false);
 const recordPath=(await obs.req('GetRecordDirectory')).recordDirectory;assert(resolve(recordPath).toLowerCase().startsWith(resolve(root).toLowerCase()+'\\'),'Default recording directory escapes QA');checks.push('Launcher instalado inicia API + Native real, barramentos e NDI; REC/stream/saídas ficam parados e gravações apontam para a nova raiz');
 const pages=['/settings','/replay','/saidas?context=external','/saidas?context=streaming','/gc','/macros','/atalhos','/diagnosticos','/recuperacao'];for(const path of pages){const response=await fetch('http://127.0.0.1:'+apiPort+path);assert.equal(response.status,200,path);assert((await response.text()).includes('<html'),path);}
 const state=await fetch('http://127.0.0.1:'+apiPort+'/api/json').then(r=>r.json());assert(state.connected);checks.push('Nove janelas essenciais retornam HTML e o estado confirma conexão ao motor desta instalação');
 const repeated=JSON.parse((await run(join(root,'runtime/node.exe'),[join(root,'ferramentas/iniciar-api.mjs')],{env:{...process.env,FREEMIX_ROOT:root,FREEMIX_API_PORT:String(apiPort)},windowsHide:true,timeout:30000})).stdout.trim());assert(repeated.reused);assert.equal(repeated.pid,apiPid);checks.push('Reabrir controle reutiliza a API própria sem duplicar serviço');
 await sleep(12000);const closeAt=Date.now();await obs.req('CallVendorRequest',{vendorName:'freemix',requestType:'shutdown_idle',requestData:{qaClose:true}});obs.close();obs=null;let ended=false;for(let n=0;n<120;n++){if((await info(nativePid)).exited){ended=true;break;}await sleep(100);}assert(ended,'Native did not close');receipt.nativeCloseMs=Date.now()-closeAt;checks.push('Native real fecha cooperativamente após carregamento da suíte de plugins');
 const crashDir=join(root,'config/obs-studio/crashes');const crashFiles=await readdir(crashDir).catch(e=>{if(e.code==='ENOENT')return [];throw e;});assert.equal(crashFiles.length,0,'New crash artifact in owned installation');receipt.newCrashArtifacts=crashFiles.length;
 const logs=await readdir(join(root,'config/obs-studio/logs'));let allocations=[];for(const name of logs.filter(n=>n.endsWith('.txt'))){const body=await readFile(join(root,'config/obs-studio/logs',name),'utf8');for(const m of body.matchAll(/Number of memory leaks:\s*(\d+)/g))allocations.push(Number(m[1]));}receipt.nativeUnfreedAllocations=allocations;
 receipt.status='PASS';receipt.apiPort=apiPort;receipt.wsPort=wsPort;receipt.nativePid=nativePid;receipt.apiPid=apiPid;receipt.nativeSha256=createHash('sha256').update(await readFile(join(root,'bin/64bit/FreeMix.exe'))).digest('hex');receipt.limits=['Current Windows development machine; not a clean VM','No physical audio/video/controller devices started','HTTP route checks are not visual approval of every CEF dialog','Cooperative close observed; detached Native exit code is not captured here','Native unfreed allocations are reported, not asserted to be zero'];
}catch(e){error=e;receipt.status='FAIL';receipt.error=e.stack;}
finally{
 if(obs){try{await obs.req('CallVendorRequest',{vendorName:'freemix',requestType:'shutdown_idle',requestData:{qaClose:true}});}catch{}obs.close();}
 if(apiPid){const state=await belongs(apiPid,join(root,'runtime/node.exe'));if(!state.exited)process.kill(apiPid);}
 receipt.at=new Date().toISOString();receipt.checks=checks;await writeFile('qa-finalizacao/resultado-package-native-startup.json',JSON.stringify(receipt,null,2));console.log(JSON.stringify(receipt));
}
if(error)throw error;
