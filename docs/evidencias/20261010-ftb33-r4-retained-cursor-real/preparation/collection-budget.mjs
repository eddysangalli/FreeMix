// An expired read at the end of this fixed window is not a mutation retry.
export function observationWindowEnded(error,{triggerClockMs,nowMs,minimumObserved}){
 return error?.code==='OWN_DEADLINE'&&Number.isFinite(triggerClockMs)&&Number.isFinite(nowMs)&&nowMs-triggerClockMs>=10000&&minimumObserved>=3;
}
