// Rehearsal of an update of the operator's mesa, on a copy that is not the operator's.
// 1. Installs, in an own test folder, the full package of the version the mesa has today.
// 2. Builds the signed update for that folder (same recipe as for the mesa) and compares its file list with what the
//    mesa itself would receive (the mesa is only read).
// 3. Applies it with the installation's own updater, the way the launcher does, and checks the result.
// Then open it with:  sandbox-telas.mjs --instalacao=<folder printed here>   and run the click tests.
//   <pacote>/runtime/node.exe scripts/qa/ensaiar-atualizacao.mjs --freeze=<native-build-frozen-*.json>
import fs from "node:fs/promises";
import path from "node:path";
import net from "node:net";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const ws = path.resolve(import.meta.dirname, "../.."), qa = path.join(ws, "qa-finalizacao");
const args = Object.fromEntries(process.argv.slice(2).map((a) => { const m = /^--([a-z-]+)(?:=(.*))?$/.exec(a); assert(m); return [m[1], m[2] ?? true]; }));
const freeze = path.resolve(args.freeze), frozen = JSON.parse(await fs.readFile(freeze, "utf8")), mesa = path.join(ws, "obs-vmix");
const mesaVersion = JSON.parse(await fs.readFile(path.join(mesa, "version.json"), "utf8")).version;
const oldPackage = path.join(ws, "archived", "rollback-installer-" + mesaVersion.split(".").pop(), "FreeMix-Completo-" + mesaVersion);
assert.equal(JSON.parse(await fs.readFile(path.join(oldPackage, "version.json"), "utf8")).version, mesaVersion, "pacote completo da versão da mesa não encontrado");
const sha = async (p) => createHash("sha256").update(await fs.readFile(p)).digest("hex");
const run = (exe, argv) => { const r = spawnSync(exe, argv, { cwd: ws, encoding: "utf8", windowsHide: true, maxBuffer: 64 * 1024 * 1024 }); if (r.status !== 0) throw Error((r.stderr || r.stdout || "falhou").trim().split("\n").slice(-3).join(" | ")); return r.stdout.trim(); };

const temp = path.join(qa, "own-temp-sandbox-telas"); await fs.mkdir(temp, { recursive: true }); process.env.TEMP = process.env.TMP = temp;
const { newQaRoot, assertOwnedQa } = await import(pathToFileURL(path.join(qa, "native36-real-app-r4e-preparation-20261011/candidate-context.mjs")));
const root = await newQaRoot("Ensaio"), installed = path.join(root, "FreeMix-QA-Ensaio Mesa"); await assertOwnedQa(root, installed);
const freePort = async () => { const s = net.createServer(); await new Promise((r) => s.listen(0, "127.0.0.1", r)); const n = s.address().port; await new Promise((r) => s.close(r)); return n; };
const ports = { apiPort: await freePort(), wsPort: await freePort() };
console.log(`1. instalando a versão da mesa (${mesaVersion}) em ${installed}`);
const { installPortable } = await import(pathToFileURL(path.join(oldPackage, "ferramentas/instalar-portatil.mjs")));
await installPortable(oldPackage, installed, ports);
await fs.writeFile(path.join(root, "ensaio.json"), JSON.stringify(ports));

console.log("2. montando a atualização para a cópia e comparando com o que a mesa receberia");
const builder = path.join(ws, "scripts/distribuicao/montar-atualizacao-mesa.mjs");
const forMesa = JSON.parse(run(process.execPath, [builder, "--freeze=" + freeze, "--target=" + mesa, "--dry"]));
const built = JSON.parse(run(process.execPath, [builder, "--freeze=" + freeze, "--target=" + installed]).split("\n").pop());
const manifest = JSON.parse(await fs.readFile(path.join(built.package, "manifest.json"), "utf8"));

console.log("3. aplicando com o atualizador da própria instalação");
const applied = JSON.parse(run(path.join(installed, "runtime/node.exe"), [path.join(installed, "ferramentas/atualizar-freemix.mjs"), "apply", installed, built.package]).split("\n").pop());
const exe = frozen.files.find((f) => f.path === "bin/64bit/FreeMix.exe");
const checks = {
  versionAfter: JSON.parse(await fs.readFile(path.join(installed, "version.json"), "utf8")).version === built.version,
  engineIsTheFrozenBuild: (await sha(path.join(installed, exe.path))) === exe.sha256,
  newWindowPresent: await fs.access(path.join(installed, "painel/remoto/transmitir.html")).then(() => true, () => false),
  everyPackageFileInPlace: (await Promise.all(manifest.files.map(async (f) => (await sha(path.join(installed, f.path))) === f.sha256))).every(Boolean),
  backupKept: await fs.access(path.join(applied.backup, "journal.json")).then(() => true, () => false),
};
const result = { status: Object.values(checks).every(Boolean) ? "UPDATE_APPLIED_ON_REHEARSAL_COPY" : "FAIL", mesaVersion, newVersion: built.version, engine: frozen.head, installed, package: built.package, packageFiles: built.files, packageMegabytes: built.megabytes, mesaWouldReceive: { changed: forMesa.changed, megabytes: forMesa.megabytes }, checks, operatorTouched: false };
await fs.writeFile(path.join(qa, "ensaio-atualizacao-" + built.version + ".json"), JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify(result));
process.exit(result.status === "FAIL" ? 1 : 0);
