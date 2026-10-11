// Opens one or more windows of the panel against the screens sandbox (real program behind) and reports, for each:
// script errors, requests that failed, commands sent just by opening (must be none), the message line, every control
// with its state, and a picture. Nothing is clicked.
//   node scripts/qa/sondar-janela.mjs <pasta-de-saída> <rota[:largura:altura]> [<rota…>]
import fs from "node:fs/promises";
import path from "node:path";
import net from "node:net";
import { spawn } from "node:child_process";

const ws = path.resolve(import.meta.dirname, "../.."), sandbox = JSON.parse(await fs.readFile(path.join(ws, "qa-finalizacao/sandbox-telas/sandbox.json"), "utf8")), base = sandbox.base;
const [outArg, ...routes] = process.argv.slice(2), out = path.resolve(outArg); await fs.mkdir(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const freePort = async () => { const s = net.createServer(); await new Promise((r) => s.listen(0, "127.0.0.1", r)); const n = s.address().port; await new Promise((r) => s.close(r)); return n; };
const profile = await fs.mkdtemp(path.join(ws, "qa-finalizacao/own-temp-sandbox-telas", "FreeMix-QA-TestBrowser-")), port = await freePort();
spawn("C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "--no-first-run", "--no-default-browser-check", "--disable-extensions", "--disable-sync", "--window-size=760,560", "about:blank"], { windowsHide: true, stdio: "ignore" });
let version = null; for (let i = 0; i < 100 && !version; i++) { try { version = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); } catch { await sleep(200); } }
const socket = new WebSocket(version.webSocketDebuggerUrl); await new Promise((r) => { socket.onopen = r; });
let id = 0; const pending = new Map(); let events = [];
const cdp = (method, params = {}, sessionId) => new Promise((resolve) => { const n = ++id; pending.set(n, resolve); socket.send(JSON.stringify({ id: n, method, params, ...(sessionId ? { sessionId } : {}) })); });
socket.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d.result ?? d); pending.delete(d.id); } else if (d.method) events.push(d); };
const report = [];
try {
  for (const spec of routes) {
    const [route, w = "700", h = "540"] = spec.split(":"), name = route.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "raiz";
    const { targetId } = await cdp("Target.createTarget", { url: "about:blank" }), { sessionId } = await cdp("Target.attachToTarget", { targetId, flatten: true });
    for (const d of ["Page", "Runtime", "Network"]) await cdp(d + ".enable", {}, sessionId);
    await cdp("Emulation.setDeviceMetricsOverride", { width: Number(w), height: Number(h), deviceScaleFactor: 1, mobile: false }, sessionId);
    await cdp("Page.addScriptToEvaluateOnNewDocument", { source: "window.confirm = () => true; window.close = () => { window.__closed = true; };" }, sessionId);
    events = []; await cdp("Page.navigate", { url: base + route }, sessionId); await sleep(6000);
    const mine = events.filter((e) => e.sessionId === sessionId), requests = new Map();
    for (const e of mine) if (e.method === "Network.requestWillBeSent") requests.set(e.params.requestId, { method: e.params.request.method, url: e.params.request.url.replace(base, ""), body: e.params.request.postData || "" });
    for (const e of mine) if (e.method === "Network.responseReceived" && requests.has(e.params.requestId)) requests.get(e.params.requestId).status = e.params.response.status;
    const all = [...requests.values()];
    const ev = async (expression) => (await cdp("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }, sessionId)).result?.value;
    const controls = await ev(`[...document.querySelectorAll("button,input,select,textarea")].filter((e) => e.type !== "file").map((e) => { const r = e.getBoundingClientRect(), hidden = !e.offsetParent && getComputedStyle(e).position !== "fixed"; return (hidden ? "~" : " ") + (e.disabled ? "x " : "  ") + e.tagName.toLowerCase() + (e.type && e.tagName === "INPUT" ? ":" + e.type : "") + "#" + (e.id || "?") + " = " + JSON.stringify(e.tagName === "BUTTON" ? e.textContent.trim().slice(0, 40) : e.type === "checkbox" || e.type === "radio" ? e.checked : e.tagName === "SELECT" ? (e.selectedOptions[0]?.textContent || "").trim().slice(0, 50) + " [" + e.options.length + "]" : String(e.value).slice(0, 50)) + (r.right > innerWidth + 1 ? "  <<< passa da largura" : ""); })`);
    const page = await ev(`({ title: document.title, msg: (document.querySelector("#msg,#message")?.textContent || "").trim(), scrollW: document.documentElement.scrollWidth, scrollH: document.documentElement.scrollHeight, w: innerWidth, h: innerHeight, text: document.body.innerText.replace(/\\s+/g, " ").slice(0, 900) })`);
    const png = Buffer.from((await cdp("Page.captureScreenshot", { format: "png" }, sessionId)).data, "base64"); await fs.writeFile(path.join(out, name + ".png"), png);
    const item = { route, title: page.title, size: `${page.w}x${page.h}`, content: `${page.scrollW}x${page.scrollH}`, overflowX: page.scrollW > page.w, overflowY: page.scrollH > page.h, msg: page.msg,
      scriptErrors: mine.filter((e) => e.method === "Runtime.exceptionThrown").map((e) => String(e.params.exceptionDetails?.exception?.description || e.params.exceptionDetails?.text).slice(0, 300)),
      failedRequests: all.filter((r) => r.status >= 400).map((r) => `${r.status} ${r.method} ${r.url}`),
      commandsOnOpen: all.filter((r) => r.method !== "GET").map((r) => `${r.method} ${r.url} ${r.body.slice(0, 160)}`),
      reads: [...new Set(all.filter((r) => r.method === "GET" && r.url.startsWith("/api/")).map((r) => r.url))], controls, text: page.text };
    report.push(item); await cdp("Target.closeTarget", { targetId });
    console.log(`\n=== ${route}  "${item.title}"  janela ${item.size}  conteúdo ${item.content}${item.overflowX ? "  PASSA DA LARGURA" : ""}${item.overflowY ? "  (rola na altura)" : ""}`);
    console.log(`erros de script: ${item.scriptErrors.length ? item.scriptErrors.join(" | ") : "nenhum"}`);
    console.log(`pedidos que falharam: ${item.failedRequests.length ? item.failedRequests.join(" | ") : "nenhum"}`);
    console.log(`comandos só de abrir: ${item.commandsOnOpen.length ? item.commandsOnOpen.join(" | ") : "nenhum"}`);
    console.log(`leituras: ${item.reads.join(", ")}`); console.log(`mensagem: ${item.msg || "(vazia)"}`);
    console.log(controls.join("\n"));
  }
} finally {
  await fs.writeFile(path.join(out, "sondagem.json"), JSON.stringify(report, null, 2));
  await cdp("Browser.close"); await sleep(500); await fs.rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }).catch(() => {});
}
