import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const receiptPath='qa-finalizacao/cef-nine-native19-final/resultado.json';
const r=JSON.parse(await fs.readFile(receiptPath));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
assert.equal(r.status,'PASS');assert.equal(r.cases.length,9);
assert.equal(r.nativeExit.code,0);assert.deepEqual(r.newCrashes,[]);
assert.equal(r.operatorTouched,false);assert.equal(r.hardwareActivated,false);assert.equal(r.controlsClicked,false);
assert.equal(r.initialBeforeQaSetup.outputsActive,0);assert.equal(r.initialBeforeQaSetup.recording,false);assert.equal(r.initialBeforeQaSetup.streaming,false);
assert.deepEqual(r.destinationsBefore,r.destinationsAfter);
assert.equal(r.after.outputsActive,0);assert.equal(r.after.recording,false);assert.equal(r.after.streaming,false);
for(const c of r.cases){assert.equal(c.dom.ready,'complete');assert.match(c.dom.ua,/Chrome\//);assert.ok(c.dom.controls.some(x=>x.visible));assert.deepEqual(c.dom.errors,[]);assert.deepEqual(c.dom.overflow,[]);assert.ok(c.dom.body.width<=c.dom.viewport.width+2);assert.equal(c.window.independent,true);assert.equal(c.window.visible,true);if(c.label!=='diagnosticos')assert.equal(c.dom.connected,true);else assert.equal(c.dom.connected,null);}
let sourceCount=0;for(const f of r.sourceFiles){assert.equal(sha(await fs.readFile(path.join(r.root,f.path))),f.instrumentedSha256||f.sha256);sourceCount++;}
for(const [file,expected]of Object.entries(r.pins))assert.equal(sha(await fs.readFile(path.join(r.root,file))),expected);
const frozen=JSON.parse(await fs.readFile('qa-finalizacao/native-build-frozen-fb98b14.json'));assert.equal(frozen.head,r.nativeHead);
let frozenFilesVerified=0;for(const f of frozen.files){assert.equal(sha(await fs.readFile(path.join(r.root,f.path))),f.sha256);frozenFilesVerified++;}
for(const f of r.sourceFiles.filter(x=>x.instrumentedSha256)){const name=path.basename(f.path);assert.equal(sha(await fs.readFile('qa-finalizacao/cef-nine-native19-final/instrumented-html/'+name)),f.instrumentedSha256);}
assert.equal(sha(await fs.readFile('qa-finalizacao/cef-nine-native19-final/main-window-only.png')),r.screenshots.mainPngSha256);
const sceneDir=path.join(r.root,'config/obs-studio/basic/scenes'),sources=[];
for(const name of await fs.readdir(sceneDir)){if(!name.endsWith('.json'))continue;const scene=JSON.parse(await fs.readFile(path.join(sceneDir,name)));sources.push(...(scene.sources||[]).map(s=>({name:s.name,id:s.id})));}
assert.ok(sources.every(s=>['color_source','mix-track-to-source','scene'].includes(s.id)),'Own installation has no capture hardware source');
const proof={status:'PASS',receipt:receiptPath,receiptSha256:sha(await fs.readFile(receiptPath)),nativeHead:r.nativeHead,sourceFilesVerified:sourceCount,instrumentedHtmlVerified:r.sourceFiles.filter(f=>f.instrumentedSha256).length,nativeBinaryPinsVerified:Object.keys(r.pins).length,frozenFilesVerified,casesVerified:r.cases.length,sceneSources:sources,hardwareCaptureSources:0,limits:['CEF dialog DOM/UA proofs; main screenshot is not a dialog screenshot','No functional controls, hardware, WAN, endurance, resize or visual design approval']};
await fs.writeFile('qa-finalizacao/cef-nine-native19-final/verificacao.json',JSON.stringify(proof,null,2));console.log(JSON.stringify(proof,null,2));
