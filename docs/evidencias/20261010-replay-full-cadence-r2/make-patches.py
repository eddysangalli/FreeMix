from pathlib import Path
import difflib
here=Path(__file__).resolve().parent
old=here.parent/'replay-vfr-gap-real-20261010'/'draft'
original=here.parent/'replay-finite-regression-preparation'/'snapshot'
def make(base,names,target):
    pieces=[]
    for name in names:
        file=base/name
        before=file.read_text(encoding='utf-8').splitlines(keepends=True) if file.exists() else []
        after=(here/'draft'/name).read_text(encoding='utf-8').splitlines(keepends=True)
        pieces.extend(difflib.unified_diff(before,after,fromfile='a/ferramentas/'+name if file.exists() else '/dev/null',tofile='b/ferramentas/'+name,n=3))
    with (here/target).open('x',encoding='utf-8',newline='\n') as stream: stream.write(''.join(pieces))
make(old,['replay-disco.mjs','replay-cadence.mjs'],'delta-r2.patch')
make(original,['replay-disco.mjs','replay-sincronia.mjs','replay-cadence.mjs'],'combined-from-canonical.patch')
