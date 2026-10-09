import { spawnSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import path from 'node:path';
const exe = process.env.TEMP + '/FreeMix-QA-NativeAlpha-Final-Counters-Build/FreeMix-Alpha-Bridge.exe';
const sha256 = createHash('sha256').update(await readFile(exe)).digest('hex');
assert.equal(sha256, 'd75aa9b586f70d292e83c916e7a624b1d69634a85fdbcc3444d6be6e839432aa');
const base = ['--input', 'srt://127.0.0.1:18961?mode=listener', '--ndi-runtime', process.env.TEMP + '/FreeMix-QA-missing-ndi.dll'];
const cases = [
  { name: 'Fatal missing NDI runtime', args: [...base, '--seconds', '1'], expected: 1 },
  { name: 'Invalid duration text', args: [...base, '--seconds', 'abc'], expected: 2 },
  { name: 'Negative duration', args: [...base, '--seconds', '-1'], expected: 2 },
  { name: 'Missing required arguments', args: [], expected: 2 },
];
const results = cases.map(test => {
  const result = spawnSync(exe, test.args, { windowsHide: true, cwd: path.dirname(exe), encoding: 'utf8', timeout: 8000 });
  assert.equal(result.error, undefined);
  assert.equal(result.status, test.expected, result.stderr);
  return { name: test.name, exitCode: result.status, stderr: result.stderr.trim() };
});
const receipt = { status: 'PASS', checkedAt: new Date().toISOString(), exe, sha256, operatorTouched: false, vmixTouched: false, networkOpened: false, results };
await writeFile('qa-finalizacao/resultado-native-alpha-cli-20261009.json', JSON.stringify(receipt, null, 2));
console.log(JSON.stringify(receipt, null, 2));
