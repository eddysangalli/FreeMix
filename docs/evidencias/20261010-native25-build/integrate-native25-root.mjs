import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root=process.cwd(), native=path.join(root,'freemix-app'), out=path.join(root,'qa-finalizacao/native25-root-integration');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const hash=p=>sha(fs.readFileSync(p));
const need=(x,m)=>{if(!x)throw new Error(m);};
need(!fs.existsSync(out),'Integration directory already exists; never overwrite an earlier receipt');
need(execFileSync('git',['rev-parse','HEAD'],{cwd:native,encoding:'utf8'}).trim()==='a04786090fcbe7ede495f18e5ad38ccaa9793478','Unexpected Native HEAD');
need(!execFileSync('git',['status','--porcelain'],{cwd:native,encoding:'utf8'}).trim(),'Native checkout is dirty');
const fronts=[
 ['calls-native-continuous-rational-draft','a183644736f2861f2c253580b557692990afe0f3bbe5fc4eaa7dd2f40a88e468'],
 ['ftb-native-implementation-draft','50bf3e6a88652ee089b211d7293f766a1e39804b541ddc7e801ba742b45b0a9b'],
 ['native-editor-observability-20261010',null]
];
const manifests=[];
for(const [name,pin] of fronts){const dir=path.join(root,'qa-finalizacao',name), file=path.join(dir,'ALLOWLIST.json'), actual=hash(file);if(pin)need(actual===pin,`${name} freeze changed`);const list=JSON.parse(fs.readFileSync(file));for(const item of list.files){const target=path.resolve(dir,item.path);need(target.startsWith(dir+path.sep),'Invalid frozen path');need(hash(target)===item.sha256,`Frozen hash mismatch ${name}/${item.path}`);if(item.bytes!==undefined)need(fs.statSync(target).size===item.bytes,'Frozen size mismatch');}manifests.push({name,sha256:actual,list});}
const stage=path.join(out,'stage'), backups=path.join(out,'before');
fs.mkdirSync(stage,{recursive:true});
const oldPaths=['frontend/widgets/FreeMixMultistream.cpp','frontend/widgets/OBSBasic.hpp','frontend/widgets/OBSBasic_Transitions.cpp','frontend/widgets/OBSBasic_MainControls.cpp','frontend/cmake/ui-widgets.cmake'];
const before=[];
for(const rel of oldPaths){const original=path.join(native,rel),target=path.join(stage,rel),backup=path.join(backups,rel);fs.mkdirSync(path.dirname(target),{recursive:true});fs.mkdirSync(path.dirname(backup),{recursive:true});fs.copyFileSync(original,target);fs.copyFileSync(original,backup);before.push({path:rel,sha256:hash(original)});}
const ftb=manifests[1];for(const item of ftb.list.nativeFiles){if(item.baseSha256)need(hash(path.join(native,item.path))===item.baseSha256,`FTB baseline drift ${item.path}`);}
const calls=manifests[0];for(const rel of ['FreeMixMultistream.cpp','ui-widgets.cmake']){const live=rel.endsWith('.cmake')?'frontend/cmake/'+rel:'frontend/widgets/'+rel;need(hash(path.join(native,live))===hash(path.join(root,'qa-finalizacao',calls.name,'baseline',rel)),`Calls baseline drift ${rel}`);}
for(const item of manifests[2].list.product)need(hash(path.join(root,item.target))===item.beforeSha256,`Editor baseline drift ${item.target}`);
const apply=(file,strip=1)=>{execFileSync('git',['apply',`-p${strip}`,'--check',file],{cwd:stage,stdio:'pipe'});execFileSync('git',['apply',`-p${strip}`,file],{cwd:stage,stdio:'pipe'});};
apply(path.join(root,'qa-finalizacao',calls.name,'central-integration.patch'));
for(const filename of ['FreeMixCallVideo.cpp','FreeMixCallVideo.hpp','FreeMixCallVideoPool.hpp','FreeMixCallVideoIpc.hpp','FreeMixCallVideoPolicy.hpp'])fs.copyFileSync(path.join(root,'qa-finalizacao',calls.name,'draft',filename),path.join(stage,'frontend/widgets',filename));
for(const item of ftb.list.nativeFiles){if(item.path.endsWith('FreeMixMultistream.cpp'))apply(path.join(root,'qa-finalizacao',ftb.name,'patches/FreeMixMultistream.cpp.patch'));else fs.copyFileSync(path.join(root,'qa-finalizacao',ftb.name,'draft',path.basename(item.path)),path.join(stage,item.path));}
for(const file of ['OBSBasic_MainControls.patch','FreeMixMultistream.patch'])apply(path.join(root,'qa-finalizacao',manifests[2].name,file),2);
const rels=[...oldPaths,...['FreeMixCallVideo.cpp','FreeMixCallVideo.hpp','FreeMixCallVideoPool.hpp','FreeMixCallVideoIpc.hpp','FreeMixCallVideoPolicy.hpp','FreeMixFtbContract.hpp'].map(x=>'frontend/widgets/'+x)];
const after=rels.map(rel=>({path:rel,sha256:hash(path.join(stage,rel)),bytes:fs.statSync(path.join(stage,rel)).size}));
for(const item of before)need(hash(path.join(native,item.path))===item.sha256,`Concurrent baseline change ${item.path}`);
for(const rel of rels.filter(x=>!oldPaths.includes(x)))need(!fs.existsSync(path.join(native,rel)),`New path already exists ${rel}`);
for(const rel of rels)fs.copyFileSync(path.join(stage,rel),path.join(native,rel));
execFileSync('git',['diff','--check'],{cwd:native,stdio:'pipe'});
fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify({status:'ROOT_INTEGRATED_NATIVE25_DRAFT_COMPILE_AND_NATIVE_QA_PENDING',at:new Date().toISOString(),baseHead:'a04786090fcbe7ede495f18e5ad38ccaa9793478',fronts:manifests.map(({name,sha256})=>({name,sha256})),before,after,operatorTouched:false,compiled:false,nativeExecuted:false},null,2)+'\n');
console.log(JSON.stringify({status:'INTEGRATED',files:after.length,receipt:path.join(out,'receipt.json')}));
