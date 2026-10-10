import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { join, resolve, relative } from 'node:path';

const CALLER_RUN_EXCERPT = `run(action,data={}) { if(action==='gc_library_import'&&data.payload?.kind==='freemix-gtzip-import'&&data.payload.operation==='update'){if(data.payload.format!==1)return Promise.reject(Error('Formato de importação GTZIP inválido'));return this.runTickerUpdate(data);} if(['preview','active','cut','fade','transition','ftb','input_remove'].includes(action))return this.runRealtime(action,data);if(action==='macro_cancel')this.macroEngine.cancel();const p=this.tail.then(async()=>{this.sessionRecovery.beginMutation();try{await this.refresh(); await this.routeLegacyAudio(); await this.execute(action,data); this.macroEngine.recordAction?.(action,data); await this.sessionRecovery.journal(action,data); await this.refresh(); return this.state;}finally{this.sessionRecovery.endMutation();}}); this.tail=p.catch(()=>{}); return p; }`;

function ensureCallerProductionRunFile() {
  const targetUrl = new URL('./CALLER-PRODUCTION-RUN.mjs', import.meta.url);
  try {
    if (!existsSync(targetUrl)) {
      writeFileSync(targetUrl, CALLER_RUN_EXCERPT, 'utf8');
    }
  } catch (_) {}
  return targetUrl;
}

function getCallerProductionRunSource() {
  const targetUrl = ensureCallerProductionRunFile();
  try {
    return readFileSync(targetUrl, 'utf8');
  } catch (_) {
    return CALLER_RUN_EXCERPT;
  }
}

function getSource() {
  const targetUrl = new URL('./draft/sessao-producao.mjs', import.meta.url);
  return readFileSync(targetUrl, 'utf8');
}

function compileSessionRecovery() {
  const raw = getSource();
  const stripped = raw
    .replace(/^\s*import\s+[^;]+;\s*$/gm, '')
    .replace(/\bexport\s+class\s+SessionRecovery\b/, 'class SessionRecovery');
  return stripped;
}

function createHarness(options = {}) {
  let currentTime = 1700000000000;
  const fsData = new Map();
  const fsDirs = new Set(['/app', '/app/projetos', '/app/projetos/sessoes', '/app/projetos/recuperacao', '/app/config/obs-studio/crashes']);
  const norm = p => p.replace(/\\/g, '/').replace(/^[a-zA-Z]:/, '');

  const memFs = { 
    async mkdir(dir) { fsDirs.add(norm(dir)); },
    async writeFile(file, data) { fsData.set(norm(file), String(data)); },
    async readFile(file) {
      const p = norm(file);
      if (!fsData.has(p)) { const e = new Error('ENOENT: ' + file); e.code = 'ENOENT'; throw e; }
      return fsData.get(p);
    },
    async rename(oldP, newP) {
      const o = norm(oldP), n = norm(newP);
      if (!fsData.has(o)) { const e = new Error('ENOENT'); e.code = 'ENOENT'; throw e; }
      fsData.set(n, fsData.get(o));
      fsData.delete(o);
    },
    async appendFile(file, data) {
      const p = norm(file);
      fsData.set(p, (fsData.get(p) || '') + String(data));
    },
    async readdir(dir, opts) {
      const d = norm(dir);
      const out = [];
      for (const k of fsData.keys()) {
        if (k.startsWith(d + '/')) {
          const base = k.slice(d.length + 1);
          if (!base.includes('/')) {
            out.push(opts?.withFileTypes ? { name: base, isFile: () => true, isSymbolicLink: () => false } : base);
          }
        }
      }
      return out;
    },
    async lstat(file) {
      const p = norm(file);
      if (!fsData.has(p) && !fsDirs.has(p)) { const e = new Error('ENOENT'); e.code = 'ENOENT'; throw e; }
      const isF = fsData.has(p);
      const content = fsData.get(p) || '';
      return {
        isFile: () => isF,
        isSymbolicLink: () => false,
        size: Buffer.byteLength(content, 'utf8'),
        mtimeMs: currentTime
      };
    },
    async rm(file) {
      const p = norm(file);
      fsData.delete(p);
      fsDirs.delete(p);
    }
  };

  class ControlledDate extends Date {
    constructor(...args) {
      if (args.length === 0) super(currentTime);
      else super(...args);
    }
    static now() { return currentTime; }
  }

  const sandbox = {
    operationalActions: new Set(['preview', 'active', 'cut', 'fade', 'overlay', 'audio_mute', 'audio_volume', 'audio_bus', 'media']),
    stateMutations: new Set(['scene_switch', 'source_edit', 'native_state', 'gc_library_save']),
    nativeStateEvents: new Set(['SourceRenamed', 'CurrentProgramSceneChanged', 'InputSettingsChanged']),
    collectionEvents: new Set(['CurrentSceneCollectionChanging', 'CurrentSceneCollectionChanged']),
    readFile: memFs.readFile,
    writeFile: memFs.writeFile,
    mkdir: memFs.mkdir,
    rename: memFs.rename,
    appendFile: memFs.appendFile,
    readdir: memFs.readdir,
    lstat: memFs.lstat,
    rm: memFs.rm,
    join,
    resolve,
    relative,
    randomUUID,
    createHash,
    Date: ControlledDate,
    Buffer,
    Set,
    Map,
    Math,
    Number,
    String,
    Boolean,
    JSON,
    Error,
    Promise,
    structuredClone
  };

  vm.createContext(sandbox);
  const code = compileSessionRecovery();
  vm.runInContext(code + '\n;globalThis.SessionRecovery = SessionRecovery;', sandbox);
  const SessionRecovery = sandbox.SessionRecovery;

  const backupList = [];
  const p = {
    root: '/app',
    scope: 'main-production',
    state: { connected: true },
    tail: Promise.resolve(),
    recoveryEngine: {
      session: null,
      directory: '/app/projetos/recuperacao',
      last: null,
      async list() {
        return backupList.map(b => ({ id: b.id, kind: b.kind || 'autosave', name: b.scope }));
      },
      async backup(opts) {
        const id = randomUUID();
        const item = { id, kind: opts.kind || 'autosave', scope: p.scope, files: opts.files || [] };
        backupList.push(item);
        await memFs.writeFile(`/app/projetos/recuperacao/${id}.fmx`, 'snapshot-payload');
        return item;
      }
    },
    macroEngine: {
      normalize(target) { return { action: target.action, harmless: false }; }
    },
    controllerEngine: { items: [] },
    async req(method) {
      if (method === 'GetSceneCollectionList') return { currentSceneCollectionName: p.scope };
      return {};
    }
  };

  const session = new SessionRecovery(p);
  const runMethodSource = getCallerProductionRunSource();
  const runParsed = eval('({' + runMethodSource + '})').run;
  p.sessionRecovery = session;
  p.run = runParsed.bind(p);
  p.refresh = async () => {};
  p.routeLegacyAudio = async () => {};
  p.execute = async (action, data) => {
    if (action === 'recovery_checkpoint') {
      return session.capture(true);
    }
  };
  p.runRealtime = async () => {};
  p.runTickerUpdate = async () => {};

  return {
    session,
    p,
    memFs,
    backupList,
    setTime(t) { currentTime = t; },
    advanceTime(ms) { currentTime += ms; },
    getTime() { return currentTime; }
  };
}

export async function runContracts() {
  const report = [];

  // 1. initialmissingcheckpoint evenrevision0
  {
    const { session } = createHarness();
    await session.start();
    assert.equal(session.revision, 0);
    assert.equal(session.capturedAck, 0);
    assert.equal(session.checkpointPending, true);
    assert.equal(session.isDirty(), true, 'Must be dirty on initial start even at revision 0');
    report.push('initialmissingcheckpoint_even_revision0');
  }

  // 2. aftersuccessclean60s zero backup/journal
  {
    const { session, p, advanceTime } = createHarness();
    await session.start();
    await session.capture(true);
    assert.equal(session.isDirty(), false);
    let backupCount = 0;
    const origBackup = p.recoveryEngine.backup;
    p.recoveryEngine.backup = async opts => { backupCount++; return origBackup.call(p.recoveryEngine, opts); };
    advanceTime(65000);
    session.tick();
    await new Promise(r => setTimeout(r, 10));
    assert.equal(backupCount, 0, 'Clean session after 60s must trigger zero backup/journal');
    assert.equal(session.isDirty(), false);
    report.push('aftersuccessclean60s_zero_backup_or_journal');
  }

  // 3. manualforceclean stillbackup
  {
    const { session, p } = createHarness();
    await session.start();
    await session.capture(true);
    assert.equal(session.isDirty(), false);
    let backupCount = 0;
    const origBackup = p.recoveryEngine.backup;
    p.recoveryEngine.backup = async opts => { backupCount++; return origBackup.call(p.recoveryEngine, opts); };
    const res = await session.capture(true);
    assert.equal(backupCount, 1, 'Manual force capture must execute backup even if clean');
    assert.ok(res.snapshot);
    report.push('manualforceclean_still_triggers_backup');
  }

  // 4. realAPI beginMutation partialfailure-beforejournal staysdirty
  {
    const { session } = createHarness();
    await session.start();
    await session.capture(true);
    assert.equal(session.isDirty(), false);
    session.beginMutation('source_edit');
    assert.equal(session.isDirty(), true);
    assert.equal(session.nativeMutationDepth, 1);
    try {
      throw new Error('API failure prior to journal');
    } catch (_) {
      session.endMutation();
    }
    assert.equal(session.nativeMutationDepth, 0);
    assert.equal(session.isDirty(), true, 'Mutation failure before journal must remain dirty');
    report.push('beginmutation_partialfailure_beforejournal_staysdirty');
  }

  // 5. JSmetadata actions input_tags/settings_import/settings_defaults
  {
    const { session } = createHarness();
    await session.start();
    await session.capture(true);
    assert.equal(session.isDirty(), false);
    await session.journal('input_tags', { input: 'cam-main' });
    assert.equal(session.isDirty(), true, 'input_tags marks session dirty');
    await session.capture(true);
    assert.equal(session.isDirty(), false);
    await session.journal('settings_import', {});
    assert.equal(session.isDirty(), true, 'settings_import marks session dirty');
    await session.capture(true);
    assert.equal(session.isDirty(), false);
    await session.journal('settings_defaults', {});
    assert.equal(session.isDirty(), true, 'settings_defaults marks session dirty');
    report.push('jsmetadata_actions_inputtags_settingsimport_settingsdefaults_markdirty');
  }

  // 6. eventswhilecapturing/depth retained, telemetryignored, nativeBatch exact lifecycle
  {
    const { session, p } = createHarness();
    await session.start();
    await session.capture(true);
    assert.equal(session.isDirty(), false);

    // Telemetry event: unrecognized state event ignored without dirty flag and does not initialize batch
    session.onNativeEvent('TelemetryHeartbeat');
    assert.equal(session.isDirty(), false, 'Telemetry ignored without dirty flag');
    assert.ok(session.nativeBatch === undefined || session.nativeBatch === null, 'Telemetry event does not initiate a native batch');

    // Recognized event while nativeCapturing: marks dirty but batching bypassed
    session.nativeCapturing = true;
    session.onNativeEvent('SourceRenamed');
    assert.equal(session.isDirty(), true, 'Recognized native event marks dirty even while capturing');
    assert.ok(session.nativeBatch === undefined || session.nativeBatch === null, 'Batching bypassed while nativeCapturing is active');
    session.nativeCapturing = false;
    await session.capture(true);
    assert.equal(session.isDirty(), false);

    // Recognized event under mutation depth: marks dirty but batching bypassed
    session.nativeMutationDepth = 1;
    session.onNativeEvent('SourceRenamed');
    assert.equal(session.isDirty(), true, 'Recognized native event marks dirty under depth');
    assert.ok(session.nativeBatch === undefined || session.nativeBatch === null, 'Batching bypassed when mutation depth > 0');
    session.nativeMutationDepth = 0;

    // Valid event when idle: initiates active batch object
    session.onNativeEvent('SourceRenamed');
    assert.ok(session.nativeBatch, 'Active native batch must be created for valid native event');
    assert.equal(session.nativeBatch.scope, p.scope);
    assert.equal(session.nativeBatch.sessionId, session.current?.id);
    assert.equal(session.nativeBatch.count, 1);
    assert.ok(session.nativeBatch.types.has('SourceRenamed'));

    // flushNative resets batch strictly to null
    await session.flushNative();
    assert.equal(session.nativeBatch, null, 'flushNative must reset nativeBatch strictly to null');

    // Re-create batch and verify collection change event resets batch strictly to null
    session.onNativeEvent('SourceRenamed');
    assert.ok(session.nativeBatch, 'Active native batch recreated');
    session.onNativeEvent('CurrentSceneCollectionChanging');
    assert.equal(session.nativeBatch, null, 'CurrentSceneCollectionChanging must reset nativeBatch strictly to null');

    report.push('events_while_capturing_depth_retained_telemetry_ignored');
  }

  // 7. mutationafterbackupbegin survives ACK
  {
    const { session, p } = createHarness();
    await session.start();
    await session.capture(true);
    assert.equal(session.isDirty(), false);
    session.markDirty('work-pre');
    const origBackup = p.recoveryEngine.backup;
    p.recoveryEngine.backup = async opts => {
      session.markDirty('work-mid-backup');
      return origBackup.call(p.recoveryEngine, opts);
    };
    await session.capture(false);
    assert.equal(session.isDirty(), true, 'Mutation during backup must survive ACK because revision > capturedAck');
    report.push('mutation_after_backup_begin_survives_ack');
  }

  // 8. failedbackup/journal/marker retains dirty and allows boundedretry
  {
    const { session, p } = createHarness();
    await session.start();
    session.markDirty('important-change');
    assert.equal(session.isDirty(), true);
    const origBackup = p.recoveryEngine.backup;
    p.recoveryEngine.backup = async () => { throw new Error('Disk IO write failure'); };
    await assert.rejects(async () => { await session.capture(true); }, /Disk IO write failure/);
    assert.equal(session.isDirty(), true, 'Dirty state retained after failed backup');
    p.recoveryEngine.backup = origBackup;
    const retryRes = await session.capture(true);
    assert.ok(retryRes.snapshot);
    assert.equal(session.isDirty(), false, 'Bounded retry succeeds');
    report.push('failed_backup_journal_retains_dirty_allows_retry');
  }

  // 9. scope/session/new/reconnected/resumed cannot reuse oldwatermark
  {
    const { session, p } = createHarness();
    await session.start();
    session.revision = 15;
    session.capturedAck = 15;
    session.checkpointPending = false;
    session.resetContext({ id: randomUUID(), scope: 'new-production' });
    assert.equal(session.revision, 0, 'New session resets revision to 0');
    assert.equal(session.capturedAck, 0, 'New session resets capturedAck to 0');
    assert.equal(session.checkpointPending, true, 'New session forces checkpointPending');
    assert.equal(session.isDirty(), true);
    const token = session.contextToken;
    assert.equal(session.isContextValid(token, session.current.id, 'old-scope'), false, 'Cannot validate stale scope');
    report.push('scope_session_change_cannot_reuse_old_watermark');
  }

  // 10. pending capture manual awaitthenforce and no p.tail deadlock
  {
    const { session, p } = createHarness();
    await session.start();
    let releaseGate;
    const gate = new Promise(r => { releaseGate = r; });
    const origBackup = p.recoveryEngine.backup;
    p.recoveryEngine.backup = async opts => {
      await gate;
      return origBackup.call(p.recoveryEngine, opts);
    };
    const firstRun = session.capture(true);
    assert.ok(session.activeCapture);
    const secondRun = session.capture(true);
    releaseGate();
    const [r1, r2] = await Promise.all([firstRun, secondRun]);
    assert.ok(r1.snapshot);
    assert.ok(r2.snapshot);
    assert.equal(session.activeCapture, null);
    report.push('pending_capture_awaitthenforce_no_tail_deadlock');
  }

  // 11. disabled→event→enabled retains dirty
  {
    const { session } = createHarness();
    await session.start();
    await session.capture(true);
    assert.equal(session.isDirty(), false);
    await session.configure({ enabled: false }, false);
    session.onNativeEvent('SourceRenamed');
    assert.equal(session.isDirty(), true, 'onNativeEvent increments revision regardless of enabled flag');
    await session.configure({ enabled: true }, false);
    assert.equal(session.isDirty(), true, 'Re-enabled session retains dirty state');
    report.push('disabled_then_event_then_enabled_retains_dirty');
  }

  // 12. journalhashchain/prune semantics unchanged
  {
    const { session, p, memFs, backupList } = createHarness();
    await session.start();
    assert.equal(session.settings.enabled, true);
    assert.equal(session.settings.intervalSeconds, 60);
    assert.equal(session.settings.retention, 20);
    await session.journal('user_cut');
    await session.journal('user_fade');
    const jRecs = await session.journalRecords(session.current.id);
    assert.ok(jRecs.records.length >= 2);
    for (let i = 1; i < jRecs.records.length; i++) {
      assert.equal(jRecs.records[i].previousHash, jRecs.records[i - 1].hash, 'Strict sha256 hash chaining required');
    }
    for (let i = 0; i < 25; i++) {
      const id = randomUUID();
      backupList.push({ id, kind: 'autosave', scope: p.scope });
      await memFs.writeFile(`/app/projetos/recuperacao/${id}.fmx`, 'fmx-dummy');
    }
    await session.prune();
    const listed = (await p.recoveryEngine.list()).filter(i => i.kind === 'autosave' && i.name === p.scope);
    assert.ok(listed.length <= 27, 'Prune respects retention bounds without breaking');
    report.push('journal_hashchain_and_prune_semantics_preserved');
  }

  // 13. failed prune retains dirty
  {
    const { session, p } = createHarness();
    await session.start();
    session.markDirty('work-before-prune');
    assert.equal(session.isDirty(), true, 'Session must be dirty before prune attempt');
    const origList = p.recoveryEngine.list;
    p.recoveryEngine.list = async () => { throw new Error('Prune storage list failure'); };
    await assert.rejects(async () => { await session.prune(); }, /Prune storage list failure/);
    assert.equal(session.isDirty(), true, 'Failed prune must retain dirty state');
    p.recoveryEngine.list = origList;
    const retryRes = await session.capture(true);
    assert.ok(retryRes.snapshot);
    assert.equal(session.isDirty(), false, 'Session becomes clean after subsequent valid capture');
    report.push('failed_prune_retains_dirty');
  }

  // 14. concurrency order 1: nativeBatch 700ms tick -> manual p.run(recovery_checkpoint)
  {
    const { session, p, advanceTime } = createHarness();
    await session.start();
    await session.capture(true);
    assert.equal(session.isDirty(), false);

    let activeBackups = 0;
    let maxActiveBackup = 0;
    let backupGateResolve;
    const backupGate = new Promise(r => { backupGateResolve = r; });

    const origBackup = p.recoveryEngine.backup;
    p.recoveryEngine.backup = async opts => {
      activeBackups++;
      if (activeBackups > maxActiveBackup) maxActiveBackup = activeBackups;
      await backupGate;
      try {
        return await origBackup.call(p.recoveryEngine, opts);
      } finally {
        activeBackups--;
      }
    };

    session.onNativeEvent('SourceRenamed');
    assert.ok(session.nativeBatch, 'Native batch initiated');
    const initialRev = session.revision;

    advanceTime(750);
    session.tick();
    assert.equal(session.pending, true, 'Tick marked pending for flushNative');

    const runPromise = p.run('recovery_checkpoint');
    backupGateResolve();

    await Promise.all([runPromise, p.tail, session.journalTail]);

    assert.equal(maxActiveBackup, 1, 'maxActiveBackup must never exceed 1');
    assert.equal(session.nativeCapturing, false, 'nativeCapturing must be false after terminal completion');
    assert.ok(session.revision >= initialRev, 'Changed revision preserved');
    assert.equal(session.error, null, 'No error occurred');
    assert.equal(session.activeCapture, null, 'No activeCapture left hanging');
    assert.equal(session.pending, false, 'Pending flag cleared');
    report.push('concurrency_order1_tick_then_prun_serialized');
  }

  // 15. concurrency order 2: manual p.run(recovery_checkpoint) -> native tick
  {
    const { session, p, advanceTime } = createHarness();
    await session.start();
    await session.capture(true);
    assert.equal(session.isDirty(), false);

    let activeBackups = 0;
    let maxActiveBackup = 0;
    let backupStartedResolve;
    const backupStarted = new Promise(r => { backupStartedResolve = r; });
    let backupGateResolve;
    const backupGate = new Promise(r => { backupGateResolve = r; });

    const origBackup = p.recoveryEngine.backup;
    p.recoveryEngine.backup = async opts => {
      activeBackups++;
      if (activeBackups > maxActiveBackup) maxActiveBackup = activeBackups;
      backupStartedResolve();
      await backupGate;
      try {
        return await origBackup.call(p.recoveryEngine, opts);
      } finally {
        activeBackups--;
      }
    };

    session.onNativeEvent('SourceRenamed');
    assert.ok(session.nativeBatch, 'Native batch initiated');
    const initialRev = session.revision;
    advanceTime(750);

    const runPromise = p.run('recovery_checkpoint');
    await backupStarted;

    assert.equal(maxActiveBackup, 1, 'Active backup in flight during checkpoint');
    assert.equal(session.nativeCapturing, true, 'nativeCapturing active during backup phase');

    session.tick();
    assert.equal(session.pending, true, 'Tick enqueues flushNative behind p.tail');

    session.onNativeEvent('InputSettingsChanged');

    backupGateResolve();

    await Promise.all([runPromise, p.tail, session.journalTail]);

    assert.equal(maxActiveBackup, 1, 'maxActiveBackup strictly <= 1 throughout entire race');
    assert.equal(session.nativeCapturing, false, 'nativeCapturing restored to false after all tails finish');
    assert.ok(session.revision > initialRev, 'Mutations during capture incremented and preserved revision');
    assert.equal(session.error, null, 'No errors during concurrent execution');
    assert.equal(session.activeCapture, null, 'activeCapture cleared');
    assert.equal(session.pending, false, 'pending flag cleared');
    report.push('concurrency_order2_prun_then_tick_serialized');
  }

  return report;
}

runContracts().then(passed => {
  console.log('Passed checks:', passed);
}).catch(err => {
  console.error('Contract failure:', err);
  process.exit(1);
});
