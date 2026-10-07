// One-off edit of painel/mesa.html: categories of inputs as in the reference help page "Categories": colours that
// can be given names (right-click a tab), a search tab, the line under the tabs in the colour of the selected
// category, dragging an input's thumbnail to a tab to assign it, and the input's settings button in its colour.
import { readFileSync, writeFileSync } from "node:fs";
const dir = "D:/DRIVE/IA/antigravity/vmixtwste/obs-vmix";
const snip = readFileSync(dir + "/ferramentas/categorias.snippet.js", "utf8").replace(/\r\n/g, "\n");
const part = (name, next) => snip.slice(snip.indexOf("//@@" + name) + name.length + 5, next ? snip.indexOf("//@@" + next) : undefined).replace(/\n$/, "");
let s = readFileSync(dir + "/painel/mesa.html", "utf8"), done = 0, missing = 0;
const rep = (a, b) => { if (!s.includes(a)) { missing++; console.log("trecho não encontrado: " + a.slice(0, 70)); return; } s = s.replace(a, () => b); done++; };

const from = s.indexOf("  function renderTabs() {"), to = s.indexOf("  function renderTiles() {", from);
if (from < 0 || to < 0) { missing++; console.log("trecho não encontrado: renderTabs"); } else { s = s.slice(0, from) + part("TABS", "HELPER") + "\n" + s.slice(to); done++; }
rep('  let dragging = null;', part("HELPER", "ACT") + '\n  let dragging = null;');
rep('    audioset: (d) => openPop("audioset", d.v),', part("ACT", "POP") + '\n    audioset: (d) => openPop("audioset", d.v),');
rep('    else if (st.pop === "gear") p.innerHTML =', part("POP") + '\n    else if (st.pop === "gear") p.innerHTML =');
rep('const shown = () => st.scenes.filter((n) => st.filter < 0 || st.tags[n] === st.filter);',
    'const shown = () => st.scenes.filter((n) => (st.filter === -2 ? n.toLowerCase().includes((st.find || "").toLowerCase()) : st.filter < 0 || st.tags[n] === st.filter));');
rep('const t = e.target.closest(".tile"); if (t) openPop("menu", t.dataset.s); });', 'if (e.target.closest(".c")) return openPop("catnames"); const t = e.target.closest(".tile"); if (t) openPop("menu", t.dataset.s); });');
rep('<button class="th" data-a="preview" data-v="${esc(name)}" title="Clique: envia para o Preview">', '<button class="th" draggable="true" data-a="preview" data-v="${esc(name)}" title="Clique: envia para o Preview. Arraste até uma aba de categoria para pôr a entrada nela.">');
rep("</style>", `  /* Category tabs with names, search tab, coloured line under the tabs. */
  .tabs { border-bottom-width: 2px; }
  .tabs .c.named { width: auto; min-width: 22px; padding: 0 9px; color: #fff; font-size: 11px; font-weight: 700; text-shadow: 0 1px 1px rgba(0, 0, 0, .55); white-space: nowrap; }
  .tabs .c.find { width: auto; min-width: 24px; padding: 0 6px; background: var(--btn); display: inline-flex; align-items: center; gap: 4px; color: #e6ebf2; font-size: 11px; } .tabs .c.find svg { width: 12px; height: 12px; }
  .tabs .c.find.on { background: #e6ebf2; color: #10141a; }
  .catrow { display: grid !important; grid-template-columns: 22px 1fr; align-items: center; gap: 6px; margin-bottom: 4px !important; } .catrow i { width: 22px; height: 22px; border: 1px solid rgba(0, 0, 0, .5); }
</style>`);
if (!missing) writeFileSync(dir + "/painel/mesa.html", s);
console.log(`${done} trechos alterados, ${missing} não encontrados${missing ? " (arquivo NÃO gravado)" : ""}`);
