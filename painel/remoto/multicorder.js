// DRAFT-multicorder-r4.js
// Controlador do Diálogo Compacto de MultiGravação (MultiCorder) R4
//
// CONTRATOS E LIMITAÇÕES REAIS DE ENGENHARIA:
// - Escopo estrito MOCK_API_REAL_DOM_ONLY / CEF Web Dialog (700x540).
// - Não constitui garantia física de taxa de transferência de disco, barramento PCIe ou hardware NVENC/QSV.
// - Serialização de fila: no motor real (replay-disco.mjs), GET /api/iso (status) é enfileirado na this.queue
//   atrás de start/stop/configure. A sonda de vídeo FFprobe/stat de start() pode levar até 10s (40x250ms);
//   portanto, this.state.rec só muda para true APÓS a confirmação dos arquivos em disco.
// - Tratamento de Incerteza (Deadline 8s):
//   1. Quatro pontos de mutação protegidos: sendConfigure (manual), sendConfigure (pré-start), start e stop.
//   2. Falhas de rede (TypeError), estouros de deadline (AbortError) ou erros 5xx/respostas sem confirmação
//      são classificadas como DESCONHECIDAS (uncertainOp: 'configure' | 'start' | 'stop').
//   3. Erros 4xx do backend (400 microfone do diretor, 403 acesso remoto) são conhecidos e NÃO armam uncertainOp.
//   4. Incerteza bloqueia novos POSTs cegos (btnStart e btnSave desabilitados), mas preserva rascunhos,
//      mantém a consulta manual (btnRefresh) e o link de configurações Avançadas (/iso) totalmente livres.
//   5. Invalidação por Epoch: mutações incrementam stateEpoch para descartar respostas GET lentas que estavam em voo.
//   6. Resolução coerente: rec=true só resolve uncertainOp='start'; rec=false só resolve uncertainOp='stop'.
//      O botão Atualizar exige freshState com validação estrita de schema e nunca destrava com cache obsoleto.

'use strict';
(() => {
  const TIMEOUT_MS = 8000;
  const POLL_MS = 2000;

  const el = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  let persistedState = null;
  let availableCams = [];
  const userSelection = new Set();
  let dirtyDraft = false;
  let localOptions = {
    format: 'mpegts',
    audio: 'input',
    audioSourceUUID: '',
    splitSeconds: 0,
    directory: ''
  };

  let isBusy = false;
  let uncertainOp = null; // null | 'configure' | 'start' | 'stop'
  let stateEpoch = 0;
  let pollTimer = null;
  let clockTimer = null;

  function formatDuration(ms) {
    if (ms == null || ms < 0 || !Number.isFinite(ms)) return '—';
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  function setStatus(msg, isError = false) {
    const box = el('mc-status-text');
    if (!box) return;
    box.textContent = msg || '';
    box.className = 'mc-status-text' + (isError ? ' error' : '');
  }

  function setBusy(val) {
    isBusy = val;
    renderControls();
  }

  function isNetworkOrTimeout(err, res = null) {
    if (err) {
      if (err.name === 'AbortError' || err.name === 'TimeoutError' || err instanceof TypeError) return true;
      const msg = String(err.message || '').toLowerCase();
      if (msg.includes('tempo limite') || msg.includes('timeout') || msg.includes('failed to fetch') || msg.includes('network')) return true;
    }
    if (res && res.status >= 500) return true;
    return false;
  }

  function syncLocalFromPersisted(opts) {
    if (!opts || typeof opts !== 'object') return;
    localOptions.format = ['mpegts', 'mkv', 'mp4_safe'].includes(opts.format) ? opts.format : 'mpegts';
    localOptions.audio = opts.audio || 'input';
    localOptions.audioSourceUUID = opts.audioSourceUUID || '';
    localOptions.splitSeconds = Number(opts.splitSeconds || 0);
    localOptions.directory = opts.directory || '';
  }

  function buildMergedOptions() {
    const base = structuredClone(persistedState?.recordOptions || {});
    return {
      ...base,
      format: localOptions.format,
      audio: localOptions.audio,
      audioSourceUUID: localOptions.audioSourceUUID,
      splitSeconds: localOptions.splitSeconds,
      directory: localOptions.directory
    };
  }

  async function fetchStatus(isManual = false) {
    if (isBusy && !isManual) return null;
    const epoch = ++stateEpoch;
    try {
      const res = await fetch('/api/iso', {
        method: 'GET',
        signal: AbortSignal.timeout(TIMEOUT_MS)
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      if (!data || data.success !== true || !data.iso || typeof data.iso.rec !== 'boolean') {
        throw new Error(data?.error || 'Estrutura de estado inválida retornada pelo motor');
      }

      if (epoch < stateEpoch) {
        // Resposta GET lenta descartada para evitar contaminação de estado após mutação
        return null;
      }

      persistedState = data.iso;
      availableCams = Array.isArray(data.iso.availableCams) ? data.iso.availableCams : [];

      if (!dirtyDraft && persistedState.recordOptions) {
        syncLocalFromPersisted(persistedState.recordOptions);
      }

      // Reconciliação coerente baseada no contexto da operação incerta
      if (persistedState.rec === true) {
        if (uncertainOp === 'start') {
          uncertainOp = null; // START tardio finalmente confirmado pelo motor
        }
      } else if (persistedState.rec === false) {
        if (uncertainOp === 'stop') {
          uncertainOp = null; // STOP tardio confirmado com motor parado
        }
      }

      if (uncertainOp === 'configure' && persistedState.recordOptions) {
        const rem = persistedState.recordOptions;
        if (rem.format === localOptions.format &&
            rem.audio === localOptions.audio &&
            Number(rem.splitSeconds || 0) === localOptions.splitSeconds &&
            (rem.directory || '') === localOptions.directory) {
          uncertainOp = null;
          dirtyDraft = false;
        }
      }

      render();

      const hasActiveError = el('mc-status-text')?.classList.contains('error');

      if (persistedState.rec === true) {
        if (uncertainOp !== 'stop') {
          setStatus('MultiGravação ativa.');
        }
      } else if (isManual) {
        if (!hasActiveError && uncertainOp === null) {
          setStatus('Status atualizado (Parado).');
        }
      } else if (!dirtyDraft && !hasActiveError && uncertainOp === null) {
        const cur = el('mc-status-text')?.textContent;
        if (!cur || cur === 'Conectando ao motor...' || cur === 'MultiGravação ativa.') {
          setStatus('Pronto para gravar.');
        }
      }

      return persistedState;
    } catch (err) {
      if (isManual) {
        setStatus(`Falha ao atualizar status: ${err.message}`, true);
      }
      return null;
    }
  }

  async function sendConfigure() {
    const options = buildMergedOptions();
    let res, data;
    try {
      res = await fetch('/api/iso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'configure', options }),
        signal: AbortSignal.timeout(TIMEOUT_MS)
      });
      data = await res.json().catch(() => ({}));
    } catch (err) {
      const isUnk = isNetworkOrTimeout(err);
      const errObj = new Error(isUnk ? 'Tempo limite de 8s ou falha de rede ao salvar configurações' : (err.message || 'Falha na comunicação'));
      errObj.isUnknown = isUnk;
      throw errObj;
    }

    if (res.status === 403) {
      const err = new Error(data.error || 'Opções de gravação só no computador do FreeMix');
      err.isUnknown = false; // Erro 403 é conhecido e rejeitado localmente
      throw err;
    }

    if (!res.ok || data.success !== true) {
      const isUnk = isNetworkOrTimeout(null, res);
      const err = new Error(data.error || `Falha na configuração (HTTP ${res.status})`);
      err.isUnknown = isUnk;
      throw err;
    }

    if (data.iso && typeof data.iso.rec === 'boolean') {
      persistedState = data.iso;
      syncLocalFromPersisted(persistedState.recordOptions);
    }
    dirtyDraft = false;
    uncertainOp = null;
  }

  async function handleStart() {
    if (isBusy || uncertainOp !== null) return;
    if (persistedState?.rec === true) {
      await handleStop();
      return;
    }

    const selectedList = Array.from(userSelection);
    if (selectedList.length === 0) {
      setStatus('Selecione entre 1 e 8 entradas para gravar.', true);
      return;
    }
    if (selectedList.length > 8) {
      setStatus('Máximo de 8 entradas permitidas para MultiGravação.', true);
      return;
    }

    const validCams = selectedList.filter(name => availableCams.includes(name));
    if (validCams.length !== selectedList.length) {
      setStatus('Algumas entradas selecionadas não estão mais disponíveis no projeto.', true);
      return;
    }

    setBusy(true);
    stateEpoch++; // Invalida qualquer GET de polling anterior que chegue após este início

    // 1. Configure pré-start
    if (dirtyDraft) {
      try {
        setStatus('Salvando opções antes de iniciar gravação...');
        await sendConfigure();
      } catch (err) {
        if (err.isUnknown) {
          uncertainOp = 'configure';
          setStatus('Tempo limite de 8s ou falha de rede ao salvar opções pré-início. Verifique com Atualizar.', true);
        } else {
          setStatus(`Falha ao salvar configurações: ${err.message}`, true);
        }
        setBusy(false);
        render();
        return;
      }
    }

    // 2. Start
    try {
      setStatus('Iniciando MultiGravação no motor...');
      const res = await fetch('/api/iso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', cams: validCams }),
        signal: AbortSignal.timeout(TIMEOUT_MS)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success !== true) {
        const isUnk = isNetworkOrTimeout(null, res);
        const err = new Error(data.error || `Erro HTTP ${res.status}`);
        err.isUnknown = isUnk;
        throw err;
      }
      if (data.iso && typeof data.iso.rec === 'boolean') {
        persistedState = data.iso;
      }
      uncertainOp = null;
      setStatus('MultiGravação iniciada com sucesso.');
    } catch (err) {
      if (err.isUnknown || isNetworkOrTimeout(err)) {
        uncertainOp = 'start';
        try { await fetchStatus(false); } catch (_) {}
        setStatus('Tempo limite de 8s excedido no início. O motor pode ainda estar iniciando. Verifique o status com Atualizar.', true);
      } else {
        setStatus(`Falha ao iniciar: ${err.message}`, true);
      }
    } finally {
      setBusy(false);
      render();
    }
  }

  async function handleStop() {
    if (isBusy || uncertainOp !== null) return;
    if (!persistedState || persistedState.rec !== true) {
      setStatus('Nenhuma gravação ativa para parar.', true);
      return;
    }

    setBusy(true);
    stateEpoch++; // Invalida qualquer GET em trânsito
    try {
      setStatus('Parando MultiGravação e finalizando arquivos...');
      const res = await fetch('/api/iso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop' }),
        signal: AbortSignal.timeout(TIMEOUT_MS)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success !== true) {
        const isUnk = isNetworkOrTimeout(null, res);
        const err = new Error(data.error || `Erro HTTP ${res.status}`);
        err.isUnknown = isUnk;
        throw err;
      }
      if (data.iso && typeof data.iso.rec === 'boolean') {
        persistedState = data.iso;
      }
      uncertainOp = null;
      setStatus('MultiGravação finalizada.');
    } catch (err) {
      if (err.isUnknown || isNetworkOrTimeout(err)) {
        uncertainOp = 'stop';
        setStatus('Tempo limite de 8s ao parar gravação. O motor pode ainda estar finalizando. Verifique com Atualizar.', true);
      } else {
        setStatus(`Falha ao parar: ${err.message}`, true);
      }
    } finally {
      setBusy(false);
      render();
    }
  }

  async function handleSave() {
    if (isBusy || uncertainOp !== null) return;
    if (persistedState?.rec === true) {
      setStatus('Pare a gravação antes de alterar configurações.', true);
      return;
    }

    setBusy(true);
    stateEpoch++; // Invalida qualquer GET em trânsito
    try {
      setStatus('Salvando opções da MultiGravação...');
      await sendConfigure();
      setStatus('Opções salvas com sucesso no motor.');
    } catch (err) {
      if (err.isUnknown) {
        uncertainOp = 'configure';
        setStatus('Tempo limite de 8s ao salvar opções. Verifique o status com Atualizar.', true);
      } else {
        setStatus(`Falha ao salvar opções: ${err.message}`, true);
      }
    } finally {
      setBusy(false);
      render();
    }
  }

  function renderControls() {
    const isRec = persistedState?.rec === true;
    const hasUncertain = uncertainOp !== null;
    const lockInputs = isRec || isBusy || hasUncertain;

    const btnStart = el('btn-main-action');
    if (btnStart) {
      btnStart.disabled = isBusy || hasUncertain;
      if (isRec) {
        btnStart.textContent = 'Stop';
        btnStart.className = 'mc-btn-main recording';
        btnStart.title = 'Parar MultiGravação ativa';
      } else {
        btnStart.textContent = 'Start';
        btnStart.className = 'mc-btn-main';
        btnStart.title = hasUncertain ? `Aguardando confirmação de ${uncertainOp}` : 'Iniciar MultiGravação nas entradas marcadas';
      }
    }

    for (const btn of document.querySelectorAll('[data-format]')) {
      btn.disabled = lockInputs;
      btn.classList.toggle('selected', btn.dataset.format === localOptions.format);
    }

    const audioSel = el('mc-audio');
    if (audioSel) {
      audioSel.disabled = lockInputs;
      audioSel.value = localOptions.audio;
    }

    const sourceSel = el('mc-audio-source');
    if (sourceSel) {
      const showSource = localOptions.audio === 'source';
      sourceSel.style.display = showSource ? 'inline-block' : 'none';
      sourceSel.disabled = lockInputs;
      const choices = Array.isArray(persistedState?.audioChoices) ? persistedState.audioChoices : [];
      const choiceSig = JSON.stringify(choices);
      if (sourceSel.dataset.sig !== choiceSig) {
        sourceSel.dataset.sig = choiceSig;
        sourceSel.innerHTML = '<option value="">Selecione fonte...</option>' +
          choices.map(c => `<option value="${esc(c.key)}">${c.bus ? 'Bus · ' : ''}${esc(c.name)}</option>`).join('');
      }
      sourceSel.value = localOptions.audioSourceUUID || '';
    }

    const splitSel = el('mc-split');
    if (splitSel) {
      splitSel.disabled = lockInputs;
      splitSel.value = String(localOptions.splitSeconds);
    }

    const dirInput = el('mc-dir');
    if (dirInput) {
      dirInput.disabled = lockInputs;
      if (document.activeElement !== dirInput) {
        dirInput.value = localOptions.directory || '';
      }
    }

    const btnSave = el('btn-save');
    if (btnSave) {
      btnSave.disabled = lockInputs;
    }

    const btnRefresh = el('btn-refresh');
    if (btnRefresh) {
      btnRefresh.disabled = isBusy; // Consulta manual nunca bloqueada por incerteza
    }
  }

  function renderTable() {
    const tbody = el('mc-inputs-body');
    if (!tbody) return;

    if (!availableCams || availableCams.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #888888; padding: 14px;">Nenhuma entrada disponível no projeto.</td></tr>';
      return;
    }

    const isRec = persistedState?.rec === true;
    const startedAt = persistedState?.session?.startedAt;
    const sessionCams = Array.isArray(persistedState?.session?.cams) ? persistedState.session.cams : [];
    const defaultDir = persistedState?.session?.dir || localOptions.directory || 'Pasta padrão';

    const rows = availableCams.map(name => {
      const isChecked = userSelection.has(name);
      const cam = isRec ? sessionCams.find(c => c.name === name) : null;
      const isRecordingThis = isRec && !!cam;

      const durationText = isRecordingThis && startedAt ? formatDuration(Date.now() - startedAt) : '—';
      const stateText = isRecordingThis ? 'Gravando' : 'Parado';
      const pathText = cam?.file || cam?.dir || defaultDir;
      const disabledAttr = (isRec || isBusy || uncertainOp !== null) ? 'disabled' : '';
      const checkedAttr = isChecked ? 'checked' : '';

      return `<tr>` +
        `<td><label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">` +
        `<input type="checkbox" data-cam="${esc(name)}" ${checkedAttr} ${disabledAttr}>` +
        `<span>${esc(name)}</span>` +
        `</label></td>` +
        `<td>${durationText}</td>` +
        `<td class="col-drop">—</td>` +
        `<td>${stateText}</td>` +
        `<td class="col-path" title="${esc(pathText)}">${esc(pathText)}</td>` +
        `</tr>`;
    }).join('');

    tbody.innerHTML = rows;
  }

  function render() {
    renderControls();
    renderTable();
  }

  function bindEvents() {
    for (const btn of document.querySelectorAll('[data-format]')) {
      btn.addEventListener('click', e => {
        if (persistedState?.rec === true || isBusy || uncertainOp !== null) return;
        const fmt = e.currentTarget.dataset.format;
        if (fmt && localOptions.format !== fmt) {
          localOptions.format = fmt;
          dirtyDraft = true;
          renderControls();
        }
      });
    }

    const audioSel = el('mc-audio');
    if (audioSel) {
      audioSel.addEventListener('change', () => {
        localOptions.audio = audioSel.value;
        dirtyDraft = true;
        renderControls();
      });
    }

    const sourceSel = el('mc-audio-source');
    if (sourceSel) {
      sourceSel.addEventListener('change', () => {
        localOptions.audioSourceUUID = sourceSel.value;
        dirtyDraft = true;
      });
    }

    const splitSel = el('mc-split');
    if (splitSel) {
      splitSel.addEventListener('change', () => {
        localOptions.splitSeconds = Number(splitSel.value) || 0;
        dirtyDraft = true;
      });
    }

    const dirInput = el('mc-dir');
    if (dirInput) {
      dirInput.addEventListener('input', () => {
        localOptions.directory = dirInput.value.trim();
        dirtyDraft = true;
      });
    }

    const tbody = el('mc-inputs-body');
    if (tbody) {
      tbody.addEventListener('change', e => {
        const chk = e.target.closest('input[type="checkbox"][data-cam]');
        if (!chk) return;
        const camName = chk.dataset.cam;
        if (chk.checked) {
          userSelection.add(camName);
        } else {
          userSelection.delete(camName);
        }
      });
    }

    const btnStart = el('btn-main-action');
    if (btnStart) {
      btnStart.addEventListener('click', handleStart);
    }

    const btnSave = el('btn-save');
    if (btnSave) {
      btnSave.addEventListener('click', handleSave);
    }

    const btnRefresh = el('btn-refresh');
    if (btnRefresh) {
      btnRefresh.addEventListener('click', async () => {
        const opBefore = uncertainOp;
        const freshState = await fetchStatus(true);
        if (freshState && typeof freshState.rec === 'boolean') {
          if (opBefore === 'start') {
            if (freshState.rec === false) {
              uncertainOp = null;
              setStatus('Status confirmado pelo motor: gravação não iniciada. Pronto para nova tentativa.');
              renderControls();
            } else {
              uncertainOp = null;
              setStatus('Status confirmado pelo motor: gravação ativa.');
              renderControls();
            }
          } else if (opBefore === 'stop') {
            if (freshState.rec === false) {
              uncertainOp = null;
              setStatus('Status confirmado pelo motor: gravação parada com sucesso.');
              renderControls();
            } else {
              setStatus('Motor confirmou gravação ainda ativa. Tente parar novamente quando o processo concluir.', true);
            }
          } else if (opBefore === 'configure') {
            uncertainOp = null;
            dirtyDraft = false;
            setStatus('Status consultado no motor: opções reconciliadas.');
            renderControls();
          }
        }
        // Se freshState for null (falha de rede, timeout do GET ou erro 500), uncertainOp JAMAIS é desfeito com cache antigo!
      });
    }
  }

  function init() {
    bindEvents();
    fetchStatus(false);

    pollTimer = setInterval(() => {
      fetchStatus(false);
    }, POLL_MS);

    clockTimer = setInterval(() => {
      if (persistedState?.rec === true) {
        renderTable();
      }
    }, 1000);

    window.addEventListener('beforeunload', () => {
      clearInterval(pollTimer);
      clearInterval(clockTimer);
    });
  }

  init();
})();