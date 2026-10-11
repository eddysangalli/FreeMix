// Real click test of the recording setup window (/gravar) against the screens sandbox: what OK saves is read back
// from the engine, and a short real recording proves the saved format and folder are the ones actually used.
// Everything is written inside the sandbox's own folder; the original settings are put back at the end.
//   node scripts/qa/test-gravar.mjs [pasta-para-retratos]
import fs from "node:fs/promises";
import path from "node:path";
import { openTest, until, sleep } from "./navegador-teste.mjs";

const t = await openTest({ width: 700, height: 300, shots: process.argv[2] ? path.resolve(process.argv[2]) : null }), { page, check, api, command } = t;
const settings = async () => (await api("/api/settings")).settings;
const before = await settings(), original = { category: "recording", directory: before.recordDirectory, format: before.values.RecFormat2, quality: before.values.RecQuality, encoder: before.values.RecEncoder };
const folder = path.join(t.sandbox.installed, "gravacoes-teste-" + Date.now().toString(36)); await fs.mkdir(folder, { recursive: true });
const idle = () => until(() => page.ev(`!document.querySelector("#cancel").disabled`), 30000);
try {
  await page.open("/gravar");
  check("a janela carrega com os dados do programa", await until(() => page.ev(`document.querySelectorAll("#formats button").length > 0 && document.querySelector("#encoder").options.length > 0`)) === true);
  await sleep(1500);
  check("abrir a janela não envia nenhum comando", t.posts.filter((p) => p.url === "/api/control").length === 0, t.posts.map((p) => p.action).join(","));
  check("formatos como botões no topo, com o do programa em verde", await page.ev(`[...document.querySelectorAll("#formats button")].map((b) => b.textContent + (b.classList.contains("vd-on") ? "*" : "")).join(" ")`) === ["MKV", "MP4", "MOV"].map((f) => f + (f.toLowerCase() === before.values.RecFormat2.replace(/^(fragmented|hybrid)_/, "") ? "*" : "")).join(" "), await page.ev(`[...document.querySelectorAll("#formats button")].map((b) => b.textContent + (b.classList.contains("vd-on") ? "*" : "")).join(" ")`));
  check("pasta, codec e qualidade são os do programa", await page.value("#directory") === before.recordDirectory && await page.value("#encoder") === before.values.RecEncoder && await page.value("#quality") === before.values.RecQuality);
  await page.shot("1-como-abre");

  // Cancel keeps the engine as it was
  await page.click('#formats button[data-container="mov"]'); await page.click("#cancel");
  check("'Cancelar' fecha sem gravar nada no programa", await page.closed() === true && (await settings()).values.RecFormat2 === before.values.RecFormat2 && t.posts.filter((p) => p.url === "/api/control").length === 0);

  // Choose and save
  await page.open("/gravar"); await until(() => page.ev(`document.querySelectorAll("#formats button").length > 0`));
  await page.click('#formats button[data-container="mp4"]');
  check("em MP4 aparece 'Modo Tolerante a falhas'", await page.is("#tolerant-row", "hidden") === false && (await page.text("#msg")).includes("não salvas"), await page.text("#msg"));
  await page.click("#tolerant"); await page.choose("#quality", "HQ"); await page.type("#directory", folder.replaceAll("\\", "/"));
  const gpu = await page.is("#hardware", "disabled") === false; if (gpu && !(await page.is("#hardware", "checked"))) await page.click("#hardware");
  const chosenEncoder = await page.value("#encoder");
  check("marcar a GPU troca o codec para o da placa de vídeo", !gpu || /nvenc|qsv|amf/i.test(chosenEncoder), gpu ? chosenEncoder : "este computador não oferece codec de placa de vídeo");
  await page.shot("2-escolhido-antes-do-ok");
  await page.click("#ok");
  const saved = await until(async () => { const s = await settings(); return s.values.RecQuality === "HQ" ? s : null; }, 20000);
  check("'OK' grava formato, qualidade, codec e pasta no programa", !!saved && /^(hybrid|fragmented)_mp4$/.test(saved.values.RecFormat2) && saved.values.RecEncoder === chosenEncoder && saved.recordDirectory.replaceAll("\\", "/") === folder.replaceAll("\\", "/"), saved ? `${saved.values.RecFormat2}, ${saved.values.RecQuality}, ${saved.values.RecEncoder}` : await page.text("#msg"));
  check("'OK' fecha a janela depois da confirmação", await page.closed() === true);

  // A real recording uses what was saved, and locks the window while it runs
  await page.open("/gravar"); await until(() => page.ev(`document.querySelectorAll("#formats button").length > 0`));
  check("ao reabrir, a janela mostra o que foi salvo", await page.is('#formats button[data-container="mp4"]', "vd-on") && await page.is("#tolerant", "checked") && await page.value("#quality") === "HQ");
  const started = await command({ action: "record", active: true });
  const locked = await until(async () => (await page.is("#ok", "disabled")) && (await page.text("#msg")).includes("Gravando"), 15000);
  check("com gravação em andamento a janela trava e avisa", started.success === true && locked === true, await page.text("#msg"));
  await page.shot("3-gravando-travada");
  await sleep(4000); await command({ action: "record", active: false });
  const file = await until(async () => { const f = (await fs.readdir(folder)).find((n) => /\.mp4$/i.test(n)); if (!f) return null; const s = await fs.stat(path.join(folder, f)); return s.size > 4096 ? { name: f, size: s.size } : null; }, 20000);   // a black picture compresses to almost nothing
  check("a gravação real saiu em MP4 na pasta escolhida", !!file, file ? `${file.name}, ${Math.round(file.size / 1024)} KB` : "nenhum arquivo .mp4 em " + folder);
  check("parada a gravação, a janela destrava", await until(async () => !(await page.is("#ok", "disabled")), 15000) === true);

  // Empty folder is refused here, before any command
  const sent = t.posts.length; await page.type("#directory", "   "); await page.click("#ok"); await sleep(500);
  check("pasta em branco: aviso, nenhum comando enviado", (await page.text("#msg")).includes("Informe a pasta") && t.posts.length === sent, await page.text("#msg"));
  check("nenhum erro de script na página", t.problems.length === 0, t.problems.join(" | "));
} finally {
  await command({ action: "record", active: false }).catch(() => {});
  const restored = await command({ action: "settings_apply", ...original });
  console.log("configuração original reposta: " + (restored.success === true));
}
process.exit((await t.finish()) ? 0 : 1);
