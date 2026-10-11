// Real click test of the Replay settings window (/replay?view=settings) against the screens sandbox: a real replay
// recording of one input is started and stopped from the window; retention, replay audio and the options of one
// camera are saved and read back from the engine. Everything stays inside the sandbox; originals are put back.
//   node scripts/qa/test-replay-settings.mjs [pasta-para-retratos]
import path from "node:path";
import { pathToFileURL } from "node:url";
import { openTest, until, sleep } from "./navegador-teste.mjs";

const t = await openTest({ width: 700, height: 540, shots: process.argv[2] ? path.resolve(process.argv[2]) : null }), { page, check, api } = t;
const replay = async () => (await api("/api/replay")).replay;
const post = async (body) => (await fetch(t.base + "/api/replay", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })).json();
// An input with real picture (an empty camera writes no video and the engine rightly refuses to start).
const { connect } = await import(pathToFileURL(path.join(t.sandbox.installed, "ferramentas/obsws.mjs"))), obs = await connect({ root: t.sandbox.installed }), cam = "QA Cor " + Date.now().toString(36).slice(-4).toUpperCase();
await obs.req("CreateScene", { sceneName: cam }); await obs.req("CreateInput", { sceneName: cam, inputName: cam + " (fonte)", inputKind: "color_source_v3", inputSettings: { color: 0xff2060c0, width: 1280, height: 720 } });
await until(async () => (await replay()).availableCams.includes(cam), 10000);
const before = await replay();
const idle = () => until(() => page.ev(`!document.querySelector("#btn-toggle-rec").disabled`), 60000);
const commands = () => t.posts.filter((p) => p.url === "/api/replay");
try {
  if (before.rec) throw Error("já há uma gravação de replay em andamento no sandbox");
  await page.open("/replay?view=settings#replay-config");
  check("a janela carrega com as entradas da mesa", await until(() => page.ev(`document.querySelector("#cam-slot-1")?.options.length > 1`)) === true);
  await sleep(1800);
  check("abrir a janela não envia nenhum comando", commands().length === 0, commands().map((p) => p.action).join(","));
  await page.shot("1-como-abre");
  await page.click("#btn-toggle-rec"); await sleep(400);
  check("iniciar sem câmera escolhida: aviso, nenhum comando", (await page.text("#status-msg")).includes("Selecione") && commands().length === 0, await page.text("#status-msg"));

  await page.choose("#cam-slot-1", cam); await page.click("#btn-toggle-rec");
  const running = await until(async () => { const r = await replay(); return r.rec ? r : null; }, 40000); await idle();
  check("'Iniciar gravação' põe o replay gravando a câmera escolhida", !!running && running.session?.cams?.some((c) => c.name === cam), running ? `${running.session.cams.length} câmera(s)` : await page.text("#status-msg"));
  await until(() => page.ev(`document.querySelector("#btn-toggle-rec").textContent.includes("Parar")`), 8000);
  check("o botão vira 'Parar' em vermelho, a faixa mostra o tempo e as câmeras travam", (await page.text("#btn-toggle-rec")).includes("Parar") && await page.is("#btn-toggle-rec", "vd-air") && await page.is("#cam-slot-1", "disabled") === true && /Andamento/i.test(await page.text("#rec-status-text")), await page.text("#rec-status-text") + " " + await page.text("#rec-timer-text"));
  await sleep(3000); await page.shot("2-gravando");
  await page.click("#btn-toggle-rec");
  check("'Parar' encerra a gravação do replay", !!(await until(async () => !(await replay()).rec, 40000))); await idle();

  // Storage
  await page.click("#tab-btn-storage"); await until(async () => !(await page.is("#retention-enabled", "disabled")), 15000);   // the window unlocks when it sees the engine stopped
  const wanted = before.retention?.minutes === 45 ? 50 : 45;
  if (!(await page.is("#retention-enabled", "checked"))) await page.click("#retention-enabled");
  await page.type("#retention-minutes", String(wanted)); await until(async () => !(await page.is("#btn-save-retention", "disabled")), 15000); const clicked = await page.click("#btn-save-retention"); await sleep(300); await idle();
  const kept = (await replay()).retention;
  check("'Aplicar Retenção' grava a retenção no programa", kept?.enabled === true && kept.minutes === wanted, `${kept?.enabled ? "ligada" : "desligada"}, ${kept?.minutes} min; clique: ${clicked}; mensagem: ${await page.text("#status-msg")}; comando: ${JSON.stringify(commands().filter((p) => p.action === "retention").at(-1) || null)}`);
  await page.shot("3-armazenamento");

  // Audio
  await page.click("#tab-btn-audio");
  const audioBefore = (await replay()).audioEnabled;
  await page.click("#btn-toggle-audio"); await idle();
  check("o botão do áudio do replay liga e desliga no programa", (await replay()).audioEnabled === !audioBefore, `antes ${audioBefore ? "ligado" : "silenciado"}, depois ${audioBefore ? "silenciado" : "ligado"}`);
  await page.click("#btn-toggle-audio"); await idle();
  await page.choose("#audio-cam-select", cam); await page.type("#audio-gain", "-6"); if (!(await page.is("#audio-muted", "checked"))) await page.click("#audio-muted"); await page.type("#camera-offset", "2");
  await page.click("#btn-save-cam-audio"); await idle();
  const options = (await replay()).cameraOptions?.[cam];
  check("'Aplicar Câmera' grava volume, silenciar e offset daquela câmera", options?.gainDb === -6 && options.muted === true && options.offsetFrames === 2, JSON.stringify(options));
  await page.shot("4-audio");
  check("mensagens em português claro, sem nome interno de comando", !/camera-options|auto-align|retention\b/i.test(await page.text("#status-msg")), await page.text("#status-msg"));
  await page.click("#btn-close");
  check("'Fechar' fecha a janela", await page.closed() === true);
  check("nenhum erro de script na página", t.problems.length === 0, t.problems.join(" | "));
} finally {
  if ((await replay()).rec) await post({ action: "stop" }).catch(() => {});
  await post({ action: "retention", enabled: !!before.retention?.enabled, minutes: before.retention?.minutes || 30, segmentSeconds: before.retention?.segmentSeconds || 60 }).catch(() => {});
  await post({ action: "camera-options", cam, options: { recordAudio: "input", gainDb: 0, muted: false, offsetFrames: 0 } }).catch(() => {});
  await obs.req("RemoveInput", { inputName: cam + " (fonte)" }).catch(() => {}); await obs.req("RemoveScene", { sceneName: cam }).catch(() => {}); obs.close?.();
}
process.exit((await t.finish()) ? 0 : 1);
