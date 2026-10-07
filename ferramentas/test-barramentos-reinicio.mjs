// After a restart of the program: are the buses still on air and does the Master still receive the test tone?
// Works without the debug port (engine opened by the normal launcher). Puts the Program scene back at the end.
import { connect, sleep } from "./obsws.mjs";
const levels = new Map();
const obs = await connect({ events: 65536, onEvent: (t, d) => { if (t === "InputVolumeMeters") for (const i of d.inputs) levels.set(i.inputName, Math.max(0, ...i.inputLevelsMul.map((c) => c[1]))); } });
const scene = (await obs.req("CallVendorRequest", { vendorName: "downstream-keyer", requestType: "dsk_get_scene", requestData: { dsk_name: "FreeMix Audio" } })).responseData?.scene;
const prog0 = (await obs.req("GetCurrentProgramScene")).currentProgramSceneName;
await obs.req("SetCurrentProgramScene", { sceneName: "VT" }); await sleep(2000); levels.clear(); await sleep(900);
const m = levels.get("FreeMix Master") ?? -1, direct = (await obs.req("GetInputAudioTracks", { inputName: "VT áudio" })).inputAudioTracks;
await obs.req("SetCurrentProgramScene", { sceneName: prog0 });
const ok = scene === "FreeMix Barramentos" && m > 0.01 && !direct["1"];
console.log(`${ok ? "OK   " : "FALHA"} depois de reabrir: barramentos no ar (${scene}), Master recebendo o tom (${m.toFixed(4)}), entrada sem caminho direto à trilha 1 (${!direct["1"]})`);
obs.close();
