// Real click test of the streaming settings window (/transmitir) against the screens sandbox.
// Opens the window in a real browser (Edge, no window), clicks its buttons, and confirms each effect in the engine
// and in local RTMP sinks that play the part of the destinations. Nothing leaves this computer.
//   node scripts/qa/test-transmitir.mjs [pasta-para-retratos]
// Needs the sandbox open (scripts/qa/sandbox-telas.mjs). Leaves every destination stopped.
import fs from "node:fs/promises";
import path from "node:path";
import net from "node:net";
import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";

const ws = path.resolve(import.meta.dirname, "../.."), control = path.join(ws, "qa-finalizacao/sandbox-telas"), shots = process.argv[2] ? path.resolve(process.argv[2]) : null;
const sandbox = JSON.parse(await fs.readFile(path.join(control, "sandbox.json"), "utf8")), base = sandbox.base;
const { startSink } = await import(pathToFileURL(path.join(ws, "FreeMix/ferramentas/rtmp-teste.mjs")));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const freePort = async () => { const s = net.createServer(); await new Promise((r) => s.listen(0, "127.0.0.1", r)); const n = s.address().port; await new Promise((r) => s.close(r)); return n; };
let pass = 0, total = 0;
const check = (name, ok, detail = "") => { total++; if (ok) pass++; console.log(`${ok ? "OK   " : "FALHA"} ${name}${detail !== "" ? "  (" + detail + ")" : ""}`); };
const api = async (p) => (await fetch(base + p, { cache: "no-store" })).json();
const until = async (probe, ms = 15000) => { for (const end = Date.now() + ms; Date.now() < end;) { const v = await probe(); if (v) return v; await sleep(200); } return null; };

// Browser
const profile = await fs.mkdtemp(path.join(ws, "qa-finalizacao/own-temp-sandbox-telas", "FreeMix-QA-TestBrowser-")), port = await freePort();
const edge = spawn("C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "--no-first-run", "--no-default-browser-check", "--disable-extensions", "--disable-sync", "--window-size=700,445", "about:blank"], { windowsHide: true, stdio: "ignore" });
let version = null; for (let i = 0; i < 100 && !version; i++) { try { version = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); } catch { await sleep(200); } }
const socket = new WebSocket(version.webSocketDebuggerUrl); await new Promise((r) => { socket.onopen = r; });
let id = 0; const pending = new Map(), problems = [];
socket.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d.result ?? d); pending.delete(d.id); } else if (d.method === "Runtime.exceptionThrown") problems.push(String(d.params.exceptionDetails?.exception?.description || d.params.exceptionDetails?.text).slice(0, 200)); };
const cdp = (method, params = {}, sessionId) => new Promise((resolve) => { const n = ++id; pending.set(n, resolve); socket.send(JSON.stringify({ id: n, method, params, ...(sessionId ? { sessionId } : {}) })); });
const { targetId } = await cdp("Target.createTarget", { url: "about:blank" }), { sessionId } = await cdp("Target.attachToTarget", { targetId, flatten: true });
for (const d of ["Page", "Runtime"]) await cdp(d + ".enable", {}, sessionId);
await cdp("Emulation.setDeviceMetricsOverride", { width: 700, height: 445, deviceScaleFactor: 1, mobile: false }, sessionId);
// confirm() dialogs are accepted so a test never hangs on one; closing the window is recorded instead of done.
await cdp("Page.addScriptToEvaluateOnNewDocument", { source: "window.confirm = () => true; window.close = () => { window.__closed = true; };" }, sessionId);
// A click that sends a command locks the window until the engine answers.
const idle = () => until(() => ev(`!document.querySelector("#save-close").disabled`), 60000);
const ev = async (expression) => { const r = await cdp("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }, sessionId); if (r.exceptionDetails) throw Error(r.exceptionDetails.exception?.description || "erro na página"); return r.result?.value; };
const click = (sel) => ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return "sem elemento"; if (e.disabled) return "desabilitado"; e.click(); return "ok"; })()`);
const type = (sel, value) => ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e || e.disabled) return "indisponível"; e.focus(); e.value = ${JSON.stringify(value)}; e.dispatchEvent(new Event("input", { bubbles: true })); e.dispatchEvent(new Event("change", { bubbles: true })); e.blur(); return "ok"; })()`);
const choose = (sel, text) => ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); const o = [...e.options].find((x) => x.textContent.includes(${JSON.stringify(text)})); if (!o || e.disabled) return "sem opção"; e.value = o.value; e.dispatchEvent(new Event("change", { bubbles: true })); return "ok"; })()`);
const text = (sel) => ev(`document.querySelector(${JSON.stringify(sel)})?.textContent ?? null`);
const shot = async (name) => { if (!shots) return; await fs.mkdir(shots, { recursive: true }); const b = Buffer.from((await cdp("Page.captureScreenshot", { format: "png" }, sessionId)).data, "base64"); await fs.writeFile(path.join(shots, name + ".png"), b); };

const portA = await freePort(), portB = await freePort(), sinkA = await startSink(portA), sinkB = await startSink(portB);
try {
  await cdp("Page.navigate", { url: base + "/transmitir" }, sessionId);
  check("a janela carrega com dados do motor", await until(() => ev(`document.querySelector("#encoder")?.options.length > 0`)) === true);
  const before = (await api("/api/settings")).settings;
  check("cinco destinos, o 1 selecionado", await ev(`[...document.querySelectorAll("#nums button")].map((b) => b.textContent + (b.classList.contains("vd-on") ? "*" : "")).join(" ")`) === "1* 2 3 4 5");
  check("o destino 1 mostra o codificador e o tamanho que o motor tem", await ev(`document.querySelector("#encoder").value`) === before.values.StreamEncoder && (await text("#quality option:checked")).includes(before.video.outputHeight + "p"), await text("#quality option:checked"));
  await shot("1-destino-1-parado");
  await click('#nums button[data-n="4"]');
  check("destino livre (5): sem URL, 'Começar 5' fica desabilitado", await text("#start-one") === "Começar 5" && await click("#start-one") === "desabilitado");

  // Destination 2: configure, start, status, stop.
  await click('#nums button[data-n="1"]');
  check("no destino 2 aparece 'Use Qualidade do Stream 1'", await ev(`!document.querySelector("#same-row").hidden`) === true);
  await type("#url", `rtmp://127.0.0.1:${portA}/live`); await type("#key", "chave-destino-2"); await choose("#quality", "720p 2,5mbps");
  check("alteração fica marcada como não salva", (await text("#msg")).includes("não salvas"), await text("#msg"));
  await click("#start-one");
  const live2 = await until(async () => { const d = (await api("/api/outputs")).outputs.destinations[0]; return d.active && sinkA.stats.published ? d : null; }, 25000);
  check("'Começar 2' salva e põe o destino 2 no ar de verdade", !!live2 && live2.server === `rtmp://127.0.0.1:${portA}/live` && live2.bitrate === 2500 && sinkA.stats.key === "chave-destino-2", live2 ? `motor: ativo, ${live2.width}x${live2.height} ${live2.bitrate} kbps; destino recebeu ${sinkA.stats.bytes} bytes` : "não entrou no ar: " + (await text("#msg")));
  await until(() => ev(`document.querySelector("#start-one").textContent === "Parar 2"`), 8000);
  check("o botão vira 'Parar 2' em vermelho e os campos travam", await text("#start-one") === "Parar 2" && await ev(`document.querySelector("#start-one").classList.contains("vd-air") && document.querySelector("#url").disabled && document.querySelector('#nums button[data-n="1"]').classList.contains("vd-live")`) === true);
  await click("#view-status"); await sleep(400);
  check("'Ver Status' mostra o destino 2 NO AR", (await ev(`document.querySelectorAll("#status-rows tr")[1].textContent`)).includes("NO AR"), await ev(`document.querySelectorAll("#status-rows tr")[1].textContent`));
  await shot("2-destino-2-no-ar-com-status");
  await click("#start-one");
  check("'Parar 2' tira o destino 2 do ar", !!(await until(async () => !(await api("/api/outputs")).outputs.destinations[0].active, 25000)) && !!(await until(() => ev(`document.querySelector("#start-one").textContent === "Começar 2"`), 8000)));
  await idle();

  // Destination 1: the main stream.
  await click('#nums button[data-n="0"]');
  await type("#url", `rtmp://127.0.0.1:${portB}/live`); await type("#key", "chave-principal"); await choose("#quality", "4mbps");
  if (await ev(`document.querySelector("#hardware").checked`)) await click("#hardware");
  check("desmarcar a GPU troca o codificador para x264", await ev(`document.querySelector("#encoder").value`) === "x264");
  await click("#start-one");
  const live1 = await until(async () => { const s = (await api("/api/json")); return s.streaming && sinkB.stats.published ? s : null; }, 30000);
  const after = (await api("/api/settings")).settings;
  check("'Começar 1' salva e põe a transmissão principal no ar de verdade", !!live1 && after.server === `rtmp://127.0.0.1:${portB}/live` && String(after.values.VBitrate) === "4000" && after.values.StreamEncoder === "x264" && sinkB.stats.key === "chave-principal", live1 ? `motor: transmitindo, ${after.values.VBitrate} kbps ${after.values.StreamEncoder}; destino recebeu ${sinkB.stats.bytes} bytes` : "não entrou no ar: " + (await text("#msg")));
  await until(() => ev(`document.querySelector("#start-one").textContent === "Parar 1"`), 8000);
  await sleep(1200); await shot("3-destino-1-no-ar");
  check("com o 1 no ar, 'Iniciar tudo' vira 'Parar tudo'", await text("#start-all") === "Parar tudo");
  await click("#start-all");
  check("'Parar tudo' para a transmissão principal", !!(await until(async () => !(await api("/api/json")).streaming, 30000)));
  await until(() => ev(`document.querySelector("#start-all").textContent === "Iniciar tudo" && !document.querySelector("#start-all").disabled`), 10000);
  await click("#start-all");
  const both = await until(async () => { const s = await api("/api/json"), d = (await api("/api/outputs")).outputs.destinations[0]; return s.streaming && d.active; }, 40000);
  check("'Iniciar tudo' põe no ar os dois destinos configurados", !!both, both ? "" : await text("#msg"));
  await until(() => ev(`document.querySelector("#start-all").textContent === "Parar tudo" && !document.querySelector("#start-all").disabled`), 10000);
  await click("#start-all");
  check("'Parar tudo' deixa tudo parado", !!(await until(async () => { const s = await api("/api/json"), d = (await api("/api/outputs")).outputs.destinations[0]; return !s.streaming && !d.active; }, 40000)));
  await idle();
  // A destination that does not answer: the window must say so in plain words and stay usable.
  await click('#nums button[data-n="0"]'); await type("#url", `rtmp://127.0.0.1:${await freePort()}/live`); await click("#start-one"); await idle();
  check("destino que não responde: aviso claro, nada no ar", /não entrou no ar/.test(await text("#msg")) && !(await api("/api/json")).streaming && await text("#start-one") === "Começar 1", await text("#msg"));
  await type("#url", `rtmp://127.0.0.1:${portB}/live`);
  // Freeing destination 2 and saving.
  await click('#nums button[data-n="1"]'); await type("#url", ""); await click("#save-close"); await idle();
  const closed = await until(() => ev(`window.__closed === true`), 5000);
  const freed = (await api("/api/outputs")).outputs.destinations[0], kept = (await api("/api/settings")).settings;
  check("'Salvar e Fechar' grava tudo (destino 2 liberado, destino 1 mantido) e fecha a janela", freed.server === "" && freed.enabled === false && freed.hasKey === false && kept.server === `rtmp://127.0.0.1:${portB}/live` && closed === true, `destino 2: "${freed.server}" ${freed.enabled ? "ligado" : "desligado"}${freed.hasKey ? ", chave ainda salva" : ", sem chave"}; destino 1: ${kept.server}; janela ${closed ? "fechada" : "aberta"}`);
  check("nenhum erro de script na página", problems.length === 0, problems.join(" | "));
} finally {
  // Leave nothing on air even if a check threw.
  for (const body of [{ action: "stream", active: false }, { action: "outputs_stop", index: 0 }]) await fetch(base + "/api/control", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => {});
  await cdp("Browser.close"); await sleep(500); sinkA.close?.(); sinkB.close?.();
  await fs.rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }).catch(() => {});
}
console.log(`\n${pass}/${total} verificações passaram`);
process.exit(pass === total ? 0 : 1);
