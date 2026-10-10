// Complementary, source-clock-only proposal. No commands/retries or display ACK.
import assert from 'node:assert/strict';
const domain='submitted-source-pts-before-wall-conversion';
export function validateClock(sample,uuid){
 const c=sample.mediaClock;
 assert.equal(sample.sourceUuid,uuid,'SOURCE_UUID_CHANGED');assert(c&&c.contractVersion===1,'CLOCK_CONTRACT_UNKNOWN');assert.equal(c.sourceUuid,uuid,'CLOCK_SOURCE_UUID_CHANGED');
 for(const k of ['generation','revision','epoch','requestedResets','completedResets'])assert(Number.isSafeInteger(c[k])&&c[k]>=0,'CLOCK_COUNTER_INVALID');
 for(const k of ['supported','presentedValid','resetPending','resetInProgress','resetReady'])assert.equal(typeof c[k],'boolean','CLOCK_BOOLEAN_INVALID');
 assert(c.supported&&c.generation>0&&c.revision>0,'CLOCK_UNAVAILABLE');assert(c.completedResets<=c.requestedResets,'CLOCK_COMPLETION_IMPOSSIBLE');
 assert.equal(c.timestampDomain,domain,'CLOCK_DOMAIN_UNKNOWN');assert(Number.isFinite(c.submittedCursorMs),'CLOCK_PTS_UNKNOWN');
 if(c.presentedValid){assert.equal(c.timestampSource,'submitted-source-pts','CLOCK_VALID_SOURCE_UNKNOWN');assert(c.submittedCursorMs>=0,'CLOCK_VALID_PTS_NEGATIVE');}
 else assert(['decoder-base-fallback','invalid-submitted-source-pts','retained-source-pts-or-initial-zero'].includes(c.timestampSource),'CLOCK_INVALID_SOURCE_UNKNOWN');
 if(c.resetReady)assert(c.presentedValid&&!c.resetPending&&!c.resetInProgress&&c.completedResets===c.requestedResets,'CLOCK_READY_INCOHERENT');
 assert(Number.isFinite(sample.clockMs)&&Number.isFinite(sample.requestBeginMs)&&sample.requestBeginMs<=sample.clockMs,'OBSERVATION_TIME_INVALID');
 return c;
}
export class SubmittedResetBarrier {
 constructor(before,{sourceUuid,triggerClockMs,connectionId,speedPct=100}){
  const c=validateClock(before,sourceUuid);assert(c.resetReady,'BASELINE_NOT_READY');assert.equal(before.mediaState,'OBS_MEDIA_STATE_PLAYING');assert(before.mediaCursor>=1500);
  assert(c.submittedCursorMs>=1500);assert(before.mediaDuration>=239000&&before.mediaDuration<=241000);assert(speedPct===100,'SPEED_NOT_QUALIFIED_FOR_WALL_PROGRESS');
  assert(Number.isFinite(triggerClockMs)&&triggerClockMs>=before.clockMs);assert(typeof connectionId==='string'&&connectionId.length>0);
  this.base=structuredClone(before);this.uuid=sourceUuid;this.trigger=triggerClockMs;this.connection=connectionId;this.targetEpoch=c.epoch+1;this.targetRequest=c.requestedResets+1;
  this.previous=structuredClone(c);this.ledger=[];this.low=null;this.lastPts=null;this.advances=0;this.ready=false;this.failed=null;
 }
 observe(sample,{connectionId=this.connection}={}){
  const row={sample:structuredClone(sample),classification:'UNCLASSIFIED'};this.ledger.push(row);
  try{
   assert(!this.failed,'TERMINAL_BARRIER_FAILED');assert(this.ledger.length<=201,'FINITE_SAMPLE_LIMIT');assert.equal(connectionId,this.connection,'CONNECTION_CHANGED');
   const c=validateClock(sample,this.uuid);assert(sample.clockMs>=this.trigger&&sample.clockMs-this.trigger<=10000,'FINITE_OBSERVATION_WINDOW');
   const previous=this.previous;assert.equal(c.generation,this.base.mediaClock.generation,'SOURCE_GENERATION_CHANGED');
   assert(c.revision>=previous.revision&&c.epoch>=previous.epoch&&c.requestedResets>=previous.requestedResets&&c.completedResets>=previous.completedResets,'CLOCK_COUNTER_BACKWARD');
   assert(c.epoch<=this.targetEpoch&&c.requestedResets<=this.targetRequest,'UNEXPECTED_ADDITIONAL_RESET');
   assert.equal(sample.mediaDuration,this.base.mediaDuration,'SOURCE_DURATION_CHANGED');assert.equal(sample.mediaState,'OBS_MEDIA_STATE_PLAYING','SOURCE_NOT_PLAYING');
   if(this.ledger.length>1)assert(sample.clockMs>=this.ledger.at(-2).sample.clockMs,'OBSERVATION_CLOCK_BACKWARD');this.previous=structuredClone(c);
   if(c.epoch!==this.targetEpoch||c.requestedResets!==this.targetRequest||c.completedResets!==this.targetRequest||!c.presentedValid||!c.resetReady){
    assert(!this.low,'LOST_READY_AFTER_ARMING');row.classification='PENDING_SOURCE_RESET_OR_SUBMISSION';return false;
   }
   // Only this coherent snapshot supplies position. Legacy cursor is separate
   // and remains in the ledger; never pair its value with this readiness flag.
   const pts=c.submittedCursorMs;
   if(!this.low){assert(pts<=250&&this.base.mediaClock.submittedCursorMs-pts>=1000,'POST_RESET_LOW_NOT_OBSERVED');this.low={clockMs:sample.clockMs,pts,revision:c.revision};this.lastPts=pts;row.classification='FIRST_VALID_RESET_SUBMISSION';return false;}
   assert(pts>=this.lastPts,'SUBMITTED_PTS_BACKWARD_AFTER_READY');
   if(pts>this.lastPts){assert(c.revision>previous.revision,'PTS_CHANGED_WITH_CACHED_REVISION');this.advances++;this.lastPts=pts;}
   const wall=sample.clockMs-this.low.clockMs,advance=pts-this.low.pts;
   assert(Math.abs(advance-wall)<250,'ORIGINAL_PROGRESS_TOLERANCE');row.classification='VALID_SUBMITTED_PROGRESS';
   if(pts>=1000&&wall>=750&&this.advances>=2){assert(pts<sample.mediaDuration-1000,'STRICT_INTERIOR');this.ready=true;}
   return this.ready;
  }catch(e){this.failed??=e.message;this.ready=false;row.classification='FAILED';row.reason=e.message;throw e;}
 }
 requireReady(){assert(!this.failed&&this.ready,'OBSERVED_SUBMISSION_RESET_PROGRESS_REQUIRED');return this.receipt();}
 receipt(){return {contract:'single-request-source-submission-reset-barrier-proposal-v2',ready:this.ready,failure:this.failed,targetEpoch:this.targetEpoch,targetRequestedResets:this.targetRequest,ledger:this.ledger,allSamplesPreserved:true,displayAcknowledged:false,callbackExecutionAcknowledged:false,legacyCriterionReplaced:false,NativeExecuted:false};}
}
