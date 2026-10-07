// One-off edit of painel/mesa.html, on top of patch-barramentos.mjs: inputs instead of scenes. Adds, to the input
// settings menu, "Camadas" (other inputs drawn on top of this one, with layout presets) and "Juntar áudio" (an audio
// source becomes part of the input), and makes the automatic-mix arrows of the mixer a real switch (an input with
// automatic mixing off is kept always on air inside the bus scene).
import { readFileSync, writeFileSync } from "node:fs";
const dir = "D:/DRIVE/IA/antigravity/vmixtwste/obs-vmix";
const snip = readFileSync(dir + "/ferramentas/camadas.snippet.js", "utf8").replace(/\r\n/g, "\n");
const part = (name, next) => snip.slice(snip.indexOf("//@@" + name) + name.length + 5, next ? snip.indexOf("//@@" + next) : undefined).replace(/\n$/, "");
let s = readFileSync(dir + "/painel/mesa.html", "utf8"), done = 0, missing = 0;
const rep = (a, b) => { if (!s.includes(a)) { missing++; console.log("trecho não encontrado: " + a.slice(0, 70)); return; } s = s.replace(a, () => b); done++; };
const span = (label, start, end, b) => { const from = s.indexOf(start), to = s.indexOf(end, from); if (from < 0 || to < 0) { missing++; console.log("trecho não encontrado: " + label); return; } s = s.slice(0, from) + b + s.slice(to + end.length); done++; };

rep('  let dragging = null;', part("HELPER", "ACT") + '\n  let dragging = null;');
span("ação das setas", "    follow: (d) => toast(", 'não acompanha o vídeo."),', part("ACT", "POP"));
rep('    else if (st.pop === "gear") p.innerHTML =', part("POP", "FOLLOWBTN") + '\n    else if (st.pop === "gear") p.innerHTML =');
span("botão das setas", '<button class="fw${n ? " lit" : ""}" data-a="follow"', '${ARR}</button>', part("FOLLOWBTN"));
rep('    st.items = items; st.loop = loop;', '    const fx = await tryReq("GetSceneItemList", { sceneName: BUS_SCENE }); st.fixed = new Set((fx?.sceneItems || []).map((i) => i.sourceName).filter((n) => !BUSES.some((b) => b.name === n)));\n    st.items = items; st.loop = loop;');
rep('<button data-a="renameask" data-v="${v}">Renomear…</button>', '<button data-a="layers" data-v="${v}">Camadas: outras entradas por cima…</button><button data-a="audioadd" data-v="${v}">Juntar áudio a esta entrada…</button><button data-a="renameask" data-v="${v}">Renomear…</button>');
rep('if (id === "stats") A.statsload();', 'if (id === "stats") A.statsload(); if (id === "layers") { st.layers = null; A.layersload(); }');
rep("</style>", `  /* Layers of an input. */
  .strip .col .fw { cursor: pointer; }
  .layers { display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px; }
  .lyr { display: grid; grid-template-columns: 22px minmax(90px, 1fr) 190px 86px 78px; gap: 5px; align-items: center; }
  .lyr b { text-align: center; background: #2b323d; line-height: 22px; } .lyr span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } .lyr select { height: 25px; }
</style>`);
if (!missing) writeFileSync(dir + "/painel/mesa.html", s);
console.log(`${done} trechos alterados, ${missing} não encontrados${missing ? " (arquivo NÃO gravado)" : ""}`);
