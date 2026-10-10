// Own finite DOM model for event/state contracts. No CSS/layout/browser claims.
const voids=new Set(['INPUT','BR','HR','IMG','META','LINK','SOURCE','WBR']);
const decode=s=>s.replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
export class Event {
 constructor(type,opts={}){this.type=type;Object.assign(this,opts);this.bubbles=opts.bubbles??false;}
 preventDefault(){this.defaultPrevented=true;}
 stopImmediatePropagation(){this.stopped=true;}
}
class Text {constructor(text){this.nodeType=3;this.textContent=text;this.parentNode=null;} remove(){this.parentNode?.removeChild(this);}}
export class Element {
 constructor(tag='div'){this.nodeType=1;this.tagName=tag.toUpperCase();this.childNodes=[];this.attributes={};this.dataset=new Proxy({},{set:(target,key,value)=>{target[key]=String(value);this.attributes["data-"+String(key).replace(/[A-Z]/g,c=>"-"+c.toLowerCase())]=String(value);return true;}});this.listeners={};this.disabled=false;this.checked=false;this.hidden=false;this.parentNode=null;this._value='';this._selected=undefined;this.classList={add:(...xs)=>this.className=[...new Set([...this.className.split(/\s+/).filter(Boolean),...xs])].join(' '),remove:(...xs)=>this.className=this.className.split(/\s+/).filter(x=>!xs.includes(x)).join(' '),contains:x=>this.className.split(/\s+/).includes(x),toggle:(x,b)=>{if(b??!this.classList.contains(x))this.classList.add(x);else this.classList.remove(x);}};}
 get id(){return this.attributes.id||'';} set id(v){this.attributes.id=v;}
 get className(){return this.attributes.class||'';} set className(v){this.attributes.class=v;}
 get parentElement(){return this.parentNode;} get children(){return this.childNodes.filter(n=>n.nodeType===1);}
 get nextSibling(){if(!this.parentNode)return null;return this.parentNode.childNodes[this.parentNode.childNodes.indexOf(this)+1]||null;}
 get options(){return this.querySelectorAll('option');}get selectedOptions(){return this.options.filter(x=>x.value===this.value).slice(0,1);}
 get value(){if(this.tagName==='SELECT'){if(this._selected!==undefined)return this.options.some(o=>o.value===this._selected)?this._selected:'';return (this.options.find(o=>o.attributes.selected!==undefined)||this.options[0])?.value||'';}if(this.tagName==='OPTION'&&this.attributes.value===undefined)return this.textContent;return this._value;}
 set value(v){if(this.tagName==='SELECT')this._selected=String(v);else {this._value=String(v);if(this.tagName==='OPTION')this.attributes.value=String(v);}}
 get textContent(){return this.childNodes.map(n=>n.textContent).join('');}set textContent(v){this.childNodes=[];if(v!=='')this.append(new Text(String(v)));}
 get innerHTML(){return this._html||'';}set innerHTML(v){this._html=v;this.childNodes=[];this._selected=undefined;parse(v,this);}
 setAttribute(k,v){this.attributes[k]=String(v);if(k.startsWith('data-'))this.dataset[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=String(v);if(k==='value')this.value=v;if(k==='disabled')this.disabled=true;if(k==='checked')this.checked=true;}
 getAttribute(k){return this.attributes[k]??null;}
 append(...nodes){for(let n of nodes){if(typeof n==='string')n=new Text(n);if(!n)continue;n.remove?.();this.childNodes.push(n);n.parentNode=this;}}
 prepend(...nodes){for(const n of [...nodes].reverse()){n.remove?.();this.childNodes.unshift(n);n.parentNode=this;}}
 removeChild(n){this.childNodes=this.childNodes.filter(c=>c!==n);n.parentNode=null;}
 remove(){this.parentNode?.removeChild(this);}
 before(...nodes){if(!this.parentNode)return;const p=this.parentNode;for(const n of nodes){n.remove?.();p.childNodes.splice(p.childNodes.indexOf(this),0,n);n.parentNode=p;}}
 after(...nodes){if(!this.parentNode)return;const p=this.parentNode;let anchor=this;for(const n of nodes){n.remove?.();p.childNodes.splice(p.childNodes.indexOf(anchor)+1,0,n);n.parentNode=p;anchor=n;}}
 insertBefore(n,next){if(!next){this.append(n);return;}next.before(n);}
 replaceWith(...nodes){if(!this.parentNode)return;for(const n of nodes)this.before(n);this.remove();}
 replaceChildren(...nodes){for(const n of this.childNodes)n.parentNode=null;this.childNodes=[];this._selected=undefined;this.append(...nodes);}
 add(n){this.append(n);}
 contains(n){for(;n;n=n.parentNode)if(n===this)return true;return false;}
 matches(s){s=s.trim();const tag=s.match(/^[a-zA-Z][\w-]*/)?.[0];if(tag&&this.tagName!==tag.toUpperCase())return false;for(const m of s.matchAll(/\.([\w-]+)/g))if(!this.classList.contains(m[1]))return false;const id=s.match(/#([\w-]+)/)?.[1];if(id&&this.id!==id)return false;for(const m of s.matchAll(/\[([\w-]+)(?:=["']?([^\]"']+)["']?)?\]/g)){if(this.getAttribute(m[1])===null||m[2]!==undefined&&this.getAttribute(m[1])!==m[2])return false;}return true;}
 closest(s){for(let n=this;n;n=n.parentNode)if(n.nodeType===1&&n.matches(s))return n;return null;}
 querySelectorAll(s){const clauses=s.split(',').map(c=>c.trim().split(/\s+(?![^\[]*\])/));const out=[];const visit=n=>{for(const c of n.children){if(clauses.some(parts=>{if(!c.matches(parts.at(-1)))return false;let p=c.parentNode;for(let i=parts.length-2;i>=0;i--){while(p&&!p.matches(parts[i]))p=p.parentNode;if(!p)return false;p=p.parentNode;}return true;}))out.push(c);visit(c);}};visit(this);return out;}
 querySelector(s){return this.querySelectorAll(s)[0]||null;}
 focus(){this.ownerDocument?.activeElement===this;this.focused=true;}select(){}
 addEventListener(k,fn,opts){(this.listeners[k]??=[]).push({fn,capture:opts===true||!!opts?.capture});}
 dispatchEvent(e){e.target??=this;const ancestry=[];for(let p=this;p;p=p.parentNode)ancestry.push(p);const call=(p,capture)=>{for(const l of p.listeners[e.type]||[])if(l.capture===capture&&!e.stopped){const r=l.fn(e);if(r?.then)r.catch(()=>{});}};for(const p of [...ancestry].reverse())call(p,true);if(!e.stopped){const r=this['on'+e.type]?.(e);if(r?.then)r.catch(()=>{});call(this,false);}if(e.bubbles)for(const p of ancestry.slice(1)){if(e.stopped)break;call(p,false);}return !e.defaultPrevented;}
 click(){if(!this.disabled)this.dispatchEvent(new Event('click',{bubbles:true}));}
}
export function Option(text,value){const e=new Element('option');e.textContent=text;e.value=value;return e;}
export function parse(html,parent=new Element('document')){
 const stack=[parent];for(const t of html.match(/<!--[\s\S]*?-->|<[^>]+>|[^<]+/g)||[]){if(t.startsWith('<!--')||/^<!/.test(t))continue;if(t.startsWith('</')){const tag=t.slice(2).replace(/[>\s].*/,'').toUpperCase();let i=stack.length-1;while(i>0&&stack[i].tagName!==tag)i--;if(i>0)stack.length=i;continue;}if(t[0]==='<'){const tag=t.match(/^<([\w-]+)/)?.[1];if(!tag)continue;const e=new Element(tag);for(const m of t.slice(tag.length+1,-1).matchAll(/([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g))e.setAttribute(m[1],decode(m[2]??m[3]??m[4]??''));stack.at(-1).append(e);if(!voids.has(e.tagName)&&!t.endsWith('/>'))stack.push(e);}else stack.at(-1).append(new Text(decode(t)));}return parent;
}
export function documentFrom(html){const d=parse(html.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,''));d.createElement=tag=>new Element(tag);d.createComment=()=>new Text('');d.getElementById=id=>d.querySelector('#'+id);d.body=d.querySelector('body');d.head=d.querySelector('head');d.activeElement=d.body;return d;}
