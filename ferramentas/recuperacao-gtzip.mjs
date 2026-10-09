import {join,resolve,relative,isAbsolute,dirname} from 'node:path';
import {lstat,mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const token=/^[a-f0-9]{64}\.(?:png|jpe?g|webp|bmp|ttf|otf|woff2)$/i;
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');

export function gtRecoveryDependencies(root,metadata) {
  const paths=new Set();
  for(const data of metadata)for(const record of data.imports||[]) {
    if(!uuid.test(record.id))throw Error('ID GTZIP inválido na recuperação');
    paths.add(join(root,'painel/gc/gt_titles','gt_'+record.id));
    for(const value of Object.values(record.values||{}))if(typeof value==='string'&&value.startsWith('library:')) {
      const asset=value.slice(8);if(!token.test(asset))throw Error('Asset GTZIP inválido na recuperação');
      paths.add(join(root,'painel/gc/biblioteca/assets',asset));
    }
  }
  return [...paths].map(path=>({path}));
}

async function noLinks(path) {
  for(let p=resolve(path);;p=dirname(p)) {
    const info=await lstat(p).catch(e=>{if(e.code==='ENOENT')return null;throw e;});
    if(info?.isSymbolicLink())throw Error('Link não permitido nos títulos recuperados');
    if(dirname(p)===p)break;
  }
}

export async function restoreGtTitles(root,manifest,files) {
  const metadata=files.get('metadata/freemix-gc.json');if(!metadata)return {restoredFiles:0,titles:0};
  const data=JSON.parse(metadata.toString('utf8')), records=data.imports||[];
  if(!Array.isArray(records)||records.length>200)throw Error('Registros GTZIP inválidos na recuperação');
  const ids=new Set(records.map(record=>{if(!uuid.test(record.id))throw Error('ID GTZIP inválido na recuperação');return record.id.toLowerCase();}));
  const folder=resolve(root,'painel/gc/gt_titles'),copies=[],counts=new Map();let total=0;
  const expectedFiles=new Map((manifest.files||[]).map(file=>[file.path,file]));
  for(const asset of manifest.assets||[]) {
    const original=String(asset.original).replaceAll('\\','/');
    const match=original.match(/\/painel\/gc\/gt_titles\/gt_([a-f0-9-]{36})\/(.+)$/i);
    if(!match||!ids.has(match[1].toLowerCase()))continue;
    const suffix=match[2];
    if(suffix.split('/').some(part=>!part||part==='.'||part==='..'||/[\\:\x00-\x1f]/.test(part)))throw Error('Caminho de título recuperado inválido');
    const target=resolve(folder,'gt_'+match[1],suffix),rel=relative(folder,target);
    if(!rel||isAbsolute(rel)||rel.startsWith('..'))throw Error('Título fora da pasta de recuperação');
    const entry=files.get(asset.path);if(!entry?.source)throw Error('Título sem conteúdo verificado');
    const bytes=await readFile(entry.source);total+=bytes.length;
    if(bytes.length>64*1024*1024||total>512*1024*1024||copies.length>=10000)throw Error('Títulos recuperados excedem o limite');
    const hash=digest(bytes),expected=expectedFiles.get(asset.path);
    if(!expected||expected.sha256!==hash||expected.size!==bytes.length)throw Error('Título mudou após verificar o backup');
    await noLinks(target);
    const existing=await readFile(target).catch(e=>{if(e.code==='ENOENT')return null;throw e;});
    if(existing&&digest(existing)!==hash)throw Error('Título GTZIP existente mudou; original preservado: '+match[1]+'/'+suffix);
    copies.push({target,bytes,existing:!!existing});
    const names=counts.get(match[1].toLowerCase())||new Set();names.add(suffix);counts.set(match[1].toLowerCase(),names);
  }
  for(const id of ids)if(!counts.get(id)?.has('index.html')||!counts.get(id)?.has('manifest.json'))throw Error('Backup sem os arquivos do GTZIP '+id+'; refaça a cópia com mídia');
  let restoredFiles=0;
  for(const copy of copies)if(!copy.existing){await mkdir(dirname(copy.target),{recursive:true});await noLinks(copy.target);await writeFile(copy.target,copy.bytes,{flag:'wx'});restoredFiles++;}
  return {restoredFiles,titles:ids.size};
}
