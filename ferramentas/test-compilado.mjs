// Checks of the program built from the fork, through the control server (no debug port needed):
// modules built from our code are loaded, a keyer created at run time starts with "hide after" at zero and accepts
// the new request, and camera capture works end to end using the virtual camera as the camera (program -> virtual
// camera -> capture input -> picture). Leaves no test object behind.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { connect, sleep, ROOT } from "./obsws.mjs";
const obs = await connect();
let pass = 0, total = 0;
const check = (name, ok, detail = "") => { total++; if (ok) pass++; console.log(`${ok ? "OK   " : "FALHA"} ${name}${detail !== "" ? "  (" + detail + ")" : ""}`); };
const vendor = async (type, data = {}) => (await obs.tryReq("CallVendorRequest", { vendorName: "downstream-keyer", requestType: type, requestData: data }))?.responseData;

const logs = `${ROOT}/config/obs-studio/logs`, last = readdirSync(logs).map((f) => [f, statSync(`${logs}/${f}`).mtimeMs]).sort((a, b) => b[1] - a[1])[0][0], log = readFileSync(`${logs}/${last}`, "utf8");
const loaded = [...log.matchAll(/^\d\d:\d\d:\d\d\.\d+:\s{4,}(\S+\.dll)\s*$/gm)].map((m) => m[1]);
check("módulos que antes vinham prontos agora carregam do nosso código", ["win-dshow.dll", "frontend-tools.dll", "obs-qsv11.dll", "downstream-keyer.dll"].every((m) => loaded.includes(m)), `${loaded.length} módulos`);
check("nenhum módulo falhou ao carregar", !/Failed to load module|LoadLibrary failed|not loaded because/i.test(log));

const K = "FreeMix teste keyer";
await vendor("remove_downstream_keyer", { dsk_name: K });
await vendor("add_downstream_keyer", { dsk_name: K }); await sleep(1200);
const fresh = ((await vendor("get_downstream_keyers"))?.downstream_keyers || []).find((k) => k.name === K);
check("keyer criado com o programa aberto nasce com 'esconder depois de' em zero", fresh?.hide_after === 0, `hide_after ${fresh?.hide_after}`);
const set = await vendor("dsk_set_hide_after", { dsk_name: K, hide_after: 4000 });
const after = ((await vendor("get_downstream_keyers"))?.downstream_keyers || []).find((k) => k.name === K);
check("o pedido novo de duração do overlay é aceito e fica gravado no keyer", set?.success === true && after?.hide_after === 4000, JSON.stringify(set));
await vendor("remove_downstream_keyer", { dsk_name: K });

// Camera capture, with the virtual camera playing the part of the camera.
const SC = "FreeMix teste câmera", IN = "FreeMix teste câmera (fonte)";
const vcam0 = (await obs.req("GetVirtualCamStatus")).outputActive;
await obs.tryReq("RemoveInput", { inputName: IN }); await obs.tryReq("RemoveScene", { sceneName: SC }); await sleep(300);
try {
  if (!vcam0) { await obs.req("StartVirtualCam"); await sleep(800); }
  check("câmera virtual liga", (await obs.req("GetVirtualCamStatus")).outputActive === true);
  await obs.req("CreateScene", { sceneName: SC });
  await obs.req("CreateInput", { sceneName: SC, inputName: IN, inputKind: "dshow_input", inputSettings: {}, sceneItemEnabled: true });
  const devices = (await obs.req("GetInputPropertiesListPropertyItems", { inputName: IN, propertyName: "video_device_id" })).propertyItems;
  const cam = devices.find((d) => /^OBS Virtual Camera/i.test(d.itemName));
  check("a captura de câmera lista os dispositivos da máquina", devices.length > 0 && !!cam, devices.map((d) => d.itemName).join(", "));
  if (cam) {
    await obs.req("SetInputSettings", { inputName: IN, inputSettings: { video_device_id: cam.itemValue, active: true } }); await sleep(3500);
    const shot = await obs.tryReq("GetSourceScreenshot", { sourceName: IN, imageFormat: "png", imageWidth: 320 });
    const bytes = shot ? Buffer.from(shot.imageData.split(",")[1], "base64").length : 0;
    const dims = (await obs.req("GetSceneItemList", { sceneName: SC })).sceneItems[0]?.sceneItemTransform;
    check("a captura recebe imagem (programa -> câmera virtual -> entrada de câmera)", bytes > 1500 && dims?.sourceWidth > 0, `${dims?.sourceWidth}x${dims?.sourceHeight}, foto de ${bytes} bytes`);
  }
} finally {
  await obs.tryReq("RemoveInput", { inputName: IN }); await obs.tryReq("RemoveScene", { sceneName: SC });
  if (!vcam0) await obs.tryReq("StopVirtualCam");
}
console.log(`${pass}/${total} verificações passaram`);
obs.close();
