from pathlib import Path
import hashlib,json,subprocess,re,ast
OWN=Path(__file__).resolve().parent;ROOT=OWN.parents[1];H=lambda b:hashlib.sha256(b).hexdigest()
assert not (OWN/'ALLOWLIST.json').exists()
targets=json.loads((OWN/'TARGETS.json').read_bytes())['targets']
def apply(old,diff):
 source=old.decode('utf8').splitlines(True);out=[];cursor=0;lines=diff.decode('utf8').splitlines(True);i=0
 while i<len(lines):
  if not lines[i].startswith('@@'):i+=1;continue
  m=re.match(r'@@ -(\d+)(?:,\d+)? \+\d+(?:,\d+)? @@',lines[i]);assert m
  start=int(m[1])-1;out+=source[cursor:start];cursor=start;i+=1
  while i<len(lines) and not lines[i].startswith('@@'):
   line=lines[i];kind=line[:1];value=line[1:]
   if kind in (' ','-'):assert source[cursor]==value,(cursor,line);cursor+=1
   if kind in (' ','+'):out.append(value)
   i+=1
 out+=source[cursor:];return ''.join(out).encode('utf8')
for t in targets:
 b=(ROOT/t['path']).read_bytes();a=(OWN/t['draft']).read_bytes();p=(OWN/t['patch']).read_bytes()
 assert H(b)==t['beforeSha256'];assert H(a)==t['afterSha256'];assert H(p)==t['patchSha256'];assert apply(b,p)==a
node=ROOT/'entregas/FreeMix-Completo-0.1.0-local.20261010060000/runtime/node.exe'
assert H(node.read_bytes())=='ba4e6d110e8c1592a1ecd390f6b05f3da124b13871a5be62b341a07a853c6c32'
js=[OWN/'test.mjs']+[OWN/t['draft'] for t in targets if t['path'].endswith(('.js','.mjs'))]
for p in js:subprocess.run([str(node),'--check',str(p)],check=True,capture_output=True)
result=subprocess.run([str(node),str(OWN/'test.mjs')],check=True,capture_output=True,text=True);models=json.loads(result.stdout);(OWN/'MODEL-RESULT.json').write_text(json.dumps(models,indent=2)+'\n')
for p in [OWN/'prepare.py',OWN/'freeze.py']:ast.parse(p.read_text())
refs=['freemix-app/plugins/decklink/decklink-output.cpp','FreeMix/ferramentas/servidor-api.mjs','FreeMix/ferramentas/srt-hdr-producao.mjs','FreeMix/painel/remoto/saidas-readonly-ui.js','FreeMix/ferramentas/controle-producao.mjs']
rp=[{'path':p,'sha256':H((ROOT/p).read_bytes()),'bytes':(ROOT/p).stat().st_size} for p in refs]
agy=json.loads((OWN/'AGY-RESULT.json').read_bytes());stderr=(OWN/'AGY-STDERR.txt').read_text()
assert agy['response']=='';assert 'print timeout after 2m0s' in stderr
disposition={'conversationId':agy['conversation_id'],'cliStatus':agy['status'],'nonemptyCompletion':False,'timeoutSeconds':120,'zeroPatchProduced':True,'classification':'REAL_OPERATIONAL_PRINT_TIMEOUT_NOT_QUOTA_EVIDENCE','toolsRequested':False,'permissionsChanged':False,'protectionBypassed':False,'fallback':'Codex after timeout/empty response','rawResultSha256':H((OWN/'AGY-RESULT.json').read_bytes()),'stderrSha256':H((OWN/'AGY-STDERR.txt').read_bytes())}
(OWN/'AGY-DISPOSITION.json').write_text(json.dumps(disposition,indent=2)+'\n')
(OWN/'SOURCE-PINS.json').write_text(json.dumps({'targets':targets,'references':rp,'nodeSha256':H(node.read_bytes()),'readOnlyConsumerReferences':True},indent=2)+'\n')
for t in targets:assert H((ROOT/t['path']).read_bytes())==t['beforeSha256']
for r in rp:assert H((ROOT/r['path']).read_bytes())==r['sha256']
receipt={'status':'FROZEN_OFFSIDE_REQUIRES_ROOT_REVIEW_BUILD_REAL_GET_QA','targets':6,'patchRoundtrips':6,'models':models['checks'],'syntax':len(js),'pythonAst':2,'canonicalModified':False,'NativeExecuted':False,'SDKExecuted':False,'compiled':False,'APIStarted':False,'browserStarted':False,'rootHeadProvided':'a73b97c','reviewedIntegration':False}
(OWN/'RECEIPT.json').write_text(json.dumps(receipt,indent=2)+'\n')
files=[]
for p in sorted(OWN.rglob('*')):
 if not p.is_file():continue
 if p.name in ['AGY-RESULT.json','AGY-STDERR.txt','BRIEF.txt']:continue
 assert not p.is_symlink();files.append({'path':str(p.relative_to(OWN)).replace('\\','/'),'sha256':H(p.read_bytes()),'bytes':p.stat().st_size})
(OWN/'ALLOWLIST.json').write_text(json.dumps({'status':'FROZEN_DRAFT_NO_NATIVE_EXECUTION','files':files},indent=2)+'\n')
print(json.dumps({'allowlist':H((OWN/'ALLOWLIST.json').read_bytes()),'receipt':H((OWN/'RECEIPT.json').read_bytes()),'files':len(files),'models':models['checks'],'targets':6}))
