import {checkedPath} from './project-files.mjs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
const fail=code=>{throw Object.assign(Error(code),{code});};
// Root injects the actual InputEngine class; no Production instance/run/refresh/tick.
export function createCompositionPort({root,InputEngine}){
 if(typeof InputEngine!=='function')fail('REAL_INPUT_ENGINE_REQUIRED');
 return {async forScope({scope,request,assertOwnContext}){
  await assertOwnContext();await checkedPath(root,join(root,'config/obs-studio/plugin_config/freemix-inputs',createHash('sha256').update(scope).digest('hex').slice(0,24)+'.json'),{createParents:true});
  const p={root,req:request,optional:async(type,data)=>{try{return await request(type,data);}catch{return null;}},state:{video:await request('GetVideoSettings')}};
  const engine=new InputEngine(p);p.inputEngine=engine;await engine.setScope(scope);
  return {async create(data){await assertOwnContext();await engine.create(data);return {uuid:engine.last.createdKey};},async variant(data){await assertOwnContext();await engine.variant(data);return {uuid:engine.last.createdKey};}};
 }};
}
