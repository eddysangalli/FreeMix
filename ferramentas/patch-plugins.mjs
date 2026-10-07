// One-off edit of painel/mesa.html: wire MultiCorder (Source Record), PlayList, Loop, Audio and Close.
import { readFileSync, writeFileSync } from "node:fs";

const file = "D:/DRIVE/IA/antigravity/vmixtwste/obs-vmix/painel/mesa.html";
let s = readFileSync(file, "utf8");
let done = 0, missing = 0;
const rep = (a, b) => { if (!s.includes(a)) { missing++; console.log("trecho não encontrado:", a.slice(0, 70).replace(/\n/g, " ")); return; } s = s.replace(a, () => b); done++; };

/* ---- CSS ---- */
rep(`  .tt .tag.none { border-color: transparent; }`,
  `  .tt .iso, .pop .iso { background: var(--red); color: #fff; font-size: 9px; font-weight: 700; padding: 0 4px; margin-right: 4px; flex: none; }
  .pop label.chk { display: flex; gap: 6px; align-items: center; margin-bottom: 3px; color: var(--tx); } .pop label.chk input { height: auto; }
  .bot .arrow { width: 18px; padding: 0; border-left: 0; font-size: 9px; }
  .tt .tag.none { border-color: transparent; }`);

/* ---- constants and state ---- */
rep(`const SUBS = 1 | 4 | 8 | 16 | 64 | 1024 | 65536; // geral, cenas, entradas, transições, saídas, interface, medidores`,
  `const SUBS = 1 | 4 | 8 | 16 | 64 | 128 | 1024 | 65536; // geral, cenas, entradas, transições, saídas, itens de cena, interface, medidores`);
rep(`  const NA = "Sem equivalente no OBS";`,
  `  const NA = "Sem equivalente no OBS";
  const ISO = "Gravação ISO"; // nome do filtro do plugin Source Record em cada entrada gravada
  const isMedia = (kind) => kind === "ffmpeg_source" || kind === "vlc_source" || /playlist/.test(kind);
  const isPlaylist = (kind) => kind === "vlc_source" || /playlist/.test(kind);
  const loopKey = (kind) => (kind === "ffmpeg_source" ? "looping" : "loop");`);
rep(`audio: new Map(), keyers: null, tags:`,
  `audio: new Map(), keyers: null, items: new Map(), loop: new Map(), iso: new Map(), isoSel: store.get("mesa.iso", []), hasIso: false, pl: null, tags:`);

/* ---- sync ---- */
rep(`st.preview = r.currentPreviewSceneName || "";
    renderTiles();
  }`,
  `st.preview = r.currentPreviewSceneName || "";
    renderTiles(); laterItems();
  }`);
rep(`  async function syncAll() {`,
  `  // What each entry (scene) holds: media sources for Loop, audio sources for Audio, the recording filter for MultiCorder.
  async function syncItems() {
    const items = new Map(), loop = new Map(), iso = new Map(); let pl = null;
    for (const name of st.scenes) {
      const r = await tryReq("GetSceneItemList", { sceneName: name });
      const list = (r?.sceneItems || []).filter((i) => i.inputKind).map((i) => ({ name: i.sourceName, kind: i.inputKind }));
      items.set(name, list);
      for (const i of list) {
        if (isMedia(i.kind) && !loop.has(i.name)) loop.set(i.name, !!(await tryReq("GetInputSettings", { inputName: i.name }))?.inputSettings?.[loopKey(i.kind)]);
        if (isPlaylist(i.kind) && !pl) pl = { name: i.name, kind: i.kind, scene: name, state: st.pl?.state, time: st.pl?.time };
      }
      const f = st.hasIso ? await tryReq("GetSourceFilter", { sourceName: name, filterName: ISO }) : null;
      iso.set(name, !!f && f.filterEnabled && f.filterSettings?.record_mode === 1);
    }
    st.items = items; st.loop = loop; st.iso = iso; st.pl = pl;
    renderTiles(); renderBot(); if (st.pop === "iso" || st.pop === "playlist") renderPop();
  }
  let itemsTimer = 0;
  const laterItems = () => { clearTimeout(itemsTimer); itemsTimer = setTimeout(() => syncItems().catch(() => {}), 350); };
  async function syncPl() {
    if (!st.pl) return;
    const r = await tryReq("GetMediaInputStatus", { inputName: st.pl.name }); if (!r) return;
    const t = (ms) => (ms == null ? "" : new Date(ms).toISOString().slice(14, 19));
    st.pl.state = { OBS_MEDIA_STATE_PLAYING: "tocando", OBS_MEDIA_STATE_PAUSED: "pausado", OBS_MEDIA_STATE_STOPPED: "parado", OBS_MEDIA_STATE_ENDED: "terminou" }[r.mediaState] || "";
    st.pl.time = r.mediaDuration ? \`\${t(r.mediaCursor)} / \${t(r.mediaDuration)}\` : "";
    if (st.pop === "playlist") renderPop();
  }
  const sceneAudio = (name) => (st.items.get(name) || []).map((i) => i.name).filter((n) => st.audio.has(n));
  async function syncAll() {`);
rep(`st.video = video; st.kinds = kinds.inputKinds;`,
  `st.video = video; st.kinds = kinds.inputKinds;
    st.hasIso = !!(await tryReq("GetSourceFilterKindList"))?.sourceFilterKinds?.includes("source_record_filter");`);
rep(`await syncKeyers(); st.stats = await tryReq("GetStats");`, `await syncKeyers(); await syncItems(); st.stats = await tryReq("GetStats");`);

/* ---- events ---- */
rep(`else if (type === "SceneListChanged") { setScenes(d.scenes); renderTiles(); }`, `else if (type === "SceneListChanged") { setScenes(d.scenes); renderTiles(); laterItems(); }
    else if (type === "SceneItemCreated" || type === "SceneItemRemoved" || type === "InputSettingsChanged") laterItems();`);
rep(`if (a) { a.muted = d.inputMuted; renderMixer(); } }`, `if (a) { a.muted = d.inputMuted; renderMixer(); renderTiles(); } }`);
rep(`      await syncKeyers();
    }
  }`, `      await syncKeyers();
      if (st.pop === "playlist") await syncPl();
    }
  }`);

/* ---- actions ---- */
rep(`    record: () => run(req("ToggleRecord")),`,
  `    loop: (d) => run((async () => { for (const i of (st.items.get(d.v) || []).filter((i) => isMedia(i.kind))) await req("SetInputSettings", { inputName: i.name, inputSettings: { [loopKey(i.kind)]: !st.loop.get(i.name) } }); await syncItems(); })()),
    audio: (d) => run((async () => { const ins = sceneAudio(d.v), on = ins.some((n) => !st.audio.get(n).muted); for (const n of ins) await req("SetInputMute", { inputName: n, inputMuted: on }); })()),
    closeask: (d) => openPop("close", d.v),
    closego: () => { const name = st.popArg; closePop(); run(req("RemoveScene", { sceneName: name })); },
    isotoggle: (d) => { const sel = new Set(st.isoSel); sel.has(d.v) ? sel.delete(d.v) : sel.add(d.v); st.isoSel = [...sel]; store.set("mesa.iso", st.isoSel); renderPop(); },
    multicorder: () => { if ([...st.iso.values()].some(Boolean)) return A.isostop(); if (!st.isoSel.some((n) => st.scenes.includes(n))) return openPop("iso"); A.isostart(); },
    isostart: () => run((async () => {
      const dir = (await req("GetRecordDirectory")).recordDirectory.replace(/[\\\\/]+$/, "") + "\\\\iso";
      for (const name of st.isoSel.filter((n) => st.scenes.includes(n))) {
        const settings = { path: dir, filename_formatting: \`\${name.replace(/[\\\\/:*?"<>|]/g, "_")} %CCYY-%MM-%DD %hh-%mm-%ss\`, record_mode: 1 };
        if (!(await tryReq("GetSourceFilter", { sourceName: name, filterName: ISO }))) await req("CreateSourceFilter", { sourceName: name, filterName: ISO, filterKind: "source_record_filter", filterSettings: settings });
        else { await req("SetSourceFilterEnabled", { sourceName: name, filterName: ISO, filterEnabled: true }); await req("SetSourceFilterSettings", { sourceName: name, filterName: ISO, filterSettings: settings }); }
      }
      await sleep(500); await syncItems(); toast("Gravação isolada em " + dir);
    })()),
    isostop: () => run((async () => { for (const [name, on] of st.iso) if (on) await req("SetSourceFilterSettings", { sourceName: name, filterName: ISO, filterSettings: { record_mode: 0 } }); await sleep(500); await syncItems(); })()),
    plcreate: () => run((async () => {
      const kind = st.kinds.find((k) => /playlist/.test(k)) || st.kinds.find((k) => k === "vlc_source"); if (!kind) throw new Error("Nenhuma fonte de playlist instalada neste OBS");
      const w = st.video?.baseWidth || 1920, h = st.video?.baseHeight || 1080;
      if (!st.scenes.includes("PLAYLIST")) await req("CreateScene", { sceneName: "PLAYLIST" });
      const { sceneItemId } = await req("CreateInput", { sceneName: "PLAYLIST", inputName: "Playlist", inputKind: kind, inputSettings: {} });
      await tryReq("SetSceneItemTransform", { sceneName: "PLAYLIST", sceneItemId, sceneItemTransform: { positionX: 0, positionY: 0, boundsType: "OBS_BOUNDS_SCALE_INNER", boundsWidth: w, boundsHeight: h, boundsAlignment: 0 } });
      closePop(); await tryReq("OpenInputPropertiesDialog", { inputName: "Playlist" });
    })()),
    pledit: () => run(req("OpenInputPropertiesDialog", { inputName: st.pl.name })),
    plact: (d) => run((async () => { await req("TriggerMediaInputAction", { inputName: st.pl.name, mediaAction: "OBS_WEBSOCKET_MEDIA_INPUT_ACTION_" + d.v }); await sleep(300); await syncPl(); })()),
    plpvw: () => A.preview({ v: st.pl.scene }),
    record: () => run(req("ToggleRecord")),`);

/* ---- tiles ---- */
rep(`const cls = name === st.program ? "out" : st.studio && name === st.preview ? "pv" : "", tag = st.tags[name];`,
  `const cls = name === st.program ? "out" : st.studio && name === st.preview ? "pv" : "", tag = st.tags[name], v = esc(name);
      const media = (st.items.get(name) || []).filter((i) => isMedia(i.kind)), aud = sceneAudio(name);
      const closeB = name === st.program ? \`<button class="na" title="Está no ar: tire do programa antes de fechar">Close</button>\` : \`<button data-a="closeask" data-v="\${v}" title="Remove esta entrada">Close</button>\`;
      const loopB = media.length ? \`<button class="\${media.every((i) => st.loop.get(i.name)) ? "on" : ""}" data-a="loop" data-v="\${v}" title="Repetir a mídia desta entrada">Loop</button>\` : \`<button class="na" title="Só para entradas com arquivo de vídeo ou áudio">Loop</button>\`;
      const audioB = aud.length ? \`<button class="w2\${aud.some((n) => !st.audio.get(n).muted) ? " on" : ""}" data-a="audio" data-v="\${v}" title="Liga/desliga o áudio desta entrada">Audio</button>\` : \`<button class="w2 na" title="Entrada sem fonte de áudio">Audio</button>\`;`);
rep(`<span class="nm" title="\${esc(name)}">\${esc(name)}</span><i class="tag`, `<span class="nm" title="\${esc(name)}">\${esc(name)}</span>\${st.iso.get(name) ? \`<b class="iso" title="Gravação isolada em andamento">ISO</b>\` : ""}<i class="tag`);
rep(`<div class="r"><button class="na" title="\${NA}">Close</button><button data-a="quick"`, `<div class="r">\${closeB}<button data-a="quick"`);
rep(`title="Corte seco para o programa">Cut</button><button class="na" title="\${NA}">Loop</button></div>`, `title="Corte seco para o programa">Cut</button>\${loopB}</div>`);
rep(`<div class="r">\${ov(name)}<button class="w2 na" title="\${NA}">Audio</button></div></div>\`;`, `<div class="r">\${ov(name)}\${audioB}</div></div>\`;`);

/* ---- bottom bar ---- */
rep(`<button class="b na" title="\${NA} (gravação isolada pede o plugin Source Record)">MultiCorder</button><button class="b na" title="\${NA}">PlayList</button>`,
  `\${st.hasIso ? \`<button class="b\${[...st.iso.values()].some(Boolean) ? " live" : ""}" data-a="multicorder"\${off} title="Grava cada entrada marcada no seu próprio arquivo">MultiCorder</button><button class="b arrow" data-a="pop" data-v="iso"\${off} title="Escolher entradas">▾</button>\` : \`<button class="b na" title="Plugin Source Record não carregado">MultiCorder</button>\`}
        <button class="b" data-a="pop" data-v="playlist"\${off}>PlayList</button>`);

/* ---- popovers ---- */
rep(`    else if (st.pop === "gear") p.innerHTML =`,
  `    else if (st.pop === "close") p.innerHTML = \`<h3>Fechar "\${esc(st.popArg)}"?</h3><p>Remove a entrada e as fontes que só existem nela. Não dá para desfazer pelo painel.</p><div class="row"><button class="b live" data-a="closego">Fechar entrada</button><button class="b" data-a="close">Cancelar</button></div>\`;
    else if (st.pop === "iso") { const any = [...st.iso.values()].some(Boolean); p.innerHTML = \`<h3>MultiCorder: gravação isolada</h3><p>Cada entrada marcada é gravada no seu próprio arquivo, mesmo fora do ar. Cada uma usa um codificador a mais.</p>\` + st.scenes.map((n) => \`<label class="chk"><input type="checkbox" data-a="isotoggle" data-v="\${esc(n)}"\${st.isoSel.includes(n) ? " checked" : ""}\${any ? " disabled" : ""}> \${esc(n)}\${st.iso.get(n) ? \` <b class="iso">gravando</b>\` : ""}</label>\`).join("") + \`<p style="margin-top:6px">Arquivos na pasta de gravação do perfil, subpasta <b>iso</b>.</p><div class="row">\${any ? \`<button class="b live" data-a="isostop">Parar</button>\` : \`<button class="b on" data-a="isostart">Iniciar</button>\`}<button class="b" data-a="close">Fechar</button></div>\`; }
    else if (st.pop === "playlist") { const pl = st.pl; p.innerHTML = \`<h3>PlayList</h3>\` + (pl ? \`<p>Fonte <b>\${esc(pl.name)}</b> na entrada <b>\${esc(pl.scene)}</b>\${pl.state ? " · " + pl.state : ""}\${pl.time ? " · " + pl.time : ""}</p><div class="row"><button class="b" data-a="plact" data-v="PREVIOUS">Anterior</button><button class="b" data-a="plact" data-v="PLAY">Play</button><button class="b" data-a="plact" data-v="PAUSE">Pause</button><button class="b" data-a="plact" data-v="NEXT">Próximo</button><button class="b" data-a="plact" data-v="RESTART">Reiniciar</button></div><div class="row"><button class="b" data-a="pledit">Editar lista…</button><button class="b" data-a="plpvw">Mandar para o Preview</button><button class="b" data-a="close">Fechar</button></div>\` : \`<p>Nenhuma playlist ainda. Cria a entrada PLAYLIST e abre a janela do OBS para escolher os arquivos.</p><div class="row"><button class="b on" data-a="plcreate">Criar playlist</button><button class="b" data-a="close">Cancelar</button></div>\`); }
    else if (st.pop === "gear") p.innerHTML =`);

if (!missing) writeFileSync(file, s);
console.log(`${done} trechos alterados, ${missing} não encontrados${missing ? " (arquivo NÃO gravado)" : ""}`);
