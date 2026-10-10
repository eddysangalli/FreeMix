from pathlib import Path
import hashlib,json,difflib
OWN=Path(__file__).resolve().parent;ROOT=OWN.parents[1];PRIOR=ROOT/'qa-finalizacao/ftb-native32-mediaclock-observation-preparation-r3';H=lambda b:hashlib.sha256(b).hexdigest()
prior_al=PRIOR/'ALLOWLIST.json'; prior=json.loads(prior_al.read_bytes())
for f in prior['files']:assert H((PRIOR/f['path']).read_bytes())==f['sha256'],f['path']
paths=['observation.mjs','collection-budget.mjs','media-reset-contract.mjs','audio-contract.mjs','scenario.mjs','png.mjs','own-native-lifecycle.mjs','own-program-setup.mjs','runner.mjs']
copied=[]
for name in paths:
 b=(PRIOR/name).read_bytes();(OWN/name).write_bytes(b);copied.append({'path':name,'before':H(b),'bytes':len(b)})
before=(OWN/'observation.mjs').read_bytes();text=before.decode('utf8')
old="assert.equal(c.timestampSource,c.supported?(c.presentedValid?'submitted-source-pts':'decoder-base-fallback'):'unavailable');"
new="assert.equal(c.timestampSource,c.supported?(c.presentedValid?'submitted-source-pts':'invalid-submitted-source-pts'):'unavailable');assert.equal(c.legacyCursorPolicy,'retain-last-valid-submitted-or-zero-while-invalid-v1','MEDIA_CLOCK_CURSOR_POLICY_UNKNOWN');"
assert text.count(old)==1;text=text.replace(old,new)
old="'submittedCursorMs','timestampSource','timestampDomain'].map"
new="'submittedCursorMs','timestampSource','timestampDomain','legacyCursorPolicy'].map"
assert text.count(old)==1;text=text.replace(old,new)
after=text.encode('utf8');(OWN/'observation.mjs').write_bytes(after)
(OWN/'R4-OBSERVATION-CONTRACT.patch').write_bytes(''.join(difflib.unified_diff(before.decode('utf8').splitlines(True),text.splitlines(True),fromfile='a/observation.mjs',tofile='b/observation.mjs')).encode('utf8'))
rbefore=(OWN/'runner.mjs').read_bytes();runner=rbefore.decode('utf8')
for old,new in[
 ('EXECUTE-ROOT-APPROVED-FTB32-R3-DISTINCT-PROGRAM','EXECUTE-ROOT-APPROVED-FTB33-R4-RETAINED-CURSOR'),
 ('ROOT_REVIEWED_OWN_FTB32_R3_DISTINCT_PROGRAM','ROOT_REVIEWED_OWN_FTB33_R4_RETAINED_CURSOR'),
 ('FreeMix-QA-FTBClock32','FreeMix-QA-FTBClock33'),
 ('ftb-native32-mediaclock-observation','ftb-native33-retained-cursor-observation'),
 ('NativeGeneration:32','NativeGeneration:33')]:assert runner.count(old)==1,old;runner=runner.replace(old,new)
(OWN/'runner.mjs').write_bytes(runner.encode('utf8'))
(OWN/'R4-RUNNER-BINDING.patch').write_bytes(''.join(difflib.unified_diff(rbefore.decode('utf8').splitlines(True),runner.splitlines(True),fromfile='a/runner.mjs',tofile='b/runner.mjs')).encode('utf8'))
native_path=ROOT/'qa-finalizacao/native-build-frozen-c990c4a-configured.json';nb=native_path.read_bytes();native=json.loads(nb)
assert native['head']=='c990c4a39c445542d363f6950fb8f7f70811034a' and len(native['files'])==2085 and native['build']['exitCode']==0
assert '32.2.2-33-gc990c4a' in native['build']['generatedVersionSource']
base=json.loads((PRIOR/'BASELINES.json').read_bytes());changes=[]
for row in base['files']:
 p=ROOT/row['path'];data=p.read_bytes();actual=H(data)
 if actual!=row['sha256']:
  assert row['path'] in ['freemix-app/shared/media-playback/media-playback/media.c','freemix-app/shared/media-playback/media-playback/media.h','freemix-app/plugins/obs-ffmpeg/obs-ffmpeg-source.c'],row['path']
  changes.append({'path':row['path'],'before':row['sha256'],'after':actual});row.update(sha256=actual,bytes=len(data))
assert len(changes)==3
def add(p):
 assert not any(r['path']==p for r in base['files']);b=(ROOT/p).read_bytes();base['files'].append({'path':p,'sha256':H(b),'bytes':len(b)})
for p in ['qa-finalizacao/native-build-frozen-c990c4a-configured.json','qa-finalizacao/ftb-native32-mediaclock-observation-preparation-r3/ALLOWLIST.json','qa-finalizacao/ftb-native32-mediaclock-observation-preparation-r3/root-ftb32-clock-real-result.json','qa-finalizacao/ftb-native32-mediaclock-observation-preparation-r3/observation.mjs','qa-finalizacao/ftb-native32-mediaclock-observation-preparation-r3/runner.mjs']:
 add(p)
base.update(status='R4_PREPARATION_ONLY_NO_RUNTIME',nativeHead=native['head'],nativeReceipt=str(native_path.relative_to(ROOT)).replace('\\','/'),nativeReceiptSha256=H(nb),priorExternalPins=49)
(OWN/'BASELINES.json').write_text(json.dumps(base,indent=2)+'\n',encoding='utf8')
assert H((OWN/'media-reset-contract.mjs').read_bytes())==H((PRIOR/'media-reset-contract.mjs').read_bytes())
fixture=Path(base['fixture']['sourceFile']);assert H(fixture.read_bytes())==base['fixture']['sha256']
for f in native['files']:
 p=Path(native['root'])/f['path'];assert p.is_file() and not p.is_symlink() and H(p.read_bytes())==f['sha256'],f['path']
derivation={'status':'PREPARED_ONLY_ROOT_REVIEW_REQUIRED_NO_START','head':native['head'],'NativeGeneration':33,'nativeManifest':base['nativeReceipt'],'nativeManifestSha256':H(nb),'native2085SourceVerified':True,'noRuntime':True,'priorAllowlistSha256':H(prior_al.read_bytes()),'priorHelpers':copied,'updatedNativeSources':changes,'oracleSha256':H((OWN/'media-reset-contract.mjs').read_bytes()),'criteriaByteExact':True,'sourceMediaHardwareApiBrowserExecuted':False,'bindingChanges':'Only fresh ownRoot/marker/CLI/gen identity; runtime action flow unchanged','observationChanges':'Only expected invalid timestampSource and additive legacyCursorPolicy; no event/threshold/filter change'}
(OWN/'DERIVATION.json').write_text(json.dumps(derivation,indent=2)+'\n',encoding='utf8')
(OWN/'ROOT-BINDINGS-PROPOSAL.json').write_text(json.dumps({'status':'PENDING_ROOT_REVIEW_NOT_AUTHORIZED','rootReviewed':False,'requiredStatusAfterReview':'ROOT_REVIEWED_OWN_FTB33_R4_RETAINED_CURSOR','ownRoot':None,'marker':None,'port':None,'nodeExecutable':str(ROOT/base['node']['path']),'nodeSha256':base['node']['sha256'],'resultName':'root-ftb33-clock-real-result.json','requiredParent':'own-runtime','requiredRootPattern':'FreeMix-QA-FTBClock33-[a-zA-Z0-9-]+','requiredMarkerOwner':'ftb-native33-retained-cursor-observation','noOwnProvisioningPerformed':True},indent=2)+'\n',encoding='utf8')
print(json.dumps({'status':'R4_PREPARED_ONLY','native2085SourceVerified':True,'nativeManifestSha256':H(nb),'external':len(base['files']),'oracle':derivation['oracleSha256']}))
