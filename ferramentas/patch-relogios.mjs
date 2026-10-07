// One-off edit of painel/mesa.html: window to set up the production clocks shown in the top bar (see the reference
// help page "Production Clocks"). The clocks themselves are drawn by painel/topbar.html.
import { readFileSync, writeFileSync } from "node:fs";
const dir = "D:/DRIVE/IA/antigravity/vmixtwste/obs-vmix";
const snip = readFileSync(dir + "/ferramentas/relogios.snippet.js", "utf8").replace(/\r\n/g, "\n");
const part = (name, next) => snip.slice(snip.indexOf("//@@" + name) + name.length + 5, next ? snip.indexOf("//@@" + next) : undefined).replace(/\n$/, "");
let s = readFileSync(dir + "/painel/mesa.html", "utf8"), done = 0, missing = 0;
const rep = (a, b) => { if (!s.includes(a)) { missing++; console.log("trecho não encontrado: " + a.slice(0, 70)); return; } s = s.replace(a, () => b); done++; };
rep('  let dragging = null;', part("HELPER", "ACT") + '\n  let dragging = null;');
rep('    audioset: (d) => openPop("audioset", d.v),', part("ACT", "POP") + '\n    audioset: (d) => openPop("audioset", d.v),');
rep('    else if (st.pop === "gear") p.innerHTML =', part("POP") + '\n    else if (st.pop === "gear") p.innerHTML =');
rep('if (id === "stats") A.statsload();', 'if (id === "stats") A.statsload(); if (id === "clocks") { st.clocks = null; A.clocksload(); }');
if (!missing) writeFileSync(dir + "/painel/mesa.html", s);
console.log(`${done} trechos alterados, ${missing} não encontrados${missing ? " (arquivo NÃO gravado)" : ""}`);
