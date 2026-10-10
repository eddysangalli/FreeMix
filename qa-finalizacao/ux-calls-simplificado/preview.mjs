import fs from 'node:fs/promises';import {mockServer,copyStyles} from './test/mock-server.mjs';
await copyStyles();const instance=await mockServer();
await fs.writeFile(new URL('./preview-runtime.json',import.meta.url),JSON.stringify({ownQA:true,mockedAudio:true,nativeExecuted:false,pid:process.pid,url:instance.url+'/calls'},null,2)+'\n');
console.log(JSON.stringify({url:instance.url+'/calls',ownQA:true,pid:process.pid}));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,async()=>{await instance.close();process.exit(0);});
