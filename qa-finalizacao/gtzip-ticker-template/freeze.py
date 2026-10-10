from pathlib import Path
import json,hashlib,difflib
qa=Path(__file__).resolve().parent;root=qa.parents[1]
hash=lambda data:hashlib.sha256(data).hexdigest()
pins=json.loads((qa/'baseline-pins.json').read_text())
assert all(hash((root/p['path']).read_bytes())==p['sha256'] for p in pins),'Baseline product changed; coordinate before freeze'
regpins=json.loads((qa/'regression-pins.json').read_text())
assert all(hash((root/p['path']).read_bytes())==p['sha256'] for p in regpins),'Original QA harness changed'
changed=['gtzip-xml.mjs','gtzip-render.mjs','gtzip_converter.mjs'];patch=''
for name in changed:
 old=(qa/(name+'.baseline')).read_text(encoding='utf8').splitlines(True);new=(qa/'draft'/name).read_text(encoding='utf8').splitlines(True)
 patch+=''.join(difflib.unified_diff(old,new,fromfile='a/obs-vmix/ferramentas/'+name,tofile='b/obs-vmix/ferramentas/'+name))
(qa/'ticker-template.patch').write_text(patch,encoding='utf8',newline='\n')
files=[]
for p in qa.rglob('*'):
 if not p.is_file() or p.name=='ALLOWLIST.json' or any(part.startswith('converted-') for part in p.relative_to(qa).parts):continue
 if p.suffix not in ['.mjs','.py','.json','.md','.xml','.patch','.baseline'] and p.name!='LICENSE-FIXTURE.txt':continue
 files.append(p)
items=[{'path':p.relative_to(root).as_posix(),'bytes':p.stat().st_size,'sha256':hash(p.read_bytes()),'role':'product-draft' if p.parent==qa/'draft' and p.name in changed else 'QA-text'} for p in sorted(files)]
record={'status':'DRAFT_QA_PASS_NOT_APPLIED','productChanged':False,'NativeCEFRun':False,'operatorChanged':False,'referencesRead':False,'baselineHashesVerified':True,'originalQAHarnessHashesVerified':True,'proposedSources':3,'items':items,'excluded':['*.png','*.gtzip*','*.txt except LICENSE-FIXTURE.txt','converted-*','deps','rawlogs','Native/Git/mesa/package']}
(qa/'ALLOWLIST.json').write_text(json.dumps(record,indent=2),encoding='utf8')
print(json.dumps({'files':len(items),'sha256':hash((qa/'ALLOWLIST.json').read_bytes()),'sources':[item for item in items if item['role']=='product-draft']}))
