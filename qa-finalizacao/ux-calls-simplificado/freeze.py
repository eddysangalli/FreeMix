from pathlib import Path
import hashlib, json, difflib
base=Path(__file__).resolve().parent
workspace=base.parents[1]
pins=json.loads((base/'baseline-pins.json').read_text(encoding='utf-8'))['pins']
sha=lambda b:hashlib.sha256(b).hexdigest()
products=[]
patches=[]
for pin in pins:
    file=Path(pin['product']).name
    baseline=(base/'baseline'/file).read_bytes()
    current=(workspace/pin['product']).read_bytes()
    if sha(baseline)!=pin['baselineSha256'] or current!=baseline:
        raise RuntimeError('Baseline or product concurrently changed: '+pin['product'])
    draft=(base/'draft'/file).read_bytes()
    patch=''.join(difflib.unified_diff(baseline.decode('utf-8').splitlines(True),draft.decode('utf-8').splitlines(True),fromfile='a/'+pin['product'],tofile='b/'+pin['product']))
    patches.append(patch)
    products.append({**pin,'draft':f'draft/{file}','draftSha256':sha(draft),'draftBytes':len(draft),'productUnchanged':True})
(base/'calls-simplificado.patch').write_bytes(''.join(patches).encode('utf-8'))
files=[]
for p in sorted(base.rglob('*')):
    if not p.is_file() or p.name=='ALLOWLIST.json' or p.name=='preview-runtime.json': continue
    rel=p.relative_to(base).as_posix()
    b=p.read_bytes();files.append({'path':rel,'sha256':sha(b),'bytes':len(b)})
result={'status':'FROZEN_DRAFT_PASS_MOCK_AND_ROOT_CUA','productApplied':False,'nativeExecuted':False,'productFiles':products,'proofs':{'backendMockAndPCM':21,'domVM':34,'browserVisual':'Root CUA own mock page: selected Ana/Bruno persisted after reload; Space hold 1300 ms, 3 pings, exact own lease stop; collector HTTP readback only.','physicalAudio':False,'CEF':False},'files':files,'previewRuntimeNotFrozen':True}
(base/'ALLOWLIST.json').write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
print(json.dumps({'status':result['status'],'productFiles':len(products),'qaFiles':len(files),'allowlistSha256':sha((base/'ALLOWLIST.json').read_bytes())}))
