import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import os from 'node:os';
import {spawnSync} from 'node:child_process';
const root=path.resolve('D:/DRIVE/IA/antigravity/vmixtwste'),dir=path.join(root,'qa-finalizacao/ux-inputs-unicos');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),checks=[];
const html=await fs.readFile(path.join(dir,'draft/obs-vmix/painel/mesa.html'),'utf8');
for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){if(!/\bsrc\s*=/.test(m[1]))new vm.Script(m[2]);}checks.push('Every inline script in full draft HTML parses');
const helpers=html.slice(html.indexOf('  let creatingInput = false;'),html.indexOf('  const A = {'));
const add=html.slice(html.indexOf('    add: () => { if (creatingInput)'),html.indexOf('    menu: (d) =>',html.indexOf('    add: () => { if (creatingInput)')));
const close=html.match(/    close: (.*),\r?\n/)[1];
function fixture({type='camera',n=1,native=true,fail='',defer=false,handoffError=false,launchError=false}={}){
 const calls=[],messages=[],controls=[{disabled:false,dataset:{}},{disabled:true,dataset:{}}];let release;
 const gate=new Promise(r=>release=r);const pop={querySelectorAll:()=>controls,setAttribute:(k,v)=>pop[k]=v};
 const values={'pop':pop,'add-name':{value:'QA'},'add-n':{value:String(n)},'add-f-callid':{value:'ownQA'}};
 const t={id:type,kind:'own_mock_source',...(type==='call'?{fields:[['callid']],settings:()=>({url:'own_fixture'})}:{}),...(type==='web'?{fields:[],settings:()=>({})}:{})};
 const c={calls,messages,controls,URLSearchParams,location:{protocol:native?'file:':'http:',href:native?'file:///own/painel/mesa.html?pop=add':'http://127.0.0.1:1/mesa.html?pop=add',search:'?pop=add'},window:{close:()=>calls.push(['window.close'])},st:{addType:type,pop:'add',video:{baseWidth:1920,baseHeight:1080}},TYPES:[t],$:id=>values[id],clamp:(x,a,b)=>Math.min(b,Math.max(a,x)),callIdOf:s=>s,resolveKind:s=>s,openPop:()=>{},closePop:()=>calls.push(['closePop']),toast:(m,e)=>messages.push({m,e}),launchPanel:async id=>{calls.push(['launch',id]);if(launchError)throw Error('Console unavailable');},req:async(k,d)=>{calls.push([k,d]);if(defer&&k==='CreateScene')await gate;if(k===fail)throw Error('Synthetic request failure');if(k==='CallVendorRequest')return{responseData:handoffError?{success:false,error:'Synthetic handoff refused'}:{success:true,queued:true}};return{sceneItemId:1};}};
 c.tryReq=c.req;c.run=p=>p?.catch?.(e=>c.toast(e.message,true));vm.createContext(c);
 vm.runInContext(helpers+'\nconst A={'+add+' close:'+close+'};globalThis.qa={add:A.add,close:A.close,finishInputPanel,get creating(){return creatingInput;}};',c);
 return{...c,c,release};
}
{
 const f=fixture({defer:true}),p=f.qa?.add||f.c.qa.add;const first=p();assert.equal(f.c.qa.creating,true);assert.ok(f.controls.every(x=>x.disabled));p();
 vm.runInContext('(()=>{const e={key:"Enter",preventDefault(){globalThis.prevented=true;}};'+html.match(/if \(e.key === "Enter" && st.pop === "add"\) \{[^\n]+/)[0]+'})();',f.c);
 assert.equal(f.c.prevented,true);assert.equal(f.calls.filter(x=>x[0]==='CreateScene').length,1);f.release();await first;
 assert.equal(f.c.qa.creating,false);assert.equal(f.controls[0].disabled,false);assert.equal(f.controls[1].disabled,true);assert.equal(f.calls.at(-1)[1].requestType,'finish_input_panel');assert.equal(f.calls.at(-1)[1].requestData.editor,'properties');
 checks.push('Shared click/Enter guard, preventDefault, control disable and original disabled-state restore');
}
{
 const f=fixture({fail:'CreateInput'});await f.c.qa.add();assert.equal(f.c.qa.creating,false);assert.ok(f.messages.at(-1).m.includes('QA (cena sem fonte confirmada)'));assert.ok(!f.calls.some(x=>/Remove/.test(x[0])||x[0]==='CallVendorRequest'));checks.push('Partial scene retained and named on source failure; no erase or dialog handoff');
}
{
 const f=fixture({handoffError:true});await f.c.qa.add();assert.ok(f.messages.at(-1).m.includes('Entrada criada'));assert.ok(f.messages.at(-1).m.includes('QA'));assert.ok(!f.calls.some(x=>/Remove/.test(x[0])));assert.equal(f.controls[0].disabled,false);checks.push('Completed input retained and error shown when old/unsupported Native handoff refuses');
}
{
 const f=fixture({type:'call'});await f.c.qa.add();const launch=f.calls.findIndex(x=>x[0]==='launch');assert.equal(f.calls[launch][1],'calls');assert.equal(f.calls[launch+1][1].requestType,'finish_input_panel');assert.equal(f.calls[launch+1][1].requestData.editor,'');assert.ok(!f.calls.some(x=>x[0].includes('Properties')));checks.push('Post-create Call opens real console before closing source panel; no legacy URL or automatic return/talkback');
}
{
 const f=fixture({type:'call',launchError:true});await f.c.qa.add();assert.ok(f.messages.at(-1).m.includes('Entrada criada'));assert.ok(!f.calls.some(x=>x[0]==='CallVendorRequest'));checks.push('Calls launch failure keeps input and form, rather than closing before a confirmed replacement');
}
{
 const f=fixture({n:2});await f.c.qa.add();assert.equal(f.calls.filter(x=>x[0]==='CreateInput').length,2);assert.equal(f.calls.at(-1)[1].requestData.editor,'');assert.ok(f.messages.some(x=>x.m.includes('2 entradas criadas')));checks.push('Multiple inputs preserved, one panel completion, explicit per-input device configuration');
}
{
 const f=fixture({native:false});await f.c.qa.add();assert.deepEqual(f.calls.slice(-2).map(x=>x[0]),['OpenInputPropertiesDialog','window.close']);checks.push('Ordinary browser popup fallback opens properties and then closes the JavaScript-created window');
}
{
 const f=fixture();await f.c.qa.close();assert.equal(f.calls[0][1].requestType,'finish_input_panel');assert.equal(f.calls[0][1].requestData.editor,'');assert.ok(!f.calls.some(x=>x[0]==='window.close'));checks.push('Native close button uses vendor, bypassing CEF window.close override');
}
const native=await fs.readFile(path.join(dir,'draft/freemix-app/frontend/widgets/FreeMixMultistream.cpp'),'utf8');
const main=await fs.readFile(path.join(dir,'draft/freemix-app/frontend/widgets/OBSBasic_MainControls.cpp'),'utf8');
assert.match(native,/OBSSourceAutoRelease retained/);assert.match(native,/OBSSource source\(retained\)/);assert.match(native,/if \(panel \|\| panelDeletionDepth\) return/);assert.match(native,/\+\+tries > 160/);assert.match(native,/obs_source_removed\(source\)/);assert.match(main,/new OBSBasicProperties\(this, source\)/);assert.match(main,/new OBSBasicFilters\(this, source\)/);assert.match(main,/setTransientParent/);assert.equal((main.match(/FreeMixRaiseInputDialog\((?:properties|filters), this, requester\)/g)||[]).length,2);checks.push('Native structural contract: retained source, bounded cooperative-close wait, shutdown/removal guards, existing OBSBasic owner and foreground for both editors (not compiled/runtime proof)');
const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'FreeMix-QA-UXInputs-Patch-'));await fs.cp(path.join(dir,'before'),tmp,{recursive:true});
for(const p of ['mesa.html','OBSBasic_MainControls.cpp','FreeMixMultistream.cpp']){const patch=path.join(dir,p+'.patch');const r=spawnSync('git',['-c','core.autocrlf=false','apply','--check',patch],{cwd:tmp,encoding:'utf8'});assert.equal(r.status,0,r.stderr);const applied=spawnSync('git',['-c','core.autocrlf=false','apply',patch],{cwd:tmp,encoding:'utf8'});assert.equal(applied.status,0,applied.stderr);}
for(const pin of JSON.parse(await fs.readFile(path.join(dir,'base-pins.json'),'utf8')).pins){assert.equal(sha(await fs.readFile(path.join(root,pin.path))),pin.sha256,'Product base drift: '+pin.path);assert.equal(sha(await fs.readFile(path.join(tmp,pin.path))),sha(await fs.readFile(path.join(dir,'draft',pin.path))));}checks.push('Three patches apply to own TEMP copies and reproduce exact draft bytes; three original product SHA256 pins unchanged');
const result={status:'PASS',finished:new Date().toISOString(),checks,checksCount:checks.length,temporaryPatchRoot:tmp,limits:['JavaScript real extracted handlers executed with own mock transport/DOM; no Native process or operator commands','Native foreground/lifecycle changes are structural contract only; no compilation or CEF z-order runtime proof','Queued success confirms handoff accepted, not completed; cooperative close aborts on shutdown/source removal or four-second timeout and logs warning','No product, Git index, installer, sealed payload, ticker or proprietary asset changes']};await fs.writeFile(path.join(dir,'result.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({status:result.status,checks:checks.length}));
