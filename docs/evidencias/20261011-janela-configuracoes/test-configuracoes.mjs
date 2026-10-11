// Real click test of the Settings window (/configuracoes) against the screens sandbox: what OK saves is read back
// from the engine (its own preference list and the picture format), the format is locked while recording, and a
// category that has its own window really opens that window in the program. The original values are put back.
//   node scripts/qa/test-configuracoes.mjs [pasta-para-retratos]
import path from "node:path";
import { pathToFileURL } from "node:url";
import { openTest, until, sleep } from "./navegador-teste.mjs";

const t = await openTest({ width: 760, height: 540, shots: process.argv[2] ? path.resolve(process.argv[2]) : null }), { page, check, api, command } = t;
const settings = async () => (await api("/api/settings")).settings;
const pref = async (name) => (await settings()).nativePreferences.fields.find((f) => f.name === name)?.value;
const general = async () => Object.fromEntries((await settings()).nativePreferences.fields.filter((f) => f.category === "general").map((f) => [f.name, f.value]));
const before = await settings(), generalBefore = await general(), video = before.video;
const commands = () => t.posts.filter((p) => p.url === "/api/control");
const ready = () => until(() => page.ev(`document.querySelectorAll("#categories button").length > 0 && document.querySelector("#content").children.length > 0`));
const idle = () => until(() => page.ev(`!document.querySelector("#cancel").disabled`), 40000);
const { connect } = await import(pathToFileURL(path.join(t.sandbox.installed, "ferramentas/obsws.mjs"))), obs = await connect({ root: t.sandbox.installed });
const panels = async () => (await obs.req("CallVendorRequest", { vendorName: "freemix", requestType: "get_interface", requestData: {} })).responseData.panels || [];
try {
  await page.open("/configuracoes"); check("a janela carrega com os dados do programa", await ready() === true);
  await sleep(1200);
  check("abrir a janela não envia nenhum comando", t.posts.length === 0, t.posts.map((p) => p.action || p.url).join(","));
  const list = await page.ev(`[...document.querySelectorAll("#categories button")].map((b) => b.textContent.trim())`);
  check("categorias à esquerda, 'Exibir' selecionada", list.length === 18 && list[0] === "Exibir" && await page.is('#categories button[data-id="display"]', "vd-on"), list.length + " categorias");
  check("'Exibir' mostra o formato que o programa tem", Number(await page.value("#f-display-baseWidth")) === video.baseWidth && Number(await page.value("#f-display-outputHeight")) === video.outputHeight && await page.value("#f-display-fps") === String(video.fpsNumerator));
  await page.shot("1-exibir");

  // Options: change two things and save
  await page.click('#categories button[data-id="general"]');
  check("'Opções' lista as preferências do programa com os valores dele", await page.ev(`document.querySelectorAll("#content input[data-field]").length`) === Object.keys(generalBefore).length && await page.is("#f-general-confirmExit", "checked") === (generalBefore.confirmExit === true), Object.keys(generalBefore).length + " opções");
  await page.click("#f-general-doubleClickTransition"); await page.type("#f-general-snapDistance", "12");
  check("alteração fica marcada (ponto na categoria e aviso)", (await page.text('#categories button[data-id="general"]')).includes("•") && (await page.text("#msg")).includes("não salvas") && commands().length === 0, await page.text("#msg"));
  await page.shot("2-opcoes-alteradas");
  await page.click("#ok");
  const saved = await until(async () => (await pref("doubleClickTransition")) === !generalBefore.doubleClickTransition && Number(await pref("snapDistance")) === 12, 20000);
  check("'OK' grava as opções no programa e fecha a janela", saved === true && await page.closed() === true, `duplo clique: ${await pref("doubleClickTransition")}; distância: ${await pref("snapDistance")}`);

  await page.open("/configuracoes?category=general"); await ready();
  check("ao reabrir, a janela mostra o que foi salvo", await page.is("#f-general-doubleClickTransition", "checked") === !generalBefore.doubleClickTransition && Number(await page.value("#f-general-snapDistance")) === 12);
  // Default fills the form without saving; Cancel leaves the engine alone
  const sent = commands().length; await page.click("#default"); await idle();
  check("'Padrão' põe os valores de fábrica no formulário sem gravar", (await page.text("#msg")).includes("Clique em OK") && Number(await pref("snapDistance")) === 12 && commands().slice(sent).every((p) => p.action === "settings_defaults"), await page.text("#msg"));
  await page.click("#export"); await idle();
  check("'Exportar' pede o arquivo desta categoria ao programa", commands().some((p) => p.action === "settings_export" && p.category === "general") && (await page.text("#msg")).includes("exportado"), await page.text("#msg"));
  await page.click("#cancel");
  check("'Cancelar' fecha sem gravar", await page.closed() === true && Number(await pref("snapDistance")) === 12 && !commands().some((p) => p.action === "settings_apply" && p !== commands().find((x) => x.action === "settings_apply")));

  // Picture format
  await page.open("/configuracoes"); await ready();
  await page.click('#sizes button[data-size="1920x1080"]');
  check("'1080p' preenche quadro e saída", Number(await page.value("#f-display-outputWidth")) === 1920 && Number(await page.value("#f-display-outputHeight")) === 1080 && Number(await page.value("#f-display-baseWidth")) === 1920);
  await page.click("#ok");
  const resized = await until(async () => { const v = (await settings()).video; return v.outputWidth === 1920 && v.outputHeight === 1080 ? v : null; }, 30000);
  check("'OK' muda o formato do quadro no programa", !!resized && await page.closed() === true, resized ? `${resized.baseWidth}×${resized.baseHeight}, saída ${resized.outputWidth}×${resized.outputHeight}` : "");
  await page.open("/configuracoes"); await ready();
  await command({ action: "record", active: true });
  const locked = await until(async () => (await page.is("#f-display-baseWidth", "disabled")) && (await page.text("#msg")).includes("pare"), 15000);
  check("gravando, o formato do quadro trava e avisa", locked === true, await page.text("#msg"));
  await page.shot("3-exibir-travado-gravando");
  await command({ action: "record", active: false });
  check("parada a gravação, destrava", await until(async () => !(await page.is("#f-display-baseWidth", "disabled")), 15000) === true);

  // A category that has a window of its own opens that window in the program
  await page.click('#categories button[data-id="recording"]');
  const opened = await until(async () => (await panels()).find((p) => p.visible && p.width === 700 && p.height === 300 && /grava/i.test(p.title)), 15000);
  check("'Gravando ›' abre a janela de gravação dentro do programa", !!opened && t.posts.some((p) => p.url === "/api/panel-open" && p.route === "/gravar"), opened ? `"${opened.title}" ${opened.width}×${opened.height}` : "janela não apareceu");
  await sleep(1500); for (let i = 0; i < 6; i++) { const r = await (await fetch(t.base + "/api/panel-close", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: t.base + "/gravar" }) })).json(); if (r.success) break; await sleep(500); }
  await page.click('#categories button[data-id="about"]');
  check("'Informações' mostra os números do programa", (await page.text("#content")).includes("Quadros por segundo") && (await page.text("#content")).includes("FreeMix Studio") && await page.ev(`!!document.querySelector("#native")`) === true);
  await page.shot("4-informacoes");
  check("nenhum erro de script na página", t.problems.length === 0, t.problems.join(" | "));
} finally {
  await command({ action: "record", active: false }).catch(() => {});
  const a = await command({ action: "settings_apply", category: "general", ...generalBefore }), b = await command({ action: "settings_apply", category: "display", baseWidth: video.baseWidth, baseHeight: video.baseHeight, outputWidth: video.outputWidth, outputHeight: video.outputHeight, fps: video.fpsDenominator === 1 ? String(video.fpsNumerator) : video.fpsNumerator + "/" + video.fpsDenominator, reflow: true });
  console.log("valores originais repostos: " + (a.success === true && b.success === true)); obs.close?.();
}
process.exit((await t.finish()) ? 0 : 1);
