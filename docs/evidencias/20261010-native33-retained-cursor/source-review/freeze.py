import hashlib,json,re,ast,subprocess
from pathlib import Path
OWN=Path(__file__).resolve().parent;ROOT=OWN.parents[1]
H=lambda b:hashlib.sha256(b).hexdigest()
pins=json.loads((OWN/'PINS.json').read_text(encoding='utf8'))
for row in pins['sources']+[pins['report']]:
 assert H((ROOT/row['path']).read_bytes())==row['sha256'],row['path']
legacy=[]
for name in ['media-reset-contract.mjs','audio-contract.mjs','scenario.mjs']:
 old=ROOT/'qa-finalizacao/ftb-native32-mediaclock-observation-preparation-r3'/name
 copy=OWN/('legacy-media-reset-contract.mjs' if name=='media-reset-contract.mjs' else name)
 assert old.read_bytes()==copy.read_bytes()
 legacy.append({'path':str(old.relative_to(ROOT)).replace('\\','/'),'sha256':H(old.read_bytes()),'bytes':old.stat().st_size})
def apply(before,patch):
 lines=before.decode('utf8').splitlines(True);plines=patch.decode('utf8').splitlines(True);out=[];cursor=0;i=2
 while i<len(plines):
  m=re.match(r'@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@',plines[i]);assert m,plines[i]
  start=int(m[1])-1;assert start>=cursor;out+=lines[cursor:start];cursor=start;i+=1
  while i<len(plines) and not plines[i].startswith('@@ '):
   op=plines[i][0];v=plines[i][1:]
   if op in ' -':assert lines[cursor]==v;(out.append(v) if op==' ' else None);cursor+=1
   elif op=='+':out.append(v)
   else:raise AssertionError(op)
   i+=1
 out+=lines[cursor:];return ''.join(out).encode('utf8')
roundtrips=[]
for variant in ['','retained-variant','retained-r2']:
 base=OWN/variant
 for patch in (base/'patches').glob('*.patch'):
  first=patch.read_bytes().decode('utf8').splitlines()[0]
  relative='freemix-app/'+first.removeprefix('--- a/')
  before=(OWN/'baseline'/relative).read_bytes();after=(base/'draft'/relative).read_bytes()
  assert apply(before,patch.read_bytes())==after
  roundtrips.append({'patch':str(patch.relative_to(OWN)).replace('\\','/'),'before':H(before),'after':H(after),'roundtrip':True})
node=ROOT/'entregas/FreeMix-Completo-0.1.0-local.20261010060000/runtime/node.exe'
assert H(node.read_bytes())=='ba4e6d110e8c1592a1ecd390f6b05f3da124b13871a5be62b341a07a853c6c32'
for p in OWN.glob('*.py'):ast.parse(p.read_text(encoding='utf8'))
for p in OWN.glob('*.mjs'):subprocess.run([str(node),'--check',str(p)],check=True,capture_output=True)
subprocess.run([str(node),str(OWN/'test.mjs'),'--verify-only'],check=True)
prior=[]
for path,sha in [
 ('qa-finalizacao/localvocal-pt-shutdown-one-gate/ALLOWLIST.json','bfbb965655faae0ce04cdaab03a3131dc22a09aec318f2f39dc30a58c5dbffc3'),
 ('qa-finalizacao/localvocal-cumulative-native32-preparation-r3-lifecycle/ALLOWLIST.json','9c8364c66b5a39933a2834432d8668eebfd73304fe654b63e792dc154d9ebdb0')]:
 assert H((ROOT/path).read_bytes())==sha;prior.append({'path':path,'sha256':sha,'unchanged':True})
receipt={'status':'FROZEN_OFFSIDE_REVIEW_REQUIRED','NativeCompiled':False,'NativeExecuted':False,'operatorTouched':False,'recommendation':'retained-r2 only; three Native source patches; no fallback/race attribution to trace','originalLegacyFAILUnchanged':True,'originalReport':pins['report'],'samplesPreserved':195,'models':19,'patchRoundtrips':roundtrips,'legacyOracleExactBytePins':legacy,'priorFreezesUnchanged':prior,'pythonAst':4,'nodeSyntax':5,'node600Sha256':H(node.read_bytes()),'physicalDisplayProven':False,'FTBQualified':False}
(OWN/'RECEIPT.json').write_text(json.dumps(receipt,indent=2)+'\n',encoding='utf8')
items=[]
for p in sorted(OWN.rglob('*')):
 if p.is_file() and p.name!='ALLOWLIST.json':
  assert not p.is_symlink();b=p.read_bytes();b.decode('utf8');items.append({'path':str(p.relative_to(OWN)).replace('\\','/'),'sha256':H(b),'bytes':len(b)})
allow={'root':'qa-finalizacao/media-reset-ready-barrier-offside','status':'FROZEN_REVIEW_ONLY','files':items,'containsRawLogs':False,'containsMedia':False,'NativeCompiled':False,'NativeExecuted':False}
(OWN/'ALLOWLIST.json').write_text(json.dumps(allow,indent=2)+'\n',encoding='utf8')
print(json.dumps({'files':len(items),'allowlistSha256':H((OWN/'ALLOWLIST.json').read_bytes()),'receiptSha256':H((OWN/'RECEIPT.json').read_bytes()),'roundtrips':len(roundtrips),'checks':19}))
