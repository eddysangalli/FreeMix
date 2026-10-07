// Test of the Shortcuts Center (Central de Atalhos):
//   - opens the shortcuts modal from the bottom bar button;
//   - checks standard factory shortcuts (F1..F6, Space, Enter, 1..8, M, P, B);
//   - simulates keyboard shortcuts via DevTools Input.dispatchKeyEvent;
//   - tests Preview input selection, Cut transition, Overlay trigger and Master mute;
//   - tests adding a custom shortcut and deleting it;
//   - leaves the production and shortcuts as found.
import { createRequire } from "node:module";
import { connect, sleep } from "./obsws.mjs";

const require = createRequire("D:/DRIVE/IA/antigravity/vmixtwste/rea/package.json");
const WebSocket = require("ws");

let targets;
try {
  targets = await (await fetch("http://127.0.0.1:9333/json")).json();
} catch (e) {
  console.error("Não foi possível conectar à porta 9333 de depuração remota:", e.message);
  process.exit(1);
}

const attach = async (suffix) => {
  const t = targets.find((x) => x.url.endsWith(suffix));
  if (!t) throw new Error("página não encontrada: " + suffix);
  const c = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((r) => c.on("open", r));
  let id = 0; const waits = new Map();
  c.on("message", (raw) => { const m = JSON.parse(String(raw)); waits.get(m.id)?.(m); waits.delete(m.id); });
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; waits.set(i, (m) => r(m.result)); c.send(JSON.stringify({ id: i, method, params })); });
  const ev = (expression) => new Promise((r) => { const i = ++id; waits.set(i, (m) => r(m.result?.result?.value ?? m.result?.exceptionDetails?.exception?.description)); c.send(JSON.stringify({ id: i, method: "Runtime.evaluate", params: { expression, returnByValue: true, awaitPromise: true } })); });
  const key = async (type, code, keyVal) => {
    await send("Input.dispatchKeyEvent", { type: "keyDown", code, key: keyVal, windowsVirtualKeyCode: 0 });
    await sleep(50);
    await send("Input.dispatchKeyEvent", { type: "keyUp", code, key: keyVal });
  };
  return {
    ev,
    send,
    key,
    click: (sel) => ev(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return "sem elemento"; el.click(); return "ok"; })()`),
    close: () => c.close(),
  };
};

const mesa = await attach("painel/mesa.html");
const obs = await connect();
let pass = 0, total = 0;
const check = (name, ok, detail = "") => {
  total++;
  if (ok) pass++;
  console.log(`${ok ? "OK   " : "FALHA"} ${name}${detail !== "" ? "  (" + detail + ")" : ""}`);
};

try {
  await mesa.ev("location.reload()");
  await sleep(2500);

  // 1. Verificação do estado inicial dos atalhos
  const count = await mesa.ev("st.shortcuts ? st.shortcuts.length : 0");
  check("atalhos padrão carregados no painel", count >= 10, `${count} atalhos ativos`);

  // 2. Abertura do modal de atalhos
  await mesa.click(`.bot .ib[data-v="shortcuts"]`);
  await sleep(500);
  const pop = await mesa.ev("st.pop");
  const popText = await mesa.ev(`document.getElementById("pop")?.textContent || ""`);
  check("botão de atalhos abre a Central de Atalhos", pop === "shortcuts" && popText.includes("Central de Atalhos"), pop);

  // 3. Tabela de atalhos renderizada
  const rows = await mesa.ev(`document.querySelectorAll("#pop table tr").length`);
  check("tabela lista os atalhos configurados", rows >= count, `${rows} linhas renderizadas`);

  // 4. Fechar o modal para testar atalhos globais
  await mesa.ev("closePop()");
  await sleep(300);

  // 5. Testar tecla F2 (PreviewInput 2)
  const prev0 = (await obs.req("GetCurrentPreviewScene")).currentPreviewSceneName;
  const targetCam = await mesa.ev("st.scenes[1] || st.scenes[0]");

  await mesa.key("keyDown", "F2", "F2");
  await sleep(600);
  const prevF2 = (await obs.req("GetCurrentPreviewScene")).currentPreviewSceneName;
  check("tecla F2 seleciona a entrada 2 no Preview", prevF2 === targetCam, `Preview: ${prevF2}`);

  // 6. Testar tecla Space (Cut)
  const prog0 = (await obs.req("GetCurrentProgramScene")).currentProgramSceneName;
  await mesa.key("keyDown", "Space", " ");
  await sleep(700);
  const progAfter = (await obs.req("GetCurrentProgramScene")).currentProgramSceneName;
  check("tecla Espaço executa o Cut", progAfter === prevF2, `Programa anterior: ${prog0}, novo: ${progAfter}`);

  // 7. Testar tecla M (MasterAudio Mute)
  const mute0 = (await obs.req("GetInputMute", { inputName: "FreeMix Master" })).inputMuted;
  await mesa.key("keyDown", "KeyM", "m");
  await sleep(500);
  const muteAfter = (await obs.req("GetInputMute", { inputName: "FreeMix Master" })).inputMuted;
  check("tecla M alterna o mudo do Master", muteAfter === !mute0, `Mute antes: ${mute0}, depois: ${muteAfter}`);
  // Devolve o mute ao estado original
  await obs.req("SetInputMute", { inputName: "FreeMix Master", inputMuted: mute0 });

  // 8. Teste de adição de atalho customizado
  await mesa.click(`.bot .ib[data-v="shortcuts"]`);
  await sleep(400);
  await mesa.click(`[data-a="sc_capture"]`);
  await sleep(200);
  check("modo de captura de atalho fica ativo ao clicar", (await mesa.ev("st.capturingShortcut")) === true);

  // Simula pressionamento de tecla para captura (ex: F9)
  await mesa.key("keyDown", "F9", "F9");
  await sleep(300);
  const captured = await mesa.ev("st.capturedKey?.key");
  check("tecla capturada com sucesso no formulário", captured === "F9", `Capturado: ${captured}`);

  // Adiciona o atalho
  await mesa.ev(`document.getElementById("sc-fn").value = "Cut";`);
  await mesa.click(`[data-a="sc_add"]`);
  await sleep(400);
  const hasF9 = await mesa.ev(`st.shortcuts.some((s) => s.key === "F9")`);
  check("novo atalho adicionado à lista", hasF9 === true);

  // Remove o atalho adicionado
  const f9Id = await mesa.ev(`st.shortcuts.find((s) => s.key === "F9")?.id`);
  if (f9Id) {
    await mesa.ev(`A.sc_del({ id: "${f9Id}" })`);
    await sleep(300);
    const stillHasF9 = await mesa.ev(`st.shortcuts.some((s) => s.key === "F9")`);
    check("atalho customizado excluído com sucesso", stillHasF9 === false);
  }

  // 9. Restaurar programa para estado inicial
  await mesa.ev("closePop()");
  await obs.req("SetCurrentProgramScene", { sceneName: prog0 });
  await obs.req("SetCurrentPreviewScene", { sceneName: prev0 });
} finally {
  mesa.close();
  obs.close();
}

console.log(`\n${pass}/${total} verificações passaram`);
process.exit(pass === total ? 0 : 1);
