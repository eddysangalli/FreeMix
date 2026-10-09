import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import net from 'node:net';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { installPortable } from '../../ferramentas/instalar-portatil.mjs';
const run = promisify(execFile), folder = path.dirname(fileURLToPath(import.meta.url));
const candidate = JSON.parse(await fs.readFile(path.resolve(folder, '../candidate-release.json')));
assert.equal(candidate.version, '0.1.0-local.20261009213415');
assert(['PACKAGE_VERIFIED', 'SETUP_VERIFIED'].includes(candidate.status));
const argumentsMap = new Map(process.argv.slice(2).map(arg => { const split = arg.indexOf('='); assert(split > 2, 'Use explicit --name=value arguments'); return [arg.slice(2, split), arg.slice(split + 1)]; }));
assert.equal(argumentsMap.get('authorized-head'), '6cbf07641c501cb6b319c6bf7000b805fdce625c', 'Explicit root authorization required');
const frozenReceipt = path.resolve(argumentsMap.get('frozen-receipt') || '');
assert.match(argumentsMap.get('receipt-sha256') || '', /^[a-f0-9]{64}$/);
const receiptBytes = await fs.readFile(frozenReceipt);
assert.equal(createHash('sha256').update(receiptBytes).digest('hex'), argumentsMap.get('receipt-sha256'));
const frozen = JSON.parse(receiptBytes);
assert.equal(frozen.status, 'BUILD_FROZEN_FOR_QA_NOT_RELEASED');
assert.equal(frozen.head, argumentsMap.get('authorized-head'));
assert.equal(frozen.build.qaAllocatorInstrumentation, false);
assert.equal(frozen.build.exitCode, 0);
assert.equal(frozen.build.configureExplicit, true);
assert(frozen.build.generatedVersionSource.includes('-g6cbf076'), 'Require matching configured version');
assert.equal(path.basename(frozen.root), 'native-build-frozen-6cbf076-configured', 'Require corrected obsversion configure, never use invalid first freeze or mutable rundir');
assert(!(await fs.lstat(frozen.root)).isSymbolicLink());
const overlay = frozen.files.map(file => {
  assert(/^(bin|data|obs-plugins)\//.test(file.path));
  assert(!file.path.split('/').some(part => !part || part === '.' || part === '..'));
  assert(!file.path.includes('\\') && !file.path.includes(':'));
  assert(!/\.(pdb|ilk|log|dmp)$/i.test(file.path));
  assert.match(file.sha256, /^[a-f0-9]{64}$/);
  return { ...file, packagePath: file.path, path: path.join(frozen.root, file.path), name: path.basename(file.path) };
});
assert.equal(new Set(overlay.map(file => file.packagePath.toLowerCase())).size, overlay.length);
for (const [relative, sha256] of Object.entries(frozen.pins)) assert.equal(overlay.find(file => file.packagePath === relative)?.sha256, sha256);
const owner = await fs.mkdtemp(path.join(tmpdir(), 'FreeMix-QA-Production20Matrix-'));
await fs.writeFile(path.join(owner, '.freemix-qa-owned'), 'shutdown-allocation-audit\n');
const receipt = { status: 'RUNNING', at: new Date().toISOString(), owner, packageRoot: candidate.packageRoot,
  version: candidate.version, manifestHash: candidate.manifestHash, operatorTouched: false,
  firewallApplied: false, shortcutsCreated: false, instrumentation: false, nativeCommit: frozen.head, frozenReceipt, frozenReceiptSha256: argumentsMap.get('receipt-sha256'), updaterBehavior: 'Unmodified production RTMP updater may perform public read-only HTTP requests; application updater disabled by standard flag', frozenFileCount: overlay.length, cases: [] };
const resultFile = path.join(folder, 'matrix-result.json'); await fs.writeFile(resultFile, JSON.stringify(receipt, null, 2), { flag: 'wx' });
const save = () => fs.writeFile(resultFile, JSON.stringify(receipt, null, 2));
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const hash = async file => { const h = createHash('sha256'); for await (const b of createReadStream(file)) h.update(b); return h.digest('hex'); };
async function port() { const s = net.createServer(); await new Promise(r => s.listen(0, '127.0.0.1', r)); const p = s.address().port; await new Promise(r => s.close(r)); return p; }
const taken = new Set();
async function uniquePort() { let p; do p = await port(); while (taken.has(p)); taken.add(p); return p; }
const sourceManifest = JSON.parse(await fs.readFile(path.join(candidate.packageRoot, 'manifest.json')));
const binaryFiles = sourceManifest.files.filter(f => /\.(exe|dll)$/i.test(f.path));
async function validateRoot(root) {
  const relative = path.relative(owner, root);
  assert(relative && !relative.startsWith('..') && !path.isAbsolute(relative));
  for (const p of [owner, root]) assert(!(await fs.lstat(p)).isSymbolicLink());
}
async function info(root, pid) {
  return JSON.parse((await run(path.join(root, 'runtime/freemix-process-info.exe'), [String(pid)], { windowsHide: true })).stdout)[0];
}
async function ownedProcess(root, pid, exe) {
  await validateRoot(root);
  for (let attempt = 0; attempt < 20; attempt++) {
    const state = await info(root, pid);
    if (state.exited) return state;
    if (state.path) {
      assert.equal(path.resolve(state.path).toLowerCase(), path.resolve(root, exe).toLowerCase(), 'PID executable belongs elsewhere');
      return state;
    }
    // Windows can report a closing process alive after its executable path becomes unavailable.
    // A null path never authorizes killing it; wait for exited or a verifiable path.
    await sleep(50);
  }
  throw Error('PID executable path remained unavailable; ownership cannot be confirmed');
}
try {
for (const mode of ['direct-no-api', 'launcher-control', 'direct-with-api']) {
  const root = path.join(owner, 'FreeMix-QA-' + mode + ' with spaces');
  const item = { mode, root, status: 'RUNNING', apiPort: await uniquePort(), wsPort: await uniquePort() };
  receipt.cases.push(item); await save();
  let obs, nativePid, apiPid, nativeExit = null, child;
  try {
    console.log('INSTALL ' + mode);
    const installed = await installPortable(candidate.packageRoot, root, { apiPort: item.apiPort, wsPort: item.wsPort });
    await validateRoot(root); assert.equal(installed.manifestHash, candidate.manifestHash);
    const binaryHashes = [];
    for (const file of binaryFiles) {
      const actual = path.join(root, file.path), stat = await fs.lstat(actual);
      assert(stat.isFile() && !stat.isSymbolicLink() && stat.nlink === 1);
      const digest = await hash(actual); assert.equal(digest, file.sha256);
      binaryHashes.push({ path: file.path, sha256: digest });
    }
    item.originalBinaryCount = binaryHashes.length;
    item.originalBinarySetSha256 = createHash('sha256').update(JSON.stringify(binaryHashes)).digest('hex');
    for (const file of overlay) {
      assert.equal(await hash(file.path), file.sha256, 'Frozen production output changed');
      const sourceStat = await fs.lstat(file.path); assert(sourceStat.isFile() && !sourceStat.isSymbolicLink());
      await fs.mkdir(path.dirname(path.join(root, file.packagePath)), { recursive: true });
      await fs.copyFile(file.path, path.join(root, file.packagePath));
    }
    let originalPins = 0;
    for (const file of binaryFiles) {
      const instrumented = overlay.find(item => file.path === item.packagePath);
      const digest = await hash(path.join(root, file.path));
      assert.equal(digest, instrumented ? instrumented.sha256 : file.sha256);
      assert.equal((await fs.lstat(path.join(root, file.path))).nlink, 1);
      if (!instrumented) originalPins++;
      binaryHashes.find(item => item.path === file.path).sha256 = digest;
    }
    item.originalPinsPreserved = originalPins;
    item.originalBinaryChanges = binaryFiles.filter(file => overlay.some(o => o.packagePath === file.path && o.sha256 !== file.sha256)).map(file => ({ path: file.path, beforeSha256: file.sha256, afterSha256: overlay.find(o => o.packagePath === file.path).sha256 }));
    for (const file of overlay) {
      assert.equal(await hash(path.join(root, file.packagePath)), file.sha256);
      const stat = await fs.lstat(path.join(root, file.packagePath)); assert(stat.isFile() && !stat.isSymbolicLink() && stat.nlink === 1);
      if (/\.(exe|dll)$/i.test(file.packagePath) && !binaryFiles.some(original => original.path === file.packagePath)) binaryHashes.push({ path: file.packagePath, sha256: file.sha256 });
    }
    binaryHashes.sort((a, b) => a.path.localeCompare(b.path));
    item.overlay = overlay.map(file => ({ path: file.packagePath, sha256: file.sha256 }));
    item.binaryCount = binaryHashes.length;
    item.binarySetSha256 = createHash('sha256').update(JSON.stringify(binaryHashes)).digest('hex');
    await fs.writeFile(path.join(folder, mode + '-binary-hashes.json'), JSON.stringify(binaryHashes, null, 2));
    const collection = JSON.parse(await fs.readFile(path.join(root, 'config/obs-studio/basic/scenes/FreeMix.json')));
    assert(collection.sources.every(s => ['scene', 'color_source_v3'].includes(s.id)), 'Initial collection contains hardware or media source');
    const env = { ...process.env, FREEMIX_ROOT: root, FREEMIX_API_PORT: String(item.apiPort), FREEMIX_API_HOST: '127.0.0.1', OMT_STORAGE_PATH: path.join(root, 'config/omt') };
    for (const key of Object.keys(env)) if (/^FREEMIX_QA_(BMEM|RTMP)/.test(key)) delete env[key];
    await fs.mkdir(env.OMT_STORAGE_PATH, { recursive: true });
    const load = file => import(pathToFileURL(path.join(root, 'ferramentas', file)).href);
    const { prepareNdiRuntime } = await load('ndi-runtime.mjs');
    const { preparePortable } = await load('preparar-portatil.mjs');
    const { connect } = await load('obsws.mjs');
    await prepareNdiRuntime(root, { env });
    // preparePortable reads API port from local.js when no process environment override exists.
    await preparePortable(root);
    console.log('START ' + mode);
    if (mode === 'launcher-control') {
      const launch = JSON.parse((await run(path.join(root, 'runtime/node.exe'), [path.join(root, 'ferramentas/iniciar-freemix.mjs'), '--minimized'], { cwd: root, env, windowsHide: true, timeout: 120000, maxBuffer: 2 ** 20 })).stdout.trim());
      assert(launch.success && launch.ready); nativePid = launch.pid; item.launcherReady = true;
    } else {
      if (mode === 'direct-with-api') {
        const api = JSON.parse((await run(path.join(root, 'runtime/node.exe'), [path.join(root, 'ferramentas/iniciar-api.mjs')], { cwd: root, env, windowsHide: true, timeout: 60000 })).stdout.trim());
        apiPid = api.pid;
      }
      child = spawn(path.join(root, 'bin/64bit/FreeMix.exe'), ['--portable', '--multi', '--disable-updater', '--disable-missing-files-check', '--enable-media-stream', '--minimize-to-tray'], { cwd: path.join(root, 'bin/64bit'), env, windowsHide: true, stdio: 'ignore' });
      nativePid = child.pid; child.once('exit', (code, signal) => { nativeExit = { code, signal }; });
      child.once('error', error => { item.spawnError = error.message; });
    }
    item.nativePid = nativePid; await ownedProcess(root, nativePid, 'bin/64bit/FreeMix.exe');
    for (let attempt = 0; attempt < 90 && !obs; attempt++) { try { obs = await connect({ root }); } catch {} if (!obs) await sleep(500); }
    assert(obs, 'Owned Native websocket unavailable');
    const vendor = async (name, data = {}) => (await obs.req('CallVendorRequest', { vendorName: 'freemix', requestType: name, requestData: data })).responseData;
    let identity;
    // obs-websocket binds before the frontend vendor finishes registering.
    for (let attempt = 0; attempt < 90; attempt++) {
      try { identity = await vendor('get_interface'); if (identity.pid === nativePid) break; } catch {}
      await sleep(500);
    }
    assert.equal(identity?.pid, nativePid, 'Owned frontend vendor did not finish registering');
    assert.equal(path.resolve(identity.executable).toLowerCase(), path.resolve(root, 'bin/64bit/FreeMix.exe').toLowerCase());
    if (mode !== 'direct-no-api') {
      let health;
      for (let attempt = 0; attempt < 40; attempt++) {
        try { health = await fetch('http://127.0.0.1:' + item.apiPort + '/api/health').then(r => r.json()); if (health.pid) break; } catch {} await sleep(250);
      }
      assert.equal(health.installationId, createHash('sha256').update(root.toLowerCase()).digest('hex'));
      apiPid = health.pid; await ownedProcess(root, apiPid, 'runtime/node.exe'); item.apiPid = apiPid;
    }
    await sleep(12000);
    const inputs = (await obs.req('GetInputList')).inputs;
    const forbidden = inputs.filter(s => /wasapi|dshow|asio|decklink|aja|ndi_source|omt|browser_source|ffmpeg|replay/i.test(s.inputKind));
    assert.equal(forbidden.length, 0, 'Hardware/network/media input found in owned fresh collection');
    item.inputKinds = [...new Set(inputs.map(s => s.inputKind))].sort();
    item.outputs = (await obs.req('GetOutputList')).outputs.map(o => ({ kind: o.outputKind, active: o.outputActive }));
    assert(item.outputs.every(o => !o.active));
    assert.equal((await obs.req('GetRecordStatus')).outputActive, false);
    assert.equal((await obs.req('GetStreamStatus')).outputActive, false);
    item.recording = false; item.streaming = false; item.physicalInputs = false;
    const closeAt = Date.now(); const closing = await vendor('shutdown_idle', { qaClose: true }); assert(closing.success);
    obs.close(); obs = null;
    let closed = false;
    for (let attempt = 0; attempt < 100; attempt++) { if (nativeExit || (await ownedProcess(root, nativePid, 'bin/64bit/FreeMix.exe')).exited) { closed = true; break; } await sleep(100); }
    assert(closed, 'Owned Native cooperative shutdown timeout');
    item.closeMs = Date.now() - closeAt; item.nativeExit = nativeExit; item.cooperativeClose = true;
    if (mode !== 'launcher-control') assert.equal(nativeExit?.code, 0, 'Owned direct Native did not exit zero');
    const logs = [];
    for (const name of (await fs.readdir(path.join(root, 'config/obs-studio/logs'))).filter(n => n.endsWith('.txt'))) {
      const file = path.join(root, 'config/obs-studio/logs', name), text = await fs.readFile(file, 'utf8'), rows = text.split(/\r?\n/);
      logs.push({ path: file, sha256: await hash(file), bytes: (await fs.stat(file)).size,
        allocations: [...text.matchAll(/Number of memory leaks:\s*(\d+)/g)].map(m => Number(m[1])),
        remainingObjects: rows.filter(row => /\d+ \w+\(s\) were remaining/.test(row)),
        expiredMeterWarnings: rows.filter(row => /Meter::~Meter.*Failed to get strong reference/.test(row)).length,
        doubleDestroyWarnings: rows.filter(row => /Double destroy just occurred/.test(row)).length,
        markers: rows.filter(row => /Number of memory leaks:|Freeing OBS context data|All scene data cleared|==== Shutting down/.test(row)) });
    }
    item.logs = logs; assert.equal(logs.flatMap(log => log.allocations).length, 1);
    assert((await fs.readFile(logs[0].path, 'utf8')).includes('-g6cbf076'), 'Running production version does not match authorized commit');
    assert.deepEqual(logs.flatMap(log => log.allocations), [0], 'Production bnum allocation count is nonzero');
    assert(logs.every(log => !log.markers.some(row => /QA bmem|FREEMIX_QA_BMEM/.test(row))));
    assert(!(await fs.readdir(root)).includes('qa-bmem-trace'));
    assert(logs.every(log => !log.doubleDestroyWarnings && !log.remainingObjects.length));
    const crashes = await fs.readdir(path.join(root, 'config/obs-studio/crashes')).catch(e => { if (e.code === 'ENOENT') return []; throw e; });
    assert.equal(crashes.length, 0); item.newCrashes = 0;
    item.status = 'PASS'; console.log('PASS ' + mode + ' allocations=' + logs[0].allocations + ' closeMs=' + item.closeMs);
  } catch (error) { item.status = 'FAIL'; item.error = error.stack; throw error; }
  finally {
    if (obs) { try { await obs.req('CallVendorRequest', { vendorName: 'freemix', requestType: 'shutdown_idle', requestData: { qaClose: true } }); } catch {} obs.close(); }
    if (nativePid && !nativeExit && !(await ownedProcess(root, nativePid, 'bin/64bit/FreeMix.exe')).exited) {
      await sleep(3000);
      if (!(await ownedProcess(root, nativePid, 'bin/64bit/FreeMix.exe')).exited) { item.forcedOwnedCleanup = true; process.kill(nativePid); }
    }
    if (apiPid && !(await ownedProcess(root, apiPid, 'runtime/node.exe')).exited) { process.kill(apiPid); item.apiStopped = true; }
    await save();
  }
}
assert.equal(new Set(receipt.cases.map(item => item.binarySetSha256)).size, 1, 'Matrix binary sets differ');
receipt.status = 'PASS'; receipt.finished = new Date().toISOString();
receipt.limits = ['Three short production sessions; bnum zero does not establish RSS/endurance behavior or hardware acceptance.', 'Production RTMP updater retains public read-only HTTP behavior; no QA URL or allocator overlays.', 'Native is minimized on the current Windows development machine; no hardware or clean-VM acceptance.', 'Launcher Native exit code unavailable because installed launcher detaches; cooperative disappearance and final log are captured.', 'Counts do not prove resident-memory growth or attribute an allocation to a plugin.'];
} catch (error) { receipt.status = 'FAIL'; receipt.error = error.stack; process.exitCode = 1; }
finally { await save(); console.log(JSON.stringify({ status: receipt.status, owner, cases: receipt.cases.map(item => ({ mode: item.mode, status: item.status, closeMs: item.closeMs, allocations: item.logs?.flatMap(log => log.allocations) })) })); }
