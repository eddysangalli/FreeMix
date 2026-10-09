(async()=>{
 const report=async(type,data={})=>fetch('/qa-report',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type,at:performance.now(),...data})}).catch(()=>{});
 window.addEventListener('error',e=>report('error',{message:e.message}));
 window.addEventListener('unhandledrejection',e=>report('error',{message:String(e.reason)}));
 const wait=async(fn,ms=15000)=>{const at=Date.now();while(!fn()){if(Date.now()-at>ms)throw Error('CEF wait timeout');await new Promise(r=>setTimeout(r,50));}};
 try{
  await report('boot',{ua:navigator.userAgent,mse:typeof MediaSource!=='undefined',codec:MediaSource.isTypeSupported('video/mp4; codecs="avc1.42C01E, mp4a.40.2"')});
  await wait(()=>historyState&&historyState.end>5&&replay?.rec,30000);
  await startHistoryVideo(1,true);
  await wait(()=>el('history-video').readyState>=3&&!el('history-video').paused);
  const video=el('history-video'),context=new AudioContext(),audio=context.createMediaElementSource(video),analyser=context.createAnalyser(),silence=context.createGain();
  analyser.fftSize=4096;silence.gain.value=0;audio.connect(analyser);analyser.connect(silence);silence.connect(context.destination);
  const initialMuted=video.muted;el('history-audio').click();await context.resume();await new Promise(r=>setTimeout(r,1200));
  const f=new Float32Array(analyser.frequencyBinCount);analyser.getFloatFrequencyData(f);const p=f.reduce((best,v,i)=>v>f[best]?i:best,0);
  await report('audio',{initialMuted,mutedAfterOptIn:video.muted,frequency:p*context.sampleRate/analyser.fftSize,peakDb:f[p],context:context.state,audibleOutputGain:silence.gain.value});
  video.addEventListener('waiting',()=>report('waiting',{cursor:historyPlayback?.origin+video.currentTime,ready:video.readyState}));
  video.addEventListener('error',()=>report('error',{message:'media error '+video.error?.code}));
  const started=performance.now();let seeks=0,marks=false;
  const sample=()=>{const q=video.getVideoPlaybackQuality();return {wall:performance.now()-started,cursor:historyPlayback?.origin+video.currentTime,origin:historyPlayback?.origin,end:historyState?.end,rec:replay?.rec,ready:video.readyState,paused:video.paused,frames:q.totalVideoFrames,dropped:q.droppedVideoFrames,status:el('history-status').textContent,seekCount:seeks,buffered:Array.from({length:video.buffered.length},(_,i)=>[video.buffered.start(i),video.buffered.end(i)])};};
  const timer=setInterval(()=>report('sample',sample()),2000);
  // Three seeks plus IN/OUT made through the same public controls used by the panel.
  await new Promise(r=>setTimeout(r,30000));
  let at=performance.now();await startHistoryVideo(10,false);await wait(()=>historyConfirmed>=9.95&&historyConfirmed<10.1);seeks++;await report('seek',{target:10,elapsed:performance.now()-at});el('history-in').click();
  at=performance.now();await startHistoryVideo(13,false);await wait(()=>historyConfirmed>=12.95&&historyConfirmed<13.1);seeks++;await report('seek',{target:13,elapsed:performance.now()-at});el('history-out').click();await wait(()=>!el('history-save').disabled);el('history-save').click();await wait(()=>!busy&&replay?.events?.length>0,30000);marks=true;await report('marks',{in:historyIn,out:historyOut,event:replay.events.at(-1)});
  at=performance.now();await startHistoryVideo(1,true);await wait(()=>video.readyState>=3&&!video.paused);seeks++;await report('seek',{target:1,elapsed:performance.now()-at});
  const remaining=1200000-(performance.now()-started);if(remaining>0)await new Promise(r=>setTimeout(r,remaining));
  clearInterval(timer);await report('done',{...sample(),seeks,marks});
 }catch(e){await report('fatal',{message:e.stack||String(e)});}
})();
