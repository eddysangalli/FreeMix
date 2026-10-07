// Drive the embedded panel through the browser debug port (real clicks in the dock page) and check OBS's state on the other side.
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { connect, sleep, ROOT } from "./obsws.mjs";

const require = createRequire("D:/DRIVE/IA/antigravity/vmixtwste/rea/package.json");
const WebSocket = require("ws");
const SCRATCH = "C:/Users/eddyr/AppData/Local/Temp/claude/D--DRIVE-IA-antigravity-vmixtwste/099e3324-585f-465f-8f3e-dabcbe34b865/scratchpad/obs/rec-test";

// 1 kHz tone for the demo "VT" input (-20 dBFS, 5 s, 48 kHz stereo)
const tone = `${ROOT}/demo/tom-1khz.wav`;
if (!existsSync(tone)) {
  const rate = 48000, n = rate * 5, data = Buffer.alloc(n * 4), head = Buffer.alloc(44);
  for (let i = 0; i < n; i++) { const v = Math.round(Math.sin(2 * Math.PI * 1000 * i / rate) * 3276); data.writeInt16LE(v, i * 4); data.writeInt16LE(v, i * 4 + 2); }
  head.write("RIFF", 0); head.writeUInt32LE(36 + data.length, 4); head.write("WAVEfmt ", 8); head.writeUInt32LE(16, 16); head.writeUInt16LE(1, 20); head.writeUInt16LE(2, 22);
  head.writeUInt32LE(rate, 24); head.writeUInt32LE(rate * 4, 28); head.writeUInt16LE(4, 32); head.writeUInt16LE(16, 34); head.write("data", 36); head.writeUInt32LE(data.length, 40);
  writeFileSync(tone, Buffer.concat([head, data]));
}

const targets = await (await fetch("http://127.0.0.1:9333/json")).json();
const target = targets.find((t) => t.url.endsWith("painel/mesa.html"));
if (!target) { console.log("painel não encontrado na porta de depuração:", targets.map((t) => t.url)); process.exit(1); }
const cdp = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r, j) => { cdp.on("open", r); cdp.on("error", j); });
let id = 0; const waits = new Map();
cdp.on("message", (raw) => { const m = JSON.parse(String(raw)); waits.get(m.id)?.(m); waits.delete(m.id); });
const evalJs = (expression) => new Promise((r) => { const i = ++id; waits.set(i, (m) => r(m.result?.result?.value ?? m.result?.exceptionDetails?.text)); cdp.send(JSON.stringify({ id: i, method: "Runtime.evaluate", params: { expression, returnByValue: true, awaitPromise: true } })); });
const click = (sel) => evalJs(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return "sem elemento: ${sel.replace(/"/g, "'")}"; el.click(); return "ok"; })()`);
const tile = (name, action, extra = "") => `.tile [data-a="${action}"][data-v="${name}"]${extra}`;

const obs = await connect();
const scenes = async () => { const r = await obs.req("GetSceneList"); return { pgm: r.currentProgramSceneName, pvw: r.currentPreviewSceneName }; };
const keyers = async () => (await obs.req("CallVendorRequest", { vendorName: "downstream-keyer", requestType: "get_downstream_keyers" })).responseData.downstream_keyers.map((k) => `${k.name}=${k.scene || "-"}`).join(" ");
const results = [];
const check = (name, ok, detail = "") => { results.push(ok); console.log(`${ok ? "OK   " : "FALHA"} ${name}${detail ? "  (" + detail + ")" : ""}`); };

console.log("painel:", await evalJs(`JSON.stringify({ conectado: st.on, cenas: st.scenes.length, keyers: st.keyers?.length, contextoSeguro: isSecureContext, subtle: !!crypto.subtle, miniaturas: thumbs.size })`));

// demo audio in VT, created once
if (!(await obs.tryReq("GetInputSettings", { inputName: "VT áudio" }))) await obs.req("CreateInput", { sceneName: "VT", inputName: "VT áudio", inputKind: "ffmpeg_source", inputSettings: { local_file: tone, looping: true, is_local_file: true } });
await sleep(1200);
check("mixer mostra a fonte de áudio criada", (await evalJs(`document.querySelectorAll('.strip').length`)) >= 1);

await click(tile("CAM 3", "preview")); await sleep(500);
let s = await scenes(); check("clique na miniatura manda para o Preview", s.pvw === "CAM 3", `preview=${s.pvw}`);

await click(tile("CAM 4", "quick")); await sleep(1400);
s = await scenes(); check("Quick Play leva ao ar com a transição", s.pgm === "CAM 4", `programa=${s.pgm}`);

const before = (await obs.req("GetCurrentSceneTransition")).transitionName;
await click(tile("CAM 1", "cut")); await sleep(700);
s = await scenes(); const after = (await obs.req("GetCurrentSceneTransition")).transitionName;
check("Cut corta seco para o programa", s.pgm === "CAM 1", `programa=${s.pgm}`);
check("Cut devolve a transição que estava selecionada", before === after, `${before} -> ${after}`);
check("título da entrada no ar fica verde no painel", (await evalJs(`document.querySelector('.tt.out .nm')?.textContent`)) === "CAM 1");

await click(tile("GC TARJA", "ov", '[data-k="0"]')); await sleep(900);
let k = await keyers(); check("Overlay 1 liga a tarja no keyer 1", k.includes("1=GC TARJA"), k);
check("botão 1 da tarja acende no painel", (await evalJs(`!!document.querySelector('.tile [data-a="ov"][data-k="0"][data-v="GC TARJA"].on')`)) === true);
await click(tile("PLACAR", "ov", '[data-k="1"]')); await sleep(900);
k = await keyers(); check("Overlay 2 aceita outra entrada ao mesmo tempo", k.includes("2=PLACAR") && k.includes("1=GC TARJA"), k);
await click(tile("PLACAR", "ov", '[data-k="1"]')); await sleep(700);
await click(tile("GC TARJA", "ov", '[data-k="0"]')); await sleep(900);
k = await keyers(); check("mesmos botões desligam os overlays", k.includes("1=-") && k.includes("2=-"), k);

await click(tile("VT", "quick")); await sleep(1500);
await click(`.strip[data-n="VT áudio"] [data-a="mute"]`); await sleep(500);
check("M do mixer muta a fonte", (await obs.req("GetInputMute", { inputName: "VT áudio" })).inputMuted === true);
await click(`.strip[data-n="VT áudio"] [data-a="mute"]`); await sleep(500);
check("M de novo tira o mudo", (await obs.req("GetInputMute", { inputName: "VT áudio" })).inputMuted === false);
await sleep(600);
check("medidor do mixer mexe com o VT no ar", Number(await evalJs(`getComputedStyle(document.querySelector('.strip[data-n="VT áudio"] .mt')).getPropertyValue('--l')`)) > 0.2);
await click(tile("CAM 1", "cut")); await sleep(600);

// record: into the scratch folder for the test, then point the profile at the build's own folder
mkdirSync(SCRATCH, { recursive: true });
const oldDir = (await obs.req("GetRecordDirectory")).recordDirectory;
await obs.req("SetRecordDirectory", { recordDirectory: SCRATCH });
await click(`.bot [data-a="record"]`); await sleep(3000);
check("Record inicia a gravação", (await obs.req("GetRecordStatus")).outputActive === true);
check("botão Record fica vermelho com o tempo", (await evalJs(`!!document.querySelector('.bot .b.live[data-a="record"]') && /\\d\\d:\\d\\d:\\d\\d/.test(document.querySelector('.bot .tc')?.textContent || '')`)) === true);
await click(`.bot [data-a="record"]`); await sleep(2500);
check("Record de novo para a gravação", (await obs.req("GetRecordStatus")).outputActive === false, `arquivos de teste: ${readdirSync(SCRATCH).length}`);
mkdirSync(`${ROOT}/gravacoes`, { recursive: true });
await obs.req("SetRecordDirectory", { recordDirectory: `${ROOT}/gravacoes`.replace(/\//g, "\\") });
console.log(`pasta de gravação: ${oldDir} -> ${(await obs.req("GetRecordDirectory")).recordDirectory}`);

// add input (empty) through the popover, then remove the test scene
await click(`.bot [data-a="pop"][data-v="add"]`); await sleep(300);
await evalJs(`(() => { document.getElementById('add-name').value = 'TESTE PAINEL'; document.getElementById('add-kind').value = ''; })()`);
await click(`.pop [data-a="add"]`); await sleep(900);
const names = (await obs.req("GetSceneList")).scenes.map((x) => x.sceneName);
check("Adicionar entrada cria a cena no OBS", names.includes("TESTE PAINEL"));
check("a entrada nova aparece no painel", (await evalJs(`[...document.querySelectorAll('.tile .nm')].some((e) => e.textContent === 'TESTE PAINEL')`)) === true);
await obs.tryReq("RemoveScene", { sceneName: "TESTE PAINEL" }); await sleep(500);

await click(tile("CAM 2", "preview")); await sleep(400);
s = await scenes();
console.log(`estado final: programa=${s.pgm} preview=${s.pvw} | keyers ${await keyers()}`);
console.log(`${results.filter(Boolean).length}/${results.length} verificações passaram`);
obs.close(); cdp.close();
