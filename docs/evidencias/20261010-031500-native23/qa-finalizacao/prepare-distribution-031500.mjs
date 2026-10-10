import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const base=path.resolve('qa-finalizacao/distribution-031500');
const sha=b=>createHash('sha256').update(b).digest('hex');
const candidateFile=path.resolve('qa-finalizacao/candidate-release-031500.json');
const bytes=await fs.readFile(candidateFile),candidate=JSON.parse(bytes);
assert.equal(sha(bytes),'f0457a3f5afed47b62eb8e1ef943b0b15b32441d0c51cf1d2f14b3048cc06bba');
assert.equal(candidate.status,'PACKAGE_VERIFIED');
assert.equal(candidate.nativeCommit,'500ced5ea0928453f9f27dc7d5649531e2671e28');
assert.equal(sha(await fs.readFile(path.join(candidate.packageRoot,'manifest.json'))),candidate.manifestHash);
await fs.mkdir(base);await fs.mkdir(path.join(base,'installer'));
const files=[];
for(const name of ['build.mjs','Setup.cs','Uninstall.cs']){
 const source=path.resolve('scripts/installer-windows',name),target=path.join(base,'installer',name),data=await fs.readFile(source);
 await fs.writeFile(target,data,{flag:'wx'});files.push({source,path:target,sha256:sha(data),byteIdentical:true});
}
const guards=[];
for(const f of [candidateFile,'qa-finalizacao/full-payload-verificado-031500.json','scripts/distribuicao/zip-pacote-verificado.py','entregas/INSTALADOR-ATUAL.json','qa-finalizacao/package-native-startup-031500-composite.json','qa-finalizacao/package-native-startup-031500-composite-allowlist.json'])guards.push({path:path.resolve(f),sha256:sha(await fs.readFile(f))});
for(const f of [candidate.packageRoot+'.zip',path.resolve('entregas/FreeMix-Studio-Setup-'+candidate.version+'.exe')])assert.equal(await fs.access(f).then(()=>true,()=>false),false,'Output exists: '+f);
const result={status:'PREPARED',at:new Date().toISOString(),candidate,candidateFile,files,guards,installerBuildOwnDirectory:true,packageModified:false,operatorTouched:false,selectionChanged:false,authenticodeSigned:false};
await fs.writeFile(path.join(base,'preparation.json'),JSON.stringify(result,null,2),{flag:'wx'});
console.log(JSON.stringify({status:result.status,base,preparationSha256:sha(await fs.readFile(path.join(base,'preparation.json')))}));
