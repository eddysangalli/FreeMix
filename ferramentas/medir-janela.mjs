// Test helper: reload the panel, open a window by id and report whether its content fits without sideways scrolling.
import { createRequire } from "node:module";
const require = createRequire("D:/DRIVE/IA/antigravity/vmixtwste/rea/package.json"); const WebSocket = require("ws");
const t = (await (await fetch("http://127.0.0.1:9333/json")).json()).find((x) => x.url.endsWith("painel/mesa.html"));
const c = new WebSocket(t.webSocketDebuggerUrl); await new Promise((r) => c.on("open", r));
let id = 0; const waits = new Map(); c.on("message", (raw) => { const m = JSON.parse(String(raw)); waits.get(m.id)?.(m); waits.delete(m.id); });
const ev = (expression) => new Promise((r) => { const i = ++id; waits.set(i, (m) => r(m.result?.result?.value)); c.send(JSON.stringify({ id: i, method: "Runtime.evaluate", params: { expression, returnByValue: true } })); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await ev("location.reload()"); await sleep(5000);
await ev(`st.pop = null; openPop(${JSON.stringify(process.argv[2] || "ext")})`); await sleep(2000);
console.log(await ev(`(() => { const p = document.getElementById("pop"), o = p.querySelector(".outs") || p; return JSON.stringify({ janela: p.offsetWidth + "x" + p.offsetHeight, painel: innerWidth + "x" + innerHeight, cabeNaLargura: o.scrollWidth <= o.clientWidth + 1, cabeNaAltura: p.getBoundingClientRect().top >= 0, colunas: [...p.querySelectorAll("th")].map((h) => h.textContent).join(" | ") }); })()`));
c.close();
