// Click-test of the FreeMix Call return feed. Engine started with --enable-media-stream and
// --remote-debugging-port=9333, buses on, at least one call input in the preset.
// "keep" as argument leaves the return on (to watch it from another browser); otherwise everything is put back.
import { createRequire } from "node:module";
import { connect, sleep } from "./obsws.mjs";
const require = createRequire("D:/DRIVE/IA/antigravity/vmixtwste/rea/package.json");
const WebSocket = require("ws");
const targets = async () => (await (await fetch("http://127.0.0.1:9333/json")).json());
const attach = async (t) => { const c = new WebSocket(t.webSocketDebuggerUrl); await new Promise((r) => c.on("open", r)); let id = 0; const waits = new Map(); c.on("message", (raw) => { const m = JSON.parse(String(raw)); waits.get(m.id)?.(m); waits.delete(m.id); });
  return { ev: (expression) => new Promise((r) => { const i = ++id; waits.set(i, (m) => r(m.result?.exceptionDetails ? "ERRO: " + m.result.exceptionDetails.exception?.description : m.result?.result?.value)); c.send(JSON.stringify({ id: i, method: "Runtime.evaluate", params: { expression, returnByValue: true, awaitPromise: true } })); }), close: () => c.close() }; };
const mesa = await attach((await targets()).find((x) => x.url.endsWith("painel/mesa.html")));
const obs = await connect(), keep = process.argv[2] === "keep";
let pass = 0, total = 0;
const check = (name, ok, detail = "") => { total++; if (ok) pass++; console.log(`${ok ? "OK   " : "FALHA"} ${name}${detail !== "" ? "  (" + detail + ")" : ""}`); };

await mesa.ev("location.reload()"); await sleep(7500);
const inputs = (await obs.req("GetInputList")).inputs;
let call = "", id = "";
for (const i of inputs.filter((x) => x.unversionedInputKind === "browser_source")) { const m = /vdo\.ninja\/.*[?&]view=([A-Za-z0-9_]+)/.exec((await obs.req("GetInputSettings", { inputName: i.inputName })).inputSettings.url || ""); if (m) { call = i.inputName; id = m[1]; break; } }
if (!id) { console.log("Nenhuma entrada FreeMix Call neste preset."); process.exit(1); }
const before = new Map(); for (const i of inputs) { const t = await obs.tryReq("GetInputAudioTracks", { inputName: i.inputName }); if (t) before.set(i.inputName, t.inputAudioTracks); }
const vcam0 = (await obs.req("GetVirtualCamStatus")).outputActive;
try {
  await mesa.ev(`openPop("call", ${JSON.stringify(id)})`); await sleep(900);
  check("a janela da chamada tem o botão de retorno e não tem mais o link que abria a página dentro do programa", (await mesa.ev(`document.querySelector('.pop [data-a="retornoon"]')?.textContent`)) === "Ligar retorno" && (await mesa.ev(`document.querySelectorAll('.pop a[target="_blank"]').length`)) === 0);
  await mesa.ev(`document.querySelector('.pop [data-a="retornoon"]').click()`); await sleep(9000);
  const src = await obs.tryReq("GetInputSettings", { inputName: "FreeMix Retorno" }), filter = await obs.tryReq("GetSourceFilter", { sourceName: "FreeMix Bus B", filterName: "FreeMix Retorno (áudio)" });
  check("câmera virtual ligada", (await obs.req("GetVirtualCamStatus")).outputActive === true);
  check("a página de envio do retorno existe dentro do programa, para esta chamada", !!src && src.inputSettings.url.includes(`push=${id}_ret`));
  check("o barramento B toca no cabo de áudio virtual", !!filter && filter.filterEnabled && /CABLE Input/i.test(filter.filterSettings.deviceName || ""), filter?.filterSettings?.deviceName || "sem filtro");
  const tCall = (await obs.req("GetInputAudioTracks", { inputName: call })).inputAudioTracks, tOther = (await obs.req("GetInputAudioTracks", { inputName: "VT áudio" })).inputAudioTracks;
  check("mix-minus: a chamada fica fora do barramento B e as outras entradas entram", tCall["6"] === false && tOther["6"] === true, `${call}: B ${tCall["6"]}; VT áudio: B ${tOther["6"]}`);
  check("o botão mostra o retorno ligado e por onde vai o áudio", (await mesa.ev(`document.querySelector('.pop [data-a="retornooff"]')?.textContent`)) === "Retorno LIGADO" && /barramento B em CABLE Input/.test(await mesa.ev(`document.querySelector(".pop fieldset p").textContent`)));
  check("a página de envio não vira faixa do mixer", (await mesa.ev(`!!document.querySelector('.strip[data-n="FreeMix Retorno"]')`)) === false);
  // What the sender page really captured.
  await sleep(6000);
  const page = (await targets()).find((x) => x.url.includes(`push=${id}_ret`));
  let tracks = "página não encontrada";
  if (page) { const p = await attach(page); tracks = await p.ev(`(() => { const v = [...document.querySelectorAll("video")].find((e) => e.srcObject); return v ? v.srcObject.getTracks().map((t) => t.kind + "=" + t.label + " [" + t.readyState + "]").join(" | ") + " | quadro " + v.videoWidth + "x" + v.videoHeight : "sem vídeo: " + document.body.innerText.slice(0, 160).replace(/\\s+/g, " "); })()`); p.close(); }
  check("a página de envio pegou a câmera virtual e o cabo, sem pedir permissão", /video=OBS Virtual Camera.*\[live\]/.test(tracks) && /audio=.*CABLE Output.*\[live\]/.test(tracks), tracks);
  if (!keep) {
    await mesa.ev(`document.querySelector('.pop [data-a="retornooff"]').click()`); await sleep(2500);
    check("desligar remove a página de envio e o envio do barramento B ao cabo", !(await obs.tryReq("GetInputSettings", { inputName: "FreeMix Retorno" })) && !(await obs.tryReq("GetSourceFilter", { sourceName: "FreeMix Bus B", filterName: "FreeMix Retorno (áudio)" })));
  }
} finally {
  if (!keep) {
    await mesa.ev("closePop()");
    await obs.tryReq("RemoveInput", { inputName: "FreeMix Retorno" }); await obs.tryReq("RemoveSourceFilter", { sourceName: "FreeMix Bus B", filterName: "FreeMix Retorno (áudio)" });
    for (const [n, t] of before) await obs.tryReq("SetInputAudioTracks", { inputName: n, inputAudioTracks: t });
    if (!vcam0) await obs.tryReq("StopVirtualCam");
  }
}
console.log(`${pass}/${total} verificações passaram${keep ? " (retorno deixado ligado; link para assistir: https://vdo.ninja/?view=" + id + "_ret)" : ""}`);
obs.close(); mesa.close();
