from pathlib import Path
import json,hashlib,difflib
root=Path(__file__).resolve().parents[2];qa=Path(__file__).resolve().parent
sources=['gtzip-xml.mjs','gtzip-render.mjs','gtzip_converter.mjs','gc-gtzip.mjs','gtzip-qr.mjs','gtzip-qr-bundle.mjs']
patch=''
for name in sources:
 p=root/'obs-vmix/ferramentas'/name;after=p.read_bytes();before=qa/(name+'.before')
 (qa/(name+'.after')).write_bytes(after)
 patch+=''.join(difflib.unified_diff(before.read_text(encoding='utf8').splitlines(True) if before.exists() else [],after.decode('utf8').replace('\r\n','\n').splitlines(True),fromfile='a/obs-vmix/ferramentas/'+name if before.exists() else '/dev/null',tofile='b/obs-vmix/ferramentas/'+name))
(qa/'gtzip-qr.patch').write_text(patch,encoding='utf8',newline='\n')
files=[root/'obs-vmix/ferramentas'/n for n in sources]
files +=[p for p in qa.iterdir() if p.is_file() and (p.suffix in ['.mjs','.py','.json','.md','.xml','.patch'] or p.name.endswith('.before') or p.name.endswith('.after') or p.name=='QR-LICENSE.txt') and p.name!='ALLOWLIST.json']
items=[{'path':p.relative_to(root).as_posix(),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'role':'product' if p.parent==root/'obs-vmix/ferramentas' else 'QA-text'} for p in files]
report={'status':'GTZIP_QR_OFFLINE_PASS_BROWSER_AND_BACKEND_NATIVE_CEF_NOT_RUN','sources':6,'files':len(items),'referenceAssetsCopied':False,'packageChanged':False,'operatorChanged':False,'items':items,'excluded':['decoder-deps','converted-*','save-*','*.png','own.gtzip.hidden','*.txt except QR-LICENSE.txt','Native/Git/build/process/package']}
(qa/'ALLOWLIST.json').write_text(json.dumps(report,indent=2),encoding='utf8')
print(json.dumps({'files':len(items),'allowlistSha256':hashlib.sha256((qa/'ALLOWLIST.json').read_bytes()).hexdigest(),'sources':[i for i in items if i['role']=='product']}))
