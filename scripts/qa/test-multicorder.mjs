// Real click test of the MultiCorder window (/multicorder) against the screens sandbox: a real recording of one input
// to its own file, started and stopped from the window, with the file checked on disk. Everything is written inside
// the sandbox's own folder; the original options are put back at the end.
//   node scripts/qa/test-multicorder.mjs [pasta-para-retratos]
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { openTest, until, sleep } from "./navegador-teste.mjs";

const t = await openTest({ width: 700, height: 540, shots: process.argv[2] ? path.resolve(process.argv[2]) : null }), { page, check, api } = t;
const iso = async () => (await api("/api/iso")).iso;
const post = async (body) => (await fetch(t.base + "/api/iso", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })).json();
// An input with real picture: the engine refuses to start when an input writes no video (an empty camera, for one).
const { connect } = await import(pathToFileURL(path.join(t.sandbox.installed, "ferramentas/obsws.mjs"))), obs = await connect({ root: t.sandbox.installed }), cam = "QA Cor " + Date.now().toString(36).slice(-4).toUpperCase();
await obs.req("CreateScene", { sceneName: cam }); await obs.req("CreateInput", { sceneName: cam, inputName: cam + " (fonte)", inputKind: "color_source_v3", inputSettings: { color: 0xff2060c0, width: 1280, height: 720 } });
await until(async () => (await iso()).availableCams.includes(cam), 10000);
const before = await iso(), folder = path.join(t.sandbox.installed, "multigravacao-teste-" + Date.now().toString(36)); await fs.mkdir(folder, { recursive: true });
const idle = () => until(() => page.ev(`!document.querySelector("#save-close").disabled`), 90000);
const filesIn = async (dir) => (await fs.readdir(dir, { recursive: true, withFileTypes: true })).filter((e) => e.isFile()).map((e) => path.join(e.parentPath, e.name));
try {
  if (before.rec) throw Error("já há uma MultiGravação em andamento no sandbox");
  await page.open("/multicorder");
  check("a janela carrega com as entradas da mesa", await until(() => page.ev(`document.querySelectorAll("#rows input[data-cam]").length > 0`)) === true, before.availableCams.join(", "));
  await sleep(1500);
  check("abrir a janela não envia nenhum comando", t.posts.filter((p) => p.url === "/api/iso").length === 0);
  check("o formato do programa aparece em verde", await page.is(`#formats button[data-format="${before.recordOptions.format}"]`, "vd-on") === true, before.recordOptions.format);
  await page.shot("1-como-abre");
  await page.click("#start");
  check("'Começar' sem entrada marcada: aviso, nenhum comando", (await page.text("#msg")).includes("Marque") && t.posts.filter((p) => p.url === "/api/iso").length === 0, await page.text("#msg"));

  await page.choose("#split", "300"); await page.type("#directory", folder.replaceAll("\\", "/"));
  check("alteração fica marcada como não salva", (await page.text("#msg")).includes("não salvas"), await page.text("#msg"));
  await page.click(`#rows input[data-cam=${JSON.stringify(cam)}]`);
  await page.click("#start"); await idle();
  const running = await until(async () => { const s = await iso(); return s.rec ? s : null; }, 30000);
  check("'Começar' salva as opções e põe a entrada gravando de verdade", !!running && running.recordOptions.format === before.recordOptions.format && Number(running.recordOptions.splitSeconds) === 300 && running.session?.cams?.some((c) => c.name === cam), running ? `${running.session.cams.length} entrada(s), formato ${running.recordOptions.format}` : await page.text("#msg"));
  await until(() => page.ev(`document.querySelector("#start").textContent === "Parar"`), 8000);
  check("o botão vira 'Parar' em vermelho, a linha mostra GRAVANDO e os campos travam", await page.text("#start") === "Parar" && await page.is("#start", "vd-air") && (await page.text("#rows")).includes("GRAVANDO") && await page.is("#directory", "disabled") === true, await page.text("#rows"));
  await sleep(4500); await page.shot("2-gravando");
  const ticking = await page.ev(`document.querySelector("#rows td.vd-mono").textContent`);
  check("a duração anda", /^00:0[3-9]$/.test(ticking), ticking);
  await page.click("#start"); await idle();
  const stopped = await until(async () => { const s = await iso(); return s.rec ? null : s; }, 40000);
  const written = (await filesIn(folder)).filter((f) => /\.ts$/i.test(f)), size = written.length ? (await fs.stat(written[0])).size : 0;
  check("'Parar' fecha a gravação e o arquivo está na pasta escolhida", !!stopped && written.length >= 1 && size > 4096, written.length ? `${path.basename(written[0])}, ${Math.round(size / 1024)} KB` : "nenhum arquivo .ts em " + folder);
  await until(() => page.ev(`document.querySelector("#start").textContent === "Começar"`), 8000);
  check("depois de parar, a janela volta a 'Começar' e destrava", await page.text("#start") === "Começar" && await page.is("#directory", "disabled") === false);

  await page.click('#formats button[data-format="mkv"]'); await page.click("#save-close"); await idle();
  check("'Salvar e Fechar' grava a opção no programa e fecha", (await iso()).recordOptions.format === "mkv" && await page.closed() === true, (await iso()).recordOptions.format);
  check("nenhum erro de script na página", t.problems.length === 0, t.problems.join(" | "));
} finally {
  if ((await iso()).rec) await post({ action: "stop" }).catch(() => {});
  const restored = await post({ action: "configure", options: before.recordOptions });
  console.log("opções originais repostas: " + (restored.success === true));
  await obs.req("RemoveInput", { inputName: cam + " (fonte)" }).catch(() => {}); await obs.req("RemoveScene", { sceneName: cam }).catch(() => {}); obs.close?.();
}
process.exit((await t.finish()) ? 0 : 1);
