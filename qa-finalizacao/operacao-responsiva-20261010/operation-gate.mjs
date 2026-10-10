// Isolated proposal. Root must integrate against the actual confirmation contract.
export class OperationGate {
 constructor({timeoutMs=2500,now=()=>performance.now(),notify=()=>{}}={}){this.timeoutMs=timeoutMs;this.now=now;this.notify=notify;this.current=null;this.seq=0;}
 status(job,stage,extra={}){Object.assign(job,{stage,...extra});this.notify({...job});}
 start({action,target,scope,send,confirm}){
  if(this.current)throw Error('Há um comando em confirmação. Aguarde; repetir pode executar outra operação.');
  if(!scope||!action||typeof send!=='function'||typeof confirm!=='function')throw Error('Contrato incompleto');
  const job={id:++this.seq,action,target,scope,stage:'pending',clickedAt:this.now(),sentAt:null,confirmedAt:null};this.current=job;this.status(job,'pending');
  let finished=false;const timer=setTimeout(()=>{if(!finished&&this.current===job)this.status(job,'uncertain',{reason:'Prazo da interface atingido; execução não será repetida automaticamente.'});},this.timeoutMs);
  const promise=(async()=>{try{
   job.sentAt=this.now();const result=await send();
   if(result?.success!==true)throw Error('Resposta não confirmou sucesso');
   if(!await confirm(result,job))throw Error('Estado não confirmou o alvo/projeto');
   if(this.current!==job)throw Error('Confirmação pertence a uma geração encerrada');
   job.confirmedAt=this.now();this.status(job,'confirmed');this.current=null;return result;
  }catch(error){if(this.current===job)this.status(job,'uncertain',{reason:error.message});throw error;}
  finally{finished=true;clearTimeout(timer);}})();return{job,promise};
 }
 reconcile({id,scope,confirmed,notExecuted=false}){
  const job=this.current;if(!job||job.id!==id||job.scope!==scope||(!confirmed&&!notExecuted))return false;
  this.status(job,confirmed?'confirmed':'rejected',{confirmedAt:confirmed?this.now():null});this.current=null;return true;
 }
}
// Keep the pressed DOM node until mouseup/click has completed. No command dispatch here.
export class TileRenderGate {
 constructor({render,schedule=fn=>setTimeout(fn,0)}){this.render=render;this.schedule=schedule;this.pressed=0;this.dirty=false;this.scheduled=false;}
 pointerDown(){this.pressed++;}
 request(){if(this.pressed||this.scheduled){this.dirty=true;return;}this.render();}
 pointerEnd(){this.pressed=Math.max(0,this.pressed-1);if(!this.pressed&&this.dirty&&!this.scheduled){this.scheduled=true;this.schedule(()=>{this.scheduled=false;if(this.pressed)return;this.dirty=false;this.render();});}}
}
