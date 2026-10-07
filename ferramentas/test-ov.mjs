// Overlay buttons only: reload the panel, then click and read each keyer's current scene from the plugin.
import { createRequire } from "node:module";
import { connect, sleep } from "./obsws.mjs";
const require = createRequire("D:/DRIVE/IA/antigravity/vmixtwste/rea/package.json");
const WebSocket = require("ws");
const target = (await (await fetch("http://127.0.0.1:9333/json")).json()).find((t) => t.url.endsWith("painel/mesa.html"));
const cdp = new WebSocket(target.webSocketDebuggerUrl); await new Promise((r) => cdp.on("open", r));
let id = 0; const waits = new Map();
cdp.on("message", (raw) => { const m = JSON.parse(String(raw)); waits.get(m.id)?.(m); waits.delete(m.id); });
const evalJs = (expression) => new Promise((r) => { const i = ++id; waits.set(i, (m) => r(m.result?.result?.value)); cdp.send(JSON.stringify({ id: i, method: "Runtime.evaluate", params: { expression, returnByValue: true, awaitPromise: true } })); });
const click = (sel) => evalJs(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return "sem elemento"; el.click(); return "ok"; })()`);
const ov = (name, k) => `.tile [data-a="ov"][data-k="${k}"][data-v="${name}"]`;
const obs = await connect();
const vendor = (requestType, requestData = {}) => obs.req("CallVendorRequest", { vendorName: "downstream-keyer", requestType, requestData }).then((r) => r.responseData);
const now = async () => { const out = []; for (const n of "1234") out.push(`${n}=${(await vendor("dsk_get_scene", { dsk_name: n })).scene || "-"}`); return out.join(" "); };
let pass = 0, total = 0; const check = (name, ok, detail) => { total++; if (ok) pass++; console.log(`${ok ? "OK   " : "FALHA"} ${name}  (${detail})`); };

for (const n of "1234") await vendor("dsk_select_scene", { dsk_name: n, scene: "" });
await evalJs("location.reload()"); await sleep(3500);
console.log("início:", await now(), "| painel:", await evalJs("JSON.stringify(st.keyers)"));
await click(ov("GC TARJA", 0)); await sleep(1600);
let k = await now(); check("Overlay 1 liga a tarja", k.includes("1=GC TARJA"), k);
check("botão 1 da tarja acende no painel", await evalJs(`!!document.querySelector('${ov("GC TARJA", 0)}.on')`), "classe on");
await click(ov("PLACAR", 1)); await sleep(1600);
k = await now(); check("Overlay 2 com outra entrada ao mesmo tempo", k.includes("1=GC TARJA") && k.includes("2=PLACAR"), k);
if (process.argv[2] === "hold") { console.log("overlays mantidos ligados para a captura"); obs.close(); cdp.close(); process.exit(0); }
await click(ov("PLACAR", 1)); await sleep(1600);
k = await now(); check("mesmo botão desliga o overlay 2", k.includes("2=-") && k.includes("1=GC TARJA"), k);
await click(`.bot [data-a="pop"][data-v="overlay"]`); await sleep(400);
check("janela Overlay lista o canal ligado", await evalJs(`document.getElementById('pop').textContent.includes('GC TARJA')`), "popover");
await click(`.pop [data-a="ovoff"][data-k="0"]`); await sleep(1600);
k = await now(); check("Desligar na janela Overlay apaga o canal 1", k === "1=- 2=- 3=- 4=-", k);
await click(`.pop [data-a="close"]`);
console.log(`${pass}/${total} verificações passaram`);
obs.close(); cdp.close();
