import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const qa=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(qa,'../../..');
const pin=JSON.parse(fs.readFileSync(path.join(qa,'INTEGRATION.json'))),old=fs.readFileSync(path.join(root,pin.target),'utf8'),fresh=fs.readFileSync(path.join(qa,'draft',pin.target),'utf8');
function fn(text,name){const match=new RegExp('(?:async )?function '+name+'\\(').exec(text);assert(match,name);const start=match.index,open=text.indexOf('{',start);let depth=1,i=open+1;for(;depth;i++){if(text[i]==='{')depth++;if(text[i]==='}')depth--;}return text.slice(start,i);}
const defer=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
const turn=()=>new Promise(r=>setImmediate(r));
const results=[];async function test(name,fn){await fn();results.push({name,status:'PASS'});}
function harness(text,newer=true){
  const observations={queries:[],renders:0,commands:[],active:[],sources:[{sourceName:'A-media',inputKind:'ffmpeg_source'}],settings:{looping:true},pauses:[],fault:false,reply:null};
  const st={on:true,studio:true,preset:'OwnProject',scenes:['A'],sceneKeys:{A:'uuid-A'},items:new Map(),loop:new Map(),iso:new Map(),fixed:new Set(),gcNames:new Set(),hasIso:false,pl:null};
  const context={ws:{ownConnection:1},st,console,Map,Set,JSON,Array,Error,Promise,mesaDisposed:false,dragging:false,BUS_SCENE:'OwnBus',ISO:'OwnISO',BUSES:[],
    isMedia:k=>k==='ffmpeg_source',isPlaylist:()=>false,loopKey:()=> 'looping',gcParse:url=>url==='own_gc',
    renderTiles:()=>observations.renders++,renderMixer:()=>{},renderBot:()=>{},renderPop:()=>{},
    async tryReq(type,data){observations.queries.push({type,data});if(observations.reply){const response=observations.reply(type,data);if(response!==undefined)return await response;}if(observations.fault)throw Error('Own read error');
      if(type==='GetSceneItemList')return {sceneItems:data.sceneName==='OwnBus'?[]:structuredClone(observations.sources)};
      if(type==='GetSourceFilterList')return {filters:[]};
      if(type==='GetInputSettings'){if(observations.pauses.length)return await observations.pauses.shift().promise;return {inputSettings:structuredClone(observations.settings)};}
      return null;},
    req:async(type,data)=>{observations.commands.push({type,data});return {};},
    productionAction:async(action,data)=>{observations.active.push({action,data});return {};}
  };
  vm.createContext(context);
  const program=(newer?'let itemsReadTask=null,itemsReadAgain=false,itemsReadVersion=0;\n':'')+
    fn(text,'syncItems')+'\n'+(newer?fn(text,'readItemsSnapshot')+'\n':'')+fn(text,'syncGcNames')+
    '\nlet previewIntent=null,previewIntentSequence=0,operationalPending=null;\n'+fn(text,'choosePreview')+
    '\nthis.getIntent=()=>previewIntent;this.setPending=v=>operationalPending=v;';
  vm.runInContext(program,context);
  return {context,observations,st};
}

await test('Baseline bug reproduced: concurrent old reads commit stale loop after newer snapshot',async()=>{
  const {context:c,observations:o,st}=harness(old,false),first=defer();o.pauses.push(first);
  const p1=c.syncItems();await turn();const p2=c.syncItems();await p2;assert.equal(st.loop.get('A-media'),true);
  first.resolve({inputSettings:{looping:false}});await p1;assert.equal(st.loop.get('A-media'),false);assert.equal(o.renders,2);
});
await test('Draft coalesces reads and discards superseded snapshot before render',async()=>{
  const {context:c,observations:o,st}=harness(fresh),first=defer();o.pauses.push(first);
  const p1=c.syncItems();await turn();const count=o.queries.length,p2=c.syncItems();assert.equal(p1,p2);await turn();assert.equal(o.queries.length,count);
  first.resolve({inputSettings:{looping:false}});await p1;assert.equal(st.loop.get('A-media'),true);assert.equal(o.renders,1);
});
await test('Twenty refresh requests collapse to one additional read',async()=>{
  const {context:c,observations:o}=harness(fresh),first=defer();o.pauses.push(first);const p=c.syncItems();await turn();for(let i=0;i<20;i++)assert.equal(c.syncItems(),p);
  first.resolve({inputSettings:{looping:false}});await p;assert.equal(o.queries.filter(q=>q.type==='GetSceneItemList'&&q.data.sceneName==='A').length,2);assert.equal(o.renders,1);
});
await test('Scope switch rejects previous project data before commit',async()=>{
  const {context:c,observations:o,st}=harness(fresh),first=defer();o.pauses.push(first);const initial=st.items,p=c.syncItems();await turn();st.preset='AnotherOwnProject';first.resolve({inputSettings:{looping:false}});await p;assert.equal(st.items,initial);assert.equal(o.renders,0);
});
await test('Same name recreated with new scene UUID rejects old snapshot',async()=>{
  const {context:c,observations:o,st}=harness(fresh),first=defer();o.pauses.push(first);const initial=st.items,p=c.syncItems();await turn();st.sceneKeys.A='uuid-A-new';first.resolve({inputSettings:{looping:false}});await p;assert.equal(st.items,initial);assert.equal(o.renders,0);
});
await test('Removal/reordering during await rejects old topology',async()=>{
  const {context:c,observations:o,st}=harness(fresh),first=defer();o.pauses.push(first);const p=c.syncItems();await turn();st.scenes=[];first.resolve({inputSettings:{looping:false}});await p;assert.equal(o.renders,0);
});
await test('Disconnect blocks commit and rerun',async()=>{
  const {context:c,observations:o}=harness(fresh),first=defer();o.pauses.push(first);const p=c.syncItems();await turn();c.syncItems();c.st.on=false;first.resolve({inputSettings:{looping:false}});await p;assert.equal(o.renders,0);assert.equal(o.queries.filter(q=>q.data.sceneName==='A').length,1);
});
await test('Page teardown blocks commit and coalesced new work',async()=>{
  const {context:c,observations:o}=harness(fresh),first=defer();o.pauses.push(first);const p=c.syncItems();await turn();c.syncItems();c.mesaDisposed=true;first.resolve({inputSettings:{looping:false}});await p;assert.equal(o.renders,0);assert.equal(o.queries.filter(q=>q.data.sceneName==='A').length,1);
});
await test('Read error releases shared task for later explicit refresh',async()=>{
  const {context:c,observations:o}=harness(fresh);o.fault=true;await assert.rejects(c.syncItems(),/Own read error/);o.fault=false;await c.syncItems();assert.equal(o.renders,1);
});
await test('GC discovery works on own snapshot and commits together',async()=>{
  const {context:c,observations:o,st}=harness(fresh);o.sources=[{sourceName:'OwnTitle',inputKind:'browser_source'}];o.settings={url:'own_gc'};await c.syncItems();assert.equal(st.gcNames.has('OwnTitle'),true);assert.equal(st.items.get('A')[0].name,'OwnTitle');
});
await test('Delayed GC cannot partially mutate items before completion',async()=>{
  const {context:c,observations:o,st}=harness(fresh),pause=defer();o.sources=[{sourceName:'OwnTitle',inputKind:'browser_source'}];o.pauses.push(pause);const original=st.items,p=c.syncItems();await turn();assert.equal(st.items,original);st.preset='Changed';pause.resolve({inputSettings:{url:'own_gc'}});await p;assert.equal(st.items,original);assert.equal(st.gcNames.size,0);
});
await test('All refresh requests remain GET-only, never touch take/outputs/audio',async()=>{
  const {context:c,observations:o}=harness(fresh);await c.syncItems();assert(o.queries.every(q=>q.type.startsWith('Get')));assert.equal(o.commands.length,0);assert.equal(o.active.length,0);
});
await test('Baseline Preview uses name despite capturing UUID',async()=>{
  const {context:c,observations:o}=harness(old,false);await c.choosePreview('A');assert.equal(c.getIntent().key,'uuid-A');assert.equal(o.commands[0].data.sceneName,'A');assert.equal(o.commands[0].data.sceneUuid,undefined);
});
await test('Draft Preview sends UUID and excludes name fallback',async()=>{
  const {context:c,observations:o}=harness(fresh);await c.choosePreview('A');assert.equal(o.commands[0].data.sceneUuid,'uuid-A');assert.equal(o.commands[0].data.sceneName,undefined);
});
await test('Unknown UUID or removed scene refuses Preview without dispatch',async()=>{
  const {context:c,observations:o,st}=harness(fresh);delete st.sceneKeys.A;await assert.rejects(c.choosePreview('A'),/não identificada/);st.sceneKeys.A='uuid-A';st.scenes=[];await assert.rejects(c.choosePreview('A'),/não identificada/);assert.equal(o.commands.length,0);
});
await test('Pending Cut blocks Preview without changing intent',async()=>{
  const {context:c,observations:o}=harness(fresh);c.setPending({id:'OwnPending'});await assert.rejects(c.choosePreview('A'),/Aguarde confirmar/);assert.equal(c.getIntent(),null);assert.equal(o.commands.length,0);
});
await test('Non-studio active route receives UUID and preserves production guard',async()=>{
  const {context:c,observations:o,st}=harness(fresh);st.studio=false;await c.choosePreview('A');assert.equal(o.active[0].action,'active');assert.equal(o.active[0].data.input,'uuid-A');assert.equal(o.commands.length,0);
});
await test('Old rejection after new Preview cannot restore old intent',async()=>{
  const {context:c,st}=harness(fresh),a=defer();st.scenes.push('B');st.sceneKeys.B='uuid-B';let call=0;c.req=async()=>++call===1?a.promise:{};
  const p=c.choosePreview('A');await c.choosePreview('B');a.reject(Error('Own rejection'));await assert.rejects(p);assert.equal(c.getIntent().key,'uuid-B');
});
await test('Uncertain Preview outcome retains target without retry',async()=>{
  const {context:c,observations:o}=harness(fresh);c.req=async(type,data)=>{o.commands.push({type,data});throw Object.assign(Error('Own timeout'),{uncertain:true});};await assert.rejects(c.choosePreview('A'));assert.equal(c.getIntent().key,'uuid-A');assert.equal(o.commands.length,1);
});
await test('Cut/operation reconciliation/WS deadline and render helpers byte-identical',()=>{
  for(const name of ['productionAction','checkOperationalPending','releaseOperationalPending','reconcileOperation','renderTiles','paintTileState'])assert.equal(fn(fresh,name),fn(old,name),name);
  const requestSection=t=>t.slice(t.indexOf('  const req = (type, data)'),t.indexOf('  const tryReq = (type, data)'));
  assert.equal(requestSection(fresh),requestSection(old));
});
await test('Every canonical reference pin and draft SHA unchanged',()=>{
  const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');for(const p of pin.readOnlyReferencePins)assert.equal(hash(path.join(root,p.path)),p.sha256);assert.equal(hash(path.join(qa,'draft',pin.target)),pin.draftSha256);
});

function snapshot(st){return Object.fromEntries(['items','loop','iso','fixed','gcNames','pl','rp'].map(k=>[k,st[k]]));}
function retained(st,before){for(const [key,value] of Object.entries(before))assert.equal(st[key],value,key);}
await test('R2 reconnection bug reproduced: swallowed failed old GET commits false Loop on new same-ID socket',async()=>{
  const r2=fs.readFileSync(path.join(qa,'../draft',pin.target),'utf8');
  const {context:c,observations:o,st}=harness(r2),pending=defer();await c.syncItems();
  o.pauses.push(pending);const p=c.syncItems();await turn();c.st.on=false;c.ws={ownConnection:2};c.st.on=true;
  pending.resolve(null);await p;assert.equal(st.loop.get('A-media'),false);assert.equal(o.renders,2);
});
await test('R3 rejects delayed old socket response after disconnect/reconnect with identical scope and UUID',async()=>{
  const {context:c,observations:o,st}=harness(fresh),pending=defer();await c.syncItems();const before=snapshot(st),renders=o.renders;
  o.pauses.push(pending);const p=c.syncItems();await turn();const count=o.queries.length;
  c.st.on=false;c.ws={ownConnection:2};c.st.on=true;assert.equal(c.syncItems(),p);
  pending.resolve(null);await p;retained(st,before);assert.equal(o.renders,renders);assert.equal(o.queries.length,count);
  await c.syncItems();assert.equal(o.renders,renders+1);assert.equal(st.loop.get('A-media'),true);
});
await test('Connection identity checked before each subsequent scene GET; new socket receives no obsolete follow-up',async()=>{
  const {context:c,observations:o,st}=harness(fresh),pending=defer();st.scenes.push('B');st.sceneKeys.B='uuid-B';
  o.reply=(type,data)=>type==='GetSceneItemList'&&data.sceneName==='A'?pending.promise:undefined;
  const p=c.syncItems();await turn();c.ws={ownConnection:2};pending.resolve({sceneItems:[]});await p;
  assert.equal(o.queries.length,1);assert.equal(o.renders,0);assert.equal(st.items.size,0);
});
await test('Connection change during final GC settings blocks both commit and trailing GC reads',async()=>{
  const {context:c,observations:o,st}=harness(fresh),pending=defer();await c.syncItems();const before=snapshot(st),renders=o.renders;
  o.sources=[{sourceName:'OwnTitle1',inputKind:'browser_source'},{sourceName:'OwnTitle2',inputKind:'browser_source'}];
  o.reply=(type,data)=>type==='GetInputSettings'&&data.inputName==='OwnTitle1'?pending.promise:undefined;
  const p=c.syncItems();await turn();const count=o.queries.length;c.ws={ownConnection:2};pending.resolve({inputSettings:{url:'own_gc'}});await p;
  retained(st,before);assert.equal(o.renders,renders);assert.equal(o.queries.length,count);
  o.reply=null;o.settings={url:'own_gc'};await c.syncItems();assert.equal(st.gcNames.size,2);
});
for(const [label,type,response] of [
  ['null scene list','GetSceneItemList',null],['missing scene list','GetSceneItemList',{}],['non-array scene list','GetSceneItemList',{sceneItems:{}}],
  ['null input settings','GetInputSettings',null],['missing input settings','GetInputSettings',{}],
  ['null settings object','GetInputSettings',{inputSettings:null}],['array settings object','GetInputSettings',{inputSettings:[]}],
  ['primitive settings object','GetInputSettings',{inputSettings:'invalid'}]
])await test('Failed required GET retains complete prior snapshot: '+label,async()=>{
  const {context:c,observations:o,st}=harness(fresh);await c.syncItems();const before=snapshot(st),renders=o.renders;
  o.reply=(t,data)=>t===type&&data.sceneName!=='OwnBus'?response:undefined;
  await assert.rejects(c.syncItems(),/último estado foi preservado/);retained(st,before);assert.equal(o.renders,renders);
  o.reply=null;await c.syncItems();assert.equal(o.renders,renders+1);
});
await test('Later required scene failure cannot publish earlier scene partial data',async()=>{
  const {context:c,observations:o,st}=harness(fresh);st.scenes.push('B');st.sceneKeys.B='uuid-B';await c.syncItems();const before=snapshot(st),renders=o.renders;
  o.sources=[{sourceName:'Replacement',inputKind:'ffmpeg_source'}];o.reply=(type,data)=>type==='GetSceneItemList'&&data.sceneName==='B'?null:undefined;
  await assert.rejects(c.syncItems(),/último estado foi preservado/);retained(st,before);assert.equal(o.renders,renders);
});
await test('Missing required title settings retains prior GC discovery and items',async()=>{
  const {context:c,observations:o,st}=harness(fresh);o.sources=[{sourceName:'OwnTitle',inputKind:'browser_source'}];o.settings={url:'own_gc'};
  await c.syncItems();const before=snapshot(st),renders=o.renders;o.reply=type=>type==='GetInputSettings'?null:undefined;
  await assert.rejects(c.syncItems(),/último estado foi preservado/);retained(st,before);assert.equal(o.renders,renders);assert.equal(st.gcNames.has('OwnTitle'),true);
});
await test('Disabled private bus may be absent; enabled bus failed GET preserves snapshot',async()=>{
  const {context:c,observations:o,st}=harness(fresh);o.reply=(type,data)=>type==='GetSceneItemList'&&data.sceneName==='OwnBus'?null:undefined;
  await c.syncItems();assert.equal(o.renders,1);st.busOn=true;const before=snapshot(st);
  await assert.rejects(c.syncItems(),/último estado foi preservado/);retained(st,before);assert.equal(o.renders,1);
});
await test('Bus mode switch while awaiting settings invalidates snapshot without dispatching follow-up',async()=>{
  const {context:c,observations:o,st}=harness(fresh),pending=defer();await c.syncItems();const before=snapshot(st),renders=o.renders;
  o.pauses.push(pending);const p=c.syncItems();await turn();const count=o.queries.length;st.busOn=true;
  pending.resolve({inputSettings:{looping:false}});await p;retained(st,before);assert.equal(o.renders,renders);assert.equal(o.queries.length,count);
});
await test('Disposed or disconnected explicit read dispatches no GET and never mutates',async()=>{
  for(const field of ['on','disposed']){const {context:c,observations:o,st}=harness(fresh);const before=snapshot(st);if(field==='on')st.on=false;else c.mesaDisposed=true;
    await c.syncItems();assert.equal(o.queries.length,0);assert.equal(o.renders,0);retained(st,before);}
});
await test('R2 freeze and all original helpers remain exact; R3 adds only snapshot reader guards',()=>{
  const r2=fs.readFileSync(path.join(qa,'../draft',pin.target),'utf8');
  const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
  assert.equal(sha(fs.readFileSync(path.join(qa,'../ALLOWLIST-R2.json'))),pin.priorR2AllowlistSha256);
  assert.equal(sha(fs.readFileSync(path.join(qa,'../draft',pin.target))),pin.priorR2DraftSha256);
  for(const name of ['choosePreview','productionAction','checkOperationalPending','releaseOperationalPending','reconcileOperation','renderTiles','paintTileState'])assert.equal(fn(fresh,name),fn(r2,name),name);
  const requestSection=t=>t.slice(t.indexOf('  const req = (type, data)'),t.indexOf('  const tryReq = (type, data)'));
  assert.equal(requestSection(fresh),requestSection(r2));
});


await test('R3 timeout hole reproduced: unknown ISO filter read paints previously recording scene stopped',async()=>{
 const text=fs.readFileSync(path.join(qa,'../r3/draft',pin.target),'utf8'),{context:c,observations:o,st}=harness(text);st.hasIso=true;
 o.reply=type=>type==='GetSourceFilter'?{filterEnabled:true,filterSettings:{record_mode:1}}:undefined;await c.syncItems();assert.equal(st.iso.get('A'),true);
 o.reply=type=>type==='GetSourceFilter'?null:undefined;await c.syncItems();assert.equal(st.iso.get('A'),false);
});
const recordingFilter={filterName:'OwnISO',filterEnabled:true,filterSettings:{record_mode:1}};
for(const [label,response] of [['timeout null',null],['missing filters',{}],['non-array filters',{filters:{}}],
 ['malformed entry',{filters:[{}]}],['missing ISO settings',{filters:[{filterName:'OwnISO',filterEnabled:true}]}],
 ['non-boolean enabled',{filters:[{...recordingFilter,filterEnabled:'true'}]}],['array ISO settings',{filters:[{...recordingFilter,filterSettings:[]}]}]])
 await test('Unknown required filter list retains recording and complete snapshot: '+label,async()=>{
  const {context:c,observations:o,st}=harness(fresh);st.hasIso=true;o.reply=type=>type==='GetSourceFilterList'?{filters:[recordingFilter]}:undefined;
  await c.syncItems();assert.equal(st.iso.get('A'),true);const before=snapshot(st),renders=o.renders;
  o.reply=type=>type==='GetSourceFilterList'?response:undefined;await assert.rejects(c.syncItems(),/último estado foi preservado/);
  retained(st,before);assert.equal(st.iso.get('A'),true);assert.equal(o.renders,renders);
  o.reply=type=>type==='GetSourceFilterList'?{filters:[recordingFilter]}:undefined;await c.syncItems();assert.equal(o.renders,renders+1);
 });
await test('Known empty filter list confirms ISO absent without additional GET',async()=>{
 const {context:c,observations:o,st}=harness(fresh);st.hasIso=true;await c.syncItems();assert.equal(st.iso.get('A'),false);
 assert.equal(o.queries.filter(q=>q.type==='GetSourceFilterList').length,1);assert.equal(o.queries.filter(q=>q.type==='GetSourceFilter').length,0);
});
for(const [mode,enabled,expected] of [[1,true,true],[0,true,false],[2,true,false],[1,false,false]])
 await test('Valid ISO record_mode '+mode+' enabled '+enabled+' retains existing recording semantics',async()=>{
  const {context:c,observations:o,st}=harness(fresh);st.hasIso=true;
  o.reply=type=>type==='GetSourceFilterList'?{filters:[{...recordingFilter,filterEnabled:enabled,filterSettings:{record_mode:mode}}]}:undefined;
  await c.syncItems();assert.equal(st.iso.get('A'),expected);assert.equal(o.queries.filter(q=>q.type==='GetSourceFilterList').length,1);
 });
await test('ISO capability change during delayed filter GET invalidates snapshot and follow-up',async()=>{
 const {context:c,observations:o,st}=harness(fresh),pending=defer();await c.syncItems();const before=snapshot(st),renders=o.renders;
 st.hasIso=true;o.reply=type=>type==='GetSourceFilterList'?pending.promise:undefined;const p=c.syncItems();await turn();const count=o.queries.length;
 st.hasIso=false;pending.resolve({filters:[recordingFilter]});await p;retained(st,before);assert.equal(o.renders,renders);assert.equal(o.queries.length,count);
});
await test('R3 complete freeze retained; R4 changes only ISO snapshot read/capability validation',()=>{
 const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),text=fs.readFileSync(path.join(qa,'../r3/draft',pin.target),'utf8');
 assert.equal(sha(fs.readFileSync(path.join(qa,'../r3/ALLOWLIST.json'))),pin.priorR3AllowlistSha256);
 assert.equal(sha(fs.readFileSync(path.join(qa,'../r3/draft',pin.target))),pin.priorR3DraftSha256);
 for(const name of ['syncItems','syncGcNames','choosePreview','productionAction','checkOperationalPending','releaseOperationalPending','reconcileOperation','renderTiles','paintTileState'])assert.equal(fn(fresh,name),fn(text,name),name);
});

const result={status:'PASS',checks:results.length,results,proof:'ACTUAL_JS_FUNCTIONS_IN_OWN_VM_WITH_SYNTHETIC_STATE',nativeExecuted:false,apiExecuted:false,canonicalModified:false,
  limits:['No real browser/pointer timing or Native responsiveness measurement','Read-only coalescing continues existing awaited WS reads; it does not cancel Native work','Sources/reconnect/project events still require authoritative state; this is not proof that reported freezes were caused by this race']};
fs.writeFileSync(path.join(qa,'RESULT.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({status:'PASS',checks:results.length}));
