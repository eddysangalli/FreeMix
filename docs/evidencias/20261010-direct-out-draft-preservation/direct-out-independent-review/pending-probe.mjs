import assert from 'node:assert/strict';import vm from 'node:vm';import{readFile,writeFile}from'node:fs/promises';
const source=await readFile(new URL('./LATEST-DRAFT.js',import.meta.url),'utf8');let passed=0;const checks=[];async function test(name,f){await f();passed++;checks.push(name);}
class Element{
 constructor(tag='input'){this.tagName=tag.toUpperCase();this.children=[];this.options=[];this.events={};this._value='';this.checked=false;this.disabled=false;this.textContent='';this.dataset={};}
 set value(v){this._value=String(v??'');}get value(){return this._value;}
 replaceChildren(...children){this.children=children;this.options=[];if(this.tagName==='SELECT')this.value='';}add(o){this.options.push(o);if(this.options.length===1)this.value=o.value;}
 append(...children){this.children.push(...children);}addEventListener(name,f){(this.events[name]??=[]).push(f);}querySelectorAll(){return [];}
 insertAdjacentElement(_,node){this.registry[node.id]=node;}
}
function fixture(){
 const nodes={};const E=id=>nodes[id]??=Object.assign(new Element(['bus-select','direct-source','direct-device','asio-device','asio-output-driver'].includes(id)?'select':'input'),{registry:nodes});
 E('connection').textContent='Motor conectado';let calls=[],polls=0,hold=null,fail=false,onPoll=null;
 const state={scope:'own-scope-a',routing:{buses:[],sources:[{key:'own-a',name:'Own A'},{key:'own-b',name:'Own B'}],directOut:[{key:'own-a',device:'own-x',volume:80,delayMs:0,enabled:true},{key:'own-b',device:'own-x',volume:60,delayMs:50,enabled:false}],capabilities:{independentBuses:true,directOut:true,renderInventoryKnown:true,renderDevices:[{id:'own-x',name:'Own X'},{id:'own-y',name:'Own Y'}],asio:true,asioInventoryKnown:true,asioDrivers:[]},asioOutput:null}};
 const context={state,E,busy:false,render(){},Option:class extends Element{constructor(text,value){super('option');this.text=text;this.value=value;}},document:{createElement:tag=>Object.assign(new Element(tag),{registry:nodes}),createTextNode:text=>({textContent:text})},poll:async()=>{polls++;onPoll?.();context.renderRouting();},fetch:async(url,request)=>{assert.equal(url,'/api/control');const data=JSON.parse(request.body);calls.push(data);if(hold)await hold.promise;return{ok:!fail,json:async()=>({success:!fail,error:fail?'Own refusal':null})};}};
 vm.createContext(context);vm.runInContext(source,context);context.renderRouting();
 return{context,nodes,E,get calls(){return calls;},get polls(){return polls;},draft:()=>vm.runInContext('directDraft',context),edit(values){for(const[k,v]of Object.entries(values)){const id={device:'direct-device',volume:'direct-volume',delayMs:'direct-delay',enabled:'direct-enabled'}[k];if(k==='enabled')E(id).checked=v;else E(id).value=v;}context.directChanged();},poll:()=>context.poll(),fail(v){fail=v;},hold(){let release;const promise=new Promise(resolve=>release=resolve);hold={promise};return release;},onPoll(f){onPoll=f;},event(id,name){for(const fn of E(id).events[name]||[])fn();}};
}
const f=fixture(); f.edit({enabled:false}); const release=f.hold(); const pending=f.context.directApply(); await Promise.resolve(); const during={busy:f.context.busy,saveDisabled:f.E('direct-save').disabled,discardDisabled:f.E('direct-discard').disabled,calls:f.calls.length}; release(); await pending; console.log(JSON.stringify(during));