import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const here = path.dirname(fileURLToPath(import.meta.url)), run = promisify(execFile);
const hash = async file => { const h = createHash('sha256'); for await (const b of createReadStream(file)) h.update(b); return h.digest('hex'); };
const matrix = JSON.parse(await fs.readFile(path.join(here, 'matrix-result.json')));
assert.equal(matrix.status, 'PASS'); assert.equal(matrix.instrumentation, false); assert.equal(matrix.cases.length, 3);
assert.equal(await hash(matrix.frozenReceipt), matrix.frozenReceiptSha256);
assert.equal(new Set(matrix.cases.map(c => c.binarySetSha256)).size, 1);
const cases = [];
for (const c of matrix.cases) {
  assert.equal(c.status, 'PASS'); assert(c.cooperativeClose); assert(!c.forcedOwnedCleanup);
  assert.equal(c.newCrashes, 0); assert.equal(c.recording, false); assert.equal(c.streaming, false); assert.equal(c.physicalInputs, false);
  assert.deepEqual(c.logs.flatMap(log => log.allocations), [0]);
  for (const log of c.logs) { assert.equal(await hash(log.path), log.sha256); assert(!log.remainingObjects.length && !log.doubleDestroyWarnings); }
  for (const pid of [c.nativePid, c.apiPid].filter(Boolean)) {
    const state = JSON.parse((await run(path.join(c.root, 'runtime/freemix-process-info.exe'), [String(pid)], { windowsHide: true })).stdout)[0];
    assert(state.exited, 'Own QA PID remains alive; inspect identity before action');
  }
  cases.push({ mode: c.mode, closeMs: c.closeMs, nativeExit: c.nativeExit, count: 0, crashes: c.newCrashes,
    expiredMeterWarnings: c.logs.reduce((sum, log) => sum + log.expiredMeterWarnings, 0), doubleDestroyWarnings: 0, remainingObjects: 0,
    originalFilesOutsideFrozenOverlay: c.originalPinsPreserved,
    unchangedOriginalBinaryPins: c.originalBinaryCount - c.originalBinaryChanges.length,
    changedOriginalBinaries: c.originalBinaryChanges, binaryCount: c.binaryCount,
    binarySetSha256: c.binarySetSha256, logHashes: c.logs.map(log => log.sha256), outputsStopped: true, ownProcessesClosed: true });
}
const report = { status: 'PRODUCTION_NATIVE20_SHUTDOWN_PASS', nativeCommit: matrix.nativeCommit,
  frozenReceipt: matrix.frozenReceipt, frozenReceiptSha256: matrix.frozenReceiptSha256, nativeFileCount: matrix.frozenFileCount,
  instrumentation: false, counters: cases.map(c => c.count), cases, operatorTouched: false, candidate213415Edited: false,
  updaterBehavior: matrix.updaterBehavior, limits: matrix.limits };
await fs.writeFile(path.join(here, 'report.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
const files = [];
for (const relative of ['matrix-production.mjs', 'prepare-harness.mjs', 'finalize.mjs', 'README.md', 'matrix-result.json', 'report.json', ...matrix.cases.map(c => c.mode + '-binary-hashes.json')]) {
  const file = path.join(here, relative); files.push({ path: relative, bytes: (await fs.stat(file)).size, sha256: await hash(file) });
}
await fs.writeFile(path.join(here, 'delivery-allowlist.json'), JSON.stringify({ status: report.status, files, excluded: ['Runtime binaries/PDBs', 'operator data', 'raw allocation traces', 'production source changes'] }, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ status: report.status, counters: report.counters, reportSha256: await hash(path.join(here, 'report.json')), allowlistSha256: await hash(path.join(here, 'delivery-allowlist.json')) }));
