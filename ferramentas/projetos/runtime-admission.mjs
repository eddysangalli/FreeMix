import {routeProjectApi} from './project-api-adapter.mjs';
// Called by the real server. Project apply/scan MUST NOT be admitted as public jobs.
export function createProjectHttpDispatcher({binding,handler,local,authorized,originAllowed,readBody,json}){
 return async function dispatchProjectHttp(req,res){
  let url;try{url=new URL(req.url,'http://localhost');}catch{return json(res,400,{success:false,error:'PROJECT_URL_INVALID'});}
  if(url.pathname.startsWith('/api/project/')){
   if(!local(req)||!authorized(req)||!originAllowed(req))return json(res,403,{success:false,error:'PROJECT_LOCAL_AUTH_REQUIRED'});
   let data;try{data=req.method==='GET'?{}:await readBody(req,65536);}catch{return json(res,400,{success:false,error:'PROJECT_BODY_INVALID'});}
   const routed=await routeProjectApi({pathname:url.pathname,method:req.method,query:Object.fromEntries(url.searchParams),body:data,local:true,authorized:true,originAllowed:true},binding);
   return routed?json(res,routed.status,routed.data):json(res,404,{success:false,error:'PROJECT_ROUTE_UNKNOWN'});
  }
  // Static pages and cached health/access/pair do not read SDK or mutate project settings.
  const dynamic=url.pathname.startsWith('/api')&&!['/api/health','/api/access','/api/pair','/api/qr.svg'].includes(url.pathname);
  if(!dynamic)return handler(req,res);
  try{return await binding.gate.publicRun(()=>handler(req,res));}
  catch(e){if(e?.code==='PROJECT_TRANSACTION_BUSY')return json(res,409,{success:false,error:'PROJECT_TRANSACTION_BUSY',projectTransaction:binding.gate.status()});throw e;}
 };
}
export async function readProjectBody(req,maxBytes){let bytes=0;const chunks=[];for await(const data of req){const chunk=Buffer.isBuffer(data)?data:Buffer.from(data);bytes+=chunk.length;if(bytes>maxBytes)throw Error('PROJECT_BODY_TOO_LARGE');chunks.push(chunk);}return JSON.parse(Buffer.concat(chunks).toString('utf8')||'{}');}
export function admitProjectNativeEvent(binding,type,deliver){if(!binding.gate.acceptNativeEvent(type))return false;deliver();return true;}
export async function admitProjectSocketMessage(binding,work){return binding.gate.publicRun(work);}
