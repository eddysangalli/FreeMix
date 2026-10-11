// Mirrors the workspace's scripts and launchers into the working tree of the private repository (FreeMix/scripts),
// so that what runs the builds, tests, updates and rehearsals is on GitHub too. Only this direction, only these
// folders: the panel, the tools and the docs are edited in the repository itself and are NOT touched here.
// Never copied: binaries, logs, anything from the operator's installation. Stops if the control password of the
// mesa (read only to compare, never printed) or anything that looks like a key shows up in what would be published.
// Does not commit and does not push.
//   node scripts/build/subir-scripts-para-repo.mjs
import fs from "node:fs/promises";
import path from "node:path";

const ws = path.resolve(import.meta.dirname, "../.."), repo = path.join(ws, "FreeMix");
const skip = (rel) => /\.(exe|dll|log|pdb|zip|7z|msi)$/i.test(rel) || /(^|\/)PayloadInfo\.cs$/.test(rel) || /(^|\/)(node_modules|bin|obj|\.vs)\//.test(rel);
const copied = [], removed = [];
async function mirror(from, to) {
  const wanted = new Set();
  for (const e of await fs.readdir(from, { withFileTypes: true, recursive: true })) {
    if (!e.isFile()) continue; const src = path.join(e.parentPath, e.name), rel = path.relative(from, src).replaceAll("\\", "/"); if (skip(rel)) continue;
    wanted.add(rel); const dst = path.join(to, rel), a = await fs.readFile(src), b = await fs.readFile(dst).catch(() => null);
    if (!b || !a.equals(b)) { await fs.mkdir(path.dirname(dst), { recursive: true }); await fs.writeFile(dst, a); copied.push(path.relative(repo, dst).replaceAll("\\", "/")); }
  }
  return wanted;
}
const wanted = await mirror(path.join(ws, "scripts"), path.join(repo, "scripts"));
// The launchers the owner double-clicks live at the workspace root.
for (const name of ["ABRIR-FREEMIX.cmd", "DESFAZER-ATUALIZACAO.cmd"]) { const a = await fs.readFile(path.join(ws, name)).catch(() => null); if (!a) continue; const dst = path.join(repo, "scripts/workspace-launcher", name), b = await fs.readFile(dst).catch(() => null); if (!b || !a.equals(b)) { await fs.mkdir(path.dirname(dst), { recursive: true }); await fs.writeFile(dst, a); copied.push("scripts/workspace-launcher/" + name); } }

// Nothing secret may leave the machine.
const password = /"password"\s*:\s*"([^"]+)"/.exec(await fs.readFile(path.join(ws, "obs-vmix/painel/local.js"), "utf8").catch(() => ""))?.[1] || null, bad = [];
for (const e of await fs.readdir(path.join(repo, "scripts"), { withFileTypes: true, recursive: true })) {
  if (!e.isFile()) continue; const file = path.join(e.parentPath, e.name), stat = await fs.stat(file); if (stat.size > 5 * 1024 * 1024) continue;
  const text = await fs.readFile(file, "utf8"), rel = path.relative(repo, file).replaceAll("\\", "/");
  if (password && text.includes(password)) bad.push("senha do servidor de controle em " + rel);
  if (/gh[pousr]_[A-Za-z0-9]{30,}|sk-[A-Za-z0-9]{30,}|live_[0-9]{6,}_[A-Za-z0-9]{20,}|-----BEGIN [A-Z ]*PRIVATE KEY/.test(text)) bad.push("algo com cara de chave em " + rel);
}
console.log(JSON.stringify({ status: bad.length ? "PARADO_NAO_PUBLIQUE" : "COPIADO_SEM_SEGREDOS", copied: copied.length, files: copied.slice(0, 80), problems: bad }, null, 1));
process.exit(bad.length ? 1 : 0);
