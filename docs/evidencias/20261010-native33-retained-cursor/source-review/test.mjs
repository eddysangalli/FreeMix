import assert from 'node:assert/strict';import fs from 'node:fs/promises';import path from 'node:path';import {createHash}from'node:crypto';
import {SubmittedResetBarrier}from'./reset-ready-clock-contract.mjs';import {MediaResetBarrier}from'./legacy-media-reset-contract.mjs';
const here=import.meta.dirname,root=path.resolve(here,'../..'),results=[];
const check=async(name,fn)=>{await fn();results.push({name,status:'PASS_PURE_SOURCE_MODEL_ONLY'});};
const observation=JSON.parse(await fs.readFile(path.join(here,'observation-samples.json'),'utf8'));
const before=observation.before,uuid=before.sourceUuid,trigger=observation.legacy.receipt.triggerClockMs,connectionId='own-model-connection';
const make=()=>new SubmittedResetBarrier(before,{sourceUuid:uuid,triggerClockMs:trigger,connectionId});
const s=observation.samples;
await check('ALL195 real samples retained; legacy unchanged exact FAIL and original file hash',async()=>{
 const b=new MediaResetBarrier(before,{sourceUuid:uuid,triggerClockMs:trigger});let failure;for(const sample of s){try{b.observe(sample);}catch(e){failure=e.message;break;}}
 assert.equal(failure,'No second reset/backward cursor after observed low');assert.equal(observation.legacy.status,'FAIL_UNCHANGED_CRITERION');assert.equal(s.length,195);
 assert.equal(createHash('sha256').update(await fs.readFile(path.join(root,observation.report))).digest('hex'),observation.reportSha256);
});
let complementary;
await check('Complementary offline analysis classifies old epoch/fallback pending; preserves195 and no display ACK',()=>{
 const b=make();for(const sample of s)b.observe(sample);complementary=b.requireReady();assert.equal(complementary.ledger.length,195);
 assert.equal(complementary.ledger[0].classification,'PENDING_SOURCE_RESET_OR_SUBMISSION');assert.equal(complementary.ledger[1].classification,'PENDING_SOURCE_RESET_OR_SUBMISSION');assert.equal(complementary.ledger[2].classification,'FIRST_VALID_RESET_SUBMISSION');
 assert(!complementary.displayAcknowledged&&!complementary.callbackExecutionAcknowledged&&!complementary.legacyCriterionReplaced);
});
await check('Predicted retained getter trace, exact LEGACY oracle unchanged: model only, not Native proof',()=>{
 const b=new MediaResetBarrier(before,{sourceUuid:uuid,triggerClockMs:trigger});
 for(const sample of s){const prediction=structuredClone(sample);prediction.mediaCursor=Math.trunc(sample.mediaClock.submittedCursorMs);b.observe(prediction);}
 b.requireReady();assert.equal(b.low.mediaCursor,0);assert.equal(b.samples.length,195);
});
await check('Legacy failure reproduced for legitimate decoder-future33 then actual submitted0, regardless counters',()=>{
 const b=new MediaResetBarrier(before,{sourceUuid:uuid,triggerClockMs:trigger});b.observe(s[0]);b.observe(s[1]);assert.throws(()=>b.observe(s[2]),/No second reset/);
});
const bad=(sample,fn,expected)=>{const b=make(),changed=structuredClone(sample);fn(changed);assert.throws(()=>b.observe(changed),expected);assert.equal(b.ledger.length,1);assert.equal(b.ledger[0].classification,'FAILED');assert.throws(()=>b.requireReady());};
await check('ACK/old epoch/submitted stale never arms; repeated cached snapshot cannot count as progress',()=>{
 const b=make();b.observe(s[0]);b.observe(s[1]);assert(!b.low);assert.throws(()=>b.requireReady());b.observe(s[2]);const t=structuredClone(s[2]);t.clockMs+=20;b.observe(t);assert.equal(b.advances,0);assert(!b.ready);
});
await check('SourceUUID/clockUUID/generation/connection exact, no reconnect adoption',()=>{
 bad(s[2],x=>x.sourceUuid='other',/SOURCE_UUID_CHANGED/);bad(s[2],x=>x.mediaClock.sourceUuid='other',/CLOCK_SOURCE_UUID_CHANGED/);bad(s[2],x=>x.mediaClock.generation++,/GENERATION_CHANGED/);
 const b=make();assert.throws(()=>b.observe(s[2],{connectionId:'replacement'}),/CONNECTION_CHANGED/);assert.equal(b.ledger.length,1);
});
await check('Additional pending/complete reset or EOF epoch rejected, never >= target',()=>{
 bad(s[2],x=>{x.mediaClock.requestedResets++;x.mediaClock.completedResets++;},/ADDITIONAL_RESET/);bad(s[2],x=>x.mediaClock.epoch++,/ADDITIONAL_RESET/);
});
await check('Counters malformed/regressed and contradictory ready fail closed',()=>{
 bad(s[2],x=>x.mediaClock.revision=0,/COUNTER|UNAVAILABLE/);bad(s[2],x=>x.mediaClock.completedResets=2,/COMPLETION/);bad(s[2],x=>x.mediaClock.presentedValid=false,/INCOHERENT|SOURCE_UNKNOWN/);
 bad(s[2],x=>x.mediaClock.revision=51,/COUNTER_BACKWARD/);bad(s[2],x=>x.mediaClock.epoch=.5,/COUNTER_INVALID/);
});
await check('Negative/unknown domain, absent snapshot, duration or paused state refuse readiness',()=>{
 bad(s[2],x=>x.mediaClock.submittedCursorMs=-1,/NEGATIVE/);bad(s[2],x=>x.mediaClock.timestampDomain='display-pts',/DOMAIN_UNKNOWN/);bad(s[2],x=>delete x.mediaClock,/CONTRACT_UNKNOWN/);
 bad(s[2],x=>x.mediaDuration=1234,/DURATION_CHANGED/);bad(s[2],x=>x.mediaState='OBS_MEDIA_STATE_PAUSED',/NOT_PLAYING/);
});
await check('Same epoch second backward AFTER valid reset remains error, no sample omission',()=>{
 const b=make();b.observe(s[2]);b.observe(s[3]);const x=structuredClone(s[4]);x.mediaClock.submittedCursorMs=0;assert.throws(()=>b.observe(x),/PTS_BACKWARD/);assert.equal(b.ledger.length,3);assert(!b.ready);
});
await check('Loss of valid/ready after arming preserves terminal error instead of returning pending',()=>{
 const b=make();b.observe(s[2]);const x=structuredClone(s[3]);x.mediaClock.presentedValid=false;x.mediaClock.resetReady=false;x.mediaClock.timestampSource='invalid-submitted-source-pts';assert.throws(()=>b.observe(x),/LOST_READY/);
});
await check('Progress must advance revision; exact original250ms tolerance maintained',()=>{
 const b=make();b.observe(s[2]);const x=structuredClone(s[3]);x.mediaClock.revision=s[2].mediaClock.revision;assert.throws(()=>b.observe(x),/CACHED_REVISION/);
 const c=make();c.observe(s[2]);const y=structuredClone(s[3]);y.clockMs+=1000;assert.throws(()=>c.observe(y),/ORIGINAL_PROGRESS_TOLERANCE/);
});
await check('Finite10s/201 samples and nonqualified speed refuse, no implicit retries',()=>{
 bad(s[2],x=>x.clockMs=trigger+10001,/FINITE_OBSERVATION/);assert.throws(()=>new SubmittedResetBarrier(before,{sourceUuid:uuid,triggerClockMs:trigger,connectionId,speedPct:50}),/SPEED_NOT_QUALIFIED/);
 const b=make();for(let i=0;i<201;i++)b.observe(s[0]);assert.throws(()=>b.observe(s[0]),/FINITE_SAMPLE_LIMIT/);assert.equal(b.ledger.length,202);
});
// Pure semantics of the proposed mutex-protected tuple. Does not pretend to
// execute libobs or prove C scheduling/TSAN correctness.
const model=()=>({presented:0,valid:false,lastValid:0,speed:100,next:0});
const submit=(m,pts)=>{m.presented=pts;m.valid=pts>=0;if(m.valid)m.lastValid=pts;};
const reset=m=>{m.valid=false;m.next=0;};const cursor=m=>Math.trunc(m.lastValid*m.speed/100000000);
await check('Uninitialized and invalid negative PTS retain zero; B1 getter-only counterexample preserved',()=>{
 const m=model();assert.equal(cursor(m),0);submit(m,-33000000);assert.equal(cursor(m),0);submit(m,1500000000);submit(m,-1);assert.equal(cursor(m),1500);
 assert.equal(Math.trunc(m.presented*m.speed/100000000)||0,0);assert.notEqual(m.lastValid,m.presented);
});
await check('Reset/seek/paused retain last valid; first submitted0 alone changes cursor, not future next_pts',()=>{
 const m=model();submit(m,1634000000);reset(m);m.next=33333333;assert.equal(cursor(m),1634);assert(!m.valid);submit(m,0);assert.equal(cursor(m),0);
 submit(m,7500000000);assert.equal(cursor(m),7500);reset(m);m.next=33333333;assert.equal(cursor(m),7500);
});
await check('Audio-only uses existing submit hook; missing callback stays0; does not infer playback progress',()=>{
 const m=model();m.next=3000000000;assert.equal(cursor(m),0);submit(m,21333333);assert.equal(cursor(m),21);reset(m);assert.equal(cursor(m),21);
});
await check('Speed conversion unchanged at1/50/100/200; VFR/NTSC nonzero start not normalized or forced to0',()=>{
 for(const speed of[1,50,100,200]){const m=model();m.speed=speed;submit(m,123456789);assert.equal(cursor(m),Math.trunc(123456789*speed/100000000));}
 const m=model();for(const pts of[73300000,110500000,187900000]){submit(m,pts);assert.equal(cursor(m),Math.trunc(pts/1000000));}reset(m);assert.equal(cursor(m),187);submit(m,73300000);assert.equal(cursor(m),73);
});
await check('EOF/restart may retain until preload or first callback; generation recreation starts0, not continuity',()=>{
 const m=model();submit(m,239500000000);reset(m);assert.equal(cursor(m),239500);const recreated=model();assert.equal(cursor(recreated),0);
});
await check('Exact3 proposed source files: getter no decoder read; mutex field writer before callback; no reset/seek edits',async()=>{
 const targets=JSON.parse(await fs.readFile(path.join(here,'retained-r2/TARGETS.json'),'utf8'));assert.equal(targets.targets.length,3);
 const c=await fs.readFile(path.join(here,'retained-r2/draft/freemix-app/shared/media-playback/media-playback/media.c'),'utf8');const base=await fs.readFile(path.join(here,'baseline/freemix-app/shared/media-playback/media-playback/media.c'),'utf8');
 const section=(t,start,end)=>t.slice(t.indexOf(start),t.indexOf(end,t.indexOf(start)));
 const getter=section(c,'int64_t mp_media_get_current_time','int64_t mp_media_get_frames');assert(!getter.includes('mp_media_get_base_pts'));assert(getter.indexOf('pthread_mutex_lock')<getter.indexOf('last_valid_submitted_pts'));assert(getter.indexOf('const int speed')<getter.indexOf('pthread_mutex_unlock'));
 assert.equal(section(c,'bool mp_media_reset','static inline bool mp_media_sleep'),section(base,'bool mp_media_reset','static inline bool mp_media_sleep'));
 assert.equal(section(c,'bool mp_media_prepare_frames','static inline int64_t mp_media_get_next_min_pts'),section(base,'bool mp_media_prepare_frames','static inline int64_t mp_media_get_next_min_pts'));
 assert(c.includes('m->presented_valid = pts >= 0;\r\n\tif (m->presented_valid)\r\n\t\tm->last_valid_submitted_pts = pts;'));
 assert(c.includes('memset(media, 0, sizeof(*media))'));assert(base.indexOf('media->speed = info->speed')<base.indexOf('mp_media_init_internal(media, info)'));
 const source=await fs.readFile(path.join(here,'retained-r2/draft/freemix-app/plugins/obs-ffmpeg/obs-ffmpeg-source.c'),'utf8');assert(source.includes('invalid-submitted-source-pts'));assert(source.includes('retain-last-valid-submitted-or-zero-while-invalid-v1'));
});
if(!process.argv.includes('--verify-only')){
 await fs.writeFile(path.join(here,'model-results.json'),JSON.stringify({status:'PASS_OFFSIDE_SOURCE_MODELS_ONLY',checks:results,checksCount:results.length,originalLegacyFAILUnchanged:true,complementaryReadyOffline:complementary.ready,originalSamples:195,NativeCompiled:false,NativeExecuted:false,physicalDisplayProven:false},null,2)+'\n',{flag:'wx'});
 await fs.writeFile(path.join(here,'complementary-offline-analysis.json'),JSON.stringify(complementary,null,2)+'\n',{flag:'wx'});
}
console.log(JSON.stringify({status:'PASS_OFFSIDE_SOURCE_MODELS_ONLY',checks:results.length}));
