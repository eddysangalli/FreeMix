from pathlib import Path
draft=Path(__file__).resolve().parent/'draft'
p=draft/'gtzip-xml.mjs';s=p.read_bytes();s=s.replace(b"for(const child of el.order||[...(el.elements||[]),...(el.children||[])])yield* visit(child);",b"for(const child of el.elements||[])yield* visit(child);for(const child of el.children||[])yield* visit(child);");p.write_bytes(s)
p=draft/'gtzip-render.mjs';s=p.read_bytes();a=b"if(el.dataset.fieldName===name&&!el.classList.contains('gt-qrcode'))el.textContent=text;";assert a in s;s=s.replace(a,b"if(el.dataset.fieldName===name&&!el.classList.contains('gt-qrcode')){if(el.dataset.shrinkMax){el.querySelector('.gt-text-run').textContent=text;fitText(el);}else el.textContent=text;}");p.write_bytes(s)
