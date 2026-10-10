from pathlib import Path
draft=Path(__file__).resolve().parent/'draft'
p=draft/'gtzip-xml.mjs';s=p.read_bytes();s=s.replace(b"composition.children.find(n=>n.attrs.Name===item.name)",b"composition.children.find(n=>n.path===item.path)");p.write_bytes(s)
p=draft/'gtzip-render.mjs';s=p.read_bytes();s=s.replace(b"<span class=\"gt-text-run\" style=\"display:inline-block;flex:none\">",b"<span class=\"gt-text-run\" style=\"display:inline-block;flex:none;max-width:100%\">");p.write_bytes(s)
