// Rehearses "undo the last update" on a rehearsal copy that has just received an update (never on the mesa):
// builds the records the launcher would have left, runs the owner's undo script against the copy, and checks that the
// copy is back at the version and engine it had before, with the update pointer restored.
//   <pacote>/runtime/node.exe scripts/qa/ensaiar-desfazer.mjs --ensaio=qa-finalizacao/ensaio-atualizacao-<versão>.json
import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";

const ws = path.resolve(import.meta.dirname, "../.."), qa = path.join(ws, "qa-finalizacao");
const args = Object.fromEntries(process.argv.slice(2).map((a) => { const m = /^--([a-z-]+)=(.*)$/.exec(a); assert(m); return [m[1], m[2]]; }));
const rehearsal = JSON.parse(await fs.readFile(path.resolve(args.ensaio), "utf8")), installed = rehearsal.installed, root = path.dirname(installed);
assert.equal(rehearsal.status, "UPDATE_APPLIED_ON_REHEARSAL_COPY"); assert(path.basename(root).startsWith("FreeMix-QA-"), "só em cópia de ensaio");
await fs.access(path.join(root, ".freemix-qa-owned")).catch(() => fs.access(path.join(installed, ".freemix-qa-owned")));
const sha = async (p) => createHash("sha256").update(await fs.readFile(p)).digest("hex");
const backups = await fs.readdir(path.join(installed, "updates")); assert.equal(backups.length, 1, "esperada uma cópia de segurança");
const records = path.join(root, "registros-desfazer"); await fs.mkdir(records, { recursive: true });
await fs.writeFile(path.join(records, "APLICACAO-ULTIMA.json"), JSON.stringify({ version: rehearsal.newVersion, backup: path.join(installed, "updates", backups[0]) }));
await fs.writeFile(path.join(records, "ULTIMA-ATUALIZACAO.json"), JSON.stringify({ version: rehearsal.newVersion, package: "x" }));
await fs.writeFile(path.join(records, "ULTIMA-ATUALIZACAO.anterior.json"), JSON.stringify({ version: rehearsal.mesaVersion, package: "anterior" }));
const engineAfterUpdate = await sha(path.join(installed, "bin/64bit/FreeMix.exe"));
const r = spawnSync(path.join(installed, "runtime/node.exe"), [path.join(ws, "scripts/inicializacao/desfazer-ultima-atualizacao.mjs"), "--root=" + installed, "--records=" + records], { encoding: "utf8", windowsHide: true });
const version = JSON.parse(await fs.readFile(path.join(installed, "version.json"), "utf8")).version, pointer = JSON.parse(await fs.readFile(path.join(records, "ULTIMA-ATUALIZACAO.json"), "utf8"));
const original = path.join(ws, "archived", "rollback-installer-" + rehearsal.mesaVersion.split(".").pop(), "FreeMix-Completo-" + rehearsal.mesaVersion, "bin/64bit/FreeMix.exe");
const checks = {
  scriptSucceeded: r.status === 0,
  versionBack: version === rehearsal.mesaVersion,
  engineBackToOriginal: (await sha(path.join(installed, "bin/64bit/FreeMix.exe"))) === (await sha(original)) && engineAfterUpdate !== (await sha(original)),
  newWindowRemoved: !(await fs.access(path.join(installed, "painel/remoto/transmitir.html")).then(() => true, () => false)),
  pointerRestored: pointer.version === rehearsal.mesaVersion,
  receiptCleared: !(await fs.access(path.join(records, "APLICACAO-ULTIMA.json")).then(() => true, () => false)),
};
const result = { status: Object.values(checks).every(Boolean) ? "UNDO_OK_ON_REHEARSAL_COPY" : "FAIL", installed, from: rehearsal.newVersion, backTo: version, checks, output: (r.stdout + r.stderr).trim().split("\n").slice(-3), operatorTouched: false };
await fs.writeFile(path.join(qa, "ensaio-desfazer-" + rehearsal.newVersion + ".json"), JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify(result)); process.exit(result.status === "FAIL" ? 1 : 0);
