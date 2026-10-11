// Arms (or disarms) an update for the operator's mesa. Run ONLY after the owner says yes.
//
// Arming does not touch the installation: it writes entregas/ULTIMA-ATUALIZACAO.json, the pointer the launcher
// (ABRIR-FREEMIX.cmd) reads. The next time the operator opens the mesa with it closed, the launcher applies the
// package with the installation's own updater (backup + journal in obs-vmix/updates) and then opens normally.
//
//   node scripts/distribuicao/armar-atualizacao-mesa.mjs --package=entregas/FreeMix-Atualizacao-<version>
//   node scripts/distribuicao/armar-atualizacao-mesa.mjs --desarmar        (puts the previous pointer back)
//
// Refuses unless: the package was built for the mesa itself, the mesa's own updater accepts it, and the same engine
// and repository commit were applied successfully on a rehearsal copy of the mesa's version.
import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";

const ws = path.resolve(import.meta.dirname, "../.."), qa = path.join(ws, "qa-finalizacao"), mesa = path.join(ws, "obs-vmix"), pointer = path.join(ws, "entregas/ULTIMA-ATUALIZACAO.json"), previous = path.join(ws, "entregas/ULTIMA-ATUALIZACAO.anterior.json");
const args = Object.fromEntries(process.argv.slice(2).map((a) => { const m = /^--([a-z-]+)(?:=(.*))?$/.exec(a); assert(m, "argumento inválido: " + a); return [m[1], m[2] ?? true]; }));
const json = async (p) => JSON.parse(await fs.readFile(p, "utf8")), exists = (p) => fs.access(p).then(() => true, () => false);
const installed = (await json(path.join(mesa, "version.json"))).version;

if (args.desarmar) {
  assert(await exists(previous), "não há ponteiro anterior guardado");
  const old = await json(previous), now = await json(pointer);
  assert.notEqual(installed, now.version, "a atualização armada já foi aplicada na mesa; para voltar use o rollback do atualizador");
  await fs.writeFile(pointer, JSON.stringify(old, null, 2) + "\n"); await fs.rm(previous);
  console.log(JSON.stringify({ status: "DISARMED", pointerVersion: old.version, mesaVersion: installed })); process.exit(0);
}

assert(typeof args.package === "string", "informe --package");
const pkg = path.resolve(ws, args.package), rel = path.relative(path.join(ws, "entregas"), pkg);
assert(rel && !rel.startsWith("..") && !path.isAbsolute(rel), "o pacote precisa estar em entregas/");
const version = (await json(path.join(pkg, "version.json"))).version, report = await json(path.join(qa, "atualizacao-" + version + ".json"));
assert.equal(path.resolve(report.target), mesa, "este pacote não foi montado para a mesa (obs-vmix)");
assert.equal(report.installedVersion, installed, "a mesa mudou de versão desde que o pacote foi montado; monte de novo");
// Same engine and same repository commit proven on a rehearsal copy of the mesa's version.
let rehearsal = null;
for (const name of (await fs.readdir(qa)).filter((f) => /^ensaio-atualizacao-.*\.json$/.test(f))) {
  const e = await json(path.join(qa, name)); if (e.status !== "UPDATE_APPLIED_ON_REHEARSAL_COPY" || e.mesaVersion !== installed || e.engine !== report.engine) continue;
  const built = await json(path.join(qa, "atualizacao-" + e.newVersion + ".json")).catch(() => null);
  if (built?.repository === report.repository) rehearsal = { file: name, version: e.newVersion };
}
assert(rehearsal, `sem ensaio aprovado para motor ${report.engine.slice(0, 7)} + repositório ${report.repository.slice(0, 7)} sobre a versão ${installed}; rode scripts/qa/ensaiar-atualizacao.mjs`);
const { inspect } = await import(pathToFileURL(path.join(mesa, "ferramentas/atualizar-freemix.mjs")));
const checked = await inspect(mesa, pkg, await fs.readFile(path.join(mesa, "update-public.pem")));   // reads only
assert.equal(checked.version, version, "o atualizador da mesa leu outra versão no pacote");

const old = await json(pointer).catch(() => null);
if (old && !(await exists(previous))) await fs.writeFile(previous, JSON.stringify(old, null, 2) + "\n");
await fs.writeFile(pointer, JSON.stringify({ version, package: path.relative(ws, pkg).replaceAll("\\", "/"), at: new Date().toISOString(), from: installed, engine: report.engine, repository: report.repository, rehearsal: rehearsal.file }, null, 2) + "\n");
await fs.writeFile(path.join(qa, "atualizacao-" + version + ".json"), JSON.stringify({ ...report, armedForOperator: true, armedAt: new Date().toISOString(), rehearsal: rehearsal.file }, null, 2) + "\n");
console.log(JSON.stringify({ status: "ARMED_NOT_APPLIED", version, from: installed, files: report.files, megabytes: report.megabytes, rehearsal: rehearsal.file, how: "feche a mesa e abra pelo ABRIR-FREEMIX.cmd" }));
