// Click-test of the input categories (names, search, drag to a tab). Engine with --remote-debugging-port=9333.
// Puts names, tags, search and filter back at the end.
import { createRequire } from "node:module";
import { sleep } from "./obsws.mjs";
const require = createRequire("D:/DRIVE/IA/antigravity/vmixtwste/rea/package.json");
const WebSocket = require("ws");
const t = (await (await fetch("http://127.0.0.1:9333/json")).json()).find((x) => x.url.endsWith("painel/mesa.html"));
const c = new WebSocket(t.webSocketDebuggerUrl); await new Promise((r) => c.on("open", r));
let id = 0; const waits = new Map(); c.on("message", (raw) => { const m = JSON.parse(String(raw)); waits.get(m.id)?.(m); waits.delete(m.id); });
const ev = (expression) => new Promise((r) => { const i = ++id; waits.set(i, (m) => r(m.result?.exceptionDetails ? "ERRO: " + m.result.exceptionDetails.exception?.description : m.result?.result?.value)); c.send(JSON.stringify({ id: i, method: "Runtime.evaluate", params: { expression, returnByValue: true, awaitPromise: true } })); });
const click = (sel) => ev(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return "sem elemento"; el.click(); return "ok"; })()`);
let pass = 0, total = 0;
const check = (name, ok, detail = "") => { total++; if (ok) pass++; console.log(`${ok ? "OK   " : "FALHA"} ${name}${detail !== "" ? "  (" + detail + ")" : ""}`); };

await ev("location.reload()"); await sleep(7000);
const keep = await ev(`JSON.stringify({ names: st.catNames, tags: st.tags, find: st.find })`);
const tiles = () => ev(`[...document.querySelectorAll(".tile")].map((e) => e.dataset.s).join("|")`);
try {
  const all = (await tiles()).split("|");
  check("a barra tem Todas, sete cores e a busca", (await ev(`document.querySelectorAll("#tabs .c[data-cat]").length`)) === 7 && (await ev(`!!document.querySelector("#tabs .c.all") && !!document.querySelector("#tabs .c.find")`)) === true);
  await ev(`document.querySelector('#tabs .c[data-cat="1"]').dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true }))`); await sleep(400);
  check("clique direito numa aba abre os nomes das categorias", (await ev(`st.pop`)) === "catnames" && (await ev(`document.querySelectorAll(".catrow input").length`)) === 7);
  await ev(`document.getElementById("cn-1").value = "PRINCIPAIS"`); await click(`.pop [data-a="catnamesgo"]`); await sleep(400);
  check("a aba passa a mostrar o nome dado", (await ev(`document.querySelector('#tabs .c[data-cat="1"]').textContent`)) === "PRINCIPAIS");
  // Drag the thumbnail of the first input to that tab.
  const first = all[0];
  await ev(`(() => { const th = document.querySelector('.tile[data-s=${JSON.stringify(first)}] .th'), tab = document.querySelector('#tabs .c[data-cat="1"]'), dt = new DataTransfer();
    th.dispatchEvent(new DragEvent("dragstart", { bubbles: true, cancelable: true, dataTransfer: dt })); tab.dispatchEvent(new DragEvent("dragover", { bubbles: true, cancelable: true, dataTransfer: dt })); tab.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: dt })); })()`); await sleep(400);
  check("arrastar a miniatura até a aba põe a entrada na categoria", (await ev(`st.tags[${JSON.stringify(first)}]`)) === 1);
  await click(`#tabs .c[data-cat="1"]`); await sleep(400);
  const only = (await tiles()).split("|");
  check("clicar na aba mostra só as entradas dela, com a linha na cor da categoria", only.includes(first) && only.length < all.length && (await ev(`getComputedStyle(document.getElementById("tabs")).borderBottomColor`)) === (await ev(`getComputedStyle(document.querySelector('#tabs .c[data-cat="1"]')).backgroundColor`)), `${only.length} de ${all.length}`);
  await click(`#tabs .c.find`); await sleep(400);
  await ev(`document.getElementById("cf-find").value = "cam"`); await click(`.pop [data-a="catfindgo"]`); await sleep(400);
  const found = (await tiles()).split("|"), expected = all.filter((n) => n.toLowerCase().includes("cam"));
  check("a busca mostra só as entradas cujo nome contém o texto", found.length === expected.length && found.every((n) => /cam/i.test(n)) && (await ev(`document.querySelector("#tabs .c.find span")?.textContent`)) === "cam", `${found.length} entradas`);
  await click(`#tabs .c.all`); await sleep(300);
  check("Todas volta a mostrar tudo", (await tiles()).split("|").length === all.length);
} finally {
  await ev(`(() => { const k = ${keep}; st.catNames = k.names; st.tags = k.tags; st.find = k.find; st.filter = -1; store.set("mesa.catnames", k.names); store.set("mesa.tags", k.tags); store.set("mesa.find", k.find); closePop(); renderTabs(); renderTiles(); })()`);
}
console.log(`${pass}/${total} verificações passaram`);
c.close();
