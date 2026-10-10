from pathlib import Path
import json,hashlib
R=Path(__file__).parent;W=R.parent.parent
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
pins=json.loads((R/'PRODUCT-PINS.json').read_text())
for row in pins:
 assert sha(W/row['path'])==row['baseline'],row['path']
 assert sha(R/'draft'/row['path'])==row['draft'],row['path']
for p in R.rglob('*'): assert not p.is_symlink(),p
entries=[{'path':p.relative_to(R).as_posix(),'sha256':sha(p),'bytes':p.stat().st_size} for p in sorted(R.rglob('*')) if p.is_file() and p.name!='ALLOWLIST.json']
receipt={'status':'SOURCE_DRAFT_REVIEWED_CPU_ONLY','productFiles':pins,'entries':entries,'externalPins':[{'path':str(W/row['path']),'sha256':row['baseline']} for row in pins], 'nativeHeadBaseline':'a73b97cefd8904191d73dae8693f425fac02e897','canonicalUnchanged':True,'nativeBuild':False,'nativeRuntime':False,'checks':25,'syntaxChecks':2,'agYResponseEmpty':True,'quotaProven':False,'remainingLimits':['Native build and isolated runtime required','Capture property-list contract cannot prove individual hardware readiness','Inherited Direct Out pending dirty-form not qualified']}
(R/'ALLOWLIST.json').write_text(json.dumps(receipt,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'allowlist':str(R/'ALLOWLIST.json'),'sha256':sha(R/'ALLOWLIST.json'),'entries':len(entries),'patchSha256':sha(R/'readonly-asio.patch')}))
