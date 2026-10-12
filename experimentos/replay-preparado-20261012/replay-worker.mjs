import {spawn} from 'node:child_process';
import {createReadStream, constants} from 'node:fs';
import {lstat, realpath, readdir, readFile, writeFile, rename, mkdir, unlink, copyFile} from 'node:fs/promises';
import {createHash, randomUUID} from 'node:crypto';
import {resolve, dirname, basename, relative, isAbsolute, join, parse, sep, extname} from 'node:path';
import {performance} from 'node:perf_hooks';

const MiB=1024*1024;
const LABELS=new Set(['playlist-prepare','speedcurve-prepare','clip-prepare','remux','frame-preview','mse-preview','probe','cadence','pcm-analysis','pixel-analysis','fixture','version','decode-verify']);
const eq=(a,b)=>process.platform==='win32'?a.toLowerCase()===b.toLowerCase():a===b;
const clamp=(n,floor,ceiling,fallback)=>Number.isFinite(n)?Math.min(ceiling,Math.max(floor,n)):fallback;
const inside=(root,file)=>{const r=relative(root,file);return r!==''&&!r.startsWith('..'+sep)&&r!=='..'&&!isAbsolute(r);};
const coded=(code,message,extra={})=>Object.assign(new Error(message),{code,...extra});
const specFixture=(value,label)=>label==='fixture'&&/^testsrc2=size=(?:160x90|320x180):rate=(?:25|30)$/.test(value);

async function checkedPath(file,{directory=false,missing=false}={}){
  if(!isAbsolute(file))throw coded('PATH_NOT_ABSOLUTE','Absolute local path required');
  const absolute=resolve(file),volume=parse(absolute).root;
  const parts=absolute.slice(volume.length).split(/[\\/]/).filter(Boolean);
  let cursor=volume;
  for(let i=0;i<parts.length;i++){
    cursor=join(cursor,parts[i]);let info;
    try{info=await lstat(cursor);}catch(error){if(missing&&i===parts.length-1&&error.code==='ENOENT')return null;throw error;}
    if(info.isSymbolicLink())throw coded('LINK_PATH','Symlink or junction rejected');
    if(!eq(await realpath(cursor),cursor))throw coded('RESOLVED_PATH_CHANGED','Path resolves outside its literal ancestor');
    if(i<parts.length-1&&!info.isDirectory())throw coded('ANCESTOR_NOT_DIRECTORY','Invalid ancestor');
    if(info.isFile()&&info.nlink!==1)throw coded('HARDLINK_PATH','File must have exactly one hard link');
    if(i===parts.length-1){if(directory?!info.isDirectory():!info.isFile())throw coded('PATH_TYPE','Unexpected path type');return info;}
  }
  throw coded('VOLUME_ROOT_REJECTED','Volume root cannot be a worker path');
}

async function sha256(file){const hash=createHash('sha256');for await(const block of createReadStream(file))hash.update(block);return hash.digest('hex');}
async function prefixSha(file,bytes){const hash=createHash('sha256');if(bytes>0)for await(const block of createReadStream(file,{start:0,end:bytes-1}))hash.update(block);return hash.digest('hex');}
async function identity(file){const info=await checkedPath(file),hash=await prefixSha(file,info.size),after=await checkedPath(file);if(after.dev!==info.dev||after.ino!==info.ino||after.size<info.size)throw coded('SOURCE_CHANGED','File replaced or shortened while hashing snapshot');return {path:resolve(file),bytes:info.size,mtimeMs:info.mtimeMs,dev:info.dev,ino:info.ino,sha256:hash};}
function sameIdentity(a,b){return a.bytes===b.bytes&&a.mtimeMs===b.mtimeMs&&a.sha256===b.sha256;}

/** Root creates this only inside an empty own QA preparation folder. It never overwrites a marker. */
export async function initializeReplayWorkerRoot(root){
  root=resolve(root);
  if(!/[\\/]FreeMix-QA-[^\\/]+(?:[\\/]|$)/i.test(root))throw coded('ROOT_NOT_QA','FreeMix-QA- ancestor required');
  await checkedPath(dirname(root),{directory:true});await mkdir(root,{recursive:false});
  await checkedPath(root,{directory:true});
  const marker=join(root,'REPLAY-WORKER-OWNERSHIP.json');
  await writeFile(marker,JSON.stringify({format:1,root,scope:'replay-preparation-only',id:randomUUID(),createdAt:new Date().toISOString()},null,2)+'\n',{flag:'wx'});
  return marker;
}

/** No Native/API/on-air command surface; only the two approved media executables. */
export async function createReplayWorker(options){
  if(!options||!isAbsolute(options.root||'')||(options.ownershipMarker&&!isAbsolute(options.ownershipMarker)))throw coded('ROOT_NOT_ABSOLUTE','Exact absolute preparation root and marker required');
  const root=resolve(options.root||''),marker=resolve(options.ownershipMarker||join(root,'REPLAY-WORKER-OWNERSHIP.json'));
  if(!/[\\/]FreeMix-(?:QA|Replay-Preparation)-[^\\/]+(?:[\\/]|$)/i.test(root)||!inside(root,marker))throw coded('ROOT_NOT_QA','Own QA or named project preparation root and contained marker required');
  await checkedPath(root,{directory:true});await checkedPath(marker);
  const own=JSON.parse(await readFile(marker,'utf8'));
  if(own.format!==1||!eq(own.root,root)||own.scope!=='replay-preparation-only'||typeof own.id!=='string'||!own.id)throw coded('MARKER_MISMATCH','Exact root/format/scope marker required');
  const markerSHA=await sha256(marker),pins=Array.isArray(options.binaryPins)?options.binaryPins.map(p=>Object.freeze({...p})):null;
  const readRoots=[];
  for(const entry of options.readRoots||[]){
    if(!entry||!isAbsolute(entry.root)||!isAbsolute(entry.ownershipMarker))throw coded('READ_ROOT','Marked absolute source roots required');
    const sourceRoot=resolve(entry.root),sourceMarker=resolve(entry.ownershipMarker);
    if(!inside(sourceRoot,sourceMarker))throw coded('READ_ROOT','Source ownership marker must be contained');
    await checkedPath(sourceRoot,{directory:true});await checkedPath(sourceMarker);
    const authorized=JSON.parse(await readFile(sourceMarker,'utf8'));
    if(authorized.format!==1||!eq(authorized.root,sourceRoot)||authorized.scope!=='replay-source-authorized'||typeof authorized.id!=='string'||!authorized.id)throw coded('READ_MARKER','Exact marked replay source authorization required');
    readRoots.push({root:sourceRoot,marker:sourceMarker,markerSHA:await sha256(sourceMarker)});
  }
  if(!Array.isArray(pins))throw coded('BINARY_PINS_REQUIRED','Approved exact binary pins required');
  const tools={ffmpeg:resolve(options.ffmpegPath||''),ffprobe:resolve(options.ffprobePath||'')};
  for(const [kind,file] of Object.entries(tools)){
    if(!isAbsolute(options[kind+'Path']||''))throw coded('BINARY_PATH','Absolute executable path required');
    const pin=pins.find(p=>eq(resolve(p.path),file));
    if(!pin||!Number.isSafeInteger(pin.bytes)||!/^[a-f0-9]{64}$/i.test(pin.sha256))throw coded('BINARY_PIN','Approved size/hash absent');
    if(!eq(basename(file),kind+(process.platform==='win32'?'.exe':'')))throw coded('BINARY_NAME','Unexpected media executable');
    const info=await checkedPath(file);
    if(info.size!==pin.bytes||(await sha256(file))!==pin.sha256.toLowerCase())throw coded('BINARY_CHANGED','Approved media executable changed');
  }
  const fileLimit=clamp(options.maxFileBytes,1*MiB,256*MiB,100*MiB);
  const totalLimit=clamp(options.maxTotalBytes,fileLimit,750*MiB,512*MiB);
  const deadline=performance.now()+clamp(options.deadlineMs,1000,12*60*1000,12*60*1000);
  const closeGraceMs=clamp(options.closeGraceMs,100,10000,5000);
  const ledgerFile=join(root,'REPLAY-WORKER-LEDGER.json');
  const reading=new Map(),jobs=new Map();let closing=false,unavailable=false,active=null,preflightBusy=false,ledgerQueue=Promise.resolve(),lastLedgerError=null;

  const snapshot=()=>({format:1,root,ownershipId:own.id,markerSHA,scope:'replay-preparation-only',closing,unavailable,preflightBusy,
    updatedAt:new Date().toISOString(),readingFiles:[...reading.keys()],jobs:[...jobs.values()].map(j=>({...j.record}))});
  function persist(){
    ledgerQueue=ledgerQueue.then(async()=>{
      await checkedPath(root,{directory:true});await checkedPath(ledgerFile,{missing:true});
      const tmp=join(root,`.worker-ledger-${randomUUID()}.json`);
      await writeFile(tmp,JSON.stringify(snapshot(),null,2)+'\n',{flag:'wx'});
      await rename(tmp,ledgerFile);
    }).catch(error=>{lastLedgerError=error;unavailable=true;});
    return ledgerQueue;
  }
  async function assertFile(file,{root:override}={}){
    file=resolve(file);if(override&&!eq(resolve(override),root))throw coded('ROOT_OVERRIDE','Alternate roots are not allowed');
    if(!inside(root,file)&&!readRoots.some(r=>inside(r.root,file)))throw coded('FILE_OUTSIDE_ROOT','Media file outside declared own source roots');
    if(!/\.(?:mp4|mkv|ts|mov|wav|jpg|jpeg|png|rgb|ffconcat|txt)$/i.test(file))throw coded('SOURCE_TYPE','Only local media or controlled concat manifests are readable');
    const info=await checkedPath(file);
    if(info.size>fileLimit)throw coded('FILE_BUDGET','Existing media exceeds per-file budget');
    return identity(file);
  }
  async function storage(){
    let total=0;const walk=async dir=>{
      await checkedPath(dir,{directory:true});
      for(const entry of await readdir(dir,{withFileTypes:true})){
        const file=join(dir,entry.name);
        if(entry.isDirectory())await walk(file);
        else{const info=await checkedPath(file);if(info.size>fileLimit)throw coded('FILE_BUDGET','Per-file budget exceeded',{file,bytes:info.size});total+=info.size;if(total>totalLimit)throw coded('ROOT_BUDGET','Preparation root total budget exceeded',{bytes:total});}
      }
    };await walk(root);return total;
  }
  async function verifyOwnership(){
    await checkedPath(root,{directory:true});await checkedPath(marker);
    if(await sha256(marker)!==markerSHA)throw coded('MARKER_CHANGED','Own root marker changed');
    for(const source of readRoots){await checkedPath(source.root,{directory:true});await checkedPath(source.marker);if(await sha256(source.marker)!==source.markerSHA)throw coded('READ_MARKER_CHANGED','Source authorization changed');}
  }
  function retain(file){reading.set(file,(reading.get(file)||0)+1);}
  function release(file){const n=(reading.get(file)||1)-1;if(n)reading.set(file,n);else reading.delete(file);}
  function validateArgs(kind,args,inputSet,outputSet,label){
    if(!Array.isArray(args)||!args.length||args.some(a=>typeof a!=='string'||a.includes('\0')||a.length>65536))throw coded('ARGS_INVALID','String argument array required');
    const version=args.length===1&&args[0]==='-version';
    if(version&&label!=='version')throw coded('LABEL_MISMATCH','Version command requires its own label');
    if(version)return args.slice();
    // No external protocol, command expansion, device input, stdin media or filter-side file readers.
    if(args.some(a=>/\b(?:https?|rtmps?|srt|udp|tcp|ftp|data|crypto|subfile|concat):/i.test(a)||/\b(?:a?movie|a?sendcmd|a?zmq|subtitles|ass|drawtext)\s*=/i.test(a)))throw coded('EXTERNAL_MEDIA_REJECTED','Network/protocol/filter-side inputs prohibited');
    const blocked=new Set(['-nostdin','-stdin','-progress','-report','-attach','-dump_attachment','-dump_attachment:t','-listen','-protocol_whitelist','-protocol_blacklist','-filter_complex_script','-filter_script','-passlogfile','-vstats_file','-sdp_file','-segment_list','-hls_segment_filename','-fpre','-vpre','-apre','-spre']);
    const zeroOptions=new Set(['-hide_banner','-n','-y','-xerror','-an','-vn','-sn','-dn','-copyts','-start_at_zero','-show_streams','-show_format','-show_frames','-show_packets','-count_frames','-count_packets']);
    const valueOptions=new Set(['-v','-loglevel','-threads','-filter_threads','-filter_complex_threads','-ss','-sseof','-t','-to','-i','-f','-safe','-map','-vf','-af','-filter_complex','-c','-c:v','-c:a','-codec:v','-codec:a','-preset','-crf','-g','-bf','-b:v','-b:a','-pix_fmt','-video_size','-framerate','-ar','-ac','-frames:v','-frames:a','-vframes','-fps_mode','-r','-profile:v','-level:v','-q:v','-sc_threshold','-movflags','-frag_duration','-avoid_negative_ts','-tag:v','-fflags','-err_detect','-of','-show_entries','-select_streams','-read_intervals','-max_alloc','-probesize','-analyzeduration']);
    // Consume a finite option grammar, so a hidden second relative output cannot sneak between legitimate arguments.
    const argsCopy=args.slice();for(let index=0;index<argsCopy.length-1;index++){
      const key=argsCopy[index];if(zeroOptions.has(key))continue;
      if(!valueOptions.has(key)&&!/^-(?:threads|c|codec):[av]:\d+$/.test(key))throw coded('OPTION_UNSUPPORTED','Unsupported or extra positional media argument: '+key);
      if(index+1>=argsCopy.length-1)throw coded('OPTION_VALUE','Media option missing its value');
      index++;if(['-filter_threads','-filter_complex_threads'].includes(key))argsCopy[index]='1';
    }
    const formats=[];let bounded=false;
    for(let i=0;i<args.length;i++){
      const a=args[i];if(blocked.has(a)||/^-(?:filter_script|filter_complex_script|attach|dump_attachment|passlogfile|report)(?::|$)/.test(a))throw coded('ARGS_UNSAFE','Unmanaged side-file/stdin option prohibited');
      if(a==='-f')formats.push(args[i+1]);
      if(/^-(?:threads|filter_threads|filter_complex_threads)(?::.*)?$/.test(a)){
        const n=Number(args[++i]);if(!Number.isInteger(n)||n<1||n>2)throw coded('THREAD_BUDGET','At most two codec/filter threads');
      }
      if(a==='-i'){
        const file=args[++i],synthetic=(file==='anullsrc=channel_layout=stereo:sample_rate=48000'||specFixture(file,label))&&args[i-2]==='lavfi'&&args[i-3]==='-f';
        if(!synthetic&&!inputSet.has(resolve(file)))throw coded('UNDECLARED_INPUT','Every input must be a declared local file or a fixed finite synthetic fixture');
      }
      if(a==='-t'||a==='-to'){
        const n=Number(args[i+1]);if(!Number.isFinite(n)||n<=0||n>120)throw coded('DURATION_BUDGET','Render duration must be positive and at most 120 seconds');bounded=true;
      }
      if(a==='-frames:v'||a==='-vframes'||a==='-frames:a'){
        const n=Number(args[i+1]);if(!Number.isInteger(n)||n<=0||n>7200)throw coded('FRAME_BUDGET','Finite frame bound required');bounded=true;
      }
    }
    if(formats.some(f=>!['lavfi','rawvideo','mp4','mov','matroska','mpegts','image2pipe','null','f32le','framemd5','hash','wav','concat'].includes(f)))throw coded('DEVICE_OR_SIDEFILE','Unsupported device or multi-file muxer format');
    if(formats.includes('rawvideo')){
      const pixelAnalysis=label==='pixel-analysis';
      if(pixelAnalysis){
        const filter=args[args.indexOf('-vf')+1],pixelFormat=args[args.indexOf('-pix_fmt')+1];
        if(kind!=='ffmpeg'||args.at(-1)!=='pipe:1'||outputSet.size!==0||!args.includes('-vf')||!['scale=64:64','scale=64:64:flags=neighbor'].includes(filter)||!args.includes('-pix_fmt')||pixelFormat!=='rgb24'||args.filter(a=>a==='-f').length!==1||inputSet.size!==1)throw coded('PIXEL_ANALYSIS_TYPE','Pixel analysis requires one local input, scale64:64 RGB24 and stdout pipe only');
      }
      if(!pixelAnalysis){
      let format=null,pixfmt=null,size=null,rate=null,typedInput=false;
      for(let i=0;i<args.length;i++){
        if(args[i]==='-f')format=args[++i];else if(args[i]==='-pix_fmt')pixfmt=args[++i];else if(args[i]==='-video_size')size=args[++i];else if(args[i]==='-framerate')rate=args[++i];
        else if(args[i]==='-i'){
          const file=args[++i];if(format==='rawvideo'){
            if(label!=='fixture'||pixfmt!=='rgb24'||size!=='64x64'||rate!=='30'||!inside(root,resolve(file))||!file.endsWith('.rgb'))throw coded('RAW_FIXTURE_TYPE','Raw input is restricted to own fixture RGB24 64x64 at30fps');typedInput=true;
          }format=null;pixfmt=null;size=null;rate=null;
        }
      }
      if(!typedInput||format==='rawvideo')throw coded('RAW_FIXTURE_TYPE','Rawvideo output/untyped raw input prohibited');
      }
    }
    if(formats.includes('lavfi')&&!args.some(a=>a==='anullsrc=channel_layout=stereo:sample_rate=48000'||specFixture(a,label)))throw coded('SYNTHETIC_INPUT','Only fixed silent audio generator or named finite fixture is supported');
    if(kind==='ffmpeg'&&!bounded)throw coded('UNBOUNDED_RENDER','Product worker requires explicit finite -t/-to/-frames:v');
    if(kind==='ffprobe'){
      if(outputSet.size||args.includes('-i')||!inputSet.has(resolve(args.at(-1))))throw coded('PROBE_ARGUMENTS','Probe requires one final declared local file and no output files');
      const enumeration=args.some(a=>['-show_frames','-show_packets','-show_data'].includes(a))||args.some((a,i)=>a==='-show_entries'&&/(?:^|:)(?:frame|packet)(?:=|:|$)/.test(args[i+1]||''));
      if(enumeration&&!args.includes('-read_intervals'))throw coded('PROBE_UNBOUNDED','Packet/frame enumeration requires finite read intervals');
      if(args.includes('-read_intervals')){const value=args[args.indexOf('-read_intervals')+1]||'',match=/^(?:\d+(?:\.\d+)?)?%\+\#([1-9]\d{0,4})$/.exec(value);if(!match||Number(match[1])>30000)throw coded('PROBE_INTERVAL','Probe enumeration needs a finite packet count (at most 30000)');}
    }else{
      const final=args.at(-1);if(!['pipe:1','-'].includes(final)&&!outputSet.has(resolve(final)))throw coded('UNDECLARED_OUTPUT','Final output must be declared or stdout');
      // Enforce single output. Other absolute file tokens must be declared input paths only.
      for(let i=0;i<args.length-1;i++)if(isAbsolute(args[i])&&args[i-1]!=='-i')throw coded('SIDE_OUTPUT_REJECTED','Only one final output file is accepted');
      if(outputSet.size>1)throw coded('MULTIPLE_OUTPUTS','One render output per job');
    }
    return kind==='ffmpeg'?['-hide_banner','-stdin','-threads','2','-filter_threads','1','-filter_complex_threads','1',...argsCopy]:['-threads','2',...argsCopy];
  }

  async function assertOutput(file){
    file=resolve(file);if(!inside(root,file))throw coded('OUTPUT_PATH','Output outside own preparation root');
    await checkedPath(dirname(file),{directory:true});if(await checkedPath(file,{missing:true}))throw coded('OUTPUT_EXISTS','Output must be new and absent');return {path:file,root};
  }
  async function commitAbsent(from,to){
    if(active||preflightBusy||unavailable||closing)throw coded('NOT_QUIESCENT','Commit requires successful quiescent worker');
    from=resolve(from);to=resolve(to);if(!inside(root,from)||reading.has(from))throw coded('OUTPUT_PATH','Only quiescent prepared output may be committed');
    await verifyOwnership();await checkedPath(from);await assertOutput(to);
    const info=await checkedPath(from),total=await storage();if(total+info.size>totalLimit)throw coded('ROOT_BUDGET','Exclusive publication copy would exceed total budget');
    // COPYFILE_EXCL never replaces another operation's artifact; copies keep independent nlink=1 provenance.
    const before=await identity(from);await copyFile(from,to,constants.COPYFILE_EXCL);
    const after=await identity(to);if(before.bytes!==after.bytes||before.sha256!==after.sha256)throw coded('COMMIT_COPY_CHANGED','Prepared output copy identity differs');
    await unlink(from);await checkedPath(to);return {path:to,committed:true};
  }
  async function cleanupQuiescent(files){
    if(active||preflightBusy)throw coded('NOT_QUIESCENT','Cleanup refused while an owned process may still read/write files');
    await verifyOwnership();for(const candidate of files){const file=resolve(candidate);if(!inside(root,file)||reading.has(file)||eq(file,marker)||eq(file,ledgerFile))throw coded('CLEANUP_PATH','Cleanup only unused own output files');const info=await checkedPath(file,{missing:true});if(info)await unlink(file);}return {cleaned:true};
  }
  async function executeImpl(spec){
    if(closing||unavailable||active||performance.now()>=deadline)throw coded('WORKER_UNAVAILABLE','Worker closing, busy, failed or past deadline');
    if(!LABELS.has(spec.label)||!['ffmpeg','ffprobe'].includes(spec.kind))throw coded('JOB_KIND','Named replay job label and approved media kind required');
    if(spec.signal?.aborted)throw coded('CANCELLED','Job cancelled before preflight');
    const maxStdout=clamp(spec.maxStdoutBytes,1,spec.stdoutMode==='pcm-zero'?64*MiB:8*MiB,2*MiB),stderrLimit=256*1024;
    const outputLimit=clamp(spec.maxOutputBytes,1,fileLimit,fileLimit);
    const mode=spec.stdoutMode||'text';if(!['text','buffer','pcm-zero'].includes(mode))throw coded('STDOUT_MODE','Invalid stdout mode');
    if(spec.label==='pixel-analysis'&&(mode!=='buffer'||maxStdout>8*MiB))throw coded('PIXEL_ANALYSIS_TYPE','Pixel inspection requires bounded binary RGB payload (at most8MiB)');
    const inputSpecs=spec.inputs||[];
    const inputs=[...new Set(inputSpecs.map(p=>resolve(typeof p==='string'?p:p.path)))],outputs=[...new Set((spec.outputFiles||[]).map(p=>resolve(p)))];
    await verifyOwnership();const before=[];
    for(const file of inputs){
      await assertFile(file);const actual=await identity(file);const supplied=inputSpecs.find(p=>typeof p==='object'&&eq(resolve(p.path),file));
      if(!inside(root,file)&&(!supplied?.identity||!sameIdentity(actual,supplied.identity)))throw coded('SOURCE_IDENTITY','External marked source requires exact expected size/mtime/SHA identity');
      if(supplied?.identity&&!sameIdentity(actual,supplied.identity))throw coded('SOURCE_CHANGED','Declared source identity differs');before.push(actual);
      if(file.endsWith('.rgb')&&(spec.label!=='fixture'||!inside(root,file)||actual.bytes===0||actual.bytes%(64*64*3)!==0||actual.bytes/(64*64*3)>3600))throw coded('RAW_FIXTURE_SIZE','Own RGB64 fixture must contain1..3600 whole frames');
    }
    for(const file of outputs){if(!inside(root,file)||inputs.includes(file))throw coded('OUTPUT_PATH','Own output must differ from all inputs');await checkedPath(dirname(file),{directory:true});if(await checkedPath(file,{missing:true}))throw coded('OUTPUT_EXISTS','Output already exists; overwrite forbidden');}
    const args=validateArgs(spec.kind,spec.args,new Set(inputs),new Set(outputs),spec.label);
    if(spec.kind==='ffmpeg'&&outputs.length)args.splice(args.length-1,0,'-fs',String(outputLimit));
    if(spec.args.includes('-f')&&spec.args[spec.args.indexOf('-f')+1]==='concat'){
      for(let i=0;i<spec.args.length;i++)if(spec.args[i]==='-i'){
        const list=spec.args[i+1],info=await assertFile(list);if(info.bytes>65536)throw coded('CONCAT_LIST_SIZE','Concat manifest too large');
        const lines=(await readFile(list,'utf8')).trim().split(/\r?\n/);if(lines.length>128)throw coded('CONCAT_LIST_SIZE','Too many concat entries');
        for(const line of lines){const match=/^file '([^'\r\n]+)'$/.exec(line);if(!match||!isAbsolute(match[1])||!inputs.includes(resolve(match[1])))throw coded('CONCAT_LIST_UNDECLARED','Concat entries must be declared absolute own local files');}
      }
    }
    await storage();
    // Binary identity and ancestry are rechecked immediately before every spawn, never PATH/environment fallback.
    const binary=tools[spec.kind],pin=pins.find(p=>eq(resolve(p.path),binary));const binaryInfo=await checkedPath(binary);
    if(binaryInfo.size!==pin.bytes||await sha256(binary)!==pin.sha256.toLowerCase())throw coded('BINARY_CHANGED','Approved executable changed before spawn');
    if(closing||unavailable||active||spec.signal?.aborted||performance.now()>=deadline)throw coded('CANCELLED','Scope closed or expired during preflight');
    const id=randomUUID(),start=performance.now(),timeout=clamp(spec.timeoutMs,100,120000,90000);
    const job={id,record:{id,label:spec.label,kind:spec.kind,exe:binary,exeSHA:pin.sha256,pid:null,state:'spawn-intent',inputs:before,outputs,startedAt:new Date().toISOString(),actualClosed:false,errors:[]}};
    jobs.set(id,job);active=job;for(const file of inputs)retain(file);await persist();
    if(lastLedgerError||closing||spec.signal?.aborted||performance.now()>=deadline){for(const file of inputs)release(file);active=null;job.record.state='cancelled-before-spawn';await persist();throw coded('CANCELLED','Pre-spawn ledger or scope refused job');}
    let child,resolveClosed;const closed=new Promise(resolve=>{resolveClosed=resolve;});job.closed=closed;
    let failure=null,requested=false,settled=false,bytes=0,stderrBytes=0,monitoring=false,monitoringPromise=null,stdoutChunks=[],stderrChunks=[],pcmCarry=Buffer.alloc(0),pcmPeak=0;
    function requestStop(error){
      failure??=error;if(!job.record.errors.includes(error.message))job.record.errors.push(error.message);
      if(requested)return;requested=true;job.record.state=spec.kind==='ffmpeg'?'cooperative-stop-requested':'cancelled-probe-awaiting-actual-close';persist();
      if(spec.kind==='ffmpeg'&&child?.stdin?.writable){try{child.stdin.end('q\n');}catch(writeError){job.record.errors.push('stdin stop write failed: '+writeError.message);}}
      // ffprobe has no documented q protocol. Finite local inputs run to close; never send an OS signal.
    }
    job.requestStop=requestStop;
    try{child=spawn(binary,args,{cwd:root,windowsHide:true,shell:false,stdio:['pipe','pipe','pipe'],env:{...process.env,FFREPORT:undefined}});}catch(error){
      job.record.state='spawn-threw';job.record.errors.push(error.message);for(const file of inputs)release(file);active=null;resolveClosed({spawnFailed:true,error});await persist();throw error;
    }
    child.stdin.on('error',error=>{if(!requested)requestStop(coded('STDIN_ERROR',error.message));else job.record.errors.push('stop stdin: '+error.message);});
    child.stdout.on('data',block=>{
      bytes+=block.length;if(bytes>maxStdout){requestStop(coded('STDOUT_LIMIT','Stdout exceeded its cap; partial output cannot be accepted'));return;}
      if(mode==='pcm-zero'){
        const aligned=pcmCarry.length?Buffer.concat([pcmCarry,block]):block,end=aligned.length-aligned.length%4;
        for(let p=0;p<end;p+=4){const sample=aligned.readFloatLE(p);if(!Number.isFinite(sample)){requestStop(coded('PCM_FORMAT','Nonfinite PCM sample'));break;}pcmPeak=Math.max(pcmPeak,Math.abs(sample));}
        pcmCarry=Buffer.from(aligned.subarray(end));
      }else stdoutChunks.push(block);
    });
    child.stderr.on('data',block=>{stderrBytes+=block.length;if(stderrBytes>stderrLimit){requestStop(coded('STDERR_LIMIT','Stderr exceeded its cap'));return;}stderrChunks.push(block);});
    child.on('error',error=>requestStop(coded('SPAWN_ERROR',error.message)));
    const abort=()=>requestStop(coded('CANCELLED','Replay operation cancelled'));
    spec.signal?.addEventListener('abort',abort,{once:true});if(spec.signal?.aborted)abort();
    const timeoutTimer=setTimeout(()=>requestStop(coded('TIMEOUT','Media operation exceeded its finite deadline')),Math.min(timeout,Math.max(1,deadline-performance.now())));
    const watchdog=setInterval(()=>{
      if(monitoring||settled)return;monitoring=true;
      monitoringPromise=(async()=>{
        try{await verifyOwnership();await storage();for(const file of outputs){const info=await checkedPath(file,{missing:true});if(info&&info.size>outputLimit)throw coded('OUTPUT_LIMIT','Output exceeded its write budget');}}
        catch(error){requestStop(error);}finally{monitoring=false;}
      })().catch(error=>requestStop(error));
    },50);
    child.once('spawn',()=>{
      job.record.pid=child.pid;job.record.state=requested?job.record.state:'running';persist();
      if(options.onChild)Promise.resolve().then(()=>options.onChild({id,label:spec.label,kind:spec.kind,pid:child.pid,exe:binary,exeSHA:pin.sha256,root})).catch(error=>requestStop(coded('CHILD_HOOK_FAILED',error.message)));
    });
    child.once('close',(code,signal)=>{
      settled=true;clearTimeout(timeoutTimer);clearInterval(watchdog);spec.signal?.removeEventListener('abort',abort);
      job.record.actualClosed=true;job.record.exitCode=code;job.record.exitSignal=signal;job.record.closedAt=new Date().toISOString();job.record.state='actual-close-observed';
      (async()=>{
        try{
          if(monitoringPromise)await monitoringPromise;
          await storage();for(let i=0;i<inputs.length;i++){
            const file=inputs[i],supplied=inputSpecs.find(p=>typeof p==='object'&&eq(resolve(p.path),file));
            if(supplied?.growing===true){const info=await checkedPath(file);if(info.dev!==before[i].dev||info.ino!==before[i].ino||info.size<before[i].bytes||await prefixSha(file,before[i].bytes)!==before[i].sha256)throw coded('SOURCE_CHANGED','Growing source was replaced, shortened or changed within its pinned prefix');}
            else if(!sameIdentity(before[i],await identity(file)))throw coded('SOURCE_CHANGED','Input identity changed during rendering');
          }
        }
        catch(error){failure??=error;job.record.errors.push(error.message);}
        for(const file of inputs)release(file);if(active===job)active=null;
        job.record.elapsedMs=performance.now()-start;job.record.stdoutBytes=bytes;job.record.stderrBytes=stderrBytes;
        await persist();if(lastLedgerError)failure??=coded('LEDGER_FAILURE','Evidence ledger could not be persisted');
        const stdout=Buffer.concat(stdoutChunks),stderr=Buffer.concat(stderrChunks).toString('utf8');
        for(const file of outputs){const info=await checkedPath(file,{missing:true});if(info&&info.size>=outputLimit)failure??=coded('OUTPUT_LIMIT','Output reached its hard write limit; possibly truncated output is not accepted');}
        stdoutChunks=[];stderrChunks=[];
        if(code!==0)failure??=coded('MEDIA_EXIT','Media process did not exit successfully',{exitCode:code});
        let pcmZero;
        if(mode==='pcm-zero'){
          if(bytes===0||pcmCarry.length!==0)failure??=coded('PCM_FORMAT','PCM analysis requires nonempty aligned little-endian f32 payload');
          else pcmZero=pcmPeak===0;
        }
        job.record.outcome=failure?'FAIL':'PASS';if(failure&&!job.record.errors.includes(failure.message))job.record.errors.push(failure.message);await persist();
        resolveClosed({code,exitCode:code,closed:true,stdout:mode==='text'?stdout.toString('utf8'):mode==='pcm-zero'?undefined:stdout,stderr,bytes,elapsedMs:job.record.elapsedMs,pcmZero,pcmPeak:mode==='pcm-zero'?pcmPeak:undefined,pcmSamples:mode==='pcm-zero'?bytes/4:undefined,actualClosed:true,pid:job.record.pid,failure});
      })().catch(error=>{unavailable=true;resolveClosed({actualClosed:true,code,failure:error});});
    });
    // Stop requests do not resolve success. After a bounded grace, callers get PENDING while this owned job remains tracked.
    let pendingTimer;const pending=new Promise(resolve=>{
      const poll=setInterval(()=>{if(requested){clearInterval(poll);pendingTimer=setTimeout(()=>resolve({pending:true}),closeGraceMs);}if(settled)clearInterval(poll);},25);
      closed.then(()=>clearInterval(poll));
    });
    const result=await Promise.race([closed,pending]);clearTimeout(pendingTimer);
    if(result.pending){unavailable=true;job.record.state='pending-close-no-force';await persist();throw coded('PROCESS_CLOSE_PENDING','Media process has not actually closed; ownership and input leases remain',{pending:true,jobId:id,pid:job.record.pid});}
    if(result.failure)throw Object.assign(result.failure,{actualClosed:result.actualClosed,jobId:id,pid:job.record.pid});
    return result;
  }
  async function execute(spec){
    if(closing||unavailable||active||preflightBusy||performance.now()>=deadline)throw coded('WORKER_UNAVAILABLE','Worker closing, busy, failed or past deadline');
    const reserved=[...new Set((spec.inputs||[]).map(p=>resolve(typeof p==='string'?p:p.path)))];
    for(const file of reserved)if(!inside(root,file)&&!readRoots.some(r=>inside(r.root,file)))throw coded('FILE_OUTSIDE_ROOT','Source outside declared roots');
    preflightBusy=true;for(const file of reserved)retain(file);
    try{return await executeImpl(spec);}
    finally{for(const file of reserved)release(file);preflightBusy=false;await persist();}
  }
  async function close(){
    closing=true;const current=active;if(current?.requestStop)current.requestStop(coded('SCOPE_CLOSED','Replay worker scope closed'));
    if(current?.closed){let timer;await Promise.race([current.closed,new Promise(resolve=>{timer=setTimeout(resolve,closeGraceMs);})]);clearTimeout(timer);}
    await persist();const pending=[...jobs.values()].filter(j=>j.record.pid&&!j.record.actualClosed).map(j=>({id:j.id,pid:j.record.pid,kind:j.record.kind}));
    return {actualClosed:pending.length===0&&!active&&!preflightBusy,pending,noForce:true,preflightBusy,readingFiles:[...reading.keys()],ledgerFile,ledgerError:lastLedgerError?.message||null};
  }
  await persist();if(lastLedgerError)throw lastLedgerError;
  return {execute,assertFile,assertOutput,commitAbsent,cleanupQuiescent,close,getReadingFiles:()=>[...reading.keys()],getLedger:snapshot,
    waitForActualClose:jobId=>{const job=jobs.get(jobId);if(!job?.closed)throw coded('UNKNOWN_JOB','Owned process job not found');return job.closed;},root};
}
