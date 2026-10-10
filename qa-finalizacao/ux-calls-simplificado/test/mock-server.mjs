import http from 'node:http';import fs from 'node:fs/promises';import path from 'node:path';
const qa=path.resolve(import.meta.dirname,'..'),workspace=path.resolve(qa,'../..');
export function fixture(){const guests=[['guest-a','Ana'],['guest-b','Bruno'],['guest-c','Carla']].map(([key,name])=>({key,name:'Call '+name,person:{name},guest:'https://example.invalid/guest/'+key}));return{connected:true,preset:'Own QA Project',inputs:[{key:'scene-program',name:'Entrevista'},{key:'own-cam',name:'Câmera local'}],audioInputs:[{name:'Microfone diretor QA',kind:'wasapi_input_capture'}],calls:{guests,rapidTargets:['guest-a'],director:{key:'director',name:'Microfone diretor QA'},nativeWatchdog:true,talking:false,capability:'individual-PCM-WebRTC',conference:true,ice:{configured:false},audioChoices:[{key:'director',name:'Microfone diretor QA'},{key:'own-music',name:'Trilha local QA'},...guests.map(g=>({key:g.key,name:g.name}))],returns:guests.map(g=>({key:g.key,video:'program',audio:'program',audioSources:[],gain:1,publisher:'publishing',peerConnectionVerified:true,peers:1,diagnostics:{ice:'connected',transport:'direct',rttMs:35,queuedMs:25}}))}};}
export async function mockServer(){
 let state=fixture(),lease=null,deadline=0;const options={startDelay:0,failSelection:false},events=[];
 const server=http.createServer(async(req,res)=>{try{
  const u=new URL(req.url,'http://127.0.0.1');const send=(value,status=200)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
  async function data(){let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>65536)throw Error('QA body too large');}return JSON.parse(raw||'{}');}
  if(u.pathname==='/qa/state'){if(lease&&Date.now()>deadline){lease=null;state.calls.talking=false;}return send(state);}
  if(u.pathname==='/qa/events')return send(events);
  if(u.pathname==='/qa/config'){const d=await data();Object.assign(options,d.options||{});if(d.reset){state=fixture();lease=null;events.length=0;}if(d.state)Object.assign(state,d.state);if(d.calls)Object.assign(state.calls,d.calls);return send({success:true});}
  if(u.pathname==='/api/control'){
   const d=await data();events.push({...d,at:Date.now()});
   if(d.action==='call_rapid_targets'){if(options.failSelection)return send({success:false,error:'Falha de gravação QA'},500);state.calls.rapidTargets=d.targets;}
   else if(d.action==='call_talk_start'){if(lease)return send({success:false,error:'Mic já aberto QA'},400);lease='own-lease-'+events.length;state.calls.talking=true;deadline=Date.now()+1500;const result={success:true,call:{lease}};if(options.startDelay)await new Promise(resolve=>setTimeout(resolve,options.startDelay));return send(result);}
   else if(d.action==='call_talk_stop'){if(!d.lease||d.lease===lease){lease=null;state.calls.talking=false;}}
   else if(d.action==='call_talk_ping'){if(d.lease!==lease)return send({success:false,error:'Lease expirado QA'},400);deadline=Date.now()+1500;}
   else if(d.action==='call_returns_prepare'){state.calls.capability='individual-PCM-WebRTC';state.calls.returns.forEach(r=>r.publisher='publishing');}
   else if(d.action==='call_returns_stop'){state.calls.capability='shared-return-B';state.calls.returns.forEach(r=>r.publisher='offline');}
   else if(d.action==='call_director'||d.action==='call_director_create')state.calls.director={key:'director',name:'Microfone diretor QA'};
   else if(d.action==='call_conference')state.calls.conference=d.enabled===true;
   else if(d.action==='call_return_route'){const r=state.calls.returns.find(r=>r.key===d.key);Object.assign(r,{video:d.video,audio:d.audio,gain:d.gain,audioSources:d.audioSources});}
   else if(d.action==='call_ice_reset')state.calls.ice={configured:false};
   return send({success:true,state});
  }
  if(u.pathname==='/controle.js'){res.writeHead(200,{'Content-Type':'text/javascript'});return res.end("window.FreeMixRemote={getState:()=>window.QA_STATE||{}};async function pollQA(){window.QA_STATE=await(await fetch('/qa/state')).json();document.getElementById('connection').textContent=window.QA_STATE.connected?'Motor QA conectado':'Motor QA desconectado';}pollQA();setInterval(pollQA,100);");}
  const files={'/':'draft/calls.html','/calls':'draft/calls.html','/calls.html':'draft/calls.html','/calls.js':'draft/calls.js','/controle.css':'test/controle.css','/studio-dialog.css':'test/studio-dialog.css','/talkback-rapido.js':'draft/talkback-rapido.js'};
  if(!files[u.pathname])return send({error:'QA route only'},404);const file=path.join(qa,files[u.pathname]);res.writeHead(200,{'Content-Type':file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html','Cache-Control':'no-store'});res.end(await fs.readFile(file));
 }catch(error){res.writeHead(500,{'Content-Type':'application/json'});res.end(JSON.stringify({success:false,error:error.message}));}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 return{server,url:`http://127.0.0.1:${server.address().port}`,state:()=>state,events,options,close:async()=>{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}};
}
export async function copyStyles(){for(const name of ['controle.css','studio-dialog.css'])await fs.copyFile(path.join(workspace,'obs-vmix/painel/remoto',name),path.join(qa,'test',name));}
