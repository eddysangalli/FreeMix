import {deflateSync} from 'node:zlib';
import {mkdir,writeFile,access,rename} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {normalizeAdvancedMask} from './composicao-advanced-masks.mjs';

export function normalizeMask(value){
 if(value==null||value.type==='none')return {type:'none'};
 if(value.type==='advanced')return normalizeAdvancedMask(value);
 if(!value||typeof value!=='object'||!['ellipse','rounded','polygon'].includes(value.type))throw Error('Máscara: escolha elipse, cantos arredondados ou polígono');
 if(value.type==='rounded'){const radius=Number(value.radius??.12);if(!Number.isFinite(radius)||radius<0||radius>.5)throw Error('Raio da máscara: 0 a 0,5');return {type:'rounded',radius};}
 if(value.type==='ellipse')return {type:'ellipse'};
 const points=value.points;if(!Array.isArray(points)||points.length<3||points.length>32||points.some(p=>!Array.isArray(p)||p.length!==2||p.some(n=>!Number.isFinite(n)||n<0||n>1)))throw Error('Polígono: 3 a 32 pares X,Y entre 0 e 1');
 const area=points.reduce((sum,p,n)=>{const q=points[(n+1)%points.length];return sum+p[0]*q[1]-q[0]*p[1];},0);if(Math.abs(area)<.0001)throw Error('Polígono sem área');return {type:'polygon',points:points.map(p=>[...p])};
}
export function maskContains(mask,x,y,aspect=1){
 if(x<0||y<0||x>1||y>1)return false;
 if(mask.type==='ellipse')return (x*2-1)**2+(y*2-1)**2<=1;
 if(mask.type==='rounded'){const rx=mask.radius*Math.min(1,1/aspect),ry=mask.radius*Math.min(1,aspect),dx=Math.max(rx-x,0,x-(1-rx)),dy=Math.max(ry-y,0,y-(1-ry));return !rx||!ry||(dx/rx)**2+(dy/ry)**2<=1;}
 if(mask.type==='polygon'){let inside=false;for(let i=0,j=mask.points.length-1;i<mask.points.length;j=i++){const [xi,yi]=mask.points[i],[xj,yj]=mask.points[j];if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)inside=!inside;}return inside;}
 return true;
}
const crcTable=Uint32Array.from({length:256},(_,n)=>{let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
const crc=data=>{let c=0xffffffff;for(const b of data)c=crcTable[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0;};
function chunk(type,data){const t=Buffer.from(type),head=Buffer.alloc(4),tail=Buffer.alloc(4);head.writeUInt32BE(data.length);tail.writeUInt32BE(crc(Buffer.concat([t,data])));return Buffer.concat([head,t,data,tail]);}
export function alphaPNG(width,height,alpha,color=[255,255,255]){const raw=Buffer.alloc((width*4+1)*height);for(let y=0;y<height;y++)for(let x=0;x<width;x++){const i=y*(width*4+1)+1+x*4;raw[i]=color[0];raw[i+1]=color[1];raw[i+2]=color[2];raw[i+3]=Math.round(Math.min(255,Math.max(0,alpha[y*width+x])));}const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(width);ihdr.writeUInt32BE(height,4);ihdr[8]=8;ihdr[9]=6;return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);}
export function rasterMask(mask,width,height){const data=new Float32Array(width*height);for(let y=0;y<height;y++)for(let x=0;x<width;x++){let hits=0;for(const [dx,dy]of [[.25,.25],[.75,.25],[.25,.75],[.75,.75]])if(maskContains(mask,(x+dx)/width,(y+dy)/height,width/height))hits++;data[y*width+x]=hits*255/4;}return data;}
function gaussian(data,w,h,sigma){const radius=Math.ceil(sigma*3),kernel=Array.from({length:radius*2+1},(_,n)=>Math.exp(-((n-radius)**2)/(2*sigma*sigma))),total=kernel.reduce((a,b)=>a+b,0);for(let n=0;n<kernel.length;n++)kernel[n]/=total;const tmp=new Float32Array(data.length),out=new Float32Array(data.length);for(let y=0;y<h;y++)for(let x=0;x<w;x++){let sum=0;for(let n=-radius;n<=radius;n++)if(x+n>=0&&x+n<w)sum+=data[y*w+x+n]*kernel[n+radius];tmp[y*w+x]=sum;}for(let y=0;y<h;y++)for(let x=0;x<w;x++){let sum=0;for(let n=-radius;n<=radius;n++)if(y+n>=0&&y+n<h)sum+=tmp[(y+n)*w+x]*kernel[n+radius];out[y*w+x]=sum;}return out;}
export async function styleAsset(root,style,width,height){
 const shadow=style.shadow===true,mask=normalizeMask(shadow&&style.mask?.type==='advanced'?{type:'none'}:style.mask);
 const id=createHash('sha256').update(JSON.stringify({mask,shadow,width,height,revision:1})).digest('hex').slice(0,32),folder=join(root,'config/obs-studio/plugin_config/freemix-inputs/assets'),file=join(folder,id+'.png');await mkdir(folder,{recursive:true});
 const scale=Math.min(1,1024/Math.max(width,height)),w=Math.max(1,Math.round(width*scale)),h=Math.max(1,Math.round(height*scale));
 const pad=shadow?Math.max(4,Math.ceil(18*scale)):0,sigma=shadow?Math.max(1,6*scale):0,W=w+pad*2,H=h+pad*2;
 try{await access(file);}catch{let alpha;if(shadow){alpha=new Float32Array(W*H);const shape=rasterMask(mask,w,h);for(let y=0;y<h;y++)for(let x=0;x<w;x++)alpha[(y+pad)*W+x+pad]=shape[y*w+x]*.43;alpha=gaussian(alpha,W,H,sigma);}else alpha=rasterMask(mask,w,h);await writeFile(file+'.tmp',alphaPNG(W,H,alpha,shadow?[0,0,0]:[255,255,255]));await rename(file+'.tmp',file);}
 return {file,width:W/scale,height:H/scale,pad:pad/scale};
}
export function orientationViewport(video,orientation){const aspect=video.baseWidth/video.baseHeight;if(orientation==='portrait'&&aspect>9/16){const width=(9/16)/aspect;return [(1-width)/2,0,width,1];}if(orientation==='landscape'&&aspect<16/9){const height=aspect/(16/9);return [0,(1-height)/2,1,height];}return [0,0,1,1];}
export function anchoredRect(video,orientation,anchor,size,margin=[.04,.04]){
 if(!['top-left','top-center','top-right','center','bottom-left','bottom-center','bottom-right'].includes(anchor)||!['portrait','landscape'].includes(orientation))throw Error('Orientação ou âncora inválida');
 if(!Array.isArray(size)||size.length!==2||size.some(n=>!Number.isFinite(n)||n<.01||n>1)||!Array.isArray(margin)||margin.length!==2||margin.some(n=>!Number.isFinite(n)||n<0||n>.4)||size.some((n,i)=>n+margin[i]*2>1.001))throw Error('Tamanho/margem fora da área segura');
 const [x,y,w,h]=orientationViewport(video,orientation),[sw,sh]=size;let px=anchor.endsWith('left')?margin[0]:anchor.endsWith('right')?1-margin[0]-sw:(1-sw)/2,py=anchor.startsWith('top')?margin[1]:anchor.startsWith('bottom')?1-margin[1]-sh:(1-sh)/2;return [x+px*w,y+py*h,sw*w,sh*h];
}
