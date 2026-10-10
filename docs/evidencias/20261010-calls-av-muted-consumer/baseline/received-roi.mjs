// QA receiver geometry only. Coordinates use actual video dimensions, never presumed sender dimensions.
export function receivedPoints(width,height){
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width>3840||height>2160)return null;
 const points=[[320,180],...Array.from({length:5},(_,bit)=>[40+bit*50,40])].map(([x,y])=>({x:Math.floor(x*width/640),y:Math.floor(y*height/360)}));
 if(points.some(p=>p.x<0||p.x>=width||p.y<0||p.y>=height)||new Set(points.map(p=>p.x+':'+p.y)).size!==6)return null;
 return points;
}
export function classifyReadback(pixels){
 if(!pixels||pixels.length!==24||Array.from(pixels).some(v=>!Number.isInteger(v)||v<0||v>255))return 'invalid';
 const alpha=Array.from({length:6},(_,i)=>pixels[i*4+3]);
 if(alpha.some(v=>v===0))return 'transparent';
 if(alpha.some(v=>v!==255))return 'partialAlpha';
 return pixels[0]===0&&pixels[1]===0&&pixels[2]===0?'opaqueBlack':'opaqueColour';
}
