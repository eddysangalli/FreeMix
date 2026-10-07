// Click-test of the extra streaming destinations, with nothing leaving the machine: three local RTMP sinks play the
// part of the streaming services. Engine with --remote-debugging-port=9333.
// The owner's real streaming settings are read into memory, replaced by a local address for the test and put back
// at the end, whatever happens; they are never printed. The test refuses to run if a stream is already on air.
import { createRequire } from "node:module";
import { connect, sleep } from "./obsws.mjs";
import { startSink } from "./rtmp-teste.mjs";
const require = createRequire("D:/DRIVE/IA/antigravity/vmixtwste/rea/package.json");
const WebSocket = require("ws");
const t = (await (await fetch("http://127.0.0.1:9333/json")).json()).find((x) => x.url.endsWith("painel/mesa.html"));
const c = new WebSocket(t.webSocketDebuggerUrl); await new Promise((r) => c.on("open", r));
let id = 0; const waits = new Map(); c.on("message", (raw) => { const m = JSON.parse(String(raw)); waits.get(m.id)?.(m); waits.delete(m.id); });
const ev = (expression) => new Promise((r) => { const i = ++id; waits.set(i, (m) => r(m.result?.exceptionDetails ? "ERRO: " + m.result.exceptionDetails.exception?.description : m.result?.result?.value)); c.send(JSON.stringify({ id: i, method: "Runtime.evaluate", params: { expression, returnByValue: true, awaitPromise: true } })); });
const click = (sel) => ev(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return "sem elemento"; el.click(); return "ok"; })()`);
const fill = (idv, value) => ev(`(() => { const el = document.getElementById(${JSON.stringify(idv)}); if (!el) return "sem campo"; if (el.type === "checkbox") el.checked = ${JSON.stringify(value)} === true; else el.value = ${JSON.stringify(value)}; return "ok"; })()`);
const obs = await connect();
const fmx = async (type, data = {}) => (await obs.tryReq("CallVendorRequest", { vendorName: "freemix", requestType: type, requestData: data }))?.responseData;
let pass = 0, total = 0;
const check = (name, ok, detail = "") => { total++; if (ok) pass++; console.log(`${ok ? "OK   " : "FALHA"} ${name}${detail !== "" ? "  (" + detail + ")" : ""}`); };

if ((await obs.req("GetStreamStatus")).outputActive) { console.log("Há uma transmissão no ar: o teste não roda."); process.exit(1); }
const first = await fmx("get_destinations");
if (!first) { console.log("FALHA o programa não responde aos pedidos de destinos (executável sem o multistream?)"); process.exit(1); }
const real = await obs.req("GetStreamServiceSettings");                     // kept in memory only
const savedDest = first.destinations.map((d) => ({ name: d.name, server: d.server, key: d.key, enabled: d.enabled }));
const [main, two, three] = await Promise.all([startSink(19351), startSink(19352), startSink(19353)]);
const kb = (s) => Math.round(s.stats.bytes / 1024) + " kB";
try {
  await obs.req("SetStreamServiceSettings", { streamServiceType: "rtmp_custom", streamServiceSettings: { server: "rtmp://127.0.0.1:19351/live", key: "principal", use_auth: false } });
  const now = await obs.req("GetStreamServiceSettings");
  if (now.streamServiceSettings.server !== "rtmp://127.0.0.1:19351/live") throw new Error("o destino principal não ficou local; teste interrompido");
  await ev("location.reload()"); await sleep(7500);

  await ev(`openPop("streamset")`); await sleep(1200);
  check("a janela de transmissão mostra os destinos 2 a 5 como abas de verdade", (await ev(`document.querySelectorAll('.add .types [data-a="desttab"]').length`)) === 5 && (await ev(`document.querySelectorAll(".add .types .off").length`)) === 0);
  for (const [tab, name, port, key] of [[1, "Reserva", 19352, "chave-dois"], [2, "Parceiro", 19353, "chave-tres"]]) {
    await click(`.add .types [data-v="${tab}"]`); await sleep(300);
    await fill("ds-name", name); await fill("ds-server", `rtmp://127.0.0.1:${port}/live`); await fill("ds-key", key); await fill("ds-on", true);
    await click(`[data-a="destsave"]`); await sleep(900);
  }
  const saved = (await fmx("get_destinations")).destinations;
  check("os dois destinos ficam gravados no programa", saved[0].name === "Reserva" && saved[0].enabled && saved[1].server.endsWith(":19353/live") && saved[1].enabled, saved.map((d) => d.name || "-").join(", "));
  check("parados enquanto a transmissão não começa", saved[0].state === "idle" && two.stats.connections === 0);

  await obs.req("StartStream"); await sleep(9000);
  const live = (await fmx("get_destinations")).destinations;
  check("a transmissão principal chega ao destino 1", main.stats.published === 1 && main.stats.key === "principal" && main.stats.bytes > 50000, kb(main));
  check("o destino 2 entra no ar junto, com a chave dele", two.stats.published === 1 && two.stats.key === "chave-dois" && two.stats.bytes > 50000 && live[0].state === "live", `${kb(two)}, estado ${live[0].state}`);
  check("o destino 3 também", three.stats.published === 1 && three.stats.key === "chave-tres" && three.stats.bytes > 50000 && live[1].state === "live", `${kb(three)}, estado ${live[1].state}`);
  check("vídeo e áudio chegam aos três", [main, two, three].every((s) => s.stats.video > 0 && s.stats.audio > 0));
  await sleep(1200);
  check("as abas mostram quem está no ar", (await ev(`[...document.querySelectorAll('.add .types .dlive small')].map((e) => e.textContent).join(",")`)) === "NO AR,NO AR,NO AR", await ev(`[...document.querySelectorAll('.add .types button')].map((e) => e.textContent.trim()).join(" | ")`));

  await click(`.add .types [data-v="1"]`); await sleep(300); await fill("ds-on", false); await click(`[data-a="destsave"]`); await sleep(2500);
  const b3 = three.stats.bytes, b1 = main.stats.bytes; await sleep(2000);
  check("desligar o destino 2 com a transmissão no ar derruba só ele", two.stats.open === 0 && three.stats.bytes > b3 && main.stats.bytes > b1 && (await fmx("get_destinations")).destinations[0].state === "idle");
  await click(`.add .types [data-v="1"]`); await sleep(300); await fill("ds-on", true); await click(`[data-a="destsave"]`); await sleep(5000);
  check("ligar de novo no ar faz o destino 2 voltar na hora", two.stats.published === 2 && two.stats.open === 1 && (await fmx("get_destinations")).destinations[0].state === "live");

  await click(`.add .types [data-v="3"]`); await sleep(300);
  await fill("ds-name", "Fora do ar"); await fill("ds-server", "rtmp://127.0.0.1:19399/live"); await fill("ds-key", "x"); await fill("ds-on", true); await click(`[data-a="destsave"]`); await sleep(7000);
  const bad = (await fmx("get_destinations")).destinations[2];
  check("um destino que não responde aparece com erro, e os outros seguem no ar", bad.state === "error" && bad.error.length > 0 && three.stats.open === 1 && main.stats.open === 1, `${bad.state}: ${bad.error}`);

  await obs.req("StopStream"); await sleep(4000);
  const after = (await fmx("get_destinations")).destinations;
  check("parar a transmissão para todos os destinos", main.stats.open === 0 && two.stats.open === 0 && three.stats.open === 0 && after.every((d) => d.state !== "live"), after.map((d) => d.state).join(","));
} finally {
  if ((await obs.req("GetStreamStatus")).outputActive) { await obs.tryReq("StopStream"); await sleep(3000); }
  // A stream that was never configured comes back as an empty object, which the control server refuses to set:
  // in that case the address and the key are written back empty.
  const never = Object.keys(real.streamServiceSettings || {}).length === 0;
  const put = never ? { streamServiceType: "rtmp_custom", streamServiceSettings: { server: "", key: "", use_auth: false } } : { streamServiceType: real.streamServiceType, streamServiceSettings: real.streamServiceSettings };
  const restored = !!(await obs.tryReq("SetStreamServiceSettings", put));
  await fmx("set_destinations", { destinations: savedDest });
  await ev("closePop()");
  await Promise.all([main.close(), two.close(), three.close()]);
  const back = await obs.req("GetStreamServiceSettings");
  const same = never ? !back.streamServiceSettings.server && !back.streamServiceSettings.key : JSON.stringify(back) === JSON.stringify(real);
  console.log(`${restored && same ? "OK   " : "FALHA"} as configurações de transmissão do dono voltaram como estavam${never ? " (nenhuma transmissão configurada)" : ""}`);
}
console.log(`${pass}/${total} verificações passaram`);
obs.close(); c.close();
