import fs from 'node:fs/promises';import path from 'node:path';import assert from 'node:assert/strict';
const dir=import.meta.dirname,failed=JSON.parse(await fs.readFile(path.join(dir,'receipt.json')));assert.equal(failed.status,'FAIL');assert.equal(failed.error,'stderr maxBuffer length exceeded');assert(failed.nativeClosed&&failed.apiClosed&&!failed.forcedOwnNativeCleanup&&!failed.crashArtifacts);const source=await fs.readFile(path.join(dir,'run.mjs'),'utf8');let draft=source;
const substitutions=[
 ["const root=await fs.mkdtemp(path.join(os.tmpdir(),'FreeMix-QA-SrtHdrNative24-')),r=", "const root=JSON.parse(await fs.readFile(path.join(out,'own-root.json'))).root,r="],
 ["await fs.writeFile(path.join(out,'own-root.json'),JSON.stringify({root},null,2),{flag:'wx'});", "assert(root.startsWith(path.join(os.tmpdir(),'FreeMix-QA-SrtHdrNative24-')));r.reusesClosedOwnInstallation=true;"],
 ["path.join(out,'receipt.json')", "path.join(out,'retry1-receipt.json')"],
 ["const {installPortable}=await import(pathToFileURL(path.join(candidate.packageRoot,'ferramentas/instalar-portatil.mjs')).href);assert.equal((await installPortable(candidate.packageRoot,root,{apiPort:r.apiPort,wsPort:r.wsPort})).manifestHash,candidate.manifestHash);console.log('Own signed base installed');", "const prior=JSON.parse(await fs.readFile(path.join(out,'receipt.json')));assert(prior.nativeClosed&&prior.apiClosed&&!prior.forcedOwnNativeCleanup);assert.equal(JSON.parse(await fs.readFile(path.join(root,'installation.json'))).manifestHash,candidate.manifestHash);console.log('Own closed signed base reused; no reinstall');"],
 ["'-bsf:v','trace_headers'", "'-bsf:v','filter_units=pass_types=32|33|34,trace_headers'"],
 ["const scene='OWN Native24 SRT HDR';", "const scene='OWN Native24 SRT HDR '+Date.now();"],
 ["inputName:'OWN SDR reject'", "inputName:scene+' SDR reject'"],
 ["const busy=await hdr('configure',0,cfg(0));", "const closeGuard=await vendor('shutdown_idle',{qaClose:true});assert.equal(closeGuard.success,false);check('shutdown_idle refuses pending HDR resources');const busy=await hdr('configure',0,cfg(0));"],
];for(const [from,to] of substitutions){assert(draft.includes(from),'Expected exact runner snippet');draft=draft.replaceAll(from,to);}await fs.writeFile(path.join(dir,'run-retry1.mjs'),draft,{flag:'wx'});console.log('Own retry prepared; original FAIL receipt and runner preserved');
