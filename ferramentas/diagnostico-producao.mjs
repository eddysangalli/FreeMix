import {readdir,lstat,readFile,writeFile,mkdir,open,rename,unlink} from 'node:fs/promises';
import {join,resolve,relative,basename} from 'node:path';
import {hostname,platform,release,arch,cpus,totalmem} from 'node:os';
import {randomUUID,createHash} from 'node:crypto';
import {zipDiagnostics,readDiagnosticZip} from './diagnostico-zip.mjs';

const MAX_FILE=1024*1024,MAX_TOTAL=16*1024*1024,MAX_FILES=70;
const hash=data=>createHash('sha256').update(data).digest('hex');
const safe=n=>String(n).normalize('NFKD').replace(/[^A-Za-z0-9_.-]/g,'_').slice(0,100);
async function regular(path){try{const s=await lstat(path);return !s.isSymbolicLink()&&s.isFile()?s:null;}catch{return null;}}
async function directory(path){try{const s=await lstat(path);return !s.isSymbolicLink()&&s.isDirectory();}catch{return false;}}
async function insideWithoutLinks(root,path){const rel=relative(root,path);if(!rel||rel.startsWith('..')||resolve(root,rel)!==resolve(path))return false;let current=root;for(const part of rel.split(/[\\/]/)){current=join(current,part);const s=await lstat(current).catch(()=>null);if(!s||s.isSymbolicLink())return false;}return true;}
async function textSmall(path){const s=await regular(path);if(!s||s.size>256*1024)return '';return readFile(path,'utf8');}
export function redactDiagnostic(text,secrets=[],paths=[]){
 let s=String(text);
 for(const secret of [...new Set(secrets)].filter(x=>typeof x==='string'&&x.length>=4).sort((a,b)=>b.length-a.length))s=s.split(secret).join('[credencial omitida]');
 for(const path of paths.filter(Boolean).sort((a,b)=>b.length-a.length)){s=s.split(path).join('[pasta local]');s=s.split(path.replaceAll('\\','/')).join('[pasta local]');}
 s=s.replace(/\b(?:https?|rtmps?|srt|rist|turns?|stun):[^\s<>"']+/gi,'[endereço omitido]');
 s=s.replace(/((?:authorization|proxy-authorization)\s*[:=]\s*)(?:Bearer\s+|Basic\s+)?[^\r\n,}]+/gi,'$1[omitido]');
 s=s.replace(/((?:["']?)(?:password|passwd|passphrase|secret|token|api[_-]?key|apiToken|stream[_-]?key|streamKey|key|pin|username|credential|server)(?:["']?)\s*[:=]\s*)(?:"[^"\r\n]*"|'[^'\r\n]*'|[^\s,;}\r\n]+)/gi,'$1[omitido]');
 s=s.replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,'[email omitido]');
 s=s.replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g,'[IP omitido]');
 s=s.replace(/\[(?:[0-9a-f]{0,4}:){2,}[0-9a-f:]+\]/gi,'[IP omitido]');
 s=s.replace(/\b[A-Za-z]:[\\/](?:[^\r\n"<>|]*?)(?=\s{2}|["<>|]|\r?\n|$)/g,'[caminho local omitido]');
 s=s.replace(/\\\\[^\s"<>]+/g,'[caminho de rede omitido]');
 return s;
}
async function knownSecrets(root){
 const paths=[join(root,'config','obs-studio','plugin_config','obs-websocket','config.json'),join(root,'config','obs-studio','plugin_config','freemix-control','acesso.json'),join(root,'painel','local.js')];
 const profiles=join(root,'config','obs-studio','basic','profiles');if(await directory(profiles))for(const p of await readdir(profiles)){if(await directory(join(profiles,p)))paths.push(join(profiles,p,'service.json'),join(profiles,p,'basic.ini'));}
 const control=join(root,'config','obs-studio','plugin_config','freemix-control');if(await directory(control))for(const name of await readdir(control)){if(/\.(json|ini)$/i.test(name))paths.push(join(control,name));}
 const secrets=[];for(const path of paths.slice(0,100)){if(!await insideWithoutLinks(root,path))continue;const text=await textSmall(path);for(const match of text.matchAll(/["']?(?:password|passwd|passphrase|secret|token|apiToken|api[_-]?key|stream[_-]?key|streamKey|key|pin|credential|username)["']?\s*[:=]\s*(?:"([^"\r\n]+)"|'([^'\r\n]+)'|([^\s,;}\r\n]+))/gi))secrets.push(match[1]||match[2]||match[3]);}
 return secrets;
}
async function gather(root){
 const list=[],add=async(folder,kind,depth=0)=>{if(depth>3||!await insideWithoutLinks(root,folder)||!await directory(folder))return;const entries=await readdir(folder,{withFileTypes:true});for(const e of entries.slice(0,300)){const p=join(folder,e.name);if(e.isSymbolicLink())continue;if(e.isDirectory()&&kind==='plugins')await add(p,kind,depth+1);else if(e.isFile()&&/\.(log|txt|ndjson)$/i.test(e.name)&&!/(secret|credential|token|password|config|preset)/i.test(e.name)){const s=await regular(p);if(s)list.push({path:p,kind,size:s.size,mtime:s.mtimeMs});}}};
 const config=join(root,'config','obs-studio');await add(join(config,'crashes'),'crash');await add(join(config,'logs'),'motor');
 await add(join(config,'plugin_config'),'plugins');await add(join(root,'logs'),'launcher');await add(join(root,'runtime','logs'),'launcher');
 return list.sort((a,b)=>(a.kind==='crash'?-1:0)-(b.kind==='crash'?-1:0)||b.mtime-a.mtime).slice(0,MAX_FILES);
}
async function boundedRead(path,size){const f=await open(path,'r');try{if(size<=MAX_FILE){const buffer=Buffer.alloc(size),r=await f.read(buffer,0,size,0);return {bytes:buffer.subarray(0,r.bytesRead),truncated:false};}const head=Buffer.alloc(64*1024),tail=Buffer.alloc(MAX_FILE-head.length);const h=await f.read(head,0,head.length,0),t=await f.read(tail,0,tail.length,Math.max(0,size-tail.length));const first=head.subarray(0,h.bytesRead),last=tail.subarray(0,t.bytesRead),headNewline=first.lastIndexOf(10),tailNewline=last.indexOf(10);return {bytes:Buffer.concat([headNewline<0?Buffer.alloc(0):first.subarray(0,headNewline+1),Buffer.from('\n[FreeMix: trecho intermediário e linhas cortadas omitidos por tamanho]\n'),tailNewline<0?Buffer.alloc(0):last.subarray(tailNewline+1)]),truncated:true};}finally{await f.close();}}
export class DiagnosticCollector{
 constructor(root){this.root=resolve(root);this.folder=join(this.root,'diagnosticos');this.busy=null;this.last=null;}
 async generate({note='',machineName=hostname()}={}){if(this.busy)throw Error('Um diagnóstico já está sendo gerado');this.busy=this.create({note,machineName});try{return await this.busy;}finally{this.busy=null;}}
 async create({note,machineName}){
  if(!await directory(this.root))throw Error('Instalação não encontrada');if((await lstat(this.folder).catch(()=>null))?.isSymbolicLink())throw Error('Pasta de diagnóstico inválida');await mkdir(this.folder,{recursive:true});
  const secrets=await knownSecrets(this.root),paths=[this.root,process.env.USERPROFILE,process.env.TEMP,process.env.TMP];const redact=s=>redactDiagnostic(s,secrets,paths);const files=[],collected=[],omitted=[];let total=0;
  for(const item of await gather(this.root)){if(total>=MAX_TOTAL){omitted.push('Limite total de logs atingido');break;}const stat=await regular(item.path);if(!stat)continue;try{const read=await boundedRead(item.path,stat.size),data=Buffer.from(redact(read.bytes.toString('utf8')));if(total+data.length>MAX_TOTAL){omitted.push('Log omitido por limite total');continue;}total+=data.length;const name=`logs/${item.kind}/${String(collected.length+1).padStart(3,'0')}-${safe(basename(item.path))}`;files.push({name,data});collected.push({name,originalBytes:stat.size,bytes:data.length,truncated:read.truncated,modifiedAt:new Date(stat.mtimeMs).toISOString()});}catch{omitted.push('Log indisponível durante a leitura');}}
  let instanceId;const idFile=join(this.folder,'instancia.txt');const old=await textSmall(idFile);if(/^[0-9a-f-]{36}$/.test(old.trim()))instanceId=old.trim();else{instanceId=randomUUID();await writeFile(idFile,instanceId,{flag:'wx',mode:0o600}).catch(()=>{});}
  let version='não identificada';try{const v=JSON.parse(await textSmall(join(this.root,'version.json')));version=String(v.version||v.build||version);}catch{}
  const metadata={format:'freemix-diagnostic-1',id:randomUUID(),createdAt:new Date().toISOString(),instanceId,machineName:String(machineName).replace(/[\r\n\0]/g,' ').slice(0,80),version,system:{platform:platform(),release:release(),arch:arch(),cpu:cpus()[0]?.model||'',logicalCpus:cpus().length,memoryGB:Math.round(totalmem()/1024**3)},note:redact(String(note).slice(0,2000)),logs:collected,omitted,privacy:{sent:false,includes:['logs recentes do motor e plugins','relatórios de crash','versão e sistema','nome ou apelido da máquina'],excludes:['senhas e chaves conhecidas','configurações completas e projetos','áudio, vídeo e capturas de tela','dump de memória e documentos pessoais'],notice:'A remoção automática reduz dados privados; revise a prévia antes de compartilhar. Até 70 logs, 1 MB por log e 16 MB de logs no total; arquivos grandes usam início e final.'}};
  files.push({name:'diagnostico.json',data:Buffer.from(JSON.stringify(metadata,null,2))});files.push({name:'LEIA-ME.txt',data:Buffer.from('FreeMix — diagnóstico local\r\nEste ZIP foi gerado no computador e não foi enviado automaticamente.\r\nVeja diagnostico.json para a lista de arquivos, truncamentos e limites.\r\nRevise o conteúdo antes de enviar por e-mail ou WhatsApp.\r\nNão inclui projetos, mídias, configurações completas nem dumps de memória.\r\n')});
  const manifest={format:'freemix-diagnostic-1',files:files.map(f=>({name:f.name,size:f.data.length,sha256:hash(f.data)}))};files.push({name:'manifest.json',data:Buffer.from(JSON.stringify(manifest,null,2))});const zip=await zipDiagnostics(files);await readDiagnosticZip(zip);
  const name=`FreeMix-Diagnostico-${metadata.createdAt.replace(/[^0-9]/g,'').slice(0,14)}-${metadata.id.slice(0,8)}.zip`,destination=join(this.folder,name),temporary=destination+'.tmp';await writeFile(temporary,zip,{flag:'wx',mode:0o600});await rename(temporary,destination);
  // Generated ZIPs only: bounded retention avoids collecting a growing archive into itself.
  const previous=(await readdir(this.folder)).filter(n=>/^FreeMix-Diagnostico-\d{14}-[0-9a-f]{8}\.zip$/.test(n)&&n!==name).sort().reverse();for(const old of previous.slice(4))if(await regular(join(this.folder,old)))await unlink(join(this.folder,old));
  this.last={success:true,id:metadata.id,name,path:destination,size:zip.length,sha256:hash(zip),report:metadata};return this.last;
 }
 async download(id){if(!this.last||id!==this.last.id)throw Error('Gere um diagnóstico nesta sessão');return readFile(this.last.path);}
 summary(){return this.last?{...this.last,path:undefined}:{success:true,ready:true};}
}
