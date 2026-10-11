// Diagnosis scenario: only loads the installation's mesa page in an external browser for a few seconds, clicking
// nothing. Used with experimento-fechamento.mjs to tell apart "an outside copy of the mesa page upsets the program"
// from "opening windows through the mesa upsets the program".
import path from "node:path";
import { pathToFileURL } from "node:url";
import { openTest, until, sleep } from "./navegador-teste.mjs";
const t = await openTest({ width: 1835, height: 885 }), { page, check } = t;
await page.open(pathToFileURL(path.join(t.sandbox.installed, "painel/mesa.html")).href);
check("a mesa carrega num navegador de fora", await until(() => page.ev(`!!document.querySelector('[data-a="pop"][data-v="recset"]')`), 30000) === true);
await sleep(8000);
process.exit((await t.finish()) ? 0 : 1);
