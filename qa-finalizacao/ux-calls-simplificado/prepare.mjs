import fs from 'node:fs/promises';import crypto from 'node:crypto';
const base=import.meta.dirname,sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const paths={'calls.js':'obs-vmix/painel/remoto/calls.js','calls.html':'obs-vmix/painel/remoto/calls.html','calls-producao.mjs':'obs-vmix/ferramentas/calls-producao.mjs','talkback-rapido.js':'obs-vmix/painel/talkback-rapido.js'};
const pins=[];for(const[file,product]of Object.entries(paths)){const bytes=await fs.readFile(`${base}/baseline/${file}`);pins.push({product,baselineSha256:sha(bytes),bytes:bytes.length});}
await fs.writeFile(`${base}/baseline-pins.json`,JSON.stringify({productModified:false,pins},null,2)+'\n');
function replaceOnce(text,before,after){if(text.split(before).length!==2)throw Error('Draft anchor missing/ambiguous');return text.replace(before,after);}
let engine=await fs.readFile(`${base}/baseline/calls-producao.mjs`,'utf8');
engine=replaceOnce(engine,'// Talkback uses ONLY return bus B. A short lease closes the microphone if the console disappears.','// Private talkback uses individual PCM returns; legacy untargeted callers may use bus B.\r\n// A short lease closes the microphone if the console disappears.');
engine=replaceOnce(engine,'await this.release();this.rapidTargets=targets;await this.save();return;','await this.release();const previous=this.rapidTargets;this.rapidTargets=targets;try{await this.save();}catch(e){this.rapidTargets=previous;throw e;}return;');
engine=replaceOnce(engine,"if(!targets.length||targets.some(key=>!this.returnRoutes.some(r=>r.key===key)))throw Error('Selecione os convidados que devem ouvir o diretor');","if(!targets.length||targets.some(key=>!state.guests.some(g=>g.key===key)||!this.returnRoutes.some(r=>r.key===key)))throw Error('Selecione os convidados que devem ouvir o diretor');");
engine=replaceOnce(engine,"}else if(!this.p.state.buses||!state.returnAudio)throw Error('Ative primeiro um retorno B com cabo de áudio virtual na mesa');","}else if(Array.isArray(d.targets))throw Error('Retorno B é compartilhado e não garante destinos individuais. Prepare os retornos individuais em Calls.');else if(!this.p.state.buses||!state.returnAudio)throw Error('Ative primeiro um retorno B com cabo de áudio virtual na mesa');");
await fs.writeFile(`${base}/draft/calls-producao.mjs`,engine);
let rapid=await fs.readFile(`${base}/baseline/talkback-rapido.js`,'utf8');
rapid=replaceOnce(rapid,"const ready=individual?keys.length>0&&keys.every(key=>calls.returns?.some(r=>r.key===key&&r.publisher==='publishing')):calls?.returnAudio;","const ready=individual&&keys.length>0&&keys.every(key=>calls.guests?.some(g=>g.key===key)&&calls.returns?.some(r=>r.key===key&&r.publisher==='publishing')); ");
rapid=replaceOnce(rapid,"'Configure o mic nos três pontos.'","'Configure o microfone em Calls.'");
rapid=replaceOnce(rapid,"'Prepare os retornos e selecione convidados nos três pontos.'","'Abra Calls, prepare os retornos e escolha quem recebe.'");
rapid=replaceOnce(rapid,'!/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)','!/INPUT|SELECT|TEXTAREA|BUTTON/.test(e.target.tagName)');
rapid=replaceOnce(rapid,'button.disabled=!calls?.director||!calls.nativeWatchdog||!ready;',"const elsewhere=calls?.talking&&!lease&&!starting;\r\n      button.disabled=!calls?.director||!calls.nativeWatchdog||!ready||elsewhere;");
rapid=replaceOnce(rapid,"if(!held)hint(!calls?.director?'Configure o microfone em Calls.':!ready?'Abra Calls, prepare os retornos e escolha quem recebe.':'Convidados: '+keys.map(key=>calls.guests.find(g=>g.key===key)?.name||key).join(',')+'.');","if(!held)hint(!calls?.director?'Configure o microfone em Calls.':!calls.nativeWatchdog?'Atualize o motor para usar talkback seguro.':!ready?'Abra Calls, prepare os retornos e escolha quem recebe.':elsewhere?'O diretor está falando em outro controle. Aguarde soltar.':'Convidados: '+keys.map(key=>calls.guests.find(g=>g.key===key)?.person?.name||calls.guests.find(g=>g.key===key)?.name||key).join(', ')+'.');");
await fs.writeFile(`${base}/draft/talkback-rapido.js`,rapid);
const file=`${base}/draft/calls.js`;let ui=await fs.readFile(file,'utf8');
if(ui.includes('<div>Fontes escolhidas<div class="sources">'))ui=replaceOnce(ui,'<div>Fontes escolhidas<div class="sources">','<div data-custom'+"'+(audioMode!=='custom'?' hidden':'')+'"+'>Fontes escolhidas<div class="sources">');
await fs.writeFile(file,ui);
console.log(JSON.stringify({status:'DRAFT_PREPARED',baselineFiles:pins.length,productModified:false}));
