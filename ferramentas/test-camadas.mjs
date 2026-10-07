// Click-test of "inputs instead of scenes": layers of an input, audio joined to an input, and the automatic-mix
// arrows as a real switch. Engine with --remote-debugging-port=9333 and the buses on. Puts everything back at the end.
import { createRequire } from "node:module";
import { connect, sleep } from "./obsws.mjs";
const require = createRequire("D:/DRIVE/IA/antigravity/vmixtwste/rea/package.json");
const WebSocket = require("ws");
const t = (await (await fetch("http://127.0.0.1:9333/json")).json()).find((x) => x.url.endsWith("painel/mesa.html"));
const c = new WebSocket(t.webSocketDebuggerUrl); await new Promise((r) => c.on("open", r));
let id = 0; const waits = new Map(); c.on("message", (raw) => { const m = JSON.parse(String(raw)); waits.get(m.id)?.(m); waits.delete(m.id); });
const ev = (expression) => new Promise((r) => { const i = ++id; waits.set(i, (m) => r(m.result?.exceptionDetails ? "ERRO: " + m.result.exceptionDetails.exception?.description : m.result?.result?.value)); c.send(JSON.stringify({ id: i, method: "Runtime.evaluate", params: { expression, returnByValue: true, awaitPromise: true } })); });
const click = (sel) => ev(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return "sem elemento"; el.click(); return "ok"; })()`);
const choose = (sel, value) => ev(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return "sem elemento"; el.value = ${JSON.stringify(value)}; el.dispatchEvent(new Event("change", { bubbles: true })); return "ok"; })()`);
const levels = new Map();
const obs = await connect({ events: 65536, onEvent: (type, d) => { if (type === "InputVolumeMeters") for (const i of d.inputs) levels.set(i.inputName, Math.max(0, ...i.inputLevelsMul.map((ch) => ch[1]))); } });
const level = async (n) => { levels.delete(n); await sleep(800); return levels.get(n) ?? -1; };
const IN = "CAM 2", TOP = "PLACAR", AUD = "VT áudio", BUS = "FreeMix Barramentos";
const layer = async () => (await obs.req("GetSceneItemList", { sceneName: IN })).sceneItems.find((i) => i.sourceName === TOP);
let pass = 0, total = 0;
const check = (name, ok, detail = "") => { total++; if (ok) pass++; console.log(`${ok ? "OK   " : "FALHA"} ${name}${detail !== "" ? "  (" + detail + ")" : ""}`); };

await ev("location.reload()"); await sleep(7000);
const prog0 = (await obs.req("GetCurrentProgramScene")).currentProgramSceneName, video = await obs.req("GetVideoSettings"), W = video.baseWidth, H = video.baseHeight;
try {
  await click(`.tile [data-a="menu"][data-v="${IN}"]`); await sleep(400);
  check("o menu da entrada oferece Camadas e Juntar áudio", (await ev(`!!document.querySelector('.pop [data-a="layers"]') && !!document.querySelector('.pop [data-a="audioadd"]')`)) === true);
  await click(`.pop [data-a="layers"]`); await sleep(900);
  check("a janela de camadas abre vazia", (await ev(`document.querySelectorAll(".lyr").length`)) === 0 && (await ev(`!!document.getElementById("ly-src")`)) === true);
  await choose("#ly-src", TOP); await sleep(1200);
  let it = await layer();
  check("escolher outra entrada põe ela por cima, em quadro no canto", !!it && it.sourceType === "OBS_SOURCE_TYPE_SCENE" && Math.abs(it.sceneItemTransform.boundsWidth - 0.3 * W) < 2 && (await ev(`document.querySelector(".lyr select").value`)) === "tr", it ? `largura ${it.sceneItemTransform.boundsWidth}` : "sem item");
  await choose(".lyr select", "full"); await sleep(900); it = await layer();
  check("trocar a posição para Tela cheia muda a camada no motor", Math.abs(it.sceneItemTransform.boundsWidth - W) < 2 && Math.abs(it.sceneItemTransform.positionX) < 2);
  await click(`.lyr [data-a="layertoggle"]`); await sleep(800); it = await layer();
  check("Ligada / Desligada esconde a camada", it.sceneItemEnabled === false && (await ev(`document.querySelector('.lyr [data-a="layertoggle"]').textContent`)) === "Desligada");
  await click(`.lyr [data-a="layerdel"]`); await sleep(900);
  check("Remover tira a camada da entrada", !(await layer()) && (await ev(`document.querySelectorAll(".lyr").length`)) === 0);
  await ev("closePop()");

  await click(`.tile [data-a="menu"][data-v="${IN}"]`); await sleep(400); await click(`.pop [data-a="audioadd"]`); await sleep(500);
  await ev(`document.getElementById("aa-src").value = ${JSON.stringify(AUD)}`); await click(`.pop [data-a="audioaddgo"]`); await sleep(1800);
  const joined = (await obs.req("GetSceneItemList", { sceneName: IN })).sceneItems.find((i) => i.sourceName === AUD);
  await obs.req("SetCurrentProgramScene", { sceneName: IN }); await sleep(1500);
  const lj = await level(AUD);
  check("Juntar áudio: o áudio escolhido passa a tocar quando esta entrada está no ar", !!joined && lj > 0.01, `nível ${lj.toFixed(4)}`);
  if (joined) await obs.req("RemoveSceneItem", { sceneName: IN, sceneItemId: joined.sceneItemId });

  await obs.req("SetCurrentProgramScene", { sceneName: "CAM 1" }); await sleep(1500);
  const quiet = await level(AUD);
  check("com a mistura automática ligada, a entrada fora do ar fica muda", quiet < 0.0001, `nível ${quiet}`);
  await click(`.strip[data-n="${AUD}"] [data-a="follow"]`); await sleep(1800);
  const la = await level(AUD), lm = await level("FreeMix Master");
  check("desligar a mistura automática deixa o áudio sempre no ar e a seta apaga", la > 0.01 && lm > 0.01 && (await ev(`document.querySelector('.strip[data-n="${AUD}"] [data-a="follow"]').classList.contains("lit")`)) === false, `entrada ${la.toFixed(4)}, Master ${lm.toFixed(4)}`);
  await click(`.strip[data-n="${AUD}"] [data-a="follow"]`); await sleep(1800);
  const back = await level(AUD);
  check("ligar de novo volta a acompanhar o vídeo", back < 0.0001 && (await ev(`document.querySelector('.strip[data-n="${AUD}"] [data-a="follow"]').classList.contains("lit")`)) === true, `nível ${back}`);
} finally {
  await ev("closePop()");
  const a = await layer(); if (a) await obs.tryReq("RemoveSceneItem", { sceneName: IN, sceneItemId: a.sceneItemId });
  for (const i of (await obs.tryReq("GetSceneItemList", { sceneName: IN }))?.sceneItems || []) if (i.sourceName === AUD) await obs.tryReq("RemoveSceneItem", { sceneName: IN, sceneItemId: i.sceneItemId });
  for (const i of (await obs.tryReq("GetSceneItemList", { sceneName: BUS }))?.sceneItems || []) if (i.sourceName === AUD) await obs.tryReq("RemoveSceneItem", { sceneName: BUS, sceneItemId: i.sceneItemId });
  await obs.tryReq("SetCurrentProgramScene", { sceneName: prog0 });
}
console.log(`${pass}/${total} verificações passaram`);
obs.close(); c.close();
