import {open} from 'node:fs/promises';
import {pipeline} from 'node:stream/promises';

// The provider supplies a leased cache entry, never a path from the request.
export function mediaRange(header,size){
  if(header===undefined)return {start:0,end:size-1,partial:false};
  const match=/^bytes=(\d*)-(\d*)$/.exec(String(header).trim());
  if(!match||(!match[1]&&!match[2])||size<=0)return null;
  let start,end;
  if(!match[1]){
    const tail=Number(match[2]);
    if(!Number.isSafeInteger(tail)||tail<=0)return null;
    start=Math.max(0,size-tail);end=size-1;
  }else{
    start=Number(match[1]);end=match[2]?Number(match[2]):size-1;
    if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>=size||end<start)return null;
    end=Math.min(end,size-1);
  }
  return {start,end,partial:true};
}

export async function servePreviewMedia(req,res,lease){
  let handle,stream;
  const cancel=()=>stream?.destroy();
  try{
    res.setHeader('Cache-Control','no-store');
    res.setHeader('X-Content-Type-Options','nosniff');
    if(!['GET','HEAD'].includes(req.method)){
      res.writeHead(405,{Allow:'GET, HEAD','Content-Length':'0'}).end();return;
    }
    handle=await open(lease.file,'r');
    const stat=await handle.stat();
    if(!stat.isFile()||stat.size!==lease.bytes||stat.size<=0)throw Error('Prévia indisponível');
    const range=mediaRange(req.headers.range,stat.size);
    res.setHeader('Accept-Ranges','bytes');
    if(!range){
      res.writeHead(416,{'Content-Range':`bytes */${stat.size}`,'Content-Length':'0'}).end();return;
    }
    const headers={'Content-Type':lease.mime||'video/mp4','Content-Length':String(range.end-range.start+1)};
    if(range.partial)headers['Content-Range']=`bytes ${range.start}-${range.end}/${stat.size}`;
    res.writeHead(range.partial?206:200,headers);
    if(req.method==='HEAD'){res.end();return;}
    stream=handle.createReadStream({start:range.start,end:range.end,autoClose:false});
    req.once('aborted',cancel);res.once('close',cancel);
    await pipeline(stream,res);
  }catch(error){
    if(res.headersSent){res.destroy();return;}
    const data=JSON.stringify({success:false,error:'Prévia indisponível; atualize o histórico'});
    res.writeHead(404,{'Content-Type':'application/json; charset=utf-8','Content-Length':Buffer.byteLength(data)}).end(data);
  }finally{
    req.off('aborted',cancel);res.off('close',cancel);
    stream?.destroy();
    try{await handle?.close();}finally{lease.release();}
  }
}
