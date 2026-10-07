// Click-test of the top bar, the settings gears of the bottom bar and overlay channels 5-8.
// The engine must be running with --remote-debugging-port=9333. Leaves the production as it found it.
import { createRequire } from "node:module";
import { connect, sleep } from "./obsws.mjs";

const require = createRequire("D:/DRIVE/IA/antigravity/vmixtwste/rea/package.json");
const WebSocket = require("ws");
const targets = await (await fetch("http://127.0.0.1:9333/json")).json();
const attach = async (suffix) => {
  const t = targets.find((x) => x.url.endsWith(suffix)); if (!t) throw new Error("página não encontrada: " + suffix);
  const c = new WebSocket(t.webSocketDebuggerUrl); await new Promise((r) => c.on("open", r));
  let id = 0; const waits = new Map();
  c.on("message", (raw) => { const m = JSON.parse(String(raw)); waits.get(m.id)?.(m); waits.delete(m.id); });
  const ev = (expression) => new Promise((r) => { const i = ++id; waits.set(i, (m) => r(m.result?.result?.value ?? m.result?.exceptionDetails?.exception?.description)); c.send(JSON.stringify({ id: i, method: "Runtime.evaluate", params: { expression, returnByValue: true, awaitPromise: true } })); });
  return { ev, click: (sel) => ev(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return "sem elemento"; el.click(); return "ok"; })()`), close: () => c.close() };
};
const top = await attach("painel/topbar.html"), mesa = await attach("painel/mesa.html");
const obs = await connect();
const vendor = (requestType, requestData = {}) => obs.req("CallVendorRequest", { vendorName: "downstream-keyer", requestType, requestData }).then((r) => r.responseData);
let pass = 0, total = 0;
const check = (name, ok, detail = "") => { total++; if (ok) pass++; console.log(`${ok ? "OK   " : "FALHA"} ${name}${detail !== "" ? "  (" + detail + ")" : ""}`); };

await mesa.ev("location.reload()"); await top.ev("location.reload()"); await sleep(6000);
const preset = (await obs.req("GetSceneCollectionList")).currentSceneCollectionName;
const t = JSON.parse(await top.ev(`JSON.stringify({ on: st.on, preset: document.getElementById("preset").textContent, h: innerHeight, w: innerWidth, botoes: [...document.querySelectorAll(".b")].map((b) => b.textContent) })`));
check("barra de cima conectada e mostrando o preset em uso", t.on && t.preset === preset, `${t.preset} | ${t.w}x${t.h} | ${t.botoes.join(", ")}`);
check("barra de cima ocupa a largura toda e é baixa", t.w > 1500 && t.h < 60, `${t.w}x${t.h}`);
await top.click(`.b[data-open="presets"]:not([data-arg])`); await sleep(1200);
check("Abrir (em cima) abre a janela de presets na mesa", (await mesa.ev("st.pop")) === "presets" && (await mesa.ev(`document.getElementById("pop").textContent`)).includes(preset));
await top.click(`.b[data-open="config"]`); await sleep(1500);
const video = await obs.req("GetVideoSettings");
check("Configurar mostra o vídeo real da produção", (await mesa.ev(`document.getElementById("cf-res")?.value`)) === `${video.baseWidth}x${video.baseHeight}` && (await mesa.ev(`document.getElementById("cf-fps")?.value`)) === `${video.fpsNumerator}/${video.fpsDenominator}`, `${video.baseWidth}x${video.baseHeight}`);
await mesa.click(`.bot .cg[data-v="streamset"]`); await sleep(1500);
const sv = (await obs.req("GetStreamServiceSettings")).streamServiceSettings;
check("engrenagem do Transmitir mostra o destino configurado no motor", (await mesa.ev(`document.getElementById("cf-server")?.value`)) === (sv.server || "") && (await mesa.ev(`document.getElementById("cf-key")?.type`)) === "password", `servidor ${sv.server ? "preenchido" : "vazio"}, chave oculta`);
await mesa.click(`.bot .cg[data-v="recset"]`); await sleep(1500);
const dir = (await obs.req("GetRecordDirectory")).recordDirectory;
check("engrenagem do Gravar mostra a pasta real de gravação", (await mesa.ev(`document.getElementById("cf-dir")?.value`)) === dir, dir);
await mesa.click(`.pop [data-a="cfgrec"]`); await sleep(1200);
check("OK da gravação grava sem mudar a pasta", (await obs.req("GetRecordDirectory")).recordDirectory === dir && (await mesa.ev("st.pop")) === null);
await mesa.click(`.bot .cg[data-v="ext"]`); await sleep(400);
check("engrenagem do Externo lista as saídas", (await mesa.ev(`document.querySelectorAll('.pop [data-a="projopen"]').length`)) === 4);
await mesa.ev("closePop()");
const k = JSON.parse(await mesa.ev(`JSON.stringify({ keyers: st.keyers?.length, porEntrada: document.querySelectorAll('.tile:first-child [data-a="ov"]').length, fechar: document.querySelectorAll(".tile .x").length, entradas: document.querySelectorAll(".tile").length })`));
check("oito canais de overlay no motor e em cada entrada", k.keyers === 8 && k.porEntrada === 8, JSON.stringify(k));
const scenes = (await obs.req("GetSceneList")).scenes.map((x) => x.sceneName);
if (scenes.includes("GC TARJA")) {
  await mesa.click(`.tile [data-a="ov"][data-k="4"][data-v="GC TARJA"]`); await sleep(1700);
  const on = (await vendor("dsk_get_scene", { dsk_name: "5" })).scene;
  check("overlay 5 liga uma entrada por cima do programa", on === "GC TARJA", `canal 5 = ${on || "-"}`);
  await mesa.click(`.tile [data-a="ov"][data-k="4"][data-v="GC TARJA"]`); await sleep(1700);
  check("overlay 5 desliga pelo mesmo botão", !(await vendor("dsk_get_scene", { dsk_name: "5" })).scene);
}
const stats = await obs.req("GetStats");
console.log(`memória do motor: ${Math.round(stats.memoryUsage)} MB | render ${stats.averageFrameRenderTime.toFixed(1)} ms | entradas: ${scenes.reverse().join(" | ")}`);
console.log(`${pass}/${total} verificações passaram`);
obs.close(); top.close(); mesa.close();
