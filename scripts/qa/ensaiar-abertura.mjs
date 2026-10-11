// Rehearses the owner's real way of opening the mesa, on a rehearsal copy that has just received an update: the same
// start-up tool the launcher runs (ferramentas/iniciar-freemix.mjs of that installation), then the checks the launcher
// relies on, then a cooperative close. Never on the operator's mesa.
//   <pacote>/runtime/node.exe scripts/qa/ensaiar-abertura.mjs --ensaio=qa-finalizacao/ensaio-atualizacao-<versão>.json
import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import { spawnSync, execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const ws = path.resolve(import.meta.dirname, "../.."), qa = path.join(ws, "qa-finalizacao");
const args = Object.fromEntries(process.argv.slice(2).map((a) => { const m = /^--([a-z-]+)=(.*)$/.exec(a); assert(m); return [m[1], m[2]]; }));
const rehearsal = JSON.parse(await fs.readFile(path.resolve(args.ensaio), "utf8")), installed = rehearsal.installed, root = path.dirname(installed);
assert.equal(rehearsal.status, "UPDATE_APPLIED_ON_REHEARSAL_COPY"); assert(path.basename(root).startsWith("FreeMix-QA-"), "só em cópia de ensaio");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms)), alive = (pid) => { try { process.kill(pid, 0); return true; } catch { return false; } };
const logs = path.join(installed, "config/obs-studio/logs"), crashes = path.join(installed, "config/obs-studio/crashes"), list = async (d) => (await fs.readdir(d).catch(() => [])).sort();
const logsBefore = await list(logs), crashesBefore = await list(crashes);

const started = spawnSync(path.join(installed, "runtime/node.exe"), [path.join(installed, "ferramentas/iniciar-freemix.mjs"), "--minimized"], { encoding: "utf8", windowsHide: true, timeout: 110000, env: { ...process.env, FREEMIX_ROOT: installed } });
let info = null; try { info = JSON.parse(started.stdout.trim().split("\n").pop()); } catch { /* reported below */ }
const checks = { launcherSaysReady: started.status === 0 && info?.success === true && info.ready === true }, detail = { launcherOutput: (started.stdout + started.stderr).trim().split("\n").slice(-2).map((s) => s.slice(0, 300)) };
if (checks.launcherSaysReady) {
  const base = "http://127.0.0.1:" + info.apiPort, get = async (p) => { try { return await fetch(base + p, { signal: AbortSignal.timeout(8000) }); } catch { return { status: 0, json: async () => ({}) }; } };
  const health = await (await get("/api/health")).json(), state = await (await get("/api/json")).json();
  checks.localServiceIsThisInstallation = health.app === "FreeMix" && Number(health.port) === info.apiPort;
  checks.engineConnected = state.connected === true;
  const pages = {}; for (const p of ["/transmitir", "/calls", "/externo", "/gravar", "/multicorder", "/replay?view=settings", "/fechar-janela.js", "/vmix-dialogo.css"]) pages[p] = (await get(p)).status;
  checks.newWindowsServed = Object.values(pages).every((s) => s === 200); detail.pages = pages; detail.buses = info.buses; detail.ndiLoaded = info.ndiLoaded;
  // Cooperative close of the program (allowed only because this is an isolated QA root).
  const { connect } = await import(pathToFileURL(path.join(installed, "ferramentas/obsws.mjs"))), obs = await connect({ root: installed });
  const asked = Date.now(), answer = await obs.req("CallVendorRequest", { vendorName: "freemix", requestType: "shutdown_idle", requestData: { qaClose: true } }).then((r) => r.responseData, (e) => ({ error: e.message }));
  for (const end = Date.now() + 60000; Date.now() < end && alive(info.pid);) await sleep(300);
  obs.close?.(); checks.programClosedWhenAsked = answer.success === true && !alive(info.pid); detail.secondsToClose = Math.round((Date.now() - asked) / 1000);
  await sleep(2500);
  // The product keeps its local service running after the program closes (by design; the launcher ends it before an
  // update). This test's own copy of it is ended the same way, after checking it runs from this QA root.
  const still = await (await get("/api/health")).json();
  if (still.pid) { const where = JSON.parse(execFileSync(path.join(installed, "runtime/freemix-process-info.exe"), [String(still.pid)], { encoding: "utf8", windowsHide: true }))[0]; if (where.path && path.resolve(where.path).toLowerCase().startsWith(root.toLowerCase() + path.sep)) { process.kill(still.pid); detail.ownLocalServiceEnded = true; } else detail.ownLocalServiceEnded = "não era desta cópia; deixado como está"; }
  const newLog = (await list(logs)).filter((f) => !logsBefore.includes(f)).pop(), tail = newLog ? (await fs.readFile(path.join(logs, newLog), "utf8")).trim().split(/\r?\n/).slice(-3).join("\n") : "";
  checks.sessionEndedCleanly = /Number of memory leaks: \d+/.test(tail) && (await list(crashes)).length === crashesBefore.length; detail.leaks = /Number of memory leaks: (\d+)/.exec(tail)?.[1] ?? null;
}
const result = { status: Object.values(checks).every(Boolean) && Object.keys(checks).length === 6 ? "REAL_START_PATH_OK_ON_REHEARSAL_COPY" : "FAIL", version: rehearsal.newVersion, installed, checks, detail, operatorTouched: false };
await fs.writeFile(path.join(qa, "ensaio-abertura-" + rehearsal.newVersion + ".json"), JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify(result)); process.exit(result.status === "FAIL" ? 1 : 0);
