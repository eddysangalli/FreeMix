import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const args = Object.fromEntries(process.argv.slice(2).map(arg => {
  const match = /^--(native|product|head|version)=(.+)$/.exec(arg);
  if (!match) throw Error('Use --native=REPO --product=REPO --head=COMMIT --version=VERSAO');
  return [match[1], match[2]];
}));
for (const field of ['native', 'product', 'head', 'version']) if (!args[field]) throw Error('Falta --' + field);
if (!/^[0-9a-f]{40}$/.test(args.head) || !/^0\.1\.0-local\.\d{14}$/.test(args.version)) throw Error('Commit/versão inválidos');
const native = await fs.realpath(args.native), product = await fs.realpath(args.product);
if (native.toLowerCase() === product.toLowerCase()) throw Error('Repos distintos obrigatórios');
const git = (repo, argv, env) => execFileSync('git', ['-C', repo, ...argv], {env: {...process.env, ...env}, windowsHide: true, maxBuffer: 64 * 1024 * 1024});
for (const repo of [native, product]) {
  const top = await fs.realpath(git(repo, ['rev-parse', '--show-toplevel']).toString().trim());
  if (top.toLowerCase() !== repo.toLowerCase()) throw Error('Informe a raiz do repositório');
}
if (git(native, ['status', '--porcelain', '--untracked-files=no']).toString().trim()) throw Error('Native tem alterações rastreadas não commitadas');
if (git(native, ['rev-parse', 'HEAD']).toString().trim() !== args.head) throw Error('HEAD mudou');
const fork = path.join(product, 'fork'), manifestPath = path.join(fork, 'manifest.json');
const old = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
if (!/^[0-9a-f]{40}$/.test(old.base)) throw Error('Base inválida');
git(native, ['merge-base', '--is-ancestor', old.base, args.head]);
const commits = git(native, ['rev-list', '--reverse', '--first-parent', old.base + '..' + args.head]).toString().trim().split(/\r?\n/).filter(Boolean);
if (commits.length < old.patches.length) throw Error('Histórico menor que a série existente');
const hash = data => createHash('sha256').update(data).digest('hex');
const patches = [];
for (let i = 0; i < old.patches.length; i++) {
  const item = old.patches[i];
  if (path.basename(item.path) !== item.path || !item.path.endsWith('.patch')) throw Error('Caminho de patch inválido');
  const data = await fs.readFile(path.join(fork, item.path));
  if (hash(data) !== item.sha256 || !data.toString().startsWith('From ' + commits[i] + ' ')) throw Error('Patch antigo/hash/commit divergente: ' + item.path);
  patches.push({...item, file: path.join(fork, item.path)});
}
const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'FreeMix-QA-NativeExport-'));
for (let i = old.patches.length; i < commits.length; i++) {
  const generated = git(native, ['format-patch', '-1', '--start-number=' + (i + 1), '--output-directory=' + temp, commits[i]]).toString().trim();
  const data = await fs.readFile(generated);
  patches.push({path: path.basename(generated), sha256: hash(data), file: generated});
}
const env = {GIT_INDEX_FILE: path.join(temp, 'verification.index')};
git(native, ['read-tree', old.base], env);
for (const item of patches) git(native, ['apply', '--cached', '--whitespace=nowarn', item.file], env);
const tree = git(native, ['write-tree'], env).toString().trim();
if (tree !== git(native, ['rev-parse', args.head + '^{tree}']).toString().trim()) throw Error('Árvore de patches não corresponde ao HEAD');
const changed = git(native, ['diff', '--name-only', '-z', old.base, args.head]).toString().split('\0').filter(Boolean);
const files = [];
for (const name of changed) {
  if (name.includes('..') || path.isAbsolute(name)) throw Error('Caminho de fonte inválido');
  const dest = path.join(product, 'docs/native-source', name);
  let data;
  try { data = git(native, ['show', args.head + ':' + name]); }
  catch { throw Error('Remoção de fonte exige revisão explícita: ' + name); }
  files.push({path: name, bytes: data.length, sha256: hash(data), data, dest});
}
// Only write the editable source repository after the complete patch series is verified.
for (const item of patches.slice(old.patches.length)) await fs.copyFile(item.file, path.join(fork, item.path), 1);
for (const file of files) { await fs.mkdir(path.dirname(file.dest), {recursive: true}); await fs.writeFile(file.dest, file.data); }
const updated = {...old, head: args.head, version: args.version, patches: patches.map(({path, sha256}) => ({path, sha256})), sourceUpdatedAt: new Date().toISOString()};
await fs.writeFile(manifestPath, JSON.stringify(updated, null, 2) + '\n');
const result = {status: 'PASS', at: updated.sourceUpdatedAt, base: old.base, head: args.head, version: args.version, patches: patches.length, resultTree: tree, expectedTree: tree, sourceFiles: files.map(({path, bytes, sha256}) => ({path, bytes, sha256})), operatorTouched: false, nativeWorktreeTouched: false, nativeIndexTouched: false, networkStarted: false};
await fs.writeFile(path.join(temp, 'result.json'), JSON.stringify(result, null, 2) + '\n');
await fs.writeFile(path.join(fork, 'source-verification.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({status: result.status, head: result.head, patches: result.patches, sourceFiles: files.length, resultTree: tree, receipt: path.join(temp, 'result.json')}));
