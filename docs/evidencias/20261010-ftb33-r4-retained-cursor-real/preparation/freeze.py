from pathlib import Path
import hashlib,json,re,ast,subprocess
OWN=Path(__file__).resolve().parent;ROOT=OWN.parents[1];PRIOR=ROOT/'qa-finalizacao/ftb-native32-mediaclock-observation-preparation-r3';H=lambda b:hashlib.sha256(b).hexdigest()
base=json.loads((OWN/'BASELINES.json').read_text(encoding='utf8'));derive=json.loads((OWN/'DERIVATION.json').read_text(encoding='utf8'))
for r in base['files']:
 p=ROOT/r['path'];assert H(p.read_bytes())==r['sha256'];assert not p.is_symlink();assert p.stat().st_nlink==1
 for q in[p,*p.parents]:assert not(q.lstat().st_file_attributes & 1024)
nb=(ROOT/base['nativeReceipt']).read_bytes();assert H(nb)==base['nativeReceiptSha256'];n=json.loads(nb)
for r in n['files']:
 p=Path(n['root'])/r['path'];assert H(p.read_bytes())==r['sha256'];assert p.stat().st_nlink==1 and not p.is_symlink();assert not(p.lstat().st_file_attributes & 1024)
def apply(before,patch):
 lines=before.decode('utf8').splitlines(True);plines=patch.decode('utf8').splitlines(True);out=[];cursor=0;i=2
 while i<len(plines):
  m=re.match(r'@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@',plines[i]);assert m
  start=int(m[1])-1;out+=lines[cursor:start];cursor=start;i+=1
  while i<len(plines) and not plines[i].startswith('@@ '):
   op=plines[i][0];v=plines[i][1:]
   if op in ' -':assert lines[cursor]==v;(out.append(v)if op==' 'else None);cursor+=1
   elif op=='+':out.append(v)
   else:raise AssertionError(op)
   i+=1
 out+=lines[cursor:];return ''.join(out).encode('utf8')
for name,patch in [('observation.mjs','R4-OBSERVATION-CONTRACT.patch'),('runner.mjs','R4-RUNNER-BINDING.patch')]:assert apply((PRIOR/name).read_bytes(),(OWN/patch).read_bytes())==(OWN/name).read_bytes()
assert H((PRIOR/'ALLOWLIST.json').read_bytes())==derive['priorAllowlistSha256']
assert H((OWN/'media-reset-contract.mjs').read_bytes())=='dba7b0ab66dddc6f2d96b14f8c7abdc9eca3e0cfbbd5ef1659412209f0688259'
node=ROOT/base['node']['path'];assert H(node.read_bytes())==base['node']['sha256']
syntax=list(OWN.glob('*.mjs'))
for p in syntax:subprocess.run([str(node),'--check',str(p)],check=True,capture_output=True)
for p in OWN.glob('*.py'):ast.parse(p.read_text(encoding='utf8'))
subprocess.run([str(node),str(OWN/'test.mjs'),'--verify-only'],check=True)
receipt={'status':'FROZEN_R4_PREPARATION_REQUIRES_ROOT_REVIEW_AND_ONE_START','NativeExecuted':False,'NativeCompiledByAgent':False,'APIStarted':False,'BrowserStarted':False,'FFmpegStarted':False,'operatorTouched':False,'ownRootProvisioned':False,'models':15,'syntax':len(syntax),'pythonAst':2,'patchRoundtrips':2,'externalPins':54,'native2085SourceVerified':True,'nativeManifestSha256':base['nativeReceiptSha256'],'head':base['nativeHead'],'NativeGeneration':33,'legacyOracleByteExact':derive['oracleSha256'],'allOld195SamplesFAILPreserved':True,'fullFTBPass':False,'physicalDisplayProven':False,'rootReviewedBindingsExist':False}
(OWN/'PREPARATION-RECEIPT.json').write_text(json.dumps(receipt,indent=2)+'\n',encoding='utf8')
rows=[]
for p in sorted(OWN.rglob('*')):
 if p.is_file() and p.name!='ALLOWLIST.json':
  b=p.read_bytes();b.decode('utf8');rows.append({'path':str(p.relative_to(OWN)).replace('\\','/'),'sha256':H(b),'bytes':len(b)})
(OWN/'ALLOWLIST.json').write_text(json.dumps({'status':'FROZEN_PREPARATION_NOT_AUTHORIZED','files':rows,'externalPinsFile':'BASELINES.json','requiredNativeFiles':2085,'NativeExecuted':False,'fullFTBPass':False},indent=2)+'\n',encoding='utf8')
print(json.dumps({'files':len(rows),'allowlistSha256':H((OWN/'ALLOWLIST.json').read_bytes()),'receiptSha256':H((OWN/'PREPARATION-RECEIPT.json').read_bytes()),'nativeFingerprint':base['nativeReceiptSha256']}))
