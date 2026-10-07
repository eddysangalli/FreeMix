// One-off edit: make the buttons do what the reference program's own tooltips say they do
// (source: vMix27-copia/languages/pt br eddy 29-0-0-40.txt, keys ToolTip.frmmain.*, and the official help pages).
import { readFileSync, writeFileSync } from "node:fs";
const dir = "D:/DRIVE/IA/antigravity/vmixtwste/obs-vmix";
const snip = readFileSync(dir + "/ferramentas/corrige-botoes.snippet.js", "utf8").replace(/\r\n/g, "\n");
const part = (name, next) => snip.slice(snip.indexOf("//@@" + name) + name.length + 5, next ? snip.indexOf("//@@" + next) : undefined).replace(/\n$/, "");
let m = readFileSync(dir + "/painel/mesa.html", "utf8"), done = 0, missing = 0;
const rep = (a, b) => { if (!m.includes(a)) { missing++; console.log("trecho não encontrado: " + a.slice(0, 70)); return; } m = m.replace(a, () => b); done++; };

// right-hand icons: statistics, shortcuts, photo, padlock (the two invented view toggles go away)
const a = m.indexOf('        ${ib("viewlist"'), b = m.indexOf("</div>`;", a);
if (a < 0 || b < 0) { missing++; console.log("trecho não encontrado: ícones da direita"); } else { m = m.slice(0, a) + part("ICONS", "ACT") + m.slice(b + 8); done++; }
// Externo and Playlist start/stop; their gears configure
rep('data-a="pop" data-v="ext"${off}>Externo</button>', 'data-a="external"${off} title="Inicia ou para a saída externa (câmera virtual)">Externo</button>');
rep('<button class="b" data-a="pop" data-v="playlist"${off}>Playlist</button>', '<button class="b" data-a="plstart"${off} title="Inicia ou pausa a lista de reprodução">Playlist</button>');
// padlock: also Abrir/Último and every "stop"
rep('    record: () => run(req("ToggleRecord")),', part("ACT", "POP") + '\n    record: () => (st.locked && st.rec ? A.lockmsg() : run(req("ToggleRecord"))),');
rep('stream: () => (st.stream ? run(req("StopStream")) : openPop("stream")),', 'stream: () => (st.stream ? (st.locked ? A.lockmsg() : run(req("StopStream"))) : openPop("stream")),');
rep('external: () => run(req("ToggleVirtualCam")),', 'external: () => (st.locked && st.vcam ? A.lockmsg() : run(req("ToggleVirtualCam"))),');
rep("    isostop: () => run((async () => {", "    isostop: () => (st.locked ? A.lockmsg() : A.isostopgo()),\n    isostopgo: () => run((async () => {");
rep("    top_presetlast: () => run((async () => {", "    top_presetlast: () => run((async () => {\n      if (st.locked) return A.lockmsg();");
rep("presetopen: (d) => { if (d.v === st.preset) return closePop();", "presetopen: (d) => { if (d.v === st.preset) return closePop(); if (st.locked) return A.lockmsg();");
rep('closeask: (d) => (st.locked ? toast("Trava ligada: destrave no cadeado para fechar entradas", true) : openPop("close", d.v)),', 'closeask: (d) => (st.locked ? A.lockmsg() : openPop("close", d.v)),');
rep('    else if (st.pop === "gear") p.innerHTML =', part("POP") + '\n    else if (st.pop === "gear") p.innerHTML =');
rep('if (id === "presets") A.presetload();', 'if (id === "presets") A.presetload(); if (id === "stats") A.statsload();');
rep("</style>", "  .bot .ib.lockon { background: #f7931e; border-color: #d97a00; color: #1a1206; }\n</style>");
// the old meaning of "Pausar Entradas" (freezing thumbnails) and its lit state are gone
const oldPause = m.indexOf("    top_pausethumbs: () => { st.paused = !st.paused;");
if (oldPause >= 0) { m = m.slice(0, oldPause) + m.slice(m.indexOf("\n", oldPause) + 1); done++; } else { missing++; console.log("trecho não encontrado: pausa antiga"); }

let t = readFileSync(dir + "/painel/topbar.html", "utf8");
t = t.replace('title="Para de atualizar as miniaturas das entradas (poupa processamento)"', 'title="Pausa todas as entradas de vídeo que estão tocando"').replace('title="Modo básico: esconde os botões das entradas e o mixer"', 'title="Mostra ou esconde os botões avançados da janela"');
if (!missing) { writeFileSync(dir + "/painel/mesa.html", m); writeFileSync(dir + "/painel/topbar.html", t); }
console.log(`${done} trechos alterados, ${missing} não encontrados${missing ? " (nada gravado)" : ""}`);
