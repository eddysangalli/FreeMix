import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
export const W=1280,H=720;
export const freezeSha="5c72b43a8382d46eea9b2cf8bf56b8f94bb1024dc39b379664dcdb7c3571691d";
export const nativeHead="759929948fc84ca29d4ad0b65bfdddf98dfbb06f";
export const candidateSha='456696515dd7aabf87958e11a91bd324bab3f405fef68549c2cc16bf1e59647d';
export const roi=[{x:260,y:380},{x:460,y:380},{x:660,y:380}];
export const markers=Array.from({length:8},(_,i)=>({x:36+i*140,y:112}));
export const colors=[0xff0000ff,0xff00ff00,0xffff0000,0xff00ffff,0xffffff00,0xffff00ff,0xffffffff,0x800000ff];
export function ownPath(root,relative=''){
 const prefix=path.join(os.tmpdir(),'FreeMix-QA-FinalMasterChildD-');
 assert(path.resolve(root).startsWith(prefix),'Only exact childD TEMP roots are allowed');
 const full=path.resolve(root,relative),r=path.relative(root,full);assert(!r.startsWith('..')&&!path.isAbsolute(r),'Path escapes own root');return full;
}
export function reviewed(plan,runnerSha){
 assert(/^[a-f0-9]{40}$/.test(nativeHead)&&!/^0+$/.test(freezeSha),'Root Native29 immutable snapshot has not been bound');
 assert.equal(plan.fixtureContract,'long-nonloop-restart-interior-v1');assert.equal(plan.fixtureSeconds,240);assert.equal(plan.captureMarginMs,1000);assert.equal(plan.contractVersion,2);assert.equal(plan.gainDomain,'linear-sRGB');assert.equal(plan.renderTargetContract,'sRGB-SDR8');assert.equal(plan.qualification,false);
 assert.equal(plan.status,'ROOT_REVIEWED_EXECUTION_AUTHORIZED');assert.equal(plan.runnerSha256,runnerSha);
 assert.equal(plan.freezeSha256,freezeSha);assert.equal(plan.nativeHead,nativeHead);assert.equal(plan.candidateSha256,candidateSha);
 assert.deepEqual(plan.fps,[{num:30,den:1},{num:30000,den:1001}]);assert.equal(plan.operatorTouched,false);
 assert.deepEqual(plan.runnerFiles.map(f=>f.path).sort(),['audio-contract.mjs','candidate-context.mjs','guards.mjs','png.mjs','run.mjs','scenario.mjs']);assert(plan.runnerFiles.every(f=>/^[a-f0-9]{64}$/.test(f.sha256)));
}
export function setIni(text,section,values){
 const rows=text.replaceAll('\r','').split('\n');let start=rows.indexOf('['+section+']');
 if(start<0){rows.push('['+section+']');start=rows.length-1;}let end=start+1;while(end<rows.length&&!/^\[/.test(rows[end]))end++;
 const block=rows.slice(start+1,end);for(const[k,v]of Object.entries(values)){const n=block.findIndex(x=>x.startsWith(k+'='));if(n<0)block.push(k+'='+v);else block[n]=k+'='+v;}
 rows.splice(start+1,end-start-1,...block);return rows.join('\r\n');
}
export function linear(v){const s=v/255;return s<=.04045?s/12.92:((s+.055)/1.055)**2.4;}
export function meanRgb(rgb,x,y){assert(rgb.length>=(y+3)*W*3);const c=[0,0,0];for(let yy=y-2;yy<=y+2;yy++)for(let xx=x-2;xx<=x+2;xx++)for(let k=0;k<3;k++)c[k]+=rgb[(yy*W+xx)*3+k]/25;return c;}
export function sample(rgb){return {gray:roi.map(p=>meanRgb(rgb,p.x,p.y)),markers:markers.map(p=>meanRgb(rgb,p.x,p.y))};}
export function fullBlack(rgb,tolerance=8){let max=0,count=0;for(const v of rgb){max=Math.max(v,max);if(v>tolerance)count++;}return {max,aboveTolerance:count,pass:count===0};}
export function barcode(rgb){let id=0;const ref=meanRgb(rgb,1032,24).reduce((a,b)=>a+b)/3;if(ref<30)return null;for(let b=0;b<16;b++){const v=meanRgb(rgb,1032+b*16,8).reduce((a,b)=>a+b)/3;if(v>ref*.45)id|=1<<b;}return id;}
export function fixtureArgs(file,fps){
 const rate=fps.num+'/'+fps.den;
 return ['-hide_banner','-v','error','-y','-f','lavfi','-i',`color=c=0x808080:s=${W}x${H}:r=${rate}`,'-f','lavfi','-i',`testsrc2=s=240x160:r=${rate}`,'-f','lavfi','-i',`nullsrc=s=256x32:r=${rate},geq=lum='if(gte(Y,16),235,if(mod(floor(N/pow(2,floor(X/16))),2),235,16))':cb=128:cr=128`,'-f','lavfi','-i','aevalsrc=0.15*sin(2*PI*440*t)|0.15*sin(2*PI*880*t):s=48000',
 '-filter_complex','[0:v]drawbox=x=200:y=320:w=120:h=120:color=0xa0a0a0:t=fill,drawbox=x=400:y=320:w=120:h=120:color=0xb0b0b0:t=fill,drawbox=x=600:y=320:w=120:h=120:color=0xc0c0c0:t=fill[base];[base][1:v]overlay=20:500[tmp];[tmp][2:v]overlay=1024:0[v]',
 '-map','[v]','-map','3:a:0','-t','240','-threads','2','-filter_complex_threads','2','-c:v','libx264','-preset','veryfast','-crf','12','-pix_fmt','yuv420p','-color_primaries','bt709','-color_trc','iec61966-2-1','-colorspace','bt709','-c:a','aac','-b:a','192k',file];
}

// QA-owned seed only. SDK Load reconstructs precisely baseChannel+i for a nonempty array.
export const keyerNames=Array.from({length:8},(_,i)=>String(i+1));
export function seedOwnKeyers(scene){
 assert(Array.isArray(scene.sources)&&scene.sources.every(s=>['scene','color_source_v3'].includes(s.id)),'Fresh OWN scene/color seed required');
 scene.modules??={};scene.modules.downstream_keyers_channel=7;
 scene.modules.downstream_keyers=keyerNames.map(name=>({name,transition:'',transition_duration:300,show_transition:'',show_transition_duration:300,hide_transition:'',hide_transition_duration:300,hide_after:0,tie:false,scenes:[],scene:'',null_hotkey:[],enable_tie_hotkey:[],disable_tie_hotkey:[],exclude_scenes:[]}));
 return {channel:7,names:[...keyerNames],count:8,scenesBound:0,hotkeysBound:0};
}
export function recordDskEvent(rows,type,event){
 if(type!=='VendorEvent'||event?.vendorName!=='downstream-keyer'||event.eventType!=='dsk_scene_changed')return;
 const e=event.eventData;if(!e||!keyerNames.includes(e.dsk_name)||e.new_scene!=='OWN D DSK '+e.dsk_name)return;
 if(rows.length>=128)throw Error('Own DSK event bound exceeded');
 rows.push({label:e.dsk_name,channel:e.dsk_channel,scene:e.new_scene});
}
export function assertDskLayout(data,events){
 assert.equal(data.downstream_keyers_channel,7);assert.deepEqual(data.downstream_keyers.map(d=>d.name),keyerNames);
 if(events)for(let i=0;i<keyerNames.length;i++){const label=keyerNames[i];assert(events.some(e=>e.label===label&&e.channel===7+i&&e.scene==='OWN D DSK '+label),'Actual DSK channel event missing: '+label);}
}
