import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,readdir} from 'node:fs/promises';
import {join,dirname,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {preparePortable} from '../../../obs-vmix/ferramentas/preparar-portatil.mjs';
const root=await mkdtemp(join(tmpdir(),'FreeMix-QA-Preparation-')),cfg=join(root,'config/obs-studio'),wsFile=join(cfg,'plugin_config/obs-websocket/config.json');
await mkdir(dirname(wsFile),{recursive:true});await mkdir(join(root,'painel'));
await writeFile(join(cfg,'raiz.txt'),root);await writeFile(wsFile,JSON.stringify({server_port:59121,server_password:'FIRST-LAUNCH-GENERATES-NEW-SECRET',auth_required:false}));
await writeFile(join(root,'painel/local.js'),'window.MESA_LOCAL = {"replayUrl":"http://127.0.0.1:59120/api/replay"};');
const previous=process.env.FREEMIX_API_PORT;
async function tree(folder){const result={};for(const e of await readdir(folder,{withFileTypes:true})){const path=join(folder,e.name);if(e.isDirectory())Object.assign(result,await tree(path));else result[path]=createHash('sha256').update(await readFile(path)).digest('hex');}return result;}
try{
 process.env.FREEMIX_API_PORT='invalid';const before=await tree(root);await assert.rejects(preparePortable(root),/Porta da API inválida/);assert.deepEqual(await tree(root),before);
 process.env.FREEMIX_API_PORT='59121';await assert.rejects(preparePortable(root),/válidas e diferentes/);assert.deepEqual(await tree(root),before);
 process.env.FREEMIX_API_PORT='59120';const result=await preparePortable(root);assert.equal(result.moved,false);const ws=JSON.parse(await readFile(wsFile,'utf8'));assert(ws.auth_required);assert.notEqual(ws.server_password,'FIRST-LAUNCH-GENERATES-NEW-SECRET');assert.equal(ws.server_password.length,32);
 await preparePortable(root);assert.equal(JSON.parse(await readFile(wsFile,'utf8')).server_password,ws.server_password);
 const report={status:'PASS',qaRoot:root,operatorTouched:false,appStarted:false,checks:['invalid API port refuses before any write','equal API and engine ports refuse before any write','first-launch seed gets fresh credential even when root did not move','next preparation preserves existing credential']};await writeFile(resolve(dirname(fileURLToPath(import.meta.url)),'../build/qa-preparation.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{if(previous===undefined)delete process.env.FREEMIX_API_PORT;else process.env.FREEMIX_API_PORT=previous;}
