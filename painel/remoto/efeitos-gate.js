'use strict';
// One gate for creative/PTZ/caption/quality. Aborted fetch does NOT abort Core tail.
window.FreeMixEffectsGate=(()=>{
 const key='freemix.effects.pending.v1',listeners=new Set();let context=null,pending=null;
 try{const p=JSON.parse(sessionStorage.getItem(key)||'null');if(p?.id&&p.context)pending=p;}catch{}
 function emit(){for(const fn of listeners)fn({blocked:!!pending,pending});}
 function save(){try{pending?sessionStorage.setItem(key,JSON.stringify(pending)):sessionStorage.removeItem(key);}catch{}emit();}
 function observe(s){if(s?.operations?.context)context=s.operations.context;}
 function confirmed(s,p=pending){const r=s?.operations?.receipts?.find(r=>r.id===p?.id);return !!r&&r.context===p.context&&r.action===p.action&&r.key===p.key&&r.finishedAt&&['confirmed','rejected'].includes(r.stage);}
 async function reconcile(snapshot){if(!pending)return true;const own=pending,s=await snapshot(own.key);observe(s);if(pending!==own)throw Error('A operação mudou durante a conferência; releia o estado.');if(!confirmed(s,own))throw Error('Operação ainda sem prova correspondente; controles seguem bloqueados. Não repita.');pending=null;save();return true;}
 async function mutate(action,data){if(pending)throw Error('Há uma operação pendente/incerta. Use Conferir estado; nenhum novo comando foi enviado.');if(!context)throw Error('Leia o contexto do motor antes de aplicar');const intent=structuredClone(data),id=crypto.randomUUID();pending={id,context,action,key:intent.key??null,intent,stage:'pending'};save();const own=pending;
 try{const r=await fetch('/api/control',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...intent,effectsOperationId:id,effectsContext:own.context}),signal:AbortSignal.timeout(15000)}),d=await r.json(),o=d.effects?.operation;if(!r.ok||!d.success||!o||o.id!==id||o.context!==own.context||o.action!==action||o.key!==own.key||o.stage!=='confirmed'||!o.finishedAt)throw Error(d.error||'Confirmação de operação ausente');if(pending===own){pending=null;save();}return d.effects;}catch(e){if(pending===own){own.stage='uncertain';save();}throw Error(e.name==='TimeoutError'?'Prazo expirou; o motor pode continuar executando. Controles bloqueados até Conferir estado.':e.message);}
 }
 return{observe,mutate,reconcile,get blocked(){return !!pending;},get pending(){return pending?structuredClone(pending):null;},subscribe(fn){listeners.add(fn);fn({blocked:!!pending,pending});return()=>listeners.delete(fn);}};
})();
