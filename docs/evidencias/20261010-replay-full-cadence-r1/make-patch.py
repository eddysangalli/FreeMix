from pathlib import Path
import difflib

here=Path(__file__).resolve().parent
prior=here.parent/'replay-finite-regression-preparation'/'snapshot'
parts=[]
for name in ['replay-disco.mjs','replay-sincronia.mjs']:
    before=(prior/name).read_text(encoding='utf-8').splitlines(keepends=True)
    after=(here/'draft'/name).read_text(encoding='utf-8').splitlines(keepends=True)
    parts.extend(difflib.unified_diff(before,after,fromfile='a/ferramentas/'+name,tofile='b/ferramentas/'+name,n=3))
name='replay-cadence.mjs'
parts.extend(difflib.unified_diff([], (here/'draft'/name).read_text(encoding='utf-8').splitlines(keepends=True),fromfile='/dev/null',tofile='b/ferramentas/'+name,n=3))
with (here/'replay-full-cadence.patch').open('x',encoding='utf-8',newline='\n') as target:
    target.write(''.join(parts))
