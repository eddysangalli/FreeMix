// One-off edit of painel/mesa.html: the "Title" input type stops creating a plain static text and offers the gallery
// of animated title templates (painel/gc). Adds editing of a title's fields (also while on air) and the exit
// animation before an overlay is cut.
import { readFileSync, writeFileSync } from "node:fs";
const dir = "D:/DRIVE/IA/antigravity/vmixtwste/obs-vmix";
const snip = readFileSync(dir + "/ferramentas/gc.snippet.js", "utf8").replace(/\r\n/g, "\n");
const part = (name, next) => snip.slice(snip.indexOf("//@@" + name) + name.length + 5, next ? snip.indexOf("//@@" + next) : undefined).replace(/\n$/, "");
let s = readFileSync(dir + "/painel/mesa.html", "utf8"), done = 0, missing = 0;
const rep = (a, b) => { if (!s.includes(a)) { missing++; console.log("trecho não encontrado: " + a.slice(0, 70)); return; } s = s.replace(a, () => b); done++; };

rep('<script src="local.js"></script>', '<script src="local.js"></script>\n<script src="gc/catalogo.js"></script>');
rep('{ id: "title", label: "Title", kind: "text_gdiplus", fields: [["text", "Texto", "TÍTULO", "text"]], settings: (f) => ({ text: f.text }), hint: "Texto simples. Para GC completo use Web Browser." },',
    '{ id: "title", label: "Title", kind: "browser_source", get fields() { return gcFields(); }, settings: (f, w, h, k, name) => gcSettings(f, name), hint: "Título animado da galeria do FreeMix: tarja, urgente, placar, marca com relógio. Ponha no ar pelos botões de overlay 1 a 8 da entrada." },');
rep('${(t.fields || []).map(([key, label, def, type]) =>', '${t.id === "title" ? gcPicker() : ""}${(t.fields || []).map(([key, label, def, type]) =>');
rep('t.settings(f, w, h, n > 1 ? k + 1 : 0)', 't.settings(f, w, h, n > 1 ? k + 1 : 0, last)');
rep('  let dragging = null;', part("HELPER", "ACT") + '\n  let dragging = null;');
rep('    audioset: (d) => openPop("audioset", d.v),', part("ACT", "POP") + '\n    audioset: (d) => openPop("audioset", d.v),');
rep('    else if (st.pop === "gear") p.innerHTML =', part("POP") + '\n    else if (st.pop === "gear") p.innerHTML =');
rep('    st.items = items; st.loop = loop;', '    st.items = items; await syncGcNames().catch(() => {}); st.loop = loop;');
rep('<button data-a="filters" data-v="${esc(i.name)}">Filtros de ${esc(i.name)}…</button>', '${st.gcNames.has(i.name) ? `<button data-a="gcedit" data-v="${esc(i.name)}"><b>Editar título…</b></button>` : ""}<button data-a="filters" data-v="${esc(i.name)}">Filtros de ${esc(i.name)}…</button>');
rep('if (k.scene === d.v) await vendor("dsk_select_scene", { dsk_name: k.name, scene: "" });', 'if (k.scene === d.v) { await gcLeave(d.v); await vendor("dsk_select_scene", { dsk_name: k.name, scene: "" }); }');
rep('ovoff: (d) => run((async () => { await vendor("dsk_select_scene",', 'ovoff: (d) => run((async () => { await gcLeave(st.keyers[+d.k].scene); await vendor("dsk_select_scene",');
if (!missing) writeFileSync(dir + "/painel/mesa.html", s);
console.log(`${done} trechos alterados, ${missing} não encontrados${missing ? " (arquivo NÃO gravado)" : ""}`);
