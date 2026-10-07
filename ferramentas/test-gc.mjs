// Click-test of the title gallery (GC). Engine with --remote-debugging-port=9333.
// Creates a lower third from the gallery, puts it on overlay 1, edits it on air, takes it off, removes it.
import { createRequire } from "node:module";
import { connect, sleep } from "./obsws.mjs";
const require = createRequire("D:/DRIVE/IA/antigravity/vmixtwste/rea/package.json");
const WebSocket = require("ws");
const targets = async () => (await (await fetch("http://127.0.0.1:9333/json")).json());
const attach = async (t) => { const c = new WebSocket(t.webSocketDebuggerUrl); await new Promise((r) => c.on("open", r)); let id = 0; const waits = new Map(); c.on("message", (raw) => { const m = JSON.parse(String(raw)); waits.get(m.id)?.(m); waits.delete(m.id); });
  return { ev: (expression) => new Promise((r) => { const i = ++id; waits.set(i, (m) => r(m.result?.exceptionDetails ? "ERRO: " + m.result.exceptionDetails.exception?.description : m.result?.result?.value)); c.send(JSON.stringify({ id: i, method: "Runtime.evaluate", params: { expression, returnByValue: true, awaitPromise: true } })); }), close: () => c.close() }; };
const mesa = await attach((await targets()).find((x) => x.url.endsWith("painel/mesa.html")));
const ev = mesa.ev, click = (sel) => ev(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return "sem elemento"; el.click(); return "ok"; })()`);
const setv = (idv, v) => ev(`(() => { const el = document.getElementById(${JSON.stringify(idv)}); if (!el) return "sem campo"; el.value = ${JSON.stringify(v)}; return "ok"; })()`);
const obs = await connect(), SC = "GC TESTE", IN = "GC TESTE (fonte)";
let pass = 0, total = 0;
const check = (name, ok, detail = "") => { total++; if (ok) pass++; console.log(`${ok ? "OK   " : "FALHA"} ${name}${detail !== "" ? "  (" + detail + ")" : ""}`); };
const vendor = async (type, data) => (await obs.tryReq("CallVendorRequest", { vendorName: "downstream-keyer", requestType: type, requestData: data }))?.responseData;

await obs.tryReq("RemoveInput", { inputName: IN }); await obs.tryReq("RemoveScene", { sceneName: SC });
await ev("location.reload()"); await sleep(7500);
let page = null;
try {
  await ev(`openPop("add")`); await sleep(400); await click(`.add .types [data-v="title"]`); await sleep(400);
  // The gallery is either a list (#add-gc) or cards (data-a="gcsel"); both are accepted.
  const options = await ev(`[...document.querySelectorAll('#add-gc option, [data-a="gcsel"]')].map((o) => o.title || o.textContent.trim()).join(" | ")`);
  check("o tipo Title oferece os modelos da galeria", (await ev(`document.querySelectorAll('#add-gc option, [data-a="gcsel"]').length`)) >= 4 && /Tarja|Lower Third|Entrevistado/i.test(options), options.slice(0, 260));
  check("nenhum nome de outro produto aparece na galeria", !/vmix/i.test(await ev(`document.querySelector(".pop").innerText`)), (/[^\n]*vmix[^\n]*/i.exec(await ev(`document.querySelector(".pop").innerText`)) || [""])[0].trim().slice(0, 80));
  await ev(`(() => { const s = document.getElementById("add-gc"); if (s) { s.value = "jornal_lower_third"; s.dispatchEvent(new Event("change", { bubbles: true })); return; } document.querySelector('[data-a="gcsel"][data-v="jornal_lower_third"]')?.click(); })()`); await sleep(500);
  check("escolher o modelo mostra os campos dele", (await ev(`["nome", "cargo", "cor"].every((k) => !!document.getElementById("add-f-" + k))`)) === true);
  await setv("add-name", SC); await setv("add-f-nome", "MARIA SOUZA"); await setv("add-f-cargo", "Repórter"); await click(`.pop [data-a="add"]`); await sleep(3500);
  const s = await obs.tryReq("GetInputSettings", { inputName: IN });
  check("o título vira uma entrada com o modelo e os textos escolhidos", s?.inputKind === "browser_source" && /painel\/gc\/jornalismo\/lower_third\.html#/.test(s.inputSettings.url) && decodeURIComponent(s.inputSettings.url).includes('"nome":"MARIA SOUZA"'));
  await sleep(1500);
  page = await attach((await targets()).find((x) => x.url.includes("lower_third.html")));
  check("fora do ar, o título fica recolhido", (await page.ev(`document.getElementById("box").classList.contains("in")`)) === false && (await page.ev(`document.getElementById("f-name").textContent`)) === "MARIA SOUZA");
  await click(`.tile [data-a="ov"][data-k="0"][data-v="${SC}"]`); await sleep(2800);
  check("no overlay 1, o título entra no ar", (await vendor("dsk_get_scene", { dsk_name: "1" }))?.scene === SC && (await page.ev(`document.getElementById("box").classList.contains("in")`)) === true);
  await page.ev(`window.__mark = 1`);
  await click(`.tile [data-a="menu"][data-v="${SC}"]`); await sleep(400);
  check("o menu da entrada oferece Editar título", (await ev(`!!document.querySelector('.pop [data-a="gcedit"]')`)) === true);
  await click(`.pop [data-a="gcedit"]`); await sleep(900); await setv("gc-f-nome", "JOÃO LIMA"); await click(`.pop [data-a="gcapply"]`); await sleep(900);
  check("editar no ar troca o texto na hora, sem recarregar nem sair do ar", (await page.ev(`document.getElementById("f-name").textContent`)) === "JOÃO LIMA" && (await page.ev(`window.__mark`)) === 1 && (await page.ev(`document.getElementById("box").classList.contains("in")`)) === true);
  await ev("closePop()");
  await click(`.tile [data-a="ov"][data-k="0"][data-v="${SC}"]`); await sleep(350);
  const leaving = await page.ev(`document.getElementById("box").classList.contains("in")`), still = (await vendor("dsk_get_scene", { dsk_name: "1" }))?.scene;
  check("ao tirar do ar, o título se recolhe antes de o overlay ser cortado", leaving === false && still === SC, `título recolhido: ${!leaving}, overlay ainda ligado: ${still === SC}`);
  await sleep(1500);
  check("o overlay sai", ((await vendor("dsk_get_scene", { dsk_name: "1" }))?.scene || "") === "");
  await sleep(3500);
  check("depois de sair do ar, o texto novo fica gravado na entrada", decodeURIComponent((await obs.req("GetInputSettings", { inputName: IN })).inputSettings.url).includes('"nome":"JOÃO LIMA"'));
} finally {
  page?.close(); await ev("closePop()");
  if ((await vendor("dsk_get_scene", { dsk_name: "1" }))?.scene === SC) await vendor("dsk_select_scene", { dsk_name: "1", scene: "" });
  await vendor("dsk_remove_scene", { dsk_name: "1", scene: SC });
  await obs.tryReq("RemoveInput", { inputName: IN }); await obs.tryReq("RemoveScene", { sceneName: SC });
}
console.log(`${pass}/${total} verificações passaram`);
obs.close(); mesa.close();
