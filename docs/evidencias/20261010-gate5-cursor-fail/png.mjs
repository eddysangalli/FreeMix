// QA-only complete PNG decoder. No filesystem, requests or process on import.
import assert from'node:assert/strict';import{inflateSync}from'node:zlib';
const table=Uint32Array.from({length:256},(_,i)=>{let c=i;for(let b=0;b<8;b++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
export function crc(bytes){let c=0xffffffff;for(const b of bytes)c=table[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0;}
export function pngRgb(bytes){
 assert(Buffer.isBuffer(bytes)&&bytes.length<16e6);assert(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])));
 let p=8,w,h,type,ended=false,parts=[],ihdr=false;
 while(p+12<=bytes.length){const n=bytes.readUInt32BE(p),k=bytes.toString('ascii',p+4,p+8);assert(n<16e6&&p+n+12<=bytes.length,'PNG incomplete chunk');assert.equal(crc(bytes.subarray(p+4,p+8+n)),bytes.readUInt32BE(p+8+n),'PNG chunk CRC');const d=bytes.subarray(p+8,p+8+n);
  if(k==='IHDR'){assert(!ihdr&&p===8&&n===13);ihdr=true;w=d.readUInt32BE(0);h=d.readUInt32BE(4);type=d[9];assert(w>0&&h>0&&w*h<=1920*1080);assert.equal(d[8],8);assert([2,6].includes(type));assert.equal(d[10],0);assert.equal(d[11],0);assert.equal(d[12],0);}
  if(k==='IDAT'){assert(ihdr);parts.push(d);}p+=n+12;if(k==='IEND'){assert.equal(n,0);ended=true;break;}
 }
 assert(ihdr&&ended&&p===bytes.length&&parts.length,'PNG must end in complete IEND');const bpp=type===6?4:3,stride=w*bpp,raw=inflateSync(Buffer.concat(parts),{maxOutputLength:(stride+1)*h});assert.equal(raw.length,(stride+1)*h);const pixels=Buffer.alloc(stride*h);
 const paeth=(a,b,c)=>{const p=a+b-c,da=Math.abs(p-a),db=Math.abs(p-b),dc=Math.abs(p-c);return da<=db&&da<=dc?a:db<=dc?b:c;};
 for(let y=0;y<h;y++){const f=raw[y*(stride+1)];assert(f<=4);for(let x=0;x<stride;x++){const a=x>=bpp?pixels[y*stride+x-bpp]:0,b=y?pixels[(y-1)*stride+x]:0,c=y&&x>=bpp?pixels[(y-1)*stride+x-bpp]:0;pixels[y*stride+x]=(raw[y*(stride+1)+1+x]+(f===0?0:f===1?a:f===2?b:f===3?Math.floor((a+b)/2):paeth(a,b,c)))&255;}}
 const rgb=Buffer.alloc(w*h*3);for(let i=0;i<w*h;i++)pixels.copy(rgb,i*3,i*bpp,i*bpp+3);return{width:w,height:h,rgb,type};
}
export async function waitCompletePng(read,{timeoutMs=5000,now=()=>performance.now(),sleep=ms=>new Promise(r=>setTimeout(r,ms))}={}){
 const start=now();let last;while(now()-start<timeoutMs){try{const input=await read();const image=pngRgb(input.bytes);return{...input,image,waitMs:now()-start};}catch(e){last=e.message;}await sleep(25);}throw Error('PNG completa não confirmada em5s; hotkey não será repetida: '+last);
}
