// Click-test of the Recording and Streaming windows and of the production clock. Engine with --remote-debugging-port=9333.
// Usage: node test-janelas.mjs <temporary folder for the test recording>
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { connect, sleep } from "./obsws.mjs";
const require = createRequire("D:/DRIVE/IA/antigravity/vmixtwste/rea/package.json");
const WebSocket = require("ws");
const SCRATCH = process.argv[2];
const targets = await (await fetch("http://127.0.0.1:9333/json")).json();
const attach = async (suffix) => {
  const t = targets.find((x) => x.url.endsWith(suffix)); const c = new WebSocket(t.webSocketDebuggerUrl); await new Promise((r) => c.on("open", r));
  let id = 0; const waits = new Map(); c.on("message", (raw) => { const m = JSON.parse(String(raw)); waits.get(m.id)?.(m); waits.delete(m.id); });
  const ev = (expression) => new Promise((r) => { const i = ++id; waits.set(i, (m) => r(m.result?.exceptionDetails ? "ERRO: " + m.result.exceptionDetails.exception?.description : m.result?.result?.value)); c.send(JSON.stringify({ id: i, method: "Runtime.evaluate", params: { expression, returnByValue: true, awaitPromise: true } })); });
  return { ev, click: (sel) => ev(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return "sem elemento"; el.click(); return "ok"; })()`), close: () => c.close() };
};
const top = await attach("painel/topbar.html"), mesa = await attach("painel/mesa.html");
const obs = await connect();
const P = async (cat, name) => (await obs.tryReq("GetProfileParameter", { parameterCategory: cat, parameterName: name }))?.parameterValue ?? null;
const S = (cat, name, value) => obs.req("SetProfileParameter", { parameterCategory: cat, parameterName: name, parameterValue: value });
let pass = 0, total = 0;
const check = (name, ok, detail = "") => { total++; if (ok) pass++; console.log(`${ok ? "OK   " : "FALHA"} ${name}${detail !== "" ? "  (" + detail + ")" : ""}`); };

await mesa.ev("location.reload()"); await top.ev("location.reload()"); await sleep(6000);
const dir0 = (await obs.req("GetRecordDirectory")).recordDirectory, fmt0 = await P("SimpleOutput", "RecFormat2"), ab0 = await P("SimpleOutput", "ABitrate"), q0 = await P("SimpleOutput", "RecQuality");
await mesa.click(`#bot .cg[data-v="recset"]`); await sleep(1800);
const rec = JSON.parse(await mesa.ev(`JSON.stringify({ larga: document.getElementById("pop").classList.contains("wide"), formatos: [...document.querySelectorAll(".add .types button")].map((b) => b.textContent), marcado: document.querySelector(".add .types .on")?.textContent, campos: [...document.querySelectorAll(".add .form input, .add .form select")].map((e) => e.id), pasta: document.getElementById("cf-dir")?.value, qualidade: document.getElementById("cf-q")?.value })`));
check("janela de gravação com lista de formatos e os campos do motor", rec.larga && rec.formatos.length >= 6 && rec.campos.length >= 8 && rec.pasta === dir0, `${rec.formatos.join("/")} | marcado ${rec.marcado} | campos: ${rec.campos.join(", ")}`);
await mesa.click(`.add .types [data-a="recfmt"][data-v="mp4"]`); await sleep(300);
await mesa.ev(`(() => { document.getElementById("cf-abit").value = "192"; })()`);
await mesa.click(`#pop [data-a="cfgrec"]`); await sleep(1800);
check("OK grava formato e taxa de áudio no motor", (await P("SimpleOutput", "RecFormat2")) === "mp4" && (await P("SimpleOutput", "ABitrate")) === "192" && (await obs.req("GetRecordDirectory")).recordDirectory === dir0, `formato ${fmt0} -> ${await P("SimpleOutput", "RecFormat2")}, áudio ${ab0} -> ${await P("SimpleOutput", "ABitrate")}`);
if (fmt0) await S("SimpleOutput", "RecFormat2", fmt0); if (ab0) await S("SimpleOutput", "ABitrate", ab0); if (q0) await S("SimpleOutput", "RecQuality", q0);
await mesa.click(`#bot .cg[data-v="streamset"]`); await sleep(1800);
const str = JSON.parse(await mesa.ev(`JSON.stringify({ destinos: document.querySelectorAll(".add .types button").length, ativos: document.querySelectorAll(".add .types .on").length, campos: [...document.querySelectorAll(".add .form input, .add .form select")].map((e) => e.id || "destino"), chave: document.getElementById("cf-key")?.type })`));
check("janela de transmissão com 5 destinos (1 ativo) e os campos do motor", str.destinos === 5 && str.ativos === 1 && str.campos.length >= 6 && str.chave === "password", str.campos.join(", "));
await mesa.click(`#pop [data-a="streamstatus"]`); await sleep(900);
check("Ver status consulta o motor", (await mesa.ev(`document.getElementById("st-status").textContent`)) === "Transmissão parada.");
await mesa.ev("closePop()");
check("relógio de produção na barra de cima", /^\d\d:\d\d:\d\d$/.test(await top.ev(`document.getElementById("k-now").textContent`)) && (await top.ev(`document.getElementById("k-rec").textContent`)) === "REC 00:00:00");
mkdirSync(SCRATCH, { recursive: true }); await obs.req("SetRecordDirectory", { recordDirectory: SCRATCH });
await mesa.click(`#bot [data-a="record"]`); await sleep(4500);
const k = await top.ev(`document.getElementById("k-rec").textContent + "|" + document.getElementById("k-rec").classList.contains("on")`);
check("relógio conta o tempo de gravação", /^REC 00:00:0[2-9]\|true$/.test(k), k);
await mesa.click(`#bot [data-a="record"]`); await sleep(3000);
await obs.req("SetRecordDirectory", { recordDirectory: dir0 });
check("gravação parada e pasta restaurada", !(await obs.req("GetRecordStatus")).outputActive && (await obs.req("GetRecordDirectory")).recordDirectory === dir0);
console.log(`${pass}/${total} verificações passaram`);
obs.close(); top.close(); mesa.close();
