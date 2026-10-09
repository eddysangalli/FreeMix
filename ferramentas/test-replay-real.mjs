// Requires the isolated QA runtime prepared by qa-replay/preparar-qa.ps1.
// Never connects to the operator's engine or API on 4466/8088.
import assert from "node:assert/strict";
import { stat, writeFile, readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { connect, sleep } from "./obsws.mjs";

const root = fileURLToPath(new URL("../../qa-replay/runtime/", import.meta.url));
const qa = fileURLToPath(new URL("../../qa-replay/", import.meta.url));
const cfg = JSON.parse(await readFile(`${root}/config/obs-studio/plugin_config/obs-websocket/config.json`, "utf8"));
assert.equal(cfg.server_port, 14466, "QA must use the isolated control port");
const obs = await connect({ root });
const base = "http://127.0.0.1:18088";
let passed = 0;
const check = (name, value) => { assert.ok(value, name); passed++; console.log(`OK ${name}`); };
async function api(action, data = {}, fail = false) {
  const response = await fetch(`${base}/api/replay`, action ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, ...data }) } : {});
  const result = await response.json();
  if (fail) { check(`recusa real: ${action}`, !result.success && response.status !== 200); return result; }
  assert.ok(result.success, result.error);
  return result.replay;
}
async function screenshot(input, name) {
  const result = await obs.req("GetSourceScreenshot", { sourceName: input, imageFormat: "png", imageWidth: 640, imageHeight: 360 });
  const image = Buffer.from(result.imageData.split(",")[1], "base64");
  assert.ok(image.length > 500);
  await writeFile(`${qa}/${name}.png`, image);
}
try {
  check("motor isolado em 14466", (await obs.req("GetVersion")).obsVersion.length > 0);
  if (!(await obs.req("GetStudioModeEnabled")).studioModeEnabled) await obs.req("SetStudioModeEnabled", { studioModeEnabled: true });
  await api("load", { player: "A", eventId: "inexistente" }, true);
  await api("capture", { seconds: 5 }, true);
  await api("mark-out", {}, true);
  if (!(await obs.tryReq("GetInputSettings", { inputName: "QA Video" }))) await obs.req("CreateInput", { sceneName: "CAM 1", inputName: "QA Video", inputKind: "ffmpeg_source", inputSettings: {
    is_local_file: true, local_file: `${qa}/fixture.mp4`, looping: true, restart_on_activate: false, close_when_inactive: false } });
  if (!(await obs.req("GetSceneList")).scenes.some((s) => s.sceneName === "CAM 2")) await obs.req("CreateScene", { sceneName: "CAM 2" });
  if (!(await obs.tryReq("GetInputSettings", { inputName: "QA Azul" }))) await obs.req("CreateInput", { sceneName: "CAM 2", inputName: "QA Azul", inputKind: "color_source_v3", inputSettings: { color: 0xFFFF0000, width: 640, height: 360 } });
  await obs.req("SetCurrentProgramScene", { sceneName: "CAM 1" });
  await obs.req("SetCurrentPreviewScene", { sceneName: "CAM 2" });
  let state = await api("start", { cams: ["CAM 1", "CAM 2"] });
  check("REC só confirma após vídeo real nas duas câmeras", state.rec && state.session.cams.length === 2);
  for (const camera of state.session.cams) {
    check(`arquivo TS com dados: ${camera.name}`, (await stat(camera.file)).size > 1880);
    const info = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-show_streams", "-of", "json", camera.file], { windowsHide: true }));
    check(`vídeo decodificável: ${camera.name}`, info.streams.some((s) => s.codec_type === "video" && s.width === 640));
  }
  await sleep(10000);
  state = await api("capture", { seconds: 5 });
  const event = state.events[0];
  check("lance contém dois clipes reais com início/fim", event.clips.length === 2 && event.clips.every((c) => c.start > 3 && c.end > c.start && Math.abs(c.duration - 5) < 0.2));
  await api("mark-in");
  await sleep(1700);
  state = await api("mark-out");
  check("IN/OUT produz vídeo de duração delimitada", state.events[0].dur > 1 && state.events[0].dur < 3.5);
  await api("load", { player: "A", eventId: event.id, cam: "CAM 1" });
  const settings = await obs.req("GetInputSettings", { inputName: "Replay Player A" });
  check("Player A aponta para o arquivo correto", settings.inputSettings.local_file === event.clips[0].file);
  const list = await obs.req("GetSceneList");
  check("preparar A muda só o Preview", list.currentPreviewSceneName === "REPLAY A" && list.currentProgramSceneName === "CAM 1");
  const paused = await obs.req("GetMediaInputStatus", { inputName: "Replay Player A" });
  check("motor confirma vídeo carregado, pausado e com duração", paused.mediaState === "OBS_MEDIA_STATE_PAUSED" && paused.mediaDuration > 4000);
  await screenshot("Replay Player A", "player-a-preview");
  await api("load", { player: "B", eventId: event.id, cam: "CAM 2" });
  check("Player B guarda outro ângulo sem alterar A", (await obs.req("GetInputSettings", { inputName: "Replay Player B" })).inputSettings.local_file === event.clips[1].file
    && (await obs.req("GetInputSettings", { inputName: "Replay Player A" })).inputSettings.local_file === event.clips[0].file);
  await screenshot("Replay Player B", "player-b-preview");
  await api("speed", { speed: 100 });
  await api("air", { player: "A" });
  const start = (await obs.req("GetMediaInputStatus", { inputName: "Replay Player A" })).mediaCursor;
  await sleep(1200);
  const playing = await obs.req("GetMediaInputStatus", { inputName: "Replay Player A" });
  check("reprodução avança de verdade no Programa", (await obs.req("GetSceneList")).currentProgramSceneName === "REPLAY A" && playing.mediaState === "OBS_MEDIA_STATE_PLAYING" && playing.mediaCursor - start > 800);
  await screenshot("REPLAY A", "player-a-no-ar");
  await api("load", { player: "A", eventId: event.id }, true);
  const beforeSpeedChange = (await obs.req("GetMediaInputStatus", { inputName: "Replay Player A" })).mediaCursor;
  await api("speed", { speed: 50 });
  const afterSpeedChange = await obs.req("GetMediaInputStatus", { inputName: "Replay Player A" });
  check("trocar velocidade no ar preserva a posição do lance", afterSpeedChange.mediaState === "OBS_MEDIA_STATE_PLAYING" && afterSpeedChange.mediaCursor >= beforeSpeedChange - 100);
  await api("air", { player: "A" });
  const slowStart = (await obs.req("GetMediaInputStatus", { inputName: "Replay Player A" })).mediaCursor;
  await sleep(1200);
  const slowEnd = (await obs.req("GetMediaInputStatus", { inputName: "Replay Player A" })).mediaCursor;
  check(`50% reduz avanço real do vídeo (${slowEnd - slowStart} ms em 1200 ms)`, slowEnd - slowStart > 300 && slowEnd - slowStart < 950);
  await api("air", { player: "B" });
  await api("live");
  check("A→B→ao vivo retorna à câmera anterior", (await obs.req("GetSceneList")).currentProgramSceneName === "CAM 1");
  state = await api("stop");
  check("parar SSD confirmado nos filtros", !state.rec && (await obs.req("GetSourceFilter", { sourceName: "CAM 1", filterName: "FreeMix Replay Rec" })).filterSettings.record_mode === 0);
  await api("load", { player: "A", eventId: event.id });
  check("lance permanece reproduzível após parar gravação", (await obs.req("GetMediaInputStatus", { inputName: "Replay Player A" })).mediaDuration > 4000);
  await api("speed", { speed: 100 });
  await api("air", { player: "A" });
  await sleep(5500);
  check("reprodução termina no OUT e não continua na gravação", (await obs.req("GetMediaInputStatus", { inputName: "Replay Player A" })).mediaState === "OBS_MEDIA_STATE_ENDED");
  await api("live");
  // Source-content evidence: compare the extracted first frame with the TS at the event's true IN.
  const clip = event.clips[0];
  // Decode the reference from the beginning; do not repeat the extraction's fast-seek path.
  const args = ["-hide_banner", "-loglevel", "error", "-copyts", "-i", state.session.cams[0].file,
    "-vf", `select=gte(t\\,${clip.sourceStart - 1e-7})`, "-fps_mode", "passthrough", "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"];
  const original = execFileSync("ffmpeg", args, { windowsHide: true, maxBuffer: 4e6 });
  const extracted = execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-i", clip.file, "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], { windowsHide: true, maxBuffer: 4e6 });
  assert.equal(original.length, extracted.length);
  let difference = 0; for (let i = 0; i < original.length; i++) difference += Math.abs(original[i] - extracted[i]);
  const mae = difference / original.length;
  check(`primeiro quadro corresponde ao IN real (erro médio ${mae.toFixed(2)}/255)`, mae < 5);
  const previewPixels = execFileSync("ffmpeg", ["-v", "error", "-i", `${qa}/player-a-preview.png`, "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], { windowsHide: true, maxBuffer: 4e6 });
  let previewDifference = 0; for (let i = 0; i < extracted.length; i++) previewDifference += Math.abs(previewPixels[i] - extracted[i]);
  const previewError = previewDifference / extracted.length;
  check(`Preview exibe o primeiro quadro do lance (erro médio ${previewError.toFixed(2)}/255)`, previewError < 5);
  await writeFile(`${qa}/resultado.json`, JSON.stringify({ passed, event, meanPixelError: mae, meanPreviewError: previewError, recordings: state.session.cams, evidence: ["player-a-preview.png", "player-b-preview.png", "player-a-no-ar.png"] }, null, 2));
  console.log(`${passed}/${passed} verificações reais passaram`);
} finally {
  try { const state = await api(); if (state.rec) await api("stop"); } catch {}
  obs.close();
}
