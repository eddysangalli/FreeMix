import {readFile,readdir,lstat} from 'node:fs/promises';
import {resolve,join,dirname,relative,isAbsolute,extname,basename} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {GT_QR_RUNTIME_SCRIPT,GT_QR_LICENSE} from './gtzip-qr.mjs';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const qrRuntime=Buffer.from(GT_QR_RUNTIME_SCRIPT),qrLicense=Buffer.from(GT_QR_LICENSE);
const inside=(root,path)=>{const r=relative(root,path);return !r||(!r.startsWith('..')&&!isAbsolute(r));};
function withoutJSComments(source){let result='',quote=null;for(let i=0;i<source.length;i++){const c=source[i],next=source[i+1];if(quote){result+=c;if(c==='\\'){result+=source[++i]||'';}else if(c===quote)quote=null;continue;}if(['"',"'",'`'].includes(c)){quote=c;result+=c;continue;}if(c==='/'&&next==='/'){while(i<source.length&&source[i]!=='\n')i++;result+='\n';continue;}if(c==='/'&&next==='*'){i+=2;while(i<source.length&&!(source[i]==='*'&&source[i+1]==='/'))i++;i++;result+=' ';continue;}result+=c;}return result;}
async function noLinks(root,path){for(let p=path;;p=dirname(p)){if((await lstat(p)).isSymbolicLink())throw Error('Link não permitido: '+p);if(p===root)break;if(dirname(p)===p)throw Error('Dependência fora da pasta permitida');}}
// Only the byte-exact converter-owned encoder has internal Browserify requires.
// A filename or a user-authored manifest alone must never bypass dependency checks.
async function verifiedQrBundle(item,bytes){
 if(basename(item.path)!=='gt-qr.js')return false;
 const manifestPath=join(dirname(item.path),'manifest.json');let info;
 try{info=await lstat(manifestPath);}catch(e){if(e.code==='ENOENT')return false;throw e;}
 await noLinks(item.root,manifestPath);if(!info.isFile()||info.size>8*1024**2)throw Error('Manifesto GTZIP inválido na cópia de dependências');
 const manifest=JSON.parse(await readFile(manifestPath,'utf8'));
 if(manifest.sourceFormat!=='GTZIP')return false;
 if(manifest.format!==2||!Array.isArray(manifest.files)||manifest.files.length>4096||!Array.isArray(manifest.fields)||!manifest.fields.some(f=>f.type==='QRCode'))throw Error('Contrato QR GTZIP inválido na cópia de dependências');
 for(const [name,expected,actual]of [['gt-qr.js',qrRuntime,bytes],['QR-LICENSE.txt',qrLicense,null]]){
  const entries=manifest.files.filter(f=>f.path===name);
  if(entries.length!==1||entries[0].size!==expected.length||entries[0].sha256!==hash(expected))throw Error('Registro QR GTZIP não corresponde ao encoder local: '+name);
  const path=join(dirname(item.path),name);await noLinks(item.root,path);const stat=await lstat(path);
  if(!stat.isFile()||stat.size!==expected.length)throw Error('Arquivo QR GTZIP alterado: '+name);
  if(hash(actual||await readFile(path))!==hash(expected))throw Error('Arquivo QR GTZIP alterado: '+name);
 }
 return true;
}
export function staticReferences(source,extension){
 if(/\.[cm]?js$/.test(extension))source=withoutJSComments(source);
 const refs=[];const add=(value,kind)=>{if(value)refs.push({value,kind});};
 if(/\.html?$/.test(extension)){
  for(const m of source.matchAll(/\b(?:src|href|poster)\s*=\s*["']([^"']+)["']/gi))add(m[1],'html');
  for(const m of source.matchAll(/\bsrcset\s*=\s*["']([^"']+)["']/gi))for(const part of m[1].split(','))add(part.trim().split(/\s+/)[0],'html');
 }
 if(/\.(?:css|html?)$/.test(extension)){
  for(const m of source.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)|@import\s+["']([^"']+)["']/gi))add(m[1]||m[2],'css');
 }
 if(/\.(?:[cm]?js|html?)$/.test(extension)){
  for(const m of source.matchAll(/\b(?:import|export)\s+(?:[^;\r\n]*?\s+from\s*)?["']([^"']+)["']|\b(?:import|require|fetch)\s*\(\s*["']([^"']+)["']\s*(?:\)|,)|\bnew\s+URL\s*\(\s*["']([^"']+)["']\s*,\s*import\.meta\.url\s*\)/g))add(m[1]||m[2]||m[3],/^(?:fetch|new\s+URL)\b/.test(m[0])?'js-asset':'js-module');
 }
 return refs;
}
export async function collectStaticDependencies(dependencies,{installationRoot,maxFiles=1000,maxBytes=2*1024**3}={}){
 const found=new Map(),directories=[],diagnostics=[],scanned=new Set();let bytes=0;
 const add=async(path,root)=>{path=resolve(path);root=resolve(root);if(!inside(root,path))throw Error('Dependência sai da pasta permitida: '+path);await noLinks(root,path);const stat=await lstat(path);if(stat.isDirectory())return; if(!stat.isFile())throw Error('Dependência não é arquivo: '+path);if(found.has(path))return;if(found.size>=maxFiles||(bytes+=stat.size)>maxBytes)throw Error('Dependências excedem '+maxFiles+' arquivos/'+maxBytes+' bytes');found.set(path,{path,root,size:stat.size});};
 const tree=async(dir,root,depth=0)=>{if(depth>12)throw Error('Pasta de dependências profunda demais');await noLinks(root,dir);for(const e of await readdir(dir,{withFileTypes:true})){const path=join(dir,e.name);if(e.isSymbolicLink())throw Error('Link não permitido: '+path);if(e.isDirectory())await tree(path,root,depth+1);else if(e.isFile())await add(path,root);}};
 for(const d of dependencies.filter(d=>d.status==='directory')){directories.push(d.path);await tree(resolve(d.path),resolve(d.path));}
 for(const d of dependencies.filter(d=>d.status==='external-file')){const path=resolve(d.path),root=installationRoot&&inside(resolve(installationRoot),path)?resolve(installationRoot):dirname(path);await add(path,root);}
 for(let round=0;round<24;round++){
  const pending=[...found.values()].filter(f=>/\.(?:html?|css|[cm]?js)$/i.test(f.path)&&!scanned.has(f.path));if(!pending.length)break;
  for(const item of pending){scanned.add(item.path);if(item.size>2*1024**2)throw Error('Código estático maior que 2 MB: '+item.path);const code=await readFile(item.path),source=code.toString('utf8'),extension=extname(item.path).toLowerCase();
   if(await verifiedQrBundle(item,code)){await add(join(dirname(item.path),'manifest.json'),item.root);await add(join(dirname(item.path),'QR-LICENSE.txt'),item.root);diagnostics.push({path:item.path,status:'verified-offline-qr-bundle',detail:'Encoder GTZIP local byte-idêntico; SHA/tamanho/manifesto/licença conferidos. Requires internos não são arquivos externos.'});continue;}
   if(/\b(?:import|require|fetch)\s*\(\s*(?![\s"'])[^)]/.test(source))diagnostics.push({path:item.path,status:'dynamic-reference',detail:'Expressão dinâmica exige diagnóstico em execução; não foi copiada por suposição'});
   let base=dirname(item.path);const baseHref=/\.html?$/.test(extension)?source.match(/<base\b[^>]*href\s*=\s*["']([^"']+)["']/i)?.[1]:null;
   if(baseHref){if(/^[a-z][a-z0-9+.-]*:|^\/\//i.test(baseHref)){diagnostics.push({path:item.path,status:'remote-base',detail:baseHref});continue;}base=resolve(base,baseHref);if(!inside(item.root,base))throw Error('Base HTML sai da pasta permitida');}
   for(const {value,kind} of staticReferences(source,extension)){
    const raw=value.trim();if(!raw||raw.startsWith('#')||/^(?:data|blob|mailto|javascript):/i.test(raw))continue;
    if(/^[a-z][a-z0-9+.-]*:|^\/\//i.test(raw)){if(/^file:/i.test(raw)){const target=fileURLToPath(new URL(raw));if(!inside(item.root,target))throw Error('Dependência file:// fora da pasta permitida');await add(target,item.root);}else diagnostics.push({path:item.path,status:'remote-reference',detail:raw});continue;}
    if(kind==='js-module'&&!/^(?:\.{1,2}\/|\/)/.test(raw)){diagnostics.push({path:item.path,status:'bare-module',detail:raw});continue;}
    if(kind==='js-asset'&&/^\/(?:api|socket\.io)(?:\/|$)/.test(raw)){diagnostics.push({path:item.path,status:'runtime-endpoint',detail:raw});continue;}
    const target=raw.startsWith('/')?resolve(item.root,'.'+decodeURIComponent(raw.split(/[?#]/)[0])):resolve(base,decodeURIComponent(raw.split(/[?#]/)[0]));if(!inside(item.root,target))throw Error('Dependência relativa sai da pasta permitida: '+raw);
    await add(target,item.root).catch(e=>{throw Error('Dependência estática ausente/insegura: '+raw+' · '+e.message);});
   }
  }
 }
 if([...found.values()].some(f=>/\.(?:html?|css|[cm]?js)$/i.test(f.path)&&!scanned.has(f.path)))throw Error('Dependências transitivas excedem 24 níveis');
 return {files:[...found.values()],directories,diagnostics,parser:'Referências literais estáticas HTML/CSS/JS; não executa código nem resolve bundlers/import maps/expressões dinâmicas'};
}
