// App36 R4e: the reviewer's side of the handoff, done with a real browser instead of by hand.
// Waits for the runner to say the own backend is ready, acknowledges, opens the five screens in Microsoft Edge
// (headless, own profile folder, driven through the DevTools protocol), saves one JPEG of each, and keeps the screens
// open - their polling running - until the runner finishes. Navigation only: nothing is clicked, typed or saved.
// The proof is only declared after ROOT-REVIEWED.json appears next to this file: the orchestrator writes it after
// looking at the five pictures. Page errors and failed requests seen by the browser go to browser-observations.json.
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import net from "node:net";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";

const here = import.meta.dirname, ws = path.resolve(here, "../..");
const prep = path.join(ws, "qa-finalizacao/native36-real-app-r4e-preparation-20261011");
const tempDir = path.join(ws, "qa-finalizacao/own-temp-native36-real-app-r4e");
const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const sha = (b) => createHash("sha256").update(b).digest("hex"), sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const exists = (p) => fs.access(p).then(() => true, () => false);
const log = (text) => console.log(new Date().toISOString().slice(11, 19) + " " + text);
const roles = ["mesa", "srt", "multistream", "calls", "replay-settings"];
const observations = { browser: "Microsoft Edge headless over DevTools protocol", navigationOnly: true, pages: {} };

// 1. Wait for the runner. A receipt before the context means the run ended earlier: nothing to do here.
const contextPath = path.join(prep, "browser-context.json"), receiptPath = path.join(prep, "receipt.json");
for (const stale of ["root-events.ndjson", "root-iab-proof.json"]) assert(!(await exists(path.join(prep, stale))), "stale handoff file: " + stale);
const waitUntil = Date.now() + 20 * 60000;
while (!(await exists(contextPath))) {
  if (await exists(receiptPath)) { log("runner finished before the screens: no handoff"); process.exit(3); }
  assert(Date.now() < waitUntil, "runner never became ready");
  await sleep(500);
}
await sleep(300);
const contextBytes = await fs.readFile(contextPath), context = JSON.parse(contextBytes), contextSha256 = sha(contextBytes);
assert(context.ownOnly === true && /^http:\/\/127\.0\.0\.1:\d+$/.test(context.baseUrl), "context is not a local own backend");
for (const role of roles) assert(context.urls[role]?.startsWith(context.baseUrl + "/"), "unexpected url for " + role);
const interactionDeadline = Date.parse(context.interactionDeadline);
log(`backend ready at ${context.baseUrl}; interaction allowed for ${Math.round((interactionDeadline - Date.now()) / 1000)} s`);

// 2. Events for the runner: append-only, one JSON per line.
let sequence = 0;
const eventsPath = path.join(prep, "root-events.ndjson");
const event = async (kind, extra = {}) => { await fs.appendFile(eventsPath, JSON.stringify({ kind, role: "root", ownOnly: true, handoffId: context.handoffId, contextSha256, sequence: sequence++, ...extra }) + "\n"); };
await event("ack");
log("ack sent");

// 3. Own browser.
await fs.mkdir(tempDir, { recursive: true });
const profile = await fs.mkdtemp(path.join(tempDir, "FreeMix-QA-RootBrowser-"));
await fs.writeFile(path.join(profile, ".freemix-qa-owned"), JSON.stringify({ format: 1, root: profile, kind: "RootBrowser", createdAt: new Date().toISOString() }), { flag: "wx" });
const port = await new Promise((resolve) => { const s = net.createServer(); s.listen(0, "127.0.0.1", () => { const n = s.address().port; s.close(() => resolve(n)); }); });
const edge = spawn(EDGE, ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "--no-first-run", "--no-default-browser-check", "--disable-extensions", "--disable-sync", "--window-size=1600,900", "about:blank"], { windowsHide: true, stdio: "ignore" });
let edgeExited = false; edge.on("exit", () => { edgeExited = true; });
observations.browserPid = edge.pid;
let version = null;
for (let i = 0; i < 100 && !version; i++) { try { version = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); } catch { await sleep(200); } }
assert(version?.webSocketDebuggerUrl, "browser did not open its control port");
observations.browserVersion = version.Browser;
const socket = new WebSocket(version.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = () => reject(Error("control connection failed")); });
let id = 0; const pending = new Map(), sessions = new Map();
socket.onmessage = (m) => {
  const d = JSON.parse(m.data);
  if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.reject(Error(d.error.message)) : p.resolve(d.result); return; }
  const page = sessions.get(d.sessionId); if (!page) return;
  if (d.method === "Runtime.exceptionThrown") page.exceptions.push(String(d.params.exceptionDetails?.exception?.description || d.params.exceptionDetails?.text || "").slice(0, 300));
  else if (d.method === "Log.entryAdded" && d.params.entry.level === "error") page.errors.push(String(d.params.entry.text).slice(0, 300));
  else if (d.method === "Network.responseReceived") { page.responses++; const s = d.params.response.status; if (s >= 400) page.httpErrors.push({ status: s, url: new URL(d.params.response.url).pathname.slice(0, 120) }); }
  else if (d.method === "Network.loadingFailed" && !d.params.canceled) page.failed.push(String(d.params.errorText).slice(0, 120));
  else if (d.method === "Page.loadEventFired") page.loaded = true;
};
const cdp = (method, params = {}, sessionId) => new Promise((resolve, reject) => { const n = ++id; pending.set(n, { resolve, reject }); socket.send(JSON.stringify({ id: n, method, params, ...(sessionId ? { sessionId } : {}) })); });

// 4. The five screens, one tab each, left open.
const files = [];
for (const role of roles) {
  const { targetId } = await cdp("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await cdp("Target.attachToTarget", { targetId, flatten: true });
  const page = { role, loaded: false, exceptions: [], errors: [], httpErrors: [], failed: [], responses: 0 };
  sessions.set(sessionId, page); observations.pages[role] = page;
  for (const domain of ["Page", "Runtime", "Log", "Network"]) await cdp(domain + ".enable", {}, sessionId);
  await cdp("Emulation.setDeviceMetricsOverride", { width: 1600, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId);
  await cdp("Page.navigate", { url: context.urls[role] }, sessionId);
  for (let i = 0; i < 100 && !page.loaded; i++) await sleep(100);
  await sleep(4000);   // first data requests and render
  const title = (await cdp("Runtime.evaluate", { expression: "document.title", returnByValue: true }, sessionId)).result?.value;
  page.title = String(title || "").slice(0, 80); page.url = context.urls[role].replace(context.baseUrl, "");
  await cdp("Page.bringToFront", {}, sessionId);
  const shot = Buffer.from((await cdp("Page.captureScreenshot", { format: "jpeg", quality: 82 }, sessionId)).data, "base64");
  assert(shot[0] === 255 && shot[1] === 216 && shot[2] === 255 && shot.length > 500, "not a JPEG");
  const file = `root-installed-${role}.jpg`;
  await fs.writeFile(path.join(prep, file), shot, { flag: "wx" });
  files.push({ role, file, mime: "image/jpeg", bytes: shot.length, sha256: sha(shot) });
  await event("heartbeat", { action: "capture" });
  log(`${role}: "${page.title}" ${shot.length} bytes, ${page.responses} responses, ${page.httpErrors.length} http errors, ${page.exceptions.length} exceptions`);
}
const saveObservations = () => fs.writeFile(path.join(here, "browser-observations.json"), JSON.stringify(observations, null, 2) + "\n");
await saveObservations();
log("five pictures saved; waiting for the review (ROOT-REVIEWED.json)");

// 5. Review by the orchestrator, with a heartbeat every 30 s so the runner knows the reviewer is there.
const reviewedPath = path.join(here, "ROOT-REVIEWED.json");
let lastBeat = Date.now(), reviewed = null;
while (!reviewed) {
  if (await exists(reviewedPath)) { reviewed = JSON.parse(await fs.readFile(reviewedPath, "utf8")); break; }
  if (Date.now() > interactionDeadline - 25000) break;
  if (Date.now() - lastBeat > 30000) { await event("heartbeat", { action: "inspect" }); lastBeat = Date.now(); }
  await sleep(500);
}
if (reviewed?.approved === true) {
  await fs.writeFile(path.join(prep, "root-iab-proof.json"), JSON.stringify({ ownOnly: true, backendReal: true, reviewed: true, readOnlyNavigation: true, noSaveStart: true, handoffId: context.handoffId, contextSha256, files }, null, 2) + "\n", { flag: "wx" });
  await event("proof-ready");
  log("proof declared; screens stay open during the hold");
} else {
  await event("close-request");
  log(reviewed ? "review refused the pictures: close requested" : "no review in time: close requested");
}

// 6. Screens stay open, polling, until the runner writes its receipt. Then the browser is asked to close.
const until = Date.now() + 15 * 60000;
while (!(await exists(receiptPath)) && Date.now() < until) await sleep(1000);
for (const page of Object.values(observations.pages)) page.responsesAtEnd = page.responses;
observations.screensStayedOpenUntilReceipt = await exists(receiptPath);
await saveObservations();
try { await cdp("Browser.close"); } catch {}
for (let i = 0; i < 100 && !edgeExited; i++) await sleep(100);
observations.browserClosed = edgeExited; await saveObservations();
log(`browser ${edgeExited ? "closed" : "still open (pid " + edge.pid + ")"}; done`);
process.exit(0);
