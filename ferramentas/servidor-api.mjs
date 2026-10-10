import {TickerAckBroker,readTickerAckRequest} from './gtzip-ticker-ack.mjs';
// FreeMix control bridge. Commands use confirmed production operations.
import { createServer } from 'node:http';
import { readFile,mkdir,writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join,resolve,relative,extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { networkInterfaces } from 'node:os';
import { randomBytes,randomInt,timingSafeEqual,createHash } from 'node:crypto';
import WebSocket,{WebSocketServer} from 'ws';
import QRCode from 'qrcode';
import { connect } from './obsws.mjs';
import { DiskReplay } from './replay-disco.mjs';
import { Production,xml } from './controle-producao.mjs';
import { OnlineUpdateEngine } from './atualizacao-online.mjs';
import { DiagnosticCollector } from './diagnostico-producao.mjs';
import { readDiagnosticZip } from './diagnostico-zip.mjs';
import {servePreviewMedia} from './midia-preview-http.mjs';

const ROOT=process.env.FREEMIX_ROOT||fileURLToPath(new URL('../',import.meta.url));
const PANEL=process.env.FREEMIX_PANEL_DIR||join(ROOT,'painel'), PORT=Number(process.env.FREEMIX_API_PORT||8088);
const installationId=createHash('sha256').update(resolve(ROOT).toLowerCase()).digest('hex');
const ips=()=>Object.values(networkInterfaces()).flat().filter(i=>i.family==='IPv4'&&!i.internal).map(i=>i.address);
const local=req=>['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress);
const equal=(a,b)=>{const x=Buffer.from(String(a||'')),y=Buffer.from(String(b||''));return x.length===y.length&&timingSafeEqual(x,y);};
const token=randomBytes(32).toString('base64url'),pin=String(randomInt(100000,1000000)),sessions=new Map(),attempts=new Map();
const accessDir=join(ROOT,'config','obs-studio','plugin_config','freemix-control');
await mkdir(accessDir,{recursive:true});await writeFile(join(accessDir,'acesso.json'),JSON.stringify({apiToken:token,pin,startedAt:Date.now()}),{mode:0o600});
let obs=null,reconnectTimer=null,stopping=false,connecting=false,connectionGeneration=0,connectionReady=false,pollingGeneration=null;
const connectionErrors={};
function connectionError(component,error){const message=String(error?.message||error).replace(/(password|key|secret|token)\s*[:=]\s*[^\s,]+/gi,'$1=[omitido]').slice(0,500),previous=connectionErrors[component];connectionErrors[component]={message,at:Date.now()};if(previous?.message!==message||Date.now()-previous.at>30000)console.error(`FreeMix: ${component}: ${message}`);}
function scheduleConnection(){if(!stopping&&!reconnectTimer)reconnectTimer=setTimeout(()=>{reconnectTimer=null;startConnection();},2000);}
const clients=new Set();
const broadcast=msg=>{const s=JSON.stringify(msg);for(const c of clients)if(c.readyState===WebSocket.OPEN)c.send(s);};
const production=new Production({root:ROOT,panel:PANEL,getObs:()=>obs,publish:data=>broadcast({type:'state',data:clean(data)})});
production.gtTickerAck=new TickerAckBroker({endpoint:'http://127.0.0.1:'+PORT+'/api/ticker-ack'});
const onlineUpdate=new OnlineUpdateEngine(ROOT);
const diagnostics=new DiagnosticCollector(ROOT);
const replay=new DiskReplay({root:ROOT,getObs:()=>obs,onChange:data=>broadcast({type:'replay_state',data})});
const iso=new DiskReplay({root:ROOT,getObs:()=>obs,filter:'Gravação ISO',namespace:'freemix-iso',recordingFolder:'iso',onChange:data=>broadcast({type:'iso_state',data})});
production.recoveryEngine.guard=()=>!!(replay.state.rec||iso.state.rec||production.callEngine.returns.timer);

function publicOperation(receipt){
  if(!receipt||typeof receipt!=='object')return undefined;
  const {id,action,scope,targetKey,targetName,receivedAt,startedAt,engineConfirmedAt,finishedAt,stage,replayed}=receipt;
  const error=receipt.error?String(receipt.error).replace(/(password|key|secret|token)\s*[:=]\s*[^\s,]+/gi,'$1=[omitido]').slice(0,500):undefined;
  return {id,action,scope,targetKey,targetName,receivedAt,startedAt,engineConfirmedAt,finishedAt,stage,...(replayed!==undefined?{replayed}:{}),...(error?{error}: {})};
}

const clean=(s=production.state)=>({...s,operation:publicOperation(s.operation),operationReceipts:(s.operationReceipts||[]).map(publicOperation).filter(Boolean),replay:replay.state,iso:iso.state,ips:ips()});
function originAllowed(req){
  const o=req.headers.origin;if(!o)return true;if(o==='null')return local(req);
  try{return new URL(o).host===req.headers.host;}catch{return false;}
}
function authorized(req){
  if(!originAllowed(req))return false;if(local(req))return true;
  if(equal(req.headers.authorization?.replace(/^Bearer /i,''),token))return true;
  const c=/(?:^|;\s*)freemix_session=([A-Za-z0-9_-]+)/.exec(req.headers.cookie||'');return !!c&&sessions.get(c[1])>Date.now();
}
const json=(res,code,data)=>{res.writeHead(code,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data));};
async function body(req){let s='';for await(const b of req){s+=b;if(s.length>7*1024*1024)throw new Error('Pedido muito grande');}return JSON.parse(s||'{}');}
async function startConnection(){
  if(stopping||obs||connecting)return;connecting=true;const generation=++connectionGeneration;let candidate=null;
  try{
    const connected=await connect({root:ROOT,events:1|2|4|8|16|64|128|256|512|65536,
      onEvent:(type,data)=>{if(generation!==connectionGeneration)return;if(type==='ExitStarted'){production.sessionRecovery.finish('normal').catch(()=>{});return;}if(type==='VendorEvent'&&data.vendorName==='freemix-hotkeys'){if(data.eventType==='hotkey')production.globalHotkeys.event(data.eventData);if(data.eventType==='bindings_reset')production.globalHotkeys.disconnected();return;}production.sessionRecovery.onNativeEvent(type,data);if(type==='CurrentProgramSceneChanged'&&obs)replay.onProgramChanged(data.sceneName)?.catch(e=>connectionError('replay-autoplay',e));if(type==='InputVolumeMeters'){production.onMeters(data.inputs);broadcast({type:'meters',inputs:data.inputs});}},
      onClose:()=>{if(generation!==connectionGeneration)return;connectionGeneration++;obs=null;connectionReady=false;production.disconnected();scheduleConnection();}});
    candidate=connected;if(stopping||generation!==connectionGeneration){connected.close();return;}obs=connected;
    const motor=(await connected.req('CallVendorRequest',{vendorName:'freemix',requestType:'get_interface',requestData:{}})).responseData;
    await production.sessionRecovery.start({motorIdentity:motor.pid?motor.pid+':'+motor.executable:null});await production.tick();
    if(obs!==connected||generation!==connectionGeneration)return;connectionReady=production.state.connected===true;delete connectionErrors.production;
    // Replay/ISO diagnostics are independent of the confirmed production snapshot.
    for(const [name,component] of [['replay',replay],['iso',iso]])try{await component.command('status');delete connectionErrors[name];}catch(e){if(obs===connected)connectionError(name,e);}
    if(obs===connected&&generation===connectionGeneration)console.log('FreeMix: motor conectado.');
  }catch(e){if(generation===connectionGeneration){connectionReady=false;if(obs===candidate){obs=null;candidate?.close();}production.disconnected();connectionError('production',e);}}
  finally{connecting=false;if(!obs)scheduleConnection();}
}
async function vmix(fn,p){
  const get=k=>p.get(k)??p.get(k.toLowerCase()),input=get('Input'),value=get('Value'),name=String(fn).toLowerCase();let action,data={input};
  if(['cut','fade','previewinput','activeinput','cutdirect'].includes(name)){action={previewinput:'preview',activeinput:'active',cutdirect:'active'}[name]||name;data.duration=get('Duration')??500;}
  else if(name==='setvolume'){action='audio_volume';data.volume=value;}
  else if(['audio','audioon','audiooff','masteraudio','setmastervolume'].includes(name)){action=name==='setmastervolume'?'audio_volume':'audio_mute';if(name.startsWith('master')||name==='setmastervolume')data.input='M';if(name==='audioon')data.muted=false;if(name==='audiooff')data.muted=true;data.volume=value;}
  else if(['startrecording','stoprecording','startstreaming','stopstreaming'].includes(name)){action=name.endsWith('recording')?'record':'stream';data.active=name.startsWith('start');}
  else if(['play','pause','restart','nextitem','previousitem'].includes(name)){action='media';data.command={nextitem:'NEXT',previousitem:'PREVIOUS'}[name]||name.toUpperCase();}
  else if(name==='setposition'){action='media_seek';data.position=value;}
  else if(name==='setspeed'){action='media_settings';data.speed=value;}
  else if(/^overlayinput[1-8](in|out)?$/.test(name)){action='overlay';data.channel=Number(name[12]);if(name.endsWith('out'))data.input='';else if(!name.endsWith('in')){const s=production.scene(input).name;if(production.state.overlays.some(o=>o.number===data.channel&&o.scene===s))data.input='';}}
  else if(name==='gcupdate'){action='gc';data={kind:'lower',data:{title:get('title')??'',subtitle:get('subtitle')??''}};}
  else if(name==='scoregoal'){action='score';data={team:get('team'),delta:value??1};}
  else if(name.startsWith('replay')){
    const a={replayplay:'air',replaylive:'live',replaymarkin:'mark-in',replaymarkout:'mark-out',replaysetspeed:'speed'}[name];if(!a)throw new Error('Comando de replay não implementado');
    await replay.command(a,{player:input||replay.state.activePlayer,speed:Number(value)*100});return;
  }else throw new Error('Comando não implementado: '+fn);
  await production.run(action,data);
}
const routes={'/':'hub','/hub':'hub','/corte':'corte','/playout':'playout','/gc-html':'gc-html','/gc':'gc','/audio':'audio','/replay':'replay','/iso':'iso','/dados':'dados','/compor':'compor','/settings':'settings','/calls':'calls','/macros':'macros','/recuperacao':'recuperacao','/saidas':'saidas','/srt-hdr':'srt-hdr','/rede':'rede','/atalhos':'atalhos','/efeitos':'efeitos','/sinais':'sinais','/atualizacao':'atualizacao','/diagnosticos':'diagnosticos'};
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.gif':'image/gif','.jpg':'image/jpeg','.webp':'image/webp','.bmp':'image/bmp','.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf','.otf':'font/otf','.json':'application/json'};

function controlReceipt(request){
  if(!request||typeof request.id!=='string'||typeof request.scope!=='string')return undefined;
  const receipt=production.operationReceipts?.get(request.scope+':'+request.id);
  if(!receipt||receipt.id!==request.id||receipt.scope!==request.scope)return undefined;
  return publicOperation(receipt);
}

const server=createServer(async(req,res)=>{
  let controlOperation;
  try{
    const u=new URL(req.url,'http://localhost'),path=u.pathname;
    res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
    // Health is read by the local file-based CEF desk too. Apply the same
    // restricted origin policy before returning from this early route.
    if(originAllowed(req)&&req.headers.origin){res.setHeader('Access-Control-Allow-Origin',req.headers.origin);res.setHeader('Vary','Origin');res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');}
    if(path==='/api/health'){
      if(!local(req)||!originAllowed(req))return json(res,403,{success:false});
      return json(res,200,{success:true,app:'FreeMix',protocol:1,installationId,pid:process.pid,connected:!!obs&&connectionReady&&production.state.connected===true,transportConnected:!!obs,connectionErrors,port:PORT});
    }
    if(req.method==='OPTIONS'){res.writeHead(originAllowed(req)?204:403).end();return;}
    if(path==='/api/pair'&&req.method==='POST'){
      if(!originAllowed(req))return json(res,403,{success:false,error:'Origem recusada'});
      const addr=req.socket.remoteAddress,rate=attempts.get(addr)||{count:0,until:Date.now()+60000};if(rate.until<Date.now()){rate.count=0;rate.until=Date.now()+60000;}attempts.set(addr,rate);
      if(++rate.count>10)return json(res,429,{success:false,error:'Aguarde um minuto para tentar novamente'});
      const d=await body(req);if(!equal(d.pin,pin))return json(res,401,{success:false,error:'Código incorreto'});
      const id=randomBytes(24).toString('base64url');sessions.set(id,Date.now()+12*60*60*1000);res.setHeader('Set-Cookie',`freemix_session=${id}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200`);return json(res,200,{success:true});
    }
    if(path==='/api/access'){if(!local(req)||!originAllowed(req))return json(res,403,{success:false,error:'Abra este controle no computador do FreeMix'});return json(res,200,{pin,expires:'ao fechar o FreeMix',urls:ips().map(ip=>`http://${ip}:${PORT}/`)});}
    if(path==='/api/qr.svg'){
      if(!local(req))return json(res,403,{success:false});const address=u.searchParams.get('address');if(!ips().map(ip=>`http://${ip}:${PORT}/`).includes(address))throw new Error('Endereço de QR inválido');
      res.writeHead(200,{'Content-Type':'image/svg+xml'});res.end(await QRCode.toString(address,{type:'svg',errorCorrectionLevel:'M',margin:2}));return;
    }
    if(path.startsWith('/api/')||path==='/api'||path==='/ws'){
      if(!authorized(req))return json(res,401,{success:false,error:'Autorize este dispositivo com o código do computador FreeMix'});
      if(path.startsWith('/api/replay-preview/')){
        if(!local(req))return json(res,403,{success:false,error:'Prévia do histórico disponível somente neste computador'});
        if(!['GET','HEAD'].includes(req.method)){res.setHeader('Allow','GET, HEAD');return json(res,405,{success:false,error:'Método inválido'});}
        const previewToken=path.slice('/api/replay-preview/'.length);
        if(!/^[0-9a-f]{32}$/.test(previewToken))return json(res,404,{success:false,error:'Prévia inválida'});
        let lease;
        try{lease=await replay.previewFile(previewToken);}catch{return json(res,404,{success:false,error:'Prévia expirada; atualize o histórico'});}
        return await servePreviewMedia(req,res,lease);
      }
      if(path==='/api/ticker-ack'){if(req.method!=='POST'||!local(req)||!originAllowed(req))return json(res,403,{success:false});const data=await readTickerAckRequest(req);const accepted=production.gtTickerAck.accept(data);return json(res,accepted?200:409,{success:accepted});}
      if(path.startsWith('/api/diagnostics')){
        if(!local(req))return json(res,403,{success:false,error:'Diagnóstico disponível somente neste computador'});
        if(path==='/api/diagnostics'&&req.method==='POST'){const data=await body(req);if(typeof data.note!=='undefined'&&typeof data.note!=='string'||typeof data.machineName!=='undefined'&&typeof data.machineName!=='string')throw Error('Dados inválidos');await diagnostics.generate({note:data.note,machineName:data.machineName});return json(res,200,diagnostics.summary());}
        if(path==='/api/diagnostics'&&req.method==='GET')return json(res,200,diagnostics.summary());
        if(['/api/diagnostics/download','/api/diagnostics/preview'].includes(path)&&req.method==='GET'){const zip=await diagnostics.download(u.searchParams.get('id'));if(path.endsWith('/preview')){const files=await readDiagnosticZip(zip);let text='Prévia: até 4 KB de cada log. O ZIP preserva o conteúdo limitado descrito no manifesto.\n';for(const [name,data]of files){const snippet=name.startsWith('logs/')?data.subarray(0,4096):data;text+='\n--- '+name+' ---\n'+snippet.toString('utf8')+(snippet.length<data.length?'\n[prévia reduzida; restante no ZIP]':'')+'\n';}return json(res,200,{success:true,text});}res.writeHead(200,{'Content-Type':'application/zip','Content-Disposition':'attachment; filename="'+diagnostics.last.name+'"','Content-Length':zip.length});res.end(zip);return;}
        return json(res,404,{success:false,error:'Operação de diagnóstico inválida'});
      }
      if(path==='/api/update'&&req.method==='GET'){if(!local(req))return json(res,403,{success:false,error:'Atualização disponível somente neste computador'});await onlineUpdate.execute('update_read',{});return json(res,200,{success:true,update:onlineUpdate.last});}
      if(path==='/api/effects-frame'&&req.method==='GET'){
        if(!local(req))return json(res,403,{success:false,error:'Efeitos disponíveis somente neste computador'});
        const key=u.searchParams.get('key')||'';
        if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key))throw Error('Entrada inválida');
        const data=await production.effectsEngine.frame(key);
        if(typeof data!=='string'||!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(data)||data.length>12*1024*1024)throw Error('Imagem indisponível');
        const png=Buffer.from(data.slice('data:image/png;base64,'.length),'base64');
        if(png.length<8||!png.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))throw Error('Imagem inválida');
        res.writeHead(200,{'Content-Type':'image/png','Cache-Control':'no-store'});res.end(png);return;
      }
      if(path==='/api/composition-frame'&&req.method==='GET'){
        const input=u.searchParams.get('input')||'';
        if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input))throw new Error('Composição inválida');
        const data=await production.inputEngine.frame(input);
        if(typeof data!=='string'||!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(data)||data.length>12*1024*1024)throw new Error('Imagem da composição indisponível');
        const png=Buffer.from(data.slice('data:image/png;base64,'.length),'base64');
        if(png.length<8||!png.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))throw new Error('Imagem da composição inválida');
        res.writeHead(200,{'Content-Type':'image/png','Cache-Control':'no-store'});res.end(png);return;
      }
      if(path==='/api/effects'&&req.method==='GET'){if(!local(req))return json(res,403,{success:false,error:'Efeitos disponíveis somente neste computador'});return json(res,200,{success:true,effects:await production.effectsEngine.summary(u.searchParams.get('key')||undefined)});}
      if(path==='/api/audio-routing'&&req.method==='GET'){if(!local(req))return json(res,403,{success:false,error:'Áudio disponível somente neste computador'});return json(res,200,{success:true,audioRouting:await production.audioRoutingEngine.read(u.searchParams.get('key')||undefined)});}
      if(path==='/api/srt-hdr'){if(req.method!=='GET')return json(res,405,{success:false});if(!local(req))return json(res,403,{success:false,error:'Consulta HDR disponível somente neste computador'});const id=u.searchParams.get('senderId')??'0';if(!/^[0-3]$/.test(id))throw Error('Envio HDR inválido');return json(res,200,{success:true,outputs:await production.outputEngine.readSrtHdr(Number(id))});}
      if(path==='/api/network'&&req.method==='GET'){if(!local(req))return json(res,403,{success:false,error:'Rede disponível somente neste computador'});return json(res,200,await production.networkEngine.read());}
      if(path==='/api/gc-compatible'&&req.method==='GET'){if(!local(req))return json(res,403,{success:false,error:'Editor HTML apenas local'});return json(res,200,{success:true,gcCompatible:await production.gcCompatible.summary()});}
      if((path==='/gc-html'||path==='/gc-html.html')&&!local(req))return json(res,403,{success:false,error:'Editor HTML apenas local'});
      if(path==='/api/control'&&req.method==='POST'){const d=await body(req);if(String(d.action).startsWith('update_')){if(!local(req))return json(res,403,{success:false,error:'Atualização disponível somente neste computador'});await onlineUpdate.execute(d.action,d);return json(res,200,{success:true,state:clean(),update:onlineUpdate.last});}if((String(d.action).startsWith('gc_html_')||d.action==='data_file'||['gc_library_save','gc_library_duplicate','gc_library_remove','gc_library_import','gc_library_export','gc_library_asset','gc_library_variant','gc_library_unlink','gc_library_clock_restart'].includes(d.action)||String(d.action).startsWith('settings_')||String(d.action).startsWith('call_')||String(d.action).startsWith('recovery_')||(String(d.action).startsWith('macro_')&&!['macro_run','macro_cancel'].includes(d.action))||String(d.action).startsWith('outputs_')||String(d.action).startsWith('network_')||String(d.action).startsWith('audio_routing_')||String(d.action).startsWith('effects_')||d.action==='signal_configure'||['controller_save','controller_remove','controller_enable','controller_osc_configure','controller_osc_start','controller_osc_stop'].includes(d.action))&&!local(req))return json(res,403,{success:false,error:'Configuração local só no computador do FreeMix'});controlOperation={id:d.operationId,scope:d.expectedScope};const state=await production.run(d.action,d);return json(res,200,{success:true,state:clean(state),...(String(d.action).startsWith('effects_')?{effects:production.effectsResult}:{}),...(String(d.action).startsWith('signal_')?{signals:production.signalEngine.last}:{}),...(String(d.action).startsWith('call_')?{call:production.callResult}:{}),...(String(d.action).startsWith('gc_html_')?{gcCompatible:{last:production.gcCompatible.last}}:{}),...(String(d.action).startsWith('gc_library_')?{gcLibrary:production.gcLibrary.last}:{}),...(String(d.action).startsWith('audio_routing_')?{audioRouting:production.audioRoutingEngine.last}: {}),...(String(d.action).startsWith('settings_')?{settings:production.settingsEngine.last}: {}),...(String(d.action).startsWith('recovery_')?{recovery:production.recoveryResult}: {}),...(String(d.action).startsWith('outputs_')?{outputs:production.outputEngine.last}: {}),...(String(d.action).startsWith('network_')?{network:production.networkEngine.last}: {}),...(String(d.action).startsWith('controller_')?{controllers:production.controllerEngine.last}: {})});}
      if(path==='/api/replay'){if(!['GET','POST'].includes(req.method))return json(res,405,{success:false});const d=req.method==='POST'?await body(req):{};const result=await replay.command(req.method==='GET'?'status':d.action,d);return json(res,200,{success:true,replay:result});}
      if(path==='/api/iso'){if(!['GET','POST'].includes(req.method))return json(res,405,{success:false});const d=req.method==='POST'?await body(req):{};const action=req.method==='GET'?'status':d.action;if(!['status','start','stop','configure'].includes(action))throw new Error('Ação ISO inválida');if((action==='configure'||d.options)&&!local(req))return json(res,403,{success:false,error:'Opções de gravação só no computador do FreeMix'});return json(res,200,{success:true,iso:await iso.command(action,d)});}
      if(['/api','/api/','/api/json'].includes(path)){
        const fn=u.searchParams.get('Function')||u.searchParams.get('function');
        if(fn){try{await vmix(fn,u.searchParams);if(path==='/api/json')return json(res,200,{success:true});res.writeHead(200,{'Content-Type':'text/xml'});res.end('<Function result="Success"/>');}catch(e){if(path==='/api/json')return json(res,400,{success:false,error:e.message});res.writeHead(400,{'Content-Type':'text/xml'});res.end(`<Function result="Error" message="${xml(e.message)}"/>`);}return;}
        if(path==='/api/json')return json(res,200,clean());res.writeHead(200,{'Content-Type':'text/xml; charset=utf-8'});res.end(production.statusXml());return;
      }
      return json(res,404,{success:false,error:'API não encontrada'});
    }
    let file;
    if(routes[path])file=join(PANEL,'remoto',routes[path]+'.html');
    else if(path==='/efeitos/srt-packed-alpha.shader'){res.setHeader('Content-Type','text/plain; charset=utf-8');res.setHeader('Content-Disposition','attachment; filename="srt-packed-alpha.shader"');const shader=await readFile(join(PANEL,'efeitos/srt-packed-alpha.shader'));res.writeHead(200);res.end(shader);return;}
    else{
      const decoded=decodeURIComponent(path);if(decoded.includes('\\')||decoded.includes('\0'))throw new Error('Caminho inválido');
      const rel=decoded.replace(/^\/+/,''),target=resolve(PANEL,rel);if(relative(PANEL,target).startsWith('..')||relative(PANEL,target)==='')throw new Error('Caminho inválido');
      if(/(^|\/)(local\.js|.*\.ini|.*\.salvo|.*\.bak)$/i.test(rel)&&!local(req))return json(res,403,{success:false,error:'Arquivo privado'});
      file=[resolve(PANEL,'remoto',rel),target].find(f=>!relative(PANEL,f).startsWith('..')&&['.html','.js','.css','.png','.gif','.jpg','.webp','.bmp','.svg','.woff2','.woff','.ttf','.otf'].includes(extname(f))&&existsSync(f));
    }
    if(!file){res.writeHead(404).end('Não encontrado');return;}
    try{const data=await readFile(file);res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'});res.end(data);}catch(e){if(e.code==='ENOENT'){res.writeHead(404).end('Não encontrado');}else throw e;}
  }catch(e){const operation=controlReceipt(controlOperation);json(res,400,{success:false,error:e.message,...(operation?{operation}: {})});}
});
const wss=new WebSocketServer({noServer:true,maxPayload:32768});
const callWss=new WebSocketServer({noServer:true,maxPayload:4096});
server.on('upgrade',(req,socket,head)=>{const u=new URL(req.url,'http://localhost');if(u.pathname==='/api/calls/audio'){
 if(!local(req)||!originAllowed(req)||!equal(u.searchParams.get('token'),production.callEngine.returns.token)){socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');socket.destroy();return;}
 callWss.handleUpgrade(req,socket,head,ws=>production.callEngine.returns.accept(ws,u.searchParams.get('key')));return;
}if(u.pathname!=='/ws'||!authorized(req)){socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');socket.destroy();return;}wss.handleUpgrade(req,socket,head,ws=>wss.emit('connection',ws,req));});
wss.on('connection',(ws,request)=>{clients.add(ws);ws.send(JSON.stringify({type:'init',data:clean()}));ws.on('close',()=>clients.delete(ws));
  ws.on('message',async raw=>{let m;try{m=JSON.parse(String(raw));if((String(m.action).startsWith('gc_html_')||m.action==='data_file'||['gc_library_save','gc_library_duplicate','gc_library_remove','gc_library_import','gc_library_export','gc_library_asset','gc_library_variant','gc_library_unlink','gc_library_clock_restart'].includes(m.action)||String(m.action).startsWith('settings_')||String(m.action).startsWith('call_')||String(m.action).startsWith('recovery_')||(String(m.action).startsWith('macro_')&&!['macro_run','macro_cancel'].includes(m.action))||String(m.action).startsWith('outputs_')||String(m.action).startsWith('network_')||String(m.action).startsWith('audio_routing_')||String(m.action).startsWith('effects_')||m.action==='signal_configure'||['controller_save','controller_remove','controller_enable','controller_osc_configure','controller_osc_start','controller_osc_stop'].includes(m.action))&&!local(request))throw new Error('Configuração local só no computador do FreeMix');const data=m.action==='replay'?await replay.command(m.cmd,m):await production.run(m.action,m);ws.send(JSON.stringify({type:'ack',id:m.id,success:true,data}));}catch(e){ws.send(JSON.stringify({type:'ack',id:m?.id,success:false,error:e.message}));}});
});
const ticker=setInterval(async()=>{if(!obs||connecting||pollingGeneration!==null)return;const current=obs,generation=connectionGeneration;pollingGeneration=generation;
 try{await production.tick();if(obs!==current||generation!==connectionGeneration)return;connectionReady=production.state.connected===true;delete connectionErrors.production;production.sessionRecovery.tick();
  for(const [name,component] of [['iso',iso],['replay',replay]]){if(obs!==current||generation!==connectionGeneration)return;try{await component.command('status');delete connectionErrors[name];}catch(e){if(obs===current&&generation===connectionGeneration)connectionError(name,e);}}
 }catch(e){if(obs===current&&generation===connectionGeneration){connectionReady=false;production.disconnected();connectionError('production',e);}}
 finally{if(pollingGeneration===generation)pollingGeneration=null;}
},1000);
server.listen(PORT,process.env.FREEMIX_API_HOST||'127.0.0.1',()=>{console.log(`FreeMix: API e consoles na porta ${PORT}.`);startConnection();});
function stop(){if(stopping)return;stopping=true;production.gtTickerAck.dispose();connectionGeneration++;connectionReady=false;production.sessionRecovery.finish('api-restart').catch(()=>{});clearInterval(ticker);clearTimeout(reconnectTimer);for(const c of clients)c.close();production.callEngine.returns.stop().catch(()=>{});production.networkEngine.stop().catch(()=>{});replay.dispose().catch(e=>connectionError('replay-preview-close',e));iso.dispose().catch(e=>connectionError('iso-preview-close',e));obs?.close();wss.close();callWss.close();server.close();}
process.on('SIGTERM',stop);process.on('SIGINT',stop);
