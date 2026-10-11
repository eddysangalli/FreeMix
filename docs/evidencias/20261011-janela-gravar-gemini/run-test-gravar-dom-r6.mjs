// run-test-gravar-dom-r4.mjs
// Runner COMPLETO e FINITO para validação REAL DOM / CDP no Microsoft Edge (700x540).
// Diálogo de Gravação R3 (DRAFT-gravar-r3.html / DRAFT-gravar-r3.js).
//
// MOCK_API_REAL_DOM_ONLY:
// - Bootstrap comprovado do Externo R1: freePort() + --remote-debugging-port pré-alocado + fetch(/json/version).
// - Scope Guard estrito: validação de 127.0.0.1, porta própria, regex de path e ownership CIM (msedge.exe + perfil próprio).
// - Tolerância a launcher PID transitório (identifica o PID broker real em escuta sem afrouxar ownership).
// - Bloco try/finally abrangente: começa ANTES do spawn, garantindo receipt4 e cleanup cooperativo mesmo em falha de bootstrap.
// - Validação de PINs SHA-256 antes e depois da execução; todos os 17 gates e deadline POST 8000ms intactos.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import crypto from 'node:crypto';
import { spawn, execFile } from 'node:child_process';

const EXPECTED_HTML_SHA = 'd01392b3a44e2b1b94dee854ac8a6444b927ceab523da9e2e4b396168d95d664';
const EXPECTED_JS_SHA = '5544e6df0f51965246699df5ff9bdd22fdbc6f3323b630a65cdac9cb7d71716c';

const ownDir = path.resolve('D:/FreeMix-QA-Gemini-Recording-20261011-0730');
const candidateHtml = path.join(ownDir, 'DRAFT-gravar-r3.html');
const candidateJs = path.join(ownDir, 'DRAFT-gravar-r3.js');
const candidateCss = path.join(ownDir, 'vmix-dialogo.css');

function sha256File(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

const pinsBefore = {
  html: { path: candidateHtml, sha: sha256File(candidateHtml) },
  js: { path: candidateJs, sha: sha256File(candidateJs) },
  css: { path: candidateCss, sha: sha256File(candidateCss) }
};

if (pinsBefore.html.sha !== EXPECTED_HTML_SHA) {
  console.warn(`[AVISO PIN HTML] Observado: ${pinsBefore.html.sha} vs Esperado: ${EXPECTED_HTML_SHA}`);
}
if (pinsBefore.js.sha !== EXPECTED_JS_SHA) {
  console.warn(`[AVISO PIN JS] Observado: ${pinsBefore.js.sha} vs Esperado: ${EXPECTED_JS_SHA}`);
}

const receipt = {
  scope: 'MOCK_API_REAL_DOM_ONLY',
  runner: 'run-test-gravar-dom-r6.mjs',
  startedAt: new Date().toISOString(),
  viewport: { width: 700, height: 540 },
  pinsBefore,
  pinsAfter: null,
  browserExitObserved: false,
  browserMainPidAbsent: null,
  browserEdgeProfileCount: null,
  browserProfilePreserved: null,
  screenshots: [],
  assertions: [],
  summary: { total: 0, passed: 0, failed: 0 }
};

const freePort = async () => {
  const s = net.createServer();
  await new Promise((r) => s.listen(0, '127.0.0.1', r));
  const port = s.address().port;
  await new Promise((r) => s.close(r));
  return port;
};

function execPwsh(command) {
  return new Promise((resolve, reject) => {
    execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command], { timeout: 10000 }, (err, stdout, stderr) => {
      if (err) return reject(new Error(`PowerShell erro: ${err.message}; Stderr: ${stderr}`));
      resolve(stdout.trim());
    });
  });
}

function assertTest(id, description, passed, detail = '') {
  receipt.summary.total++;
  if (passed) {
    receipt.summary.passed++;
    console.log(`[PASS] ${id} - ${description}`);
  } else {
    receipt.summary.failed++;
    console.error(`[FAIL] ${id} - ${description}${detail ? ' -> ' + detail : ''}`);
  }
  receipt.assertions.push({ id, description, passed, detail, timestamp: new Date().toISOString() });
}

// -------------------------------------------------------------
// Estado Sintético do Servidor Mock e Controles de Simulação
// -------------------------------------------------------------
let mockSettingsScenario = 'standard'; // 'standard', 'unsupported_encoder', 'advanced'
let mockActivePreset = 'QA_MOCK_PRESET';
let mockSettingsFailure = null; // null, { status: 500 }, { successFalse: true }, { missingPreset: true }, { delayMs: number }
let mockState = {
  recording: false,
  recordTimecode: '00:00:00'
};
let mockJsonFailure = null; // null, { status: 500 }, { missingBoolean: true }, { malformed: true }
let mockPostControlDelayMs = 0;
let mockPostControlFailure = null; // null ou { error: string }
const recordedPostRequests = [];

function getMockSettings(scenario) {
  const base = {
    mode: 'Simple',
    recordDirectory: 'C:\\FreeMixRecordings',
    video: {
      outputWidth: 1920,
      outputHeight: 1080,
      fpsNumerator: 30,
      fpsDenominator: 1
    },
    capabilities: {
      recordingFormats: ['mkv', 'mp4', 'fragmented_mp4', 'hybrid_mp4', 'mov', 'fragmented_mov', 'hybrid_mov'],
      simpleEncoders: [
        { id: 'x264', nativeId: 'obs_x264', codec: 'h264', label: 'x264 Software Encoder' },
        { id: 'nvenc', nativeId: 'obs_nvenc_h264_tex', codec: 'h264', label: 'NVIDIA NVENC H.264' },
        { id: 'qsv', nativeId: 'obs_qsv11_v2', codec: 'h264', label: 'Intel QuickSync H.264' }
      ]
    },
    values: {
      RecFormat2: 'mkv',
      RecQuality: 'HQ',
      RecEncoder: 'x264'
    }
  };

  if (scenario === 'unsupported_encoder') {
    base.values.RecEncoder = 'custom_prores_hardware';
  } else if (scenario === 'advanced') {
    base.mode = 'Advanced';
  }
  return base;
}

// -------------------------------------------------------------
// Servidor HTTP Local (Loopback Porta 0)
// -------------------------------------------------------------
const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  if (pathname === '/test-harness.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>FreeMix Mesa Test Harness</title>
  <style>
    html, body { margin: 0; padding: 0; width: 700px; height: 540px; overflow: hidden; background: #000; }
    iframe { border: none; width: 700px; height: 540px; display: block; }
  </style>
</head>
<body>
  <iframe id="gravar-frame" src="/gravar"></iframe>
  <script>
    window.receivedCloseMessages = [];
    window.addEventListener('message', (ev) => {
      if (ev.origin === location.origin) {
        window.receivedCloseMessages.push(ev.data);
      }
    });
  </script>
</body>
</html>`);
    return;
  }

  if (pathname === '/gravar' || pathname === '/DRAFT-gravar.html' || pathname === '/DRAFT-gravar-r2.html' || pathname === '/DRAFT-gravar-r3.html') {
    const content = fs.readFileSync(candidateHtml, 'utf8');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(content);
    return;
  }

  if (pathname === '/DRAFT-gravar.js' || pathname === '/DRAFT-gravar-r2.js' || pathname === '/DRAFT-gravar-r3.js' || pathname === '/gravar.js') {
    const content = fs.readFileSync(candidateJs, 'utf8');
    res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
    res.end(content);
    return;
  }

  if (pathname === '/vmix-dialogo.css') {
    const content = fs.existsSync(candidateCss) ? fs.readFileSync(candidateCss, 'utf8') : '/* fallback css */';
    res.writeHead(200, { 'Content-Type': 'text/css; charset=utf-8' });
    res.end(content);
    return;
  }

  if (pathname === '/controle.js') {
    res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
    res.end('// mock controle.js\nwindow.FreeMixRemote = null;');
    return;
  }

  if (pathname === '/api/settings' && req.method === 'GET') {
    const respond = () => {
      if (mockSettingsFailure) {
        if (mockSettingsFailure.status === 500) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Erro interno simulado em settings' }));
          return;
        }
        if (mockSettingsFailure.successFalse) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Falha simulada no motor' }));
          return;
        }
        if (mockSettingsFailure.missingPreset) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, settings: getMockSettings(mockSettingsScenario) }));
          return;
        }
      }
      const data = {
        success: true,
        preset: mockActivePreset,
        settings: getMockSettings(mockSettingsScenario)
      };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    };
    if (mockSettingsFailure && mockSettingsFailure.delayMs) {
      setTimeout(respond, mockSettingsFailure.delayMs);
    } else {
      respond();
    }
    return;
  }

  if (pathname === '/api/json' && req.method === 'GET') {
    if (mockJsonFailure) {
      if (mockJsonFailure.status === 500) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Erro interno simulado em json' }));
        return;
      }
      if (mockJsonFailure.missingBoolean) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ recording: 'true_string_invalid' }));
        return;
      }
      if (mockJsonFailure.malformed) {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('invalid-json-payload');
        return;
      }
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(mockState));
    return;
  }

  if (pathname === '/api/control' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      let parsed = {};
      try { parsed = JSON.parse(body); } catch (_) {}
      recordedPostRequests.push(parsed);

      const respond = () => {
        if (mockPostControlFailure) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: mockPostControlFailure.error }));
          return;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          settings: getMockSettings(mockSettingsScenario)
        }));
      };

      if (mockPostControlDelayMs > 0) {
        setTimeout(respond, mockPostControlDelayMs);
      } else {
        respond();
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

// -------------------------------------------------------------
// Cliente CDP Minimalista sobre WebSocket
// -------------------------------------------------------------
class CdpSession {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.idCounter = 0;
    this.pending = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new globalThis.WebSocket(this.wsUrl);
      const timer = setTimeout(() => reject(new Error('CDP WebSocket connect timeout')), 8000);
      this.ws.onopen = () => {
        clearTimeout(timer);
        resolve();
      };
      this.ws.onerror = err => {
        clearTimeout(timer);
        reject(err);
      };
      this.ws.onmessage = evt => {
        const msg = JSON.parse(evt.data);
        if (msg.id && this.pending.has(msg.id)) {
          const { res, rej } = this.pending.get(msg.id);
          this.pending.delete(msg.id);
          if (msg.error) rej(new Error(msg.error.message || JSON.stringify(msg.error)));
          else res(msg.result);
        }
      };
    });
  }

  async send(method, params = {}, timeoutMs = 8000) {
    const id = ++this.idCounter;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP call ${method} timeout (${timeoutMs}ms)`));
      }, timeoutMs);
      this.pending.set(id, {
        res: val => { clearTimeout(timer); resolve(val); },
        rej: err => { clearTimeout(timer); reject(err); }
      });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression, timeoutMs = 8000) {
    const wrapped = `(() => {\n${expression}\n})()`;
    const res = await this.send('Runtime.evaluate', {
      expression: wrapped,
      returnByValue: true,
      awaitPromise: true
    }, timeoutMs);
    if (res.exceptionDetails) {
      const desc = res.exceptionDetails.exception?.description || res.exceptionDetails.text;
      throw new Error(`CDP Eval Exception: ${desc}`);
    }
    return res.result?.value;
  }

  close() {
    try { if (this.ws) this.ws.close(); } catch (_) {}
  }
}

// -------------------------------------------------------------
// Fluxo Principal com Timeout Global Finito (240s)
// -------------------------------------------------------------
const globalTimeout = setTimeout(() => {
  console.error('[ERRO FATAL] Timeout global de 240s atingido no runner.');
  process.exit(1);
}, 240000);

async function run() {
  let serverStarted = false;
  let serverPort = null;
  let browserCdp = null;
  let pageCdp = null;
  let edgeChild = null;
  let profileDir = null;
  let mainBrowserPid = null;
  let exitObserved = false;
  let cdpPort = null;

  try {
    const httpPort = await freePort();
    cdpPort = await freePort();

    await new Promise(resolve => server.listen(httpPort, '127.0.0.1', resolve));
    serverStarted = true;
    serverPort = httpPort;
    console.log(`[INFO] Servidor Mock HTTP ouvindo em http://127.0.0.1:${serverPort}`);

    const edgePathCandidates = [
      'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
      'C:/Program Files/Microsoft/Edge/Application/msedge.exe'
    ];
    const edgeBinary = edgePathCandidates.find(p => fs.existsSync(p));
    if (!edgeBinary) {
      throw new Error('Executável do Microsoft Edge não encontrado nos caminhos padrão.');
    }

    profileDir = path.join(ownDir, `FreeMix-QA-Profile-Recording-r6-${Date.now()}`);
    fs.mkdirSync(profileDir, { recursive: true });
    receipt.browserProfilePreserved = profileDir;

    // Esqueleto literal comprovado do Externo R1: porta pré-alocada e stdio ignore
    const edgeArgs = [
      '--headless=new',
      `--remote-debugging-port=${cdpPort}`,
      `--user-data-dir=${profileDir}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      '--disable-sync',
      '--window-size=700,540',
      'about:blank'
    ];

    edgeChild = spawn(edgeBinary, edgeArgs, { windowsHide: true, stdio: 'ignore' });

    // Polling resiliente do endpoint nativo /json/version (50x150ms)
    let versionInfo = null;
    for (let i = 0; i < 50 && !versionInfo; i++) {
      try {
        const resp = await fetch(`http://127.0.0.1:${cdpPort}/json/version`, { signal: AbortSignal.timeout(2000) });
        if (resp.ok) {
          versionInfo = await resp.json();
        }
      } catch (_) {
        await new Promise(r => setTimeout(r, 150));
      }
    }

    if (!versionInfo?.webSocketDebuggerUrl) {
      throw new Error(`Falha ao obter WebSocket do CDP do Edge via http://127.0.0.1:${cdpPort}/json/version`);
    }

    // Scope Guard 1: Validação da URL do WebSocket
    const parsedWsUrl = new URL(versionInfo.webSocketDebuggerUrl);
    if (parsedWsUrl.protocol !== 'ws:' || parsedWsUrl.hostname !== '127.0.0.1' || Number(parsedWsUrl.port) !== cdpPort) {
      throw new Error(`Scope Guard: Endpoint CDP retornado (${versionInfo.webSocketDebuggerUrl}) diverge do loopback 127.0.0.1:${cdpPort}`);
    }
    if (!/^\/devtools\/browser\/[a-zA-Z0-9-]+$/.test(parsedWsUrl.pathname)) {
      throw new Error(`Scope Guard: Path do WebSocket inválido: ${parsedWsUrl.pathname}`);
    }

    // Scope Guard 2: Validação de ownership CIM do processo em escuta (msedge.exe + perfil próprio)
    const connJson = await execPwsh(`
      try {
        $c = Get-NetTCPConnection -LocalAddress '127.0.0.1' -LocalPort ${cdpPort} -State Listen -ErrorAction Stop
        if ($c) {
          $owning = @($c | Select-Object -ExpandProperty OwningProcess)
          @{ status = 'OK'; owningPids = $owning } | ConvertTo-Json -Compress
        } else {
          @{ status = 'EMPTY' } | ConvertTo-Json -Compress
        }
      } catch {
        @{ status = 'ERROR'; error = $_.Exception.Message } | ConvertTo-Json -Compress
      }
    `);
    const connInfo = JSON.parse(connJson || '{}');
    if (connInfo.status !== 'OK' || !Array.isArray(connInfo.owningPids) || !connInfo.owningPids.length) {
      throw new Error(`Scope Guard: Falha ao verificar processo em escuta na porta CDP ${cdpPort}: ${connInfo.error || 'sem escuta'}`);
    }

    const candidatePid = connInfo.owningPids[0];
    const procCheckJson = await execPwsh(`
      try {
        $p = Get-CimInstance Win32_Process -Filter "ProcessId = ${candidatePid}" -ErrorAction Stop
        if ($p) {
          @{
            status = 'OK';
            name = [string]$p.Name;
            exe = [string]$p.ExecutablePath;
            cmd = [string]$p.CommandLine
          } | ConvertTo-Json -Compress
        } else {
          @{ status = 'NOT_FOUND' } | ConvertTo-Json -Compress
        }
      } catch {
        @{ status = 'ERROR'; error = $_.Exception.Message } | ConvertTo-Json -Compress
      }
    `);
    const procInfo = JSON.parse(procCheckJson || '{}');
    if (procInfo.status !== 'OK' || procInfo.name.toLowerCase() !== 'msedge.exe') {
      throw new Error(`Scope Guard: Processo escutando na porta CDP ${cdpPort} (PID ${candidatePid}) não é msedge.exe: ${procInfo.name}`);
    }
    const cmd = procInfo.cmd || '';
    if (!cmd.includes('--headless=new') || !cmd.includes(path.basename(profileDir))) {
      throw new Error(`Scope Guard: Processo PID ${candidatePid} não pertence ao perfil próprio esperado (${path.basename(profileDir)})`);
    }

    mainBrowserPid = candidatePid;
    console.log(`[INFO] Scope Guard confirmado: PID principal do Edge ${mainBrowserPid} em escuta na porta ${cdpPort}.`);

    browserCdp = new CdpSession(versionInfo.webSocketDebuggerUrl);
    await browserCdp.connect();

  // Obter página ou criar novo target com viewport exato 700x540
  const targets = await browserCdp.send('Target.getTargets');
  let pageTarget = targets.targetInfos.find(t => t.type === 'page');
  if (!pageTarget) {
    const created = await browserCdp.send('Target.createTarget', { url: 'about:blank' });
    pageTarget = { targetId: created.targetId };
  }

  const wsPageUrl = `ws://127.0.0.1:${cdpPort}/devtools/page/${pageTarget.targetId}`;
  const pageCdp = new CdpSession(wsPageUrl);
  await pageCdp.connect();

  await pageCdp.send('Page.enable');
  await pageCdp.send('Runtime.enable');
  await pageCdp.send('Emulation.setDeviceMetricsOverride', {
    width: 700,
    height: 540,
    deviceScaleFactor: 1,
    mobile: false
  });

  // Helper para captura de PNG
  async function takeScreenshot(name) {
    try {
      const shot = await pageCdp.send('Page.captureScreenshot', { format: 'png' });
      const filename = `${name}.png`;
      const fullPath = path.join(ownDir, filename);
      fs.writeFileSync(fullPath, Buffer.from(shot.data, 'base64'));
      receipt.screenshots.push(filename);
      console.log(`[SCREENSHOT] Capturado ${filename}`);
    } catch (e) {
      console.warn(`[SCREENSHOT AVISO] Falha ao capturar ${name}: ${e.message}`);
    }
  }

  // Helper para recarregar o iframe do harness
  async function loadHarness() {
    await pageCdp.eval(`
      const f = document.getElementById('gravar-frame');
      if (f) {
        f.src = '/gravar?_t=' + Date.now();
      }
    `);
    // aguarda 600ms para parsing e carga inicial do DOM interno
    await new Promise(r => setTimeout(r, 600));
  }

  // -------------------------------------------------------------
  // EXECUÇÃO DOS GATES DE TESTE REAL DOM
  // -------------------------------------------------------------

  // Gate 0: Inicialização do Harness e Zero POST no Startup
  await pageCdp.send('Page.navigate', { url: `http://127.0.0.1:${serverPort}/test-harness.html` });
  await new Promise(r => setTimeout(r, 800));

  assertTest('GATE_0_STARTUP_ZERO_POST', 'Abertura do diálogo não deve disparar nenhum POST para o servidor', recordedPostRequests.length === 0);
  await takeScreenshot('screenshot-gravar-startup-r6-700x540');

  // Gate 1: Inspeção de Geometria e Preservação de Dimensões 700x540
  const geom = await pageCdp.eval(`
    const f = document.getElementById('gravar-frame');
    const doc = f.contentDocument;
    const win = doc.querySelector('.vrec-window');
    return {
      windowWidth: win.offsetWidth,
      windowHeight: win.offsetHeight,
      bodyScrollWidth: doc.body.scrollWidth,
      bodyScrollHeight: doc.body.scrollHeight
    };
  `);
  assertTest('GATE_1_GEOMETRY_700X540', 'Janela segue estritamente 700x540 sem estouro de rolagem horizontal',
    geom.windowWidth === 700 && geom.windowHeight === 540 && geom.bodyScrollWidth <= 700);

  // Gate 2: Formatos Reais na Barra Lateral e Resumo de Vídeo
  const uiState = await pageCdp.eval(`
    const doc = document.getElementById('gravar-frame').contentDocument;
    const formatButtons = Array.from(doc.querySelectorAll('.vrec-format-btn')).map(b => b.dataset.format);
    const activeFormat = doc.querySelector('.vrec-format-btn.active')?.dataset.format;
    const dirVal = doc.getElementById('rec-directory').value;
    const qualityVal = doc.getElementById('rec-quality').value;
    const resText = doc.getElementById('info-resolution').textContent;
    const fpsText = doc.getElementById('info-fps').textContent;
    return { formatButtons, activeFormat, dirVal, qualityVal, resText, fpsText };
  `);

  const expectedFormats = ['mkv', 'mp4', 'fragmented_mp4', 'hybrid_mp4', 'mov', 'fragmented_mov', 'hybrid_mov'];
  const formatsMatch = JSON.stringify(uiState.formatButtons) === JSON.stringify(expectedFormats);
  assertTest('GATE_2_FORMATS_CAPABILITIES', 'Formatos da barra lateral correspondem exatamente a capabilities.recordingFormats', formatsMatch);
  assertTest('GATE_2_ACTIVE_FORMAT_DEFAULT', 'Formato ativo inicial é MKV', uiState.activeFormat === 'mkv');
  assertTest('GATE_2_INPUT_VALUES', 'Diretório e qualidade preenchidos com valores vigentes',
    uiState.dirVal === 'C:\\FreeMixRecordings' && uiState.qualityVal === 'HQ');
  assertTest('GATE_2_VIDEO_SUMMARY_READONLY', 'Resumo de vídeo exibe resolução e FPS do projeto',
    uiState.resText.includes('1920x1080') && uiState.fpsText.includes('30'));

  // Gate 3: Preservação de Encoder Indisponível sem Fallback Automático
  mockSettingsScenario = 'unsupported_encoder';
  await loadHarness();

  const missingEncoderState = await pageCdp.eval(`
    const doc = document.getElementById('gravar-frame').contentDocument;
    const sel = doc.getElementById('rec-encoder');
    const selectedOpt = sel.options[sel.selectedIndex];
    return {
      value: sel.value,
      text: selectedOpt.textContent,
      disabled: selectedOpt.disabled
    };
  `);
  assertTest('GATE_3_UNSUPPORTED_ENCODER_PRESERVED', 'Codificador indisponível no hardware é mantido como opção selecionada e desabilitada',
    missingEncoderState.value === 'custom_prores_hardware' &&
    missingEncoderState.disabled === true &&
    missingEncoderState.text.includes('Indisponível'));

  // Gate 4: Modo Avançado (mode === 'Advanced') - Bloqueio e Banner
  mockSettingsScenario = 'advanced';
  await loadHarness();

  const advancedState = await pageCdp.eval(`
    const doc = document.getElementById('gravar-frame').contentDocument;
    const banner = doc.getElementById('adv-banner');
    const isVisible = banner.classList.contains('visible');
    const dirDisabled = doc.getElementById('rec-directory').disabled;
    const encoderDisabled = doc.getElementById('rec-encoder').disabled;
    const qualityDisabled = doc.getElementById('rec-quality').disabled;
    const saveDisabled = doc.getElementById('btn-save').disabled;
    const linkHref = doc.getElementById('link-advanced-banner')?.getAttribute('href');
    return { isVisible, dirDisabled, encoderDisabled, qualityDisabled, saveDisabled, linkHref };
  `);
  assertTest('GATE_4_ADVANCED_BANNER_VISIBLE', 'Alerta informativo exibido no modo avançado', advancedState.isVisible);
  assertTest('GATE_4_ADVANCED_INPUTS_LOCKED', 'Todos os campos de edição simples bloqueados no modo avançado',
    advancedState.dirDisabled && advancedState.encoderDisabled && advancedState.qualityDisabled && advancedState.saveDisabled);
  assertTest('GATE_4_ADVANCED_LINK_CORRECT', 'Link aponta para o editor completo de gravação',
    advancedState.linkHref === '/settings?category=recording&context=recording');
  await takeScreenshot('screenshot-gravar-advanced-mode-r6');

  // Gate 5: Monitoramento Ativo de Gravação em Tempo Real (Badge e Bloqueio)
  mockSettingsScenario = 'standard';
  mockState = { recording: true, recordTimecode: '00:15:42' };
  await loadHarness();

  const recActiveState = await pageCdp.eval(`
    const doc = document.getElementById('gravar-frame').contentDocument;
    const badge = doc.getElementById('rec-badge');
    const saveBtn = doc.getElementById('btn-save');
    return {
      badgeText: badge.textContent,
      hasActiveClass: badge.classList.contains('active'),
      saveDisabled: saveBtn.disabled
    };
  `);
  assertTest('GATE_5_RECORDING_ACTIVE_BADGE', 'Badge reflete timecode de gravação ativa com animação',
    recActiveState.badgeText.includes('GRAVANDO 00:15:42') && recActiveState.hasActiveClass);
  assertTest('GATE_5_RECORDING_ACTIVE_SAVE_LOCKED', 'Botão OK/Salvar desabilitado durante gravação ativa', recActiveState.saveDisabled);
  await takeScreenshot('screenshot-gravar-active-guard-r6');

  // Gate 6: Validação Prévia Impede Envio de Diretório Vazio
  mockState = { recording: false, recordTimecode: '00:00:00' };
  await loadHarness();

  const prePostCount = recordedPostRequests.length;
  await pageCdp.eval(`
    const doc = document.getElementById('gravar-frame').contentDocument;
    doc.getElementById('rec-directory').value = '   ';
    doc.getElementById('btn-save').click();
  `);
  await new Promise(r => setTimeout(r, 200));

  const validationState = await pageCdp.eval(`
    const doc = document.getElementById('gravar-frame').contentDocument;
    return {
      statusText: doc.getElementById('status-msg').textContent,
      postCount: ${recordedPostRequests.length}
    };
  `);
  assertTest('GATE_6_EMPTY_DIR_VALIDATION', 'Diretório em branco é bloqueado localmente sem disparar POST',
    validationState.statusText.includes('Informe a pasta') && recordedPostRequests.length === prePostCount);

  // Gate 7: Bloqueio Total Durante ACK Lento (Slow ACK 1200ms)
  mockPostControlDelayMs = 1200;
  await pageCdp.eval(`
    const doc = document.getElementById('gravar-frame').contentDocument;
    doc.getElementById('rec-directory').value = 'D:\\\\FreeMixStorage';
    doc.querySelector('.vrec-format-btn[data-format=\"fragmented_mp4\"]').click();
    doc.getElementById('rec-quality').value = 'Lossless';
    doc.getElementById('btn-save').click();
  `);
  await new Promise(r => setTimeout(r, 200)); // no meio do trânsito da requisição

  const inFlightBusyState = await pageCdp.eval(`
    const doc = document.getElementById('gravar-frame').contentDocument;
    return {
      dirDisabled: doc.getElementById('rec-directory').disabled,
      qualityDisabled: doc.getElementById('rec-quality').disabled,
      saveDisabled: doc.getElementById('btn-save').disabled,
      cancelDisabled: doc.getElementById('btn-cancel').disabled,
      advDisabled: doc.getElementById('btn-advanced').disabled,
      formatBtnsDisabled: Array.from(doc.querySelectorAll('.vrec-format-btn')).every(b => b.disabled)
    };
  `);
  assertTest('GATE_7_SLOW_ACK_BUSY_LOCK', 'Todos os campos, botões de formato e ações são bloqueados durante requisição em trânsito',
    inFlightBusyState.dirDisabled && inFlightBusyState.qualityDisabled && inFlightBusyState.saveDisabled &&
    inFlightBusyState.cancelDisabled && inFlightBusyState.advDisabled && inFlightBusyState.formatBtnsDisabled);

  // Aguarda término da resposta do mock server
  await new Promise(r => setTimeout(r, 1400));
  mockPostControlDelayMs = 0;

  // Gate 8: Sucesso no POST com Payload Correto e Fechamento via postMessage
  const lastPost = recordedPostRequests[recordedPostRequests.length - 1];
  const payloadCorrect = lastPost &&
    lastPost.action === 'settings_apply' &&
    lastPost.category === 'recording' &&
    lastPost.directory === 'D:\\FreeMixStorage' &&
    lastPost.format === 'fragmented_mp4' &&
    lastPost.quality === 'Lossless';

  assertTest('GATE_8_POST_PAYLOAD_CONTRACT', 'Payload POST /api/control respeita estritamente o contrato plano do backend', payloadCorrect);

  const closeMessages = await pageCdp.eval(`return window.receivedCloseMessages;`);
  const receivedClose = closeMessages.some(m => m && m.freemixCloseSettings === true);
  assertTest('GATE_8_POST_SUCCESS_CLOSES_DIALOG', 'Sucesso do botão OK fecha o diálogo emitindo postMessage({ freemixCloseSettings: true })', receivedClose);

  // Gate 9: Falha no ACK Preserva Escolhas do Usuário e Não Fecha
  mockPostControlFailure = { error: 'Motor recusou permissão no caminho D:\\\\Restricted' };
  await loadHarness();

  // Limpa mensagens anteriores
  await pageCdp.eval(`window.receivedCloseMessages = [];`);

  await pageCdp.eval(`
    const doc = document.getElementById('gravar-frame').contentDocument;
    doc.getElementById('rec-directory').value = 'D:\\\\Restricted';
    doc.getElementById('btn-save').click();
  `);
  await new Promise(r => setTimeout(r, 400));

  const errorResult = await pageCdp.eval(`
    const doc = document.getElementById('gravar-frame').contentDocument;
    return {
      statusText: doc.getElementById('status-msg').textContent,
      dirValue: doc.getElementById('rec-directory').value,
      closeCount: window.receivedCloseMessages.length
    };
  `);
  assertTest('GATE_9_ERROR_ACK_PRESERVES_DRAFT', 'Em caso de erro no servidor, o diálogo permanece aberto e preserva o valor digitado',
    errorResult.closeCount === 0 &&
    errorResult.dirValue === 'D:\\Restricted' &&
    errorResult.statusText.includes('Motor recusou permissão'));
  mockPostControlFailure = null;

  // Gate 10: Botão Cancelar Emite Fechamento sem Disparar POST
  const postCountBeforeCancel = recordedPostRequests.length;
  await pageCdp.eval(`
    const doc = document.getElementById('gravar-frame').contentDocument;
    doc.getElementById('btn-cancel').click();
  `);
  await new Promise(r => setTimeout(r, 200));

  const cancelResult = await pageCdp.eval(`return window.receivedCloseMessages;`);
  const cancelClosed = cancelResult.some(m => m && m.freemixCloseSettings === true);
  assertTest('GATE_10_CANCEL_CLOSES_WITHOUT_POST', 'Botão Cancelar emite postMessage de fechamento com zero requisições POST',
    cancelClosed && recordedPostRequests.length === postCountBeforeCancel);

  // Gate 11: Unknown GET state (/api/json HTTP 500 ou missing boolean) -> Zero POST e Preservação de Draft
  mockJsonFailure = { status: 500 };
  await loadHarness();
  const postCountBeforeUnknownState = recordedPostRequests.length;
  await pageCdp.eval(`
    const doc = document.getElementById('gravar-frame').contentDocument;
    doc.getElementById('rec-directory').value = 'D:\\\\State500Draft';
    doc.getElementById('btn-save').click();
  `);
  await new Promise(r => setTimeout(r, 300));
  const state500Result = await pageCdp.eval(`
    const doc = document.getElementById('gravar-frame').contentDocument;
    const st = doc.getElementById('status-msg');
    return {
      statusText: st ? st.textContent : '',
      statusClass: st ? st.className : '',
      dirVal: doc.getElementById('rec-directory')?.value ?? '',
      saveDisabled: doc.getElementById('btn-save')?.disabled ?? false,
      formatVal: doc.querySelector('.vrec-format-btn.vd-on')?.getAttribute('data-fmt') ?? '',
      encoderVal: doc.getElementById('rec-encoder')?.value ?? '',
      qualityVal: doc.getElementById('rec-quality')?.value ?? ''
    };
  `);
  const postCountAfterUnknownState = recordedPostRequests.length;
  assertTest('GATE_11_UNKNOWN_STATE_HTTP500_BLOCKS_POST', 'Falha HTTP 500 em /api/json aborta salvamento com erro, zero POST e draft preservado',
    recordedPostRequests.length === postCountBeforeUnknownState &&
    state500Result.dirVal === 'D:\\State500Draft' &&
    state500Result.statusText.includes('Não foi possível verificar o estado'),
    JSON.stringify({
      postBefore: postCountBeforeUnknownState,
      postAfter: postCountAfterUnknownState,
      postDelta: postCountAfterUnknownState - postCountBeforeUnknownState,
      state500Result,
      operands: {
        zeroPost: postCountAfterUnknownState === postCountBeforeUnknownState,
        dirMatched: state500Result.dirVal === 'D:\\State500Draft',
        statusMatched: state500Result.statusText.includes('Não foi possível verificar o estado')
      }
    }));

  mockJsonFailure = { missingBoolean: true };
  await pageCdp.eval(`
    const doc = document.getElementById('gravar-frame').contentDocument;
    doc.getElementById('btn-save').click();
  `);
  await new Promise(r => setTimeout(r, 300));
  const stateMissingBoolResult = await pageCdp.eval(`
    const doc = document.getElementById('gravar-frame').contentDocument;
    return {
      statusText: doc.getElementById('status-msg').textContent
    };
  `);
  assertTest('GATE_11_UNKNOWN_STATE_MISSING_BOOL_BLOCKS_POST', 'Resposta sem boolean explícito em recording aborta salvamento com zero POST',
    recordedPostRequests.length === postCountBeforeUnknownState &&
    stateMissingBoolResult.statusText.includes('Não foi possível verificar o estado'));
  mockJsonFailure = null;

  // Gate 12A: Falha HTTP 500 ao abrir /api/settings exibe erro na carga e impede POST mutante ao salvar
  mockSettingsFailure = { status: 500 };
  await loadHarness();
  const openSettings500Result = await pageCdp.eval(`
    const doc = document.getElementById('gravar-frame').contentDocument;
    const st = doc.getElementById('status-msg');
    return {
      statusText: st ? st.textContent : '',
      statusClass: st ? st.className : ''
    };
  `);
  const postCountBeforeOpenSettingsFail = recordedPostRequests.length;
  await pageCdp.eval(`
    const doc = document.getElementById('gravar-frame').contentDocument;
    doc.getElementById('btn-save').click();
  `);
  await new Promise(r => setTimeout(r, 300));
  const postCountAfterOpenSettingsFail = recordedPostRequests.length;
  assertTest('GATE_12_OPEN_SETTINGS_HTTP500_BLOCKS_SAVE', 'Falha HTTP 500 ao carregar /api/settings exibe erro de carga e impede POST ao salvar',
    postCountAfterOpenSettingsFail === postCountBeforeOpenSettingsFail &&
    openSettings500Result.statusText.includes('Falha HTTP 500 ao carregar configurações'),
    JSON.stringify({
      postBefore: postCountBeforeOpenSettingsFail,
      postAfter: postCountAfterOpenSettingsFail,
      postDelta: postCountAfterOpenSettingsFail - postCountBeforeOpenSettingsFail,
      openSettings500Result,
      operands: {
        zeroPost: postCountAfterOpenSettingsFail === postCountBeforeOpenSettingsFail,
        openErrorMatched: openSettings500Result.statusText.includes('Falha HTTP 500 ao carregar configurações')
      }
    }));

  // Gate 12B: Falha HTTP 500 na revalidação de perfil durante Save aborta com zero POST e draft retido
  mockSettingsFailure = null;
  await loadHarness();
  const postCountBeforeSettingsFail = recordedPostRequests.length;
  mockSettingsFailure = { status: 500 };
  await pageCdp.eval(`
    const doc = document.getElementById('gravar-frame').contentDocument;
    doc.getElementById('rec-directory').value = 'D:\\\\SettingsFailDraft';
    doc.getElementById('btn-save').click();
  `);
  await new Promise(r => setTimeout(r, 300));
  const settings500Result = await pageCdp.eval(`
    const doc = document.getElementById('gravar-frame').contentDocument;
    const st = doc.getElementById('status-msg');
    return {
      statusText: st ? st.textContent : '',
      statusClass: st ? st.className : '',
      dirVal: doc.getElementById('rec-directory')?.value ?? '',
      saveDisabled: doc.getElementById('btn-save')?.disabled ?? false,
      formatVal: doc.querySelector('.vrec-format-btn.vd-on')?.getAttribute('data-fmt') ?? '',
      encoderVal: doc.getElementById('rec-encoder')?.value ?? '',
      qualityVal: doc.getElementById('rec-quality')?.value ?? ''
    };
  `);
  const postCountAfterSettings500 = recordedPostRequests.length;
  assertTest('GATE_12_UNKNOWN_SETTINGS_HTTP500_BLOCKS_POST', 'Falha HTTP 500 em /api/settings aborta salvamento com zero POST e draft retido',
    postCountAfterSettings500 === postCountBeforeSettingsFail &&
    settings500Result.dirVal === 'D:\\SettingsFailDraft' &&
    settings500Result.statusText.includes('Falha HTTP 500 ao revalidar perfil'),
    JSON.stringify({
      postBefore: postCountBeforeSettingsFail,
      postAfter: postCountAfterSettings500,
      postDelta: postCountAfterSettings500 - postCountBeforeSettingsFail,
      settings500Result,
      operands: {
        zeroPost: postCountAfterSettings500 === postCountBeforeSettingsFail,
        dirMatched: settings500Result.dirVal === 'D:\\SettingsFailDraft',
        statusMatched: settings500Result.statusText.includes('Falha HTTP 500 ao revalidar perfil')
      }
    }));

  // Gate 12C: Resposta sem preset em /api/settings cancela salvamento com zero POST sob harness populado
  mockSettingsFailure = null;
  await loadHarness();
  const postCountBeforeMissingPreset = recordedPostRequests.length;
  mockSettingsFailure = { missingPreset: true };
  await pageCdp.eval(`
    const doc = document.getElementById('gravar-frame').contentDocument;
    doc.getElementById('btn-save').click();
  `);
  await new Promise(r => setTimeout(r, 300));
  const settingsMissingPresetResult = await pageCdp.eval(`
    const doc = document.getElementById('gravar-frame').contentDocument;
    const st = doc.getElementById('status-msg');
    return {
      statusText: st ? st.textContent : '',
      statusClass: st ? st.className : '',
      dirVal: doc.getElementById('rec-directory')?.value ?? '',
      saveDisabled: doc.getElementById('btn-save')?.disabled ?? false,
      formatVal: doc.querySelector('.vrec-format-btn.vd-on')?.getAttribute('data-fmt') ?? '',
      encoderVal: doc.getElementById('rec-encoder')?.value ?? '',
      qualityVal: doc.getElementById('rec-quality')?.value ?? ''
    };
  `);
  const postCountAfterMissingPreset = recordedPostRequests.length;
  assertTest('GATE_12_SETTINGS_MISSING_PRESET_BLOCKS_POST', 'Resposta sem campo preset em /api/settings cancela salvamento com zero POST',
    postCountAfterMissingPreset === postCountBeforeMissingPreset &&
    settingsMissingPresetResult.statusText.includes('Resposta de configurações malformada'),
    JSON.stringify({
      postBefore: postCountBeforeMissingPreset,
      postAfter: postCountAfterMissingPreset,
      postDelta: postCountAfterMissingPreset - postCountBeforeMissingPreset,
      settingsMissingPresetResult,
      operands: {
        zeroPost: postCountAfterMissingPreset === postCountBeforeMissingPreset,
        statusMatched: settingsMissingPresetResult.statusText.includes('Resposta de configurações malformada')
      }
    }));
  mockSettingsFailure = null;

  // Gate 13: Stale Preset Lockout (Troca de perfil após carga inicial)
  await loadHarness();
  const postCountBeforeStalePreset = recordedPostRequests.length;
  mockActivePreset = 'PRESET_B_EXTERNAL';
  await pageCdp.eval(`
    const doc = document.getElementById('gravar-frame').contentDocument;
    doc.getElementById('rec-directory').value = 'D:\\\\StalePresetDraft';
    doc.getElementById('btn-save').click();
  `);
  await new Promise(r => setTimeout(r, 300));
  const stalePresetResult = await pageCdp.eval(`
    const doc = document.getElementById('gravar-frame').contentDocument;
    const st = doc.getElementById('status-msg');
    return {
      statusText: st ? st.textContent : '',
      statusClass: st ? st.className : '',
      dirVal: doc.getElementById('rec-directory')?.value ?? '',
      saveDisabled: doc.getElementById('btn-save')?.disabled ?? false,
      formatVal: doc.querySelector('.vrec-format-btn.vd-on')?.getAttribute('data-fmt') ?? '',
      encoderVal: doc.getElementById('rec-encoder')?.value ?? '',
      qualityVal: doc.getElementById('rec-quality')?.value ?? ''
    };
  `);
  const postCountAfterStalePreset = recordedPostRequests.length;
  assertTest('GATE_13_STALE_PRESET_LOCKOUT', 'Divergência entre perfil ativo no backend e currentPreset aborta POST e sinaliza alteração',
    recordedPostRequests.length === postCountBeforeStalePreset &&
    stalePresetResult.dirVal === 'D:\\StalePresetDraft' &&
    stalePresetResult.statusText.includes('O perfil de produção foi alterado externamente'),
    JSON.stringify({
      postBefore: postCountBeforeStalePreset,
      postAfter: postCountAfterStalePreset,
      postDelta: postCountAfterStalePreset - postCountBeforeStalePreset,
      stalePresetResult,
      operands: {
        zeroPost: postCountAfterStalePreset === postCountBeforeStalePreset,
        dirMatched: stalePresetResult.dirVal === 'D:\\StalePresetDraft',
        statusMatched: stalePresetResult.statusText.includes('O perfil de produção foi alterado externamente')
      }
    }));
  mockActivePreset = 'QA_MOCK_PRESET';

  // Gate 14: Migração para Modo Avançado no momento do Save
  await loadHarness();
  const postCountBeforeAdvDrift = recordedPostRequests.length;
  mockSettingsScenario = 'advanced';
  await pageCdp.eval(`
    const doc = document.getElementById('gravar-frame').contentDocument;
    doc.getElementById('rec-directory').value = 'D:\\AdvDriftDraft';
    doc.getElementById('btn-save').click();
  `);
  await new Promise(r => setTimeout(r, 300));
  const advDriftResult = await pageCdp.eval(`
    const doc = document.getElementById('gravar-frame').contentDocument;
    return {
      statusText: doc.getElementById('status-msg').textContent,
      bannerVisible: doc.getElementById('adv-banner').classList.contains('visible'),
      dirVal: doc.getElementById('rec-directory').value
    };
  `);
  assertTest('GATE_14_MODE_ADVANCED_DRIFT_AT_SAVE', 'Mudança dinâmica para Modo Avançado impede conversão cega, ativa banner e preserva draft sem POST',
    recordedPostRequests.length === postCountBeforeAdvDrift &&
    advDriftResult.bannerVisible === true &&
    advDriftResult.statusText.includes('Modo Avançado no motor'));
  mockSettingsScenario = 'standard';

  // Gate 15: Concorrência de Clique Duplo em Pré-flight Lento
  mockSettingsFailure = { delayMs: 400 };
  await loadHarness();
  const postCountBeforeDblClick = recordedPostRequests.length;
  await pageCdp.eval(`
    const doc = document.getElementById('gravar-frame').contentDocument;
    doc.getElementById('rec-directory').value = 'D:\\DblClickValidDir';
    const saveBtn = doc.getElementById('btn-save');
    saveBtn.click();
    saveBtn.click();
  `);
  await new Promise(r => setTimeout(r, 900));
  const dblClickPosts = recordedPostRequests.length - postCountBeforeDblClick;
  assertTest('GATE_15_CONCURRENCY_DOUBLE_CLICK_PREVENTED', 'isBusy síncrono impede clique duplo concorrente no pré-flight (máximo 1 POST despachado)',
    dblClickPosts === 1);
  mockSettingsFailure = null;

  // Gate 16: Deadline POST 8000ms (ACK atrasado não fecha, não repete e retém rascunho)
  mockPostControlDelayMs = 9000;
  await loadHarness();
  await pageCdp.eval(`window.receivedCloseMessages = [];`);
  const postCountBeforeTimeout = recordedPostRequests.length;
  await pageCdp.eval(`
    const doc = document.getElementById('gravar-frame').contentDocument;
    doc.getElementById('rec-directory').value = 'D:\\\\TimeoutDraft';
    doc.getElementById('btn-save').click();
  `);
  // Aguarda expiração do AbortSignal.timeout(8000)
  console.log('[INFO] Aguardando deadline de 8000ms do POST /api/control...');
  await new Promise(r => setTimeout(r, 8600));
  mockPostControlDelayMs = 0;

  const timeoutResult = await pageCdp.eval(`
    const doc = document.getElementById('gravar-frame').contentDocument;
    const st = doc.getElementById('status-msg');
    return {
      statusText: st ? st.textContent : '',
      statusClass: st ? st.className : '',
      closeCount: window.receivedCloseMessages.length,
      dirVal: doc.getElementById('rec-directory')?.value ?? '',
      isBusyNow: doc.getElementById('btn-save')?.disabled ?? false,
      formatVal: doc.querySelector('.vrec-format-btn.vd-on')?.getAttribute('data-fmt') ?? '',
      encoderVal: doc.getElementById('rec-encoder')?.value ?? '',
      qualityVal: doc.getElementById('rec-quality')?.value ?? ''
    };
  `);
  const postCountAfterTimeout = recordedPostRequests.length;
  assertTest('GATE_16_POST_DEADLINE_8000MS_TIMEOUT', 'Timeout de 8000ms no POST não fecha diálogo, não realiza retry e retém parâmetros no formulário',
    timeoutResult.closeCount === 0 &&
    timeoutResult.dirVal === 'D:\\TimeoutDraft' &&
    (postCountAfterTimeout - postCountBeforeTimeout === 1) &&
    timeoutResult.statusText.length > 0,
    JSON.stringify({
      postBefore: postCountBeforeTimeout,
      postAfter: postCountAfterTimeout,
      postDelta: postCountAfterTimeout - postCountBeforeTimeout,
      timeoutResult,
      operands: {
        zeroClose: timeoutResult.closeCount === 0,
        dirMatched: timeoutResult.dirVal === 'D:\\TimeoutDraft',
        onePostDelta: (postCountAfterTimeout - postCountBeforeTimeout === 1),
        statusNonEmpty: timeoutResult.statusText.length > 0
      }
    }));

  } catch (err) {
    console.error('[ERRO NA EXECUÇÃO DO RUNNER]', err);
    assertTest('FATAL_RUNNER_EXCEPTION', 'Exceção não tratada durante execução', false, err.message);
  } finally {
    console.log('\n--- Finalização e Teardown Seguro ---');

    // 1. Encerramento cooperativo via CDP somente com sessão e ownership validados
    if (browserCdp && mainBrowserPid) {
      console.log('[INFO] Solicitando Browser.close cooperativo...');
      try {
        await browserCdp.send('Browser.close', {}, 5000);
      } catch (_) {}
    }

    if (pageCdp) { try { pageCdp.close(); } catch (_) {} }
    if (browserCdp) { try { browserCdp.close(); } catch (_) {} }

    // 2. Verificação CIM de ausência de processos msedge.exe no perfil (sem self-matching)
    if (profileDir) {
      const profileBase = path.basename(profileDir);
      const closeDeadline = Date.now() + 6000;
      let targetDead = false;
      let edgeCount = -1;

      while (Date.now() < closeDeadline) {
        const cimCheckJson = await execPwsh(`
          try {
            $target = ${mainBrowserPid ? `Get-CimInstance Win32_Process -Filter "ProcessId = ${mainBrowserPid}" -ErrorAction Stop` : '$null'}
            $targetDead = ($null -eq $target)
            $edgeProcs = Get-CimInstance Win32_Process -ErrorAction Stop | Where-Object { $_.Name -ieq 'msedge.exe' -and $_.CommandLine -like "*${profileBase}*" }
            $count = if ($null -ne $edgeProcs) { ($edgeProcs | Measure-Object).Count } else { 0 }
            @{
              status = 'OK';
              mainPidAbsent = [bool]$targetDead;
              edgeProfileCount = [int]$count
            } | ConvertTo-Json -Compress
          } catch {
            @{ status = 'ERROR'; error = $_.Exception.Message } | ConvertTo-Json -Compress
          }
        `).catch(() => '{}');

        const cimData = JSON.parse(cimCheckJson || '{}');
        if (cimData.status === 'OK') {
          targetDead = cimData.mainPidAbsent;
          edgeCount = cimData.edgeProfileCount;
          if (targetDead && edgeCount === 0) {
            exitObserved = true;
            break;
          }
        }
        await new Promise(r => setTimeout(r, 200));
      }

      receipt.browserExitObserved = exitObserved;
      receipt.browserMainPidAbsent = targetDead;
      receipt.browserEdgeProfileCount = edgeCount;
      assertTest('GATE_CLEANUP_EXIT_OBSERVED', 'Processos msedge.exe associados ao perfil encerraram cooperativamente', exitObserved);
    }

    // 3. Revalidação de PINs Pós-Execução
    receipt.pinsAfter = {
      html: { path: candidateHtml, sha: sha256File(candidateHtml) },
      js: { path: candidateJs, sha: sha256File(candidateJs) },
      css: { path: candidateCss, sha: sha256File(candidateCss) }
    };
    const pinsUnchanged = (receipt.pinsBefore.html.sha === receipt.pinsAfter.html.sha) &&
                          (receipt.pinsBefore.js.sha === receipt.pinsAfter.js.sha) &&
                          (receipt.pinsBefore.css.sha === receipt.pinsAfter.css.sha);
    assertTest('GATE_CLEANUP_PINS_UNCHANGED', 'Arquivos de origem mantiveram hashes SHA-256 inalterados após o teste', pinsUnchanged);

    // 4. Fechamento do Servidor HTTP Local
    if (serverStarted) {
      try { await new Promise(r => server.close(r)); } catch (_) {}
    }

    // 5. Gravação incondicional do Receipt JSON Oficial (receipt4)
    receipt.finishedAt = new Date().toISOString();
    const receiptPath = path.join(ownDir, 'receipt-test-gravar-dom-r6.json');
    try {
      fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2), 'utf8');
      console.log(`[RECEIPT] Relatório formal gravado em: ${receiptPath}`);
    } catch (e) {
      console.error(`[RECEIPT ERRO] Falha ao gravar receipt: ${e.message}`);
    }
  }
}

run()
  .finally(() => {
    clearTimeout(globalTimeout);
    console.log(`[RESULTADO FINAL] Total: ${receipt.summary.total} | PASS: ${receipt.summary.passed} | FAIL: ${receipt.summary.failed}`);
    process.exit(receipt.summary.failed > 0 || !receipt.browserExitObserved ? 1 : 0);
  });
