import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const qa=import.meta.dirname,root=path.resolve(qa,'..'),author=path.join(qa,'asio-capabilities-readonly-offside-20261010'),own=path.join(qa,'root-audio-readonly-review-20261010');
const hash=b=>createHash('sha256').update(b).digest('hex');
const ab=await fs.readFile(path.join(author,'ALLOWLIST.json'));assert.equal(hash(ab),'134153503a642e7fb4b4c5bbfe685f89c515045dca3107249643b928d1019160');const al=JSON.parse(ab);
const verified=[];for(const p of al.entries){const b=await fs.readFile(path.join(author,p.path));assert.equal(hash(b),p.sha256);assert.equal(b.length,p.bytes);verified.push({p,b});}
const independent=path.join(qa,'inventory-audio-independent-review-20261010/ALLOWLIST.json'),ib=await fs.readFile(independent);assert.equal(hash(ib),'3754d1f78ddd73b05a8404c09764269134b99b887b8e033213bb5119564f0811');for(const p of JSON.parse(ib).files)assert.equal(hash(await fs.readFile(path.join(path.dirname(independent),p.path))),p.sha256);
const changes=[];for(const p of al.productFiles){const dest=path.resolve(root,p.path);assert(dest.startsWith(root+path.sep));const before=await fs.readFile(dest),after=await fs.readFile(path.join(author,'draft',p.path));assert.equal(hash(before),p.baseline);assert.equal(hash(after),p.draft);changes.push({p,dest,before,after});}
await fs.mkdir(own,{recursive:false});for(const {p,b} of verified){const dest=path.join(own,p.path);await fs.mkdir(path.dirname(dest),{recursive:true});await fs.writeFile(dest,b,{flag:'wx'});}await fs.writeFile(path.join(own,'ALLOWLIST.json'),ab,{flag:'wx'});
const test=spawnSync(process.execPath,[path.join(own,'test.mjs')],{cwd:own,encoding:'utf8'});assert.equal(test.status,0,test.stderr+test.stdout);console.log(test.stdout.trim());
for(const c of changes.filter(c=>/\.m?js$/.test(c.p.path))){const r=spawnSync(process.execPath,['--check',path.join(own,'draft',c.p.path)],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);}
const backups=path.join(qa,'root-audio-readonly-before-20261010');await fs.mkdir(backups,{recursive:false});for(const c of changes){assert.equal(hash(await fs.readFile(c.dest)),c.p.baseline);const b=path.join(backups,c.p.path);await fs.mkdir(path.dirname(b),{recursive:true});await fs.writeFile(b,c.before,{flag:'wx'});}
for(const c of changes){await fs.writeFile(c.dest,c.after);assert.equal(hash(await fs.readFile(c.dest)),c.p.draft);}
const receipt={status:'ROOT_AUDIO_READONLY_FIVE_SOURCE_FILES_INTEGRATED_PENDING_BUILD_REAL_QA',at:new Date().toISOString(),authorAllowlistSha256:hash(ab),independentAllowlistSha256:hash(ib),productFiles:al.productFiles,RootModels:25,syntaxChecks:2,NativeBuilt:false,NativeExecuted:false,operatorTouched:false,DirectOutDirtyFormPending:true,newPackageApproved:false};await fs.writeFile(path.join(qa,'root-audio-readonly-integration.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({status:receipt.status,files:changes.length}));
