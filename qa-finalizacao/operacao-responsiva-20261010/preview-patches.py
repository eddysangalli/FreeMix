import pathlib,difflib
q=pathlib.Path(__file__).parent
for baseline,name in [('draft/mesa.html','mesa-preview-complement.patch'),('baseline-canonical/mesa.html','mesa-preview-combined.patch')]:
 a=(q/baseline).read_text(encoding='utf-8-sig').splitlines(True);b=(q/'draft/mesa-preview.html').read_text(encoding='utf-8-sig').splitlines(True)
 (q/name).write_text(''.join(difflib.unified_diff(a,b,fromfile='a/painel/mesa.html',tofile='b/painel/mesa.html',n=3)),encoding='utf-8',newline='\n')
