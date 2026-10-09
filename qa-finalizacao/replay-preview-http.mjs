import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {servePreviewMedia} from '../ferramentas/midia-preview-http.mjs';

const root=await mkdtemp(join(tmpdir(),'FreeMix-QA-Preview-'));
const file=join(root,'frame.mp4'),data=Buffer.alloc(8*1024*1024);
for(let i=0;i<data.length;i++)data[i]=i%251;
await writeFile(file,data);
const leases=new Map(),checks=[];
const server=createServer(async(req,res)=>{
  const id=req.url.slice(1),item={releases:0};leases.set(id,item);
  await servePreviewMedia(req,res,{file,bytes:id==='changed'?data.length+1:data.length,mime:'video/mp4',release(){item.releases++;}});
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}`;
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
try{
  for(const [id,method,range,status,start,end] of [
    ['all','GET',undefined,200,0,data.length-1],
    ['head','HEAD',undefined,200,0,data.length-1],
    ['interval','GET','bytes=20-49',206,20,49],
    ['tail','GET','bytes=-64',206,data.length-64,data.length-1],
    ['open','GET',`bytes=${data.length-40}-`,206,data.length-40,data.length-1],
    ['clamp','GET',`bytes=${data.length-40}-${data.length+90}`,206,data.length-40,data.length-1],
    ['head-range','HEAD','bytes=20-49',206,20,49],
    ['out','GET',`bytes=${data.length}-`,416],
    ['multi','GET','bytes=0-1,4-8',416],
    ['reverse','GET','bytes=30-10',416],
    ['method','POST',undefined,405],
    ['changed','GET',undefined,404],
  ]){
    const response=await fetch(`${base}/${id}`,{method,headers:range?{Range:range}:{}});
    assert.equal(response.status,status,id);
    const actual=Buffer.from(await response.arrayBuffer());
    if(status<300){
      assert.equal(Number(response.headers.get('content-length')),end-start+1,id);
      assert.deepEqual(actual,method==='HEAD'?Buffer.alloc(0):data.subarray(start,end+1),id);
      if(status===206)assert.equal(response.headers.get('content-range'),`bytes ${start}-${end}/${data.length}`,id);
      assert.equal(response.headers.get('accept-ranges'),'bytes',id);
    }
    if(status===416)assert.equal(response.headers.get('content-range'),`bytes */${data.length}`,id);
    await wait(20);assert.equal(leases.get(id).releases,1,`${id}: lease liberada uma vez`);
    checks.push({id,status:'PASS',http:status});
  }
  const response=await fetch(`${base}/abort`);
  await response.body.cancel();await wait(150);
  assert.equal(leases.get('abort').releases,1,'abort libera lease');
  checks.push({id:'abort',status:'PASS'});
  await writeFile(new URL('./resultado-replay-preview-http.json',import.meta.url),JSON.stringify({at:new Date().toISOString(),scope:'HTTP em porta efêmera, arquivo binário isolado; não valida player nem motor',status:'PASS',checks},null,2));
  console.log(JSON.stringify({status:'PASS',checks:checks.length}));
}finally{
  server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
  await rm(root,{recursive:true,force:true});
}
