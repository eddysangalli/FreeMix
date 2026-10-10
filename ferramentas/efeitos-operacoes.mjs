import{randomUUID}from'node:crypto';
// Starts AFTER Production.run tail. Operation-local facade, no global interception.
export const effectsReadOnly=(type,data={})=>/^Get[A-Z]/.test(type)||type==='CallVendorRequest'&&data.vendorName==='freemix'&&data.requestType==='talkback'&&data.requestData?.action==='state';
export class EffectsOperations{
 constructor(p){this.p=p;this.current=null;this.receipts=new Map();}
 context(){const obs=this.p.getObs?.(),scope=this.p.scope;if(!obs||!scope||this.p.state.connected===false)throw Error('Motor indisponível');if(this.current?.obs!==obs||this.current?.scope!==scope)this.current={obs,scope,id:randomUUID()};return this.current;}
 summary(){const c=this.context();return{context:c.id,scope:c.scope,receipts:[...this.receipts.values()].map(r=>({...r})),receiptLimit:32};}
 bind(c,receipt){const p=this.p,check=()=>{if(p.getObs()!==c.obs||p.scope!==c.scope||p.state.connected===false)throw Error('Produção/conexão mudou; despacho bloqueado');};
  const req=async(type,data={})=>{check();if(!effectsReadOnly(type,data)){receipt.mutationDispatches++;receipt.firstDispatchAt??=Date.now();}const r=await c.obs.req(type,data);check();return r;};
  const obs=Object.create(c.obs);obs.req=req;const bound=Object.create(p);Object.defineProperty(bound,'scope',{get:()=>p.scope});Object.defineProperty(bound,'state',{get:()=>p.state});bound.req=req;bound.effectsNativeIdentity=c.obs;bound.getObs=()=>{check();return obs;};
  bound.optional=async(type,data)=>{try{return await req(type,data);}catch{return null;}};
  bound.vendor=async(type,data={},name='downstream-keyer')=>{const r=await req('CallVendorRequest',{vendorName:name,requestType:type,requestData:data});if(r.responseData?.success===false)throw Error('O motor recusou '+type);return r.responseData;};return{p:bound,check};}
 async run(action,d,fn){const c=this.context(),id=d.effectsOperationId??randomUUID();if(typeof id!=='string'||!/^[a-zA-Z0-9-]{8,64}$/.test(id))throw Error('Identificação de efeito inválida');if(this.receipts.has(id))throw Error('Identificação já usada; comando não repetido');if(this.receipts.size>=32){const terminal=[...this.receipts].find(([,r])=>r.stage!=='pending');if(!terminal)throw Error('Operações sem conclusão; confira o motor');this.receipts.delete(terminal[0]);}
  const receipt={id,context:c.id,scope:c.scope,action,key:d.key??null,stage:'pending',startedAt:Date.now(),finishedAt:null,mutationDispatches:0,firstDispatchAt:null};this.receipts.set(id,receipt);
  if(d.effectsContext!==undefined&&d.effectsContext!==c.id){receipt.stage='rejected';receipt.finishedAt=Date.now();receipt.error='Produção/conexão mudou antes do efeito';throw Error(receipt.error);}
  const binding=this.bind(c,receipt);try{const result=await fn(binding);binding.check();receipt.stage='confirmed';receipt.finishedAt=Date.now();return{...(result||{}),operation:{...receipt}};}
  catch(e){receipt.stage=receipt.mutationDispatches===0?'rejected':'uncertain';receipt.finishedAt=Date.now();receipt.error=receipt.stage==='rejected'?'Ajuste recusado antes de qualquer escrita no motor':'Comando terminou sem confirmação; confira o estado';throw e;}
 }
}
