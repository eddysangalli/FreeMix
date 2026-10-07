// Click-test of the Input Select window and the per-input menu. OBS must be running with --remote-debugging-port=9333.
import { createRequire } from "node:module";
import { connect, sleep } from "./obsws.mjs";

const require = createRequire("D:/DRIVE/IA/antigravity/vmixtwste/rea/package.json");
const WebSocket = require("ws");
const target = (await (await fetch("http://127.0.0.1:9333/json")).json()).find((t) => t.url.endsWith("painel/mesa.html"));
const cdp = new WebSocket(target.webSocketDebuggerUrl); await new Promise((r) => cdp.on("open", r));
let id = 0; const waits = new Map();
cdp.on("message", (raw) => { const m = JSON.parse(String(raw)); waits.get(m.id)?.(m); waits.delete(m.id); });
const evalJs = (expression) => new Promise((r) => { const i = ++id; waits.set(i, (m) => r(m.result?.result?.value ?? m.result?.exceptionDetails?.exception?.description)); cdp.send(JSON.stringify({ id: i, method: "Runtime.evaluate", params: { expression, returnByValue: true, awaitPromise: true } })); });
const click = (sel) => evalJs(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return "sem elemento"; el.click(); return "ok"; })()`);
const setVal = (elId, value) => evalJs(`(() => { const el = document.getElementById(${JSON.stringify(elId)}); el.value = ${JSON.stringify(value)}; el.dispatchEvent(new Event("input", { bubbles: true })); })()`);
const obs = await connect();
const names = async () => (await obs.req("GetSceneList")).scenes.map((x) => x.sceneName);
let pass = 0, total = 0;
const check = (name, ok, detail = "") => { total++; if (ok) pass++; console.log(`${ok ? "OK   " : "FALHA"} ${name}${detail !== "" ? "  (" + detail + ")" : ""}`); };

await evalJs("location.reload()"); await sleep(4000);
try {
  await click(`.bot [data-a="pop"][data-v="add"]`); await sleep(300);
  const info = JSON.parse(await evalJs(`JSON.stringify({ larga: document.getElementById("pop").classList.contains("wide"), tipos: document.querySelectorAll(".add .types button").length, marcado: document.querySelector(".add .types .on")?.textContent, apagados: [...document.querySelectorAll(".add .types .off")].map((b) => b.textContent) })`));
  check("Input Select abre com a lista de tipos à esquerda", info.larga && info.tipos === 17 && info.marcado === "Camera", `${info.tipos} tipos, marcado ${info.marcado}, não instalados: ${info.apagados.join(", ") || "nenhum"}`);
  if (process.argv[2] === "hold") { console.log("janela mantida aberta para a captura"); obs.close(); cdp.close(); process.exit(0); }
  
  // Teste de criação de FreeMix Call
  await click(`.add .types [data-v="call"]`); await sleep(200);
  await setVal("add-name", "CONVIDADO");
  await click(`.pop [data-a="add"]`); await sleep(1300);
  const callInput = await obs.tryReq("GetInputSettings", { inputName: "CONVIDADO (fonte)" });
  check("FreeMix Call cria a entrada como browser_source apontando para vdo.ninja", callInput?.inputKind === "browser_source" && callInput.inputSettings.url.includes("vdo.ninja/?view="), callInput?.inputSettings?.url);
  let callPop = "", guestVal = "";
  for (let w = 0; w < 12; w++) {
    callPop = await evalJs(`document.getElementById("pop").textContent`);
    guestVal = await evalJs(`document.getElementById("call-guest")?.value || ""`);
    if (callPop.includes("Mande este link ao convidado") && guestVal.includes("vdo.ninja/?push=")) break;
    await sleep(250);
  }
  check("Popup de link da chamada abre automaticamente com o link do convidado", callPop.includes("Mande este link ao convidado") && guestVal.includes("vdo.ninja/?push="), guestVal);
  await click(`.pop [data-a="close"]`); await sleep(300);

  await click(`.bot [data-a="pop"][data-v="add"]`); await sleep(300);
  await click(`.add .types [data-v="colour"]`); await sleep(200);
  await setVal("add-name", "COR TESTE"); await setVal("add-f-color", "#ff0000");
  await click(`.pop [data-a="add"]`); await sleep(1300);
  const col = await obs.tryReq("GetInputSettings", { inputName: "COR TESTE (fonte)" });
  check("Colour cria a entrada já com a cor escolhida", col?.inputKind?.startsWith("color_source") && col.inputSettings.color === 4278190335, `${col?.inputKind} cor ${col?.inputSettings?.color}`);
  await click(`.bot [data-a="pop"][data-v="add"]`); await sleep(300);
  await click(`.add .types [data-v="blank"]`); await sleep(200);
  await setVal("add-name", "LOTE"); await setVal("add-n", "2");
  await click(`.pop [data-a="add"]`); await sleep(1300);
  let all = await names(); check("Number cria várias entradas de uma vez", all.includes("LOTE 1") && all.includes("LOTE 2"));
  await evalJs(`document.querySelector('.tile[data-s="COR TESTE"]').dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true }))`); await sleep(300);
  const menu = await evalJs(`document.getElementById("pop").textContent`);
  check("clique direito abre o menu da entrada", menu.includes("Configurações de COR TESTE (fonte)") && menu.includes("Renomear") && menu.includes("Fechar entrada"), menu.slice(0, 60));
  await click(`.pop [data-a="renameask"]`); await sleep(300);
  await setVal("rn-name", "COR NOVA"); await click(`.pop [data-a="renamego"]`); await sleep(1000);
  all = await names(); check("Renomear muda o nome no OBS", all.includes("COR NOVA") && !all.includes("COR TESTE"));
  await click(`.tile[data-s="COR NOVA"] [data-a="menu"]`); await sleep(300);
  check("engrenagem da entrada abre o mesmo menu", (await evalJs(`document.querySelector("#pop h3")?.textContent`)) === "COR NOVA");
  await click(`.pop [data-a="closeask"]`); await sleep(300); await click(`.pop [data-a="closego"]`); await sleep(1000);
  check("Fechar entrada pelo menu remove a entrada", !(await names()).includes("COR NOVA"));
} finally {
  await evalJs(`(() => { closePop(); st.addName = ""; st.addType = "camera"; })()`);
  for (const n of ["CONVIDADO", "COR TESTE", "COR NOVA", "LOTE 1", "LOTE 2"]) await obs.tryReq("RemoveScene", { sceneName: n });
  for (const n of ["CONVIDADO (fonte)", "COR TESTE (fonte)"]) await obs.tryReq("RemoveInput", { inputName: n });
  await sleep(600); console.log("cenas ao final:", (await names()).reverse().join(" | "));
}
console.log(`${pass}/${total} verificações passaram`);
obs.close(); cdp.close();
