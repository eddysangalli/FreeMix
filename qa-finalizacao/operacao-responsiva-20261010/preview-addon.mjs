import fs from 'node:fs/promises';import crypto from 'node:crypto';import vm from 'node:vm';import assert from 'node:assert/strict';const q=import.meta.dirname,sha=b=>crypto.createHash('sha256').update(b).digest('hex'),base=await fs.readFile(q+'/draft/mesa.html');let s=base.toString();
const helper=String.raw`
  let previewIntent=null,previewIntentSequence=0;
  function previewTakeInput(){const intent=previewIntent;if(intent&&intent.scope===st.preset&&st.scenes.includes(intent.name)&&(!st.sceneKeys[intent.name]||st.sceneKeys[intent.name]===intent.key))return intent.key;previewIntent=null;return st.sceneKeys[st.preview]||st.preview;}
  async function choosePreview(name){
    if(operationalPending)throw Error('Aguarde confirmar o corte antes de trocar o Preview.');
    if(!st.studio)return productionAction('active',{input:st.sceneKeys[name]||name});
    const previous=previewIntent,intent={sequence:++previewIntentSequence,name,key:st.sceneKeys[name]||name,scope:st.preset};previewIntent=intent;
    try{return await req('SetCurrentPreviewScene',{sceneName:name});}
    catch(error){if(previewIntent?.sequence===intent.sequence&&!error.uncertain)previewIntent=previous;throw error;}
  }
`;
function once(a,b){if(s.split(a).length!==2)throw Error('Preview anchor '+a.slice(0,70));s=s.replace(a,b);}
once('  let operationalPending=null,operationalSequence=0;',helper+'\r\n  let operationalPending=null,operationalSequence=0;');
once('    preview: (d) => run(st.studio ? req("SetCurrentPreviewScene", { sceneName: d.v }) : req("SetCurrentProgramScene", { sceneName: d.v })),','    preview: (d) => run(choosePreview(d.v)),');
once('            await req("SetCurrentPreviewScene", { sceneName });','            await choosePreview(sceneName);');
s=s.replaceAll('input:st.sceneKeys[st.preview]||st.preview','input:previewTakeInput()');
once("operationalPending=null;showOperationalPending();toast(op.stage", "if(op.stage==='confirmed'&&['active','cut','fade','transition'].includes(op.action))previewIntent=null;operationalPending=null;showOperationalPending();toast(op.stage");
await fs.writeFile(q+'/draft/mesa-preview.html',s);
const cases=[];const test=async(name,f)=>{await f();cases.push({case:name,pass:true});};
function harness(){let pending=null,request=async()=>({});const calls=[],st={studio:true,preview:'Old',preset:'Own QA',scenes:['Old','New','Third'],sceneKeys:{Old:'old-id',New:'new-id',Third:'third-id'}};const scope={st,Error,get operationalPending(){return pending;},req:async(t,d)=>{calls.push({t,d});return request(t,d);},productionAction:async(a,d)=>{calls.push({a,d});return{};}};const x=vm.runInNewContext(helper+';({choosePreview,previewTakeInput,intent:()=>previewIntent})',scope);return{...x,st,calls,set:f=>request=f,pending:x=>pending=x};}
await test('nonStudio_preview_uses_backend_active_UUID',async()=>{const h=harness();h.st.studio=false;await h.choosePreview('New');assert.equal(h.calls[0].a,'active');assert.equal(h.calls[0].d.input,'new-id');assert.equal(h.calls.some(x=>x.t==='SetCurrentProgramScene'),false);});
await test('pending_take_blocks_Studio_preview',async()=>{const h=harness();h.pending({id:'own'});await assert.rejects(h.choosePreview('New'));assert.equal(h.calls.length,0);});
await test('thumbnail_then_Space_before_event_uses_intent_UUID',async()=>{const h=harness();let release;h.set(()=>new Promise(r=>release=r));const p=h.choosePreview('New');assert.equal(h.st.preview,'Old');assert.equal(h.previewTakeInput(),'new-id');release({});await p;assert.equal(h.previewTakeInput(),'new-id');});
await test('known_refusal_rolls_back_current_intent',async()=>{const h=harness();await h.choosePreview('Old');h.set(async()=>{throw Error('Synthetic refused');});await assert.rejects(h.choosePreview('New'));assert.equal(h.previewTakeInput(),'old-id');});
await test('old_request_refusal_cannot_rollback_newer_intent',async()=>{const h=harness();let reject;h.set((_t,d)=>d.sceneName==='New'?new Promise((_r,j)=>reject=j):Promise.resolve({}));const p=h.choosePreview('New');await h.choosePreview('Third');reject(Error('Synthetic old refusal'));await assert.rejects(p);assert.equal(h.previewTakeInput(),'third-id');});
await test('uncertain_preview_does_not_invent_rollback',async()=>{const h=harness();h.set(async()=>{throw Object.assign(Error('Synthetic timeout'),{uncertain:true});});await assert.rejects(h.choosePreview('New'));assert.equal(h.previewTakeInput(),'new-id');});
await test('changed_project_invalidates_intent',async()=>{const h=harness();await h.choosePreview('New');h.st.preset='Other QA';assert.equal(h.previewTakeInput(),'old-id');assert.equal(h.intent(),null);});
await test('removed_or_UUID_changed_invalidates_intent',async()=>{const h=harness();await h.choosePreview('New');h.st.sceneKeys.New='replaced-id';assert.equal(h.previewTakeInput(),'old-id');});
await test('inline_scripts_compile',async()=>{for(const m of s.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))if(m[1].trim())new vm.Script(m[1]);});
await fs.writeFile(q+'/preview-addon-result.json',JSON.stringify({status:'PASS_PREVIEW_INTENT_9_VM_CASES_NO_NATIVE',cases:cases.length,baselineDraftSha256:sha(base),draftSha256:sha(s),results:cases,limits:['Only local explicit Preview intent; another Native client can still race external changes.','No synthetic SetPreview retry; unknown ACK does not fabricate rollback.','Full take backend confirms explicit target; real Native/API integration still pending.']},null,2)+'\n');console.log('PASS_PREVIEW_ADDON_9');
