// One-off edit of painel/mesa.html, following the reference screens of the user's switcher:
// windows opened from the top bar, Presets window, a gear beside each bottom button opening that feature's settings
// (recording, external, streaming, multi-recording, playlist), eight overlay channels per input, close X on the title,
// and tally colours (red = on air, green = preview). Every field reads and writes the engine's real settings.
import { readFileSync, writeFileSync } from "node:fs";
const file = "D:/DRIVE/IA/antigravity/vmixtwste/obs-vmix/painel/mesa.html";
let s = readFileSync(file, "utf8"), done = 0, missing = 0;
const rep = (a, b) => { const hit = typeof a === "string" ? s.includes(a) : a.test(s); if (!hit) { missing++; console.log("trecho não encontrado:", String(a).slice(0, 70)); return; } s = s.replace(a, () => b); done++; };

/* ---- style: appended last so it wins over earlier rules ---- */
rep(`</style>`, `  .tt.pv { background: linear-gradient(180deg, #12a31a, #0a7a10); color: #fff; } .tt.pv .n { background: #07590b; color: #fff; }
  .tt.out { background: linear-gradient(180deg, #e0281c, #b3160d); color: #fff; } .tt.out .n { background: #8a0f08; color: #fff; }
  .tile.is-pv { border-color: #12a31a; } .tile.is-out { border-color: #e0281c; }
  .tt .x { width: 20px; height: 100%; flex: none; font-weight: 700; color: inherit; opacity: .8; } .tt .x:hover { opacity: 1; background: rgba(0, 0, 0, .3); }
  .bot .cg { width: 26px; padding: 0; margin-left: 10px; border-right: 0; } .bot .cg svg { width: 13px; height: 13px; }
  .pop fieldset { border: 1px solid var(--bd); margin: 0 0 8px; padding: 8px; } .pop legend { background: #0b6bbf; color: #fff; padding: 2px 10px; font-weight: 600; }
  .pop fieldset input, .pop fieldset select { width: 100%; }
</style>`);

/* ---- events ---- */
rep(/const SUBS = 1 \| 4 \|/, `const SUBS = 1 | 2 | 4 |`);
rep(`  function onEvent(type, d) {
`, `  function onEvent(type, d) {
    if (type === "CustomEvent") { const f = d.freemix; if (f && f.open) { st.pop = null; openPop(f.open, f.arg || undefined); } return; } // pedido vindo da barra de cima
    if (type === "CurrentSceneCollectionChanged") { st.preset = d.sceneCollectionName; setTimeout(() => syncAll().catch(() => {}), 900); }
`);

/* ---- eight overlay channels ---- */
s = s.split(".slice(0, 4)").join(".slice(0, 8)");
rep(`await syncKeyers(); await syncItems();`, `await syncKeyers();
    if (st.keyers && st.keyers.length < 8) { for (let n = st.keyers.length + 1; n <= 8; n++) await vendor("add_downstream_keyer", { dsk_name: String(n) }).catch(() => {}); await sleep(800); await syncKeyers(); }
    await syncItems();`);
rep(`const ov = (name) => [0, 1, 2, 3].map((k) =>`, `const ov = (name, from) => [0, 1, 2, 3].map((i) => from + i).map((k) =>`);

/* ---- actions ---- */
rep(`    record: () => run(req("ToggleRecord")),`, `    presetload: () => run((async () => { const r = await req("GetSceneCollectionList"); st.presets = r.sceneCollections; st.preset = r.currentSceneCollectionName; if (st.pop === "presets") { renderPop(); if (st.popArg === "new") $("ps-name")?.focus(); } })()),
    presetopen: (d) => { if (d.v === st.preset) return closePop(); if (st.rec || st.stream) return toast("Pare a gravação e a transmissão antes de trocar de preset", true); closePop(); run(req("SetCurrentSceneCollection", { sceneCollectionName: d.v })); },
    presetnew: () => run((async () => { const name = $("ps-name").value.trim(); if (!name) return toast("Dê um nome ao preset", true); if (st.rec || st.stream) return toast("Pare a gravação e a transmissão antes de criar um preset", true); closePop(); await req("CreateSceneCollection", { sceneCollectionName: name }); toast(\`Preset "\${name}" criado\`); })()),
    cfgload: () => run((async () => {
      const mode = (await tryReq("GetProfileParameter", { parameterCategory: "Output", parameterName: "Mode" }))?.parameterValue === "Advanced" ? "AdvOut" : "SimpleOutput";
      const [sv, dir, fmt, v] = await Promise.all([req("GetStreamServiceSettings"), req("GetRecordDirectory"), tryReq("GetProfileParameter", { parameterCategory: mode, parameterName: "RecFormat2" }), req("GetVideoSettings")]);
      st.cfg = { mode, server: sv.streamServiceSettings.server || "", key: sv.streamServiceSettings.key || "", dir: dir.recordDirectory, fmt: fmt?.parameterValue || "mkv", res: \`\${v.baseWidth}x\${v.baseHeight}\`, fps: \`\${v.fpsNumerator}/\${v.fpsDenominator}\` };
      if (["recset", "streamset", "config"].includes(st.pop)) renderPop();
    })()),
    cfgstream: () => run((async () => { const server = $("cf-server").value.trim(); if (!server) return toast("Informe a URL do servidor", true); await req("SetStreamServiceSettings", { streamServiceType: "rtmp_custom", streamServiceSettings: { server, key: $("cf-key").value } }); closePop(); toast("Transmissão configurada"); })()),
    cfgrec: () => run((async () => { await req("SetRecordDirectory", { recordDirectory: $("cf-dir").value.trim() }); await req("SetProfileParameter", { parameterCategory: st.cfg.mode, parameterName: "RecFormat2", parameterValue: $("cf-fmt").value }); closePop(); toast("Gravação configurada"); })()),
    cfgvideo: () => run((async () => { const [w, h] = $("cf-res").value.split("x").map(Number), [n, den] = $("cf-fps").value.split("/").map(Number); await req("SetVideoSettings", { baseWidth: w, baseHeight: h, outputWidth: w, outputHeight: h, fpsNumerator: n, fpsDenominator: den }); st.video = await req("GetVideoSettings"); renderStat(); closePop(); toast("Vídeo configurado"); })()),
    projopen: (d) => run((async () => {
      let monitorIndex = -1;
      if (d.v === "PROGRAM_FULL") { const second = (await req("GetMonitorList")).monitors.find((m) => m.monitorPositionX !== 0 || m.monitorPositionY !== 0); if (!second) return toast("Não há segundo monitor: use a opção em janela", true); monitorIndex = second.monitorIndex; }
      await req("OpenVideoMixProjector", { videoMixType: "OBS_WEBSOCKET_VIDEO_MIX_TYPE_" + d.v.replace("_FULL", ""), monitorIndex }); closePop();
    })()),
    record: () => run(req("ToggleRecord")),`);

/* ---- tile: X on the title, overlays 1-4 and 5-8 in two rows, GO / Cut / Audio / window / gear ---- */
rep(`title="Cor da entrada"></i></div>`, `title="Cor da entrada"></i>\${isOut ? "" : \`<button class="x" data-a="closeask" data-v="\${v}" title="Fechar esta entrada">×</button>\`}</div>`);
rep(/        <div class="r">\$\{closeB\}[\s\S]*?\$\{GEAR\}<\/button><\/div><\/div>`;/, `        <div class="r">\${ov(name, 0)}<button class="w2" data-a="quick" data-v="\${v}" title="GO: leva ao ar com a transição atual">GO</button><button class="w2" data-a="cut" data-v="\${v}" title="Corte seco para o programa">Cut</button>\${media.length ? loopB : ""}</div>
        <div class="r">\${ov(name, 4)}\${audioB}\${media.length ? \`<button class="ic" data-a="playpause" data-v="\${v}" title="Play / Pause da mídia"><i class="tri"></i></button>\` : ""}<button class="ic" data-a="projector" data-v="\${v}" title="Abrir em janela">\${MON}</button><button class="ic" data-a="menu" data-v="\${v}" title="Configurações da entrada (ou clique direito)">\${GEAR}</button></div></div>\`;`);

/* ---- bottom bar: a gear beside each button opens that feature's settings ---- */
rep(/    \$\("bot"\)\.innerHTML = `[\s\S]*?\$\{GEAR\}<\/button><\/div>`;/, `    const cg = (pop, tip) => \`<button class="b cg" data-a="pop" data-v="\${pop}"\${off} title="\${tip}">\${GEAR}</button>\`;
    $("bot").innerHTML = \`<div class="g"><button class="b add-input" data-a="pop" data-v="add"\${off}>Adicionar Entrada</button></div>
      <div class="g">\${cg("recset", "Configurar a gravação")}<button class="b\${st.rec ? " live" : ""}" data-a="record"\${off}>Gravar</button>\${st.rec ? \`<span class="tc">\${st.recTc}</span>\` : ""}
        \${cg("ext", "Saídas externas: tela cheia, multiview, câmera virtual")}<button class="b\${st.vcam ? " on" : ""}" data-a="external"\${off} title="Liga/desliga a câmera virtual">Externo</button>
        \${cg("streamset", "Configurar a transmissão")}<button class="b\${st.stream ? " live" : ""}" data-a="stream"\${off}>Transmitir</button>\${st.stream ? \`<span class="tc">\${st.streamTc}</span>\` : ""}
        \${st.hasIso ? \`\${cg("iso", "Escolher as entradas da gravação isolada")}<button class="b\${[...st.iso.values()].some(Boolean) ? " live" : ""}" data-a="multicorder"\${off} title="Grava cada entrada marcada no seu próprio arquivo">MultiGravação</button>\` : ""}
        \${cg("playlist", "Lista de reprodução")}<button class="b" data-a="pop" data-v="playlist"\${off}>Playlist</button>
        \${st.kinds.includes("replay_source") ? \`<button class="b\${st.rp.some((r) => r.scene === st.program) ? " live" : ""}" data-a="pop" data-v="replay"\${off} style="margin-left:10px">Replay</button>\` : ""}</div>
      <div class="g"><button class="b" data-a="pop" data-v="overlay"\${off}>Overlay</button><button class="b gear" data-a="pop" data-v="gear" title="Painel">\${GEAR}</button></div>\`;`);

/* ---- windows ---- */
rep(`    else if (st.pop === "gear") p.innerHTML =`, `    else if (st.pop === "presets") p.innerHTML = \`<h3>Presets</h3><p>Cada preset é uma produção inteira: entradas, overlays, transições. O motor grava as alterações sozinho.</p><div class="menu" style="max-height:140px;overflow:auto">\${(st.presets || []).map((n) => \`<button data-a="presetopen" data-v="\${esc(n)}">\${n === st.preset ? "● " : ""}\${esc(n)}\${n === st.preset ? " (em uso)" : ""}</button>\`).join("")}</div><label style="margin-top:8px">Novo preset<input id="ps-name" maxlength="40" placeholder="Nome da produção"></label><div class="row"><button class="b on" data-a="presetnew">Criar</button><button class="b" data-a="close">Fechar</button></div>\`;
    else if (["recset", "streamset", "config"].includes(st.pop)) { const c = st.cfg, opt = (list, cur) => list.map(([v, l]) => \`<option value="\${v}"\${v === cur ? " selected" : ""}>\${l}</option>\`).join("");
      const RES = [["1920x1080", "1920×1080"], ["1280x720", "1280×720"], ["3840x2160", "3840×2160"], ["1080x1920", "1080×1920 (vertical)"]], FPS = [["24000/1001", "23,976"], ["25/1", "25"], ["30000/1001", "29,97"], ["30/1", "30"], ["50/1", "50"], ["60000/1001", "59,94"], ["60/1", "60"]], FMT = ["mkv", "mp4", "hybrid_mp4", "mov", "flv", "ts"].map((f) => [f, f]);
      const withCur = (list, cur) => (list.some(([v]) => v === cur) ? list : [[cur, cur], ...list]);
      if (!c) p.innerHTML = \`<h3>Configurações</h3><p>Lendo as configurações do motor…</p>\`;
      else if (st.pop === "streamset") p.innerHTML = \`<h3>Configurações de transmissão</h3><fieldset><legend>Destino</legend><label>URL do servidor (rtmp://, rtmps://, srt://)<input id="cf-server" value="\${esc(c.server)}" placeholder="rtmp://…"></label><label>Chave de stream<input id="cf-key" type="password" value="\${esc(c.key)}" autocomplete="off"></label></fieldset><p>O botão Transmitir usa este destino. Qualidade e codificador seguem o perfil do motor.</p><div class="row"><button class="b on" data-a="cfgstream">Salvar e fechar</button><button class="b" data-a="close">Cancelar</button></div>\`;
      else if (st.pop === "recset") p.innerHTML = \`<h3>Configurações de gravação</h3><fieldset><legend>Arquivo</legend><label>Pasta<input id="cf-dir" value="\${esc(c.dir)}"></label><label>Formato<select id="cf-fmt">\${opt(withCur(FMT, c.fmt), c.fmt)}</select></label></fieldset><p>Tamanho e taxa de quadros são os do vídeo da produção (Configurar, na barra de cima). A MultiGravação grava na subpasta iso.</p><div class="row"><button class="b on" data-a="cfgrec">OK</button><button class="b" data-a="close">Cancelar</button></div>\`;
      else p.innerHTML = \`<h3>Configurar: vídeo da produção</h3><fieldset><legend>Display</legend><label>Tamanho<select id="cf-res">\${opt(withCur(RES, c.res), c.res)}</select></label><label>Taxa de quadros<select id="cf-fps">\${opt(withCur(FPS, c.fps), c.fps)}</select></label></fieldset><p>Só muda com gravação e transmissão paradas.</p><div class="row"><button class="b on" data-a="cfgvideo">OK</button><button class="b" data-a="close">Cancelar</button></div>\`; }
    else if (st.pop === "ext") p.innerHTML = \`<h3>Saídas externas</h3><div class="menu"><button data-a="projopen" data-v="PROGRAM_FULL">Output em tela cheia no segundo monitor</button><button data-a="projopen" data-v="PROGRAM">Output em janela</button><button data-a="projopen" data-v="PREVIEW">Preview em janela</button><button data-a="projopen" data-v="MULTIVIEW">Multiview em janela</button></div><p style="margin-top:8px">O botão Externo liga a câmera virtual do motor.</p><div class="row"><button class="b" data-a="close">Fechar</button></div>\`;
    else if (st.pop === "gear") p.innerHTML =`);
rep(`renderPop(); ($("add-name") || $("rn-name"))?.select(); };`, `renderPop(); ($("add-name") || $("rn-name"))?.select(); if (["recset", "streamset", "config"].includes(id)) { st.cfg = null; renderPop(); A.cfgload(); } if (id === "presets") A.presetload(); };`);

if (!missing) writeFileSync(file, s);
console.log(`${done} trechos alterados, ${missing} não encontrados${missing ? " (arquivo NÃO gravado)" : ""}`);
