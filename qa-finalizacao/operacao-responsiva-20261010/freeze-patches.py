import pathlib,difflib,json,hashlib
q=pathlib.Path(__file__).parent
for name,rel in [('mesa.html','painel/mesa.html'),('controle-producao.mjs','ferramentas/controle-producao.mjs'),('servidor-api.mjs','ferramentas/servidor-api.mjs')]:
 a=(q/'baseline-canonical'/name).read_text(encoding='utf-8-sig').splitlines(True);b=(q/'draft'/name).read_text(encoding='utf-8-sig').splitlines(True)
 patch=''.join(difflib.unified_diff(a,b,fromfile='a/'+rel,tofile='b/'+rel,n=3))
 (q/(name+'.patch')).write_text(patch,encoding='utf-8',newline='\n')
