// Offside observation only. No Native, SDK, socket, filesystem or process mutations.
import {createObservation} from './meter-contract.mjs';
const ownName=/^QA Meter Own[ABC]$/, uuidPattern=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const mediaStates=new Set(['OBS_MEDIA_STATE_NONE','OBS_MEDIA_STATE_PLAYING','OBS_MEDIA_STATE_OPENING','OBS_MEDIA_STATE_BUFFERING','OBS_MEDIA_STATE_PAUSED','OBS_MEDIA_STATE_STOPPED','OBS_MEDIA_STATE_ENDED','OBS_MEDIA_STATE_ERROR']);
export function originalValue(value){
 if(value===null)return {type:'null',value:null};if(typeof value==='number')return Number.isFinite(value)?{type:'number',value}:{type:'number',value:null,numberKind:Number.isNaN(value)?'NaN':value===Infinity?'Infinity':'-Infinity'};
 return {type:Array.isArray(value)?'array':typeof value,value:null,...(typeof value==='string'?{stringLength:value.length}:{})};
}
function boundedOwnRows(data){return (Array.isArray(data?.inputs)?data.inputs:[]).slice(0,1000).filter(row=>ownName.test(row?.inputName||'')).slice(0,3).map(row=>({name:row.inputName,uuid:uuidPattern.test(row.inputUuid||'')?row.inputUuid:null,channelsPresent:Array.isArray(row.inputLevelsMul)?row.inputLevelsMul.length:null,channels:Array.isArray(row.inputLevelsMul)?row.inputLevelsMul.slice(0,8).map((ch,index)=>({index,positionsPresent:Array.isArray(ch)?ch.length:null,values:Array.isArray(ch)?ch.slice(0,3).map(originalValue):[]})):[]}));}
export function createDiagnosticObservation(label,now){
 const original=createObservation(label,now);
 const diagnostic={seenEvents:0,rejectedEvents:0,invalidValues:0,counts:{null:0,nonNumber:0,nonFinite:0,negative:0,aboveFixture5:0,shape:0},firstInvalidFrame:null,firstInvalidMs:null,lastInvalidMs:null,finiteMin:null,finiteMax:null,phase:'unassigned',samples:[],mediaReadback:null};
 function bad(reason,at,row,channel,position,value){
  diagnostic.counts[reason]++;if(reason!=='shape')diagnostic.invalidValues++;
  diagnostic.firstInvalidMs??=at;diagnostic.lastInvalidMs=at;
  if(diagnostic.samples.length<24)diagnostic.samples.push({eventNumber:diagnostic.seenEvents,eventType:'InputVolumeMeters',atMs:at,phase:diagnostic.phase,originalValue:originalValue(value),name:ownName.test(row?.inputName||'')?row.inputName:null,uuid:uuidPattern.test(row?.inputUuid||'')?row.inputUuid:null,channel,position,reason,value:typeof value==='number'&&Number.isFinite(value)?value:null,valueType:value===null?'null':typeof value,mediaReadback:diagnostic.mediaReadback});
 }
 return {state:original.state,diagnostic,
  setPhase(phase){if(!/^[A-Za-z0-9_-]{1,48}$/.test(phase))throw Error('Phase must be a bounded QA identifier');diagnostic.phase=phase;},
  setMediaReadback(rows,atMs){if(!Number.isSafeInteger(atMs)||atMs<0||!Array.isArray(rows)||rows.length>3)throw Error('Bounded readonly media receipt required');diagnostic.mediaReadback={atMs,rows:rows.filter(r=>uuidPattern.test(r?.uuid||'')&&mediaStates.has(r?.state)).map(r=>({uuid:r.uuid,state:r.state}))};},
  onEvent(type,data){
   if(type!=='InputVolumeMeters')return;const at=Math.round(now());diagnostic.seenEvents++;
   if(!Array.isArray(data?.inputs)||data.inputs.length>1000)bad('shape',at,null,null,null,null);
   else for(const row of data.inputs){if(!ownName.test(row?.inputName||''))continue;
    if(!Array.isArray(row.inputLevelsMul)||row.inputLevelsMul.length>8){bad('shape',at,row,null,null,null);continue;}
    row.inputLevelsMul.forEach((channel,c)=>{if(!Array.isArray(channel)||channel.length!==3){bad('shape',at,row,c,null,null);return;}
     channel.forEach((value,p)=>{if(typeof value==='number'&&Number.isFinite(value)){diagnostic.finiteMin=diagnostic.finiteMin===null?value:Math.min(value,diagnostic.finiteMin);diagnostic.finiteMax=diagnostic.finiteMax===null?value:Math.max(value,diagnostic.finiteMax);}
      const reason=value===null?'null':typeof value!=='number'?'nonNumber':!Number.isFinite(value)?'nonFinite':value<0?'negative':value>5?'aboveFixture5':null;
      if(reason)bad(reason,at,row,c,p,value);
     });
    });
   }
   const frameBeforeStrict={eventNumber:diagnostic.seenEvents,eventType:'InputVolumeMeters',atMs:at,phase:diagnostic.phase,inputCount:Array.isArray(data?.inputs)?data.inputs.length:null,ownRows:boundedOwnRows(data)};
   // Preserve exact original strict acceptance, sticky error and successful-event counters.
   const acceptedBefore=original.state.events;original.onEvent(type,data);if(original.state.events===acceptedBefore){diagnostic.rejectedEvents++;diagnostic.firstInvalidMs??=at;diagnostic.lastInvalidMs=at;diagnostic.firstInvalidFrame??=frameBeforeStrict;}
  },
  snapshot(){return {original:original.snapshot(),diagnostic:JSON.parse(JSON.stringify(diagnostic))};}
 };
}
