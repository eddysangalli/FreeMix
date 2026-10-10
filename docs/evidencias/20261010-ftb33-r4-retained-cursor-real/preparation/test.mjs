// Pure source/models. Never imports the Native runner or provisions runtime.
import fs from'node:fs/promises';import path from'node:path';import assert from'node:assert/strict';import{createHash}from'node:crypto';
import{ClockObservation,clockFields,LIMITS}from'./observation.mjs';import{MediaResetBarrier}from'./media-reset-contract.mjs';import{cooperativeClose}from'./own-native-lifecycle.mjs';
const here=import.meta.dirname,root=path.resolve(here,'../..'),checks=[],test=async(name,fn)=>{await fn();checks.push({name,status:'PASS_PREPARATION_PURE_ONLY'});};
const uuid='aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',policy='retain-last-valid-submitted-or-zero-while-invalid-v1';
const clock=(data={})=>({contractVersion:1,sourceUuid:uuid,generation:3,revision:90,epoch:2,requestedResets:1,completedResets:1,supported:true,presentedValid:true,resetInProgress:false,resetPending:false,resetReady:true,submittedCursorMs:2669,timestampSource:'submitted-source-pts',timestampDomain:'submitted-source-pts-before-wall-conversion',legacyCursorPolicy:policy,...data});
const sample=(cursor,ms,c=clock())=>({sourceUuid:uuid,clockMs:ms,requestBeginMs:ms-.5,mediaState:'OBS_MEDIA_STATE_PLAYING',mediaDuration:240006,mediaCursor:cursor,mediaClock:c}),before=sample(2669,99);
await test('Exact original oracle dba7 and7 nonobserver lifecycle/pixel/audio/setup helpers preserved',async()=>{
 assert.equal(createHash('sha256').update(await fs.readFile(path.join(here,'media-reset-contract.mjs'))).digest('hex'),'dba7b0ab66dddc6f2d96b14f8c7abdc9eca3e0cfbbd5ef1659412209f0688259');
 for(const name of['media-reset-contract.mjs','audio-contract.mjs','scenario.mjs','png.mjs','own-native-lifecycle.mjs','own-program-setup.mjs','collection-budget.mjs'])assert.deepEqual(await fs.readFile(path.join(here,name)),await fs.readFile(path.join(root,'qa-finalizacao/ftb-native32-mediaclock-observation-preparation-r3',name)));
});
await test('HistoricalR3 ALL195 samples remain FAIL using byte-exact original oracle, no modernlabel adaptation',async()=>{
 const r=JSON.parse(await fs.readFile(path.join(root,'qa-finalizacao/ftb-native32-mediaclock-observation-preparation-r3/root-ftb32-clock-real-result.json'),'utf8')),co=r.clockObservation;assert.equal(co.samples.length,195);assert.equal(co.legacy.status,'FAIL_UNCHANGED_CRITERION');
 const b=new MediaResetBarrier(co.before,{sourceUuid:co.before.sourceUuid,triggerClockMs:co.legacy.receipt.triggerClockMs});let error;for(const s of co.samples){try{b.observe(s);}catch(e){error=e.message;break;}}assert.equal(error,'No second reset/backward cursor after observed low');
});
await test('Retained invalid cursor then frame0 plus monotonic progress passes original oracle WITHOUT sample filter',()=>{
 const o=new ClockObservation(before,{sourceUuid:uuid,triggerClockMs:100});
 o.observe(sample(2702,101,clock({revision:91,requestedResets:2,resetPending:true,resetReady:false,submittedCursorMs:2702})));
 o.observe(sample(2702,151,clock({revision:92,epoch:3,requestedResets:2,completedResets:2,presentedValid:false,resetReady:false,submittedCursorMs:2702,timestampSource:'invalid-submitted-source-pts'})));
 o.observe(sample(0,201,clock({revision:93,epoch:3,requestedResets:2,completedResets:2,submittedCursorMs:0})));
 o.observe(sample(300,501,clock({revision:94,epoch:3,requestedResets:2,completedResets:2,submittedCursorMs:300})));
 o.observe(sample(1000,1201,clock({revision:95,epoch:3,requestedResets:2,completedResets:2,submittedCursorMs:1000})));
 const r=o.receipt();assert.equal(r.legacy.status,'PASS_UNCHANGED_CRITERION');assert.equal(r.samples.length,5);assert.equal(r.legacy.receipt.samples.length,5);assert.equal(r.samples[1].sourcePtsBeforeCallbackMs,null);assert.equal(r.samples[1].mediaClock.legacyCursorPolicy,policy);assert(!r.displayAcknowledged&&!r.callbackExecutionAcknowledged);
});
await test('Second backward still FAIL with newvalidlabel/policy, no relaxation',()=>{
 const o=new ClockObservation(before,{sourceUuid:uuid,triggerClockMs:100});for(const [cursor,ms,rev]of[[0,101,91],[33,134,92],[0,151,93]])o.observe(sample(cursor,ms,clock({revision:rev,epoch:3,requestedResets:2,completedResets:2,submittedCursorMs:cursor})));
 const r=o.receipt();assert.equal(r.legacy.status,'FAIL_UNCHANGED_CRITERION');assert.equal(r.legacy.failure.code,'LEGACY_SECOND_BACKWARD_CURSOR');assert.equal(r.samples.length,3);
});
await test('OldNative enum is refused even ifpolicy forged; absent/wrongpolicy also refused onvalidtimestamp',()=>{
 assert.throws(()=>clockFields(clock({presentedValid:false,resetReady:false,timestampSource:'decoder-base-fallback'}),uuid));
 for(const p of[undefined,'retain-last-submitted-or-zero-while-invalid-v1',''])assert.throws(()=>clockFields(clock({legacyCursorPolicy:p}),uuid),/CURSOR_POLICY_UNKNOWN/);
});
await test('Startup unavailable or invalid0 is descriptive only, neverready or callbackACK',()=>{
 const c=clock({supported:false,presentedValid:false,resetReady:false,timestampSource:'unavailable',generation:0,revision:0,epoch:0,requestedResets:0,completedResets:0,submittedCursorMs:0});assert.equal(clockFields(c,uuid).submittedCursorMs,0);
 const invalid=clock({presentedValid:false,resetReady:false,timestampSource:'invalid-submitted-source-pts',submittedCursorMs:0});assert.equal(clockFields(invalid,uuid).resetReady,false);
 assert.throws(()=>new ClockObservation(sample(0,99,invalid),{sourceUuid:uuid,triggerClockMs:100}));
});
await test('PTSraw may remain invalid/negative while getter holds priorvalid; all invalidsamples retained',()=>{
 const o=new ClockObservation(before,{sourceUuid:uuid,triggerClockMs:100});o.observe(sample(2669,101,clock({revision:91,presentedValid:false,resetReady:false,timestampSource:'invalid-submitted-source-pts',submittedCursorMs:-1})));assert.equal(o.samples[0].mediaCursor,2669);assert.equal(o.samples[0].sourcePtsBeforeCallbackMs,null);assert.equal(o.samples[0].mediaClock.submittedCursorMs,-1);
});
await test('DifferentUUID/generation/revisionregression/counterunknown refuse rather than switching motor',()=>{
 for(const c of[clock({sourceUuid:'other'}),clock({generation:4}),clock({revision:89}),clock({revision:NaN}),clock({completedResets:2})])assert.throws(()=>new ClockObservation(before,{sourceUuid:uuid,triggerClockMs:100}).observe(sample(0,101,c)));
});
await test('Ready contradiction/domains/boolean malformed refused',()=>{
 for(const c of[clock({presentedValid:false,timestampSource:'invalid-submitted-source-pts'}),clock({resetPending:true}),clock({timestampDomain:'physical-display'}),clock({resetReady:'true'})])assert.throws(()=>clockFields(c,uuid));
});
await test('201sample/10s finitebudget unchanged and no restartACK readiness',()=>{
 const o=new ClockObservation(before,{sourceUuid:uuid,triggerClockMs:100});for(let i=0;i<201;i++)o.observe(sample(2669,100+i*40));assert.throws(()=>o.observe(sample(2669,9000)));assert.equal(o.receipt().legacy.status,'FAIL_UNCHANGED_CRITERION');assert.equal(LIMITS.observeMs,10000);assert.equal(LIMITS.maxSamples,201);
});
await test('Only observer strictenum+policy differences; every othercollect/legacy/pixel/PCM expression unchanged',async()=>{
 const old=await fs.readFile(path.join(root,'qa-finalizacao/ftb-native32-mediaclock-observation-preparation-r3/observation.mjs'),'utf8'),now=await fs.readFile(path.join(here,'observation.mjs'),'utf8');
 const revert=now.replace("assert.equal(c.timestampSource,c.supported?(c.presentedValid?'submitted-source-pts':'invalid-submitted-source-pts'):'unavailable');assert.equal(c.legacyCursorPolicy,'retain-last-valid-submitted-or-zero-while-invalid-v1','MEDIA_CLOCK_CURSOR_POLICY_UNKNOWN');","assert.equal(c.timestampSource,c.supported?(c.presentedValid?'submitted-source-pts':'decoder-base-fallback'):'unavailable');").replace("'submittedCursorMs','timestampSource','timestampDomain','legacyCursorPolicy'].map","'submittedCursorMs','timestampSource','timestampDomain'].map");assert.equal(revert,old);
});
await test('Runner binding changed5identities only; oneRESTART, fullpost, noforce/FTBON/SRT/API',async()=>{
 const old=await fs.readFile(path.join(root,'qa-finalizacao/ftb-native32-mediaclock-observation-preparation-r3/runner.mjs'),'utf8'),now=await fs.readFile(path.join(here,'runner.mjs'),'utf8');let reverted=now;
 for(const [a,b]of[['EXECUTE-ROOT-APPROVED-FTB33-R4-RETAINED-CURSOR','EXECUTE-ROOT-APPROVED-FTB32-R3-DISTINCT-PROGRAM'],['ROOT_REVIEWED_OWN_FTB33_R4_RETAINED_CURSOR','ROOT_REVIEWED_OWN_FTB32_R3_DISTINCT_PROGRAM'],['FreeMix-QA-FTBClock33','FreeMix-QA-FTBClock32'],['ftb-native33-retained-cursor-observation','ftb-native32-mediaclock-observation'],['NativeGeneration:33','NativeGeneration:32']])reverted=reverted.replace(a,b);
 assert.equal(reverted,old);assert.equal((now.match(/OBS_WEBSOCKET_MEDIA_INPUT_ACTION_RESTART/g)||[]).length,1);assert(!now.includes('.kill('));assert(!now.includes('StartStream'));assert(now.includes('for(const root of[native.root,own])'));assert(now.includes('await verifyNative();await checkTexts();'));assert(now.includes('result.fullFTBPass=false'));
});
await test('NewNative33manifest2085/build0/fingerprint distinct; historical32 neverused as newengine',async()=>{
 const base=JSON.parse(await fs.readFile(path.join(here,'BASELINES.json'),'utf8')),bytes=await fs.readFile(path.join(root,base.nativeReceipt)),n=JSON.parse(bytes);assert.equal(base.nativeHead,'c990c4a39c445542d363f6950fb8f7f70811034a');assert.equal(n.head,base.nativeHead);assert.equal(n.files.length,2085);assert.equal(n.build.exitCode,0);assert.equal(createHash('sha256').update(bytes).digest('hex'),base.nativeReceiptSha256);assert(n.build.generatedVersionSource.includes('32.2.2-33-gc990c4a'));assert.equal(base.files.length,54);
 for(const f of base.files)assert.equal(createHash('sha256').update(await fs.readFile(path.join(root,f.path))).digest('hex'),f.sha256);
});
const exe='D:/OWN/FreeMix-QA-FTBClock33-model/bin/64bit/FreeMix.exe',pid=41;
await test('ForeignNative ownership rejects shutdown; ownidentity absent preservesprocess notforce',async()=>{
 let close=false;const calls=[];const c={async req(type,data){calls.push({type,data});return{responseData:{pid:42,executable:exe}}},close(){close=true;}};const r=await cooperativeClose({existing:c,pid,executable:exe,exit:Promise.resolve({code:0})});assert(close&&!r.success&&!r.forced&&r.preservedProcess);assert.equal(calls.length,1);assert.equal(calls[0].data.requestType,'get_interface');assert(!r.shutdownRequested);
});
await test('Bindings proposal is not authorized/no root/PID/port provisioned',async()=>{const b=JSON.parse(await fs.readFile(path.join(here,'ROOT-BINDINGS-PROPOSAL.json'),'utf8'));assert.equal(b.rootReviewed,false);assert.equal(b.status,'PENDING_ROOT_REVIEW_NOT_AUTHORIZED');assert.equal(b.ownRoot,null);assert.equal(b.port,null);assert(b.noOwnProvisioningPerformed);});
console.log(JSON.stringify({status:'PASS_R4_PREPARATION_MODELS_ONLY',checks:checks.length,NativeExecuted:false}));
if(!process.argv.includes('--verify-only'))await fs.writeFile(path.join(here,'MODEL-RESULT.json'),JSON.stringify({status:'PASS_R4_PREPARATION_MODELS_ONLY',checks,NativeExecuted:false,APIStarted:false,BrowserStarted:false,fullFTBPass:false,historicalFAILPreserved:true},null,2)+'\n',{flag:'wx'});
