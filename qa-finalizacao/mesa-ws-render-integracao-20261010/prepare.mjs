import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
const dir=new URL('./',import.meta.url),path=new URL('../../FreeMix/painel/mesa.html',dir),base=await fs.readFile(path),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
let draft=base.toString();const replacements=[];
function replaceOnce(from,to){if(draft.split(from).length!==2)throw Error('Expected unique anchor');draft=draft.replace(from,to);replacements.push({fromSha256:sha(from),toSha256:sha(to)});}
const reqBefore=draft.slice(draft.indexOf('  const req ='),draft.indexOf('  const tryReq ='));
const reqAfter=`  // Correlated timeout: expiration does not prove that a mutation was cancelled.
  const WS_REQUEST_TIMEOUT_MS = 15000;
  let mesaDisposed = false;
  const uncertainRequest = (message, type) => Object.assign(new Error(message), {code:'FREEMIX_WS_UNCERTAIN', uncertain:true, requestType:type});
  const rejectMesaRequests = message => { for (const entry of pending.values()) entry.rej(uncertainRequest(message, entry.type)); };
  const req = (type, data) => new Promise((res, rej) => {
    if (mesaDisposed || !st.on) return rej(new Error('FreeMix sem conexão com o motor'));
    const id = String(++seq);
    let timer = null;
    const finish = (error, value) => {
      if (pending.get(id) !== entry) return;
      pending.delete(id); if (timer !== null) clearTimeout(timer);
      error ? rej(error) : res(value);
    };
    const entry = {type, res:value=>finish(null,value), rej:error=>finish(error)};
    pending.set(id, entry);
    timer = setTimeout(() => entry.rej(uncertainRequest('O motor não respondeu a tempo. Resultado incerto: confira o estado antes de repetir o comando.', type)), WS_REQUEST_TIMEOUT_MS);
    try { ws.send(JSON.stringify({op:6,d:{requestType:type,requestId:id,requestData:data}})); }
    catch { entry.rej(uncertainRequest('Não foi possível confirmar o envio ao motor. Confira o estado antes de repetir.', type)); }
  });
`;
replaceOnce(reqBefore,reqAfter.replace(/\r?\n/g,'\r\n'));
replaceOnce('  function connect() {\r\n','  function connect() {\r\n    if (mesaDisposed) return;\r\n');
replaceOnce('    mine.onmessage = async (ev) => {\r\n','    mine.onmessage = async (ev) => {\r\n      if (mesaDisposed || ws !== mine) return;\r\n');
replaceOnce('        pending.delete(m.d.requestId);\r\n','');
replaceOnce('      for (const p of pending.values()) p.rej(new Error("Conexão encerrada")); pending.clear();','      rejectMesaRequests("Conexão encerrada. Resultado incerto: confira o estado antes de repetir comandos.");\r\n      clearMesaPaints();');
replaceOnce('      renderAll(); setTimeout(connect, 2500);','      if (!mesaDisposed) { renderAll(); setTimeout(connect, 2500); }');
const eventStart=draft.indexOf('  function onEvent(type, d) {'),eventEnd=draft.indexOf('  function onMeters(inputs)',eventStart),eventBefore=draft.slice(eventStart,eventEnd);
let eventAfter=eventBefore.replace(/renderTiles\(\)/g,"scheduleMesaPaint('tiles')").replace(/renderBot\(\)/g,"scheduleMesaPaint('bot')").replace(/renderMixer\(\)/g,"scheduleMesaPaint('mixer')");
for(const type of ['CurrentProgramSceneChanged','CurrentPreviewSceneChanged','InputMuteStateChanged']){
 const line=eventAfter.split('\n').find(s=>s.includes('type === "'+type+'"'));if(!line)throw Error('Missing event branch');
 eventAfter=eventAfter.replace(line,line.replace("scheduleMesaPaint('tiles')","scheduleMesaPaint('tally')"));
}
replaceOnce(eventBefore,eventAfter);
const audioLine=draft.split('\n').find(s=>s.includes('const audioB = aud.length'));if(!audioLine)throw Error('Missing audio card marker');
replaceOnce(audioLine,audioLine.replaceAll('<button class=','<button data-role="input-audio" class='));
// Keep initial rendering and imperative UI actions synchronous. Batch event/metadata paint only.
const metadataStart=draft.indexOf('  async function productionMetadataLoop()'),metadataEnd=draft.indexOf('\n  renderAll(); connect();',metadataStart),metadata=draft.slice(metadataStart,metadataEnd);
replaceOnce(metadata,metadata.replace('const changed=JSON.stringify([tags,data.tally])!==JSON.stringify([st.inputTags,st.recursiveTally]);','const tagsChanged=JSON.stringify(tags)!==JSON.stringify(st.inputTags),tallyChanged=JSON.stringify(data.tally)!==JSON.stringify(st.recursiveTally);').replace('if(changed){renderTabs();renderTiles();}',"if(tagsChanged){renderTabs();scheduleMesaPaint('tiles');}else if(tallyChanged)scheduleMesaPaint('tally');"));
const visual=`  // BEGIN isolated visual integration: no command/request/state queue.
  const mesaPaintQueue = new Set();
  const mesaPaintFns = {tiles:renderTiles, tally:paintTileState, mixer:renderMixer, bot:renderBot};
  let mesaPaintFrame = null;
  function paintTileState() {
    const tiles = [...$('tiles').querySelectorAll('.tile[data-s]')], names = shown();
    const present = new Set(tiles.map(tile => tile.dataset.s));
    // Structural mismatch needs the normal renderer; never attach state to a stale card.
    if (!st.on || tiles.length !== names.length || names.some(name => !present.has(name))) return renderTiles();
    for (const tile of tiles) {
      const name = tile.dataset.s;
      const isOut = name === st.program || !!st.recursiveTally?.program?.includes(name);
      const isPv = !isOut && st.studio && (name === st.preview || !!st.recursiveTally?.preview?.includes(name));
      tile.classList.toggle('is-out', isOut); tile.classList.toggle('is-pv', !!isPv);
      const title = tile.querySelector('.tt');
      if (title) {
        title.classList.toggle('out', isOut); title.classList.toggle('pv', !!isPv);
        const close = title.querySelector('button[data-a="closeask"]');
        if (isOut) close?.remove();
        else if (!tile.classList.contains('min') && !close) {
          const button = document.createElement('button'); button.className = 'x';
          button.setAttribute('data-a', 'closeask'); button.setAttribute('data-v', name); button.title = 'Fechar esta entrada'; button.textContent = '×'; title.append(button);
        }
      }
      const audio = tile.querySelector('[data-role="input-audio"]');
      if (audio) {
        const aud = sceneAudio(name); audio.classList.toggle('on', aud.some(input => !st.audio.get(input)?.muted));
      }
    }
  }
  function clearMesaPaints() {
    mesaPaintQueue.clear();
    if (mesaPaintFrame !== null) cancelAnimationFrame(mesaPaintFrame);
    mesaPaintFrame = null;
  }
  function flushMesaPaints() {
    if (mesaDisposed) { clearMesaPaints(); return; }
    if (mesaPaintFrame !== null) cancelAnimationFrame(mesaPaintFrame);
    mesaPaintFrame = null;
    let names = [...mesaPaintQueue]; mesaPaintQueue.clear();
    if (names.includes('tiles')) names = names.filter(name => name !== 'tally');
    for (const name of names) try { mesaPaintFns[name](); } catch { console.warn('FreeMix: não foi possível atualizar um controle visual.'); }
  }
  function scheduleMesaPaint(name) {
    if (mesaDisposed) return;
    mesaPaintQueue.add(name);
    // Hidden windows retain only renderer names and repaint once when visible.
    if (!document.hidden && mesaPaintFrame === null) mesaPaintFrame = requestAnimationFrame(() => { mesaPaintFrame = null; flushMesaPaints(); });
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { if (mesaPaintFrame !== null) cancelAnimationFrame(mesaPaintFrame); mesaPaintFrame = null; }
    else if (mesaPaintQueue.size) scheduleMesaPaint([...mesaPaintQueue][0]);
  });
  window.addEventListener('pagehide', () => {
    mesaDisposed = true; clearMesaPaints();
    rejectMesaRequests('Painel encerrado. Resultado incerto: confira o estado antes de repetir comandos.');
    try { ws?.close(1000); } catch {}
  });
  // END isolated visual integration
`;
replaceOnce('  renderAll(); connect(); thumbLoop(); slowLoop(); mediaLoop(); productionMetadataLoop(); initMidi(); initSplitter();',visual.replace(/\r?\n/g,'\r\n')+'  renderAll(); connect(); thumbLoop(); slowLoop(); mediaLoop(); productionMetadataLoop(); initMidi(); initSplitter();');
await fs.writeFile(new URL('before-mesa.html',dir),base);await fs.writeFile(new URL('draft-mesa.html',dir),draft);
await fs.writeFile(new URL('base-pins.json',dir),JSON.stringify({source:'FreeMix/painel/mesa.html',baseSha256:sha(base),draftSha256:sha(draft),replacements,scope:'req/connect timeout correlation, onEvent/metadata visual paint and startup lifecycle helper only; A take/delete/shortcuts/input handoff unchanged'},null,2)+'\n');
const diff=spawnSync('git',['-c','core.autocrlf=false','diff','--no-index','--','before-mesa.html','draft-mesa.html'],{cwd:dir,encoding:'utf8'});if(diff.status!==1)throw Error('Expected draft diff');
await fs.writeFile(new URL('mesa.patch',dir),diff.stdout.replaceAll('a/before-mesa.html','a/painel/mesa.html').replaceAll('b/draft-mesa.html','b/painel/mesa.html'));
console.log(JSON.stringify({baseSha256:sha(base),draftSha256:sha(draft)}));
