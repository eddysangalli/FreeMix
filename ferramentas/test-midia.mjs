// Click-test of the media bar (first row of the panel, under Preview and Output). Engine with
// --remote-debugging-port=9333. Uses the media of the input "VT". Puts Program and playback back at the end.
import { createRequire } from "node:module";
import { connect, sleep } from "./obsws.mjs";
const require = createRequire("D:/DRIVE/IA/antigravity/vmixtwste/rea/package.json");
const WebSocket = require("ws");
const t = (await (await fetch("http://127.0.0.1:9333/json")).json()).find((x) => x.url.endsWith("painel/mesa.html"));
const c = new WebSocket(t.webSocketDebuggerUrl); await new Promise((r) => c.on("open", r));
let id = 0; const waits = new Map(); c.on("message", (raw) => { const m = JSON.parse(String(raw)); waits.get(m.id)?.(m); waits.delete(m.id); });
const ev = (expression) => new Promise((r) => { const i = ++id; waits.set(i, (m) => r(m.result?.exceptionDetails ? "ERRO: " + m.result.exceptionDetails.exception?.description : m.result?.result?.value)); c.send(JSON.stringify({ id: i, method: "Runtime.evaluate", params: { expression, returnByValue: true, awaitPromise: true } })); });
const click = (sel) => ev(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return "sem elemento"; el.click(); return "ok"; })()`);
const obs = await connect(), SCENE = process.argv[2] || "VT";
let pass = 0, total = 0;
const check = (name, ok, detail = "") => { total++; if (ok) pass++; console.log(`${ok ? "OK   " : "FALHA"} ${name}${detail !== "" ? "  (" + detail + ")" : ""}`); };

await ev("location.reload()"); await sleep(7000);
const prog0 = (await obs.req("GetCurrentProgramScene")).currentProgramSceneName;
const errors = []; await ev(`window.__errs = []; window.addEventListener("error", (e) => window.__errs.push(e.message)); "ok"`);
let name = "";
try {
  await obs.req("SetCurrentProgramScene", { sceneName: SCENE }); await sleep(2200);
  name = await ev(`mbState.pgm.name`);
  const status = async () => await obs.req("GetMediaInputStatus", { inputName: name });
  const s0 = name ? await status() : null;
  check("com uma mídia no Output, a barra da direita liga e mostra a duração", !!name && (await ev(`!document.getElementById("mb-pgm").classList.contains("disabled")`)) === true && s0?.mediaDuration > 0 && /^(\d\d:)?\d\d:\d\d$/.test(await ev(`document.getElementById("mb-pgm-dur").textContent`)), `${name}, ${s0?.mediaDuration} ms, ${await ev(`document.getElementById("mb-pgm-dur").textContent`)}`);
  if (s0?.mediaState !== "OBS_MEDIA_STATE_PLAYING") { await obs.req("TriggerMediaInputAction", { inputName: name, mediaAction: "OBS_WEBSOCKET_MEDIA_INPUT_ACTION_PLAY" }); await sleep(800); }
  const a = await ev(`document.getElementById("mb-pgm-cur").textContent`); await sleep(2300); const b = await ev(`document.getElementById("mb-pgm-cur").textContent`);
  check("o tempo decorrido anda enquanto toca", a !== b, `${a} -> ${b}`);
  await click(`#mb-pgm-play`); await sleep(900);
  check("botão de pausa pausa a mídia do Output", (await status()).mediaState === "OBS_MEDIA_STATE_PAUSED" && (await ev(`document.getElementById("mb-pgm-play").textContent`)) === "▶", (await status()).mediaState);
  await click(`#mb-pgm-play`); await sleep(900);
  check("o mesmo botão volta a tocar", (await status()).mediaState === "OBS_MEDIA_STATE_PLAYING");
  const dur = (await status()).mediaDuration;
  // Drag of the position handle: press at 70 % of the track and release there.
  await ev(`(() => { const w = document.getElementById("mb-pgm-wrap"), r = w.getBoundingClientRect(), x = r.left + r.width * 0.7, y = r.top + r.height / 2; w.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true, clientX: x, clientY: y })); window.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, clientX: x, clientY: y })); })()`); await sleep(900);
  const cur = (await status()).mediaCursor, errs = await ev(`window.__errs.join(" | ")`);
  check("arrastar a posição leva a mídia para o ponto solto", !errs && cur >= dur * 0.7 - 300 && cur <= dur * 0.7 + 1500, `pedido ${Math.round(dur * 0.7)} ms, ficou em ${cur} ms${errs ? ", erro na página: " + errs : ""}`);
  check("depois de soltar, a barra volta a acompanhar a mídia", (await ev(`mbState.pgm.dragging`)) === false);
  await click(`[data-a="mb_restart"][data-side="pgm"]`); await sleep(900);
  check("Reiniciar volta a mídia para o começo", (await status()).mediaCursor < 2500, `${(await status()).mediaCursor} ms`);
  const pv = (await obs.req("GetCurrentPreviewScene")).currentPreviewSceneName;
  check("o lado do Preview segue a entrada do Preview", (await ev(`mbState.pv.name !== "" || document.getElementById("mb-pv").classList.contains("disabled")`)) === true, `Preview: ${pv}, mídia: ${(await ev("mbState.pv.name")) || "nenhuma"}`);
  check("vídeo avulso não mostra anterior / próximo", (await ev(`document.getElementById("mb-pgm-next").hidden && document.getElementById("mb-pgm-prev").hidden`)) === true);
  if ((await obs.req("GetSceneList")).scenes.some((x) => x.sceneName === "PLAYLIST")) {
    await obs.req("SetCurrentProgramScene", { sceneName: "PLAYLIST" }); await sleep(2200);
    const list = await ev(`mbState.pgm.name`);
    check("com a playlist no Output aparecem anterior e próximo", !!list && (await ev(`!document.getElementById("mb-pgm-next").hidden && !document.getElementById("mb-pgm-prev").hidden`)) === true, list);
    await sleep(4500);
    const lt = await ev(`document.getElementById("mb-pgm-list").textContent`);
    check("a playlist mostra a posição na lista, o tempo total e quanto falta", /lista \d+\/\d+ · total \d\d:\d\d(:\d\d)? · falta \d\d:\d\d/.test(lt), lt.trim());
    await click(`#mb-pgm-next`); await sleep(900);
    check("próximo é aceito pela lista, sem erro na página", (await ev(`window.__errs.join(" | ")`)) === "" && (await ev(`document.getElementById("toast").className.includes("err")`)) === false, (await obs.tryReq("GetMediaInputStatus", { inputName: list }))?.mediaState);
  }
} finally {
  await obs.tryReq("SetCurrentProgramScene", { sceneName: prog0 });
}
console.log(`${pass}/${total} verificações passaram`);
obs.close(); c.close();
