// Shared by the click tests of the windows: a real browser (Edge, no window) driven with real mouse input against the
// screens sandbox (scripts/qa/sandbox-telas.mjs must be open). confirm() answers yes, closing the window is recorded
// instead of done, and the clipboard is captured inside the page so the computer's clipboard is never touched.
import fs from "node:fs/promises";
import path from "node:path";
import net from "node:net";
import { spawn } from "node:child_process";

export const ws = path.resolve(import.meta.dirname, "../..");
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const until = async (probe, ms = 15000) => { for (const end = Date.now() + ms; Date.now() < end;) { const v = await probe(); if (v) return v; await sleep(200); } return null; };
export const freePort = async () => { const s = net.createServer(); await new Promise((r) => s.listen(0, "127.0.0.1", r)); const n = s.address().port; await new Promise((r) => s.close(r)); return n; };

export async function openTest({ width = 700, height = 540, shots = null, hold = [] } = {}) {
  const sandbox = JSON.parse(await fs.readFile(path.join(ws, "qa-finalizacao/sandbox-telas/sandbox.json"), "utf8")), base = sandbox.base;
  let pass = 0, total = 0;
  const check = (name, ok, detail = "") => { total++; if (ok) pass++; console.log(`${ok ? "OK   " : "FALHA"} ${name}${detail !== "" && detail != null ? "  (" + detail + ")" : ""}`); return ok; };
  const api = async (p) => (await fetch(base + p, { cache: "no-store" })).json();
  const command = async (body) => (await fetch(base + "/api/control", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })).json();

  const profile = await fs.mkdtemp(path.join(ws, "qa-finalizacao/own-temp-sandbox-telas", "FreeMix-QA-TestBrowser-")), port = await freePort();
  spawn("C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "--no-first-run", "--no-default-browser-check", "--disable-extensions", "--disable-sync", `--window-size=${width},${height}`, "about:blank"], { windowsHide: true, stdio: "ignore" });
  let version = null; for (let i = 0; i < 100 && !version; i++) { try { version = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); } catch { await sleep(200); } }
  const socket = new WebSocket(version.webSocketDebuggerUrl); await new Promise((r) => { socket.onopen = r; });
  let id = 0; const pending = new Map(), problems = [], posts = [], held = [];
  const cdp = (method, params = {}, sessionId) => new Promise((resolve) => { const n = ++id; pending.set(n, resolve); socket.send(JSON.stringify({ id: n, method, params, ...(sessionId ? { sessionId } : {}) })); });
  socket.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pending.has(d.id)) { pending.get(d.id)(d.result ?? d); pending.delete(d.id); }
    else if (d.method === "Runtime.exceptionThrown") problems.push(String(d.params.exceptionDetails?.exception?.description || d.params.exceptionDetails?.text).slice(0, 200));
    else if (d.method === "Fetch.requestPaused") {
      // Every command the page sends is recorded; the ones named in "hold" are answered here, not by the engine.
      let body = {}; try { body = JSON.parse(d.params.request.postData || "{}"); } catch { /* not a command */ }
      if (d.params.request.method !== "GET") posts.push({ url: d.params.request.url.replace(base, ""), ...body });   // reads are not commands
      if (hold.includes(body.action)) { held.push(body.action); cdp("Fetch.fulfillRequest", { requestId: d.params.requestId, responseCode: 200, responseHeaders: [{ name: "Content-Type", value: "application/json" }], body: Buffer.from(JSON.stringify({ success: true })).toString("base64") }, d.sessionId); }
      else cdp("Fetch.continueRequest", { requestId: d.params.requestId }, d.sessionId);
    }
  };
  const { targetId } = await cdp("Target.createTarget", { url: "about:blank" }), { sessionId } = await cdp("Target.attachToTarget", { targetId, flatten: true });
  for (const d of ["Page", "Runtime"]) await cdp(d + ".enable", {}, sessionId);
  await cdp("Fetch.enable", { patterns: [{ urlPattern: "*", resourceType: "XHR", requestStage: "Request" }, { urlPattern: "*", resourceType: "Fetch", requestStage: "Request" }] }, sessionId);
  await cdp("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false }, sessionId);
  await cdp("Page.addScriptToEvaluateOnNewDocument", { source: "window.confirm = () => true; window.close = () => { window.__closed = true; }; Object.defineProperty(navigator, 'clipboard', { value: { writeText: async (t) => { window.__copied = t; } } });" }, sessionId);
  const ev = async (expression) => { const r = await cdp("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }, sessionId); if (r.exceptionDetails) throw Error(r.exceptionDetails.exception?.description || "erro na página"); return r.result?.value; };
  const spot = (sel) => ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; e.scrollIntoView({ block: "center" }); const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, disabled: !!e.disabled, shown: r.width > 0 && r.height > 0 }; })()`);
  const mouse = (type, p) => cdp("Input.dispatchMouseEvent", { type, x: p.x, y: p.y, button: "left", buttons: type === "mousePressed" ? 1 : 0, clickCount: 1 }, sessionId);
  const page = {
    open: async (route) => { posts.length = 0; await cdp("Page.navigate", { url: base + route }, sessionId); },
    ev, spot, mouse,
    click: async (sel) => { const p = await spot(sel); if (!p) return "sem elemento"; if (!p.shown) return "escondido"; if (p.disabled) return "desabilitado"; await mouse("mousePressed", p); await mouse("mouseReleased", p); return "ok"; },
    type: (sel, value) => ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e || e.disabled || e.readOnly) return "indisponível"; e.focus(); e.value = ${JSON.stringify(value)}; e.dispatchEvent(new Event("input", { bubbles: true })); e.dispatchEvent(new Event("change", { bubbles: true })); e.blur(); return "ok"; })()`),
    choose: (sel, textOrValue) => ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); const o = [...e.options].find((x) => x.value === ${JSON.stringify(textOrValue)} || x.textContent.includes(${JSON.stringify(textOrValue)})); if (!o || e.disabled || o.disabled) return "sem opção"; e.value = o.value; e.dispatchEvent(new Event("change", { bubbles: true })); return "ok"; })()`),
    text: (sel) => ev(`document.querySelector(${JSON.stringify(sel)})?.textContent ?? null`),
    value: (sel) => ev(`document.querySelector(${JSON.stringify(sel)})?.value ?? null`),
    is: (sel, what) => ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); return !!e && (${JSON.stringify(what)} === "hidden" ? !(e.getBoundingClientRect().width > 0) : ${JSON.stringify(what)} === "checked" ? e.checked : ${JSON.stringify(what)} === "disabled" ? e.disabled : e.classList.contains(${JSON.stringify(what)})); })()`),
    shot: async (name) => { if (!shots) return; await fs.mkdir(shots, { recursive: true }); await fs.writeFile(path.join(shots, name + ".png"), Buffer.from((await cdp("Page.captureScreenshot", { format: "png" }, sessionId)).data, "base64")); },
    closed: () => until(() => ev(`window.__closed === true`), 5000),
  };
  const finish = async () => { await cdp("Browser.close"); await sleep(500); await fs.rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }).catch(() => {}); console.log(`\n${pass}/${total} verificações passaram`); return pass === total; };
  return { sandbox, base, api, command, check, page, problems, posts, held, finish };
}
