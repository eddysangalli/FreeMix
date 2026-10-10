// Pure readiness contract. A RESTART ACK is not proof that the decoder clock reset.
import assert from 'node:assert/strict';
import {assertMediaPlayingInterior} from './audio-contract.mjs';
export class MediaResetBarrier {
 constructor(before,{sourceUuid,triggerClockMs}){assertMediaPlayingInterior(before);assert(before.mediaCursor>=1500,'Observe a playing cursor >=1500ms before explicit restart');assert(sourceUuid);assert(Number.isFinite(before.clockMs)&&Number.isFinite(triggerClockMs)&&triggerClockMs>=before.clockMs);this.before=before;this.sourceUuid=sourceUuid;this.triggerClockMs=triggerClockMs;this.samples=[];this.low=null;this.advances=0;this.last=null;this.ready=false;}
 observe(sample){assert.equal(sample.sourceUuid,this.sourceUuid,'Source UUID must remain exact');assert(Number.isFinite(sample.clockMs)&&sample.clockMs>=this.triggerClockMs);assert(!this.last||sample.clockMs>=this.last.clockMs,'Monotonic observation clock');assert(this.samples.length<512,'Reset sample bound');this.samples.push({...sample});this.last=sample;
  if(sample.mediaState!=='OBS_MEDIA_STATE_PLAYING'||!Number.isFinite(sample.mediaCursor)||!Number.isFinite(sample.mediaDuration))return false;
  assert.equal(sample.mediaDuration,this.before.mediaDuration,'Same loaded long fixture');
  if(!this.low){if(sample.mediaCursor<=250&&this.before.mediaCursor-sample.mediaCursor>=1000){assert(sample.mediaCursor>=0);this.low={...sample};this.progressCursor=sample.mediaCursor;}return false;}
  assert(sample.mediaCursor>=this.progressCursor,'No second reset/backward cursor after observed low');
  if(sample.mediaCursor>this.progressCursor){this.advances++;this.progressCursor=sample.mediaCursor;}
  const wall=sample.clockMs-this.low.clockMs,advance=sample.mediaCursor-this.low.mediaCursor;
  assert(Math.abs(advance-wall)<250,'Readiness progression agrees with reset clock');
  if(sample.mediaCursor>=1000&&wall>=750&&this.advances>=2){assertMediaPlayingInterior(sample);this.ready=true;return true;}return false;
 }
 requireReady(){assert(this.ready&&this.low,'Observed reset low then progress required; restart ACK alone cannot pass');assertMediaPlayingInterior(this.last);return this.last;}
 receipt(){return {contract:'observable-reset-then-progress-v1',sourceUuid:this.sourceUuid,triggerClockMs:this.triggerClockMs,before:this.before,low:this.low,advances:this.advances,ready:this.ready,samples:this.samples};}
}
