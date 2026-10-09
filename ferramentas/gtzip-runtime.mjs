// Converter-owned, self-contained event bridge. Does not read an operator's GC script.
export const GT_RUNTIME_SCRIPT=`(() => {
 const read=()=>{try{return JSON.parse(decodeURIComponent(location.hash.slice(1)))||{}}catch{return {}}};const config=read();let shown=false,leaving=0;
 const configure=timeline=>{if(window.FreeMixGCCompatibility?.version===1&&typeof window.GC?.configure==='function')window.GC.configure(timeline||{})};
 function show(on,instant=false){if(!window.GC||on===shown)return;shown=on;configure(config.timeline);if(on)window.GC.play(config.d||{});else window.GC.stop();if(instant)requestAnimationFrame(()=>document.getAnimations().filter(a=>a.animationName!=='ticker-horizontal'&&a.animationName!=='ticker-vertical').forEach(a=>{try{a.finish()}catch{}}));}
 window.addEventListener('DOMContentLoaded',()=>{configure(config.timeline);if(window.GC&&config.d)window.GC.update(config.d);if(!window.obsstudio)show(true)});
 window.addEventListener('obsSourceActiveChanged',e=>show(!!e.detail?.active));
 window.addEventListener('freemix-gc',e=>{const m=e.detail||{};if(m.name!==config.n)return;if(m.timeline){config.timeline=m.timeline;configure(m.timeline)}if(m.data){config.d={...config.d,...m.data};window.GC?.update(config.d)}if(typeof m.show==='boolean'){if(!m.show)leaving=Date.now();if(m.replay===true&&m.show)shown=false;show(m.show)}});
 window.addEventListener('freemix-gc-air',e=>{const names=e.detail?.names||[];if(names.includes(config.n)&&!shown&&Date.now()-leaving>2500)show(true,true)});
})();
`;
