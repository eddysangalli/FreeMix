import {GT_QR_ENCODER,GT_QR_LICENSE,gtQrEncoderFactory} from './gtzip-qr-bundle.mjs';
export {GT_QR_LICENSE};
const encoder=gtQrEncoderFactory();
// Pure contract shared by parser and the generated offline browser runtime.
export function validateGtQr(text,width,height){
 if(!Number.isInteger(width)||width<16||width>2048||width!==height)return 'QR: dimensões quadradas inteiras de 16 a 2048 pixels são necessárias';
 if(typeof text!=='string'||!text.length)return 'QR: texto vazio não é suportado';
 if(/[\u0000-\u001f\u007f]/.test(text))return 'QR: caracteres de controle não são suportados';
 for(let i=0;i<text.length;i++){const c=text.charCodeAt(i);if(c>=0xd800&&c<=0xdbff){const next=text.charCodeAt(++i);if(!(next>=0xdc00&&next<=0xdfff))return 'QR: UTF-8 inválido';}else if(c>=0xdc00&&c<=0xdfff)return 'QR: UTF-8 inválido';}
 if(new TextEncoder().encode(text).length>512)return 'QR: limite de 512 bytes UTF-8 excedido';
 return null;
}
export function validateGtQrField(text,width,height){
 const error=validateGtQr(text,width,height);if(error)return error;
 try{if(encoder.create([{data:text,mode:'byte'}],{errorCorrectionLevel:'M'}).modules.size+8>width)return 'QR: dimensão insuficiente para um pixel por módulo e quiet-zone4';}catch{return 'QR: texto não pôde ser codificado';}
 return null;
}
export const GT_QR_RUNTIME_SCRIPT=`/* qrcode 1.5.4 + dijkstrajs 1.0.3, MIT; see QR-LICENSE.txt. Offline, no URL requests. */
(()=>{'use strict';const encoder=${GT_QR_ENCODER},validate=${validateGtQr.toString()};
function render(el,text){let error=el.dataset.qrUnsupported||validate(text,Number(el.dataset.qrWidth),Number(el.dataset.qrHeight));let qr;if(!error){try{qr=encoder.create([{data:text,mode:'byte'}],{errorCorrectionLevel:'M'});if(qr.modules.size+8>Number(el.dataset.qrWidth))error='QR: dimensão insuficiente para um pixel por módulo e quiet-zone4';}catch{error='QR: texto não pôde ser codificado';}}
el.replaceChildren();if(error){el.dataset.qrError=error;el.setAttribute('aria-label',error);return {ok:false,error};}delete el.dataset.qrError;el.setAttribute('aria-label','QR FreeMix');const size=qr.modules.size,total=size+8,ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),background=document.createElementNS(ns,'rect'),foreground=document.createElementNS(ns,'path');svg.setAttribute('viewBox','0 0 '+total+' '+total);svg.setAttribute('width','100%');svg.setAttribute('height','100%');svg.setAttribute('shape-rendering','crispEdges');background.setAttribute('width',total);background.setAttribute('height',total);background.setAttribute('fill','#fff');let d='';for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(qr.modules.get(y,x))d+='M'+(x+4)+' '+(y+4)+'h1v1h-1z';foreground.setAttribute('d',d);foreground.setAttribute('fill','#000');svg.append(background,foreground);el.append(svg);return {ok:true,modules:size,bytes:new TextEncoder().encode(text).length};}
window.FreeMixGtQr={render,contract:{qrcode:'1.5.4',ecc:'M',quietZone:4,maxUtf8Bytes:512}};
})();`;
