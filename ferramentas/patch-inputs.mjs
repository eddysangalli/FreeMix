// One-off edit of painel/mesa.html: "Input Select" window (type list on the left, options on the right) and a per-input menu.
import { readFileSync, writeFileSync } from "node:fs";

const file = "D:/DRIVE/IA/antigravity/vmixtwste/obs-vmix/painel/mesa.html";
let s = readFileSync(file, "utf8");
let done = 0, missing = 0;
const rep = (a, b) => {
  const hit = typeof a === "string" ? s.includes(a) : a.test(s);
  if (!hit) { missing++; console.log("trecho não encontrado:", String(a).slice(0, 70).replace(/\n/g, " ")); return; }
  s = s.replace(a, () => b); done++;
};

/* ---- CSS ---- */
rep(`  .toast { position: fixed;`,
  `  .pop.wide { width: min(680px, calc(100vw - 12px)); left: 50%; transform: translateX(-50%); bottom: 30px; }
  .add { display: grid; grid-template-columns: 170px 1fr; gap: 10px; height: min(250px, calc(100vh - 150px)); }
  .add .types { overflow-y: auto; background: #12161b; border: 1px solid var(--bd); }
  .add .types button { display: block; width: 100%; text-align: left; padding: 4px 8px; border-bottom: 1px solid #1d2229; }
  .add .types button:hover { background: var(--btn); } .add .types button.on { background: #2d5f9e; color: #fff; }
  .add .types button.off { color: var(--dim); }
  .add .form { overflow-y: auto; padding-right: 4px; } .add .form input[type="color"] { width: 70px; padding: 0 2px; }
  .add .form label.inl { display: flex; align-items: center; gap: 8px; } .add .form label.inl input { width: 60px; }
  .pop .end { justify-content: flex-end; margin-top: 8px; }
  .menu button { display: block; width: 100%; text-align: left; padding: 5px 8px; border-top: 1px solid var(--sep); } .menu button:hover { background: var(--btn-h); }
  .tt .tg { width: 18px; height: 100%; display: grid; place-items: center; opacity: .75; flex: none; } .tt .tg:hover { opacity: 1; } .tt .tg svg { width: 11px; height: 11px; }
  .toast { position: fixed;`);

/* ---- input types ---- */
rep(/  const KINDS = \[\[[^\n]*\n/,
  `  // Same order and names as a switcher's "Input Select" list; "kind" is the OBS source behind each one.
  const TYPES = [
    { id: "video", label: "Video", kind: "ffmpeg_source", hint: "Arquivo de vídeo. Ao criar, abre a janela do OBS para escolher o arquivo." },
    { id: "list", label: "List", kind: "playlist", hint: "Lista de vídeos em sequência (plugin Media Playlist). Depois é comandada pelo botão PlayList." },
    { id: "camera", label: "Camera", kind: "dshow_input", hint: "Câmera, placa de captura ou webcam. Ao criar, abre a janela do OBS para escolher dispositivo, resolução e taxa de quadros." },
    { id: "ndi", label: "NDI", kind: "ndi_source", hint: "Fonte NDI da rede (precisa do plugin DistroAV e do NDI Runtime)." },
    { id: "desktop", label: "Desktop Capture", kind: "monitor_capture", hint: "Captura de um monitor." },
    { id: "window", label: "Window Capture", kind: "window_capture", hint: "Captura de uma janela." },
    { id: "stream", label: "Stream / SRT", kind: "ffmpeg_source", fields: [["url", "Endereço (rtmp://, srt://, rtsp://, http://)", "", "text"]], settings: (f) => ({ is_local_file: false, input: f.url }), hint: "Recebe um fluxo de rede." },
    { id: "replay", label: "Instant Replay", kind: "replay_source", special: "replay", hint: "Abre a janela Replay para criar um ângulo a partir de uma câmera." },
    { id: "image", label: "Image", kind: "image_source", hint: "Imagem parada (PNG, JPG…)." },
    { id: "photos", label: "Photos", kind: "slideshow", hint: "Sequência de imagens." },
    { id: "colour", label: "Colour", kind: "color_source", fields: [["color", "Cor", "#000000", "color"]], settings: (f, w, h) => ({ color: abgr(f.color), width: w, height: h }), hint: "Fundo de cor sólida." },
    { id: "audio", label: "Audio", kind: "ffmpeg_source", hint: "Arquivo de áudio (trilha, vinheta)." },
    { id: "audioin", label: "Audio Input", kind: "wasapi_input_capture", hint: "Microfone ou entrada da placa de som." },
    { id: "title", label: "Title", kind: "text_gdiplus", fields: [["text", "Texto", "TÍTULO", "text"]], settings: (f) => ({ text: f.text }), hint: "Texto simples. Para GC completo use Web Browser." },
    { id: "web", label: "Web Browser", kind: "browser_source", fields: [["url", "URL", "https://", "text"]], settings: (f, w, h) => ({ url: f.url, width: w, height: h }), hint: "Página web ou HTML local: placar, GC, convidado por VDO.Ninja." },
    { id: "blank", label: "Blank", kind: "", hint: "Entrada vazia, para montar com várias fontes em Painéis › Fontes." },
  ];
  const abgr = (hex) => { const n = parseInt(hex.slice(1), 16); return (0xff000000 | ((n & 0xff) << 16) | (n & 0xff00) | (n >> 16)) >>> 0; };
  const resolveKind = (base) => (base === "playlist" ? st.kinds.find((k) => /playlist/.test(k)) || st.kinds.find((k) => k === "vlc_source") : st.kinds.filter((k) => k === base || k.startsWith(base + "_v")).sort().pop()) || "";
`);
rep(`rp: [], rpBack: "", rpSpeed: 100, tags:`, `rp: [], rpBack: "", rpSpeed: 100, addType: "camera", addName: "", tags:`);

/* ---- actions ---- */
rep(/    add: \(\) => run\(\(async \(\) => \{[\s\S]*?\n    \}\)\(\)\),\n  \};/,
  `    addtype: (d) => { st.addName = $("add-name")?.dataset.edited ? $("add-name").value : ""; st.addType = d.v; renderPop(); },
    add: () => run((async () => {
      const t = TYPES.find((x) => x.id === st.addType) || TYPES[0];
      if (t.special === "replay") return openPop("replay");
      const base = $("add-name").value.trim(), n = clamp(Math.round(+$("add-n").value) || 1, 1, 8); if (!base) return toast("Dê um nome para a entrada", true);
      const f = {}; for (const [key] of t.fields || []) f[key] = $("add-f-" + key).value;
      const kind = t.kind ? resolveKind(t.kind) : ""; if (t.kind && !kind) return toast("Este tipo de fonte não está instalado neste OBS", true);
      const w = st.video?.baseWidth || 1920, h = st.video?.baseHeight || 1080; let last = "";
      for (let k = 0; k < n; k++) {
        const name = n > 1 ? \`\${base} \${k + 1}\` : base;
        await req("CreateScene", { sceneName: name });
        if (!kind) continue;
        last = \`\${name} (fonte)\`;
        const { sceneItemId } = await req("CreateInput", { sceneName: name, inputName: last, inputKind: kind, inputSettings: t.settings ? t.settings(f, w, h) : {} });
        await tryReq("SetSceneItemTransform", { sceneName: name, sceneItemId, sceneItemTransform: { positionX: 0, positionY: 0, boundsType: "OBS_BOUNDS_SCALE_INNER", boundsWidth: w, boundsHeight: h, boundsAlignment: 0 } });
      }
      closePop(); st.addName = "";
      if (!kind) return toast("Entrada vazia criada. Monte em Painéis › Fontes.");
      if (t.fields) return;
      if (n === 1) await tryReq("OpenInputPropertiesDialog", { inputName: last });
      else toast(\`\${n} entradas criadas. Use a engrenagem de cada uma para escolher o dispositivo.\`);
    })()),
    menu: (d) => openPop("menu", d.v),
    props: (d) => { closePop(); run(req("OpenInputPropertiesDialog", { inputName: d.v })); },
    filters: (d) => { closePop(); run(req("OpenInputFiltersDialog", { inputName: d.v })); },
    projector: (d) => { closePop(); run(req("OpenSourceProjector", { sourceName: d.v, monitorIndex: -1 })); },
    renameask: (d) => openPop("rename", d.v),
    renamego: () => run((async () => {
      const from = st.popArg, to = $("rn-name").value.trim(); if (!to || to === from) return closePop();
      await req("SetSceneName", { sceneName: from, newSceneName: to });
      if (st.tags[from] !== undefined) { st.tags[to] = st.tags[from]; delete st.tags[from]; store.set("mesa.tags", st.tags); }
      closePop();
    })()),
  };`);

/* ---- tile: gear + right click ---- */
rep(`<div class="tile"><div class="tt \${cls}">`, `<div class="tile" data-s="\${v}"><div class="tt \${cls}">`);
rep(`title="Cor da entrada"></i></div>`, `title="Cor da entrada"></i><button class="tg" data-a="menu" data-v="\${v}" title="Menu da entrada (ou clique direito)">\${GEAR}</button></div>`);
rep(`document.addEventListener("contextmenu", (e) => e.preventDefault());`,
  `document.addEventListener("contextmenu", (e) => { e.preventDefault(); const t = e.target.closest(".tile"); if (t) openPop("menu", t.dataset.s); });
  document.addEventListener("input", (e) => { if (e.target.id === "add-name") e.target.dataset.edited = "1"; });`);
rep(`if (e.key === "Enter" && st.pop === "add") A.add();`, `if (e.key === "Enter" && st.pop === "add") A.add(); if (e.key === "Enter" && st.pop === "rename") A.renamego();`);

/* ---- windows ---- */
rep(`p.className = \`pop on\${st.pop === "gear" ? " right" : ""}\`;`, `p.className = \`pop on\${st.pop === "gear" ? " right" : ""}\${st.pop === "add" ? " wide" : ""}\`;`);
rep(/    if \(st\.pop === "add"\) p\.innerHTML = `[^\n]*\n/,
  `    if (st.pop === "add") {
      const t = TYPES.find((x) => x.id === st.addType) || TYPES[0], name = st.addName || \`\${t.id === "camera" ? "CAM" : t.label.toUpperCase().replace(/ \\/.*/, "")} \${st.scenes.length + 1}\`;
      p.innerHTML = \`<h3>Input Select</h3><div class="add"><div class="types">\${TYPES.map((x) => \`<button class="\${x.id === t.id ? "on" : ""}\${x.kind && !resolveKind(x.kind) ? " off" : ""}" data-a="addtype" data-v="\${x.id}">\${x.label}</button>\`).join("")}</div>
        <div class="form">\${t.special ? "" : \`<label>Nome<input id="add-name" maxlength="40" value="\${esc(name)}"\${st.addName ? \` data-edited="1"\` : ""}></label>\`}\${(t.fields || []).map(([key, label, def, type]) => \`<label>\${label}<input id="add-f-\${key}" type="\${type}" value="\${esc(def)}"></label>\`).join("")}
        <p>\${t.hint}\${t.kind && !resolveKind(t.kind) ? " <b>Não instalado neste OBS.</b>" : ""}</p>\${t.special ? "" : \`<label class="inl">Number <input id="add-n" type="number" min="1" max="8" value="1"></label>\`}</div></div>
        <div class="row end"><button class="b on" data-a="add">OK</button><button class="b" data-a="close">Cancel</button></div>\`;
    }
`);
rep(`    else if (st.pop === "gear") p.innerHTML =`,
  `    else if (st.pop === "menu") { const name = st.popArg, v = esc(name), ins = st.items.get(name) || [];
      p.innerHTML = \`<h3>\${v}</h3><div class="menu">\` + ins.map((i) => \`<button data-a="props" data-v="\${esc(i.name)}">Configurações de \${esc(i.name)}…</button><button data-a="filters" data-v="\${esc(i.name)}">Filtros de \${esc(i.name)}…</button>\`).join("")
        + \`<button data-a="renameask" data-v="\${v}">Renomear…</button><button data-a="tag" data-v="\${v}">Cor…</button><button data-a="projector" data-v="\${v}">Abrir em janela</button>\${name === st.program ? "" : \`<button data-a="closeask" data-v="\${v}">Fechar entrada</button>\`}</div>\`; }
    else if (st.pop === "rename") p.innerHTML = \`<h3>Renomear "\${esc(st.popArg)}"</h3><label>Novo nome<input id="rn-name" maxlength="40" value="\${esc(st.popArg)}"></label><div class="row"><button class="b on" data-a="renamego">OK</button><button class="b" data-a="close">Cancel</button></div>\`;
    else if (st.pop === "gear") p.innerHTML =`);
rep(`st.pop = id; st.popArg = arg; renderPop(); $("add-name")?.select();`, `st.pop = id; st.popArg = arg; renderPop(); ($("add-name") || $("rn-name"))?.select();`);
rep(`<button class="b" data-a="pop" data-v="add"\${off}>Adicionar entrada</button>`, `<button class="b" data-a="pop" data-v="add"\${off}>Add Input</button>`);

if (!missing) writeFileSync(file, s);
console.log(`${done} trechos alterados, ${missing} não encontrados${missing ? " (arquivo NÃO gravado)" : ""}`);
