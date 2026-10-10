// Recipes only. No processes, sockets, clients or mutation on import.
const uuid=v=>typeof v==='string'&&/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(v);
export function destinations({programPort,sourcePort,sourceUuid,encoder='obs_x264'}){
 if(!uuid(sourceUuid)||!['obs_x264'].includes(encoder)||![programPort,sourcePort].every(p=>Number.isInteger(p)&&p>=49152&&p<=65535)||programPort===sourcePort)throw Error('Own UUID and distinct reserved loopback ephemeral ports required');
 const common={enabled:true,autoStart:false,protocol:'srt',key:'',mode:'program',sourceUuid:'',audioSourceUuid:'',audioTrack:0,mixId:2,stingerAudio:false,width:1280,height:720,bitrate:18000,encoder,chroma:'420',alphaMode:'none',fpsDivisor:1,overlaysMask:255,overlayChannels:Array.from({length:8},(_,i)=>({channel:7+i})),fill:false,enhancedRtmp:false};
 return [{...common,name:'Own QA opaque Program',server:`srt://127.0.0.1:${programPort}?mode=caller&latency=120000`},{...common,name:'Own QA excluded Source',mode:'source',sourceUuid,server:`srt://127.0.0.1:${sourcePort}?mode=caller&latency=120000`,overlaysMask:0}];
}
export function gateRequest(s,{id,connectionId,enabled,active,durationMs=2000}){
 if(s.contractVersion!==2||s.contract!=='experimental-master-final-video-gate-v2'||s.gainDomain!=='linear-sRGB'||s.renderTargetContract!=='sRGB-SDR8'||s.renderTargetSupported!==true||s.audioPolicy!=='unchanged'||s.available!==true||s.transitionRunning!==false||s.captureMismatch!==false||s.resetRequired!==false||s.clockFault!==false)throw Error('Own Native final-stage contract state required');
 if(![s.programUuid,s.previewUuid,s.outputSourceUuid].every(uuid)||!s.scope||!s.contextToken||!Number.isInteger(s.mixIdentity)||s.mixIdentity<=0||!Number.isInteger(s.generation)||s.generation<=0)throw Error('Own state identities required');
 if(![id,connectionId].every(v=>typeof v==='string'&&/^[A-Za-z0-9_-]{1,80}$/.test(v))||typeof enabled!=='boolean'||typeof active!=='boolean'||active&&!enabled||!Number.isInteger(durationMs)||durationMs<50||durationMs>20000)throw Error('Explicit desired state/IDs required');
 return {command:'set',experimentalOptIn:true,audioPolicy:'unchanged',enabled,active,durationMs,operationId:id,connectionId,expectedScope:s.scope,expectedContextToken:s.contextToken,expectedProgramUuid:s.programUuid,expectedPreviewUuid:s.previewUuid,expectedOutputSourceUuid:s.outputSourceUuid,expectedMixIdentity:s.mixIdentity,expectedGeneration:s.generation};
}
export function measureSingleGain(baselineLinear,currentLinear,{expected=.5,tolerance=.06}={}){
 if(!Array.isArray(baselineLinear)||!Array.isArray(currentLinear)||baselineLinear.length!==currentLinear.length||baselineLinear.length<3)throw Error('Matched linear-light ROI samples required');
 const ratios=[];for(let n=0;n<baselineLinear.length;n++){const a=baselineLinear[n],b=currentLinear[n];if(!Number.isFinite(a)||!Number.isFinite(b)||a<.05||a>1||b<0||b>1)throw Error('Finite nonsaturated linear samples required');ratios.push(b/a);}
 const mean=ratios.reduce((a,b)=>a+b,0)/ratios.length;return {mean,expected,tolerance,pass:ratios.every(r=>Math.abs(r-expected)<=tolerance),doubleGainDetected:Math.abs(mean-expected*expected)<tolerance};
}
export function rationalPts(pts,{num,den,timebase=90000,toleranceTicks=1}={}){
 if(![num,den,timebase].every(n=>Number.isInteger(n)&&n>0)||!Array.isArray(pts)||pts.length<3||!pts.every(Number.isFinite))throw Error('Actual decoder PTS ticks and rational FPS required');const expectedStep=timebase*den/num;const steps=pts.slice(1).map((p,i)=>p-pts[i]);return {expectedStep,frames:pts.length,monotonic:steps.every(s=>s>0),rational:steps.every(s=>Math.abs(s-expectedStep)<=toleranceTicks)};
}
export function pcmStats(samples,{channels=2,rate=48000,frequencies=[440,880]}={}){
 if(!(samples instanceof Float32Array)||!Number.isInteger(channels)||channels<1||frequencies.length!==channels||samples.length<rate*channels||samples.length%channels)throw Error('At least one actual PCM second required');
 const frames=samples.length/channels,result=[];
 for(let c=0;c<channels;c++){let energy=0,peak=0,real=0,imag=0;for(let i=0;i<frames;i++){const s=samples[i*channels+c];if(!Number.isFinite(s))throw Error('Nonfinite PCM');energy+=s*s;peak=Math.max(peak,Math.abs(s));const phase=2*Math.PI*frequencies[c]*i/rate;real+=s*Math.cos(phase);imag+=s*Math.sin(phase);}result.push({rms:Math.sqrt(energy/frames),peak,frequency:frequencies[c],toneEnergyRatio:energy?(2*(real*real+imag*imag)/frames)/energy:0});}
 return {frames,channels,rate,channelsStats:result};
}
