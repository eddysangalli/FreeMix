// One-off edit of painel/mesa.html: destinations 2 to 5 of the streaming settings window become real. They are run
// by the program (vendor "freemix" of the control server, FreeMixMultistream.cpp in the fork); the panel edits the
// list and shows each destination's state.
import { readFileSync, writeFileSync } from "node:fs";
const dir = "D:/DRIVE/IA/antigravity/vmixtwste/obs-vmix";
const snip = readFileSync(dir + "/ferramentas/multistream.snippet.js", "utf8").replace(/\r\n/g, "\n");
const part = (name, next) => snip.slice(snip.indexOf("//@@" + name) + name.length + 5, next ? snip.indexOf("//@@" + next) : undefined).replace(/\n$/, "");
let s = readFileSync(dir + "/painel/mesa.html", "utf8"), done = 0, missing = 0;
const rep = (a, b) => { if (!s.includes(a)) { missing++; console.log("trecho não encontrado: " + a.slice(0, 70)); return; } s = s.replace(a, () => b); done++; };

rep("const SUBS = 1 | 2 | 4 | 8 | 16 | 64 | 128 | 1024 | 65536;", "const SUBS = 1 | 2 | 4 | 8 | 16 | 64 | 128 | 512 | 1024 | 65536;");   // 512: vendor events
rep('  let dragging = null;', part("HELPER", "ACT") + '\n  let dragging = null;');
rep('    audioset: (d) => openPop("audioset", d.v),', part("ACT", "EVENT") + '\n    audioset: (d) => openPop("audioset", d.v),');
rep('    else if (type === "InputMuteStateChanged")', part("EVENT") + '\n    else if (type === "InputMuteStateChanged")');
rep('<button class="on" title="Destino 1">1 · Principal</button>${[2, 3, 4, 5].map((n) => `<button class="off" title="Destinos 2 a 5 dependem do multistream, que ainda não foi incorporado">${n} · indisponível</button>`).join("")}',
    '<button class="${st.destTab ? "" : "on"}${st.stream ? " dlive" : ""}" data-a="desttab" data-v="0" title="Destino 1: a transmissão principal">1 · Principal${st.stream ? " <small>NO AR</small>" : ""}</button>${destTabs()}');
rep('<div class="form"><label>Destino<select disabled><option>Servidor RTMP personalizado</option></select></label>',
    '${st.destTab ? destForm() : ""}<div class="form"${st.destTab ? \' style="display:none"\' : ""}><label>Destino<select disabled><option>Servidor RTMP personalizado</option></select></label>');
rep('await busCheck(); await syncRet();', 'await busCheck(); await syncRet(); await syncDest();');
rep('if (id === "stats") A.statsload();', 'if (id === "stats") A.statsload(); if (id === "streamset") { st.destTab = 0; syncDest(); }');
rep("</style>", `  /* Streaming destinations: state on the tab of each one. */
  .add .types button small { font-weight: 400; opacity: .75; margin-left: 4px; }
  .add .types button.dlive { box-shadow: inset 4px 0 0 var(--red); } .add .types button.dlive small { color: #ff8a80; opacity: 1; font-weight: 700; }
  .add .types button.derr { box-shadow: inset 4px 0 0 var(--org); } .add .types button.derr small { color: var(--org); opacity: 1; font-weight: 700; }
</style>`);
if (!missing) writeFileSync(dir + "/painel/mesa.html", s);
console.log(`${done} trechos alterados, ${missing} não encontrados${missing ? " (arquivo NÃO gravado)" : ""}`);
