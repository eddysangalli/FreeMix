from pathlib import Path
root=Path(__file__).resolve().parents[2]
qa=Path(__file__).resolve().parent
def edit(name,changes):
 p=root/'obs-vmix/ferramentas'/name
 original=p.read_bytes(); (qa/(name+'.before')).write_bytes(original)
 s=original.decode('utf-8')
 newline='\r\n' if b'\r\n' in original else '\n'
 for old,new in changes:
  assert old in s, (name,old[:90])
  s=s.replace(old,new)
 p.write_bytes(s.replace('\r\n','\n').replace('\n',newline).encode('utf-8'))
 (qa/(name+'.after')).write_bytes(p.read_bytes())
edit('gtzip-xml.mjs',[
 ("export function parseGtTree", "import {validateGtQr} from './gtzip-qr.mjs';\nexport function parseGtTree"),
 ("'Ticker','Image','Brush'", "'Ticker','Image','QRCode','Brush'"),
 ("  if(node.tag==='Image')", """  if(node.tag==='QRCode'){
   el.text=a.Text??'';
   const allowed=new Set(['Name','Dimensions','Location','Text','Visible','Opacity','Rotate','Scale']);
   const unsupported=Object.keys(a).filter(key=>!allowed.has(key));
   const unsupportedChildren=node.children.filter(c=>!['QRCode.Transform','QRCode.Crop','Transform'].includes(c.tag));
   if(unsupported.length||unsupportedChildren.length)el.qrUnsupported='QR: opções/filhos fora do contrato Text, ECC M e quiet-zone4';
   if(!a.Dimensions)el.qrUnsupported='QR: Dimensions explícitas são necessárias';
   const dimensionsError=validateGtQr('x',el.width,el.height);if(dimensionsError)el.qrUnsupported=dimensionsError;
   const error=el.qrUnsupported||validateGtQr(el.text,el.width,el.height);if(error)warn(node,error);
  }
  if(node.tag==='Image')"""),
 ("'Image','TextBlock','Ticker'].includes(n.tag)", "'Image','TextBlock','Ticker','QRCode'].includes(n.tag)"),
 ("'Polygon','Path','Ticker'].includes(n.tag)", "'Polygon','Path','Ticker','QRCode'].includes(n.tag)")
])
edit('gtzip-render.mjs',[
 ("['TextBlock','Ticker','Image'].includes(e.type)", "['TextBlock','Ticker','Image','QRCode'].includes(e.type)"),
 ("e.type==='Ticker'?'ticker':'text'", "e.type==='Ticker'?'ticker':e.type==='QRCode'?'qrcode':'text'"),
 ("  else if(e.type==='Image')", "  else if(e.type==='QRCode'){style.push('overflow:hidden');}\n  else if(e.type==='Image')"),
 ("e.type==='Ticker'?'gt-ticker-wrapper':''", "e.type==='Ticker'?'gt-ticker-wrapper':e.type==='QRCode'?'gt-qrcode':''"),
 ("(['TextBlock','Image','Ticker'].includes(e.type)?", "(['TextBlock','Image','Ticker','QRCode'].includes(e.type)?"),
 ("+' style=\"'+esc(style.join(';'))", "+(e.type==='QRCode'?' data-qr-width=\"'+e.width+'\" data-qr-height=\"'+e.height+'\" data-qr-unsupported=\"'+esc(e.qrUnsupported||'')+'\"':'')+' style=\"'+esc(style.join(';'))"),
 ('${markup}</div><script>', '${markup}</div>${fields.some(f=>f.type===\'qrcode\')?\'<script src="./gt-qr.js"></script>\':\'\'}<script>'),
 ("if(el.classList.contains('gt-image'))", "if(el.classList.contains('gt-qrcode')){if(window.FreeMixGtQr)window.FreeMixGtQr.render(el,val);else{el.replaceChildren();el.dataset.qrError='QR: encoder local indisponível';}}else if(el.classList.contains('gt-image'))"),
 ("const clockFormats=new Map(fields.filter(f=>", "update(Object.fromEntries(fields.filter(f=>f.type==='qrcode').map(f=>[f.id,f.default])));\nconst clockFormats=new Map(fields.filter(f=>f.type!=='qrcode'&&")
])
edit('gtzip_converter.mjs',[
 ("import {GT_RUNTIME_SCRIPT}", "import {GT_QR_RUNTIME_SCRIPT,GT_QR_LICENSE} from './gtzip-qr.mjs';\nimport {GT_RUNTIME_SCRIPT}"),
 ("['TextBlock','Ticker','Image'].includes(e.type)", "['TextBlock','Ticker','Image','QRCode'].includes(e.type)"),
 (" const html=generateHtml", " if(fields.some(f=>f.type==='QRCode')){copies.set('gt-qr.js',Buffer.from(GT_QR_RUNTIME_SCRIPT));copies.set('QR-LICENSE.txt',Buffer.from(GT_QR_LICENSE));}\n const html=generateHtml"),
 ("máscaras, QR e sequências sem contrato", "máscaras e sequências sem contrato"),
 ("Fontes ausentes usam fallback local", "QR offline: Text UTF-8 até 512 bytes, ECC M, quiet-zone4, quadrado 16–2048 px e pelo menos um pixel por módulo; opções fora desse contrato são rejeitadas. Fontes ausentes usam fallback local")
])
