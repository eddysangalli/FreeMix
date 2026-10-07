// Serves the panel folder on 127.0.0.1:8377 so the panel can be opened in a normal browser next to the running
// program (it talks to the same engine). Used to check panel changes without restarting the program.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../painel/", import.meta.url));
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".png": "image/png", ".svg": "image/svg+xml" };
createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^[\\/]+/, "") || "mesa.html";
  if (path.includes("..")) { res.writeHead(403).end(); return; }
  try { const body = await readFile(join(root, path)); res.writeHead(200, { "Content-Type": types[extname(path)] || "application/octet-stream", "Cache-Control": "no-store" }).end(body); }
  catch { res.writeHead(404).end("não encontrado"); }
}).listen(8377, "127.0.0.1", () => console.log("painel em http://127.0.0.1:8377/mesa.html"));
