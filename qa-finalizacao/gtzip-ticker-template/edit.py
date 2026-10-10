from pathlib import Path
qa=Path(__file__).resolve().parent;draft=qa/'draft'
def edit(name,changes):
 p=draft/name;s=p.read_bytes().decode('utf8');newline='\r\n' if '\r\n' in s else '\n'
 for old,new in changes:
  assert old in s,(name,old[:80]);s=s.replace(old,new)
 p.write_bytes(s.replace('\r\n','\n').replace('\n',newline).encode('utf8'))
edit('gtzip-xml.mjs',[
 ("export function* gtObjects(data){function* group(layer){yield layer;for(const el of layer.elements)yield el;for(const child of layer.children||[])yield* group(child);}for(const l of data.layers)yield* group(l);}","export function* gtObjects(data){function* visit(el){yield el;if(el.template)yield* visit(el.template);for(const child of el.order||[...(el.elements||[]),...(el.children||[])])yield* visit(child);}for(const layer of data.layers)yield* visit(layer);}"),
 ("  if(node.tag==='Ticker'&&child(node,'Ticker.Template')&&[...walkGtTree(child(node,'Ticker.Template'))].some(n=>['Layer','Group','Image'].includes(n.tag)))warn(node,'Ticker.Template complexo não convertido; somente texto com rolagem aproximada');", """  if(node.tag==='Ticker'&&child(node,'Ticker.Template')&&[...walkGtTree(child(node,'Ticker.Template'))].some(n=>['Layer','Group','Image'].includes(n.tag))){
   const wrapper=child(node,'Ticker.Template'),layer=wrapper.children[0],content=layer&&child(layer,'Layer.Composition'),composition=content?.children[0];
   const supported=wrapper.children.length===1&&layer?.tag==='Layer'&&content?.children.length===1&&composition?.tag==='Composition'&&composition.children.length===3&&composition.children.filter(n=>n.tag==='TextBlock').length===2&&composition.children.filter(n=>n.tag==='Image').length===1&&[...walkGtTree(wrapper)].every(n=>['Layer','Layer.Composition','Composition','TextBlock','TextBlock.Fill','TextBlock.Stroke','TextBlock.Transform','TextBlock.Crop','Image','Image.Bitmap','Image.Transform','Image.Crop','Bitmap','Brush','Transform','Crop'].includes(n.tag));
   if(supported){el.template=group(layer);for(const item of el.template.elements)if(item.type==='TextBlock'){const original=composition.children.find(n=>n.attrs.Name===item.name);item.templateAutoSize=original?.attrs.AutoSize==='Shrink'?'Shrink':'None';if(original?.attrs.AutoSize&&!['Shrink','None'].includes(original.attrs.AutoSize))warn(original,'Ticker.Template AutoSize não convertido: '+original.attrs.AutoSize);}
    warn(node,'Ticker.Template 2D convertido como um item; Type Add/fila não implementados, unidade de Speed desconhecida e rolagem aproximada (60/Speed segundos)');
   }else warn(node,'Ticker.Template fora do contrato 2D (um Layer com dois TextBlock e Image); somente texto com rolagem aproximada');
  }""")
])
edit('gtzip-render.mjs',[
 ("['TextBlock','Ticker','Image','QRCode'].includes(e.type)", "['TextBlock','Ticker','Image','QRCode'].includes(e.type)&&!e.template"),
 ("  else if(['TextBlock','Ticker'].includes(e.type))", """  else if(e.type==='Ticker'&&e.template){const vertical=['Top','Bottom'].includes(e.direction),reverse=['Right','Bottom'].includes(e.direction),distance=vertical?e.height:e.width;style.push('overflow:hidden');content='<div class="gt-ticker-template-item" data-template-mode="single-item" style="position:absolute;width:'+e.template.width+'px;height:'+e.template.height+'px;--ticker-start:'+distance+'px;animation:ticker-template-'+(vertical?'vertical':'horizontal')+' '+Math.max(1,60/e.speed)+'s linear infinite'+(reverse?' reverse':'')+'">'+object(e.template)+'</div>';}
  else if(['TextBlock','Ticker'].includes(e.type))"""),
 ("content=esc(e.text);if(e.type==='Ticker')", "content=e.templateAutoSize==='Shrink'?'<span class=\"gt-text-run\" style=\"display:inline-block;flex:none\">'+esc(e.text)+'</span>':esc(e.text);if(e.type==='Ticker')"),
 ("(['TextBlock','Image','Ticker','QRCode'].includes(e.type)?", "(['TextBlock','Image','Ticker','QRCode'].includes(e.type)&&!e.template?"),
 ("+(e.type==='QRCode'?' data-qr-width", "+(e.templateAutoSize==='Shrink'?' data-shrink-max=\"'+e.fontSize+'\"':'')+(e.type==='QRCode'?' data-qr-width"),
 ("${fontRules}</style>", "@keyframes ticker-template-horizontal{from{transform:translateX(var(--ticker-start))}to{transform:translateX(-100%)}}@keyframes ticker-template-vertical{from{transform:translateY(var(--ticker-start))}to{transform:translateY(-100%)}}${fontRules}</style>"),
 ("else el.textContent=val;}}", "else if(el.dataset.shrinkMax){el.querySelector('.gt-text-run').textContent=val;fitText(el);}else el.textContent=val;}}"),
 ("window.FreeMixTitle={data:fields", """function fitText(el){const run=el.querySelector('.gt-text-run');if(!run)return;const max=Number(el.dataset.shrinkMax),min=Math.min(4,max);let low=min,high=max,best=min;const fits=()=>run.scrollWidth<=el.clientWidth+.5&&run.scrollHeight<=el.clientHeight+.5;el.style.fontSize=max+'px';if(fits()){delete el.dataset.shrinkOverflow;return;}for(let i=0;i<10;i++){const middle=(low+high)/2;el.style.fontSize=middle+'px';if(fits()){best=middle;low=middle;}else high=middle;}el.style.fontSize=best+'px';if(!fits())el.dataset.shrinkOverflow='Texto excede o mínimo local de4px; conteúdo preservado e recortado';else delete el.dataset.shrinkOverflow;}
function fitAllText(){for(const el of document.querySelectorAll('[data-shrink-max]'))fitText(el);}
fitAllText();if(document.fonts?.ready)document.fonts.ready.then(fitAllText);
window.FreeMixTitle={data:fields""")
])
edit('gtzip_converter.mjs',[
 ("['TextBlock','Ticker','Image','QRCode'].includes(e.type)", "['TextBlock','Ticker','Image','QRCode'].includes(e.type)&&!e.template"),
 ("QR offline: Text UTF-8", "Ticker.Template: um Layer com dois TextBlock e Image é um item rolável; AutoSize Shrink local 4px–fontSize, fila TypeAdd e unidadeSpeed não homologadas. QR offline: Text UTF-8")
])
