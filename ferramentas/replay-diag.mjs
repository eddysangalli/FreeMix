// List the replay angles in the running engine with their buffer settings and the engine's memory use.
// With the argument "remover <cena>" it removes that replay entry, its source and the capture filter it left on the camera.
import { connect, sleep } from "./obsws.mjs";
const obs = await connect();
const mem = async () => Math.round((await obs.req("GetStats")).memoryUsage);
const inputs = (await obs.req("GetInputList", { inputKind: "replay_source" })).inputs;
console.log(`memória do motor: ${await mem()} MB | ângulos de replay: ${inputs.length}`);
for (const i of inputs) { const s = (await obs.req("GetInputSettings", { inputName: i.inputName })).inputSettings; console.log(`  ${i.inputName}: câmera "${s.source}", ${(s.duration ?? 5000) / 1000} s de buffer, guarda ${s.replays ?? 1} lance(s), sem compressão: ${!!s.lossless}`); }
if (process.argv[2] === "remover") {
  const scene = process.argv[3], list = (await obs.tryReq("GetSceneItemList", { sceneName: scene }))?.sceneItems ?? [];
  const reps = list.filter((x) => x.inputKind === "replay_source").map((x) => x.sourceName);
  const cams = []; for (const r of reps) cams.push((await obs.req("GetInputSettings", { inputName: r })).inputSettings.source);
  const cur = await obs.req("GetSceneList");
  if (cur.currentProgramSceneName === scene) { console.log("essa entrada está no ar; não removi"); obs.close(); process.exit(1); }
  await obs.req("RemoveScene", { sceneName: scene });
  for (const r of reps) await obs.tryReq("RemoveInput", { inputName: r });
  for (const c of cams.filter(Boolean)) for (const f of (await obs.tryReq("GetSourceFilterList", { sourceName: c }))?.filters ?? []) if (f.filterKind.startsWith("replay_filter")) await obs.tryReq("RemoveSourceFilter", { sourceName: c, filterName: f.filterName });
  await sleep(4000);
  console.log(`removido "${scene}" (${reps.join(", ") || "sem fonte de replay"}) | memória agora: ${await mem()} MB`);
}
obs.close();
