// Click-test of the SSD Disk Replay system (Multi-Cam, Source Record TS, Players A/B, Events List).
// OBS engine must be running with --remote-debugging-port=9333.
import { createRequire } from "node:module";
import { connect, sleep } from "./obsws.mjs";

const require = createRequire("D:/DRIVE/IA/antigravity/vmixtwste/rea/package.json");
const WebSocket = require("ws");

const target = (await (await fetch("http://127.0.0.1:9333/json")).json()).find((t) => t.url.endsWith("painel/mesa.html"));
const cdp = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => cdp.on("open", r));

let id = 0;
const waits = new Map();
cdp.on("message", (raw) => {
  const m = JSON.parse(String(raw));
  waits.get(m.id)?.(m);
  waits.delete(m.id);
});

const evalJs = (expression) => new Promise((r) => {
  const i = ++id;
  waits.set(i, (m) => r(m.result?.result?.value ?? m.result?.exceptionDetails?.exception?.description));
  cdp.send(JSON.stringify({ id: i, method: "Runtime.evaluate", params: { expression, returnByValue: true, awaitPromise: true } }));
});

const click = (sel) => evalJs(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return "sem elemento: " + ${JSON.stringify(sel)}; el.click(); return "ok"; })()`);

const obs = await connect();
let pass = 0, total = 0;
const check = (name, ok, detail = "") => {
  total++;
  if (ok) pass++;
  console.log(`${ok ? "OK   " : "FALHA"} ${name}${detail !== "" ? "  (" + detail + ")" : ""}`);
};

try {
  await evalJs("location.reload()");
  await sleep(4000);

  // Garantir cena inicial no Programa
  await obs.req("SetCurrentProgramScene", { sceneName: "CAM 1" });
  await sleep(900);

  // 1. Botão Replay na barra inferior
  check("botão Replay disponível na barra de baixo", (await evalJs(`!!document.querySelector('.bot [data-a="pop"][data-v="replay"]')`)) === true);

  // 2. Abrir janela de Replay
  await click(`.bot [data-a="pop"][data-v="replay"]`);
  await sleep(800);
  const popText = await evalJs(`document.getElementById("pop")?.textContent || ""`);
  check("janela de Replay exibe Replay Multi-Câmera SSD & Broadcast", popText.includes("Replay Multi-Câmera") && popText.includes("Disco livre"), popText.slice(0, 80));

  // 3. Iniciar gravação de Replay em Disco (SSD)
  const btnRecTxt = await evalJs(`document.querySelector('.pop [data-a="rpdiskrec"]')?.textContent || ""`);
  check("botão Iniciar Gravação SSD presente", btnRecTxt.includes("Iniciar Gravação SSD"));

  await click(`.pop [data-a="rpdiskrec"]`);
  await sleep(2500);

  // 4. Conferir filtro no motor do OBS
  const filter = await obs.tryReq("GetSourceFilter", { sourceName: "Imagem CAM 1", filterName: "FreeMix Replay Rec" });
  check("filtro Source Record criado com formato TS no motor", filter?.filterKind === "source_record_filter" && filter.filterSettings?.rec_format === "ts", JSON.stringify(filter?.filterSettings || {}));

  // 5. Botão mudou para Parar Gravação SSD
  const btnRecTxt2 = await evalJs(`document.querySelector('.pop [data-a="rpdiskrec"]')?.textContent || ""`);
  check("estado indica GRAVANDO SSD ativo", btnRecTxt2.includes("Parar Gravação SSD"));

  // 6. Testar captura rápida de lance (-5s e -10s)
  await click(`.pop [data-a="rpquickclip"][data-v="5"]`);
  await sleep(600);
  await click(`.pop [data-a="rpquickclip"][data-v="10"]`);
  await sleep(600);
  const eventsCount = await evalJs(`st.rpDisk?.events?.length || 0`);
  check("lances rápidos -5s e -10s salvos na lista de eventos", eventsCount >= 2, `${eventsCount} lances registrados`);

  // 7. Testar marcação manual Mark IN e Mark OUT
  await click(`.pop [data-a="rpmarkin"]`);
  await sleep(1200);
  await click(`.pop [data-a="rpmarkout"]`);
  await sleep(600);
  const eventsCountAfter = await evalJs(`st.rpDisk?.events?.length || 0`);
  check("marcação manual Mark IN / Mark OUT cria lance na lista", eventsCountAfter > eventsCount, `${eventsCountAfter} lances no total`);

  // 8. Carregar lance no Player A e preparar reprodução
  await click(`.pop [data-a="rpplayera"][data-v="A"]`);
  await sleep(1500);
  const scenesList = (await obs.req("GetSceneList")).scenes.map((s) => s.sceneName);
  check("Player A cria e instancia a cena REPLAY A no motor", scenesList.includes("REPLAY A"));

  // 9. Colocar Player A no ar (PGM)
  await click(`.pop [data-a="rpplayerair"][data-v="A"]`);
  await sleep(2000);
  const currentProg = (await obs.req("GetSceneList")).currentProgramSceneName;
  check("Player A no ar comuta o Programa para REPLAY A", currentProg === "REPLAY A", `Programa: ${currentProg}`);

  // 10. Botão Replay na barra inferior acende vermelho (.b.live)
  const isLive = await evalJs(`!!document.querySelector('.bot .b.live[data-a="pop"][data-v="replay"]')`);
  check("botão Replay fica vermelho com o Player A no ar", isLive === true);

  // 11. Ajustar velocidade para 50%
  await click(`.pop [data-a="rpspeed"][data-v="50"]`);
  await sleep(600);
  const inputSet = await obs.tryReq("GetInputSettings", { inputName: "Replay Player A" });
  check("velocidade do slow-motion ajustada para 50%", inputSet?.inputSettings?.speed_percent === 50, `speed: ${inputSet?.inputSettings?.speed_percent}%`);

  // 12. Voltar ao vivo comuta de volta para CAM 1
  await click(`.pop [data-a="rplive"]`);
  await sleep(2000);
  const backProg = (await obs.req("GetSceneList")).currentProgramSceneName;
  check("Voltar ao vivo devolve a entrada ao vivo anterior", backProg === "CAM 1", `Programa devolvido para: ${backProg}`);

  // 13. Parar gravação SSD
  await click(`.bot [data-a="pop"][data-v="replay"]`);
  await sleep(600);
  await click(`.pop [data-a="rpdiskrec"]`);
  await sleep(1500);
  const filterAfter = await obs.tryReq("GetSourceFilter", { sourceName: "Imagem CAM 1", filterName: "FreeMix Replay Rec" });
  check("parar gravação SSD encerra gravação contínua no motor", filterAfter?.filterSettings?.record_mode === 0, `record_mode: ${filterAfter?.filterSettings?.record_mode}`);

} finally {
  await evalJs("closePop()");
  // Limpeza de recursos de teste
  await obs.tryReq("SetCurrentProgramScene", { sceneName: "CAM 1" });
  await obs.tryReq("RemoveScene", { sceneName: "REPLAY A" });
  await obs.tryReq("RemoveInput", { inputName: "Replay Player A" });
  await obs.tryReq("RemoveScene", { sceneName: "REPLAY B" });
  await obs.tryReq("RemoveInput", { inputName: "Replay Player B" });
  await obs.tryReq("RemoveSourceFilter", { sourceName: "Imagem CAM 1", filterName: "FreeMix Replay Rec" });
  obs.close();
  cdp.close();
}

console.log(`${pass}/${total} verificações passaram`);
