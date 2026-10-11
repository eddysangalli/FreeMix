// Asks the sandbox's program for a picture of its own main window (the mesa as the operator sees it) and for the
// facts it reports about its interface. Read only.
//   node scripts/qa/retrato-da-mesa.mjs <saida.png>
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
const ws = path.resolve(import.meta.dirname, "../.."), sandbox = JSON.parse(await fs.readFile(path.join(ws, "qa-finalizacao/sandbox-telas/sandbox.json"), "utf8"));
const { connect } = await import(pathToFileURL(path.join(sandbox.installed, "ferramentas/obsws.mjs")));
const obs = await connect({ root: sandbox.installed });
const r = (await obs.req("CallVendorRequest", { vendorName: "freemix", requestType: "get_interface", requestData: { screenshot: true } })).responseData;
const image = Object.entries(r).find(([, v]) => typeof v === "string" && v.length > 2000);
const facts = Object.fromEntries(Object.entries(r).filter(([, v]) => typeof v !== "string" || v.length < 300));
if (image && process.argv[2]) { const data = image[1].replace(/^data:image\/\w+;base64,/, ""); await fs.mkdir(path.dirname(path.resolve(process.argv[2])), { recursive: true }); await fs.writeFile(path.resolve(process.argv[2]), Buffer.from(data, "base64")); }
console.log(JSON.stringify({ imageField: image?.[0] || null, imageBytes: image ? Math.round(image[1].length * 0.75) : 0, facts }, null, 1));
obs.close?.();
