// Checks that the .gtzip converter works, without leaving anything in the gallery: converts one package into a
// temporary folder and looks at what came out. Give the package as argument; with none, uses one from the study
// copy of the reference program on this machine (only read, never copied into the product).
//   node test-conversor.mjs [arquivo.gtzip]
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { convertGtzipFile } from "./gtzip_converter.mjs";
const src = process.argv[2] || "D:/DRIVE/IA/antigravity/vmixtwste/vMix27-copia/titles/GT Title/Title 0- The Classic Blue.gtzip";
if (!existsSync(src)) { console.log("pacote não encontrado: " + src); process.exit(1); }
const out = mkdtempSync(join(tmpdir(), "freemix-gt-"));
let pass = 0, total = 0;
const check = (name, ok, detail = "") => { total++; if (ok) pass++; console.log(`${ok ? "OK   " : "FALHA"} ${name}${detail !== "" ? "  (" + detail + ")" : ""}`); };
try {
  convertGtzipFile(src, out);
  const dir = readdirSync(out).map((d) => join(out, d)).find((d) => statSync(d).isDirectory());
  const files = dir ? readdirSync(dir) : [];
  check("o pacote vira uma pasta com a página e os descritores", !!dir && files.includes("index.html") && files.some((f) => f.endsWith(".json") && f !== "manifest.json"), files.join(", "));
  const html = dir ? readFileSync(join(dir, "index.html"), "utf8") : "";
  check("a página segue o contrato dos títulos do FreeMix (window.GC com play, stop e update)", /window\.GC\s*=/.test(html) && /play/.test(html) && /stop/.test(html) && /update/.test(html));
  const desc = dir ? JSON.parse(readFileSync(join(dir, files.find((f) => f.endsWith(".json") && f !== "manifest.json")), "utf8")) : {};
  check("o descritor traz identificação, campos editáveis e a aba neutra 'Importados'", !!desc.id && Array.isArray(desc.fields) && desc.fields.length > 0 && desc.collection === "Importados", `${desc.fields?.length || 0} campos: ${(desc.fields || []).map((f) => f.key).join(", ")}; aba "${desc.collection}"`);
  check("o nome do outro programa não vai para o que o operador vê", !/vmix/i.test(JSON.stringify({ n: desc.name, c: desc.collection, k: desc.category, f: (desc.fields || []).map((f) => f.label) })));
} catch (e) { check("a conversão termina sem erro", false, e.message); }
finally { rmSync(out, { recursive: true, force: true }); }
console.log(`${pass}/${total} verificações passaram`);
