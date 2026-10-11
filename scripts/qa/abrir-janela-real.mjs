// Asks the sandbox's program to open one of its own windows (the same request the Mesa sends when a cog is
// clicked), so the page can be seen inside the real program window and not only in a browser.
//   node scripts/qa/abrir-janela-real.mjs /transmitir "Configurações de streaming" 700 445
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
const ws = path.resolve(import.meta.dirname, "../.."), sandbox = JSON.parse(await fs.readFile(path.join(ws, "qa-finalizacao/sandbox-telas/sandbox.json"), "utf8"));
const [route, title, width, height] = process.argv.slice(2);
const { connect } = await import(pathToFileURL(path.join(sandbox.installed, "ferramentas/obsws.mjs")));
const obs = await connect({ root: sandbox.installed });
const r = (await obs.req("CallVendorRequest", { vendorName: "freemix", requestType: "open_panel", requestData: { url: sandbox.base + route, title, ...(width ? { width: Number(width), height: Number(height) } : {}) } })).responseData;
console.log(JSON.stringify({ success: r.success, error: r.error || null, nativePid: sandbox.nativePid }));
obs.close?.();
process.exit(r.success ? 0 : 1);
