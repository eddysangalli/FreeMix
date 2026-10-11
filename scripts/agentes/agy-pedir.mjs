// Sends one request to the Antigravity CLI (Gemini) and keeps the answer with a receipt.
// The helper never decides anything: what comes back is text for the orchestrator to check before it is used.
//
//   node agy-pedir.mjs --name=<slug> --prompt-file=<file> [--dir=<isolated folder>] [--edits]
//                      [--conversation=<id>] [--timeout=<seconds, default 180>] [--model=<id>]
//
// --dir     folder the helper may read (and, with --edits, change). It must be a copy made for this request, holding
//           only product or test source: never the operator's installation, settings, logs, recordings or keys.
//           Without --dir the helper works from an empty folder and sees only the text of the request.
// --edits   lets the helper change files inside --dir. Nothing outside it is touched; the orchestrator compares and
//           copies what it accepts.
// Output: qa-finalizacao/agy-<date>-<slug>/ with PROMPT.txt, RESULT.json, RESPONSE.txt and RECEIPT.json.
// Exit code: 0 answer received, 3 quota exhausted, 4 no answer (timeout or empty), 1 misuse.
import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";

const AGY = "C:/Users/eddyr/AppData/Local/agy/bin/agy.exe";
const ws = path.resolve(import.meta.dirname, "../..");
const args = Object.fromEntries(process.argv.slice(2).map((a) => { const m = /^--([a-z-]+)(?:=(.*))?$/s.exec(a); if (!m) { console.error("argumento inválido: " + a); process.exit(1); } return [m[1], m[2] ?? true]; }));
if (!args.name || !/^[a-z0-9-]{3,60}$/.test(args.name) || !args["prompt-file"]) { console.error("uso: --name=<slug> --prompt-file=<arquivo> [--dir=<pasta isolada>] [--edits] [--conversation=<id>] [--timeout=<s>]"); process.exit(1); }
const sha = (v) => createHash("sha256").update(v).digest("hex");
const prompt = await fs.readFile(args["prompt-file"], "utf8");
// The request travels as a command-line argument; Windows refuses command lines near 32 KB.
if (Buffer.byteLength(prompt) > 28000) { console.error(`pedido com ${Buffer.byteLength(prompt)} bytes; o limite é 28000. Ponha o material em arquivos dentro de --dir.`); process.exit(1); }
const model = args.model || "gemini-3.8-flash-high", timeout = Number(args.timeout || 180);
const stamp = new Date().toISOString().slice(0, 10).replaceAll("-", "");
let out = path.join(ws, "qa-finalizacao", `agy-${stamp}-${args.name}`);
for (let n = 2; await fs.access(out).then(() => true, () => false); n++) out = path.join(ws, "qa-finalizacao", `agy-${stamp}-${args.name}-${n}`);
await fs.mkdir(out, { recursive: true });
let cwd = args.dir ? path.resolve(args.dir) : path.join(out, "vazio");
if (args.dir) {
  const rel = path.relative(ws, cwd).replaceAll("\\", "/");
  // Only folders made for helpers may be handed over.
  if (rel.startsWith("..") || path.isAbsolute(rel) || !/^qa-finalizacao\/agy-trabalho-[a-z0-9-]+$/.test(rel)) { console.error("--dir precisa ser qa-finalizacao/agy-trabalho-<nome>: uma cópia feita para o ajudante"); process.exit(1); }
} else await fs.mkdir(cwd);
await fs.writeFile(path.join(out, "PROMPT.txt"), prompt);
const startedAt = new Date().toISOString();
console.log(JSON.stringify({ status: "AGY_STARTED", out, model, promptBytes: Buffer.byteLength(prompt), timeout }));
const cli = ["-p", prompt, "--model", model, "--mode", args.edits ? "accept-edits" : "plan", "--sandbox", "--output-format", "json", "--print-timeout", timeout + "s"];
if (typeof args.conversation === "string") cli.push("--conversation", args.conversation);
const call = (argv, limit) => new Promise((resolve) => execFile(AGY, argv, { cwd, windowsHide: true, timeout: (limit + 15) * 1000, maxBuffer: 8 * 1024 * 1024 }, (error, stdout, stderr) => resolve({ error, stdout, stderr })));
let r = await call(cli, timeout);
await fs.writeFile(path.join(out, "RESULT.json"), r.stdout);
if (r.stderr) await fs.writeFile(path.join(out, "STDERR.txt"), r.stderr);
let parsed = null; try { parsed = JSON.parse(r.stdout); } catch {}
let response = typeof parsed?.response === "string" ? parsed.response : "", secondCall = false;
// With files to read the helper often spends the whole time limit reading and thinking and returns nothing.
// Its work is kept in the conversation: one follow-up asks for the answer to be written out, without tools.
if (!response && parsed?.conversation_id && !/RESOURCE_EXHAUSTED|quota exceeded/i.test(r.stdout + r.stderr)) {
  secondCall = true;
  const follow = "Você já leu o material e analisou. Agora, SEM usar nenhuma ferramenta e sem ler mais nada, escreva a resposta final completa, no formato que o pedido original exige. Se alguma parte ficou sem conclusão, diga exatamente o que falta.";
  const again = await call(["-p", follow, "--model", model, "--mode", "plan", "--sandbox", "--output-format", "json", "--print-timeout", "300s", "--conversation", parsed.conversation_id], 300);
  await fs.writeFile(path.join(out, "RESULT-2.json"), again.stdout);
  if (again.stderr) await fs.writeFile(path.join(out, "STDERR-2.txt"), again.stderr);
  let second = null; try { second = JSON.parse(again.stdout); } catch {}
  if (typeof second?.response === "string" && second.response) { response = second.response; parsed = second; }
  r = { ...again, stdout: r.stdout + "\n" + again.stdout, stderr: r.stderr + "\n" + again.stderr };
}
if (response) await fs.writeFile(path.join(out, "RESPONSE.txt"), response);
const quota = /RESOURCE_EXHAUSTED|quota exceeded|rate limit|429/i.test(r.stdout + "\n" + r.stderr);
const receipt = { name: args.name, model, startedAt, finishedAt: new Date().toISOString(), cliExitCode: r.error?.code ?? 0, outerTimeout: Boolean(r.error?.killed), printTimeout: /print timeout/i.test(r.stderr), quota, responseBytes: Buffer.byteLength(response), responseSha256: response ? sha(response) : null, promptSha256: sha(prompt), conversationId: parsed?.conversation_id ?? null, answeredOnFollowUp: secondCall && Boolean(response), workDir: args.dir ? path.relative(ws, cwd).replaceAll("\\", "/") : null, editsAllowed: Boolean(args.edits), status: response ? "ANSWER_RECEIVED_NOT_YET_CHECKED" : quota ? "QUOTA_EXHAUSTED" : "NO_ANSWER" };
await fs.writeFile(path.join(out, "RECEIPT.json"), JSON.stringify(receipt, null, 2) + "\n");
console.log(JSON.stringify(receipt));
process.exit(response ? 0 : quota ? 3 : 4);
