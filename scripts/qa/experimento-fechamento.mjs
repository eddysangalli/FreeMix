// Finds out which use of the program's windows makes its shutdown end badly. For each scenario: open an existing own
// test installation (never the operator's), do the scenario, ask the program to close, and read how the session ended
// (clean end with the leak count, or a crash report). Closing is always cooperative.
//   <pacote>/runtime/node.exe scripts/qa/experimento-fechamento.mjs --instalacao=<own test installation> [--only=a,b]
import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";

const ws = path.resolve(import.meta.dirname, "../.."), control = path.join(ws, "qa-finalizacao/sandbox-telas");
const args = Object.fromEntries(process.argv.slice(2).map((a) => { const m = /^--([a-z-]+)=(.*)$/.exec(a); assert(m); return [m[1], m[2]]; }));
const installed = path.resolve(args.instalacao), root = path.dirname(installed); assert(path.basename(root).startsWith("FreeMix-QA-"), "só em instalação de teste própria");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms)), exists = (p) => fs.access(p).then(() => true, () => false);
// The ports this installation was made with (only the ports are read).
if (!(await exists(path.join(root, "ensaio.json")))) {
  const wsPort = JSON.parse(await fs.readFile(path.join(installed, "config/obs-studio/plugin_config/obs-websocket/config.json"), "utf8")).server_port;
  const apiPort = Number(new URL(/"replayUrl"\s*:\s*"([^"]+)"/.exec(await fs.readFile(path.join(installed, "painel/local.js"), "utf8"))[1]).port);
  await fs.writeFile(path.join(root, "ensaio.json"), JSON.stringify({ apiPort, wsPort }));
}
const logs = path.join(installed, "config/obs-studio/logs"), crashes = path.join(installed, "config/obs-studio/crashes");
const list = async (dir) => (await fs.readdir(dir).catch(() => [])).sort();

const scenarios = {
  "nada": async () => {},
  "abre-e-fecha-pelo-pedido": async (s) => { await s.open("/gravar", "Configuração de gravação", 700, 300); await sleep(3000); await s.close("/gravar"); await sleep(3000); },
  "abre-e-deixa-aberta": async (s) => { await s.open("/gravar", "Configuração de gravação", 700, 300); await sleep(3000); },
  "quatro-abre-fecha-em-seguida": async (s) => { for (const [r, t, w, h] of [["/transmitir", "Configurações de streaming", 700, 445], ["/gravar", "Configuração de gravação", 700, 300], ["/externo", "Saídas externas", 700, 540], ["/multicorder", "MultiGravação", 700, 540]]) { await s.open(r, t, w, h); await sleep(1500); for (let i = 0; i < 6 && !(await s.close(r)); i++) await sleep(500); } await sleep(3000); },
  "abre-e-fecha-na-hora": async (s) => { await s.open("/gravar", "Configuração de gravação", 700, 300); await sleep(150); for (let i = 0; i < 6 && !(await s.close("/gravar")); i++) await sleep(300); await sleep(4000); },
  "abre-e-fecha-na-hora-espera-20s": async (s) => { await s.open("/gravar", "Configuração de gravação", 700, 300); await sleep(150); for (let i = 0; i < 6 && !(await s.close("/gravar")); i++) await sleep(300); await sleep(20000); },
  "abre-e-fecha-apos-700ms": async (s) => { await s.open("/gravar", "Configuração de gravação", 700, 300); await sleep(700); for (let i = 0; i < 6 && !(await s.close("/gravar")); i++) await sleep(300); await sleep(4000); },
  // The real path: the mesa that lives in the program's dock clicks its own cog, the window opens, and the window's own button closes it.
  "mesa-de-dentro-abre-e-botao-fecha": async (s) => { const mesa = await s.inside.waitFor((x) => /painel\/mesa\.html/.test(x.url)); if (!mesa) throw Error("a mesa de dentro do programa não apareceu na depuração"); for (const [id, route, button] of [["recset", "/gravar", "#cancel"], ["streamset", "/transmitir", "#save-close"], ["ext", "/externo", "#save-close"], ["iso", "/multicorder", "#save-close"]]) { const clicked = await s.inside.evalIn(mesa, `(() => { const b = document.querySelector('[data-a="pop"][data-v="${id}"]'); if (!b) return "sem botão"; b.click(); return "ok"; })()`); const page = await s.inside.waitFor((x) => x.url.endsWith(route), 15000); if (clicked !== "ok" || !page) throw Error(`${id}: clique ${clicked}; janela ${page ? "abriu" : "não abriu"}`); await sleep(2500); await s.inside.evalIn(page, `document.querySelector(${JSON.stringify(button)}).click()`); for (const end = Date.now() + 10000; Date.now() < end && (await s.inside.targets()).some((x) => x.url.endsWith(route));) await sleep(300); if ((await s.inside.targets()).some((x) => x.url.endsWith(route))) throw Error(`${id}: o botão não fechou a janela`); await sleep(800); } await sleep(2500); },
  "tela-cheia-aberta": async (s) => { await s.command({ action: "settings_projector", mix: "PREVIEW" }); await sleep(3000); },
};
// "roteiro:<nome>" runs one of the click tests (scripts/qa/test-<nome>.mjs) as the scenario.
const runTest = (test) => async () => { const r = spawn(process.execPath, [path.join(import.meta.dirname, "test-" + test + ".mjs")], { cwd: ws, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] }); let o = ""; r.stdout.on("data", (d) => { o += d; }); r.stderr.on("data", (d) => { o += d; }); await new Promise((done) => r.on("exit", done)); const last = o.trim().split("\n").pop(); if (!/(\d+)\/\1 verifica/.test(last)) throw Error(last.slice(0, 160)); await sleep(2000); };
const only = args.only ? args.only.split(",") : Object.keys(scenarios), results = [];
for (const name of only) if (name.startsWith("roteiro:")) scenarios[name] = runTest(name.slice(8));
for (const name of only) {
  const logsBefore = await list(logs), crashesBefore = await list(crashes);
  const debugPort = 9300 + Math.floor(Math.random() * 400);
  const child = spawn(process.execPath, [path.join(import.meta.dirname, "sandbox-telas.mjs"), "--instalacao=" + installed, "--depurar=" + debugPort], { cwd: ws, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
  let out = "", exited = null; child.stdout.on("data", (d) => { out += d; }); child.stderr.on("data", (d) => { out += d; }); child.on("exit", (code) => { exited = code; });
  for (const end = Date.now() + 120000; Date.now() < end && !out.includes("SANDBOX_READY") && exited === null;) await sleep(300);
  if (!out.includes("SANDBOX_READY")) { results.push({ name, error: "não abriu: " + out.trim().split("\n").pop() }); continue; }
  const sandbox = JSON.parse(await fs.readFile(path.join(control, "sandbox.json"), "utf8")), base = sandbox.base;
  const { connect } = await import(pathToFileURL(path.join(installed, "ferramentas/obsws.mjs"))), obs = await connect({ root: installed });
  const s = {
    open: async (route, title, width, height) => (await obs.req("CallVendorRequest", { vendorName: "freemix", requestType: "open_panel", requestData: { url: base + route, title, width, height } })).responseData.success,
    close: async (route) => (await obs.req("CallVendorRequest", { vendorName: "freemix", requestType: "close_panel", requestData: { url: base + route } })).responseData.success === true,
    command: async (body) => (await fetch(base + "/api/control", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })).json(),
  };
  // Pages that live inside the program (the mesa dock, the windows it opens), driven through the program's own browser.
  const targets = async () => (await fetch(`http://127.0.0.1:${debugPort}/json`).then((r) => r.json()).catch(() => [])).filter((x) => x.type === "page");
  const evalIn = async (target, expression) => { const w = new WebSocket(target.webSocketDebuggerUrl); await new Promise((ok, no) => { w.onopen = ok; w.onerror = no; }); const answer = await new Promise((done) => { w.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id === 1) done(d.result?.result?.value); }; w.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression, returnByValue: true, awaitPromise: true } })); }); w.close(); return answer; };
  s.inside = { targets, evalIn, waitFor: async (test, ms = 20000) => { for (const end = Date.now() + ms; Date.now() < end;) { const found = (await targets()).find(test); if (found) return found; await sleep(300); } return null; } };
  await sleep(2500); let scenarioError = null;
  try { await scenarios[name](s); } catch (e) { scenarioError = e.message; }
  obs.close?.();
  const asked = Date.now(); await fs.writeFile(path.join(control, "fechar"), "x");
  for (const end = Date.now() + 150000; Date.now() < end && exited === null;) await sleep(300);
  await sleep(1500);
  const newLog = (await list(logs)).filter((f) => !logsBefore.includes(f)).pop(), newCrashes = (await list(crashes)).filter((f) => !crashesBefore.includes(f));
  const tail = newLog ? (await fs.readFile(path.join(logs, newLog), "utf8")).trim().split(/\r?\n/).slice(-3) : [];
  const leaks = /Number of memory leaks: (\d+)/.exec(tail.join("\n"))?.[1];
  let crashWhere = null; if (newCrashes.length) { const text = await fs.readFile(path.join(crashes, newCrashes[0]), "utf8"); crashWhere = (/Unhandled exception: (\w+)/.exec(text)?.[1] || "?") + " em " + (/Fault address: \w+ \(.*\\([^\\)]+)\)/.exec(text)?.[1] || "?") + " · " + (/Thread \w+: ([^\r\n]*\(Crashed\))/.exec(text)?.[1] || ""); }
  const item = { name, scenarioError, wrapperExit: exited, secondsToClose: Math.round((Date.now() - asked) / 1000), cleanEnd: leaks !== undefined, leaks: leaks ?? null, crash: crashWhere };
  results.push(item); console.log(JSON.stringify(item));
  if (exited === null) { console.log("o programa de teste ainda não fechou; parando os experimentos sem forçar nada"); break; }
}
await fs.writeFile(path.join(ws, "qa-finalizacao", "experimento-fechamento-" + new Date().toISOString().replace(/\D/g, "").slice(0, 14) + ".json"), JSON.stringify({ installed, results }, null, 2) + "\n");
