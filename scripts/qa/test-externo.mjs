// Real click test of the external outputs window (/externo) against the screens sandbox: network outputs (NDI and
// OMT) are really started and stopped — they are announced only on this computer's local network, under a test
// name, for a few seconds — and the virtual camera is switched on and off.
// Full screen is checked as "the engine accepted the request" (it opens a window of the test program on screen).
//   node scripts/qa/test-externo.mjs [pasta-para-retratos]
import path from "node:path";
import { openTest, until, sleep } from "./navegador-teste.mjs";

const t = await openTest({ width: 700, height: 540, shots: process.argv[2] ? path.resolve(process.argv[2]) : null }), { page, check, api, command } = t;
const outputs = async () => (await api("/api/outputs")).outputs;
const sender = async (protocol, n) => (await outputs())[protocol].senders.find((s) => s.senderId === n) || {};
const idle = () => until(() => page.ev(`!document.querySelector("#save-close").disabled`), 90000);
const stamp = Date.now().toString(36).slice(-4).toUpperCase(), ndiName = "FreeMix QA NDI " + stamp, omtName = "FreeMix QA OMT " + stamp;
try {
  const o = await outputs(), has = { ndi: !!o.ndi?.available, omt: !!o.omt?.available };
  await page.open("/externo");
  check("a janela carrega com os dados do programa", await until(() => page.ev(`document.querySelector("#video-source")?.options.length > 0`)) === true);
  await sleep(1500);
  check("abrir a janela não envia nenhum comando", t.posts.length === 0, t.posts.map((p) => p.action || p.url).join(","));
  check("quatro saídas, a 1 selecionada; tipos oferecidos conforme o programa", await page.ev(`[...document.querySelectorAll("#nums button")].map((b) => b.textContent + (b.classList.contains("vd-on") ? "*" : "")).join(" ")`) === "1* 2 3 4" && await page.is("#type-ndi", "disabled") === !has.ndi && await page.is("#type-omt", "disabled") === !has.omt, `NDI ${has.ndi ? "disponível" : "indisponível"}, OMT ${has.omt ? "disponível" : "indisponível"}`);
  await page.shot("1-como-abre");

  if (has.ndi) {
    await page.type("#net-name", ndiName);
    check("alteração fica marcada como não aplicada", (await page.text("#msg")).includes("não aplicadas"), await page.text("#msg"));
    await page.click("#start-one"); await idle();
    const live = await until(async () => { const s = await sender("ndi", 0); return s.active ? s : null; }, 30000);
    check("'Começar 1' põe a saída NDI 1 enviando de verdade, com o nome escolhido", !!live && live.networkName === ndiName && live.mode === "program", live ? `"${live.networkName}", ${live.width}x${live.height}` : await page.text("#msg"));
    await until(() => page.ev(`document.querySelector("#start-one").textContent === "Parar 1"`), 8000);
    check("o botão vira 'Parar 1' em vermelho, o número ganha a marca e os campos travam", await page.text("#start-one") === "Parar 1" && await page.is("#start-one", "vd-air") && await page.is('#nums button[data-n="0"]', "vd-live") && await page.is("#net-name", "disabled") === true);
    await page.click("#view-status"); await sleep(600);
    check("'Ver Status' mostra a saída ENVIANDO", (await page.text("#status-rows")).includes("ENVIANDO") && (await page.text("#status-rows")).includes(ndiName), await page.text("#status-rows"));
    await page.shot("2-ndi-enviando");
    await page.click("#start-one"); await idle();
    check("'Parar 1' para o envio", !!(await until(async () => !(await sender("ndi", 0)).active, 30000)) && !!(await until(() => page.ev(`document.querySelector("#start-one").textContent === "Começar 1"`), 8000)));
  }
  if (has.omt) {
    await page.click('#nums button[data-n="1"]'); await page.click("#type-omt"); await page.type("#net-name", omtName);
    await page.click("#start-one"); await idle();
    const live = await until(async () => { const s = await sender("omt", 1); return s.active ? s : null; }, 30000);
    check("'Começar 2' em OMT põe a saída 2 enviando de verdade", !!live && live.networkName === omtName, live ? `"${live.networkName}"` : await page.text("#msg"));
    await until(() => page.ev(`document.querySelector("#start-all").textContent === "Parar tudo"`), 8000);
    check("com uma saída enviando, 'Iniciar tudo' vira 'Parar tudo'", await page.text("#start-all") === "Parar tudo");
    await page.click("#start-all"); await idle();
    check("'Parar tudo' para todos os envios", !!(await until(async () => { const x = await outputs(); return ![...x.ndi.senders, ...x.omt.senders].some((s) => s.active); }, 40000)));
  }

  // Virtual camera
  const before = (await api("/api/settings")).settings.virtualCamera;
  await page.click("#virtual-toggle"); await idle();
  const after = (await api("/api/settings")).settings.virtualCamera, message = await page.text("#msg");
  check("'Câmera virtual: Ligar' liga de verdade (ou explica por que não)", after === !before ? (await page.text("#virtual-status")).includes(after ? "LIGADA" : "Parada") : (await page.is("#msg", "vd-error")) && message.length > 10, after === !before ? "ligada, confirmado pelo programa" : "o programa recusou: " + message);
  if (after !== before) { await page.click("#virtual-toggle"); await idle(); check("'Parar' desliga a câmera virtual", (await api("/api/settings")).settings.virtualCamera === before); }

  // Full screen: the request is accepted by the engine
  await page.click("#fs-preview"); await idle();
  check("'Tela cheia: Preview' é aceito pelo programa", (await page.text("#msg")).includes("solicitada") && !(await page.is("#msg", "vd-error")), await page.text("#msg"));

  // What is typed and not started is kept on this computer
  await page.click('#nums button[data-n="2"]'); if (has.ndi) await page.click("#type-ndi"); await page.type("#net-name", "Guardado " + stamp); await page.click("#save-close");
  check("'Salvar e Fechar' guarda o que foi digitado e fecha", await page.closed() === true && String(await page.ev(`localStorage.getItem("freemix.outputs.drafts:" + location.host)`)).includes("Guardado " + stamp));
  await page.open("/externo"); await until(() => page.ev(`document.querySelector("#video-source")?.options.length > 0`)); await page.click('#nums button[data-n="2"]'); if (has.ndi) await page.click("#type-ndi");
  check("ao reabrir, o que foi guardado está lá", await page.value("#net-name") === "Guardado " + stamp, await page.value("#net-name"));
  await page.type("#net-name", (has.ndi ? "FreeMix NDI " : "FreeMix OMT ") + "3");   // back to the default name: nothing left behind
  check("nenhum erro de script na página", t.problems.length === 0, t.problems.join(" | "));
} finally {
  for (const protocol of ["NDI", "OMT"]) for (const senderId of [0, 1]) await command({ action: "outputs_network", protocol, command: "stop", senderId }).catch(() => {});
  await command({ action: "settings_virtual", active: false }).catch(() => {});
}
process.exit((await t.finish()) ? 0 : 1);
