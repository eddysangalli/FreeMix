(function () {
  'use strict';

  // DRAFT-gravar.js (R2) - Controlador do Diálogo Compacto de Gravação FreeMix
  // Conformidade total com contratos de backend: GET /api/settings, GET /api/json, POST /api/control.
  // Protocolo postMessage padronizado da Mesa ({ freemixCloseSettings: true }).
  // Deadlines via AbortSignal.timeout, bloqueio global durante ACK e fechamento após OK com sucesso.

  const FORMAT_LABELS = {
    'mp4': 'MP4',
    'fragmented_mp4': 'MP4 (Fragmentado)',
    'hybrid_mp4': 'MP4 (Híbrido)',
    'mkv': 'MKV',
    'mov': 'MOV',
    'fragmented_mov': 'MOV (Fragmentado)',
    'hybrid_mov': 'MOV (Híbrido)'
  };

  let currentConfig = null;
  let currentPreset = '';
  let draft = {
    directory: '',
    format: 'mkv',
    quality: 'HQ',
    encoder: 'x264'
  };
  let isBusy = false;
  let isRecordingActive = false;
  let statusPollTimer = null;

  // Elementos do DOM
  const elBadge = document.getElementById('rec-badge');
  const elFormatList = document.getElementById('format-list');
  const elAdvBanner = document.getElementById('adv-banner');
  const elDirectory = document.getElementById('rec-directory');
  const elEncoder = document.getElementById('rec-encoder');
  const elQuality = document.getElementById('rec-quality');
  const elInfoRes = document.getElementById('info-resolution');
  const elInfoFps = document.getElementById('info-fps');
  const elStatusMsg = document.getElementById('status-msg');
  const elBtnAdvanced = document.getElementById('btn-advanced');
  const elBtnCancel = document.getElementById('btn-cancel');
  const elBtnSave = document.getElementById('btn-save');

  function setStatus(text, type) {
    elStatusMsg.textContent = text || '';
    elStatusMsg.className = 'vrec-status-msg' + (type ? ' ' + type : '');
  }

  function closeDialog() {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ freemixCloseSettings: true }, location.origin);
    } else {
      window.close();
    }
  }

  function getSessionDraftKey() {
    return 'freemix_draft_recording_' + (currentPreset || 'default');
  }

  function saveSessionDraft() {
    try {
      sessionStorage.setItem(getSessionDraftKey(), JSON.stringify(draft));
    } catch (_) {}
  }

  function loadSessionDraft() {
    try {
      const raw = sessionStorage.getItem(getSessionDraftKey());
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return null;
  }

  function clearSessionDraft() {
    try {
      sessionStorage.removeItem(getSessionDraftKey());
    } catch (_) {}
  }

  // Atualiza bloqueio de todos os controles interativos durante requisições em trânsito
  function updateUiBusyState() {
    const isAdv = Boolean(currentConfig && currentConfig.mode === 'Advanced');
    const lockInputs = isBusy || isAdv;

    elDirectory.disabled = lockInputs;
    elEncoder.disabled = lockInputs;
    elQuality.disabled = lockInputs;

    const formatButtons = elFormatList.querySelectorAll('.vrec-format-btn');
    formatButtons.forEach(function (btn) {
      btn.disabled = lockInputs;
    });

    elBtnAdvanced.disabled = isBusy;
    elBtnCancel.disabled = isBusy;

    if (isAdv) {
      elBtnSave.disabled = true;
      return;
    }

    if (isRecordingActive) {
      elBtnSave.disabled = true;
      if (!isBusy) {
        setStatus('Gravação em andamento. Pare a gravação para alterar configurações.', 'error');
      }
      return;
    }

    elBtnSave.disabled = isBusy;
  }

  // Renderiza a barra lateral com os formatos suportados pelo backend
  function renderFormatList(formats, activeFormat) {
    elFormatList.innerHTML = '';
    if (!Array.isArray(formats) || !formats.length) {
      formats = ['mkv', 'mp4'];
    }

    formats.forEach(function (fmt) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'vrec-format-btn' + (fmt === activeFormat ? ' active' : '');
      btn.textContent = FORMAT_LABELS[fmt] || fmt.toUpperCase();
      btn.dataset.format = fmt;
      btn.disabled = isBusy || Boolean(currentConfig && currentConfig.mode === 'Advanced');
      btn.addEventListener('click', function () {
        if (isBusy || (currentConfig && currentConfig.mode === 'Advanced')) return;
        draft.format = fmt;
        saveSessionDraft();
        renderFormatList(formats, fmt);
        setStatus('Formato selecionado: ' + (FORMAT_LABELS[fmt] || fmt), '');
      });
      elFormatList.appendChild(btn);
    });
  }

  // Renderiza os codificadores descobertos por hardware
  function renderEncoders(encoders, selectedEncoder) {
    elEncoder.innerHTML = '';
    if (!Array.isArray(encoders)) encoders = [];

    let hasSelected = false;
    encoders.forEach(function (enc) {
      const opt = document.createElement('option');
      opt.value = enc.id;
      opt.textContent = enc.label || enc.id;
      if (enc.id === selectedEncoder) {
        opt.selected = true;
        hasSelected = true;
      }
      elEncoder.appendChild(opt);
    });

    // Se o encoder atualmente configurado não estiver disponível no hardware local,
    // preserva o valor antigo desabilitado sem converter automaticamente.
    if (!hasSelected && selectedEncoder) {
      const optMissing = document.createElement('option');
      optMissing.value = selectedEncoder;
      optMissing.textContent = 'Atual: ' + selectedEncoder + ' (Indisponível no sistema)';
      optMissing.selected = true;
      optMissing.disabled = true;
      elEncoder.insertBefore(optMissing, elEncoder.firstChild);
    }
  }

  // Aplica configurações recebidas do backend aos campos
  function applyConfigToUi(config) {
    currentConfig = config;
    const isAdv = config.mode === 'Advanced';
    const formats = config.capabilities && config.capabilities.recordingFormats ? config.capabilities.recordingFormats : ['mkv', 'mp4'];
    const encoders = config.capabilities && config.capabilities.simpleEncoders ? config.capabilities.simpleEncoders : [];

    // Resumo de vídeo somente-leitura
    if (config.video) {
      elInfoRes.textContent = (config.video.outputWidth || 1920) + 'x' + (config.video.outputHeight || 1080);
      elInfoFps.textContent = config.video.fpsNumerator ? (config.video.fpsNumerator + '/' + (config.video.fpsDenominator || 1) + ' fps') : '30 fps';
    }

    // Alerta de modo avançado
    if (isAdv) {
      elAdvBanner.classList.add('visible');
      setStatus('Modo Avançado ativo. Ajustes simplificados desativados.', '');
    } else {
      elAdvBanner.classList.remove('visible');
    }

    // Tenta restaurar rascunho de sessão ou usa valores vigentes
    const sessionDraft = loadSessionDraft();
    const initialDir = (sessionDraft && sessionDraft.directory) || config.recordDirectory || '';
    const initialFmt = (sessionDraft && sessionDraft.format) || (config.values && config.values.RecFormat2) || 'mkv';
    const initialQuality = (sessionDraft && sessionDraft.quality) || (config.values && config.values.RecQuality) || 'HQ';
    const initialEncoder = (sessionDraft && sessionDraft.encoder) || (config.values && config.values.RecEncoder) || 'x264';

    draft = {
      directory: initialDir,
      format: formats.includes(initialFmt) ? initialFmt : (formats[0] || 'mkv'),
      quality: ['Small', 'HQ', 'Lossless', 'Stream'].includes(initialQuality) ? initialQuality : 'HQ',
      encoder: initialEncoder
    };

    elDirectory.value = draft.directory;
    elQuality.value = draft.quality;
    renderFormatList(formats, draft.format);
    renderEncoders(encoders, draft.encoder);
    updateUiBusyState();
  }

  // Leitura inicial de configurações (Zero POST)
  async function loadSettings() {
    isBusy = true;
    updateUiBusyState();
    setStatus('Carregando configurações…', '');
    try {
      const res = await fetch('/api/settings', {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      if (!res.ok) throw new Error('Falha HTTP ' + res.status + ' ao carregar configurações');
      const data = await res.json();
      if (!data.success || !data.settings) throw new Error(data.error || 'Configurações inválidas');
      currentPreset = data.preset || '';
      applyConfigToUi(data.settings);
      setStatus('', '');
    } catch (err) {
      setStatus(err.message, 'error');
    } finally {
      isBusy = false;
      updateUiBusyState();
    }
  }

  // Leitura explícita do estado com validação rigorosa de tipo
  // forceCheck ignora document.hidden (imprescindível para pré-flight de salvamento)
  async function fetchCurrentState(forceCheck) {
    if (!forceCheck && document.hidden) return { ok: false, skipped: true };
    try {
      let state = null;
      if (window.FreeMixRemote && typeof window.FreeMixRemote.getState === 'function') {
        state = window.FreeMixRemote.getState();
      } else {
        const r = await fetch('/api/json', {
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        });
        if (!r.ok) return { ok: false, error: 'Falha HTTP ' + r.status + ' ao consultar estado' };
        state = await r.json();
      }

      if (!state || typeof state !== 'object' || typeof state.recording !== 'boolean') {
        return { ok: false, error: 'Estado de gravação malformado ou ausente' };
      }

      isRecordingActive = state.recording;
      if (isRecordingActive) {
        elBadge.textContent = 'GRAVANDO ' + (typeof state.recordTimecode === 'string' && state.recordTimecode ? state.recordTimecode : '00:00:00');
        elBadge.className = 'vrec-status-badge active';
      } else {
        elBadge.textContent = 'PARADO';
        elBadge.className = 'vrec-status-badge';
      }
      updateUiBusyState();
      return { ok: true, recording: isRecordingActive };
    } catch (err) {
      return { ok: false, error: err.message || 'Falha de comunicação ao consultar estado' };
    }
  }

  // Monitoramento passivo de gravação ativa via estado do FreeMix (rota real /api/json)
  async function pollState() {
    await fetchCurrentState(false);
  }

  // Salva alterações via POST /api/control (settings_apply plano: directory, format, quality, encoder)
  async function saveSettings() {
    if (isBusy || (currentConfig && currentConfig.mode === 'Advanced') || isRecordingActive) return;

    // 1. Validação síncrona dos campos do formulário antes de qualquer operação assíncrona
    const dir = (elDirectory.value || '').trim();
    if (!dir) {
      setStatus('Informe a pasta de gravação.', 'error');
      elDirectory.focus();
      return;
    }
    if (dir.length > 500 || /[\x00-\x1f]/.test(dir)) {
      setStatus('Caminho da pasta inválido.', 'error');
      elDirectory.focus();
      return;
    }

    const enc = elEncoder.value;
    if (!enc) {
      setStatus('Selecione um codificador válido.', 'error');
      elEncoder.focus();
      return;
    }

    // 2. Tomar isBusy ANTES de qualquer await para bloquear cliques concorrentes e edição de campos
    isBusy = true;
    updateUiBusyState();

    // 3. Capturar snapshot determinístico do draft e persistir na sessão
    draft.directory = dir;
    draft.encoder = enc;
    draft.quality = elQuality.value;
    saveSessionDraft();

    setStatus('Verificando condições de segurança do motor…', '');

    try {
      // 4. Pré-flight explícito de estado: exige confirmação boolean de recording (não ignora document.hidden)
      const stateCheck = await fetchCurrentState(true);
      if (!stateCheck || !stateCheck.ok) {
        throw new Error('Não foi possível verificar o estado do gravador (' + (stateCheck?.error || 'desconhecido') + '). Operação cancelada.');
      }
      if (stateCheck.recording) {
        throw new Error('Gravação iniciada recentemente. Pare a gravação antes de salvar.');
      }

      // 5. Pré-flight explícito de perfil e configurações: rejeita stale preset, modo avançado e leituras desconhecidas
      const pRes = await fetch('/api/settings', {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      if (!pRes.ok) {
        throw new Error('Falha HTTP ' + pRes.status + ' ao revalidar perfil de configurações. Operação cancelada.');
      }
      const pData = await pRes.json();
      if (!pData || !pData.success || typeof pData.preset !== 'string' || !pData.preset) {
        throw new Error('Resposta de configurações malformada ou inválida. Operação cancelada.');
      }
      if (pData.preset !== currentPreset) {
        throw new Error('O perfil de produção foi alterado externamente (' + pData.preset + '). Recarregue a janela.');
      }
      if (pData.settings && pData.settings.mode === 'Advanced') {
        applyConfigToUi(pData.settings);
        throw new Error('O perfil atual está em Modo Avançado no motor. Ajustes simplificados desativados.');
      }

      // 6. Envio do payload contratual plano
      setStatus('Aplicando configurações de gravação…', '');
      const payload = {
        action: 'settings_apply',
        category: 'recording',
        directory: draft.directory,
        format: draft.format,
        quality: draft.quality,
        encoder: draft.encoder
      };

      const res = await fetch('/api/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(8000)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Falha ao aplicar configurações');
      }

      clearSessionDraft();
      setStatus('Configurações salvas com sucesso!', 'success');
      if (data.settings) {
        applyConfigToUi(data.settings);
      }
      // Fecha a janela após confirmação do backend conforme padrão OK
      setTimeout(closeDialog, 250);
    } catch (err) {
      // Preserva escolhas do usuário e draft de sessão em caso de erro, sem retry automático
      setStatus(err.message, 'error');
    } finally {
      isBusy = false;
      updateUiBusyState();
    }
  }

  // Listeners de Eventos
  elDirectory.addEventListener('input', function () {
    draft.directory = elDirectory.value;
    saveSessionDraft();
  });

  elQuality.addEventListener('change', function () {
    draft.quality = elQuality.value;
    saveSessionDraft();
  });

  elEncoder.addEventListener('change', function () {
    draft.encoder = elEncoder.value;
    saveSessionDraft();
  });

  elBtnSave.addEventListener('click', saveSettings);

  elBtnCancel.addEventListener('click', function () {
    clearSessionDraft();
    closeDialog();
  });

  elBtnAdvanced.addEventListener('click', function () {
    window.location.href = '/settings?category=recording&context=recording';
  });

  // Inicialização
  window.addEventListener('DOMContentLoaded', function () {
    loadSettings();
    pollState();
    statusPollTimer = setInterval(pollState, 1000);
  });

  window.addEventListener('beforeunload', function () {
    if (statusPollTimer) clearInterval(statusPollTimer);
  });
})();