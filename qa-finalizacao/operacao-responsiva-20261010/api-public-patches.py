import pathlib,difflib
q=pathlib.Path(__file__).parent
for baseline,name in [('draft/servidor-api.mjs','servidor-api-public-complement.patch'),('baseline-canonical/servidor-api.mjs','servidor-api-public-combined.patch')]:
 a=(q/baseline).read_text(encoding='utf-8-sig').splitlines(True);b=(q/'draft/servidor-api-public.mjs').read_text(encoding='utf-8-sig').splitlines(True)
 (q/name).write_text(''.join(difflib.unified_diff(a,b,fromfile='a/ferramentas/servidor-api.mjs',tofile='b/ferramentas/servidor-api.mjs',n=3)),encoding='utf-8',newline='\n')
