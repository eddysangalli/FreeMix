// One-off edit of painel/mesa.html: mixer strips laid out like the reference (official help page "Mixer"): a column
// with the cog (audio settings), S (solo to the headphones/monitor without touching the mix) and the speaker
// (mute), the fader, the meters, and the bus buttons M / A / B underneath (the engine's audio tracks 1, 2 and 3).
// The audio settings window uses real audio filters of the engine for gain, EQ, compressor and noise gate.
import { readFileSync, writeFileSync } from "node:fs";
const dir = "D:/DRIVE/IA/antigravity/vmixtwste/obs-vmix";
const snip = readFileSync(dir + "/ferramentas/audio.snippet.js", "utf8").replace(/\r\n/g, "\n");
const part = (name, next) => snip.slice(snip.indexOf("//@@" + name) + name.length + 5, next ? snip.indexOf("//@@" + next) : undefined).replace(/\n$/, "");
let s = readFileSync(dir + "/painel/mesa.html", "utf8"), done = 0, missing = 0;
const rep = (a, b) => { if (!s.includes(a)) { missing++; console.log("trecho não encontrado: " + a.slice(0, 70)); return; } s = s.replace(a, () => b); done++; };

rep('next.set(i.inputName, { mul: v.inputVolumeMul, db: v.inputVolumeDb, muted: !!m?.inputMuted });',
    'const tr = await tryReq("GetInputAudioTracks", { inputName: i.inputName }), mo = await tryReq("GetInputAudioMonitorType", { inputName: i.inputName });\n      next.set(i.inputName, { mul: v.inputVolumeMul, db: v.inputVolumeDb, muted: !!m?.inputMuted, tracks: tr?.inputAudioTracks || {}, mon: mo?.monitorType || "OBS_MONITORING_TYPE_NONE" });');
rep('box.innerHTML = [...st.audio].map(', 'box.innerHTML = (st.audio.size ? `<div class="sec">INPUTS</div>` : "") + [...st.audio].map(');
rep('<div class="bd"><div class="mt"></div><div class="mt"></div><div class="fd" data-f="${esc(name)}"><i></i></div></div><div class="db"></div><div class="bt"><button class="${a.muted ? "muted" : ""}" data-a="mute" data-v="${esc(name)}" title="Mudo">M</button></div></div>`',
    '<div class="bd"><div class="col"><button data-a="audioset" data-v="${esc(name)}" title="Configurar o áudio: ganho, atraso, EQ, compressor, noise gate">${GEAR}</button><button class="${a.mon !== "OBS_MONITORING_TYPE_NONE" ? "on" : ""}" data-a="solo" data-v="${esc(name)}" title="Solo: ouvir esta entrada no fone, sem mexer na mixagem">S</button><button class="${a.muted ? "muted" : "on"}" data-a="mute" data-v="${esc(name)}" title="Liga ou desliga o áudio desta entrada">${SPK}</button></div><div class="fd" data-f="${esc(name)}"><i></i></div><div class="mt"></div><div class="mt"></div></div><div class="db"></div>' +
    '<div class="bt">${[["1", "M", "Master"], ["2", "A", "barramento A"], ["3", "B", "barramento B"]].map(([k, l, t]) => `<button class="${a.tracks[k] ? "on" : ""}" data-a="bus" data-k="${k}" data-v="${esc(name)}" title="Enviar o áudio desta entrada para ${t} (trilha ${k} do motor)">${l}</button>`).join("")}</div></div>`');
rep('else if (type === "InputMuteStateChanged")',
    'else if (type === "InputAudioTracksChanged") { const a = st.audio.get(d.inputName); if (a) { a.tracks = d.inputAudioTracks; renderMixer(); } }\n    else if (type === "InputAudioMonitorTypeChanged") { const a = st.audio.get(d.inputName); if (a) { a.mon = d.monitorType; renderMixer(); } }\n    else if (type === "InputMuteStateChanged")');
rep('    record: () => (st.locked && st.rec ? A.lockmsg() : run(req("ToggleRecord"))),', part("ACT", "POP") + '\n    record: () => (st.locked && st.rec ? A.lockmsg() : run(req("ToggleRecord"))),');
rep('    else if (st.pop === "gear") p.innerHTML =', part("POP", "LISTEN") + '\n    else if (st.pop === "gear") p.innerHTML =');
rep('["add", "ext", "recset", "streamset"].includes(st.pop)', '["add", "ext", "recset", "streamset", "audioset"].includes(st.pop)');
rep('if (id === "stats") A.statsload();', 'if (id === "stats") A.statsload(); if (id === "audioset") { st.aset = null; st.asetTab = "geral"; renderPop(); A.asetload(); }');
rep('  document.addEventListener("contextmenu",', part("LISTEN") + '\n  document.addEventListener("contextmenu",');
rep("</style>", `  .mixer .sec { writing-mode: vertical-rl; transform: rotate(180deg); background: #1668b8; color: #fff; font-weight: 700; font-size: 11px; text-align: center; padding: 0 4px; flex: none; letter-spacing: .5px; }
  .strip { width: 84px; } .strip .bd { gap: 4px; } .strip .col { display: flex; flex-direction: column; gap: 3px; justify-content: flex-start; }
  .strip .col button, .strip .bt button { width: 24px; height: 20px; font-size: 10px; font-weight: 800; background: var(--btn); border: 1px solid var(--bd); display: grid; place-items: center; border-radius: 0; }
  .strip .col button svg { width: 12px; height: 12px; } .strip .bt { display: flex; gap: 2px; }
  .strip .col .on, .strip .bt .on { background: var(--grn); border-color: #2fb02c; color: #fff; } .strip .col .muted { background: var(--red); border-color: #ef5a4f; color: #fff; }
  .add .form input[type="range"] { padding: 0; border: 0; background: transparent; }
</style>`);
if (!missing) writeFileSync(dir + "/painel/mesa.html", s);
console.log(`${done} trechos alterados, ${missing} não encontrados${missing ? " (arquivo NÃO gravado)" : ""}`);
