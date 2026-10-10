import fs from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),source=path.join(root,'FreeMix/painel/mesa.html');
const html=await fs.readFile(source,'utf8');
const start=html.indexOf('  function visibleThumbnailNames()'),end=html.indexOf('  async function slowLoop()',start);
assert(start>0&&end>start);
const chunk=html.slice(start,end),checks=[];
let now=0,change=null,requests=[];
const rect=(left=0,top=0,width=100,height=60)=>({left,top,width,height,right:left+width,bottom:top+height});
const names=['Program','Preview','Cold A','Cold B','Minimized','Offscreen','Clipped'];
const images=names.map((name,i)=>({dataset:{t:name},isConnected:true,getBoundingClientRect:()=>rect(i*110,100)}));
const box={getBoundingClientRect:()=>rect(0,80,800,300),querySelectorAll:()=>images};
images.find(i=>i.dataset.t==='Offscreen').getBoundingClientRect=()=>rect(300,1000);
images.find(i=>i.dataset.t==='Clipped').getBoundingClientRect=()=>rect(300,500);
const st={on:true,paused:false,scenes:names,program:'Program',preview:'Preview',minimized:{Minimized:true}};
const document={hidden:false,querySelector:s=>images.find(i=>s.includes(i.dataset.t))};
const stop=Error('END_OWN_SIMULATION');
const ctx=vm.createContext({st,document,innerWidth:1000,innerHeight:800,$:()=>box,performance:{now:()=>now},thumbs:new Map(),CSS:{escape:n=>n},
  sleep:async ms=>{now+=ms;if(now>=10000)throw stop;},tryReq:async(type,data)=>{assert.equal(type,'GetSourceScreenshot');requests.push({name:data.sourceName,at:now});if(change)change(data);return {imageData:'data:image/jpeg;base64,OWN_SYNTHETIC'};}});
vm.runInContext(chunk,ctx);
const pass=(name,test)=>{test();checks.push({name,status:'PASS'});};
const visible=()=>Array.from(ctx.visibleThumbnailNames());
pass('Only actually rendered images inside tiles and viewport are eligible',()=>assert.deepEqual(visible(),['Program','Preview','Cold A','Cold B']));
for(const [name,set,reset]of[
 ['Disconnected',()=>st.on=false,()=>st.on=true],['Paused',()=>st.paused=true,()=>st.paused=false],['Hidden document',()=>document.hidden=true,()=>document.hidden=false],
 ['Popup with hidden tiles',()=>box.getBoundingClientRect=()=>rect(0,0,0,0),()=>box.getBoundingClientRect=()=>rect(0,80,800,300)]
])pass(name+' requests no screenshot',()=>{set();assert.deepEqual(visible(),[]);reset();});
pass('Detached or removed source is ineligible',()=>{const img=images[0];img.isConnected=false;assert(!visible().includes('Program'));img.isConnected=true;st.scenes=names.slice(1);assert(!visible().includes('Program'));st.scenes=names;});
await ctx.thumbLoop().catch(e=>{assert.equal(e,stop);});
pass('Ten-second budget is bounded below eight requests per second',()=>assert(requests.length<=80));
pass('Minimized, offscreen and clipped sources receive zero requests',()=>assert(requests.every(r=>!['Minimized','Offscreen','Clipped'].includes(r.name))));
pass('Preview and Program retain independent refresh; other visible inputs receive fair rotation',()=>{for(const name of ['Program','Preview','Cold A','Cold B'])assert(requests.some(r=>r.name===name));for(const name of ['Program','Preview']){const own=requests.filter(r=>r.name===name);for(let i=1;i<own.length;i++)assert(own[i].at-own[i-1].at>=350);}});
const tenSecondRequests=requests.length;
now=0;requests=[];
for(const img of images)delete img.src;
change=()=>{st.minimized.Preview=true;st.minimized['Cold A']=true;st.minimized.Program=true;};
await ctx.thumbLoop().catch(e=>{assert.equal(e,stop);});
pass('Minimize during an awaited screenshot cancels the remaining affected batch',()=>assert(!requests.some(r=>['Preview','Cold A'].includes(r.name))));
pass('Old capture result does not repaint a newly minimized image',()=>assert.notEqual(images[0].src,'data:image/jpeg;base64,OWN_SYNTHETIC'));
const receipt={status:'PASS_THUMBNAIL_SCHEDULER_ACTUAL_SOURCE_SIMULATED_CLOCK_DOM',source:'FreeMix/painel/mesa.html',sha256:createHash('sha256').update(html).digest('hex'),at:new Date().toISOString(),checks,tenSecondRequests,
 limits:['Actual product functions extracted unchanged; request transport, clock and DOM geometry are controlled fixtures','This measures screenshot request budget, not GPU time, desktop frame rate or operator latency','No operator Native, API or port accessed; selected 060000 payload unchanged']};
await fs.writeFile(path.join(import.meta.dirname,'thumbnail-budget-root-result.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(receipt));
