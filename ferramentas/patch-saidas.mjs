// One-off edit of painel/mesa.html: the Externo button opens a "Central de Saídas" table.
// Rows only show state and actions the engine really reports or performs: projectors can be opened but the engine
// cannot report or close them remotely, so they are "sob demanda"; hardware/plugin outputs that are not present are
// marked unavailable with the reason.
import { readFileSync, writeFileSync } from "node:fs";
const file = "D:/DRIVE/IA/antigravity/vmixtwste/obs-vmix/painel/mesa.html";
let s = readFileSync(file, "utf8"), done = 0, missing = 0;
const rep = (a, b) => { const hit = typeof a === "string" ? s.includes(a) : a.test(s); if (!hit) { missing++; console.log("trecho não encontrado:", String(a).slice(0, 70)); return; } s = s.replace(a, () => b); done++; };

rep(`</style>`, `  .outs { max-height: calc(100vh - 118px); overflow: auto; background: var(--bg); padding: 6px 10px; }
  .outs table { width: 100%; border-collapse: collapse; } .outs th { text-align: left; color: var(--mut); font-size: 10px; text-transform: uppercase; padding: 4px 8px 6px 0; }
  .outs td { padding: 4px 8px 4px 0; border-top: 1px solid var(--sep); vertical-align: middle; white-space: nowrap; } .outs td small { display: block; color: var(--mut); font-size: 9px; }
  .outs select { height: 22px; background: #12161b; border: 1px solid var(--bd); color: var(--tx); max-width: 200px; }
  .outs .b { height: 22px; } .outs .cg { margin-left: 4px; width: 24px; padding: 0; }
  .bdg { display: inline-block; padding: 1px 7px; font-size: 10px; font-weight: 700; border: 1px solid var(--bd); color: var(--mut); } .bdg.on { background: var(--red); border-color: #ef5a4f; color: #fff; } .bdg.na { border-style: dashed; }
</style>`);

rep(`<button class="b\${st.vcam ? " on" : ""}" data-a="external"\${off} title="Liga/desliga a câmera virtual">Externo</button>`,
    `<button class="b\${st.vcam ? " on" : ""}" data-a="pop" data-v="ext"\${off} title="Central de saídas">Externo</button>`);
rep(`\${st.pop === "add" ? " wide" : ""}\`;`, `\${st.pop === "add" || st.pop === "ext" ? " wide" : ""}\`;`);
rep(`if (id === "presets") A.presetload(); };`, `if (id === "presets") A.presetload(); if (id === "ext") A.extload(); };`);
rep(`    const cg = (pop, tip) =>`, `    if (st.pop === "ext") setTimeout(renderPop, 0); // keep the outputs table in step with record / stream / virtual camera
    const cg = (pop, tip) =>`);
rep(`  document.addEventListener("contextmenu",`, `  document.addEventListener("change", (e) => { const t = e.target; if (t.dataset && t.dataset.o) { st.outsel = st.outsel || {}; st.outsel[t.dataset.o] = { ...(st.outsel[t.dataset.o] || {}), [t.dataset.f]: t.value }; store.set("mesa.outs", st.outsel); } });
  document.addEventListener("contextmenu",`);

rep(`    record: () => run(req("ToggleRecord")),`, `    extload: () => run((async () => {
      st.outsel = st.outsel || store.get("mesa.outs", {});
      const [m, sv, dir] = await Promise.all([tryReq("GetMonitorList"), tryReq("GetStreamServiceSettings"), tryReq("GetRecordDirectory")]);
      st.mon = m?.monitors || []; st.outDir = dir?.recordDirectory || "";
      const server = sv?.streamServiceSettings?.server || ""; st.outHost = server.replace(/^(\\w+:\\/\\/[^/]+).*/, "$1"); // host only: the path can carry the key
      if (st.pop === "ext") renderPop();
    })()),
    outopen: (d) => run((async () => {
      const o = (st.outsel || {})[d.v] || {}, monitorIndex = Number(o.dst ?? -1), src = d.v === "cf" ? "in:" + st.program : (o.src || (d.v === "s2" ? "PREVIEW" : "PROGRAM"));
      if (src.startsWith("in:")) await req("OpenSourceProjector", { sourceName: src.slice(3), monitorIndex });
      else await req("OpenVideoMixProjector", { videoMixType: "OBS_WEBSOCKET_VIDEO_MIX_TYPE_" + src, monitorIndex });
      toast(monitorIndex < 0 ? "Saída aberta em janela" : "Saída aberta em tela cheia (Esc fecha)");
    })()),
    outstopall: () => run((async () => { if (st.stream) await req("StopStream"); if (st.rec) await req("StopRecord"); if (st.vcam) await req("StopVirtualCam"); toast("Transmissão, gravação e câmera virtual paradas"); })()),
    record: () => run(req("ToggleRecord")),`);

rep(/    else if \(st\.pop === "ext"\) p\.innerHTML = `[^\n]*\n/, `    else if (st.pop === "ext") {
      const sel = st.outsel || {}, v = st.video, res = v ? \`\${v.outputWidth}×\${v.outputHeight} @ \${(v.fpsNumerator / v.fpsDenominator).toFixed(2).replace(/\\.00$/, "")}\` : "";
      const srcs = [["PROGRAM", "Output (programa)"], ["PREVIEW", "Preview"], ["MULTIVIEW", "Multiview"], ...st.scenes.map((n) => ["in:" + n, n])];
      const dsts = [["-1", "Janela flutuante"], ...(st.mon || []).map((m) => [String(m.monitorIndex), \`Monitor \${m.monitorIndex + 1} (\${m.monitorWidth}×\${m.monitorHeight})\`])];
      const pick = (id, f, list, def) => \`<select data-o="\${id}" data-f="\${f}">\${list.map(([val, l]) => \`<option value="\${esc(val)}"\${(sel[id]?.[f] ?? def) === val ? " selected" : ""}>\${esc(l)}</option>\`).join("")}</select>\`;
      const badge = (on, txt) => \`<span class="bdg\${on ? " on" : ""}">\${txt || (on ? "NO AR" : "PARADA")}</span>\`, na = (why) => \`<span class="bdg na" title="\${why}">INDISPONÍVEL</span>\`, demand = \`<span class="bdg" title="O motor abre a saída, mas não informa nem fecha projetores à distância">SOB DEMANDA</span>\`;
      const has = (re) => st.kinds.some((k) => re.test(k));
      const proj = (id, name, def) => \`<tr><td><b>\${name}</b><small>PROJETOR</small></td><td>\${pick(id, "src", srcs, def)}</td><td>\${pick(id, "dst", dsts, "-1")}</td><td>\${res.split(" @")[0]}</td><td>\${demand}</td><td><button class="b on" data-a="outopen" data-v="\${id}">Abrir</button></td></tr>\`;
      const live = (name, kind, dest, on, act, gear, onTxt) => \`<tr><td><b>\${name}</b><small>\${kind}</small></td><td>Output (programa)</td><td>\${esc(dest)}</td><td>\${res}</td><td>\${badge(on, on ? onTxt : "")}</td><td><button class="b\${on ? " live" : " on"}" data-a="\${act}">\${on ? "Parar" : "Iniciar"}</button>\${gear ? \`<button class="b cg" data-a="pop" data-v="\${gear}" title="Configurar">\${GEAR}</button>\` : ""}</td></tr>\`;
      const ext = (name, kind, dest, re, why, where) => \`<tr><td><b>\${name}</b><small>\${kind}</small></td><td></td><td>\${dest}</td><td></td><td>\${has(re) ? \`<span class="bdg">NO MENU</span>\` : na(why)}</td><td>\${has(re) ? where : ""}</td></tr>\`;
      p.innerHTML = \`<h3>Central de Saídas</h3><div class="outs"><table><tr><th>Nome / tipo</th><th>Origem</th><th>Destino</th><th>Vídeo</th><th>Estado</th><th>Ações</th></tr>\`
        + proj("s1", "Saída 1 (Telão / Monitor)", "PROGRAM") + proj("s2", "Saída 2 (Retorno / AUX)", "PREVIEW")
        + \`<tr><td><b>Clean Feed</b><small>PROJETOR</small></td><td title="Abre a entrada que está no ar agora, sem os overlays. Não acompanha os cortes seguintes.">Entrada no ar, sem overlays</td><td>\${pick("cf", "dst", dsts, "-1")}</td><td>\${res.split(" @")[0]}</td><td>\${demand}</td><td><button class="b on" data-a="outopen" data-v="cf">Abrir</button></td></tr>\`
        + live("Câmera Virtual", "VCAM", "Câmera virtual do sistema", st.vcam, "external", "", "")
        + live("Transmissão Principal", "STREAM", st.outHost || "não configurado", st.stream, "stream", "streamset", "")
        + live("Gravação", "ARQUIVO", st.outDir || "", st.rec, "record", "recset", "GRAVANDO")
        + ext("DeckLink / SDI", "DECKLINK", "Placa Blackmagic", /decklink/, "Driver Blackmagic não encontrado nesta máquina", "Ferramentas › Saída Decklink")
        + ext("NDI", "NDI", "Rede", /^ndi/, "Plugin DistroAV e NDI Runtime não instalados", "Ferramentas › NDI")
        + ext("OMT", "OPEN MEDIA TRANSPORT", "Rede", /omt/, "Plugin OMT não instalado", "Ferramentas")
        + \`</table></div><div class="row end"><button class="b" data-a="outstopall">Parar todas</button><button class="b" data-a="close">Fechar</button></div>\`;
    }
`);

if (!missing) writeFileSync(file, s);
console.log(`${done} trechos alterados, ${missing} não encontrados${missing ? " (arquivo NÃO gravado)" : ""}`);
