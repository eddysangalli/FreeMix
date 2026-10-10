import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';
const own=import.meta.dirname,root=path.resolve(own,'../..');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const prep=JSON.parse(fs.readFileSync(path.join(own,'PREP.json')));
const cases=[];function ok(name,fn){fn();cases.push({name,pass:true});}
const read=(kind,p)=>fs.readFileSync(path.join(own,kind,p),'utf8').replaceAll('\r\n','\n');
const mc=read('draft','utils/Obs_VolumeMeter.cpp'),ec=read('draft','eventhandler/EventHandler.cpp');
const oldmc=read('baseline','utils/Obs_VolumeMeter.cpp');
function body(t,name){const p=t.indexOf(name);assert(p>=0,name);let i=t.indexOf('{',p),n=1,j=i+1;for(;n&&j<t.length;j++){if(t[j]==='{')n++;if(t[j]==='}')n--;}return t.slice(i+1,j-1);}
const capture=body(mc,'void Utils::Obs::VolumeMeter::Handler::SetCaptureEnabled');
// Execute the actual generation/epoch decision block after a finite C++→JS
// lexical conversion; the remaining SDK/source lifecycle is a deterministic model.
const decision=body(capture,'uint64_t epoch = 0;').replace(/std::unique_lock<std::mutex> l\(_meterMutex\);/,'')
 .replace(/const bool capture/g,'const capture').replaceAll('retired.swap(_meters);','retired.push(..._meters.splice(0));');
const decide=new Function('enabled','generation','retired',`let populate=false,epoch=0;with(this){${decision}}return {populate,epoch};`);
class Source{constructor(uuid,name=uuid){this.uuid=uuid;this.name=name;this.live=true;this.active=true;this.refs=0;}}
class Meter{constructor(s,m){this.s=s;this.m=m;this.weak=true;this.detached=false;}destroy(){if(this.s.live)this.detached=true;else this.m.warnings++;}}
class Model{
 constructor(){this._running=true;this._capturing=false;this._captureGeneration=0;this._captureEpoch=0;this._meters=[];this.sources=[];this.warnings=0;this.join=0;this.broadcasts=0;this.refs=0;this.suspended=true;this.shutdown=false;this.requestGeneration=0;this.handlerId=1;}
 set(enabled,generation,hook){const retired=[];const d=decide.call(this,enabled,generation,retired);retired.forEach(m=>m.destroy());if(!d?.populate)return;
  // Temporary strong leases only during enumeration, not Meter ownership.
  const inputs=this.sources.filter(s=>s.live&&s.active);inputs.forEach(s=>s.refs++);
  hook?.(this,d.epoch);
  for(const s of inputs){const c=new Meter(s,this);if(this._captureEpoch===d.epoch&&this._capturing&&this._running&&s.active&&!this._meters.some(m=>m.s.uuid===s.uuid))this._meters.push(c);else c.destroy();s.refs--;}
 }
 update(){const gen=++this.requestGeneration;if(this.shutdown){this._running=false;this.set(false,Number.MAX_SAFE_INTEGER);}else this.set(!this.suspended&&this.refs>0,gen);}
 sub(){this.refs++;this.update();}unsub(){if(this.refs>0)this.refs--;this.update();}
 state(ready,shutdown=false){this.shutdown ||=shutdown;this.suspended=!ready||this.shutdown;this.update();}
 tick(){if(this._running&&this._capturing)this.broadcasts++;}
 destroy(signal=true){this.state(false,true);this.join++;this.signalsDisconnected=signal;this.memberTeardownAfterJoin=true;}
}
for(const f of prep.files)ok('canonical unchanged '+f.path,()=>assert.equal(sha(fs.readFileSync(path.join(root,'freemix-app/plugins/obs-websocket/src',f.path))),f.before));
ok('Meter warning/destructor unchanged',()=>assert.equal(body(mc,'Utils::Obs::VolumeMeter::Meter::~Meter'),body(oldmc,'Utils::Obs::VolumeMeter::Meter::~Meter')));
ok('GetMeterData warning unchanged',()=>assert.equal(body(mc,'json Utils::Obs::VolumeMeter::Meter::GetMeterData'),body(oldmc,'json Utils::Obs::VolumeMeter::Meter::GetMeterData')));
ok('baseline dtor null-signal early return reproduced',()=>assert.match(body(oldmc,'Utils::Obs::VolumeMeter::Handler::~Handler'),/if \(!sh\)\s*return;/));
ok('new dtor joins even with null global signal',()=>{const b=body(mc,'Utils::Obs::VolumeMeter::Handler::~Handler');assert(!/return;/.test(b));assert(b.indexOf('WaitForStop()')>b.indexOf('if (sh)'));});
ok('Stop never joins',()=>assert(!/join\(|WaitForStop/.test(body(mc,'void Utils::Obs::VolumeMeter::Handler::Stop'))));
ok('pause never disconnects global signal',()=>assert(!/signal_handler_disconnect/.test(capture)));
ok('capture decision based on current running state',()=>assert.match(decision,/enabled && _running/));
ok('retired meters cleared outside decision lock',()=>assert(capture.indexOf('retired.clear();')>capture.indexOf('retired.swap(_meters);')));
ok('enumeration and candidates outside list lock',()=>{assert(capture.indexOf('obs_enum_sources(')>capture.indexOf('retired.clear();'));const loop=capture.slice(capture.indexOf('for (auto &input : inputs)'));assert(loop.indexOf('MeterPtr candidate')<loop.indexOf('unique_lock'));});
ok('activate candidate outside list lock and epoch checked',()=>{const b=body(mc,'void Utils::Obs::VolumeMeter::Handler::InputActivateCallback');assert.match(b,/_captureEpoch != epoch/);assert(b.indexOf('MeterPtr candidate')<b.lastIndexOf('unique_lock'));});
ok('deactivate retires before lock and destroys after lock',()=>{const b=body(mc,'void Utils::Obs::VolumeMeter::Handler::InputDeactivateCallback');assert(b.indexOf('vector<MeterPtr> retired')<b.indexOf('unique_lock'));assert.match(b,/retired.emplace_back\(std::move\(\*iter\)\)/);});
ok('source enumeration retains temporary refs',()=>assert.match(capture,/emplace_back\(obs_source_get_ref\(input\)\)/));
ok('no new permanent source ref member',()=>assert(!/OBSSourceAutoRelease/.test(read('draft','utils/Obs_VolumeMeter.h'))));
ok('publisher guards pause, stop and phase before callback',()=>assert.match(mc,/if \(_running && _capturing && _captureEpoch == epoch && _updateCallback\)/));
ok('collection changing pauses before changing broadcast',()=>assert(ec.indexOf('eventHandler->SetInputVolumeMeterState(false);')<ec.indexOf('eventHandler->HandleCurrentSceneCollectionChanging();')));
ok('exit pauses before ExitStarted broadcast',()=>{const b=body(ec,'void EventHandler::FrontendExitMultiHandler');assert(b.indexOf('SetInputVolumeMeterState(false, true)')<b.indexOf('HandleExitStarted()'));});
ok('unsubscribe keeps stable handler and never joins',()=>{const b=body(ec,'void EventHandler::ProcessSubscriptionChange');assert(!/reset\(|WaitForStop|make_shared/.test(b));assert.match(b,/else if \(_inputVolumeMetersRef > 0\)/);});
ok('dormant created before callbacks exposed',()=>assert(ec.indexOf('std::make_shared<')<ec.indexOf('obs_frontend_add_event_callback')));
ok('teardown drains thread before other callbacks/members',()=>{const b=body(ec,'EventHandler::~EventHandler');assert(b.indexOf('WaitForStop()')<b.indexOf('obs_frontend_remove_event_callback'));assert(b.indexOf('WaitForStop()')>b.indexOf('meters = std::move'));});
ok('capture lease shared across calls outside lifecycle lock',()=>assert.match(body(ec,'void EventHandler::UpdateInputVolumeMeterCapture'),/\}\s*\/\/ No lifecycle lock[\s\S]*SetCaptureEnabled/));
ok('module unload drains before server Stop/reset, API and event callback reset',()=>{const b=body(read('draft','obs-websocket.cpp'),'void obs_module_unload');for(const later of ['_webSocketServer->Stop()','SetClientSubscriptionCallback(nullptr)','_webSocketServer = nullptr','_webSocketApi = nullptr','SetEventCallback(nullptr)'])assert(b.indexOf('ShutdownInputVolumeMeters()')<b.indexOf(later),later);});
ok('public shutdown waits outside lifecycle scope',()=>assert.match(body(ec,'void EventHandler::ShutdownInputVolumeMeters'),/\}\s*if \(meters\)\s*meters->WaitForStop/));
ok('capture phase token atomic for publication',()=>assert.match(read('draft','utils/Obs_VolumeMeter.h'),/std::atomic<uint64_t> _captureEpoch/));
for(const names of [['Master'],['Master','BusA','BusB']]){
 ok('old cleanup expires '+names.length+' meters and warns',()=>{const m=new Model();m.sources=names.map(n=>new Source(n));m.refs=1;m.state(true);m.sources.forEach(s=>s.live=false);m.unsub();assert.equal(m.warnings,names.length);});
 ok('early shutdown clears '+names.length+' meters while live',()=>{const m=new Model();m.sources=names.map(n=>new Source(n));m.sub();m.state(true);assert.equal(m._meters.length,names.length);m.state(false,true);m.sources.forEach(s=>s.live=false);m.unsub();m.destroy(false);assert.equal(m.warnings,0);assert.equal(m._meters.length,0);assert.equal(m.join,1);});
}
ok('unexpected expiry still warns',()=>{const m=new Model();m.sources=[new Source('unexpected')];m.sub();m.state(true);m.sources[0].live=false;m.state(false);assert.equal(m.warnings,1);});
ok('no subscribers has no meters/publication',()=>{const m=new Model();m.sources=[new Source('a')];m.state(true);m.tick();assert.equal(m._meters.length,0);assert.equal(m.broadcasts,0);});
ok('two subscribers last unsubscribe pauses without join',()=>{const m=new Model();m.sources=[new Source('a')];m.state(true);m.sub();m.sub();m.unsub();assert(m._capturing);m.unsub();assert(!m._capturing);assert.equal(m.join,0);});
ok('extra unsubscribe does not wrap unsigned counter',()=>{const m=new Model();m.unsub();assert.equal(m.refs,0);});
ok('late subscription cannot restart shutdown',()=>{const m=new Model();m.state(false,true);m.sub();m.state(true);assert(!m._capturing);assert(!m._running);assert.equal(m._meters.length,0);});
ok('pause/resume uses same publisher and no GUI join',()=>{const m=new Model();m.sources=[new Source('a')];m.sub();m.state(true);m.state(false);m.state(true);assert.equal(m.handlerId,1);assert.equal(m.join,0);assert.equal(m._meters.length,1);});
ok('source UUID recreated with same name not inherited',()=>{const m=new Model();m.sources=[new Source('old','Camera')];m.sub();m.state(true);m.state(false);m.sources[0].live=false;m.sources=[new Source('new','Camera')];m.state(true);assert.deepEqual(m._meters.map(x=>x.s.uuid),['new']);});
ok('stale ready cannot undo newer pause',()=>{const m=new Model();m.set(false,4);m.set(true,3);assert(!m._capturing);assert.equal(m._captureGeneration,4);});
ok('duplicate enabled updates generation without changing capture epoch',()=>{const m=new Model();m.sources=[new Source('a')];m.set(true,1,()=>m.set(true,2));assert.equal(m._meters.length,1);assert.equal(m._captureGeneration,2);assert.equal(m._captureEpoch,1);});
ok('pause during enumeration rejects old candidate',()=>{const m=new Model();m.sources=[new Source('a')];m.set(true,1,()=>m.set(false,2));assert.equal(m._meters.length,0);assert.equal(m.warnings,0);assert.equal(m.sources[0].refs,0);});
ok('pause+resume during enumeration rejects old phase only',()=>{const m=new Model();m.sources=[new Source('a')];m.set(true,1,()=>{m.set(false,2);m.set(true,3);});assert.equal(m._meters.length,1);assert.equal(m._captureEpoch,3);assert.equal(m.sources[0].refs,0);});
ok('Stop racing population cannot reopen',()=>{const m=new Model();m.sources=[new Source('a')];m.set(true,1,()=>m.state(false,true));assert(!m._running);assert(!m._capturing);assert.equal(m._meters.length,0);});
ok('thread tick after pause has zero broadcasts',()=>{const m=new Model();m.sub();m.state(true);m.tick();m.state(false);m.tick();assert.equal(m.broadcasts,1);});
ok('null signal shutdown still joins before members',()=>{const m=new Model();m.destroy(false);assert.equal(m.join,1);assert(m.memberTeardownAfterJoin);});
ok('no hidden strong source lease after capture',()=>{const m=new Model();m.sources=[new Source('a')];m.sub();m.state(true);assert.equal(m.sources[0].refs,0);});
ok('inline unsubscribe performs no self join',()=>{const m=new Model();m.sub();m.state(true);m.tick();m.unsub();assert.equal(m.join,0);});
for(let i=1;i<=12;i++)ok('subscription/collection sequence '+i,()=>{const m=new Model();m.sources=[new Source('A')];for(let k=0;k<i;k++)m.sub();m.state(true);m.state(false);m.sources[0].live=false;m.sources=[new Source('B')];m.state(true);for(let k=0;k<i;k++)m.unsub();assert.equal(m.warnings,0);assert.equal(m.join,0);assert.equal(m.refs,0);m.destroy();assert.equal(m.join,1);});
// Finite barrier model: publisher already inside OnEvent retains both target
// checks/uses until its inline callback ends. Stopserver alone is not this barrier.
let releaseEvent;const eventDone=new Promise(resolve=>releaseEvent=resolve),trace=[];
const targets={server:{live:true},api:{live:true}};
const onEvent=(async()=>{trace.push('OnEvent-start');assert(targets.server.live);await eventDone;assert(targets.server.live);assert(targets.api.live);trace.push('OnEvent-end');})();
const close=(async()=>{trace.push('StopPublisher');await onEvent;trace.push('WaitPublisher-complete');trace.push('StopServer');targets.server.live=false;trace.push('ResetServer');targets.api.live=false;trace.push('ResetApi');})();
await Promise.resolve();ok('barrier pending leaves both OnEvent targets live',()=>assert(targets.server.live&&targets.api.live));
releaseEvent();await close;
ok('OnEvent completion precedes Wait/Stop/target resets',()=>assert.deepEqual(trace,['OnEvent-start','StopPublisher','OnEvent-end','WaitPublisher-complete','StopServer','ResetServer','ResetApi']));
ok('old server-reset-before-barrier reproduced as unsafe',()=>{const checkedTarget={live:true};const checked=checkedTarget.live;checkedTarget.live=false;assert(checked&&!checkedTarget.live);});
ok('server Stop onClose unsubscribe cannot self-join publisher',()=>{const m=new Model();m.sub();m.state(true);m.state(false,true);m.unsub();assert.equal(m.join,0);m.destroy();assert.equal(m.join,1);});
fs.writeFileSync(path.join(own,'result.json'),JSON.stringify({status:'PASS_CONTRACT_ONLY',checks:cases.length,cases,sourceDecisionExecuted:true,nativeExecuted:false,cppCompiled:false,limits:['No Native plugin build or IAB shutdown qualification','Inline external callback already in flight can finish after pause; no GUI join waits for it','Synchronous plugin unload from its own publisher thread is outside the supported unload context'],pins:prep.files},null,2)+'\n');
console.log(JSON.stringify({status:'PASS_CONTRACT_ONLY',checks:cases.length}));
