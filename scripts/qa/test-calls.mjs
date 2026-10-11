// Real click test of the Calls window (/calls) against the screens sandbox.
// Opens the window in a real browser (Edge, no window), clicks its buttons with real mouse input, and confirms each
// effect in the engine. Two things are deliberately NOT executed, only checked as the command the window sends:
//   - "Preparar retornos" / "Parar retornos": for real they publish a return feed through an internet service;
//   - the clipboard: the copied text is captured inside the page so the computer's clipboard is never touched.
//   node scripts/qa/test-calls.mjs [pasta-para-retratos]
// Needs the sandbox open (scripts/qa/sandbox-telas.mjs). Removes the calls it created.
import fs from "node:fs/promises";
import path from "node:path";
import net from "node:net";
import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";

const ws = path.resolve(import.meta.dirname, "../.."), control = path.join(ws, "qa-finalizacao/sandbox-telas"), shots = process.argv[2] ? path.resolve(process.argv[2]) : null;
const sandbox = JSON.parse(await fs.readFile(path.join(control, "sandbox.json"), "utf8")), base = sandbox.base;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const freePort = async () => { const s = net.createServer(); await new Promise((r) => s.listen(0, "127.0.0.1", r)); const n = s.address().port; await new Promise((r) => s.close(r)); return n; };
let pass = 0, total = 0;
const check = (name, ok, detail = "") => { total++; if (ok) pass++; console.log(`${ok ? "OK   " : "FALHA"} ${name}${detail !== "" ? "  (" + detail + ")" : ""}`); };
const api = async (p) => (await fetch(base + p, { cache: "no-store" })).json();
const until = async (probe, ms = 15000) => { for (const end = Date.now() + ms; Date.now() < end;) { const v = await probe(); if (v) return v; await sleep(200); } return null; };
const engineCalls = async () => (await api("/api/json")).calls || {};

// Browser
const W = 700, H = 540;
const profile = await fs.mkdtemp(path.join(ws, "qa-finalizacao/own-temp-sandbox-telas", "FreeMix-QA-TestBrowser-")), port = await freePort();
const edge = spawn("C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "--no-first-run", "--no-default-browser-check", "--disable-extensions", "--disable-sync", `--window-size=${W},${H}`, "about:blank"], { windowsHide: true, stdio: "ignore" });
let version = null; for (let i = 0; i < 100 && !version; i++) { try { version = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); } catch { await sleep(200); } }
const socket = new WebSocket(version.webSocketDebuggerUrl); await new Promise((r) => { socket.onopen = r; });
let id = 0; const pending = new Map(), problems = [], held = [];   // held = commands answered here instead of by the engine
const cdp = (method, params = {}, sessionId) => new Promise((resolve) => { const n = ++id; pending.set(n, resolve); socket.send(JSON.stringify({ id: n, method, params, ...(sessionId ? { sessionId } : {}) })); });
socket.onmessage = (m) => {
  const d = JSON.parse(m.data);
  if (d.id && pending.has(d.id)) { pending.get(d.id)(d.result ?? d); pending.delete(d.id); }
  else if (d.method === "Runtime.exceptionThrown") problems.push(String(d.params.exceptionDetails?.exception?.description || d.params.exceptionDetails?.text).slice(0, 200));
  else if (d.method === "Fetch.requestPaused") {
    let body = {}; try { body = JSON.parse(d.params.request.postData || "{}"); } catch { /* not a command */ }
    if (["call_returns_prepare", "call_returns_stop"].includes(body.action)) { held.push(body.action); cdp("Fetch.fulfillRequest", { requestId: d.params.requestId, responseCode: 200, responseHeaders: [{ name: "Content-Type", value: "application/json" }], body: Buffer.from(JSON.stringify({ success: true })).toString("base64") }, d.sessionId); }
    else cdp("Fetch.continueRequest", { requestId: d.params.requestId }, d.sessionId);
  }
};
const { targetId } = await cdp("Target.createTarget", { url: "about:blank" }), { sessionId } = await cdp("Target.attachToTarget", { targetId, flatten: true });
for (const d of ["Page", "Runtime"]) await cdp(d + ".enable", {}, sessionId);
await cdp("Fetch.enable", { patterns: [{ urlPattern: "*/api/control", requestStage: "Request" }] }, sessionId);
await cdp("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 1, mobile: false }, sessionId);
await cdp("Page.addScriptToEvaluateOnNewDocument", { source: "window.confirm = () => true; window.close = () => { window.__closed = true; }; Object.defineProperty(navigator, 'clipboard', { value: { writeText: async (t) => { window.__copied = t; } } });" }, sessionId);
const ev = async (expression) => { const r = await cdp("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }, sessionId); if (r.exceptionDetails) throw Error(r.exceptionDetails.exception?.description || "erro na página"); return r.result?.value; };
const idle = () => until(() => ev(`!document.querySelector("#save-close").disabled`), 60000);
// A real mouse press/release at the middle of the element, as the operator would do.
const spot = (sel) => ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; e.scrollIntoView({ block: "center" }); const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, disabled: !!e.disabled }; })()`);
const mouse = (type, p) => cdp("Input.dispatchMouseEvent", { type, x: p.x, y: p.y, button: "left", buttons: type === "mousePressed" ? 1 : 0, clickCount: 1 }, sessionId);
const click = async (sel) => { const p = await spot(sel); if (!p) return "sem elemento"; if (p.disabled) return "desabilitado"; await mouse("mousePressed", p); await mouse("mouseReleased", p); return "ok"; };
const type = (sel, value) => ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e || e.disabled || e.readOnly) return "indisponível"; e.focus(); e.value = ${JSON.stringify(value)}; e.dispatchEvent(new Event("input", { bubbles: true })); e.dispatchEvent(new Event("change", { bubbles: true })); e.blur(); return "ok"; })()`);
const choose = (sel, textOrValue) => ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); const o = [...e.options].find((x) => x.value === ${JSON.stringify(textOrValue)} || x.textContent.includes(${JSON.stringify(textOrValue)})); if (!o || e.disabled) return "sem opção"; e.value = o.value; e.dispatchEvent(new Event("change", { bubbles: true })); return "ok"; })()`);
const text = (sel) => ev(`document.querySelector(${JSON.stringify(sel)})?.textContent ?? null`);
const value = (sel) => ev(`document.querySelector(${JSON.stringify(sel)})?.value ?? null`);
const shot = async (name) => { if (!shots) return; await fs.mkdir(shots, { recursive: true }); const b = Buffer.from((await cdp("Page.captureScreenshot", { format: "png" }, sessionId)).data, "base64"); await fs.writeFile(path.join(shots, name + ".png"), b); };

const stamp = Date.now().toString(36).slice(-4).toUpperCase(), nameA = "Convidado Ana " + stamp, nameB = "Convidado Bia " + stamp, made = [];
try {
  const start = (await engineCalls()).guests || [], n0 = start.length;
  if (n0 > 6) throw Error("o sandbox já tem " + n0 + " chamadas; feche e abra outro");
  await cdp("Page.navigate", { url: base + "/calls" }, sessionId);
  check("a janela carrega e conversa com o programa", await until(() => ev(`document.querySelector("#rows")?.children.length > 0 && !document.querySelector("#name").disabled`)) === true);
  const numbers = () => ev(`[...document.querySelectorAll("#nums button")].map((b) => b.textContent + (b.classList.contains("vd-on") ? "*" : "") + (b.disabled ? "-" : "")).join(" ")`);
  if (n0 === 0) {
    check("sem chamadas: só o 1 fica disponível, pronto para hospedar", await numbers() === "+* 2- 3- 4- 5- 6- 7- 8-" && (await text("#rows")).includes("Nenhuma chamada") && (await text("#msg")).includes("Hospedar chamada"), await numbers());
    check("sem chamada escolhida, Copiar Link e Redefinir Senha ficam desabilitados", await click("#copy") === "desabilitado" && await click("#reset") === "desabilitado");
    await shot("1-sem-chamadas");
  } else await click(`#nums button[data-n="${n0}"]`);

  // Host a call
  await type("#name", nameA); await click("#host"); await idle();
  const a = await until(async () => (await engineCalls()).guests?.find((g) => g.name === nameA + " (fonte)"), 10000); if (a) made.push(nameA);
  const state1 = await api("/api/json");
  check("'Hospedar chamada' cria a entrada na mesa com a chamada dentro", !!a && state1.inputs.some((i) => i.name === nameA) && /^fm[0-9a-f]{12}$/.test(a.id), a ? `entrada "${nameA}", senha de ${a.id.length} caracteres` : await text("#msg"));
  check("a chamada nova fica selecionada, com o botão verde e a senha à mostra", await ev(`document.querySelector('#nums button[data-n="${n0}"]').classList.contains("vd-on") && document.querySelector("#host").classList.contains("vd-on")`) === true && await value("#password") === a?.id && await value("#name") === nameA, `senha na tela ${await value("#password") === a?.id ? "igual" : "diferente"} da do programa`);
  check("o link já nasce definitivo (não muda quando os retornos são preparados)", !!a?.returnStream && a.guest.includes("push=" + a.id) && a.guest.includes("view=" + a.returnStream) && await text("#link") === a.guest);
  await click("#copy"); await idle();
  check("'Copiar Link' copia o link do convidado", await ev(`window.__copied`) === a?.guest && (await text("#msg")).includes("Link copiado"), await text("#msg"));
  await shot("2-chamada-hospedada");

  // Second call, so that there is another entry to send back and another guest to talk to
  await click(`#nums button[data-n="${n0 + 1}"]`);
  check("o próximo número livre abre uma chamada nova em branco", await value("#name") === "" && await value("#password") === "" && await ev(`!document.querySelector("#host").classList.contains("vd-on")`) === true);
  await type("#name", nameB); await click("#host"); await idle();
  const b = await until(async () => (await engineCalls()).guests?.find((g) => g.name === nameB + " (fonte)"), 10000); if (b) made.push(nameB);
  check("segunda chamada criada; o próximo livre aparece como +", !!b && b.id !== a?.id && (await numbers()).split(" ")[n0 + 2] === "+", await numbers());
  await click("#host");
  check("clicar em 'Hospedar chamada' numa chamada que já existe não cria outra", (await engineCalls()).guests.length === n0 + 2 && (await text("#msg")).includes("já está hospedada"), await text("#msg"));

  // Reset password
  await click(`#nums button[data-n="${n0}"]`); await click("#reset"); await idle();
  const a2 = (await engineCalls()).guests.find((g) => g.key === a.key);
  check("'Redefinir Senha' troca a senha e o endereço do retorno: o link antigo deixa de valer", !!a2 && a2.id !== a.id && a2.returnStream !== a.returnStream && /^fm[0-9a-f]{12}$/.test(a2.id) && await value("#password") === a2.id && await text("#link") === a2.guest, a2 ? "senha nova na tela e no programa" : "");

  // Return feed
  const entryB = (await api("/api/json")).inputs.find((i) => i.name === nameB);
  await choose("#video", nameB); await choose("#audio", "silent");
  check("mudar o retorno marca 'não aplicado' e acende o Aplicar", (await text("#msg")).includes("Aplicar") && await ev(`document.querySelector("#apply").classList.contains("vd-warn")`) === true && (await ev(`document.querySelectorAll("#rows tr")[${n0}].textContent`)).includes("não aplicado") && !(await engineCalls()).guests.find((g) => g.key === a.key).route?.video?.includes(entryB.key), await text("#msg"));
  await click("#apply"); await idle();
  const routeA = (await engineCalls()).guests.find((g) => g.key === a.key).route;
  check("'Aplicar' grava no programa o que o convidado vê e ouve", routeA?.video === entryB.key && routeA?.audio === "silent" && await ev(`document.querySelector("#apply").disabled`) === true, `vê "${nameB}", ouve somente talkback`);
  check("o Gerenciador mostra o que foi salvo", (await ev(`document.querySelectorAll("#rows tr")[${n0}].textContent`)).includes(nameB) && (await ev(`document.querySelectorAll("#rows tr")[${n0}].textContent`)).includes("Somente talkback"), await ev(`document.querySelectorAll("#rows tr")[${n0}].textContent`));
  check("a lista de vídeo não oferece a própria chamada do convidado", await ev(`![...document.querySelector("#video").options].some((o) => o.textContent === ${JSON.stringify(nameA)})`) === true);
  await choose("#audio", "custom");
  const offered = await ev(`[...document.querySelectorAll("#sources input")].length`);
  check("'Escolher fontes de áudio' abre a lista de fontes da mesa", await ev(`!document.querySelector("#custom-row").hidden`) === true, offered + " fonte(s) oferecida(s)");
  if (offered > 0) { await click("#sources input"); await click("#apply"); await idle(); const r = (await engineCalls()).guests.find((g) => g.key === a.key).route; check("fonte de áudio escolhida é gravada no programa", r?.audio === "custom" && r.audioSources.length === 1, r?.audioSources.length + " fonte"); }
  await choose("#audio", "program"); await click("#apply"); await idle();
  await shot("3-retorno-do-convidado");

  // Guests hear each other
  const before = (await engineCalls()).conference;
  await click("#conference"); await idle();
  check("'Convidados ouvem uns aos outros' liga e desliga no programa", (await engineCalls()).conference === !before, `antes ${before ? "ligado" : "desligado"}, depois ${before ? "desligado" : "ligado"}`);
  await click("#conference"); await idle();

  // Advanced options
  await click("#show-advanced");
  check("'Mostrar opções avançadas' abre nível, microfone, talkback e rede", await ev(`!document.querySelector("#advanced").hidden`) === true);
  await choose("#talk-mode", "selected"); await idle();
  const t1 = (await engineCalls()).rapidTargets;
  check("'Talkback para: somente os marcados' grava os convidados marcados", Array.isArray(t1) && t1.includes(a.key) && t1.includes(b.key));
  await click(`#targets input[value="${b.key}"]`); await idle();
  const t2 = (await engineCalls()).rapidTargets;
  check("desmarcar um convidado tira só ele do talkback", Array.isArray(t2) && t2.includes(a.key) && !t2.includes(b.key), `${t2?.length} convidado(s) marcados`);
  await choose("#talk-mode", "all"); await idle();
  check("'Todos os convidados' volta ao padrão", (await engineCalls()).rapidTargets === null);
  await type("#gain", "80");
  check("mudar o nível do retorno fica pendente até aplicar", await ev(`!document.querySelector("#apply").disabled`) === true);
  await shot("4-opcoes-avancadas");

  // Talkback without a director microphone: the button explains instead of doing nothing
  const p = await spot("#talk"); await mouse("mousePressed", p); await sleep(300); await mouse("mouseReleased", p);
  const director = (await engineCalls()).director;
  check("'Segure para falar' sem microfone do diretor explica o que falta e não abre nada", director ? true : (await text("#msg")).includes("microfone do diretor") && (await engineCalls()).talking === false, director ? "já havia microfone: verificação não se aplica" : await text("#msg"));

  // Prepare returns: pending changes are applied first; the command itself is only checked (see the header)
  await click("#returns"); await idle();
  const gainA = (await engineCalls()).guests.find((g) => g.key === a.key).route?.gain;
  check("'Preparar retornos' aplica antes o que estava pendente e envia o comando certo", gainA === 0.8 && held.join() === "call_returns_prepare", `nível gravado ${gainA}; comando ${held.join() || "nenhum"} (conferido, não executado)`);

  // Call manager and closing
  await click("#manager");
  check("'Gerenciador de chamadas' esconde e mostra a lista", await ev(`document.querySelector("#status").hidden`) === true && await click("#manager") === "ok" && await ev(`!document.querySelector("#status").hidden`) === true);
  await click(`#rows tr[data-i="${n0 + 1}"]`);
  check("clicar numa linha do Gerenciador seleciona aquela chamada", await value("#name") === nameB && await ev(`document.querySelector('#nums button[data-n="${n0 + 1}"]').classList.contains("vd-on")`) === true);
  await choose("#audio", "silent"); await click("#save-close"); await idle();
  const closed = await until(() => ev(`window.__closed === true`), 5000), routeB = (await engineCalls()).guests.find((g) => g.key === b.key).route;
  check("'Salvar e Fechar' grava o que estava pendente e fecha a janela", routeB?.audio === "silent" && closed === true, `retorno de "${nameB}": ${routeB?.audio}; janela ${closed ? "fechada" : "aberta"}`);
  check("nenhum erro de script na página", problems.length === 0, problems.join(" | "));
} finally {
  // Remove what this test created (own sandbox only) and restore the talkback default.
  await fetch(base + "/api/control", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "call_rapid_targets", targets: null }) }).catch(() => {});
  try {
    const { connect } = await import(pathToFileURL(path.join(sandbox.installed, "ferramentas/obsws.mjs"))), obs = await connect({ root: sandbox.installed });
    for (const name of made) { await obs.req("RemoveInput", { inputName: name + " (fonte)" }).catch(() => {}); await obs.req("RemoveScene", { sceneName: name }).catch(() => {}); }
    obs.close?.();
  } catch (e) { console.log("limpeza: " + e.message); }
  await cdp("Browser.close"); await sleep(500);
  await fs.rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }).catch(() => {});
}
console.log(`\n${pass}/${total} verificações passaram`);
process.exit(pass === total ? 0 : 1);
