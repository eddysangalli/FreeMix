import vm from 'node:vm';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {fixture} from './mock-server.mjs';
const source=await fs.readFile(new URL('../draft/calls.js',import.meta.url),'utf8');
const rapidSource=await fs.readFile(new URL('../draft/talkback-rapido.js',import.meta.url),'utf8');
const checks=[];
const tick=()=>new Promise(resolve=>setImmediate(resolve));
class Element {
 constructor(id='',tag='DIV'){this.id=id;this.tagName=tag;this.listeners={};this.dataset={};this.children=[];this.options=[];this.value='';this.disabled=false;this.checked=false;this.hidden=false;this.open=false;this.textContent='';this.attributes={};const classes=new Set();this.classList={add:(...xs)=>xs.forEach(x=>classes.add(x)),remove:(...xs)=>xs.forEach(x=>classes.delete(x)),toggle:(x,on)=>{on?classes.add(x):classes.delete(x);},contains:x=>classes.has(x)};}
 addEventListener(name,fn){(this.listeners[name]??=[]).push(fn);}
 emit(name,fields={}){const e={target:this,button:0,pointerId:1,key:'',code:'',preventDefault(){},...fields};this['on'+name]?.(e);for(const fn of this.listeners[name]||[])fn(e);}
 setAttribute(k,v){this.attributes[k]=v;}
 setPointerCapture(){}
 contains(){return false;}
 focus(){}
 querySelectorAll(selector){return selector==='[data-target]'?this.children:[];}
 set innerHTML(value){this.html=value;this.children=[];for(const match of value.matchAll(/<input type="checkbox" data-target="([^"]+)"([^>]*)>/g)){const child=new Element('','INPUT');child.dataset.target=match[1];child.checked=match[2].includes('checked');this.children.push(child);}this.options=[...value.matchAll(/<option value="([^"]+)"/g)].map(x=>({value:x[1]}));}
 get innerHTML(){return this.html||'';}
}
function harness({rapid=false,state=fixture()}={}){
 const nodes=new Map(),events=[],intervals=new Map();let timer=0,pendingStart=null,pendingSave=null,failSelection=false,pingFailure=false,starts=0;
 const el=id=>{if(!nodes.has(id))nodes.set(id,new Element(id,id==='talk'||id==='talk-hold'?'BUTTON':'DIV'));return nodes.get(id);};
 const document=new Element('document');document.getElementById=el;document.activeElement=new Element('body','BODY');document.hidden=false;
 const window=new Element('window');window.FreeMixRemote={getState:()=>state};window.MESA_LOCAL={replayUrl:'http://127.0.0.1:1/api/replay'};
 let delayed=false,saveDelayed=false;
 async function fetchMock(url,options){
  if(!options?.body)return {ok:true,json:async()=>state};
  const data=JSON.parse(options.body);events.push(data);
  if(data.action==='call_rapid_targets'){const finish=()=>{if(failSelection)return {ok:false,json:async()=>({success:false,error:'QA save failure'})};state.calls.rapidTargets=data.targets;return {ok:true,json:async()=>({success:true})};};if(saveDelayed)return new Promise(resolve=>{pendingSave=()=>resolve(finish());});return finish();}
  if(data.action==='call_talk_start'){starts++;state.calls.talking=true;const result={ok:true,json:async()=>({success:true,call:{lease:'own-lease-'+starts}})};if(delayed)return new Promise(resolve=>{pendingStart=()=>resolve(result);});return result;}
  if(data.action==='call_talk_stop')state.calls.talking=false;
  if(data.action==='call_talk_ping'&&pingFailure)return {ok:false,json:async()=>({success:false,error:'QA expired lease'})};
  return {ok:true,json:async()=>({success:true})};
 }
 vm.runInNewContext(rapid?rapidSource:source,{window,document,location:{search:'?mode=clocks'},URLSearchParams,URL,AbortSignal,fetch:fetchMock,navigator:{clipboard:{writeText:async()=>{}}},setInterval:(fn,ms)=>{intervals.set(++timer,{fn,ms});return timer;},clearInterval:id=>intervals.delete(id),Date,Set,Error,console});
 return {el,state,window,document,events,intervals,refresh:async()=>{for(const t of [...intervals.values()])if(t.ms===(rapid?1000:500))await t.fn();await tick();},pulse:async()=>{for(const t of [...intervals.values()])if(t.ms===350)await t.fn();await tick();},delay:()=>{delayed=true;},delaySave:()=>{saveDelayed=true;},resolveSave:async()=>{assert.ok(pendingSave);pendingSave();await tick();await tick();},resolve:async()=>{assert.ok(pendingStart);pendingStart();await tick();await tick();},failSave:()=>{failSelection=true;},failPing:()=>{pingFailure=true;},commands:action=>events.filter(e=>e.action===action)};
}
async function test(name,fn){await fn();checks.push({name,pass:true});}
await test('opening and polling state never writes',async()=>{const h=harness();await h.refresh();await h.refresh();assert.equal(h.events.length,0);assert.match(h.el('talk-targets').textContent,/Ana/);assert.equal(h.el('talk').disabled,false);});
await test('user checkbox auto-saves canonical selection once',async()=>{const h=harness(),input=h.el('targets').children.find(x=>x.dataset.target==='guest-b');input.checked=true;h.el('targets').emit('change',{target:input});await tick();assert.deepEqual(h.state.calls.rapidTargets,['guest-a','guest-b']);assert.equal(h.commands('call_rapid_targets').length,1);assert.match(h.el('selection-status').textContent,/salva/);});
await test('failure restores selection and reports error without talk start',async()=>{const h=harness();h.failSave();const input=h.el('targets').children.find(x=>x.dataset.target==='guest-b');input.checked=true;h.el('targets').emit('change',{target:input});assert.equal(h.el('talk').disabled,true);await tick();assert.match(h.el('selection-status').textContent,/restaurada/);assert.equal(h.el('targets').children.find(x=>x.dataset.target==='guest-b').checked,false);assert.equal(h.commands('call_talk_start').length,0);});
await test('external Mesa selection synchronizes without save',async()=>{const h=harness();h.state.calls.rapidTargets=['guest-c'];await h.refresh();assert.match(h.el('talk-targets').textContent,/Carla/);assert.doesNotMatch(h.el('talk-targets').textContent,/Ana/);assert.equal(h.events.length,0);});
await test('null includes future Calls, empty selection blocks',async()=>{const h=harness();h.state.calls.rapidTargets=null;h.state.calls.guests.push({key:'guest-d',name:'Dora'});await h.refresh();assert.match(h.el('talk-targets').textContent,/Dora/);assert.equal(h.el('talk').disabled,true);h.state.calls.rapidTargets=[];await h.refresh();assert.equal(h.el('talk').disabled,true);assert.match(h.el('talk-status').textContent,/Selecione/);});
for(const [name,mutate,pattern] of [
 ['disconnected',h=>h.state.connected=false,/Sem conexão/],
 ['missing microphone',h=>h.state.calls.director=null,/microfone/],
 ['missing Native watchdog',h=>h.state.calls.nativeWatchdog=false,/motor/],
 ['shared B is never claimed selective',h=>h.state.calls.capability='shared-return-B',/individuais/],
 ['return not publishing',h=>h.state.calls.returns[0].publisher='offline',/Aguardando/],
 ['removed selected guest',h=>h.state.calls.guests.shift(),/removido/],
 ['other console talking',h=>h.state.calls.talking=true,/outro controle/]
])await test(name+' disables hold',async()=>{const h=harness();mutate(h);await h.refresh();assert.equal(h.el('talk').disabled,true);assert.match(h.el('talk-status').textContent,pattern);h.el('talk').emit('pointerdown');await tick();assert.equal(h.commands('call_talk_start').length,0);});
await test('mouse hold selects only Ana and pointer release stops exact lease',async()=>{const h=harness();h.el('talk').emit('pointerdown');await tick();assert.equal(h.el('talk').attributes['aria-pressed'],'true');assert.deepEqual(h.commands('call_talk_start')[0].targets,['guest-a']);await h.pulse();assert.equal(h.commands('call_talk_ping').length,1);h.el('talk').emit('pointerup');await tick();assert.equal(h.commands('call_talk_stop')[0].lease,'own-lease-1');assert.equal(h.el('talk').attributes['aria-pressed'],'false');});
for(const event of ['pointercancel','lostpointercapture'])await test(event+' releases lease',async()=>{const h=harness();h.el('talk').emit('pointerdown');await tick();h.el('talk').emit(event);await tick();assert.equal(h.commands('call_talk_stop').length,1);});
for(const key of [' ','Enter'])await test('keyboard '+(key===' '?'Space':key)+' hold/repeat/release',async()=>{const h=harness();h.el('talk').emit('keydown',{key});h.el('talk').emit('keydown',{key,repeat:true});await tick();assert.equal(h.commands('call_talk_start').length,1);h.el('talk').emit('keyup',{key});await tick();assert.equal(h.commands('call_talk_stop').length,1);});
for(const event of ['blur','pagehide','visibilitychange'])await test(event+' releases lease',async()=>{const h=harness();h.el('talk').emit('pointerdown');await tick();if(event==='visibilitychange'){h.document.hidden=true;h.document.emit(event);}else h.window.emit(event);await tick();assert.equal(h.commands('call_talk_stop').length,1);});
await test('Ctrl Space excludes editors, supports body and release',async()=>{const h=harness();h.document.emit('keydown',{ctrlKey:true,code:'Space',target:new Element('','INPUT')});await tick();assert.equal(h.commands('call_talk_start').length,0);h.document.emit('keydown',{ctrlKey:true,code:'Space',target:h.document.activeElement});await tick();assert.equal(h.commands('call_talk_start').length,1);h.document.emit('keyup',{code:'Space'});await tick();assert.equal(h.commands('call_talk_stop').length,1);});
await test('release while start pending closes returned lease, duplicate starts blocked',async()=>{const h=harness();h.delay();h.el('talk').emit('pointerdown');h.el('talk').emit('pointerdown');h.el('talk').emit('pointerup');await h.resolve();assert.equal(h.commands('call_talk_start').length,1);assert.equal(h.commands('call_talk_stop').length,1);assert.equal(h.commands('call_talk_stop')[0].lease,'own-lease-1');assert.equal(h.el('talk').attributes['aria-pressed'],'false');assert.equal([...h.intervals.values()].filter(t=>t.ms===350).length,0);});
await test('lease heartbeat failure closes mic and reports error',async()=>{const h=harness();h.el('talk').emit('pointerdown');await tick();h.failPing();await h.pulse();assert.equal(h.commands('call_talk_stop').length,1);assert.match(h.el('message').textContent,/expired/);});
await test('health loss while holding closes own mic',async()=>{const h=harness();h.el('talk').emit('pointerdown');await tick();h.state.connected=false;await h.refresh();assert.equal(h.commands('call_talk_stop').length,1);});
await test('guest audio custom selector hides director and self sources',async()=>{const h=harness(),html=h.el('guests').innerHTML;assert.doesNotMatch(html,/data-sources value="director"/);assert.match(html,/data-custom hidden/);const first=html.split('</article>')[0];assert.doesNotMatch(first,/data-sources value="guest-a"/);assert.match(first,/data-sources value="own-music"/);});
await test('scope change during start cancels late lease',async()=>{const h=harness();h.delay();h.el('talk').emit('pointerdown');h.state.preset='Own second project';h.state.calls.rapidTargets=['guest-c'];await h.refresh();await h.resolve();assert.equal(h.commands('call_talk_stop').length,1);assert.match(h.el('talk-targets').textContent,/Carla/);});
await test('Mesa rapid control reads canonical targets and blocks shared B',async()=>{const h=harness({rapid:true});await tick();await h.refresh();assert.equal(h.el('talk-hold').disabled,false,h.el('talk-status').textContent);h.el('talk-hold').emit('pointerdown');await tick();assert.deepEqual(h.commands('call_talk_start')[0].targets,['guest-a']);h.el('talk-hold').emit('pointerup');await tick();h.state.calls.capability='shared-return-B';await h.refresh();assert.equal(h.el('talk-hold').disabled,true);});
await test('Mesa late canceled start stops returned lease',async()=>{const h=harness({rapid:true});await tick();h.delay();h.el('talk-hold').emit('pointerdown');h.el('talk-hold').emit('pointerup');await h.resolve();assert.equal(h.commands('call_talk_stop').length,1);});
await test('selection pending blocks microphone and serializes user changes',async()=>{const h=harness();h.delaySave();const input=h.el('targets').children.find(x=>x.dataset.target==='guest-b');input.checked=true;h.el('targets').emit('change',{target:input});assert.equal(h.el('talk').disabled,true);h.el('talk').emit('pointerdown');h.el('targets').emit('change',{target:input});await tick();assert.equal(h.commands('call_talk_start').length,0);assert.equal(h.commands('call_rapid_targets').length,1);await h.resolveSave();assert.equal(h.el('talk').disabled,false);});
await test('scope switch ignores old failed selection response in UI',async()=>{const h=harness();h.delaySave();h.failSave();const input=h.el('targets').children.find(x=>x.dataset.target==='guest-b');input.checked=true;h.el('targets').emit('change',{target:input});h.state.preset='Own second project';h.state.calls.rapidTargets=['guest-c'];await h.refresh();await h.resolveSave();assert.match(h.el('talk-targets').textContent,/Carla/);assert.doesNotMatch(h.el('selection-status').textContent,/restaurada/);assert.equal(h.el('talk').disabled,false);});
await test('unchanged target poll preserves checkbox nodes and focus',async()=>{const h=harness(),first=h.el('targets').children[0];h.document.activeElement=first;await h.refresh();assert.equal(h.el('targets').children[0],first);});
await test('advanced gain and diagnostics remain collapsed by default',async()=>{const h=harness();assert.match(h.el('guests').innerHTML,/data-key="guest-a-advanced"><summary>Nível e diagnóstico avançado/);});
await test('Mesa other-console hold disables without a second start',async()=>{const h=harness({rapid:true});await tick();h.state.calls.talking=true;await h.refresh();assert.equal(h.el('talk-hold').disabled,true);h.el('talk-hold').emit('pointerdown');await tick();assert.equal(h.commands('call_talk_start').length,0);assert.match(h.el('talk-status').textContent,/outro controle/);});
await test('Mesa Native watchdog refusal is explicit',async()=>{const h=harness({rapid:true});await tick();h.state.calls.nativeWatchdog=false;await h.refresh();assert.equal(h.el('talk-hold').disabled,true);assert.match(h.el('talk-status').textContent,/motor/);});
const result={status:'PASS_DRAFT_DOM_VM_NO_NATIVE',checks:checks.length,cases:checks,limits:['Fake DOM/VM validates event handlers and state transitions, not browser layout, actual pointer capture, CEF or Native audio.','Backend persistence and PCM tested separately; no real media, hardware or operator use.']};
await fs.writeFile(new URL('./ui-vm-result.json',import.meta.url),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({status:result.status,checks:result.checks}));
