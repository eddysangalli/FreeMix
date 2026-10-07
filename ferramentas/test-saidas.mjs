// Click-test of the Central de Saídas. The engine must be running with --remote-debugging-port=9333.
// Opens one projector window to prove the action is real and closes it again.
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { connect, sleep, ROOT } from "./obsws.mjs";

const require = createRequire("D:/DRIVE/IA/antigravity/vmixtwste/rea/package.json");
const WebSocket = require("ws");
const t = (await (await fetch("http://127.0.0.1:9333/json")).json()).find((x) => x.url.endsWith("painel/mesa.html"));
const c = new WebSocket(t.webSocketDebuggerUrl); await new Promise((r) => c.on("open", r));
let id = 0; const waits = new Map();
c.on("message", (raw) => { const m = JSON.parse(String(raw)); waits.get(m.id)?.(m); waits.delete(m.id); });
const ev = (expression) => new Promise((r) => { const i = ++id; waits.set(i, (m) => r(m.result?.exceptionDetails ? "ERRO: " + m.result.exceptionDetails.exception?.description : m.result?.result?.value)); c.send(JSON.stringify({ id: i, method: "Runtime.evaluate", params: { expression, returnByValue: true, awaitPromise: true } })); });
const click = (sel) => ev(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return "sem elemento"; el.click(); return "ok"; })()`);
const windows = (close) => Number(execFileSync("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", `${ROOT}/ferramentas/janelas-projetor.ps1`, close ? "-Fechar" : "-Contar"], { encoding: "utf8" }).trim().split(/\s+/).pop());
const obs = await connect();
let pass = 0, total = 0;
const check = (name, ok, detail = "") => { total++; if (ok) pass++; console.log(`${ok ? "OK   " : "FALHA"} ${name}${detail !== "" ? "  (" + detail + ")" : ""}`); };

await ev("location.reload()"); await sleep(5000);
await click(`.bot [data-a="pop"][data-v="ext"]:not(.cg)`); await sleep(1500);
const monitors = (await obs.req("GetMonitorList")).monitors;
const info = JSON.parse(await ev(`JSON.stringify({ janela: String(st.pop), larga: document.getElementById("pop").classList.contains("wide"), linhas: [...document.querySelectorAll(".outs tr")].slice(1).map((r) => r.querySelector("b").textContent + " = " + (r.querySelector(".bdg")?.textContent || "")), destinos: document.querySelectorAll('.outs select[data-o="s1"][data-f="dst"] option').length, origens: document.querySelectorAll('.outs select[data-o="s1"][data-f="src"] option').length })`));
check("Externo abre a Central de Saídas em janela larga", info.janela === "ext" && info.larga && info.linhas.length === 9, info.linhas.join(" | "));
check("destinos vêm dos monitores reais da máquina", info.destinos === monitors.length + 1, `${monitors.length} monitor(es): ${monitors.map((m) => m.monitorWidth + "x" + m.monitorHeight).join(", ")}`);
check("origens incluem programa, preview, multiview e cada entrada", info.origens === 3 + (await obs.req("GetSceneList")).scenes.length, `${info.origens} opções`);
const before = windows(false);
await ev(`(() => { const s = document.querySelector('.outs select[data-o="s1"][data-f="src"]'); s.value = "MULTIVIEW"; s.dispatchEvent(new Event("change", { bubbles: true })); const d = document.querySelector('.outs select[data-o="s1"][data-f="dst"]'); d.value = "-1"; d.dispatchEvent(new Event("change", { bubbles: true })); })()`);
await click(`.outs [data-a="outopen"][data-v="s1"]`); await sleep(2500);
const after = windows(false);
check("Abrir da Saída 1 abre mesmo uma janela de projetor", after === before + 1, `janelas de projetor: ${before} -> ${after}`);
check("a escolha de origem fica guardada", (await ev(`JSON.parse(localStorage.getItem("mesa.outs")).s1.src`)) === "MULTIVIEW");
windows(true); await sleep(1200);
check("projetor de teste fechado", windows(false) === before);
const vcam = (await obs.req("GetVirtualCamStatus").catch(() => null))?.outputActive, rec = (await obs.req("GetRecordStatus")).outputActive, stream = (await obs.req("GetStreamStatus")).outputActive;
const shown = JSON.parse(await ev(`JSON.stringify([...document.querySelectorAll(".outs tr")].slice(4, 7).map((r) => r.querySelector(".bdg").classList.contains("on")))`));
check("estado de câmera virtual, transmissão e gravação bate com o motor", shown[0] === !!vcam && shown[1] === stream && shown[2] === rec, `motor: vcam ${!!vcam}, stream ${stream}, rec ${rec}`);
await ev(`(() => { st.outsel.s1.src = "PROGRAM"; store.set("mesa.outs", st.outsel); closePop(); })()`);
console.log(`${pass}/${total} verificações passaram`);
obs.close(); c.close();
