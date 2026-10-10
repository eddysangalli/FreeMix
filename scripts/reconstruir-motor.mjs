// DRAFT ONLY: validate source archive, initialize official submodules, then restore local commits.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const product=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),fork=path.join(product,'fork');
const argv=[];for(let i=2;i<process.argv.length;i++){const arg=process.argv[i];if(arg==='--dest'){const value=process.argv[++i];if(!value||value.startsWith('--'))throw Error('Missing --dest value');argv.push('--dest='+value);}else argv.push(arg);}const check=argv.includes('--check'),destArg=argv.find(a=>a.startsWith('--dest='));
if(argv.some(a=>a!=='--check'&&!a.startsWith('--dest='))||(!check&&!destArg)||argv.filter(a=>a.startsWith('--dest=')).length>1)throw Error('Use --check or explicit --dest=NEW_DIRECTORY');
const git=(repo,args,input)=>execFileSync('git',[...(repo?['-C',repo]:[]),...args],{input,windowsHide:true,maxBuffer:64*1024*1024,env:{...process.env,GIT_TERMINAL_PROMPT:'0'}});
const text=(repo,args)=>git(repo,args).toString().trim(),sha=b=>createHash('sha256').update(b).digest('hex');
const oid=x=>{if(!/^[0-9a-f]{40}$/.test(x))throw Error('Invalid Git object');return x;};
const safe=x=>{if(typeof x!=='string'||!x||path.isAbsolute(x)||x.includes('\\')||x.split('/').some(v=>!v||v==='.'||v==='..'||v.toLowerCase()==='.git'||/[<>:"|?*\x00-\x1f]/.test(v)))throw Error('Unsafe archive path');return x;};
async function regular(root,name){safe(name);let at=root;for(const v of name.split('/')){at=path.join(at,v);const stat=await fs.lstat(at);if(stat.isSymbolicLink())throw Error('Archive symlink refused');}const stat=await fs.stat(at);if(!stat.isFile())throw Error('Archive regular file required');return fs.readFile(at);}
const manifest=JSON.parse(await fs.readFile(path.join(fork,'manifest.json'),'utf8'));oid(manifest.base);oid(manifest.head);if(manifest.tree)oid(manifest.tree);
for(const p of manifest.patches){const data=await regular(fork,p.path);if(sha(data)!==p.sha256)throw Error('Parent patch SHA mismatch');}
const verificationPath=path.join(fork,'source-verification.json');try{const receipt=JSON.parse(await fs.readFile(verificationPath,'utf8'));if(receipt.head!==manifest.head||receipt.resultTree!==manifest.tree)throw Error('Source verification identity mismatch');for(const f of receipt.sourceFiles||[]){const data=await regular(path.join(product,'docs/native-source'),f.path);if(data.length!==f.bytes||sha(data)!==f.sha256)throw Error('Committed source SHA mismatch');}}catch(e){if(e.code!=='ENOENT')throw e;if(manifest.sourceSchema===2)throw Error('Schema2 source verification required');}
const modules=manifest.submodules||[],modulePaths=new Set();
for(const m of modules){safe(m.path);if(modulePaths.has(m.path))throw Error('Duplicate submodule');modulePaths.add(m.path);for(const k of ['base','baseTree','head','headTree'])oid(m[k]);let parent=m.base,lastTree=m.baseTree;
 for(const p of m.patches){for(const k of ['commit','parent','tree'])oid(p[k]);const patch=await regular(fork,p.path),raw=await regular(fork,p.rawCommitPath);if(sha(patch)!==p.sha256||sha(raw)!==p.rawCommitSha256)throw Error('Submodule patch/raw SHA mismatch');const header=raw.toString().split('\n\n')[0],parents=[...header.matchAll(/^parent ([0-9a-f]{40})$/gm)].map(v=>v[1]);if(p.parent!==parent||parents.length!==1||parents[0]!==parent||!header.startsWith('tree '+p.tree+'\n'))throw Error('Submodule metadata mismatch');
  if(git(null,['hash-object','-t','commit','--stdin'],raw).toString().trim()!==p.commit||!patch.toString().startsWith('From '+p.commit+' '))throw Error('Submodule commit object mismatch');parent=p.commit;lastTree=p.tree;
 }
 if(parent!==m.head||lastTree!==m.headTree)throw Error('Submodule final tree/head mismatch');
 for(const f of m.sourceFiles||[]){const data=await regular(path.join(product,'docs/native-source'),f.path);if(data.length!==f.bytes||sha(data)!==f.sha256)throw Error('Committed submodule source SHA mismatch');}
}
if(check){console.log(JSON.stringify({status:'PASS',checkOnly:true,networkStarted:false,parentPatches:manifest.patches.length,submodules:modules.length}));process.exit(0);}
const dest=path.resolve(destArg.slice(7));if(dest===path.parse(dest).root)throw Error('Root destination refused');try{await fs.lstat(dest);throw Error('Fresh destination required');}catch(e){if(e.code!=='ENOENT')throw e;}
let ancestor=path.dirname(dest);while(true){try{const stat=await fs.lstat(ancestor);if(stat.isSymbolicLink())throw Error('Destination symlink ancestor refused');}catch(e){if(e.code!=='ENOENT')throw e;}if(ancestor===path.parse(ancestor).root)break;ancestor=path.dirname(ancestor);}
await fs.mkdir(path.dirname(dest),{recursive:true});git(null,['clone','--no-checkout','--branch',manifest.upstreamRef||'32.2.2',manifest.upstream,dest]);if(text(dest,['rev-parse','HEAD'])!==manifest.base)throw Error('Official upstream ref differs from pinned base');git(dest,['checkout','-b','freemix-reconstructed',manifest.base]);
// Only the official base is fetched. Parent patches may reference a local-only child commit.
git(dest,['submodule','update','--init','--recursive']);
for(const m of modules){const repo=path.join(dest,m.path);if(text(repo,['rev-parse','HEAD'])!==m.base||text(repo,['rev-parse','HEAD^{tree}'])!==m.baseTree||text(dest,['ls-tree',manifest.base,'--',m.path])!==`160000 commit ${m.base}\t${m.path}`)throw Error('Official submodule baseline mismatch');}
for(const p of manifest.patches)git(dest,['-c','user.name=FreeMix Source Reconstruction','-c','user.email=source-reconstruction@invalid','am',path.join(fork,p.path)]);
if(manifest.tree&&text(dest,['rev-parse','HEAD^{tree}'])!==manifest.tree)throw Error('Reconstructed parent tree mismatch');
for(const m of modules){const repo=path.join(dest,m.path);if(text(dest,['ls-tree','HEAD','--',m.path])!==`160000 commit ${m.head}\t${m.path}`)throw Error('Parent patch gitlink differs from archived child HEAD');for(const p of m.patches){if(text(repo,['rev-parse','HEAD'])!==p.parent||text(repo,['status','--porcelain','--untracked-files=no']))throw Error('Submodule patch baseline mismatch');git(repo,['-c','user.name=FreeMix Source Reconstruction','-c','user.email=source-reconstruction@invalid','am',path.join(fork,p.path)]);if(text(repo,['rev-parse','HEAD^{tree}'])!==p.tree)throw Error('Applied submodule tree mismatch');const raw=await regular(fork,p.rawCommitPath),restored=git(repo,['hash-object','-w','-t','commit','--stdin'],raw).toString().trim();if(restored!==p.commit)throw Error('Restored submodule commit mismatch');git(repo,['reset','--hard',p.commit]);}
 if(text(repo,['rev-parse','HEAD'])!==m.head||text(repo,['rev-parse','HEAD^{tree}'])!==m.headTree||text(repo,['status','--porcelain','--untracked-files=no']))throw Error('Final submodule mismatch');
}
if(text(dest,['status','--porcelain','--untracked-files=no']))throw Error('Final reconstructed checkout dirty');
console.log(JSON.stringify({status:'PASS',destination:dest,parentTree:text(dest,['rev-parse','HEAD^{tree}']),submodules:modules.map(m=>({path:m.path,head:m.head,tree:m.headTree})),nativeBuildStarted:false,localChildHeadFetched:false}));
