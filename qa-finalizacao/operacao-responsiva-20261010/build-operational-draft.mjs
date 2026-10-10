import fs from 'node:fs/promises';import path from 'node:path';import crypto from 'node:crypto';
const qa=import.meta.dirname,workspace=path.resolve(qa,'../..'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
await fs.mkdir(path.join(qa,'baseline-canonical'),{recursive:true});await fs.mkdir(path.join(qa,'draft'),{recursive:true});
const pins=[];for(const p of ['FreeMix/painel/mesa.html','FreeMix/ferramentas/controle-producao.mjs']){const b=await fs.readFile(path.join(workspace,p));await fs.writeFile(path.join(qa,'baseline-canonical',path.basename(p)),b);pins.push({path:p,sha256:sha(b),bytes:b.length});}
await fs.writeFile(path.join(qa,'canonical-pins.json'),JSON.stringify(pins,null,2)+'\n');
function once(s,a,b){if(s.split(a).length!==2)throw Error('Missing/ambiguous anchor '+a.slice(0,70));return s.replace(a,b);}
let backend=await fs.readFile(path.join(qa,'baseline-canonical/controle-producao.mjs'),'utf8');
backend=once(backend,"run(action,data={}) { if(action==='macro_cancel')", "run(action,data={}) { if(['preview','active','cut','fade','transition','input_remove'].includes(action))return this.runRealtime(action,data);if(action==='macro_cancel')");
const methods=String.raw`
  runRealtime(action,data={}) {
    const receivedAt=Date.now(),connection=this.getObs(),id=data.operationId;
    if(id!==undefined&&(!/^[A-Za-z0-9_-]{1,80}$/.test(String(id))))return Promise.reject(Error('Identificação de comando inválida'));
    const p=this.tail.then(async()=>{
      const startedAt=Date.now();let executionStarted=false,preservePrevious=false;
      let operation={id:id||null,action,scope:String(data.expectedScope||this.scope||''),targetKey:data.input||null,targetName:null,receivedAt,startedAt,engineConfirmedAt:null,finishedAt:null,stage:'pending'};
      const signature=JSON.stringify([action,data.input||'$preview',data.duration??null]);
      const cacheKey=id?operation.scope+':'+id:null;
      this.operationReceipts??=new Map();
      this.sessionRecovery.beginMutation();
      try {
        const previous=cacheKey&&this.operationReceipts.get(cacheKey);
        if(previous){preservePrevious=true;if(previous.signature!==signature)throw Error('Identificação reutilizada para outro comando');this.state={...this.state,operation:{...previous,replayed:true}};this.publish(this.state);if(previous.stage!=='confirmed')throw Error('Este comando foi recusado ou tem confirmação pendente; não será repetido');return this.state;}
        operation.signature=signature;
        if(cacheKey){if(this.operationReceipts.size>=128){const oldest=[...this.operationReceipts].find(([,r])=>r.stage==='confirmed'||r.stage==='rejected');if(oldest)this.operationReceipts.delete(oldest[0]);else throw Error('Há muitas operações sem confirmação; confira o motor');}this.operationReceipts.set(cacheKey,operation);}
        if(!connection||this.getObs()!==connection)throw Error('Conexão mudou antes do comando. Confira o Programa antes de tentar novamente.');
        await this.prepareRealtime(action,data);
        if(this.getObs()!==connection)throw Error('Conexão mudou durante a confirmação inicial');
        const target=data.input?this.scene(data.input):this.state.inputs.find(i=>i.name===this.state.preview);
        if(!target)throw Error('Entrada removida ou Preview não identificado');
        Object.assign(operation,{scope:this.scope,targetKey:target.key,targetName:target.name});
        await this.routeLegacyAudio();
        if(this.getObs()!==connection)throw Error('Conexão mudou antes de executar');
        executionStarted=true;await this.execute(action,{...data,input:target.key});operation.engineConfirmedAt=Date.now();
        this.macroEngine.recordAction?.(action,data);await this.sessionRecovery.journal(action,data);
        // One full post-operation snapshot is retained for AFV, N-1 and audio safety.
        await this.refresh();if(this.getObs()!==connection||this.scope!==operation.scope)throw Error('Projeto ou conexão mudou após executar. Confira o Programa.');
        if(action==='input_remove'&&this.state.inputs.some(i=>i.key===target.key))throw Error('Entrada ainda presente após exclusão');
        if(action==='preview'&&this.state.preview!==target.name||['active','cut','fade','transition'].includes(action)&&this.state.program!==target.name)throw Error('O estado final não confirmou o alvo escolhido');
        operation.stage='confirmed';operation.finishedAt=Date.now();this.state={...this.state,operation:{...operation},operationReceipts:[...this.operationReceipts.values()].map(r=>({...r}))};this.publish(this.state);return this.state;
      }catch(error){if(!preservePrevious){operation.stage=executionStarted?'uncertain':'rejected';operation.error=error.message;operation.finishedAt=Date.now();this.state={...this.state,operation:{...operation},operationReceipts:[...this.operationReceipts.values()].map(r=>({...r}))};this.publish(this.state);}throw error;}
      finally{this.sessionRecovery.endMutation();}
    });this.tail=p.catch(()=>{});return p;
  }
  async prepareRealtime(action,data) {
    const [sc,preset,mode,tr]=await Promise.all([this.req('GetSceneList'),this.req('GetSceneCollectionList'),this.req('GetStudioModeEnabled'),this.req('GetSceneTransitionList')]);
    if(data.expectedScope&&data.expectedScope!==preset.currentSceneCollectionName)throw Error('O projeto mudou. Abra a entrada novamente antes de executar.');
    if(['cut','fade','transition'].includes(action)&&!mode.studioModeEnabled)throw Error('Modo Preview/Programa foi desligado; comando de transição recusado');
    const scenes=sc.scenes.slice().sort((a,b)=>b.sceneIndex-a.sceneIndex).filter(s=>s.sceneName!=='FreeMix Barramentos'&&!s.sceneName.startsWith('FreeMix Slot '));
    const cached=this.state.inputs||[],sameTopology=scenes.length===cached.length&&scenes.every(s=>cached.some(i=>i.key===s.sceneUuid));
    if(!this.state.connected||this.scope!==preset.currentSceneCollectionName||!sameTopology||Date.now()-(this.state.updatedAt||0)>2500)await this.refresh();
    const names=new Map(scenes.map(s=>[s.sceneUuid,s.sceneName]));
    this.state={...this.state,inputs:this.state.inputs.map(i=>({...i,name:names.get(i.key)||i.name})),program:sc.currentProgramSceneName,preview:sc.currentPreviewSceneName,transitions:tr.transitions,transition:tr.currentSceneTransitionName};
    if(action==='input_remove')await this.guardRealtimeDelete(data.input);
  }
  async guardRealtimeDelete(input) {
    const target=this.scene(input),live=await this.req('GetSceneList');
    if(!live.scenes.some(s=>s.sceneUuid===target.key))throw Error('Entrada removida; exclusão não será repetida');
    if(live.scenes.length<2)throw Error('Não é possível remover a última entrada');
    const tree=await this.realtimeVisibleTree(live.currentProgramSceneName);
    const keyers=await this.vendor('get_downstream_keyers');
    if(!Array.isArray(keyers?.downstream_keyers))throw Error('Não foi possível confirmar overlays antes de excluir');
    for(const k of keyers.downstream_keyers){const selected=await this.vendor('dsk_get_scene',{dsk_name:k.name});if(selected?.scene)await this.realtimeVisibleTree(selected.scene,tree);}
    if(live.currentProgramSceneName===target.name||tree.has(target.name))throw Error('Entrada está no ar: retire do Programa antes de excluir');
    return target;
  }
  async realtimeVisibleTree(name,visited=new Set(),group=false){
    if(!name||visited.has(name))return visited;visited.add(name);
    const r=await this.req(group?'GetGroupSceneItemList':'GetSceneItemList',{sceneName:name});
    if(!Array.isArray(r?.sceneItems))throw Error('Não foi possível confirmar a composição no ar');
    for(const item of r.sceneItems)if(item.sceneItemEnabled!==false){if(item.isGroup||item.inputKind===null)await this.realtimeVisibleTree(item.sourceName,visited,item.isGroup);else visited.add(item.sourceName);}
    return visited;
  }
`;
backend=once(backend,'  runMacroStep(',methods+'\r\n  runMacroStep(');
backend=once(backend,'this.state={connected:true,preset:this.scope,scenes:', 'this.state={operation:this.state.operation,operationReceipts:[...(this.operationReceipts?.values()||[])].map(r=>({...r})),connected:true,preset:this.scope,scenes:');
backend=once(backend,"if(action.startsWith('input_'))return this.inputEngine.execute(action,d);","if(action==='input_remove'){const target=await this.guardRealtimeDelete(d.input);return this.inputEngine.execute(action,{...d,input:target.key});}if(action.startsWith('input_'))return this.inputEngine.execute(action,d);");
backend=once(backend,"case 'cut': case 'fade': {\r\n        if(d.input) await this.req('SetCurrentPreviewScene',{sceneName:this.scene(d.input).name});","case 'cut': case 'fade': case 'transition': {\r\n        if(d.input){const name=this.scene(d.input).name;await this.req('SetCurrentPreviewScene',{sceneName:name});await this.wait('GetSceneList',{},s=>s.currentPreviewSceneName===name);}");
backend=once(backend,"const t=this.state.transitions.find(t=>t.transitionKind===(action==='cut'?'cut_transition':'fade_transition'));", "const t=action==='transition'?await this.req('GetCurrentSceneTransition'):this.state.transitions.find(t=>t.transitionKind===(action==='cut'?'cut_transition':'fade_transition'));");
backend=once(backend,"let selected=false;for(let n=0;n<60;n++){", "let selected=action==='transition';for(let n=0;!selected&&n<60;n++){");
backend=once(backend,"(action==='cut'||s.transitionDuration===Number(d.duration??500))","(action!=='fade'||s.transitionDuration===Number(d.duration??500))");
backend=once(backend,"await delay(action==='fade'?Number(d.duration??500)+50:50);", "await delay(action==='fade'?Number(d.duration??500)+50:action==='transition'&&t.transitionKind!=='cut_transition'?Math.max(50,Math.min(20000,Number(t.transitionDuration)||0)+50):50);");
await fs.writeFile(path.join(qa,'draft/controle-producao.mjs'),backend);
let mesa=await fs.readFile(path.join(qa,'baseline-canonical/mesa.html'),'utf8');
const op=String.raw`
  let operationalPending=null,operationalSequence=0;
  const operationTypes=new Set(['active','cut','fade','transition','input_remove']);
  function showOperationalPending(){const el=$('operation-status');if(el)el.hidden=!operationalPending;}
  function reconcileOperation(state){const p=operationalPending,op=p&&[state?.operation,...(state?.operationReceipts||[])].find(r=>r?.id===p.id&&r.scope===p.scope);if(op&&['confirmed','rejected'].includes(op.stage)){operationalPending=null;showOperationalPending();toast(op.stage==='confirmed'?'Comando confirmado no motor.':op.error||'Comando recusado antes de executar.',op.stage!=='confirmed');}}
  async function checkOperationalPending(){const r=await fetch(new URL('/api/json',replayUrl).href,{signal:AbortSignal.timeout(4000)});if(!r.ok)throw Error('Não foi possível consultar o motor');reconcileOperation(await r.json());if(operationalPending)toast('Ainda sem confirmação segura. Confira o Programa; o comando não será repetido.',true);}
  setInterval(()=>reconcileOperation(window.FreeMixProductionState),500);
`;
const originalAction=mesa.slice(mesa.indexOf('  async function productionAction('),mesa.indexOf('  let replayBusy ='));
mesa=once(mesa,originalAction,op+String.raw`
  async function productionAction(action,data={}){
    const gated=operationTypes.has(action);let operation;
    if(gated){if(operationalPending)throw Error('Há um comando em confirmação. Aguarde e confira o Programa; não repita o corte.');const scope=String(data.expectedScope||st.preset||window.FreeMixProductionState?.preset||'');if(!scope)throw Error('Aguarde identificar o projeto do motor.');const nonce=Array.from(crypto.getRandomValues(new Uint32Array(2)),n=>n.toString(36)).join('_');operation={id:'mesa_'+Date.now()+'_'+nonce+'_'+(++operationalSequence),scope,clickedAt:Date.now()};operationalPending=operation;showOperationalPending();data={...data,operationId:operation.id,expectedScope:scope};toast('Comando enviado; aguardando confirmação do motor…');}
    try{
      const r=await fetch(replayUrl.replace(/replay$/,'control'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...data}),signal:AbortSignal.timeout(120000)}),result=await r.json();
      if(operation)reconcileOperation(result.state||{operation:result.operation,operationReceipts:result.operationReceipts});
      if(!r.ok||result.success!==true)throw Error(result.error||'O motor não confirmou o comando');
      if(operation){const ack=result.state?.operation;if(ack?.id!==operation.id||ack.scope!==operation.scope||ack.stage!=='confirmed')throw Error('O motor não confirmou o alvo deste comando. Confira o Programa.');}
      return result;
    }catch(error){if(operation&&operationalPending)toast('Confirmação pendente. Use Conferir motor; o comando não será repetido.',true);throw error;}
  }
`);
mesa=once(mesa,'  <div class="toast" id="toast"></div>','  <div id="operation-status" hidden style="position:fixed;top:4px;left:35%;z-index:2000;background:#27313c;color:white;padding:6px;border:1px solid #8aa1b7">Comando aguardando confirmação · <button data-a="operationcheck">Conferir motor</button></div>\r\n  <div class="toast" id="toast"></div>');
mesa=once(mesa,'  const A = {','  const A = {\r\n    operationcheck:()=>run(checkOperationalPending()),');
mesa=once(mesa,'    quick: (d) => run((async () => { if (!st.studio) return req("SetCurrentProgramScene", { sceneName: d.v }); await req("SetCurrentPreviewScene", { sceneName: d.v }); await req("TriggerStudioModeTransition"); })()),','    quick: (d) => run(productionAction(st.studio ? "transition" : "active", {input:st.sceneKeys[d.v]||d.v})),');
mesa=once(mesa,'    cut: (d) => run(productionAction(st.studio ? "cut" : "active", {input:d.v})),','    cut: (d) => run(productionAction(st.studio ? "cut" : "active", {input:st.sceneKeys[d.v]||d.v})),');
mesa=once(mesa,'    closeask: (d) => (st.locked ? A.lockmsg() : openPop("close", d.v)),','    closeask: (d) => {if(st.locked)return A.lockmsg();st.closeTarget={key:st.sceneKeys[d.v],name:d.v,scope:st.preset};openPop("close",d.v);},');
mesa=once(mesa,'    closego: () => { const name = st.popArg; closePop(); run(req("RemoveScene", { sceneName: name })); },','    closego: () => {const target=st.closeTarget;if(!target?.key)return toast("Entrada não identificada. Abra a confirmação novamente.",true);closePop();run(productionAction("input_remove",{input:target.key,expectedScope:target.scope}));},');
mesa=once(mesa,'        case "Transition": {\r\n          if (st.studio) await req("TriggerStudioModeTransition");','        case "Transition": {\r\n          if (st.studio) await productionAction("transition",{input:st.sceneKeys[st.preview]||st.preview});');
mesa=once(mesa,'          if (st.studio) await productionAction("cut");','          if (st.studio) await productionAction("cut",{input:st.sceneKeys[st.preview]||st.preview});');
mesa=once(mesa,'          if (st.studio) await productionAction("fade", {duration:sc.val && +sc.val > 0 ? +sc.val : 500});','          if (st.studio) await productionAction("fade", {input:st.sceneKeys[st.preview]||st.preview,duration:sc.val && +sc.val > 0 ? +sc.val : 500});');
mesa=once(mesa,'            await req("SetCurrentProgramScene", { sceneName });','            await productionAction("active", {input:st.sceneKeys[sceneName]||sceneName});');
mesa=once(mesa,'    const code = e.code || e.key;\r\n    const sc = st.shortcuts?.find','    if(e.repeat)return;\r\n    const code = e.code || e.key;\r\n    const sc = st.shortcuts?.find');
await fs.writeFile(path.join(qa,'draft/mesa.html'),mesa);
console.log(JSON.stringify({status:'DRAFT_OPERATIONAL_ONLY',sources:pins.map(p=>({path:p.path,sha256:p.sha256})),productApplied:false}));
