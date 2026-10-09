import {readFile,lstat,mkdir,copyFile} from 'node:fs/promises';
import {isAbsolute,join,dirname} from 'node:path';
import {createHash} from 'node:crypto';
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const safeTarget=target=>typeof target==='string'&&/^(?:obs-plugins\/64bit\/[a-zA-Z0-9_-]+\.dll|licenses\/[a-zA-Z0-9_/.-]+)$/.test(target)&&!target.split('/').some(part=>part==='.'||part==='..'||!part);

// Rebuilt third-party components and their source/licenses are staged into
// a new package only. The source installation is never overwritten.
export async function inspectPackageComponents(manifestPath) {
  if(!manifestPath)return [];
  if(!isAbsolute(manifestPath))throw Error('Manifesto de componentes deve ser absoluto');
  const manifest=JSON.parse(await readFile(manifestPath,'utf8'));
  if(manifest.format!==1||!Array.isArray(manifest.files)||!manifest.files.length||manifest.files.length>50)throw Error('Manifesto de componentes inválido');
  const targets=new Set();
  for(const file of manifest.files) {
    if(!safeTarget(file.target)||targets.has(file.target.toLowerCase()))throw Error('Destino de componente inválido/duplicado');
    targets.add(file.target.toLowerCase());
    if(typeof file.source!=='string'||!isAbsolute(file.source)||!(/^[a-f0-9]{64}$/.test(file.sha256)))throw Error('Componente exige origem absoluta e SHA256');
    if(typeof file.component!=='string'||typeof file.sourceVersion!=='string')throw Error('Componente sem proveniência');
    const info=await lstat(file.source);
    if(!info.isFile()||info.isSymbolicLink()||info.size>256*1024*1024)throw Error('Origem de componente inválida');
    if(digest(await readFile(file.source))!==file.sha256)throw Error('Hash de componente divergiu: '+file.target);
  }
  return manifest.files;
}

export async function copyPackageComponents(newPackage,files) {
  const receipt=[];
  for(const file of files) {
    // Keep validation here too; callers cannot bypass inspect with traversal.
    if(!safeTarget(file.target))throw Error('Destino de componente inválido');
    const target=join(newPackage,file.target);await mkdir(dirname(target),{recursive:true});
    await copyFile(file.source,target);
    if(digest(await readFile(target))!==file.sha256)throw Error('Componente mudou durante a cópia: '+file.target);
    receipt.push({target:file.target,sha256:file.sha256,component:file.component,sourceVersion:file.sourceVersion});
  }
  return receipt;
}
