import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {assertSdrOutputRequest,outputHdrContracts} from '../obs-vmix/ferramentas/saidas-hdr.mjs';
import {srtDestinationOptions} from '../obs-vmix/ferramentas/saidas-srt.mjs';
import {ndiRead,ndiStart} from '../obs-vmix/ferramentas/ndi-producao.mjs';
import {omtRead,omtStart} from '../obs-vmix/ferramentas/omt-producao.mjs';
import {OutputEngine} from '../obs-vmix/ferramentas/saidas-producao.mjs';
import {omtHdrExecute} from '../obs-vmix/ferramentas/omt-hdr-producao.mjs';
const receipt='qa-finalizacao/resultado-hdr-output-contracts-20261009.json';
const calls=[],forbidden=async(...args)=>{calls.push(args);throw Error('An unsupported HDR request must not reach Native');};
const engine=new OutputEngine({root:'unused',req:forbidden,optional:forbidden,vendor:forbidden});
const failures=[];
for(const protocol of ['NDI','OMT','SDI','SRT']){
 assert.equal(outputHdrContracts[protocol].hdrSupported,false);
 for(const options of [{},{hdr:false},{transfer:'sdr'},{colorSpace:'bt709'}])assert.doesNotThrow(()=>assertSdrOutputRequest(protocol,options));
 for(const options of [{hdr:true},{transfer:'bt_2100_pq'},{transfer:'hlg'},{colorSpace:'bt2020'}])assert.throws(()=>assertSdrOutputRequest(protocol,options),e=>e.code==='OUTPUT_HDR_UNSUPPORTED');
 assert.throws(()=>assertSdrOutputRequest(protocol,{hdr:'false'}),/booleana/);
}
// Regression: OutputEngine formerly replaced/ignored hdr:true before dispatch.
for(const [action,data]of [
 ['outputs_sdi',{command:'configure',hdr:true}],
 ['outputs_configure',{index:0,hdr:true}],
 ['outputs_sdi',{command:'start',transfer:'pq'}],
 ['outputs_network',{protocol:'NDI',command:'start',hdr:true}],
 ['outputs_network',{protocol:'OMT',command:'restart',colorSpace:'bt2020'}]
]){await assert.rejects(engine.execute(action,data),e=>e.code==='OUTPUT_HDR_UNSUPPORTED');failures.push({action,protocol:data.protocol||'SDI',nativeRequests:0});}
for(const [start,protocol]of [[ndiStart,'NDI'],[omtStart,'OMT']]){
 await assert.rejects(start({req:forbidden,tryReq:forbidden},{hdr:true}),e=>e.code==='OUTPUT_HDR_UNSUPPORTED');
 failures.push({action:'directStart',protocol,nativeRequests:0});
}
assert.throws(()=>srtDestinationOptions({hdr:true,chroma:'420',alphaMode:'none'}),e=>e.code==='OUTPUT_HDR_UNSUPPORTED');
assert.deepEqual(srtDestinationOptions({chroma:'420',alphaMode:'none'}),{chroma:'420',alphaMode:'none'});
assert.equal(calls.length,0,'No unsupported request may create/configure/start Native output');
for(const options of [{transfer:'pq',receiverTransfer:'hlg',manualReceiverConfirmed:true},{transfer:'pq',receiverTransfer:'pq',manualReceiverConfirmed:false},{transfer:'pq',receiverTransfer:'pq',manualReceiverConfirmed:true,alpha:true}])await assert.rejects(omtHdrExecute({tryReq:forbidden},{command:'preflight',...options}));
assert.equal(calls.length,0,'Invalid manual HDR contract must not reach Native');
const hdrCalls=[],hdrEngine=new OutputEngine({root:'unused',scene:()=>{throw Error('HDR raw UUID must not be routed through SDR scene');},optional:async(type,args)=>{hdrCalls.push(args);return {responseData:{success:true,active:false}};}});
hdrEngine.read=async()=>({});
await hdrEngine.execute('outputs_omt_hdr',{command:'preflight',sourceUuid:'real-hdr-source',transfer:'pq',receiverTransfer:'pq',manualReceiverConfirmed:true,name:'HDR'});
assert.equal(hdrCalls[0].requestData.config.sourceUuid,'real-hdr-source');
const stub={req:async type=>type==='GetInputKindList'?{inputKinds:['ndi_source','omtsource']}:{outputs:[]},tryReq:async()=>({responseData:{available:true,hdrSupported:false,pa16Supported:true}})};
assert.equal((await ndiRead(stub)).hdrContract.status,'requires_ndi_advanced_sdk_and_hdr_renderer');
assert.equal((await omtRead(stub)).hdrContract.status,'sdr_path_use_separate_manual_hdr_output');
const files=['obs-vmix/ferramentas/saidas-hdr.mjs','obs-vmix/ferramentas/saidas-srt.mjs','obs-vmix/ferramentas/saidas-producao.mjs','obs-vmix/ferramentas/ndi-producao.mjs','obs-vmix/ferramentas/omt-producao.mjs','obs-vmix/ferramentas/omt-hdr-producao.mjs','obs-vmix/painel/remoto/saidas-external-ui.js','obs-vmix/painel/remoto/saidas-omt-hdr-ui.js'];
const hashes={};for(const file of files){execFileSync(process.execPath,['--check',file],{windowsHide:true});hashes[file]=createHash('sha256').update(await readFile(file)).digest('hex');}
await writeFile(receipt,JSON.stringify({status:'PASS',finished:new Date().toISOString(),operatorTouched:false,nativeRequests:0,scope:'HDR refusal before Native mutation and truthful capability reporting; no physical HDR validation',contracts:outputHdrContracts,cases:failures,hashes},null,2));
console.log('PASS: HDR cannot be silently downgraded to SDR by output dispatch');
