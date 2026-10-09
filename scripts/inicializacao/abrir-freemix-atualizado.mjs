import{readFile,writeFile}from'node:fs/promises';import{resolve,join,relative,isAbsolute}from'node:path';import{fileURLToPath}from'node:url';import{execFileSync}from'node:child_process';import{createHash}from'node:crypto';import{apply,inspect}from'../../obs-vmix/ferramentas/atualizar-freemix.mjs';
const workspace=resolve(fileURLToPath(new URL('../../',import.meta.url))),root=join(workspace,'obs-vmix'),helper=join(root,'runtime/freemix-process-info.exe');
const taskRows=()=>execFileSync('tasklist.exe',['/FO','CSV','/NH'],{encoding:'utf8',windowsHide:true,timeout:10000}).split(/\r?\n/).map(s=>s.match(/^"(?:FreeMix|obs64)\.exe","(\d+)"/i)?.[1]).filter(Boolean);
function assertClosed(path){const ids=taskRows(),rows=ids.length?JSON.parse(execFileSync(helper,ids,{encoding:'utf8',windowsHide:true,timeout:10000})):[];if(rows.some(p=>!p.exited&&(!p.path||resolve(p.path).toLowerCase().startsWith(path.toLowerCase()+ '\\'))))throw Error('Há atualização pronta. Feche a janela do FreeMix normalmente e abra ABRIR-FREEMIX.cmd novamente. Sua mesa não será encerrada pelo atualizador.');}
async function stopOwnedAPI(path){
 let panelPort=8088;
 try{const raw=await readFile(join(path,'painel/local.js'),'utf8'),encoded=/window\.MESA_LOCAL\s*=\s*(\{[^;]+\})\s*;?/.exec(raw);if(encoded){const config=JSON.parse(encoded[1]);if(config.replayUrl){const u=new URL(config.replayUrl);if(!['127.0.0.1','localhost'].includes(u.hostname)||u.protocol!=='http:')throw Error('Controle configurado fora da instalação local');panelPort=Number(u.port||80);}}}catch(e){if(e.code!=='ENOENT')throw e;}
 if(!Number.isInteger(panelPort)||panelPort<1||panelPort>65535)throw Error('Porta local inválida');
 const identity=createHash('sha256').update(resolve(path).toLowerCase()).digest('hex');
 const ports=[...new Set([panelPort,8088,...Array.from({length:11},(_,n)=>18188+n)])];
 const owned=(await Promise.all(ports.map(async port=>{try{const h=await fetch('http://127.0.0.1:'+port+'/api/health',{signal:AbortSignal.timeout(800)}).then(r=>r.json());return h.app==='FreeMix'&&h.installationId===identity&&Number(h.port)===port?{port,h}:null;}catch{return null;}}))).filter(Boolean);
 for(const {port,h} of owned){
  const p=JSON.parse(execFileSync(helper,[String(h.pid)],{encoding:'utf8',windowsHide:true,timeout:10000}))[0];
  if(p.exited)continue;
  if(!p.path||resolve(p.path).toLowerCase()!==resolve(path+'/runtime/node.exe').toLowerCase())throw Error('A API aberta não pertence à runtime esperada; feche pelo fluxo normal');
  assertClosed(path);
  const current=await fetch('http://127.0.0.1:'+port+'/api/health',{signal:AbortSignal.timeout(800)}).then(r=>r.json());
  if(current.pid!==h.pid||current.installationId!==identity)throw Error('A propriedade da API mudou durante a atualização');
  execFileSync('taskkill.exe',['/PID',String(h.pid),'/T','/F'],{windowsHide:true,stdio:'pipe',timeout:10000});
 }
}

let pending;try{pending=JSON.parse(await readFile(join(workspace,'entregas/ULTIMA-ATUALIZACAO.json'),'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
if(pending){const pkg=resolve(workspace,pending.package),rel=relative(join(workspace,'entregas'),pkg);if(!rel||rel.startsWith('..')||isAbsolute(rel))throw Error('Atualização fora da pasta entregas');const installed=JSON.parse(await readFile(join(root,'version.json'),'utf8')).version;if(installed!==pending.version){assertClosed(root);const key=await readFile(join(root,'update-public.pem')),verified=await inspect(root,pkg,key);if(verified.version!==pending.version)throw Error('Versão do marcador diverge da assinatura');await stopOwnedAPI(root);console.log('Aplicando '+pending.version+' com backup e hashes...');const result=await apply(root,pkg,key);const receipt={...result,at:new Date().toISOString(),configPreserved:true,operatorClosed:true};await writeFile(join(workspace,'entregas/APLICACAO-ULTIMA.json'),JSON.stringify(receipt,null,2));console.log('Atualização aplicada.');}}
if(process.argv.includes('--apply-only'))process.exit(0);
const output=execFileSync(join(root,'runtime/node.exe'),[join(root,'ferramentas/iniciar-freemix.mjs'),...process.argv.slice(2)],{encoding:'utf8',windowsHide:true,timeout:90000,env:{...process.env,FREEMIX_ROOT:root}});console.log(output);
