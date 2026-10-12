// Standalone adapter only. SAME component/template as Mesa renderSideReplay.
(() => {'use strict';
 const host=document.getElementById('replay-dock-root');if(!host)return;
 const endpoint=new URL('/api/replay',location.href).href;
 const component=window.FreeMixReplayDock.mount(host,{endpoint,onSettings:()=>{location.href='/replay?view=settings#replay-config';},onRetention:()=>{location.href='/replay?view=settings#replay-config';}});
 document.getElementById('replay-window-close').onclick=()=>window.FreeMixClosePanel?.();
 let closed=false,polling=false,timer=null;
 async function poll(){if(closed||polling||component.isPosting())return;const admission=component.beginRead();polling=true;try{const response=await fetch(endpoint,{signal:AbortSignal.timeout(5000)});const result=await response.json();if(!closed&&response.ok&&result.success===true)component.acceptRead(admission,result.replay);}catch(error){if(!closed){const box=host.querySelector('#message');if(box)box.textContent=error.message;}}finally{polling=false;}}
 // A single timer per mounted document, no remount or replacement on a GET.
 timer=setInterval(poll,1000);poll();window.addEventListener('pagehide',()=>{closed=true;clearInterval(timer);component.close();},{once:true});
})();
