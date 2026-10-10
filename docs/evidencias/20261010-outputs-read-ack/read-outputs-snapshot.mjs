// Read-only local HTTP helper. Does not enter Production.run, refresh, audio migration or journal.
export async function readOutputsSnapshot(production,now=Date.now){
 const obs=production.getObs(),scope=production.scope;
 if(!obs||!production.state.connected)throw Error('Motor desconectado. Os dados anteriores estão desatualizados.');
 const outputs=await production.outputEngine.read();
 if(obs!==production.getObs()||scope!==production.scope||!production.state.connected)throw Error('O motor ou preset mudou durante a consulta. Confira novamente.');
 if(!Array.isArray(outputs?.destinations))throw Error('Resposta de saídas incompleta.');
 return {success:true,outputs,preset:scope,observedAt:now()};
}
