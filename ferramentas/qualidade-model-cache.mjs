import{lstat,realpath}from'node:fs/promises';import{createReadStream}from'node:fs';import{createHash}from'node:crypto';
export const TINY_POLICY=Object.freeze({sha256:'be07e048e1e599ad46341c8d2a135645097a538221678b7acdd1b1919c6e1b21',bytes:77691713});
async function identity(file){const resolved=await realpath(file),s=await lstat(file,{bigint:true});if(!s.isFile()||s.isSymbolicLink())throw Error('MODEL_NOT_REGULAR');return{resolved,bytes:Number(s.size),stamp:[s.dev,s.ino,s.size,s.mtimeNs,s.ctimeNs].join(':')};}
async function hash(file){const h=createHash('sha256');for await(const b of createReadStream(file))h.update(b);return h.digest('hex');}
// Every call stats. Approval cache bounded4/TTL5s; hash jobs bounded2, no queue.
export function createTinyVerifier({policy=TINY_POLICY,readIdentity=identity,readHash=hash,now=Date.now,ttlMs=5000}={}){
 policy=Object.freeze({...policy});
 if(!/^[a-f0-9]{64}$/.test(policy.sha256)||!Number.isSafeInteger(policy.bytes)||policy.bytes<1||!Number.isFinite(ttlMs)||ttlMs<0||ttlMs>5000)throw Error('MODEL_POLICY');
 const entries=[],jobs=[];return async(file,{obs=null,scope=null}={})=>{try{const before=await readIdentity(file);if(before.bytes!==policy.bytes)throw Error('MODEL_SIZE');const key=JSON.stringify([before.resolved,before.stamp,policy.sha256,policy.bytes]),t=now();
  for(let j=entries.length-1;j>=0;j--)if(entries[j].file===file&&(entries[j].key!==key||entries[j].expires<=t||entries[j].obs!==obs||entries[j].scope!==scope))entries.splice(j,1);
  const cached=entries.find(e=>e.key===key&&e.obs===obs&&e.scope===scope);if(cached)return cached.match;
  const existing=jobs.find(j=>j.key===key&&j.obs===obs&&j.scope===scope);if(existing)return await existing.promise;
  if(jobs.length>=2)return false;const job={key,obs,scope,promise:null};jobs.push(job);
  job.promise=Promise.resolve().then(async()=>{const actual=await readHash(before.resolved),after=await readIdentity(file);if(after.resolved!==before.resolved||after.stamp!==before.stamp||after.bytes!==before.bytes)throw Error('MODEL_CHANGED_DURING_HASH');const match=actual===policy.sha256;
   if(match&&obs&&scope&&ttlMs){if(entries.length>=4)entries.shift();entries.push({file,key,obs,scope,match,expires:now()+ttlMs});}return match;
  }).finally(()=>{const i=jobs.indexOf(job);if(i>=0)jobs.splice(i,1);});return await job.promise;
 }catch{for(let j=entries.length-1;j>=0;j--)if(entries[j].file===file)entries.splice(j,1);return false;}};
}
