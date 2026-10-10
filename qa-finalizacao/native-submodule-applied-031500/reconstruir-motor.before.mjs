import fs from 'node:fs/promises';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const repo=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const manifest=JSON.parse(await fs.readFile(join(repo,'fork/manifest.json'),'utf8'));
for(const p of manifest.patches){if(!/^\d+-[a-zA-Z0-9._-]+\.patch$/.test(p.path))throw Error('Nome de patch inválido');const b=await fs.readFile(join(repo,'fork',p.path));if(createHash('sha256').update(b).digest('hex')!==p.sha256)throw Error('Patch alterado: '+p.path);}
if(process.argv.includes('--check')){console.log(JSON.stringify({patchesVerified:manifest.patches.length,base:manifest.base,networkStarted:false}));process.exit(0);}
const i=process.argv.indexOf('--dest'),dest=resolve(i>=0?process.argv[i+1]||'':join(repo,'native/obs-studio'));
if(await fs.lstat(dest).catch(()=>null))throw Error('Destino existente preservado. Escolha uma pasta nova com --dest');
const git=(args,cwd=repo)=>execFileSync('git',args,{cwd,stdio:'inherit',windowsHide:true});
await fs.mkdir(dirname(dest),{recursive:true});
git(['clone','--depth','1','--branch','32.2.2','--no-checkout',manifest.upstream,dest]);
const base=execFileSync('git',['rev-parse','HEAD'],{cwd:dest,encoding:'utf8',windowsHide:true}).trim();
if(base!==manifest.base)throw Error('Tag upstream difere da base registrada; nenhuma correção automática aplicada');
git(['checkout','-b','freemix/broadcast-suite'],dest);
git(['-c','am.threeWay=false','am','--whitespace=nowarn',...manifest.patches.map(p=>join(repo,'fork',p.path))],dest);
git(['submodule','update','--init','--recursive'],dest);
console.log('Motor reconstruído em '+dest+'. Compile seguindo docs/BUILD-FROM-SOURCE.md.');
