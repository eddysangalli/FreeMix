import fs from 'node:fs';
import path from 'node:path';
const dir=import.meta.dirname;
const read=n=>fs.readFileSync(path.join(dir,'baseline',n),'utf8').replace(/\r\n/g,'\n');
const write=(n,s)=>fs.writeFileSync(path.join(dir,'draft',n),s.replace(/\r?\n/g,'\r\n'));
function once(s,a,b){if(!s.includes(a)||s.indexOf(a)!==s.lastIndexOf(a))throw Error('Anchor not unique: '+a.slice(0,70));return s.replace(a,b);}
let control=read('controle-producao.mjs');
control=once(control,"['preview','active','cut','fade','transition','input_remove'].includes(action)","['preview','active','cut','fade','transition','ftb','input_remove'].includes(action)");
control=once(control,"this.operationReceipts??=new Map();","this.operationReceipts??=new Map();this.operationConnections??=new Map();");
control=once(control,"if(oldest)this.operationReceipts.delete(oldest[0]);","if(oldest){this.operationReceipts.delete(oldest[0]);this.operationConnections.delete(oldest[0]);}");
control=once(control,"this.operationReceipts.set(cacheKey,operation);}","this.operationReceipts.set(cacheKey,operation);this.operationConnections.set(cacheKey,connection);}");
control=once(control,"Object.assign(operation,{scope:this.scope,targetKey:target.key,targetName:target.name});","Object.assign(operation,{scope:this.scope,targetKey:target.key,targetName:target.name});\n        if(action==='ftb')throw Error('FTB ainda não está disponível pelo controle FreeMix. Use o botão FTB do motor; o atalho não fará uma transição Fade comum.');");
const check=`  // Explicit correlated read-only reconciliation; never calls execute/refresh/audio routing.
  checkOperation({id,scope}={}) {
    if(!/^[A-Za-z0-9_-]{1,80}$/.test(String(id||''))||typeof scope!=='string'||!scope||scope.length>200)return Promise.reject(Error('Identificação de confirmação inválida'));
    const connection=this.getObs(),cacheKey=scope+':'+id;
    const queued=this.tail.then(async()=>{
      const receipt=this.operationReceipts?.get(cacheKey);
      if(!receipt)throw Error('Comando não identificado; nenhuma operação será repetida.');
      if(!connection||this.getObs()!==connection)throw Error('Conexão mudou durante a consulta. Confira novamente o motor.');
      const transitionAction=['cut','fade','transition'].includes(receipt.action);
      const [sc,preset,cursor]=await Promise.all([this.req('GetSceneList'),this.req('GetSceneCollectionList'),transitionAction?this.req('GetCurrentSceneTransitionCursor'):Promise.resolve(null)]);
      if(this.getObs()!==connection)throw Error('Conexão mudou durante a consulta. Confira novamente o motor.');
      const scenes=sc.scenes||[],keyOf=name=>scenes.find(s=>s.sceneName===name)?.sceneUuid||null;
      const current={scope:preset.currentSceneCollectionName,program:{key:sc.currentProgramSceneUuid||keyOf(sc.currentProgramSceneName),name:sc.currentProgramSceneName},preview:{key:sc.currentPreviewSceneUuid||keyOf(sc.currentPreviewSceneName),name:sc.currentPreviewSceneName},transitionComplete:!transitionAction||cursor?.transitionCursor===1};
      const sameContext=current.scope===scope&&this.operationConnections?.get(cacheKey)===connection;
      let desiredMatches=false;
      if(sameContext&&receipt.targetKey){
        if(receipt.action==='input_remove')desiredMatches=!scenes.some(s=>s.sceneUuid===receipt.targetKey);
        else if(receipt.action==='preview')desiredMatches=current.preview.key===receipt.targetKey;
        else if(['active','cut','fade','transition'].includes(receipt.action))desiredMatches=current.program.key===receipt.targetKey&&current.transitionComplete;
      }
      if(receipt.stage==='uncertain'&&desiredMatches){
        Object.assign(receipt,{stage:'confirmed',confirmation:'current-state',reconciledAt:Date.now(),originalStage:'uncertain'});
        this.state={...this.state,operation:this.state.operation?.id===id&&this.state.operation?.scope===scope?{...receipt}:this.state.operation,operationReceipts:[...this.operationReceipts.values()].map(r=>({...r}))};this.publish(this.state);
      }
      return {operation:{...receipt},current,sameContext,desiredMatches,checkedAt:Date.now(),releaseAllowed:receipt.stage==='uncertain'&&current.transitionComplete};
    });this.tail=queued.catch(()=>{});return queued;
  }

`;
control=once(control,'  async prepareRealtime(action,data) {',check+'  async prepareRealtime(action,data) {');
write('controle-producao.mjs',control);
let api=read('servidor-api.mjs');
api=once(api,'return {id,action,scope,targetKey,targetName,receivedAt,startedAt,engineConfirmedAt,finishedAt,stage,',"return {id,action,scope,targetKey,targetName,receivedAt,startedAt,engineConfirmedAt,finishedAt,stage,...(receipt.confirmation?{confirmation:receipt.confirmation,reconciledAt:receipt.reconciledAt,originalStage:receipt.originalStage}:{}),");
api=once(api,"      if(path==='/api/srt-hdr'){",`      if(path==='/api/operation-check'){
        if(req.method!=='GET')return json(res,405,{success:false});
        const checked=await production.checkOperation({id:u.searchParams.get('id'),scope:u.searchParams.get('scope')});
        return json(res,200,{success:true,...checked,operation:publicOperation(checked.operation)});
      }
      if(path==='/api/srt-hdr'){`);
write('servidor-api.mjs',api);
let mesa=read('mesa.html');
mesa=once(mesa,'let operationalPending=null,operationalSequence=0;','let operationalPending=null,operationalSequence=0,operationalCheck=null;');
mesa=once(mesa,"new Set(['active','cut','fade','transition','input_remove'])","new Set(['active','cut','fade','transition','ftb','input_remove'])");
mesa=once(mesa,"function showOperationalPending(){const el=$('operation-status');if(el)el.hidden=!operationalPending;}","function showOperationalPending(){const el=$('operation-status');if(el)el.hidden=!operationalPending;const release=$('operation-release');if(release)release.hidden=!(operationalPending&&operationalCheck?.releaseAllowed&&operationalCheck.id===operationalPending.id&&operationalCheck.scope===operationalPending.scope);}");
mesa=once(mesa,"operationalPending=null;showOperationalPending();toast(op.stage==='confirmed'?'Comando confirmado no motor.':", "operationalPending=null;operationalCheck=null;showOperationalPending();toast(op.stage==='confirmed'?(op.confirmation==='current-state'?'Estado atual do motor confere com o alvo; o ACK original não foi recuperado.':'Comando confirmado no motor.'):");
const oldCheck=mesa.split('\n').find(l=>l.startsWith('  async function checkOperationalPending()'));
const newCheck=`  async function checkOperationalPending(){
    const pendingCheck=operationalPending;if(!pendingCheck)return;
    operationalCheck=null;showOperationalPending();
    const url=new URL('/api/operation-check',replayUrl);url.searchParams.set('id',pendingCheck.id);url.searchParams.set('scope',pendingCheck.scope);
    const r=await fetch(url.href,{signal:AbortSignal.timeout(4000)}),data=await r.json();
    if(!r.ok||data.success!==true)throw Error(data.error||'Não foi possível consultar o motor');
    if(operationalPending?.id!==pendingCheck.id||operationalPending?.scope!==pendingCheck.scope)return;
    if(data.operation?.id!==pendingCheck.id||data.operation?.scope!==pendingCheck.scope)throw Error('A consulta não confirmou a identificação deste comando.');
    reconcileOperation({operation:data.operation});
    if(operationalPending){operationalCheck={id:pendingCheck.id,scope:pendingCheck.scope,checkedAt:Date.now(),releaseAllowed:data.releaseAllowed===true,programName:data.current?.program?.name||'',currentScope:data.current?.scope||''};showOperationalPending();toast(data.releaseAllowed?'Resultado original ainda incerto. Estado atual consultado; você pode liberar os controles sem repetir este comando.':'Ainda sem confirmação segura. Aguarde a operação terminar e use Conferir motor.',true);}
  }
  function releaseOperationalPending(){
    const p=operationalPending,c=operationalCheck;
    if(!p||!c||!c.releaseAllowed||c.id!==p.id||c.scope!==p.scope||Date.now()-c.checkedAt>5000){operationalCheck=null;showOperationalPending();return toast('Confira o motor novamente antes de liberar os controles.',true);}
    if(!confirm('O resultado original continua incerto. Programa atual: '+c.programName+' · Projeto: '+c.currentScope+'. Liberar os controles NÃO repete nem desfaz o comando. Confira o Programa antes de continuar.'))return;
    // Explicit local abandonment only; backend keeps the uncertain receipt for dedupe.
    operationalPending=null;operationalCheck=null;previewIntent=null;showOperationalPending();toast('Controles liberados. O comando anterior não foi repetido e seu resultado original continua incerto.',true);
  }`;
mesa=once(mesa,oldCheck,newCheck);
mesa=once(mesa,'operationalPending=operation;showOperationalPending();','operationalPending=operation;operationalCheck=null;showOperationalPending();');
mesa=once(mesa,`          const ftb = st.transitions.find((t) => /ftb|fade/i.test(t.name));
          if (ftb) {
            await req("SetCurrentSceneTransition", { transitionName: ftb.name });
            if (st.studio) await req("TriggerStudioModeTransition");
          }`,`          await productionAction('ftb',{input:previewTakeInput()});`);
mesa=once(mesa,'operationcheck:()=>run(checkOperationalPending()),','operationcheck:()=>run(checkOperationalPending()),\n    operationrelease:()=>releaseOperationalPending(),');
const banner=mesa.split('\n').find(l=>l.includes('id="operation-status"'));
mesa=once(mesa,banner,banner.replace('</div>',' <button id="operation-release" data-a="operationrelease" hidden>Liberar controles sem repetir</button></div>'));
write('mesa.html',mesa);
console.log('Own drafts prepared; no product files changed.');
