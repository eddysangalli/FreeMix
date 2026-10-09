import {orientationViewport} from './composicao-estilos.mjs';
// One geometry catalog drives both native scene items and the numbered gallery.
const grid=(count,cols,area=[.04,.06,.92,.88],gap=.018)=>{
 const [x,y,w,h]=area,rows=Math.ceil(count/cols),cw=(w-gap*(cols-1))/cols,ch=(h-gap*(rows-1))/rows;
 return Array.from({length:count},(_,n)=>{const row=Math.floor(n/cols),inRow=Math.min(cols,count-row*cols),offset=(cols-inRow)*(cw+gap)/2;return [x+offset+(n%cols)*(cw+gap),y+row*(ch+gap),cw,ch];});
};
const catalog=[];
for(const orientation of ['landscape','portrait'])for(let count=2;count<=16;count++){
 const tall=orientation==='portrait',cols=Math.min(count,tall?2:Math.ceil(Math.sqrt(count*16/9)));
 const variants=[['grid','Grade com respiro',grid(count,cols)],['compact','Grade compacta',grid(count,Math.min(count,tall?3:Math.ceil(Math.sqrt(count))),[.015,.025,.97,.95],.008)]];
 const railCols=Math.ceil((count-1)/(tall?4:5));
 variants.push(['hero-right','Destaque + laterais',[[.035,.055,tall?.55:.68,.89],...grid(count-1,railCols,[tall?.62:.745,.055,tall?.345:.22,.89],.014)]]);
 variants.push(['hero-bottom','Destaque + rodapé',[[.035,.045,.93,tall?.63:.69],...grid(count-1,Math.min(count-1,tall?3:6),[.035,tall?.705:.765,.93,tall?.25:.19],.012)]]);
 variants.push(['hero-top','Destaque + topo',[[.035,tall?.325:.265,.93,tall?.63:.69],...grid(count-1,Math.min(count-1,tall?3:6),[.035,.045,.93,tall?.25:.19],.012)]]);
 if(count<=4)variants.push(['pip','PiP sobre tela',[[0,0,1,1],...Array.from({length:count-1},(_,n)=>[.71,.94-(n+1)*.245,.265,.22])]]);
 for(const [family,label,rects]of variants){const id=`${orientation}-${family}-${count}`;catalog.push({id,label:label+' · '+count,count,orientation,family,rects});}
}
// Remove equivalent geometries instead of inflating the number of models.
const seen=new Set();export const compositionPresets=catalog.filter(p=>{const key=p.orientation+JSON.stringify(p.rects);if(seen.has(key))return false;seen.add(key);return true;});
export function presetById(id){const p=compositionPresets.find(p=>p.id===id);if(!p)throw Error('Preset de composição inválido');return p;}
export function presetRects(id,video){const p=presetById(id),[x,y,w,h]=orientationViewport(video,p.orientation);return p.rects.map(r=>[x+r[0]*w,y+r[1]*h,r[2]*w,r[3]*h]);}
