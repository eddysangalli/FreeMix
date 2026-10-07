// Click-test of the Replay window. OBS must be running with --remote-debugging-port=9333. Leaves no replay angle behind.
import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
import { connect, sleep } from "./obsws.mjs";

const require = createRequire("D:/DRIVE/IA/antigravity/vmixtwste/rea/package.json");
const WebSocket = require("ws");
const SHOT = process.argv[2];

const target = (await (await fetch("http://127.0.0.1:9333/json")).json()).find((t) => t.url.endsWith("painel/mesa.html"));
const cdp = new WebSocket(target.webSocketDebuggerUrl); await new Promise((r) => cdp.on("open", r));
let id = 0; const waits = new Map();
cdp.on("message", (raw) => { const m = JSON.parse(String(raw)); waits.get(m.id)?.(m); waits.delete(m.id); });
const evalJs = (expression) => new Promise((r) => { const i = ++id; waits.set(i, (m) => r(m.result?.result?.value ?? m.result?.exceptionDetails?.exception?.description)); cdp.send(JSON.stringify({ id: i, method: "Runtime.evaluate", params: { expression, returnByValue: true, awaitPromise: true } })); });
const click = (sel) => evalJs(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return "sem elemento"; el.click(); return "ok"; })()`);
const obs = await connect();
let pass = 0, total = 0;
const check = (name, ok, detail = "") => { total++; if (ok) pass++; console.log(`${ok ? "OK   " : "FALHA"} ${name}${detail !== "" ? "  (" + detail + ")" : ""}`); };
const mem = async () => Math.round((await obs.req("GetStats")).memoryUsage);

await evalJs("location.reload()"); await sleep(4000);
await obs.req("SetCurrentProgramScene", { sceneName: "CAM 1" }); await sleep(900);
const mem0 = await mem();
check("botão Replay aparece com o plugin carregado", (await evalJs(`!!document.querySelector('.bot [data-a="pop"][data-v="replay"]')`)) === true);
try {
  await click(`.bot [data-a="pop"][data-v="replay"]`); await sleep(300);
  await evalJs(`(() => { document.getElementById("rp-cam").value = "CAM 3"; const s = document.getElementById("rp-sec"), o = document.createElement("option"); o.value = "2"; o.textContent = "2 s"; s.appendChild(o); s.value = "2"; })()`);
  await click(`.pop [data-a="rpadd"]`); await sleep(1800);
  const set = await obs.tryReq("GetInputSettings", { inputName: "Replay CAM 3" });
  check("Adicionar ângulo cria a fonte de replay da câmera", set?.inputKind === "replay_source" && set.inputSettings.source === "Imagem CAM 3" && set.inputSettings.duration === 2000, JSON.stringify(set?.inputSettings ?? null).slice(0, 110));
  check("o ângulo aparece na janela Replay", (await evalJs(`document.getElementById("pop").textContent.includes("REPLAY CAM 3")`)) === true);
  // The camera has to be on screen while the buffer fills: put it on air, then capture the play and cut back.
  await obs.req("SetCurrentProgramScene", { sceneName: "CAM 3" }); await sleep(4500);
  await click(`.pop [data-a="rpgrab"]`); await sleep(1500);
  await obs.req("SetCurrentProgramScene", { sceneName: "CAM 1" }); await sleep(1200);
  await click(`.pop [data-a="rpair"][data-v="REPLAY CAM 3"]`); await sleep(2200);
  check("No ar leva o replay ao programa", (await obs.req("GetSceneList")).currentProgramSceneName === "REPLAY CAM 3");
  const m = await obs.tryReq("GetMediaInputStatus", { inputName: "Replay CAM 3" });
  check("lance capturado está tocando", m?.mediaState === "OBS_MEDIA_STATE_PLAYING", m?.mediaState);
  const shot = await obs.tryReq("GetSourceScreenshot", { sourceName: "REPLAY CAM 3", imageFormat: "png", imageWidth: 480 });
  if (shot && SHOT) writeFileSync(SHOT, Buffer.from(shot.imageData.split(",")[1], "base64"));
  await click(`.pop [data-a="rpspeed"][data-v="50"]`); await sleep(700);
  check("50% muda a velocidade do replay", (await obs.req("GetInputSettings", { inputName: "Replay CAM 3" })).inputSettings.speed_percent === 50);
  await click(`.pop [data-a="rpmedia"][data-v="PAUSE"]`); await sleep(700);
  check("Pause para o replay", (await obs.req("GetMediaInputStatus", { inputName: "Replay CAM 3" })).mediaState === "OBS_MEDIA_STATE_PAUSED");
  await click(`.pop [data-a="rpmedia"][data-v="PLAY"]`); await sleep(500);
  check("botão Replay fica vermelho com o replay no ar", (await evalJs(`!!document.querySelector('.bot .b.live[data-a="pop"][data-v="replay"]')`)) === true);
  console.log(`memória do OBS: ${mem0} MB antes, ${await mem()} MB com um ângulo de 2 s`);
  await click(`.pop [data-a="rplive"]`); await sleep(2200);
  check("Voltar ao vivo devolve a entrada que estava no ar", (await obs.req("GetSceneList")).currentProgramSceneName === "CAM 1");
} finally {
  await evalJs(`(() => { closePop(); st.rpSpeed = 100; })()`);
  await obs.tryReq("SetCurrentProgramScene", { sceneName: "CAM 1" }); await sleep(900);
  await obs.tryReq("RemoveScene", { sceneName: "REPLAY CAM 3" }); await obs.tryReq("RemoveInput", { inputName: "Replay CAM 3" }); await sleep(600);
  for (const f of (await obs.tryReq("GetSourceFilterList", { sourceName: "Imagem CAM 3" }))?.filters ?? []) if (f.filterKind.startsWith("replay_filter")) await obs.tryReq("RemoveSourceFilter", { sourceName: "Imagem CAM 3", filterName: f.filterName });
  await obs.tryReq("SetCurrentPreviewScene", { sceneName: "CAM 2" }); await sleep(800);
  console.log("cenas ao final:", (await obs.req("GetSceneList")).scenes.map((x) => x.sceneName).reverse().join(" | "), `| memória ${await mem()} MB`);
}
console.log(`${pass}/${total} verificações passaram`);
obs.close(); cdp.close();
