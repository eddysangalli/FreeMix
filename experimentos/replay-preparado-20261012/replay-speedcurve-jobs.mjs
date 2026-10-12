// Explicit preparation facade. status() is a passive in-memory snapshot.
import {randomUUID} from 'node:crypto';
import {buildSpeedCurvePlan,renderPreparedSpeedCurve} from './replay-speedcurve.mjs';

export class SpeedCurvePreparations {
  constructor({adapter,selectSource,publishArtifact,epochValid,onChange=()=>{}}={}) {
    if(!adapter||[selectSource,publishArtifact,epochValid].some(f=>typeof f!=='function'))throw Error('CURVE_JOBS_CONFIG');
    Object.assign(this,{adapter,selectSource,publishArtifact,epochValid,onChange});
    this.job=null;this.closed=false;this.history=[];
  }
  status(){return {active:this.job?this.publicJob(this.job):null,recent:this.history.slice(-4)};}
  publicJob(job){return {id:job.id,requestId:job.requestId,state:job.state,eventId:job.eventId,cam:job.cam,audioPolicy:'explicit-silent-stereo',error:job.error||null,resultEventId:job.resultEventId||null};}
  update(job,state,error=null){job.state=state;job.error=error;this.onChange(this.status());}
  async prepare(data){
    if(this.closed)throw Error('CURVE_JOBS_CLOSED');if(this.job)throw Error('CURVE_PREPARATION_BUSY');
    if(!data||typeof data.eventId!=='string'||!data.eventId||typeof data.cam!=='string'||!data.cam)throw Error('CURVE_SAVED_CLIP_REQUIRED');
    if(data.requestId!==undefined&&!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.requestId))throw Error('CURVE_REQUEST_ID');
    const job={id:randomUUID(),requestId:data.requestId||null,state:'validating',eventId:data.eventId,cam:data.cam,abort:new AbortController()};
    // Reserve before the first await: two simultaneous clients cannot start two
    // decoders. A cancellation keeps this reservation until actual retirement.
    this.job=job;this.update(job,'validating');
    job.promise=(async()=>{let artifact=null,artifactRoot=null,published=false;
      try{
        const selected=await this.selectSource({eventId:data.eventId,cam:data.cam});
        if(!selected||!selected.scopeToken||this.epochValid(selected.scopeToken)!==true||job.abort.signal.aborted)throw Error('CURVE_CANCELLED_OR_SCOPE_CHANGED');
        artifactRoot=selected.outputRoot;
        const request={points:data.points,audioMode:data.audioMode,audioAcknowledged:data.audioAcknowledged,
          startSeconds:data.startSeconds??0,durationSeconds:data.durationSeconds??selected.durationSeconds};
        // Never spread request fields into roots, binary paths, adapters or the
        // collection/epoch identity established by the trusted source snapshot.
        buildSpeedCurvePlan({...selected,...request});
        artifact=await renderPreparedSpeedCurve({...selected,...request,adapter:this.adapter,
          epochValid:this.epochValid,signal:job.abort.signal,onProgress:p=>this.update(job,p.state==='ready'?'publishing':p.state,p.message)});
        // This callback must run in the replay mutation queue and re-check the
        // collection/session/original event identity before saving a NEW event.
        // It must not load any player, air it or mutate the original event.
        if(job.abort.signal.aborted||this.epochValid(selected.scopeToken)!==true)throw Error('CURVE_CANCELLED_OR_SCOPE_CHANGED');
        const result=await this.publishArtifact({artifact,source:selected,eventId:data.eventId,cam:data.cam,scopeToken:selected.scopeToken,signal:job.abort.signal});
        if(!result||typeof result.eventId!=='string')throw Error('CURVE_PUBLICATION_NOT_CONFIRMED');
        published=true;job.resultEventId=result.eventId;this.update(job,'ready');
        return {eventId:result.eventId,artifact};
      }catch(error){
        if(artifact&&!published)await this.adapter.cleanup({files:[artifact.file],root:artifactRoot,requireQuiescent:true});
        this.update(job,job.abort.signal.aborted?'cancelled':'error',error.message);throw error;
      }finally{
        // Adapter keeps an unclosed worker registered: never claim cancellation
        // complete or permit another render while it still holds the clip.
        const quiet=typeof this.adapter.quiescent==='function'?await this.adapter.quiescent():false;
        if(quiet===true){this.history.push(this.publicJob(job));this.history=this.history.slice(-4);if(this.job===job)this.job=null;this.onChange(this.status());}
        else this.update(job,'cleanup-pending','CURVE_CHILD_NOT_RETIRED');
      }
    })();
    // The command acknowledgement reports accepted PREPARATION, never ready.
    job.promise.catch(()=>{});
    return {accepted:true,jobId:job.id,state:'validating',audioPolicy:'explicit-silent-stereo'};
  }
  async cancel(jobId){
    if(!this.job||this.job.id!==jobId)throw Error('CURVE_JOB_NOT_CURRENT');
    const job=this.job;this.update(job,'cancelling');job.abort.abort();
    try{await job.promise;}catch{}
    return {cancelled:this.job===null,cleanupPending:this.job!==null,jobId};
  }
  async close(){this.closed=true;if(this.job)await this.cancel(this.job.id);return {closed:this.job===null,cleanupPending:this.job!==null};}
}
