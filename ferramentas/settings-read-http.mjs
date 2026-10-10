import{readSettingsSnapshot}from'./read-settings-snapshot.mjs';
// Must remain within createProjectHttpDispatcher and the normal API auth gate.
export async function handleSettingsRead({req,res,u,local,authorized,originAllowed,json,production}){
 if(u.pathname!=='/api/settings')return false;
 if(!authorized(req)){json(res,401,{success:false,error:'Autorize este dispositivo'});return true;}
 if(!originAllowed(req)||!local(req)){json(res,403,{success:false,error:'Consulta de configurações disponível somente neste computador'});return true;}
 if(req.method!=='GET'){res.setHeader('Allow','GET');json(res,405,{success:false,error:'Use GET somente para consultar'});return true;}
 if(u.searchParams.size){json(res,400,{success:false,error:'Consulta não recebe configuração'});return true;}
 res.setHeader('Cache-Control','no-store');json(res,200,await readSettingsSnapshot(production));return true;
}
