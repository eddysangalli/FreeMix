// API of the screens sandbox: the product's own server, unchanged, plus a cooperative close over the parent channel.
import path from "node:path";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
const root = process.env.FREEMIX_ROOT; assert(root && process.env.FREEMIX_QA_OWN_ONLY === "YES");
process.on("message", (m) => { if (m?.kind === "close") { process.emit("SIGTERM"); process.disconnect?.(); } });
await import(pathToFileURL(path.join(root, "ferramentas/servidor-api.mjs")));
