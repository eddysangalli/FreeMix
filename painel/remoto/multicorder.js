// MultiCorder window (each camera to its own file), laid out like the reference switcher's "MultiCorder": the file
// formats as buttons on top, audio / new file every / folder, the list of inputs with a tick each, and Start below.
// Everything shown is read from the engine (GET /api/iso) and every button sends a real command (POST /api/iso).
// Starting can take the engine several seconds (it waits for the files to exist): the window stays locked and says
// so until the engine's own state confirms, and never repeats a command by itself.
(() => {
  'use strict';
  const E = (id) => document.getElementById(id), esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fill = (el, html) => { if (el._html !== html) { el.innerHTML = html; el._html = html; } };
  const FIELDS = ['format', 'audio', 'audioSourceUUID', 'splitSeconds', 'directory'];
  const clock = (ms) => { const s = Math.max(0, Math.floor(ms / 1000)), p = (n) => String(n).padStart(2, '0'); return (s >= 3600 ? Math.floor(s / 3600) + ':' : '') + p(Math.floor(s / 60) % 60) + ':' + p(s % 60); };

  let iso = null, busy = false, draft = null, waiting = null;   // waiting = { rec, until }: a start/stop the engine has not confirmed yet
  const chosen = new Set();                                    // inputs ticked to record

  const say = (text, kind = '') => { const box = E('msg'); box.textContent = text; box.className = 'vd-msg' + (kind ? ' vd-' + kind : ''); };
  const note = (text, kind) => { delete E('msg').dataset.auto; say(text, kind); };
  async function call(body, timeout = 10000) {
    const r = await fetch('/api/iso', { ...(body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : { cache: 'no-store' }), signal: AbortSignal.timeout(timeout) });
    const v = await r.json().catch(() => ({}));
    if (!r.ok || v.success !== true || typeof v.iso?.rec !== 'boolean') throw Error(v.error || 'O programa não respondeu');
    return v.iso;
  }
  const saved = () => { const o = iso.recordOptions || {}; return { format: o.format || 'mpegts', audio: o.audio || 'input', audioSourceUUID: o.audioSourceUUID || '', splitSeconds: Number(o.splitSeconds || 0), directory: o.directory || '' }; };
  const current = () => ({ ...saved(), ...(draft || {}) });
  const dirty = () => !!draft && Object.keys(draft).length > 0;
  function edit(change) { const base = saved(), next = { ...(draft || {}), ...change }; for (const k of Object.keys(next)) if (String(next[k]) === String(base[k])) delete next[k]; draft = Object.keys(next).length ? next : null; }
  // The options the engine keeps that this window does not show (codec, quality, file name…) go back untouched.
  async function save() { if (!dirty()) return; const c = current(); iso = await call({ action: 'configure', options: { ...(iso.recordOptions || {}), ...Object.fromEntries(FIELDS.map((k) => [k, c[k]])) } }, 30000); draft = null; }

  function draw() {
    if (!iso) return;
    const c = current(), rec = iso.rec === true, pending = !!waiting, locked = busy || rec || pending, active = document.activeElement, cams = iso.availableCams || [];
    for (const name of [...chosen]) if (!cams.includes(name)) chosen.delete(name);
    for (const b of E('formats').children) { b.classList.toggle('vd-on', b.dataset.format === c.format); b.setAttribute('aria-selected', b.dataset.format === c.format); b.disabled = locked; }
    if (E('audio').value !== c.audio) E('audio').value = c.audio;
    const choices = iso.audioChoices || [];
    E('audio-source').hidden = c.audio !== 'source';
    fill(E('audio-source'), '<option value="">Escolha a fonte…</option>' + choices.map((a) => `<option value="${esc(a.key)}">${a.bus ? 'Bus · ' : ''}${esc(a.name)}</option>`).join(''));
    if (E('audio-source').value !== c.audioSourceUUID) E('audio-source').value = c.audioSourceUUID;
    if (E('split').value !== String(c.splitSeconds)) E('split').value = String(c.splitSeconds);
    if (active !== E('directory')) E('directory').value = c.directory;
    for (const id of ['audio', 'audio-source', 'split', 'directory']) E(id).disabled = locked;
    const session = rec ? iso.session : null, files = session?.cams || [];
    fill(E('rows'), cams.map((name) => { const cam = files.find((x) => x.name === name), file = cam?.file || (cam?.files || []).at(-1) || '';
      return `<tr><td><input type="checkbox" data-cam="${esc(name)}"${rec ? (cam ? ' checked' : '') : chosen.has(name) ? ' checked' : ''}${locked ? ' disabled' : ''} aria-label="Gravar ${esc(name)}"></td><td>${esc(name)}</td><td class="vd-mono">${cam && session.startedAt ? clock(Date.now() - session.startedAt) : '—'}</td><td>${cam ? '<span class="vd-air-text">GRAVANDO</span>' : 'Parado'}</td><td class="vd-url" title="${esc(file)}">${esc(file ? file.split(/[\\/]/).pop() : '—')}</td></tr>`; }).join('') || '<tr><td colspan="5" class="vd-note">Nenhuma entrada na mesa para gravar.</td></tr>');
    E('start').textContent = rec ? 'Parar' : 'Começar'; E('start').classList.toggle('vd-air', rec); E('start').disabled = busy || pending || (!rec && !cams.length);
    E('advanced').disabled = busy || pending; E('save-close').disabled = busy || pending;
    if (!E('msg').textContent || E('msg').dataset.auto) {
      const text = pending ? 'Aguardando o programa confirmar…' : rec ? `Gravando ${files.length} entrada(s)` + (session?.dir ? ' em ' + session.dir : '') + ': pare para alterar.' : dirty() ? 'Alterações ainda não salvas.' : cams.length ? 'Marque as entradas e clique em Começar.' : '';
      say(text); E('msg').dataset.auto = '1';
    }
  }

  async function run(what, task) { if (busy) return; busy = true; note(what + '…'); draw(); try { const done = await task(); note(done || 'Confirmado pelo programa.', 'ok'); } catch (e) { note(e.message, 'error'); } finally { busy = false; draw(); } }
  // A start or stop that got no answer in time is not repeated: the window waits for the engine's state to tell.
  async function toggle(rec) {
    try { iso = await call(rec ? { action: 'start', cams: [...chosen] } : { action: 'stop' }, 45000); }
    catch (e) { if (e.name === 'TimeoutError' || e.name === 'AbortError' || e instanceof TypeError) { waiting = { rec, until: Date.now() + 60000 }; throw Error('O programa ainda não confirmou. Aguarde: esta janela mostra quando ele responder.'); } throw e; }
  }

  E('formats').onclick = (e) => { const b = e.target.closest('button'); if (!b || b.disabled) return; edit({ format: b.dataset.format }); E('msg').dataset.auto = '1'; draw(); };
  E('audio').onchange = (e) => { edit({ audio: e.target.value, ...(e.target.value === 'source' ? {} : { audioSourceUUID: '' }) }); E('msg').dataset.auto = '1'; draw(); };
  E('audio-source').onchange = (e) => { edit({ audioSourceUUID: e.target.value }); E('msg').dataset.auto = '1'; draw(); };
  E('split').onchange = (e) => { edit({ splitSeconds: Number(e.target.value) || 0 }); E('msg').dataset.auto = '1'; draw(); };
  E('directory').oninput = (e) => { edit({ directory: e.target.value.trim() }); E('msg').dataset.auto = '1'; draw(); };
  E('rows').onchange = (e) => { const box = e.target.closest('input[data-cam]'); if (!box) return; if (box.checked) chosen.add(box.dataset.cam); else chosen.delete(box.dataset.cam); draw(); };
  E('start').onclick = () => {
    if (iso?.rec) { run('Parando e fechando os arquivos', async () => { await toggle(false); return 'MultiGravação parada. Arquivos fechados.'; }); return; }
    if (!chosen.size) { note('Marque pelo menos uma entrada para gravar.', 'error'); return; }
    if (chosen.size > 8) { note('No máximo 8 entradas ao mesmo tempo.', 'error'); return; }
    if (current().audio === 'source' && !current().audioSourceUUID) { note('Escolha a fonte de áudio.', 'error'); return; }
    run('Começando a gravar', async () => { await save(); await toggle(true); return `Gravando ${chosen.size} entrada(s), confirmado pelo programa.`; });
  };
  E('advanced').onclick = () => { if (dirty() && !confirm('Há alterações não salvas nesta janela. Abrir o editor avançado mesmo assim?')) return; location.href = '/iso'; };
  E('save-close').onclick = () => run('Salvando', async () => { if (!iso.rec) await save(); setTimeout(() => window.FreeMixClosePanel(), 150); return 'Salvo no programa.'; });

  // The engine's state is re-read (a pure read); the clock of a running recording ticks in between.
  async function refresh() { if (busy || document.hidden) return; try { iso = await call(); if (waiting && (iso.rec === waiting.rec || Date.now() > waiting.until)) { const ok = iso.rec === waiting.rec; waiting = null; note(ok ? (iso.rec ? 'Gravação confirmada pelo programa.' : 'Parada confirmada pelo programa.') : 'O programa não confirmou. Confira a lista abaixo antes de tentar de novo.', ok ? 'ok' : 'error'); } draw(); } catch { /* keeps what is on screen; the next read tries again */ } }
  setInterval(refresh, 2000);
  setInterval(() => { if (iso?.rec && !busy) draw(); }, 1000);
  (async function start() { for (;;) { try { iso = await call(); break; } catch (e) { say(e.message + ' Tentando de novo…', 'error'); await new Promise((r) => setTimeout(r, 1500)); } } say(''); E('msg').dataset.auto = '1'; draw(); })();
})();
