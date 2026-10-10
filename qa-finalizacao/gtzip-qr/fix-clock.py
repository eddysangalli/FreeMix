from pathlib import Path
p=Path(__file__).resolve().parents[2]/'obs-vmix/ferramentas/gtzip-render.mjs'
s=p.read_bytes();before=b'if(el.dataset.fieldName===name)el.textContent=text;'
assert before in s
p.write_bytes(s.replace(before,b"if(el.dataset.fieldName===name&&!el.classList.contains('gt-qrcode'))el.textContent=text;"))
