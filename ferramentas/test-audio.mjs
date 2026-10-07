// Click-test of the mixer: buses (Master, A, B), input strips, audio settings window, bus manager.
// Engine with --remote-debugging-port=9333. Uses the demo input "VT áudio". Leaves the buses ON (that is the feature);
// filters, delay, balance, routing of the test input and the Program scene are put back at the end.
import { createRequire } from "node:module";
import { connect, sleep } from "./obsws.mjs";
const require = createRequire("D:/DRIVE/IA/antigravity/vmixtwste/rea/package.json");
const WebSocket = require("ws");
const t = (await (await fetch("http://127.0.0.1:9333/json")).json()).find((x) => x.url.endsWith("painel/mesa.html"));
const c = new WebSocket(t.webSocketDebuggerUrl); await new Promise((r) => c.on("open", r));
let id = 0; const waits = new Map(); c.on("message", (raw) => { const m = JSON.parse(String(raw)); waits.get(m.id)?.(m); waits.delete(m.id); });
const ev = (expression) => new Promise((r) => { const i = ++id; waits.set(i, (m) => r(m.result?.exceptionDetails ? "ERRO: " + m.result.exceptionDetails.exception?.description : m.result?.result?.value)); c.send(JSON.stringify({ id: i, method: "Runtime.evaluate", params: { expression, returnByValue: true, awaitPromise: true } })); });
const click = (sel) => ev(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return "sem elemento"; el.click(); return "ok"; })()`);
const slide = (fx, k, v) => ev(`(() => { const el = document.querySelector('[data-fx="${fx}"][data-k="${k}"]'); if (!el) return "sem elemento"; el.value = "${v}"; el.dispatchEvent(new Event("input", { bubbles: true })); return "ok"; })()`);
const levels = new Map();
const obs = await connect({ events: 65536, onEvent: (type, d) => { if (type === "InputVolumeMeters") for (const i of d.inputs) levels.set(i.inputName, Math.max(0, ...i.inputLevelsMul.map((ch) => ch[1]))); } });
const IN = "VT áudio", strip = `.strip[data-n="${IN}"]`, MASTER = "FreeMix Master", BUSA = "FreeMix Bus A", out = (n) => `.strip.out[data-n="${n}"]`;
const filter = async (name, src = IN) => (await obs.tryReq("GetSourceFilter", { sourceName: src, filterName: name }));
const tracks = async (n) => (await obs.req("GetInputAudioTracks", { inputName: n })).inputAudioTracks;
const level = async (n) => { levels.delete(n); await sleep(700); return levels.get(n) ?? -1; };
let pass = 0, total = 0;
const check = (name, ok, detail = "") => { total++; if (ok) pass++; console.log(`${ok ? "OK   " : "FALHA"} ${name}${detail !== "" ? "  (" + detail + ")" : ""}`); };

await ev("location.reload()"); await sleep(7000);
const prog0 = (await obs.req("GetCurrentProgramScene")).currentProgramSceneName, bal0 = (await obs.req("GetInputAudioBalance", { inputName: IN })).inputAudioBalance;
try {
  if ((await ev(`!!document.querySelector(".busoff")`)) === true) {
    check("sem barramentos, a seção OUTPUTS avisa e oferece ligar", (await ev(`document.querySelector(".busoff button")?.dataset.a`)) === "busmake");
    await click(".busoff button"); await sleep(6000);
  }
  const kinds = (await obs.req("GetInputList")).inputs.filter((i) => i.unversionedInputKind === "mix-track-to-source").map((i) => i.inputName).sort().join(",");
  check("Master, A e B existem no motor como barramentos", kinds === "FreeMix Bus A,FreeMix Bus B,FreeMix Master", kinds);
  check("as três faixas de saída aparecem em OUTPUTS, e a cena dos barramentos não vira entrada", (await ev(`[...document.querySelectorAll(".strip.out.live")].map((e) => e.querySelector(".hd").textContent).join(",")`)) === "Master,A,B" && (await ev(`[...document.querySelectorAll(".tile")].some((e) => /Barramentos/.test(e.textContent))`)) === false);
  const tIn = await tracks(IN);
  check("com barramentos, a entrada não vai mais direto às trilhas de saída", !tIn["1"] && !tIn["2"] && !tIn["3"], JSON.stringify(tIn));
  check("faixa de entrada com engrenagem, S, setas, liga/desliga e M/A/B", (await ev(`[...document.querySelectorAll('${strip} button')].map((b) => b.dataset.a + (b.dataset.k || "")).join(",")`)) === "audioset,solo,follow,mute,bus4,bus5,bus6");
  const geo = JSON.parse(await ev(`JSON.stringify((() => { const m = document.getElementById("mixer"), r = [...m.querySelectorAll(".strip")].map((e) => e.getBoundingClientRect()); return { h: Math.max(...r.map((x) => x.height)), rows: new Set(r.map((x) => Math.round(x.top))).size, secs: [...m.querySelectorAll(".sec")].map((e) => e.textContent).join(","), scroll: m.scrollWidth > m.clientWidth + 1 }; })())`));
  check("faixas baixas de tamanho fixo, OUTPUTS antes de INPUTS, sem rolagem de lado", geo.h <= 190 && geo.secs === "OUTPUTS,INPUTS" && !geo.scroll, JSON.stringify(geo));
  check("a faixa mostra o número da entrada", /^\d+$/.test(await ev(`document.querySelector('${strip} .hd b')?.textContent || ""`)));

  // Signal path: the test tone on Program, sent to Master only.
  await obs.req("SetInputAudioTracks", { inputName: IN, inputAudioTracks: { "4": true, "5": false, "6": false } });
  await obs.req("SetCurrentProgramScene", { sceneName: "VT" }); await sleep(1500);
  const lm = await level(MASTER), la = await level(BUSA);
  check("o tom da entrada chega ao Master e não ao barramento A", lm > 0.01 && la >= 0 && la < 0.001, `Master ${lm.toFixed(4)}, A ${la.toFixed(4)}`);
  check("o medidor do Master se mexe na tela", +(await ev(`getComputedStyle(document.querySelector('${out(MASTER)} .mt')).getPropertyValue("--l")`)) > 0);
  await click(`${out(MASTER)} [data-a="mute"]`); await sleep(500);
  const muted = (await obs.req("GetInputMute", { inputName: MASTER })).inputMuted, lmm = await level(MASTER);
  check("alto-falante do Master desliga a saída (nível medido zera) e o cabeçalho apaga", muted === true && lmm < 0.0001 && (await ev(`document.querySelector('${out(MASTER)}').classList.contains("off")`)) === true, `nível ${lmm}`);
  await click(`${out(MASTER)} [data-a="mute"]`); await sleep(500);
  check("alto-falante do Master liga de novo", (await obs.req("GetInputMute", { inputName: MASTER })).inputMuted === false);
  const kA = await ev(`document.querySelector('${strip} .bt button:nth-child(2)').dataset.k`);
  await click(`${strip} [data-a="bus"][data-k="${kA}"]`); await sleep(700);
  const la2 = await level(BUSA);
  check("A na entrada envia para o barramento A e o botão acende", (await tracks(IN))[kA] === true && la2 > 0.01 && (await ev(`document.querySelector('${strip} [data-a="bus"][data-k="${kA}"]').classList.contains("on")`)) === true, `A ${la2.toFixed(4)}`);
  await click(`${out(BUSA)} [data-a="bus"]`); await sleep(600);
  check("M no barramento A envia a mixagem dele ao Master", (await tracks(BUSA))["4"] === true && (await ev(`document.querySelector('${out(BUSA)} [data-a="bus"]').classList.contains("on")`)) === true);
  await click(`${out(BUSA)} [data-a="bus"]`); await sleep(500);
  await click(`${out(BUSA)} [data-a="solo"]`); await sleep(600);
  check("S no barramento A liga a escuta dele no monitor", (await obs.req("GetInputAudioMonitorType", { inputName: BUSA })).monitorType === "OBS_MONITORING_TYPE_MONITOR_AND_OUTPUT");
  await click(`${out(BUSA)} [data-a="solo"]`); await sleep(500);
  await click(`${strip} [data-a="bus"][data-k="${kA}"]`); await sleep(500);

  await click(`${strip} [data-a="solo"]`); await sleep(700);
  check("S na entrada liga a escuta no monitor", (await obs.req("GetInputAudioMonitorType", { inputName: IN })).monitorType === "OBS_MONITORING_TYPE_MONITOR_AND_OUTPUT");
  await click(`${strip} [data-a="solo"]`); await sleep(600);
  check("S de novo desliga a escuta", (await obs.req("GetInputAudioMonitorType", { inputName: IN })).monitorType === "OBS_MONITORING_TYPE_NONE");
  await ev(`(() => { const el = document.querySelector('[data-pan="${IN}"]'); el.value = "0.25"; el.dispatchEvent(new Event("input", { bubbles: true })); })()`); await sleep(600);
  check("pan da faixa muda o balanço da entrada", (await obs.req("GetInputAudioBalance", { inputName: IN })).inputAudioBalance === 0.25);

  await click(`${strip} [data-a="audioset"]`); await sleep(1500);
  check("engrenagem abre as configurações de áudio com as abas", (await ev(`[...document.querySelectorAll(".add .types button")].map((b) => b.textContent).join(",")`)) === "Geral,EQ,Compressor,Noise Gate,Limitador" && (await ev(`document.querySelectorAll('.add .form input[type="range"]').length`)) === 3);
  await slide("gain", "db", 6); await sleep(900);
  check("Gain cria o filtro de ganho no motor", (await filter("FreeMix Ganho"))?.filterSettings?.db === 6);
  await slide("p", "delay", 120); await sleep(700);
  check("Atraso muda o atraso de áudio da entrada", (await obs.req("GetInputAudioSyncOffset", { inputName: IN })).inputAudioSyncOffset === 120);
  await click(`.add .types [data-v="comp"]`); await sleep(300);
  await slide("comp", "ratio", 4); await sleep(900); await slide("comp", "threshold", -24); await sleep(900);
  const comp = await filter("FreeMix Compressor");
  check("Compressor: razão e limiar chegam ao motor", comp?.filterKind === "compressor_filter" && comp.filterSettings.ratio === 4 && comp.filterSettings.threshold === -24 && comp.filterEnabled === true, JSON.stringify(comp?.filterSettings));
  await ev(`(() => { const el = document.querySelector('[data-fxon="comp"]'); el.checked = false; el.dispatchEvent(new Event("change", { bubbles: true })); })()`); await sleep(800);
  check("desmarcar desliga o compressor sem apagar o ajuste", (await filter("FreeMix Compressor"))?.filterEnabled === false);
  await click(`.add .types [data-v="gate"]`); await sleep(300); await slide("gate", "open_threshold", -30); await sleep(900);
  check("Noise Gate cria o filtro", (await filter("FreeMix Noise Gate"))?.filterSettings?.open_threshold === -30);
  await click(`.add .types [data-v="eq"]`); await sleep(300); await slide("eq", "low", 3); await sleep(900);
  check("EQ de 3 bandas chega ao motor", (await filter("FreeMix EQ"))?.filterSettings?.low === 3);
  await ev("closePop()");

  await click(`${out(MASTER)} [data-a="audioset"]`); await sleep(1500);
  await click(`.add .types [data-v="lim"]`); await sleep(300); await slide("lim", "threshold", -3); await sleep(900);
  const lim = await filter("FreeMix Limitador", MASTER);
  check("engrenagem do Master: o limitador entra na saída", lim?.filterKind === "limiter_filter" && lim.filterSettings.threshold === -3, JSON.stringify(lim?.filterSettings));
  check("a janela do barramento oferece desligar os barramentos", (await ev(`!!document.querySelector('.pop [data-a="busdrop"]')`)) === true);
  await ev("closePop()");

  check("ícones da direita: menu, estatísticas, atalhos", (await ev(`[...document.querySelectorAll('.bot .g.r .ib[data-a="pop"]')].map((b) => b.dataset.v).join(",")`)) === "mainmenu,stats,shortcuts");
  await click(`.bot [data-v="mainmenu"]`); await sleep(400); await click(`.pop [data-v="busman"]`); await sleep(500);
  const sq = `.bmr[data-n="${IN}"] .sq:nth-of-type(3)`;
  check("menu abre o gerenciador de barramentos com uma linha por entrada", (await ev(`document.querySelectorAll(".bmr[data-n]").length`)) >= 1 && (await ev(`document.querySelectorAll('.bmr[data-n="${IN}"] .sq').length`)) === 3);
  const b0 = (await tracks(IN))["6"];
  await ev(`document.querySelectorAll('.bmr[data-n="${IN}"] .sq')[2].click()`); await sleep(700);
  check("quadrado B do gerenciador liga o envio ao barramento B e acende", (await tracks(IN))["6"] === !b0 && (await ev(`document.querySelectorAll('.bmr[data-n="${IN}"] .sq')[2].classList.contains("on")`)) === !b0);
  await ev(`document.querySelectorAll('.bmr[data-n="${IN}"] .sq')[2].click()`); await sleep(500);
} finally {
  await ev("closePop()");
  for (const n of ["FreeMix Ganho", "FreeMix EQ", "FreeMix Compressor", "FreeMix Noise Gate"]) await obs.tryReq("RemoveSourceFilter", { sourceName: IN, filterName: n });
  await obs.tryReq("RemoveSourceFilter", { sourceName: MASTER, filterName: "FreeMix Limitador" });
  await obs.tryReq("SetInputAudioSyncOffset", { inputName: IN, inputAudioSyncOffset: 0 }); await obs.tryReq("SetInputAudioBalance", { inputName: IN, inputAudioBalance: bal0 });
  await obs.tryReq("SetInputAudioTracks", { inputName: IN, inputAudioTracks: { "4": true, "5": false, "6": false } }); await obs.tryReq("SetInputAudioMonitorType", { inputName: IN, monitorType: "OBS_MONITORING_TYPE_NONE" });
  await obs.tryReq("SetInputMute", { inputName: MASTER, inputMuted: false }); await obs.tryReq("SetInputAudioMonitorType", { inputName: BUSA, monitorType: "OBS_MONITORING_TYPE_NONE" });
  await obs.tryReq("SetCurrentProgramScene", { sceneName: prog0 });
}
console.log(`${pass}/${total} verificações passaram`);
obs.close(); c.close();
