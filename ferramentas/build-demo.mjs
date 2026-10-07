// Build the demo profile and scene collection through the control server, so OBS writes its own files.
import { connect, sleep, ROOT } from "./obsws.mjs";

const PROFILE = "Estudio";
const COLLECTION = "Demonstracao";
const DEMO = `${ROOT}/demo`;
// Listed in the order they should appear on screen (left to right).
const SCENES = [["CAM 1", "cam1"], ["CAM 2", "cam2"], ["CAM 3", "cam3"], ["CAM 4", "cam4"], ["VT", "vt"], ["PLACAR", "placar"], ["ENTREVISTA", "entrevista"], ["ENCERRAMENTO", "encerramento"]];
const GC = ["GC TARJA", "gc-tarja"];

const obs = await connect();
const v = await obs.req("GetVersion");
console.log(`OBS ${v.obsVersion} | obs-websocket ${v.obsWebSocketVersion}`);

const profiles = await obs.req("GetProfileList");
if (!profiles.profiles.includes(PROFILE)) { await obs.req("CreateProfile", { profileName: PROFILE }); await sleep(1500); }
else if (profiles.currentProfileName !== PROFILE) { await obs.req("SetCurrentProfile", { profileName: PROFILE }); await sleep(1500); }

const cols = await obs.req("GetSceneCollectionList");
if (!cols.sceneCollections.includes(COLLECTION)) { await obs.req("CreateSceneCollection", { sceneCollectionName: COLLECTION }); await sleep(2500); }
else if (cols.currentSceneCollectionName !== COLLECTION) { await obs.req("SetCurrentSceneCollection", { sceneCollectionName: COLLECTION }); await sleep(2500); }

await obs.req("SetVideoSettings", { baseWidth: 1920, baseHeight: 1080, outputWidth: 1920, outputHeight: 1080, fpsNumerator: 30000, fpsDenominator: 1001 });
if (!(await obs.req("GetStudioModeEnabled")).studioModeEnabled) await obs.req("SetStudioModeEnabled", { studioModeEnabled: true });

const before = (await obs.req("GetSceneList")).scenes.map((s) => s.sceneName);
// OBS lists new scenes at the bottom; create in order so the first one ends up first.
for (const [sceneName, file] of [...SCENES, GC]) {
  if (before.includes(sceneName)) continue;
  await obs.req("CreateScene", { sceneName });
  const { sceneItemId } = await obs.req("CreateInput", { sceneName, inputName: `Imagem ${sceneName}`, inputKind: "image_source", inputSettings: { file: `${DEMO}/${file}.png`, unload: false } });
  await obs.req("SetSceneItemTransform", { sceneName, sceneItemId, sceneItemTransform: { positionX: 0, positionY: 0, boundsType: "OBS_BOUNDS_SCALE_INNER", boundsWidth: 1920, boundsHeight: 1080, boundsAlignment: 0 } });
  await obs.req("SetSceneItemLocked", { sceneName, sceneItemId, sceneItemLocked: true });
}
for (const leftover of before.filter((n) => ![...SCENES, GC].some(([s]) => s === n))) await obs.tryReq("RemoveScene", { sceneName: leftover });

const kinds = (await obs.req("GetSceneTransitionList")).transitions;
console.log("transições:", kinds.map((t) => `${t.transitionName} (${t.transitionKind})`).join(", "));
const fade = kinds.find((t) => t.transitionKind === "fade_transition");
if (fade) { await obs.req("SetCurrentSceneTransition", { transitionName: fade.transitionName }); await obs.req("SetCurrentSceneTransitionDuration", { transitionDuration: 500 }); }

await obs.req("SetCurrentProgramScene", { sceneName: "CAM 1" });
await obs.req("SetCurrentPreviewScene", { sceneName: "CAM 2" });

// Downstream keyer: put the lower third in the first keyer through the plugin's own requests, when it answers.
const dsk = await obs.tryReq("CallVendorRequest", { vendorName: "downstream-keyer", requestType: "dsk_add_scene", requestData: { dsk_name: "", scene: GC[0] } });
console.log("downstream-keyer:", dsk ? JSON.stringify(dsk.responseData) : "sem resposta do plugin");

await sleep(800);
const list = await obs.req("GetSceneList");
console.log(`cenas (${list.scenes.length}):`, list.scenes.map((s) => s.sceneName).reverse().join(" | "));
console.log(`programa: ${list.currentProgramSceneName} | pré-visualização: ${list.currentPreviewSceneName}`);
const video = await obs.req("GetVideoSettings");
console.log(`vídeo: ${video.baseWidth}x${video.baseHeight} @ ${(video.fpsNumerator / video.fpsDenominator).toFixed(2)}`);
const shot = await obs.req("GetSourceScreenshot", { sourceName: list.currentProgramSceneName, imageFormat: "png", imageWidth: 320 });
console.log(`imagem do programa: ${Math.round(shot.imageData.length * 0.75 / 1024)} KB`);
obs.close();
