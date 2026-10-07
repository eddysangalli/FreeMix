// Click-test of the rebuilt top bar. Engine with --remote-debugging-port=9333 and ferramentas/ajudante.ps1 running.
import { createRequire } from "node:module";
import { existsSync, readdirSync, readFileSync, unlinkSync } from "node:fs";
import { connect, sleep, ROOT } from "./obsws.mjs";
const require = createRequire("D:/DRIVE/IA/antigravity/vmixtwste/rea/package.json");
const WebSocket = require("ws");
const targets = await (await fetch("http://127.0.0.1:9333/json")).json();
const attach = async (suffix) => {
  const t = targets.find((x) => x.url.endsWith(suffix)); const c = new WebSocket(t.webSocketDebuggerUrl); await new Promise((r) => c.on("open", r));
  let id = 0; const waits = new Map(); c.on("message", (raw) => { const m = JSON.parse(String(raw)); waits.get(m.id)?.(m); waits.delete(m.id); });
  const ev = (expression) => new Promise((r) => { const i = ++id; waits.set(i, (m) => r(m.result?.exceptionDetails ? "ERRO: " + m.result.exceptionDetails.exception?.description : m.result?.result?.value)); c.send(JSON.stringify({ id: i, method: "Runtime.evaluate", params: { expression, returnByValue: true, awaitPromise: true } })); });
  return { ev, click: (sel) => ev(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return "sem elemento"; el.click(); return "ok"; })()`), close: () => c.close() };
};
const top = await attach("painel/topbar.html"), mesa = await attach("painel/mesa.html");
const obs = await connect();
const current = async () => (await obs.req("GetSceneCollectionList")).currentSceneCollectionName;
let pass = 0, total = 0;
const check = (name, ok, detail = "") => { total++; if (ok) pass++; console.log(`${ok ? "OK   " : "FALHA"} ${name}${detail !== "" ? "  (" + detail + ")" : ""}`); };

await mesa.ev("location.reload()"); await top.ev("location.reload()"); await sleep(6000);
const start = await current(), scenes0 = (await obs.req("GetSceneList")).scenes.length;
const labels = await top.ev(`[...document.querySelectorAll(".b:not(.dd)")].map((b) => b.textContent.trim()).join(" | ")`);
check("barra de cima na ordem da referência", labels === "Novo | Abrir | Salvar | Salvar como | Último | Tela Cheia | Pausar Entradas | Básico | Configurar | ?", labels);
await top.click(`[data-do="presetsave"]`); await sleep(900);
check("Salvar confirma o preset gravado", (await mesa.ev(`document.getElementById("toast").textContent`)).includes(`"${start}" está gravado`));
await top.click(`[data-do="basic"]`); await sleep(900);
check("Básico esconde os botões das entradas e o mixer", (await mesa.ev(`document.body.classList.contains("basic") && getComputedStyle(document.querySelector(".tile .r")).display === "none"`)) === true && (await top.ev(`document.getElementById("b-basic").classList.contains("on")`)) === true);
await top.click(`[data-do="basic"]`); await sleep(700);
await top.click(`.dd[data-open="cfgmenu"]`); await sleep(700);
check("seta do Configurar lista as configurações", (await mesa.ev(`document.querySelectorAll('#pop .menu button').length`)) === 8);
await top.click(`[data-open="help"]`); await sleep(700);
check("? abre a ajuda", (await mesa.ev(`document.getElementById("pop").textContent`)).includes("Engrenagens"));
await top.click(`[data-open="saveas"]:not(.dd)`); await sleep(800);
await mesa.ev(`(() => { document.getElementById("sa-name").value = "TESTE COPIA"; })()`);
await mesa.click(`#pop [data-a="saveasgo"]`); await sleep(15000);
const after = await current(), scenes1 = (await obs.req("GetSceneList")).scenes.length;
check("Salvar como grava a cópia e passa a usá-la", after === "TESTE COPIA" && scenes1 === scenes0, `preset em uso: ${after}, entradas ${scenes0} -> ${scenes1}`);
await sleep(1500);
await top.click(`[data-do="presetlast"]`); await sleep(6000);
check("Último volta para o preset anterior", (await current()) === start, await current());
await sleep(1500);
for (const f of readdirSync(`${ROOT}/config/obs-studio/basic/scenes`)) { const p = `${ROOT}/config/obs-studio/basic/scenes/${f}`; if (/^TESTE_COPIA.*\.json(\.bak)?$/.test(f) && (await current()) === start && existsSync(p)) unlinkSync(p); }
await mesa.ev(`(() => { closePop(); localStorage.removeItem("mesa.lastPreset"); })()`);
console.log(`presets ao final: ${(await obs.req("GetSceneCollectionList")).sceneCollections.join(", ")}`);
console.log(`${pass}/${total} verificações passaram`);
obs.close(); top.close(); mesa.close();
