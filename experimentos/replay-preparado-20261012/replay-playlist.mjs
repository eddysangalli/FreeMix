// Saved replay playlists are prepared off air. CUT/FADE are baked into one
// verified file; this controller never changes OBS' global transition.
import {randomUUID, createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {mkdir, lstat, realpath} from 'node:fs/promises';
import {join, resolve} from 'node:path';

export const PLAYLIST_LIMITS=Object.freeze({items:8,definitions:16,duration:120,fileBytes:256*1024*1024,totalBytes:512*1024*1024,prepareMs:120000,monitorMs:150,endGraceMs:5000});
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const clone=value=>JSON.parse(JSON.stringify(value));
const number=value=>Number(Number(value).toFixed(9));
const comparePath=value=>resolve(value).replaceAll('\\','/').toLowerCase();

export function normalizePlaylist(value) {
  if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Lista inválida');
  const id=value.id||randomUUID();
  if(!uuid.test(id)||typeof value.name!=='string'||!value.name.trim()||value.name.length>80)throw Error('Nome ou ID da lista inválido');
  if(!Array.isArray(value.items)||value.items.length<1||value.items.length>PLAYLIST_LIMITS.items)throw Error('Selecione entre um e oito lances');
  if(value.endMode!=='HOLD'&&value.endMode!=='LIVE')throw Error('Escolha manter o último quadro ou voltar ao vivo ao terminar');
  const items=value.items.map((item,index)=>{
    if(!item||!uuid.test(item.eventId)||typeof item.cam!=='string'||!item.cam||item.cam.length>120)throw Error('Lance ou câmera inválido');
    if(item.speedCurve)throw Error('Prepare a curva como um novo lance antes de incluí-lo na lista');
    const transition=item.transition||{type:'CUT',durationMs:0};
    if(!['CUT','FADE'].includes(transition.type))throw Error('Transição deve ser CUT ou FADE');
    const durationMs=Number(transition.durationMs||0);
    if(!Number.isInteger(durationMs)||transition.type==='CUT'&&durationMs!==0||transition.type==='FADE'&&(durationMs<40||durationMs>2000))throw Error('FADE deve durar de 40 a 2000 ms');
    if(index===value.items.length-1&&transition.type!=='CUT')throw Error('O último lance não tem transição para outro lance');
    return {eventId:item.eventId,cam:item.cam,transition:{type:transition.type,durationMs}};
  });
  return {version:1,id,name:value.name.trim(),endMode:value.endMode,items};
}

// Both CUT and FADE have one continuous audio stream. Missing/muted clip audio
// becomes declared silence. Fade duration is output time, not source time.
export function buildPlaylistRecipe({clips,width,height,fps,outputFile}) {
  if(!Array.isArray(clips)||!clips.length||clips.length>PLAYLIST_LIMITS.items)throw Error('Lista sem clipes');
  if(![width,height].every(v=>Number.isInteger(v)&&v>=240&&v<=1920&&v%2===0)||height>1080)throw Error('Prepare listas em até 1920×1080');
  const parts=String(fps).split('/').map(Number),rate=parts.length===2?parts[0]/parts[1]:parts[0];
  if(!Number.isFinite(rate)||rate<10||rate>60||!/^\d+(\/\d+)?$/.test(String(fps)))throw Error('Taxa de quadros inválida');
  let duration=0;const graph=[],boundaries=[];
  const args=['-hide_banner','-v','error','-n','-threads','2','-filter_complex_threads','2'];
  for(const [i,clip]of clips.entries()) {
    if(!Number.isFinite(clip.duration)||clip.duration<.2||clip.duration>120||typeof clip.file!=='string')throw Error('Duração de lance inválida');
    args.push('-threads','2','-i',clip.file);
    graph.push(`[${i}:v:0]trim=duration=${number(clip.duration)},setpts=PTS-STARTPTS,scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=${fps},format=yuv420p,settb=AVTB[v${i}]`);
    graph.push(clip.audio?`[${i}:a:0]atrim=duration=${number(clip.duration)},asetpts=PTS-STARTPTS,aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,apad,atrim=duration=${number(clip.duration)}[a${i}]`:`anullsrc=r=48000:cl=stereo,atrim=duration=${number(clip.duration)},asetpts=PTS-STARTPTS[a${i}]`);
  }
  let v='v0',a='a0';duration=clips[0].duration;
  for(let i=1;i<clips.length;i++) {
    const previous=clips[i-1],fade=previous.transition.type==='FADE'?previous.transition.durationMs/1000:0;
    if(fade>=Math.min(previous.duration,clips[i].duration)/2)throw Error('FADE deve ser menor que a metade dos dois lances');
    const offset=duration-fade;
    boundaries.push({index:i,startSeconds:number(offset),endSeconds:number(duration),type:fade?'FADE':'CUT',durationMs:fade*1000});
    if(fade) {
      graph.push(`[${v}][v${i}]xfade=transition=fade:duration=${number(fade)}:offset=${number(offset)}[vx${i}]`);
      graph.push(`[${a}][a${i}]acrossfade=d=${number(fade)}:c1=tri:c2=tri[ax${i}]`);
    } else {
      graph.push(`[${v}][v${i}]concat=n=2:v=1:a=0[vx${i}]`);
      graph.push(`[${a}][a${i}]concat=n=2:v=0:a=1[ax${i}]`);
    }
    v=`vx${i}`;a=`ax${i}`;duration+=clips[i].duration-fade;
  }
  if(duration>PLAYLIST_LIMITS.duration)throw Error('A lista preparada deve ter até 120 segundos');
  args.push('-filter_complex',graph.join(';'),'-map',`[${v}]`,'-map',`[${a}]`,'-t',String(number(duration)),'-c:v','libx264','-preset','veryfast','-crf','18','-g','1','-bf','0','-pix_fmt','yuv420p','-c:a','pcm_s16le','-ar','48000','-ac','2','-f','matroska',outputFile);
  return {args,outputFile,duration:number(duration),boundaries,width,height,fps,quality:{video:'H.264 all-intra CRF18, re-encoded; not mathematically lossless',audio:'PCM stereo 48 kHz; CUT or linear crossfade'},mode:'PRE_RENDERED_SINGLE_DECODER'};
}

export async function fileIdentity(file) {
  const normalized=resolve(file),info=await lstat(normalized);
  if(!info.isFile()||info.isSymbolicLink()||info.nlink!==1||info.size<=0||info.size>PLAYLIST_LIMITS.fileBytes)throw Error('Clipes precisam ser arquivos locais independentes de até 256 MiB');
  if(comparePath(await realpath(normalized))!==comparePath(normalized))throw Error('Link ou junction no caminho do clipe');
  const hash=createHash('sha256');for await(const chunk of createReadStream(normalized))hash.update(chunk);
  const after=await lstat(normalized);
  if(after.size!==info.size||after.mtimeMs!==info.mtimeMs)throw Error('Arquivo mudou durante a leitura');
  return {file:normalized,size:info.size,mtimeMs:info.mtimeMs,sha256:hash.digest('hex')};
}

export class ReplayPlaylist {
  constructor(owner,{runWorker=null,probeMedia=null,outputRoot=null,identify=fileIdentity,makeDirectory=mkdir,scheduler=setTimeout,cancelTimer=clearTimeout,now=Date.now}={}) {
    this.owner=owner;this.runWorker=runWorker;this.probeMedia=probeMedia;this.outputRoot=outputRoot;this.identify=identify;this.makeDirectory=makeDirectory;
    this.scheduler=scheduler;this.cancelTimer=cancelTimer;this.now=now;this.epoch=0;this.timer=null;this.renderPromise=null;this.controller=null;this.closed=false;
    this.runtime={phase:'IDLE',message:'Lista não preparada',prepared:null};
    this.cancelledOperations=new Map();this.preparationOperation=null;
    this.preparedMedia=null;
  }
  status() {
    const store=this.owner.state.playlists;
    return {definitions:clone(Array.isArray(store?.definitions)?store.definitions:[]),...clone(this.runtime),busy:!!this.renderPromise||['PREPARING','STARTING','ON_AIR','STOPPING'].includes(this.runtime.phase),mode:'PRE_RENDERED_SINGLE_DECODER'};
  }
  publish(phase,message,extra={}) {this.runtime={...this.runtime,...extra,phase,message};this.owner.onChange(this.owner.state);}
  enqueue(task) {
    const work=this.owner.queue.then(task);this.owner.queue=work.catch(()=>{});return work;
  }
  assertOpen(){if(this.closed)throw Error('Listas de Replay estão encerrando');this.owner.assertReplayOpen();}
  assertIdle(){this.assertOpen();if(this.renderPromise||['PREPARING','STARTING','ON_AIR','STOPPING'].includes(this.runtime.phase))throw Error('Pare ou cancele a lista antes de editá-la');}
  assertAction(action) {
    if(!this.preparationRequested&&!this.renderPromise&&!['READY','STARTING','ON_AIR','STOPPING'].includes(this.runtime.phase))return;
    if(!['status','history','history-preview','history-frame','history-pin','capture','mark-in','mark-out','capture-range','program-changed'].includes(action))throw Error('A lista reservou o player; pare ou cancele a lista primeiro');
  }
  async sameScope(scope) {
    this.assertOpen();const actual=(await this.owner.req('GetSceneCollectionList')).currentSceneCollectionName;
    if(actual!==scope||this.owner.scope!==scope)throw Error('A coleção de cenas mudou; prepare a lista novamente');
  }
  async verifiedProbe(file) {
    const probe=this.probeMedia||this.owner.playlistProbe;
    if(typeof probe!=='function')throw Error('Verificação de mídia da lista ainda não foi qualificada');
    const metadata=await probe(file,{requireDecodedCadence:true});
    if(metadata?.cadence?.method!=='finite-full-decoded-pts'||metadata.cadence.status!=='cfr')throw Error('Cadência precisa ser confirmada pela decodificação completa');
    return metadata;
  }
  async offAir(player) {
    const name=`Replay Player ${player}`;
    if((await this.owner.req('GetSceneList')).currentProgramSceneName===`REPLAY ${player}`)throw Error('O player está em Programa; prepare no outro player');
    const inventory=await this.owner.req('GetInputList');
    if(!Array.isArray(inventory.inputs))throw Error('Não foi possível conferir se o player está fora do ar');
    if(inventory.inputs.some(input=>input.inputName===name)) {
      const active=await this.owner.req('GetSourceActive',{sourceName:name});
      // Source active also covers nested scenes and the outgoing side of a
      // transition. A different current scene name is insufficient evidence.
      if(active.videoActive!==false)throw Error('O player continua ativo no Programa ou numa transição');
    }
  }
  async ownedPlayer(prepared) {
    if(this.owner.state.linked)throw Error('Desvincule os players para usar uma lista sequencial');
    const player=this.owner.state.players[prepared.player],settings=await this.owner.req('GetInputSettings',{inputName:`Replay Player ${prepared.player}`});
    if(player?.eventId!==prepared.eventId||player.file!==prepared.file||settings.inputKind!=='ffmpeg_source'||settings.inputSettings?.local_file!==prepared.file||Number(settings.inputSettings?.speed_percent)!==100)throw Error('O player preparado foi alterado; prepare a lista novamente');
  }
  async configure(value) {
    this.assertIdle();await this.owner.scopeState();const definition=normalizePlaylist(value);
    const store=this.owner.state.playlists??={version:1,definitions:[]};
    if(!Array.isArray(store.definitions)||store.version!==1)throw Error('Formato de listas desconhecido');
    const index=store.definitions.findIndex(d=>d.id===definition.id);
    if(index<0&&store.definitions.length>=PLAYLIST_LIMITS.definitions)throw Error('Máximo de 16 listas por projeto');
    if(index<0)store.definitions.push(definition);else store.definitions[index]=definition;
    this.epoch++;this.clearMonitor();this.publish('IDLE','Lista salva; prepare antes de colocá-la no ar',{prepared:null});await this.owner.save();return this.status();
  }
  async snapshot(id,player) {
    this.assertOpen();
    if(['ON_AIR','STARTING','STOPPING'].includes(this.runtime.phase))throw Error('Pare a lista antes de preparar outra');
    await this.owner.scopeState();
    if(!['A','B'].includes(player))throw Error('Listas reservam apenas o player A ou B');
    if(this.owner.state.linked)throw Error('Desvincule os players para usar uma lista sequencial');
    const definition=normalizePlaylist(this.owner.state.playlists?.definitions?.find(d=>d.id===id));
    const scope=this.owner.scope;await this.offAir(player);
    const video=await this.owner.req('GetVideoSettings');
    const clips=[];
    for(const item of definition.items) {
      const event=this.owner.state.events.find(e=>e.id===item.eventId),clip=event?.clips?.find(c=>c.cam===item.cam);
      if(!clip||event.playlist)throw Error('Lance ausente ou lista dentro de outra lista');
      // Derived effects must be registered as real saved clips by their own
      // verification path. Arbitrary UI curve payload is never consumed here.
      if(clip.preparedEffect?.kind==='speed-curve'&&(clip.playbackSpeed!==100||clip.decodedVerified!==true||clip.preparedEffect.decodedVerified!==true))throw Error('Curva ainda não foi preparada e verificada');
      const metadata=await this.verifiedProbe(clip.file),identity=await this.identify(clip.file);
      if(!metadata.hasVideo||metadata.variableFrameRate||metadata.duration>120)throw Error('A lista exige lances fechados com vídeo e cadência constante');
      const cam=this.owner.state.cameraOptions?.[clip.cam]||{};
      // Volume adjustments are baked, never sent to the on-air player mid-list.
      if(Number(cam.gainDb||0)!==0)throw Error('Listas com ganho de câmera precisam ser normalizadas antes da preparação');
      clips.push({file:clip.file,duration:metadata.duration,audio:metadata.audio&&!cam.muted&&this.owner.state.audioEnabled!==false,identity,transition:item.transition,eventId:event.id,cam:clip.cam});
    }
    if(clips.reduce((sum,c)=>sum+c.identity.size,0)>PLAYLIST_LIMITS.totalBytes-PLAYLIST_LIMITS.fileBytes)throw Error('Os lances desta lista excedem o orçamento de 256 MiB de entrada');
    await this.sameScope(scope);
    return {definition,scope,player,clips,video};
  }
  prepare({id,player='A',operationId=randomUUID()}) {
    if(!uuid.test(operationId))return Promise.reject(Error('ID de preparação inválido'));
    for(const [key,time]of this.cancelledOperations)if(this.now()-time>180000)this.cancelledOperations.delete(key);
    if(this.cancelledOperations.has(operationId))return Promise.reject(Error('Preparação cancelada antes de iniciar'));
    // A flag is set synchronously to prevent two concurrent callers from both
    // entering snapshot before the first worker is registered.
    if(this.renderPromise||this.preparationRequested)return Promise.reject(Error('Preparação já em andamento'));
    this.preparationRequested=true;
    this.preparationOperation=operationId;
    const work=this.prepareWork(id,player);
    this.renderPromise=work;
    work.finally(()=>{if(this.renderPromise===work){this.renderPromise=null;this.preparationRequested=false;this.preparationOperation=null;}}).catch(()=>{});
    return work;
  }
  async prepareWork(id,player) {
    const token=++this.epoch;this.controller=new AbortController();
    try {
      // snapshot's idle assertion must allow this operation's own render lock.
      const snapshot=await this.enqueue(()=>this.snapshot(id,player));
      if(token!==this.epoch||this.controller.signal.aborted)throw Error('Preparação cancelada');
      this.publish('PREPARING','Preparando CUT/FADE fora do ar; aguarde',{prepared:null});
      if(typeof this.runWorker!=='function')throw Error('Worker de preparação ainda não foi qualificado; nenhuma lista foi executada');
      const scopeKey=createHash('sha256').update(snapshot.scope).digest('hex').slice(0,24);
      const directory=join(this.outputRoot||this.owner.playlistWorker?.root||this.owner.root,'playlist-cache',scopeKey,randomUUID());
      await this.makeDirectory(directory,{recursive:true});
      const outputFile=join(directory,'playlist.mkv');
      const recipe=buildPlaylistRecipe({clips:snapshot.clips,width:snapshot.video.baseWidth,height:snapshot.video.baseHeight,fps:`${snapshot.video.fpsNumerator}/${snapshot.video.fpsDenominator}`,outputFile});
      if(token!==this.epoch||this.controller.signal.aborted)throw Error('Preparação cancelada');
      const result=await this.runWorker({kind:'ffmpeg',args:recipe.args,label:'playlist-prepare',outputFiles:[outputFile],inputs:snapshot.clips.map(c=>({path:c.identity.file,identity:{path:c.identity.file,bytes:c.identity.size,mtimeMs:c.identity.mtimeMs,sha256:c.identity.sha256}})),maxOutputBytes:PLAYLIST_LIMITS.fileBytes,maxTotalBytes:PLAYLIST_LIMITS.totalBytes,timeoutMs:PLAYLIST_LIMITS.prepareMs,signal:this.controller.signal,stdoutMode:'text',maxStdoutBytes:64*1024});
      if(result?.closed!==true||(result?.exitCode??result?.code)!==0)throw Error('Worker não confirmou a preparação e o encerramento');
      if(token!==this.epoch||this.controller.signal.aborted)throw Error('Preparação cancelada; o resultado não foi carregado');
      for(const clip of snapshot.clips)if(JSON.stringify(await this.identify(clip.file))!==JSON.stringify(clip.identity))throw Error('Um lance foi alterado durante a preparação');
      const identity=await this.identify(outputFile),metadata=await this.verifiedProbe(outputFile);
      if(!metadata.hasVideo||metadata.variableFrameRate||!metadata.audio||Math.abs(metadata.duration-recipe.duration)>Math.max(.08,2*snapshot.video.fpsDenominator/snapshot.video.fpsNumerator))throw Error('O arquivo preparado não confirmou duração, vídeo, áudio e cadência');
      await this.enqueue(async()=>{
        if(token!==this.epoch)throw Error('Preparação cancelada');await this.sameScope(snapshot.scope);
        const actual=this.owner.state.playlists?.definitions?.find(d=>d.id===id);
        if(JSON.stringify(actual)!==JSON.stringify(snapshot.definition))throw Error('A lista mudou durante a preparação');
        const eventId=randomUUID(),event={id:eventId,name:snapshot.definition.name,dur:metadata.duration,cam:'Lista preparada',createdAt:this.now(),playlist:{definitionId:id,version:1,boundaries:recipe.boundaries,quality:recipe.quality},clips:[{cam:'Lista preparada',file:outputFile,duration:metadata.duration,frameRate:metadata.frameRate,audio:true,playbackSpeed:100}]};
        this.owner.state.events.unshift(event);await this.owner.save();
        const guardMutation=async()=>{
          if(token!==this.epoch)throw Error('Preparação cancelada');
          await this.sameScope(snapshot.scope);
          await this.offAir(player);
        };
        await this.owner.load(player,eventId,'Lista preparada',{playbackSpeed:100,guardMutation,verifiedMetadata:metadata});
        await this.sameScope(snapshot.scope);
        if(token!==this.epoch)throw Error('Preparação cancelada durante o carregamento');
        this.preparedMedia=metadata;
        this.publish('READY','Lista pronta e pausada no Preview; colocar no ar exige comando explícito',{prepared:{id,eventId,player,file:outputFile,identity,scope:snapshot.scope,duration:metadata.duration,endMode:snapshot.definition.endMode,boundaries:recipe.boundaries,quality:recipe.quality}});
      });
      return this.status();
    } catch(error) {if(token===this.epoch)this.publish('FAULT',error.message,{prepared:null});throw error;}
    finally {this.controller=null;}
  }
  async start() {
    this.assertOpen();if(this.runtime.phase!=='READY'||this.renderPromise)throw Error('Aguarde a lista ficar pronta');
    const prepared=this.runtime.prepared;await this.sameScope(prepared.scope);await this.ownedPlayer(prepared);
    await this.offAir(prepared.player);
    if(JSON.stringify(await this.identify(prepared.file))!==JSON.stringify(prepared.identity))throw Error('Arquivo preparado foi alterado');
    const list=await this.owner.req('GetSceneList');
    if(!list.currentProgramSceneName||/^REPLAY [ABCD]$/.test(list.currentProgramSceneName))throw Error('Volte a uma entrada ao vivo antes de iniciar a lista');
    prepared.back=list.currentProgramSceneName;
    this.publish('STARTING','Confirmando lista no Programa');
    const guardMutation=async()=>{
      await this.sameScope(prepared.scope);
      const scene=(await this.owner.req('GetSceneList')).currentProgramSceneName;
      if(![prepared.back,`REPLAY ${prepared.player}`].includes(scene))throw Error('O operador mudou o Programa durante a entrada da lista');
    };
    try {await this.owner.air(prepared.player,{verifiedMetadata:this.preparedMedia,guardMutation});await this.sameScope(prepared.scope);await this.ownedPlayer(prepared);this.publish('ON_AIR','Lista no ar',{startedAt:this.now()});this.scheduleMonitor(this.epoch);}
    catch(error){this.publish('FAULT',error.message);throw error;}
    return this.status();
  }
  clearMonitor(){if(this.timer!==null)this.cancelTimer(this.timer);this.timer=null;}
  scheduleMonitor(token){this.clearMonitor();this.timer=this.scheduler(()=>{this.timer=null;this.enqueue(()=>this.monitor(token)).catch(error=>{if(token===this.epoch)this.publish('FAULT',error.message);});},PLAYLIST_LIMITS.monitorMs);this.timer?.unref?.();}
  async monitor(token) {
    if(this.closed||token!==this.epoch||this.runtime.phase!=='ON_AIR')return;
    const prepared=this.runtime.prepared;
    await this.sameScope(prepared.scope);await this.ownedPlayer(prepared);
    const program=(await this.owner.req('GetSceneList')).currentProgramSceneName;
    if(program!==`REPLAY ${prepared.player}`){this.publish('INTERRUPTED','O operador mudou o Programa; a lista não retomará o ar automaticamente');return;}
    const media=await this.owner.req('GetMediaInputStatus',{inputName:`Replay Player ${prepared.player}`});
    if(token!==this.epoch)return;
    if(media.mediaState==='OBS_MEDIA_STATE_ENDED') {
      if(prepared.endMode==='LIVE'){await this.returnLive(prepared);this.publish('ENDED','Lista concluída; retorno ao vivo confirmado');}
      else this.publish('ENDED','Lista concluída; último quadro mantido. Voltar ao vivo é explícito');
      return;
    }
    if(media.mediaState!=='OBS_MEDIA_STATE_PLAYING')throw Error('A reprodução da lista foi interrompida; confira o Programa');
    if(this.now()-this.runtime.startedAt>(prepared.duration*1000+PLAYLIST_LIMITS.endGraceMs))throw Error('O motor não confirmou o fim da lista no prazo esperado');
    const cursor=Number(media.mediaCursor)/1000;
    this.runtime.position=Number.isFinite(cursor)?cursor:null;
    this.runtime.itemIndex=prepared.boundaries.filter(b=>cursor>=b.startSeconds).length;
    this.scheduleMonitor(token);
  }
  async returnLive(prepared) {
    await this.sameScope(prepared.scope);await this.ownedPlayer(prepared);
    const scenes=await this.owner.req('GetSceneList');
    if(scenes.currentProgramSceneName!==`REPLAY ${prepared.player}`||!scenes.scenes.some(s=>s.sceneName===prepared.back))throw Error('Programa ou entrada de retorno mudou; retorno automático bloqueado');
    this.owner.state.back=prepared.back;await this.owner.live();
  }
  cancelPreparation(operationId) {
    if(operationId&&operationId!==this.preparationOperation){
      if(!uuid.test(operationId))throw Error('ID de cancelamento inválido');
      this.cancelledOperations.set(operationId,this.now());
      if(this.cancelledOperations.size>64)this.cancelledOperations.delete(this.cancelledOperations.keys().next().value);
      return false;
    }
    if(!this.renderPromise)return false;
    this.epoch++;this.controller?.abort();this.clearMonitor();this.publish('CANCELLING','Cancelando preparação; aguarde o worker confirmar encerramento',{prepared:null});
    const worker=this.renderPromise;
    worker.finally(()=>{if(this.runtime.phase==='CANCELLING')this.publish('CANCELLED','Preparação cancelada; nada foi colocado no ar');}).catch(()=>{});
    return true;
  }
  async stop() {
    if(this.cancelPreparation())return this.status();
    this.clearMonitor();this.epoch++;
    const prepared=this.runtime.prepared;
    if(!prepared||['READY','IDLE','STOPPED','CANCELLED'].includes(this.runtime.phase)){this.publish('IDLE','Lista parada',{prepared:null});return this.status();}
    this.publish('STOPPING','Confirmando retorno ao vivo');
    try {await this.returnLive(prepared);this.publish('STOPPED','Lista parada; retorno ao vivo confirmado');}
    catch(error){this.publish('INTERRUPTED',error.message);throw error;}
    return this.status();
  }
  async close() {
    this.closed=true;this.epoch++;this.clearMonitor();this.controller?.abort();
    const work=this.renderPromise;if(work)await work.catch(()=>{});
    return {closed:true,workerQuiescent:!this.renderPromise};
  }
  scopeChanged() {
    this.epoch++;this.clearMonitor();this.controller?.abort();
    this.publish('IDLE','Coleção mudou; prepare uma lista deste projeto',{prepared:null});
    this.preparedMedia=null;
  }
  command(action,data={}) {
    if(action==='playlist-prepare')return this.prepare(data);
    if(action==='playlist-stop'&&(this.renderPromise||data.operationId)){this.cancelPreparation(data.operationId);return Promise.resolve(this.status());}
    return this.enqueue(async()=>{
      this.assertOpen();
      if(action==='playlist-save')return this.configure(data.definition);
      if(action==='playlist-start')return this.start();
      if(action==='playlist-stop')return this.stop();
      throw Error('Comando de lista desconhecido');
    });
  }
}
