// Actual CPU FFprobe + own-file/cache tests; mocked Native responses are models only.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {performance} from 'node:perf_hooks';
import {ReplayCadence,CADENCE_LIMITS,classifyClipPts} from './draft/replay-cadence.mjs';
import {DiskReplay} from './draft/replay-disco.mjs';
import {frameRate,frameTargets,seekTargets,timeTargets} from './draft/replay-sincronia.mjs';

const here=import.meta.dirname,prior=path.resolve(here,'../replay-finite-regression-preparation');
const read=async p=>JSON.parse(await fs.readFile(p,'utf8'));
const sha=async p=>createHash('sha256').update(await fs.readFile(p)).digest('hex');
const alPath=path.join(prior,'ALLOWLIST.json');
assert.equal(await sha(alPath),'f0bf56b9934918d253396df09e180a19138196e11a4960dcf7aa3e517b9b7749');
const al=await read(alPath),baseline=await read(path.join(prior,'BASELINES.json'));
const tool=path.join(baseline.root,'obs-vmix/runtime/ffprobe.exe');
assert.equal(await sha(tool),baseline.files.find(f=>f.path==='obs-vmix/runtime/ffprobe.exe').sha256);
const original=await read(path.join(here,'reproduction-result.json'));
for(const f of original.fixtures)assert.equal(await sha(f.file),f.sha256);
const results=[],helpers=[],real=[],models=[];
const check=async(name,fn)=>{const started=performance.now();await fn();results.push({name,pass:true,elapsedMs:performance.now()-started});};
const helper=options=>{const h=new ReplayCadence({ffprobe:tool,...options});helpers.push(h);return h;};
const cfr=await read(path.join(here,'fixture/cfr-pts.json'));
const raw=pts=>JSON.stringify({frames:pts.map(t=>({best_effort_timestamp_time:String(t)}))});
const opts={duration:30,frameMs:1000/30},cert=classifyClipPts(cfr,opts);
const fake=options=>helper({identity:async p=>p,decode:async()=>raw(cfr),...options});
const turn=()=>new Promise(r=>setImmediate(r));
let error;
try {
  await check('Frozen AL31 and source baselines preserved before test',async()=>{
    for(const f of al.files)assert.equal(await sha(path.join(prior,f.path)),f.sha256);
    const pins=await read(path.join(here,'BASELINE-PINS.json'));
    for(const p of pins.pins)assert.equal(await sha(path.join(prior,'snapshot',p.path)),p.sha256);
  });
  await check('Real whole-file FFprobe sees CFR900, lateVFR885, VFR540 and refuses only unsafe step',async()=>{
    const r=Object.create(DiskReplay.prototype);r.ffprobe=tool;
    for(const f of original.fixtures){
      const started=performance.now(),info=await r.probe(f.file,true),prepareMs=performance.now()-started;
      assert.equal(info.cadence.entireFile,true);assert.equal(info.cadence.frames,f.wholeFile.frames);
      assert.equal(info.variableFrameRate,f.wholeFile.irregular);
      assert.equal(info.cadence.status,f.wholeFile.irregular?'vfr':'cfr');
      assert(Math.abs(info.cadence.minMs-f.wholeFile.minIntervalMs)<1e-6);
      assert(Math.abs(info.cadence.maxMs-f.wholeFile.maxIntervalMs)<1e-6);
      const p={A:{...info,offsetFrames:0}},seek=seekTargets(p,'A',5500);
      if(f.wholeFile.irregular){assert.throws(()=>frameTargets(p,'A',5500,1),/cadência/);assert.equal(seek.mode,'time');assert.equal(seek.targets.A.cursor,5500);}
      else{assert.equal(frameTargets(p,'A',5500,1).targets.A.frame,166);assert.equal(seek.mode,'frame');}
      real.push({kind:f.kind,prepareMs,frames:info.cadence.frames,status:info.cadence.status,minMs:info.cadence.minMs,maxMs:info.cadence.maxMs,irregularIntervals:info.cadence.irregularIntervals,seekMode:seek.mode,stepAllowed:!f.wholeFile.irregular});
    }
    assert.equal(r.cadenceProbe.metrics.scans,3);await r.cadenceProbe.close();
  });
  await check('Metadata-only live/history probe does not construct whole-clip scanner',async()=>{
    const r=Object.create(DiskReplay.prototype);r.ffprobe=tool;
    const info=await r.probe(original.fixtures[1].file);assert.equal(info.cadence,null);assert.equal(r.cadenceProbe,undefined);
  });
  await check('Actual hydrate upgrades old sampled metadata once; repeated seeks do not rescan',async()=>{
    const old=original.fixtures[1],r=Object.create(DiskReplay.prototype);r.ffprobe=tool;
    r.state={cameraOptions:{},players:{A:{...old.current,file:old.file,cam:'OWN',metadataProbed:true,cadenceChecked:true}}};
    await r.hydratePlayers();assert.equal(r.state.players.A.cadence.status,'vfr');
    const before=r.cadenceProbe.metrics.scans;for(let n=0;n<12;n++)await r.hydratePlayers();
    assert.equal(r.cadenceProbe.metrics.scans,before);assert.throws(()=>frameTargets(r.state.players,'A',5500,1),/cadência/);
    await r.cadenceProbe.close();
  });
  await check('Real repeated saved-file certification uses compact cache, measured cold/warm',async()=>{
    const h=helper({}),file=original.fixtures[0].file;
    let t=performance.now();const a=await h.probe(file,opts),coldMs=performance.now()-t;
    a.status='unknown';a.frames=0;t=performance.now();const b=await h.probe(file,opts),warmMs=performance.now()-t;
    assert.equal(b.status,'cfr');assert.equal(b.frames,900);assert.equal(h.metrics.scans,1);assert.equal(h.metrics.cacheHits,1);
    assert(!Object.values(h.cache).some(Array.isArray));assert(!('pts' in b));models.push({name:'real-cache',coldMs,warmMs});
  });
  await check('Actual FFprobe stdout budget terminates own process and keeps step unsafe',async()=>{
    const h=helper({limits:{maxOutputBytes:128}}),a=await h.probe(original.fixtures[0].file,opts);
    assert.equal(a.status,'unknown');assert.equal(h.jobs.size,0);assert.equal(h.cache.size,0);
  });
  await check('Actual FFprobe 1ms deadline rejects certification; job is reaped',async()=>{
    const h=helper({limits:{deadlineMs:1}}),t=performance.now(),a=await h.probe(original.fixtures[0].file,opts);
    assert.equal(a.status,'unknown');assert.equal(h.jobs.size,0);assert(performance.now()-t<2500);
  });
  await check('Actual close during own FFprobe scan cancels and clears cache/jobs',async()=>{
    const h=helper({}),pending=h.probe(original.fixtures[0].file,opts);
    for(let n=0;n<100&&h.jobs.size===0;n++)await turn();assert.equal(h.jobs.size,1);
    const closed=await h.close(),result=await pending;
    assert.equal(result.status,'unknown');assert.equal(closed.quiescent,true);assert.equal(h.pending.size,0);assert.equal(h.cache.size,0);
  });
  await check('Missing file is unknown; no certification and no spawned job',async()=>{
    const h=helper({}),a=await h.probe(path.join(here,'fixture/no-such-file'),opts);
    assert.equal(a.reason,'file-unavailable');assert.equal(h.metrics.scans,0);
  });
  await check('Missing executable rejects scan without leaked jobs',async()=>{
    const h=helper({ffprobe:path.join(here,'NO_SUCH_TOOL.exe')}),a=await h.probe(original.fixtures[0].file,opts);
    assert.equal(a.status,'unknown');await turn();assert.equal(h.jobs.size,0);
  });
  await check('Duration >120.5sec refuses before decode; imported long clip remains time-seekable',async()=>{
    const h=fake({decode:()=>{throw Error('MUST_NOT_DECODE');}}),a=await h.probe('f',{duration:121,frameMs:1000/30});
    assert.equal(a.reason,'clip-duration-budget');assert.equal(h.metrics.scans,0);
    const p={A:{duration:121,frameRate:'30/1',cadence:a}};assert.equal(seekTargets(p,'A',5500).mode,'time');assert.throws(()=>frameTargets(p,'A',5500,1),/cadência/);
  });
  await check('Unknown/nonfinite rate and audio-only remain time seek, no certification',async()=>{
    const h=fake({});for(const frameMs of [undefined,NaN,Infinity,1,1001]){
      const a=await h.probe('f',{duration:30,frameMs});assert.equal(a.reason,'frame-rate-unconfirmed');
    }assert.equal(h.metrics.scans,0);
    assert.equal(seekTargets({A:{duration:30,frameRate:null,cadence:{status:'unknown'}}},'A',5500).mode,'time');
  });
  await check('Legacy sampled/null cadence can never authorize frame stepping',()=>{
    for(const cadence of [null,original.fixtures[0].current.cadence,{status:'cfr',entireFile:false}, {...cert,method:'other'}]){
      const p={A:{duration:30,frameRate:'30/1',cadence}};assert.throws(()=>frameTargets(p,'A',5500,1),/cadência/);assert.equal(seekTargets(p,'A',5500).mode,'time');
    }
  });
  await check('Linked unknown follower blocks step even with CFR anchor',()=>{
    const p={A:{duration:30,frameRate:'30/1',cadence:cert},B:{duration:30,frameRate:'30/1',cadence:{status:'unknown'}}};
    assert.throws(()=>frameTargets(p,'A',5500,1),/cadência/);assert.equal(seekTargets(p,'A',5500).mode,'time');
  });
  await check('Actual step refusal issues no player mutation in response model',async()=>{
    const r=Object.create(DiskReplay.prototype),calls=[];
    r.state={players:{A:{duration:30,frameRate:'30/1',cadence:{status:'unknown'}}},activePlayer:'A',linked:false};r.recordingFolder='replay';r.hydratePlayers=async()=>{};
    r.req=async t=>{calls.push(t);return {mediaCursor:5500};};
    await assert.rejects(r.stepFrame({delta:1}),/cadência/);assert.deepEqual(calls,['GetMediaInputStatus']);
  });
  await check('NTSC rational CFR remains floor1034ms; calibrated offsets and EOF clamp unchanged',()=>{
    const pts=Array.from({length:900},(_,i)=>i*1001/30000),cadence=classifyClipPts(pts,{duration:900*1001/30000,frameMs:1001/30});
    assert.equal(cadence.status,'cfr');const p={A:{duration:30.03,frameRate:'30000/1001',cadence,offsetFrames:0},B:{duration:30.03,frameRate:'30000/1001',cadence,offsetFrames:3}};
    const t=frameTargets(p,'A',1000,1);assert.equal(t.targets.A.cursor,1034);assert.equal(t.targets.B.cursor,1134);
    assert.equal(frameTargets(p,'A',1e6,1).targets.B.frame,899);
  });
  await check('PAL/CFR24,25,50,59.94,60,120,240 retain rational classifications',()=>{
    for(const rate of ['24/1','25/1','50/1','60000/1001','60/1','120/1','240/1']){
      const {fps,frameMs}=frameRate(rate),count=Math.round(fps*2),pts=Array.from({length:count},(_,i)=>i/fps);
      assert.equal(classifyClipPts(pts,{duration:count/fps,frameMs}).status,'cfr');
    }
  });
  await check('Missing/nonfinite/duplicate/regressing PTS fail closed',()=>{
    for(const pts of [[0,NaN],[0,Infinity],[0,0],[.1,0],[]])assert.equal(classifyClipPts(pts,opts).status,'unknown');
    assert.equal(classifyClipPts([0,1/30,2/30],opts).reason,'decoded-span-does-not-cover-clip');
  });
  await check('Unchanged 1.5ms tolerance detects real67ms gap and tolerates Matroska millisecond rounding',()=>{
    assert.equal(classifyClipPts(cfr,opts).status,'cfr');const pts=[...cfr];pts[150]+=0.002;
    assert.equal(classifyClipPts(pts,opts).status,'vfr');
  });
  await check('Decoder malformed JSON/missing frames/empty timestamp fail closed and never cache',async()=>{
    for(const data of ['{',JSON.stringify({}),JSON.stringify({frames:[null,null]}),JSON.stringify({frames:[{best_effort_timestamp_time:''},{best_effort_timestamp_time:'x'}]})]){
      const h=fake({decode:async()=>data}),a=await h.probe('f',opts);assert.equal(a.status,'unknown');assert.equal(h.cache.size,0);
    }
  });
  await check('Frame count and postdecode output budgets fail closed',async()=>{
    for(const limits of [{maxFrames:899},{maxOutputBytes:128}]){
      const h=fake({limits}),a=await h.probe('f',opts);assert.equal(a.status,'unknown');assert.equal(h.cache.size,0);
    }
    assert.throws(()=>helper({limits:{maxOutstanding:2}}),/BUDGET/);assert.throws(()=>helper({limits:{maxFrames:29001}}),/BUDGET/);assert.throws(()=>helper({limits:{maxEntries:1.5}}),/BUDGET/);
  });
  await check('Same identity concurrent requests coalesce; different identity refuses instead of queuing',async()=>{
    let resolve;const h=fake({decode:()=>new Promise(r=>{resolve=r;})}),one=h.probe('a',opts);await turn();
    const two=h.probe('a',opts),busy=await h.probe('b',opts);assert.equal(busy.reason,'scan-busy');resolve(raw(cfr));
    const [a,b]=await Promise.all([one,two]);assert.equal(a.status,'cfr');assert.equal(b.status,'cfr');assert.equal(h.metrics.scans,1);assert.equal(h.metrics.coalesced,1);
  });
  await check('Identity replacement during decode discards old result, no cache',async()=>{
    let id='old',resolve;const h=fake({identity:async()=>id,decode:()=>new Promise(r=>{resolve=r;})}),one=h.probe('a',opts);await turn();id='new';resolve(raw(cfr));
    assert.equal((await one).reason,'file-changed-during-scan');assert.equal(h.cache.size,0);
  });
  await check('Owner close while pending discards late success and retires its own generation',async()=>{
    let reject;const h=fake({decode:(_tool,_file,_limits,jobs)=>new Promise((_r,j)=>{reject=j;jobs.add({cancel(){jobs.clear();reject(Error('CANCEL'));}});})});
    const p=h.probe('a',opts);await turn();const closed=await h.close();assert(closed.quiescent);assert.equal((await p).status,'unknown');assert.equal((await h.probe('a',opts)).reason,'owner-closed');assert.equal(h.cache.size,0);
  });
  await check('Real stat identity change invalidates summary without reading file content for cache lookup',async()=>{
    const f=path.join(here,'fixture/own-cache-identity-stage3.txt');await fs.writeFile(f,'own-first',{flag:'wx'});
    const h=helper({decode:async()=>raw(cfr)}),a=await h.probe(f,opts);assert(await h.matches(f,a.identity));
    await fs.appendFile(f,'-change');assert.equal(await h.matches(f,a.identity),false);const b=await h.probe(f,opts);
    assert.notEqual(a.identity,b.identity);assert.equal(h.metrics.scans,2);
  });
  await check('LRU <=32 compact summaries; defensive clones prevent caller tampering',async()=>{
    const h=fake({});for(let n=0;n<35;n++)await h.probe(String(n),opts);assert.equal(h.cache.size,32);
    assert(!h.cache.has(JSON.stringify(['0',30,1000/30,tool])));
    const a=await h.probe('34',opts);a.frames=999;a.status='vfr';const b=await h.probe('34',opts);assert.equal(b.frames,900);assert.equal(b.status,'cfr');
    assert([...h.cache.values()].every(v=>!('pts' in v)&&Object.keys(v).length<20));
  });
  await check('Close during postdecode identity await cannot repopulate retired cache',async()=>{
    let identityCalls=0,release;
    const h=fake({identity:async()=>++identityCalls===1?'id':await new Promise(r=>{release=r;})}),p=h.probe('f',opts);
    await turn();assert.equal(identityCalls,2);const close1=h.close(),close2=h.close();assert.equal(close1,close2);
    release('id');assert.equal((await p).reason,'owner-changed');assert((await close1).quiescent);assert.equal(h.cache.size,0);
  });
  await check('Collection change closes cadence owner/cache; dispose closes preview plus cadence',async()=>{
    const r=Object.create(DiskReplay.prototype),old=fake({});await old.probe('x',opts);r.cadenceProbe=old;
    r.root=path.join(here,'fixture/no-config');r.namespace='own-only';r.req=async()=>({currentSceneCollectionName:'OWN_NEW'});
    await r.scopeState();assert(old.closed);assert.equal(old.cache.size,0);assert.equal(r.cadenceProbe,null);
    const next=fake({});r.cadenceProbe=next;let previewClosed=false;r.preview={close:async()=>{previewClosed=true;}};await r.dispose();assert(previewClosed);assert(next.closed);
  });
  await check('Unknown time endpoint uses duration1ms rather than nominal CFR EOF guess',()=>{
    assert.equal(timeTargets({A:{duration:30,frameRate:'30/1',cadence:{status:'unknown'}}},'A',1e6).targets.A.cursor,29999);
    assert.equal(timeTargets({A:{duration:30,frameRate:'30/1',cadence:cert}},'A',1e6).targets.A.cursor,29966);
  });
  await check('No align/audio/preview modifications; no Native or API launch in harness',async()=>{
    const before=await fs.readFile(path.join(prior,'snapshot/replay-disco.mjs'),'utf8'),after=await fs.readFile(path.join(here,'draft/replay-disco.mjs'),'utf8');
    for(const [start,end]of [['  async align(','  async transport('],['  async applyPlayerAudio(','  async stepFrame(']]){
      const b=before.slice(before.indexOf(start),before.indexOf(end,before.indexOf(start)));
      assert(before.indexOf(start)>=0&&before.indexOf(end)>before.indexOf(start));assert(b.length>0);assert.equal(after.slice(after.indexOf(start),after.indexOf(end,after.indexOf(start))),b);
    }
    assert.equal(await sha(path.join(here,'draft/replay-preview.mjs')),await sha(path.join(prior,'snapshot/replay-preview.mjs')));
  });
  await check('All draft modules syntax check only',()=>{
    for(const f of ['replay-cadence.mjs','replay-disco.mjs','replay-sincronia.mjs','replay-preview.mjs']){
      const r=spawnSync(process.execPath,['--check',path.join(here,'draft',f)],{windowsHide:true,encoding:'utf8'});assert.equal(r.status,0,r.stderr);
    }
  });
}catch(e){error=e;}
finally {
  const closed=await Promise.all(helpers.map(h=>h.close()));
  for(const f of al.files)assert.equal(await sha(path.join(prior,f.path)),f.sha256);
  for(const f of original.fixtures)assert.equal(await sha(f.file),f.sha256);
  const report={status:error?'FAIL_DRAFT_TESTS':'PASS_REAL_FFPROBE_AND_MODELS_DRAFT_ONLY',cases:results.length,tests:results,real,models,limits:CADENCE_LIMITS,
    resources:{helpersQuiescent:closed.every(c=>c.quiescent)},priorAllowlist:{files:31,sha256:await sha(alPath),afterMatch:true},
    NativeExecuted:false,APIExecuted:false,GPUUsed:false,operatorTouched:false,renderedFramesProven:false,audioCaptured:false,canonicalEdited:false,
    ...(error?{error:error.stack}:{})};
  await fs.writeFile(path.join(here,'draft-test-stage3-result.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({status:report.status,cases:report.cases,real,quiescent:report.resources.helpersQuiescent}));
}if(error)process.exitCode=1;
