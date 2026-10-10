// Update check for the third-party components listed in componentes.json. For each one: asks GitHub for the latest
// published release and compares it with the installed version, and checks that the installed files still have the
// SHA-256 recorded in the approved release. Read-only: upstream releases are references, not approved upgrades.
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url)), file = root + "componentes.json";
if (process.argv.includes("--fixar")) throw Error("Hashes dos componentes pertencem à entrega FreeMix aprovada; não podem ser redefinidos no cliente.");
const man = JSON.parse(readFileSync(file, "utf8"));
const norm = (v) => String(v || "").replace(/^v/i, "");
const newer = (a, b) => { const x = norm(a).split(/[.-]/).map(Number), y = norm(b).split(/[.-]/).map(Number); for (let i = 0; i < Math.max(x.length, y.length); i++) { const d = (x[i] || 0) - (y[i] || 0); if (d) return d > 0; } return false; };
let news = 0, changed = 0, unknown = 0;
for (const c of man.componentes) {
  const notes = [];
  c.sha256 ||= {};
  for (const f of c.arquivos || []) {
    if (!existsSync(root + f)) { notes.push(`ARQUIVO AUSENTE ${f}`); changed++; continue; }
    const h = createHash("sha256").update(readFileSync(root + f)).digest("hex");
    if (!c.sha256[f]) notes.push(`sem hash registrado: ${f}`);
    else if (c.sha256[f] !== h) { notes.push(`ARQUIVO DIFERENTE DO REGISTRADO: ${f}`); changed++; }
  }
  let latest = "?";
  try {
    const r = await fetch(`https://api.github.com/repos/${c.repo}/releases/latest`, { headers: { "User-Agent": "freemix-update-check", Accept: "application/vnd.github+json" } });
    if (r.ok) { const j = await r.json(); latest = norm(j.tag_name); if (newer(latest, c.versao)) { news++; notes.push(`REFERÊNCIA UPSTREAM ${latest} (${String(j.published_at).slice(0, 10)}); aguarde uma entrega FreeMix aprovada`); } }
    else { unknown++; notes.push(`consulta falhou (HTTP ${r.status})`); }
  } catch (e) { unknown++; notes.push(`sem acesso à rede (${e.message})`); }
  console.log(`${c.nome.padEnd(24)} instalada ${c.versao.padEnd(8)} publicada ${latest.padEnd(10)} ${notes.join(" | ") || "em dia"}`);
}
console.log(`${news} com versão nova, ${changed} com arquivo alterado ou ausente, ${unknown} sem resposta`);
