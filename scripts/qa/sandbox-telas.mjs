// Sandbox for working on the screens with a real program behind them.
// Installs an own test copy (never the operator's), overlays the frozen engine build and the current tools, opens the
// program minimised and its API, and serves the panel straight from FreeMix/painel: edit a file there, reload the page.
//
//   <pacote>/runtime/node.exe scripts/qa/sandbox-telas.mjs [--freeze=<native-build-frozen-*.json>]
//
// Prints SANDBOX_READY with the address. To close: create the file "fechar" in the folder it prints (or run with
// --fechar). Closing is cooperative: the API is asked to stop and the program is asked to shut down; nothing is killed.
import fs from "node:fs/promises";
import path from "node:path";
import net from "node:net";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";

const ws = path.resolve(import.meta.dirname, "../.."), qa = path.join(ws, "qa-finalizacao"), control = path.join(qa, "sandbox-telas");
const args = Object.fromEntries(process.argv.slice(2).map((a) => { const m = /^--([a-z-]+)(?:=(.*))?$/.exec(a); assert(m, "argumento inválido: " + a); return [m[1], m[2] ?? true]; }));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms)), exists = (p) => fs.access(p).then(() => true, () => false);
await fs.mkdir(control, { recursive: true });
if (args.fechar) { await fs.writeFile(path.join(control, "fechar"), new Date().toISOString()); console.log("pedido de fechamento gravado"); process.exit(0); }
if (await exists(path.join(control, "sandbox.json"))) { console.error("já existe um sandbox aberto (" + path.join(control, "sandbox.json") + "); feche-o primeiro com --fechar"); process.exit(1); }
await fs.rm(path.join(control, "fechar"), { force: true });

const packageRoot = path.join(ws, "entregas/FreeMix-Completo-0.1.0-local.20261010060000"), product = path.join(ws, "FreeMix");
const freezePath = path.resolve(args.freeze || path.join(qa, "native-build-frozen-d5cc34d-configured.json")), frozen = JSON.parse(await fs.readFile(freezePath, "utf8"));
assert.equal(path.resolve(process.execPath), path.join(packageRoot, "runtime/node.exe"), "rode com o runtime/node.exe do pacote");

// Own TEMP, own root with the ownership marker the installer and the tools expect.
const temp = path.join(qa, "own-temp-sandbox-telas"); await fs.mkdir(temp, { recursive: true }); process.env.TEMP = process.env.TMP = temp;
const { newQaRoot, assertOwnedQa } = await import(pathToFileURL(path.join(qa, "native36-real-app-r4e-preparation-20261011/candidate-context.mjs")));
const freePort = async () => { const s = net.createServer(); await new Promise((r) => s.listen(0, "127.0.0.1", r)); const n = s.address().port; await new Promise((r) => s.close(r)); return n; };
// --instalacao=<pasta>: use an existing own test installation exactly as it is (for example one that has just
// received an update in a rehearsal): nothing is installed or overlaid, and the panel is served from that folder.
const existing = typeof args.instalacao === "string" ? path.resolve(args.instalacao) : null;
const root = existing ? path.dirname(existing) : await newQaRoot("Sandbox"), installed = existing || path.join(root, "FreeMix-QA-Sandbox Telas"); await assertOwnedQa(root, installed);
const ports = existing ? JSON.parse(await fs.readFile(path.join(root, "ensaio.json"), "utf8")) : { apiPort: await freePort(), wsPort: await freePort() };
const { apiPort, wsPort } = ports;
const live = !!args["ao-vivo"];   // with --instalacao: reuse that own installation, but with the current tools and the panel served live from the repository
const overlay = async (folder) => { if (existing && !live) return; for (const e of await fs.readdir(path.join(product, folder), { withFileTypes: true, recursive: true })) { if (!e.isFile()) continue; const from = path.join(e.parentPath, e.name), rel = path.relative(product, from); if (rel.replaceAll("\\", "/") === "painel/local.js") continue; await fs.mkdir(path.dirname(path.join(installed, rel)), { recursive: true }); await fs.copyFile(from, path.join(installed, rel)); } };
if (existing) { console.log("usando a instalação de teste existente " + installed + (live ? " com as ferramentas e o painel atuais" : "")); if (live) { await overlay("ferramentas"); await overlay("painel"); } }
else {
  console.log("instalando cópia de teste em " + installed);
  const { installPortable } = await import(pathToFileURL(path.join(packageRoot, "ferramentas/instalar-portatil.mjs")));
  await installPortable(packageRoot, installed, { apiPort, wsPort });
  for (const f of frozen.files) await fs.copyFile(path.join(frozen.root, f.path), path.join(installed, f.path));
  // Current tools and panel from the repository's working tree (the panel is also served live from there).
  await overlay("ferramentas"); await overlay("painel");
  console.log(`motor ${frozen.head.slice(0, 7)} (${frozen.files.length} arquivos) e ferramentas atuais aplicados`);
}

const nativeEnv = { ...process.env };
const { prepareNdiRuntime } = await import(pathToFileURL(path.join(installed, "ferramentas/ndi-runtime.mjs")));
await prepareNdiRuntime(installed, { env: nativeEnv, requirePinned: true, writeReceipt: true });
const exe = path.join(installed, "bin/64bit/FreeMix.exe");
// --depurar=<porta>: lets a test drive the pages inside the program itself (its docks and windows), not a copy in an outside browser.
const native = spawn(exe, ["--portable", "--multi", "--disable-updater", "--disable-missing-files-check", ...(args.visivel ? [] : ["--minimize-to-tray"]), ...(args.depurar ? ["--remote-debugging-port=" + Number(args.depurar)] : [])], { cwd: path.dirname(exe), windowsHide: true, stdio: "ignore", env: nativeEnv });
let nativeExited = false; native.on("exit", () => { nativeExited = true; });
const { connect } = await import(pathToFileURL(path.join(installed, "ferramentas/obsws.mjs")));
let obs = null;
for (const end = Date.now() + 120000; Date.now() < end && !obs && !nativeExited;) { try { obs = await connect({ root: installed }); const v = (await obs.req("CallVendorRequest", { vendorName: "freemix", requestType: "get_interface", requestData: {} })).responseData; assert.equal(v.pid, native.pid); } catch { obs?.close?.(); obs = null; await sleep(500); } }
assert(obs, "o programa de teste não ficou pronto em 120 s");

let api, apiExited = false;
const startApi = () => { apiExited = false; api = spawn(process.execPath, [path.join(import.meta.dirname, "sandbox-api.mjs")], { cwd: installed, windowsHide: true, env: { ...process.env, FREEMIX_ROOT: installed, FREEMIX_PANEL_DIR: path.join(existing && !live ? existing : product, "painel"), FREEMIX_API_PORT: String(apiPort), FREEMIX_API_HOST: "127.0.0.1", FREEMIX_QA_OWN_ONLY: "YES", FREEMIX_QA_OWNER_ROOT: root }, stdio: ["ignore", "ignore", "inherit", "ipc"] }); api.on("exit", () => { apiExited = true; }); };
const stopApi = async () => { if (!api || apiExited) return; api.send({ kind: "close" }); for (const end = Date.now() + 40000; Date.now() < end && !apiExited;) await sleep(100); assert(apiExited, "a API de teste não encerrou em 40 s"); };
startApi();
const base = "http://127.0.0.1:" + apiPort;
for (const end = Date.now() + 120000; Date.now() < end;) { try { const h = await (await fetch(base + "/api/health")).json(); if (h.connected) break; } catch {} await sleep(500); }
await fs.writeFile(path.join(control, "sandbox.json"), JSON.stringify({ base, apiPort, wsPort, nativePid: native.pid, apiPid: api.pid, root, installed, nativeHead: frozen.head, debugPort: args.depurar ? Number(args.depurar) : null, startedAt: new Date().toISOString(), painelAoVivo: path.join(existing && !live ? existing : product, "painel") }, null, 2));
console.log("SANDBOX_READY " + base + "  (controle: " + control + ")");

// "reiniciar-api" re-copies the tools and restarts only the API (after a change in FreeMix/ferramentas); "fechar" ends.
for (;;) {
  await sleep(500);
  if (nativeExited) { console.log("o programa de teste foi fechado por fora"); break; }
  if (await exists(path.join(control, "reiniciar-api"))) { await fs.rm(path.join(control, "reiniciar-api"), { force: true }); await stopApi(); await overlay("ferramentas"); startApi(); for (const end = Date.now() + 60000; Date.now() < end;) { try { if ((await (await fetch(base + "/api/health")).json()).connected) break; } catch {} await sleep(300); } console.log("API reiniciada com as ferramentas atuais"); }
  if (await exists(path.join(control, "fechar"))) break;
}
await stopApi();
if (!nativeExited) { await obs.req("CallVendorRequest", { vendorName: "freemix", requestType: "shutdown_idle", requestData: { qaClose: true } }).catch(() => {}); for (const end = Date.now() + 40000; Date.now() < end && !nativeExited;) await sleep(100); }
obs?.close?.();
await fs.rm(path.join(control, "sandbox.json"), { force: true }); await fs.rm(path.join(control, "fechar"), { force: true });
console.log(nativeExited ? "sandbox fechado" : "ATENÇÃO: o programa de teste não fechou em 40 s (pid " + native.pid + "); nada foi forçado");
process.exit(nativeExited ? 0 : 1);
