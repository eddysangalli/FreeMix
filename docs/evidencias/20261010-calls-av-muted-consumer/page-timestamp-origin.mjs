// Separate HYPOTHESIS intervention. OFF by default; no timer, stream, AudioContext or Native API.
const fail=code=>{throw Object.assign(Error(code),{code});};
export class PageTimestampOrigin{
 constructor(){this.enabled=false;this.closed=false;this.sourceBase=null;this.pageOrigin=null;this.last={audio:-1,video:-1};}
 setEnabled(value){if(this.closed)fail('PAGE_CLOCK_CLOSED');this.enabled=value===true;if(!this.enabled){this.sourceBase=null;this.pageOrigin=null;this.last={audio:-1,video:-1};}}
 arm({sourceBaseNs,pageCaptureOriginUs}){if(!this.enabled||this.closed)fail('PAGE_CLOCK_DISABLED');if(typeof sourceBaseNs!=='bigint'||sourceBaseNs<0n||!Number.isSafeInteger(pageCaptureOriginUs)||pageCaptureOriginUs<0)fail('PAGE_CLOCK_ORIGIN');if(this.sourceBase!==null&&(this.sourceBase!==sourceBaseNs||this.pageOrigin!==pageCaptureOriginUs))fail('PAGE_CLOCK_REANCHOR_REQUIRES_NEW_OWNER');this.sourceBase=sourceBaseNs;this.pageOrigin=pageCaptureOriginUs;}
 translate(kind,relativeUs){if(this.closed)fail('PAGE_CLOCK_CLOSED');if(!this.enabled)return relativeUs;if(this.sourceBase===null)fail('PAGE_CLOCK_NOT_ARMED');if(!['audio','video'].includes(kind)||!Number.isSafeInteger(relativeUs)||relativeUs<0||relativeUs<=this.last[kind])fail('PAGE_CLOCK_BACKWARDS');const value=this.pageOrigin+relativeUs;if(!Number.isSafeInteger(value))fail('PAGE_CLOCK_OVERFLOW');this.last[kind]=relativeUs;return value;}
 wrapCreateFrame(kind,create){if(typeof create!=='function')fail('PAGE_CLOCK_FACTORY');return(data,init)=>{if(this.closed)fail('PAGE_CLOCK_CLOSED');return create(data,this.enabled?{...init,timestamp:this.translate(kind,init.timestamp)}:init);};}
 close(){this.enabled=false;this.closed=true;this.sourceBase=null;this.pageOrigin=null;this.last={audio:-1,video:-1};}
}
