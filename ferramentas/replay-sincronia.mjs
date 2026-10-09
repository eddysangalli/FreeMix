// Replay cursors use the source timeline (milliseconds), independent of slow motion.
export function frameRate(value) {
  const [numerator, denominator = 1] = String(value || '').split('/').map(Number);
  const fps = numerator / denominator;
  if (!Number.isFinite(fps) || fps < 1 || fps > 240 || denominator <= 0) throw Error('Taxa de quadros não confirmada pelo vídeo');
  return { numerator, denominator, fps, frameMs: 1000 / fps };
}
export function replayCameraOptions(raw = {}) {
  const recordAudio = raw.recordAudio ?? 'input', gainDb = Number(raw.gainDb ?? 0), offsetFrames = Number(raw.offsetFrames ?? 0);
  if (!['input','master','bus-a','bus-b'].includes(recordAudio) || !Number.isFinite(gainDb) || gainDb < -60 || gainDb > 12 || !Number.isInteger(offsetFrames) || Math.abs(offsetFrames) > 3600 || raw.muted !== undefined && typeof raw.muted !== 'boolean') throw Error('Áudio, volume ou offset de câmera inválido');
  return { recordAudio, gainDb, offsetFrames, muted: raw.muted ?? false };
}
export function frameTargets(players, anchor, cursor, delta = 0) {
  if (!Number.isInteger(delta) || Math.abs(delta) > 300) throw Error('Passo de quadro inválido');
  const reference = players[anchor]; if (!reference) throw Error('Carregue o player');
  const rate = frameRate(reference.frameRate);
  if (reference.variableFrameRate) throw Error('Passo de quadro requer vídeo com taxa constante');
  let globalFrame = Math.round(cursor / rate.frameMs) - (reference.offsetFrames || 0) + delta;
  let first = -Infinity, last = Infinity;
  for (const p of Object.values(players)) {
    const own = frameRate(p.frameRate);
    if (p.variableFrameRate || Math.abs(own.fps - rate.fps) > .001) throw Error('Para vincular por quadro, use ângulos com a mesma taxa constante');
    first = Math.max(first, -(p.offsetFrames || 0));
    last = Math.min(last, Math.max(0, Math.ceil(p.duration * own.fps - .001) - 1) - (p.offsetFrames || 0));
  }
  if (last < first) throw Error('Os offsets não deixam um intervalo comum entre os ângulos');
  globalFrame = Math.max(first, Math.min(last, globalFrame));
  // Native decode selects the first frame at/after the requested timestamp.
  // Floor to milliseconds: rounding up can skip the intended rational-rate frame.
  const targets = Object.fromEntries(Object.entries(players).map(([id,p]) => [id, { frame: globalFrame + (p.offsetFrames || 0), cursor: Math.floor((globalFrame + (p.offsetFrames || 0)) * rate.frameMs + 1e-7) }]));
  return { targets, globalFrame, rate, first, last };
}

// Time alignment also accepts VFR, mixed frame rates and audio-only clips.
// Frame stepping remains strict CFR in frameTargets; this never claims genlock.
export function timeTargets(players,anchor,cursor){
 if(!players[anchor]||!Number.isFinite(cursor)||cursor<0)throw Error('Player ou cursor inválido');
 const offset=p=>{const frames=p.offsetFrames||0;if(!Number.isInteger(frames))throw Error('Offset de câmera inválido');if(!frames)return 0;return frames*frameRate(p.frameRate).frameMs;};
 const offsets=Object.fromEntries(Object.entries(players).map(([id,p])=>[id,offset(p)]));let first=-Infinity,last=Infinity;
 for(const[id,p]of Object.entries(players)){if(!Number.isFinite(p.duration)||p.duration<=0)throw Error('Duração de mídia não confirmada');first=Math.max(first,-offsets[id]);let end=p.duration*1000-1;if(p.frameRate&&!p.variableFrameRate)end=Math.floor((Math.ceil(p.duration*frameRate(p.frameRate).fps-.001)-1)*frameRate(p.frameRate).frameMs);last=Math.min(last,end-offsets[id]);}
 if(last<first)throw Error('Os offsets não deixam um intervalo comum entre os ângulos');
 const globalTime=Math.max(first,Math.min(last,cursor-offsets[anchor]));
 return {targets:Object.fromEntries(Object.keys(players).map(id=>[id,{cursor:Math.max(0,Math.floor(globalTime+offsets[id]+1e-7))}])),globalTime,first,last,mode:'time',toleranceMs:100};
}
export function seekTargets(players,anchor,cursor){
 const values=Object.values(players);if(values.every(p=>p.frameRate&&!p.variableFrameRate)&&values.every(p=>Math.abs(frameRate(p.frameRate).fps-frameRate(values[0].frameRate).fps)<.001))return {...frameTargets(players,anchor,cursor),mode:'frame',toleranceMs:Math.max(2,frameRate(players[anchor].frameRate).frameMs/2)};
 return timeTargets(players,anchor,cursor);
}

// Compare real decoded PCM, never wall-clock guesses. Positive lag means the
// follower contains the common event later. Bounded to 10s and +/-2s.
export function estimateAudioOffset(reference,follower,sampleRate=2000){
 if(sampleRate!==2000||reference.length<sampleRate||follower.length<sampleRate)throw Error('São necessários pelo menos um segundo de áudio comum');
 const count=Math.min(reference.length,follower.length,20000),maxLag=Math.min(4000,Math.floor(count/3));
 const score=lag=>{let dot=0,aa=0,bb=0,ma=0,mb=0,n=0;const first=Math.max(0,-lag),last=Math.min(count,count-lag);for(let i=first;i<last;i++){const a=reference[i],b=follower[i+lag];dot+=a*b;aa+=a*a;bb+=b*b;ma+=a;mb+=b;n++;}const va=aa-ma*ma/n,vb=bb-mb*mb/n;return va>1e-7&&vb>1e-7?(dot-ma*mb/n)/Math.sqrt(va*vb):-1;};
 const coarse=[];for(let lag=-maxLag;lag<=maxLag;lag++)coarse.push({lag,score:score(lag)});coarse.sort((a,b)=>b.score-a.score);const best=coarse[0];
 const alternate=coarse.find(x=>Math.abs(x.lag-best.lag)>100)?.score??-1;
 if(best.score<.7||best.score-alternate<.06)throw Error('Áudio sem correspondência única confiável; use um evento visual/offset manual');
 return {offsetMs:best.lag*1000/sampleRate,confidence:best.score,margin:best.score-alternate,samples:count,sampleRate,method:'pcm-cross-correlation',hardwareGenlock:false};
}
