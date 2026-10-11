// Undoes the last update applied to the mesa (obs-vmix), with the installation's own updater: every file the update
// changed goes back from the safety copy it made in <installation>/updates, and the update pointer goes back too, so
// the launcher does not apply the same update again. Run by the owner, with the mesa closed (DESFAZER-ATUALIZACAO.cmd).
// Settings, recordings and projects are not part of an update and are not touched by undoing it either.
//
// For rehearsals only: --root=<test installation> --records=<folder holding APLICACAO-ULTIMA.json and the pointers>.
import { readFile, writeFile, rm } from "node:fs/promises";
import { resolve, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";

const args = Object.fromEntries(process.argv.slice(2).map((a) => { const m = /^--([a-z-]+)=(.*)$/.exec(a); if (!m) { console.error("argumento inválido: " + a); process.exit(1); } return [m[1], m[2]]; }));
const workspace = resolve(fileURLToPath(new URL("../../", import.meta.url))), root = resolve(args.root || join(workspace, "obs-vmix")), records = resolve(args.records || join(workspace, "entregas")), helper = join(root, "runtime/freemix-process-info.exe");
const { rollback } = await import(pathToFileURL(join(root, "ferramentas/atualizar-freemix.mjs")));
const json = async (p) => JSON.parse(await readFile(p, "utf8"));
const receipt = await json(join(records, "APLICACAO-ULTIMA.json")).catch(() => null);
if (!receipt?.backup) { console.error("Não há atualização aplicada registrada para desfazer."); process.exit(1); }
const installed = (await json(join(root, "version.json"))).version;
if (receipt.version && receipt.version !== installed) { console.error(`A mesa está na versão ${installed}, não na ${receipt.version} que o registro aponta. Nada foi alterado.`); process.exit(1); }
// Only the update the pointer names is undone: with a newer update armed and not applied yet, the record on disk
// still describes an older update, and undoing that one is not what the owner is asking for.
const armed = await json(join(records, "ULTIMA-ATUALIZACAO.json")).catch(() => null);
if (armed?.version && armed.version !== installed) { console.error(`A atualização ${armed.version} está preparada mas ainda não foi aplicada (a mesa está na ${installed}). Não há o que desfazer. Nada foi alterado.`); process.exit(1); }

// The mesa must be closed by the owner; only its own local helper service, left running in the background by design,
// is stopped here, after checking it belongs to this installation (the same rule the launcher uses before updating).
const ids = execFileSync("tasklist.exe", ["/FO", "CSV", "/NH"], { encoding: "utf8", windowsHide: true, timeout: 10000 }).split(/\r?\n/).map((s) => s.match(/^"(?:FreeMix|obs64)\.exe","(\d+)"/i)?.[1]).filter(Boolean);
const rows = ids.length ? JSON.parse(execFileSync(helper, ids, { encoding: "utf8", windowsHide: true, timeout: 10000 })) : [];
if (rows.some((p) => !p.exited && (!p.path || resolve(p.path).toLowerCase().startsWith(root.toLowerCase() + "\\")))) { console.error("Feche a janela do FreeMix normalmente e rode de novo. Nada foi alterado."); process.exit(1); }
const identity = createHash("sha256").update(root.toLowerCase()).digest("hex");
let panelPort = 8088; try { const raw = await readFile(join(root, "painel/local.js"), "utf8"), m = /window\.MESA_LOCAL\s*=\s*(\{[^;]+\})\s*;?/.exec(raw); if (m) { const u = new URL(JSON.parse(m[1]).replayUrl); if (["127.0.0.1", "localhost"].includes(u.hostname)) panelPort = Number(u.port || 80); } } catch { /* default port */ }
for (const port of [...new Set([panelPort, 8088, ...Array.from({ length: 11 }, (_, n) => 18188 + n)])]) {
  let h; try { h = await fetch("http://127.0.0.1:" + port + "/api/health", { signal: AbortSignal.timeout(800) }).then((r) => r.json()); } catch { continue; }
  if (h.app !== "FreeMix" || h.installationId !== identity || Number(h.port) !== port) continue;
  const p = JSON.parse(execFileSync(helper, [String(h.pid)], { encoding: "utf8", windowsHide: true, timeout: 10000 }))[0];
  if (p.exited) continue;
  if (!p.path || resolve(p.path).toLowerCase() !== resolve(root + "/runtime/node.exe").toLowerCase()) { console.error("O serviço local aberto não é o desta instalação. Nada foi alterado."); process.exit(1); }
  execFileSync("taskkill.exe", ["/PID", String(h.pid), "/T", "/F"], { windowsHide: true, stdio: "pipe", timeout: 10000 });
}

console.log(`Desfazendo a atualização ${installed} com a cópia de segurança…`);
const done = await rollback(root, receipt.backup);
const previous = join(records, "ULTIMA-ATUALIZACAO.anterior.json"), pointer = join(records, "ULTIMA-ATUALIZACAO.json");
const old = await json(previous).catch(() => null), now = (await json(join(root, "version.json"))).version;
if (old) { await writeFile(pointer, JSON.stringify(old, null, 2) + "\n"); await rm(previous); }
await writeFile(join(records, "DESFEITA-ULTIMA.json"), JSON.stringify({ undone: installed, versionNow: now, files: done.files?.length ?? null, at: new Date().toISOString(), pointerRestored: !!old }, null, 2) + "\n");
await rm(join(records, "APLICACAO-ULTIMA.json"));
console.log(`Pronto. A mesa voltou para a versão ${now}. Abra normalmente pelo ABRIR-FREEMIX.cmd.`);
if (!old) console.log("Atenção: o ponteiro de atualização anterior não foi encontrado; a atualização pode ser oferecida de novo ao abrir.");
