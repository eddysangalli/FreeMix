import fs from 'node:fs/promises';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {createHash} from 'node:crypto';
const own=import.meta.dirname,sha=b=>createHash('sha256').update(b).digest('hex');
const prompt=`Review independently INLINE ONLY, no tools/files/commands, <=500 words. Public C++ change:
struct Inventory { bool sourceRecordBusCapture=false,sourceRecordBusCaptureKnown=false; /* old ASIO/render flags unchanged */ };
void ObserveSourceRecordCapability(){ auto &cache=Inventory(); OBSDataAutoRelease d=obs_get_source_defaults("source_record_filter"); cache.sourceRecordBusCapture=d&&obs_data_get_bool(d,"freemix_premix_bus_capture"); cache.sourceRecordBusCaptureKnown=true; }
void FreeMixAudioRoutingRegister(){ static bool registered=false;if(registered)return;registered=true; /* old obs_register_source bus */ obs_frontend_add_event_callback([](obs_frontend_event event,void*){if(event==OBS_FRONTEND_EVENT_FINISHED_LOADING&&!Inventory().sourceRecordBusCaptureKnown)ObserveSourceRecordCapability();},nullptr); }
Explicit DiscoverAsio() preserves old driver/COM discovery then calls ObserveSourceRecordCapability(). GUI-thread audio_capabilities getter invokes no Observe/defaults; only serializes cached boolean plus source_record_bus_capture_known.
Observed public timing: OBSBasic.cpp FreeMixMultistreamInit at1024 -> Register, FINISHED_LOADING dispatched OnFirstLoad1341; module load in InitOBS before OnFirstLoad. Getter is QMetaObject BlockingQueuedConnection qApp; explicit scan and frontend events are same GUI thread. SourceRecord defaults selects profile encoder and invokes arbitrary obs_encoder_defaults callbacks; these are NOT proven pure. Startup observation is declared maintenance, NOT GET. No new timer/AsioSession/start/stop/config/mic. Noncapturing callback pointer lives in exe; static registration prevents duplicate. Cache stores booleans only, no OBS refs. Missing plugin -> knowntrue,false; coldunknown -> false,false; afterREADY true marker -> true,true. Explicit refresh always rereads, hot module/default capability changes require explicit refresh. Replay consumer capability true allows public independent bus isolation, coldunknown excludes buses.
Find concrete blocker vs limits in registration timing, caching/known semantics, lifetimes/threading, compatibility. Do not equate model/source review with compiled/runtime/hardware approval. Return precise verdict and missing proof.`;
await fs.writeFile(path.join(own,'PUBLIC-PROMPT.txt'),prompt);
await fs.writeFile(path.join(own,'AGY-STARTED.json'),JSON.stringify({model:'gemini-3.8-flash-high',cwd:own,promptSha256:sha(prompt),toolsRequested:false,deadlineSeconds:120},null,2)+'\n');
console.log('AGY_STARTED '+path.join(own,'AGY-RECEIPT.json'));
const result=await new Promise(resolve=>execFile('C:/Users/eddyr/AppData/Local/agy/bin/agy.exe',['-p',prompt,'--model','gemini-3.8-flash-high','--mode','plan','--sandbox','--output-format','json','--print-timeout','120s'],{cwd:own,windowsHide:true,timeout:125000,maxBuffer:1048576},(error,stdout,stderr)=>resolve({error,stdout,stderr})));
await fs.writeFile(path.join(own,'AGY-RESULT.json'),result.stdout);await fs.writeFile(path.join(own,'AGY-STDERR.txt'),result.stderr);
let parsed;try{parsed=JSON.parse(result.stdout);}catch{}
const response=typeof parsed?.response==='string'?parsed.response:'';
if(response)await fs.writeFile(path.join(own,'GEMINI-REVIEW.txt'),response);
const receipt={status:response?'RESPONSE_REQUIRES_SOURCE_REVIEW':'EMPTY_OR_FAILED_RESPONSE_NOT_APPROVAL',responseBytes:Buffer.byteLength(response),responseSha256:sha(response),conversationId:parsed?.conversation_id??null,exitCode:result.error?.code??0,ownChildOuterTimeout:!!result.error?.killed,cliPrintTimeout:/print timeout/i.test(result.stderr),quotaEvidence:/quota exceeded|RESOURCE_EXHAUSTED/i.test(result.stderr+'\n'+result.stdout),toolsRequested:false,canonicalChanged:false,nativeApiBrowserBuild:false};
await fs.writeFile(path.join(own,'AGY-RECEIPT.json'),JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));
