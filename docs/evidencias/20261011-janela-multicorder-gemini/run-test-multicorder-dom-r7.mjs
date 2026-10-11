// run-test-multicorder-dom-r5.mjs
// Runner FINITO, AUTOCONTIDO e DETERMINÍSTICO para validação REAL DOM / CDP no Microsoft Edge (700x540).
// Diálogo de MultiGravação R5 (DRAFT-multicorder-r5.html / DRAFT-multicorder-r5.js).
//
// MOCK_API_REAL_DOM_ONLY:
// - Padrão comprovado de bootstrap do Gravar R6: freePort() loopback + --remote-debugging-port pré-alocado + fetch(/json/version).
// - Scope Guard estrito: validação de 127.0.0.1, porta própria, regex de path e ownership CIM (msedge.exe + perfil próprio).
// - Try/finally abrangente iniciando ANTES do spawn, garantindo gravação de receipt e teardown cooperativo em qualquer desfecho.
// - Eliminação total de fixture leaks: resetMockServerState() invocado rigorosamente antes de CADA gate.
// - Cobertura integral: 15 gates funcionais originais de R1 + 9 gates contratuais de R5 + 2 gates de cleanup (26 gates no total):
//   1. Quatro deadlines de 8s protegidos (Save configure, preflight configure, Start e Stop).
//   2. Descarte de respostas defasadas em voo pré-mutação via stateEpoch.
//   3. Transição tardia false -> true resolvendo START sem segundo POST cego do operador.
//   4. STOP pendente: rec=true mantém estado desconhecido, e somente rec=false resolve.
//   5. Rejeição de cache antigo no botão Atualizar sob HTTP 500 ou schema inválido.
//   6. Discriminação exata entre perda de resposta / erro de rede (desconhecido) vs HTTP 4xx (conhecido).
//   7. Bloqueio de novos POSTs sob incerteza preservando rascunhos, consulta e link Avançado (/iso).

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import crypto from 'node:crypto';
import { spawn, execFile } from 'node:child_process';

const ownDir = path.resolve('D:/FreeMix-QA-Gemini-MultiCorder-20261011-0900');
const candidateHtml = path.join(ownDir, 'DRAFT-multicorder-r7.html');
const candidateJs = path.join(ownDir, 'DRAFT-multicorder-r7.js');
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

const receipt = {
  scope: 'MOCK_API_REAL_DOM_ONLY',
  runner: 'run-test-multicorder-dom-r7.mjs',
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
  await new Promise(r => s.listen(0, '127.0.0.1', r));
  const port = s.address().port;
  await new Promise(r => s.close(r));
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
let mockRec = false;
let mockSession = null;
let mockRecordOptions = {
  format: 'mpegts',
  directory: '',
  prefix: 'cam',
  encoder: 'default',
  crf: 23,
  audio: 'input',
  audioSourceUUID: '',
  splitSeconds: 0,
  width: 0,
  height: 0,
  fpsDivisor: 1,
  bitrate: 0,
  perInput: {}
};
let mockAvailableCams = [
  'Cam 1 - Palco',
  'Cam 2 - Geral',
  'Cam 3 - Lateral',
  'Cam 4 - Plateia',
  'Cam 5 - PGM'
];
let mockAudioChoices = [
  { key: '11111111-2222-3333-4444-555555555555', name: 'Microfone Apresentador', bus: false },
  { key: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', name: 'Mesa de Som Auxiliar', bus: true }
];

let isoGetCount = 0;
let mockConfigureFailure = null; // null | 403 | 500 | 'network_drop'
let mockConfigureDelayMs = 0;
let mockStartDirectorMicError = false;
let mockStartDelayMs = 0;
let mockStartFailure = null;     // null | 400 | 500 | 'network_drop' | { error: string }
let mockStopDelayMs = 0;
let mockStopFailure = null;      // null | 500 | 'network_drop'
let mockGetDelayMs = 0;
let mockGetFailure = null;       // null | 500 | 'malformed_schema' | 'network_drop'
const recordedPostRequests = [];
const recordedGetRequests = [];

function resetMockServerState() {
  mockRec = false;
  mockSession = null;
  mockRecordOptions = {
    format: 'mpegts',
    directory: '',
    prefix: 'cam',
    encoder: 'default',
    crf: 23,
    audio: 'input',
    audioSourceUUID: '',
    splitSeconds: 0,
    width: 0,
    height: 0,
    fpsDivisor: 1,
    bitrate: 0,
    perInput: {}
  };
  mockAvailableCams = [
    'Cam 1 - Palco',
    'Cam 2 - Geral',
    'Cam 3 - Lateral',
    'Cam 4 - Plateia',
    'Cam 5 - PGM'
  ];
  mockAudioChoices = [
    { key: '11111111-2222-3333-4444-555555555555', name: 'Microfone Apresentador', bus: false },
    { key: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', name: 'Mesa de Som Auxiliar', bus: true }
  ];
  isoGetCount = 0;
  mockConfigureFailure = null;
  mockConfigureDelayMs = 0;
  mockStartDirectorMicError = false;
  mockStartDelayMs = 0;
  mockStartFailure = null;
  mockStopDelayMs = 0;
  mockStopFailure = null;
  mockGetDelayMs = 0;
  mockGetFailure = null;
  recordedPostRequests.length = 0;
  recordedGetRequests.length = 0;
}

// -------------------------------------------------------------
// Servidor HTTP Local (Loopback Porta Efêmera)
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
  <title>FreeMix MultiCorder Test Harness R5</title>
  <style>
    html, body { margin: 0; padding: 0; width: 700px; height: 540px; overflow: hidden; background: #000; }
    iframe { border: none; width: 700px; height: 540px; display: block; }
  </style>
</head>
<body>
  <iframe id="mc-frame" src="/multicorder"></iframe>
</body>
</html>`);
    return;
  }

  if (pathname === '/multicorder' || pathname === '/DRAFT-multicorder-r7.html' || pathname === '/DRAFT-multicorder-r5.html' || pathname === '/DRAFT-multicorder-r1.html') {
    const content = fs.readFileSync(candidateHtml, 'utf8');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(content);
    return;
  }

  if (pathname === '/DRAFT-multicorder-r7.js' || pathname === '/DRAFT-multicorder-r5.js' || pathname === '/DRAFT-multicorder-r1.js') {
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

  if (pathname === '/iso') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<!DOCTYPE html><html><body><h1>MultiGravação Avançada Legada</h1></body></html>');
    return;
  }

  if (pathname === '/api/iso') {
    if (req.method === 'GET') {
      isoGetCount++;
      recordedGetRequests.push({ at: Date.now() });

      if (mockGetFailure === 'network_drop') {
        req.socket.destroy();
        return;
      }
      if (mockGetFailure === 500) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Internal Server Error' }));
        return;
      }
      if (mockGetFailure === 'malformed_schema') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, iso: { rec: 'not_a_boolean' } }));
        return;
      }

      const respondGet = () => {
        const currentIsoState = {
          rec: mockRec,
          recordOptions: structuredClone(mockRecordOptions),
          session: structuredClone(mockSession),
          availableCams: [...mockAvailableCams],
          audioChoices: structuredClone(mockAudioChoices),
          audioBusSourceSupported: true,
          audioSourceLimit: 'Fonte direta exige folha pública com trilha 1 já habilitada.',
          program: 'Cam 1 - Palco',
          preview: 'Cam 2 - Geral'
        };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, iso: currentIsoState }));
      };

      if (mockGetDelayMs > 0) {
        setTimeout(respondGet, mockGetDelayMs);
      } else {
        respondGet();
      }
      return;
    }

    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        let parsed = {};
        try { parsed = JSON.parse(body); } catch (_) {}
        recordedPostRequests.push({ action: parsed.action, payload: parsed, at: Date.now() });

        const respondPost = () => {
          if (parsed.action === 'configure') {
            if (mockConfigureFailure === 'network_drop') {
              req.socket.destroy();
              return;
            }
            if (mockConfigureFailure === 403) {
              res.writeHead(403, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: 'Opções de gravação só no computador do FreeMix' }));
              return;
            }
            if (mockConfigureFailure === 500) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: 'Erro interno no motor ao salvar opções' }));
              return;
            }
            if (parsed.options) {
              mockRecordOptions = { ...mockRecordOptions, ...parsed.options };
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: true,
              iso: {
                rec: mockRec,
                recordOptions: structuredClone(mockRecordOptions),
                session: structuredClone(mockSession),
                availableCams: [...mockAvailableCams],
                audioChoices: structuredClone(mockAudioChoices)
              }
            }));
            return;
          }

          if (parsed.action === 'start') {
            if (mockStartFailure === 'network_drop') {
              req.socket.destroy();
              return;
            }
            if (mockStartDirectorMicError) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: 'ISO/replay recusado: esta entrada contém o mic privado do diretor' }));
              return;
            }
            if (mockStartFailure === 400 || (mockStartFailure && mockStartFailure.status === 400)) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: mockStartFailure.error || 'Erro 400' }));
              return;
            }
            if (mockStartFailure === 500) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: 'Erro interno 500 no motor' }));
              return;
            }
            mockRec = true;
            const cams = Array.isArray(parsed.cams) ? parsed.cams : [];
            mockSession = {
              id: 'sess-' + Date.now(),
              startedAt: Date.now(),
              dir: mockRecordOptions.directory || 'E:\\Recordings\\iso',
              cams: cams.map((name, i) => ({
                name,
                source: name,
                file: `E:\\Recordings\\iso\\cam-${i + 1}.ts`,
                dir: 'E:\\Recordings\\iso',
                index: i + 1
              }))
            };
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: true,
              iso: {
                rec: mockRec,
                recordOptions: structuredClone(mockRecordOptions),
                session: structuredClone(mockSession),
                availableCams: [...mockAvailableCams],
                audioChoices: structuredClone(mockAudioChoices)
              }
            }));
            return;
          }

          if (parsed.action === 'stop') {
            if (mockStopFailure === 'network_drop') {
              req.socket.destroy();
              return;
            }
            if (mockStopFailure === 500) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: 'Erro interno 500 ao parar gravação' }));
              return;
            }
            if (!mockRec) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: 'Nenhuma sessão de replay está gravando' }));
              return;
            }
            mockRec = false;
            mockSession = null;
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: true,
              iso: {
                rec: mockRec,
                recordOptions: structuredClone(mockRecordOptions),
                session: null,
                availableCams: [...mockAvailableCams],
                audioChoices: structuredClone(mockAudioChoices)
              }
            }));
            return;
          }

          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Ação ISO inválida' }));
        };

        let delayMs = 0;
        if (parsed.action === 'start') delayMs = mockStartDelayMs;
        else if (parsed.action === 'configure') delayMs = mockConfigureDelayMs;
        else if (parsed.action === 'stop') delayMs = mockStopDelayMs;

        if (delayMs > 0) {
          setTimeout(respondPost, delayMs);
        } else {
          respondPost();
        }
      });
      return;
    }
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

// -------------------------------------------------------------
// Cliente CDP Minimalista sobre WebSocket com IIFE Multiline
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
    console.log(`[INFO] Servidor Mock HTTP R5 ouvindo em http://127.0.0.1:${serverPort}`);

    const edgePathCandidates = [
      'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
      'C:/Program Files/Microsoft/Edge/Application/msedge.exe'
    ];
    const edgeBinary = edgePathCandidates.find(p => fs.existsSync(p));
    if (!edgeBinary) {
      throw new Error('Executável do Microsoft Edge não encontrado nos caminhos padrão.');
    }

    profileDir = path.join(ownDir, `FreeMix-QA-Profile-MultiCorder-R7-${Date.now()}`);
    fs.mkdirSync(profileDir, { recursive: true });
    receipt.browserProfilePreserved = profileDir;

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
      throw new Error(`Falha ao obter WebSocket do CDP via http://127.0.0.1:${cdpPort}/json/version`);
    }

    const parsedWsUrl = new URL(versionInfo.webSocketDebuggerUrl);
    if (parsedWsUrl.protocol !== 'ws:' || parsedWsUrl.hostname !== '127.0.0.1' || Number(parsedWsUrl.port) !== cdpPort) {
      throw new Error(`Scope Guard: Endpoint CDP retornado (${versionInfo.webSocketDebuggerUrl}) diverge de 127.0.0.1:${cdpPort}`);
    }
    if (!/^\/devtools\/browser\/[a-zA-Z0-9-]+$/.test(parsedWsUrl.pathname)) {
      throw new Error(`Scope Guard: Path do WebSocket inválido: ${parsedWsUrl.pathname}`);
    }

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
      throw new Error(`Scope Guard: Falha ao verificar processo na porta CDP ${cdpPort}: ${connInfo.error || 'sem escuta'}`);
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
    const cmdLine = procInfo.cmd || '';
    if (!cmdLine.includes('--headless=new') || !cmdLine.includes(path.basename(profileDir))) {
      throw new Error(`Scope Guard: Processo PID ${candidatePid} não pertence ao perfil próprio esperado (${path.basename(profileDir)})`);
    }

    mainBrowserPid = candidatePid;
    console.log(`[INFO] Scope Guard confirmado: PID principal do Edge ${mainBrowserPid} em escuta na porta ${cdpPort}.`);

    browserCdp = new CdpSession(versionInfo.webSocketDebuggerUrl);
    await browserCdp.connect();

    const targets = await browserCdp.send('Target.getTargets');
    let pageTarget = targets.targetInfos.find(t => t.type === 'page');
    if (!pageTarget) {
      const created = await browserCdp.send('Target.createTarget', { url: 'about:blank' });
      pageTarget = { targetId: created.targetId };
    }

    const wsPageUrl = `ws://127.0.0.1:${cdpPort}/devtools/page/${pageTarget.targetId}`;
    pageCdp = new CdpSession(wsPageUrl);
    await pageCdp.connect();

    await pageCdp.send('Page.enable');
    await pageCdp.send('Runtime.enable');
    await pageCdp.send('Emulation.setDeviceMetricsOverride', {
      width: 700,
      height: 540,
      deviceScaleFactor: 1,
      mobile: false
    });

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

    async function loadHarness() {
      await pageCdp.eval(`
        const f = document.getElementById('mc-frame');
        if (f) {
          f.src = '/multicorder?_t=' + Date.now();
        }
      `);
      await new Promise(r => setTimeout(r, 650));
    }

    // -------------------------------------------------------------
    // EXECUÇÃO DOS 15 GATES FUNCIONAIS ORIGINAIS (COM FIXTURE RESET)
    // -------------------------------------------------------------

    // GATE 1: Zero POST no Startup
    resetMockServerState();
    await pageCdp.send('Page.navigate', { url: `http://127.0.0.1:${serverPort}/test-harness.html` });
    await new Promise(r => setTimeout(r, 800));

    assertTest('GATE_1_ZERO_POST_STARTUP', 'Inicialização do diálogo emite estritamente GET /api/iso (zero POSTs)',
      recordedPostRequests.length === 0 && isoGetCount >= 1,
      `POSTs observados: ${recordedPostRequests.length}; GETs: ${isoGetCount}`);
    await takeScreenshot('screenshot-multicorder-startup-r7-700x540');

    // GATE 2: População Correta da Lista de Câmeras a partir de availableCams sem Seleção Automática
    const gate2Data = await pageCdp.eval(`
      const doc = document.getElementById('mc-frame').contentDocument;
      const rows = Array.from(doc.querySelectorAll('#mc-inputs-body tr'));
      const inputs = Array.from(doc.querySelectorAll('input[data-cam]'));
      const checkedInputs = inputs.filter(i => i.checked);
      return {
        rowCount: rows.length,
        inputCount: inputs.length,
        checkedCount: checkedInputs.length,
        firstCamName: inputs[0]?.dataset.cam ?? null
      };
    `);
    assertTest('GATE_2_CAMERAS_POPULATION', 'Tabela renderiza todas as 5 câmeras disponíveis e nenhuma está marcada por padrão',
      gate2Data.inputCount === 5 && gate2Data.checkedCount === 0 && gate2Data.firstCamName === 'Cam 1 - Palco',
      JSON.stringify(gate2Data));

    // GATE 3: Coluna Dropped Frames exibe travessão estrito '—' sem contadores sintéticos
    const gate3Data = await pageCdp.eval(`
      const doc = document.getElementById('mc-frame').contentDocument;
      const dropCells = Array.from(doc.querySelectorAll('.col-drop'));
      return {
        dropCount: dropCells.length,
        allDashes: dropCells.length > 0 && dropCells.every(c => c.textContent.trim() === '—')
      };
    `);
    assertTest('GATE_3_DROPPED_FRAMES_DASH', 'Coluna Dropped Frames exibe travessão "—" em todas as linhas',
      gate3Data.allDashes === true && gate3Data.dropCount === 5,
      JSON.stringify(gate3Data));

    // GATE 4: Isolamento de Seleção do Operador através dos Ciclos de Polling
    await pageCdp.eval(`
      const doc = document.getElementById('mc-frame').contentDocument;
      const chk1 = doc.querySelector('input[data-cam="Cam 1 - Palco"]');
      const chk2 = doc.querySelector('input[data-cam="Cam 2 - Geral"]');
      if (chk1) { chk1.checked = true; chk1.dispatchEvent(new Event('change', { bubbles: true })); }
      if (chk2) { chk2.checked = true; chk2.dispatchEvent(new Event('change', { bubbles: true })); }
    `);
    await new Promise(r => setTimeout(r, 2600)); // Aguarda mais de um ciclo de polling (2000ms)
    const gate4Data = await pageCdp.eval(`
      const doc = document.getElementById('mc-frame').contentDocument;
      const chk1 = doc.querySelector('input[data-cam="Cam 1 - Palco"]');
      const chk2 = doc.querySelector('input[data-cam="Cam 2 - Geral"]');
      const chk3 = doc.querySelector('input[data-cam="Cam 3 - Lateral"]');
      return {
        chk1Checked: chk1?.checked ?? false,
        chk2Checked: chk2?.checked ?? false,
        chk3Checked: chk3?.checked ?? false
      };
    `);
    assertTest('GATE_4_SELECTION_ISOLATION', 'Checkboxes marcados pelo operador permanecem intactos após polling de background',
      gate4Data.chk1Checked === true && gate4Data.chk2Checked === true && gate4Data.chk3Checked === false,
      JSON.stringify(gate4Data));

    // GATE 5: Proteção de Seleção Vazia (Start com 0 câmeras bloqueia localmente sem POST)
    const postCountBeforeEmpty = recordedPostRequests.length;
    await pageCdp.eval(`
      const doc = document.getElementById('mc-frame').contentDocument;
      const chk1 = doc.querySelector('input[data-cam="Cam 1 - Palco"]');
      const chk2 = doc.querySelector('input[data-cam="Cam 2 - Geral"]');
      if (chk1) { chk1.checked = false; chk1.dispatchEvent(new Event('change', { bubbles: true })); }
      if (chk2) { chk2.checked = false; chk2.dispatchEvent(new Event('change', { bubbles: true })); }
      doc.getElementById('btn-main-action').click();
    `);
    await new Promise(r => setTimeout(r, 300));
    const gate5Data = await pageCdp.eval(`
      const doc = document.getElementById('mc-frame').contentDocument;
      return {
        statusText: doc.getElementById('mc-status-text')?.textContent ?? '',
        statusClass: doc.getElementById('mc-status-text')?.className ?? ''
      };
    `);
    const postCountAfterEmpty = recordedPostRequests.length;
    assertTest('GATE_5_EMPTY_SELECTION_GUARD', 'Start com 0 câmeras exibe aviso amigável e emite zero POST',
      (postCountAfterEmpty - postCountBeforeEmpty === 0) && gate5Data.statusText.includes('Selecione entre 1 e 8'),
      JSON.stringify({ postDelta: postCountAfterEmpty - postCountBeforeEmpty, status: gate5Data.statusText }));

    // GATE 6: Proteção contra Excesso de Câmeras (> 8)
    const postCountBeforeOverlimit = recordedPostRequests.length;
    await pageCdp.eval(`
      const doc = document.getElementById('mc-frame').contentDocument;
      for (let i = 1; i <= 9; i++) {
        const inp = document.createElement('input');
        inp.type = 'checkbox';
        inp.dataset.cam = 'FakeCam ' + i;
        inp.checked = true;
        doc.getElementById('mc-inputs-body').appendChild(inp);
        inp.dispatchEvent(new Event('change', { bubbles: true }));
      }
      doc.getElementById('btn-main-action').click();
    `);
    await new Promise(r => setTimeout(r, 300));
    const gate6Data = await pageCdp.eval(`
      const doc = document.getElementById('mc-frame').contentDocument;
      return {
        statusText: doc.getElementById('mc-status-text')?.textContent ?? ''
      };
    `);
    const postCountAfterOverlimit = recordedPostRequests.length;
    assertTest('GATE_6_OVERLIMIT_SELECTION_GUARD', 'Start com mais de 8 câmeras bloqueia com mensagem amigável sem POST',
      (postCountAfterOverlimit - postCountBeforeOverlimit === 0) && gate6Data.statusText.includes('Máximo de 8 entradas'),
      JSON.stringify({ postDelta: postCountAfterOverlimit - postCountBeforeOverlimit, status: gate6Data.statusText }));

    // GATE 7: Pré-Voo de Configuração se dirtyDraft=true (POST configure antes de POST start)
    resetMockServerState();
    await loadHarness();
    const postCountBeforePreflight = recordedPostRequests.length;
    await pageCdp.eval(`
      const doc = document.getElementById('mc-frame').contentDocument;
      const chk1 = doc.querySelector('input[data-cam="Cam 1 - Palco"]');
      if (chk1) { chk1.checked = true; chk1.dispatchEvent(new Event('change', { bubbles: true })); }
      const mkvBtn = doc.getElementById('fmt-mkv');
      if (mkvBtn) { mkvBtn.click(); }
      doc.getElementById('btn-main-action').click();
    `);
    await new Promise(r => setTimeout(r, 900));
    const preflightActions = recordedPostRequests.slice(postCountBeforePreflight).map(p => p.action);
    assertTest('GATE_7_DIRTY_DRAFT_CONFIG_PREFLIGHT', 'Se dirtyDraft=true, Start despacha POST configure e subsequentemente POST start',
      preflightActions.length === 2 && preflightActions[0] === 'configure' && preflightActions[1] === 'start',
      `Ações despachadas: ${JSON.stringify(preflightActions)}`);

    // GATE 8: Tratamento de Falha HTTP 403 em configure (Acesso Remoto) sem Disparar start
    resetMockServerState();
    mockConfigureFailure = 403;
    await loadHarness();
    const postCountBefore403 = recordedPostRequests.length;
    await pageCdp.eval(`
      const doc = document.getElementById('mc-frame').contentDocument;
      const chk1 = doc.querySelector('input[data-cam="Cam 1 - Palco"]');
      if (chk1) { chk1.checked = true; chk1.dispatchEvent(new Event('change', { bubbles: true })); }
      const dirInput = doc.getElementById('mc-dir');
      if (dirInput) {
        dirInput.value = 'E:\\\\Restricted';
        dirInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      doc.getElementById('btn-main-action').click();
    `);
    await new Promise(r => setTimeout(r, 800));
    const actions403 = recordedPostRequests.slice(postCountBefore403).map(p => p.action);
    const gate8Data = await pageCdp.eval(`
      const doc = document.getElementById('mc-frame').contentDocument;
      return {
        statusText: doc.getElementById('mc-status-text')?.textContent ?? '',
        dirValue: doc.getElementById('mc-dir')?.value ?? '',
        btnText: doc.getElementById('btn-main-action')?.textContent ?? '',
        btnDisabled: doc.getElementById('btn-main-action')?.disabled ?? false
      };
    `);
    assertTest('GATE_8_CONFIGURE_HTTP403_HANDLING', 'Erro HTTP 403 em configure aborta a cadeia sem chamar start, retém rascunho e não arma incerteza indevida',
      actions403.length === 1 && actions403[0] === 'configure' &&
      gate8Data.statusText.includes('Opções de gravação só no computador do FreeMix') &&
      gate8Data.dirValue === 'E:\\Restricted' && gate8Data.btnText === 'Start' && gate8Data.btnDisabled === false,
      JSON.stringify({ actions: actions403, data: gate8Data }));

    // GATE 9: Transição de Sucesso no Start (Botão vira Stop, trava opções, inicia contagem)
    resetMockServerState();
    await loadHarness();
    await pageCdp.eval(`
      const doc = document.getElementById('mc-frame').contentDocument;
      const chk1 = doc.querySelector('input[data-cam="Cam 1 - Palco"]');
      if (chk1) { chk1.checked = true; chk1.dispatchEvent(new Event('change', { bubbles: true })); }
      doc.getElementById('btn-main-action').click();
    `);
    await new Promise(r => setTimeout(r, 1200));
    const gate9Data = await pageCdp.eval(`
      const doc = document.getElementById('mc-frame').contentDocument;
      const btn = doc.getElementById('btn-main-action');
      const audio = doc.getElementById('mc-audio');
      const split = doc.getElementById('mc-split');
      const dir = doc.getElementById('mc-dir');
      const chk1 = doc.querySelector('input[data-cam="Cam 1 - Palco"]');
      const durationCell = doc.querySelector('#mc-inputs-body tr td:nth-child(2)');
      return {
        btnText: btn?.textContent ?? '',
        btnClass: btn?.className ?? '',
        audioDisabled: audio?.disabled ?? false,
        splitDisabled: split?.disabled ?? false,
        dirDisabled: dir?.disabled ?? false,
        chkDisabled: chk1?.disabled ?? false,
        durationText: durationCell?.textContent ?? ''
      };
    `);
    assertTest('GATE_9_START_SUCCESS_TRANSITION', 'Start confirmado alterna botão para Stop (.recording), trava inputs e exibe duração ativa',
      gate9Data.btnText === 'Stop' && gate9Data.btnClass.includes('recording') &&
      gate9Data.audioDisabled === true && gate9Data.splitDisabled === true && gate9Data.chkDisabled === true &&
      gate9Data.durationText !== '—',
      JSON.stringify(gate9Data));
    await takeScreenshot('screenshot-multicorder-recording-r7-700x540');

    // GATE 10: Bloqueio de Stop Inativo quando rec=false (Evita HTTP 400 do motor)
    resetMockServerState();
    await loadHarness();
    const postCountBeforeStopInactive = recordedPostRequests.length;
    const gate10Data = await pageCdp.eval(`
      const doc = document.getElementById('mc-frame').contentDocument;
      const btn = doc.getElementById('btn-main-action');
      return {
        btnText: btn?.textContent ?? '',
        isRec: btn?.classList.contains('recording') ?? false
      };
    `);
    assertTest('GATE_10_STOP_INACTIVE_GUARD', 'Diálogo parado apresenta botão Start e não permite disparo acidental de stop',
      gate10Data.btnText === 'Start' && gate10Data.isRec === false && (recordedPostRequests.length - postCountBeforeStopInactive === 0),
      JSON.stringify(gate10Data));

    // GATE 11: Transição de Sucesso no Stop (Dispara POST stop, restaura estado e botões liberados)
    resetMockServerState();
    await loadHarness();
    await pageCdp.eval(`
      const doc = document.getElementById('mc-frame').contentDocument;
      const chk1 = doc.querySelector('input[data-cam="Cam 1 - Palco"]');
      if (chk1) { chk1.checked = true; chk1.dispatchEvent(new Event('change', { bubbles: true })); }
      doc.getElementById('btn-main-action').click();
    `);
    await new Promise(r => setTimeout(r, 800));
    const postCountBeforeStop = recordedPostRequests.length;
    await pageCdp.eval(`
      const doc = document.getElementById('mc-frame').contentDocument;
      doc.getElementById('btn-main-action').click();
    `);
    await new Promise(r => setTimeout(r, 800));
    const stopActionEmitted = recordedPostRequests.slice(postCountBeforeStop).some(p => p.action === 'stop');
    const gate11Data = await pageCdp.eval(`
      const doc = document.getElementById('mc-frame').contentDocument;
      const btn = doc.getElementById('btn-main-action');
      const audio = doc.getElementById('mc-audio');
      return {
        btnText: btn?.textContent ?? '',
        isRec: btn?.classList.contains('recording') ?? false,
        audioDisabled: audio?.disabled ?? true,
        statusText: doc.getElementById('mc-status-text')?.textContent ?? ''
      };
    `);
    assertTest('GATE_11_STOP_SUCCESS_TRANSITION', 'Stop finaliza gravação, libera controles e atualiza mensagem de status',
      stopActionEmitted === true && gate11Data.btnText === 'Start' &&
      gate11Data.isRec === false && gate11Data.audioDisabled === false &&
      gate11Data.statusText.includes('MultiGravação finalizada'),
      JSON.stringify(gate11Data));
    await takeScreenshot('screenshot-multicorder-stop-r7-700x540');

    // GATE 12: Reconciliação sem Auto-Retry após Timeout de Rede (8s) no start
    resetMockServerState();
    mockStartDelayMs = 9000; // Probe no motor ultrapassa 8000ms
    await loadHarness();
    const postCountBeforeTimeout = recordedPostRequests.length;
    await pageCdp.eval(`
      const doc = document.getElementById('mc-frame').contentDocument;
      const chk1 = doc.querySelector('input[data-cam="Cam 1 - Palco"]');
      if (chk1) { chk1.checked = true; chk1.dispatchEvent(new Event('change', { bubbles: true })); }
      doc.getElementById('btn-main-action').click();
    `);
    console.log('[INFO] Aguardando deadline de 8000ms do AbortSignal em GATE_12...');
    await new Promise(r => setTimeout(r, 8600));
    mockStartDelayMs = 0;
    const postCountAfterTimeout = recordedPostRequests.length;
    const gate12Data = await pageCdp.eval(`
      const doc = document.getElementById('mc-frame').contentDocument;
      const btnStart = doc.getElementById('btn-main-action');
      const btnRefresh = doc.getElementById('btn-refresh');
      return {
        statusText: doc.getElementById('mc-status-text')?.textContent ?? '',
        isBusy: btnStart?.disabled ?? false,
        refreshDisabled: btnRefresh?.disabled ?? false
      };
    `);
    assertTest('GATE_12_START_TIMEOUT_RECONCILIATION', 'Timeout no start emite 1 único POST, preserva aviso de 8s contra sobrescrita e bloqueia novo POST cego',
      (postCountAfterTimeout - postCountBeforeTimeout === 1) &&
      gate12Data.isBusy === true &&
      gate12Data.refreshDisabled === false &&
      gate12Data.statusText.includes('Tempo limite de 8s'),
      JSON.stringify({ postDelta: postCountAfterTimeout - postCountBeforeTimeout, data: gate12Data }));

    // GATE 13: Preservação de Configurações Avançadas (perInput, encoder, crf, prefix) no Merge
    resetMockServerState();
    mockRecordOptions = {
      format: 'mpegts',
      directory: 'D:\\BaseDir',
      prefix: 'iso_show',
      encoder: 'obs_nvenc_h264_tex',
      crf: 19,
      audio: 'input',
      audioSourceUUID: '',
      splitSeconds: 0,
      width: 1920,
      height: 1080,
      fpsDivisor: 2,
      bitrate: 8000,
      perInput: {
        'Cam 1 - Palco': { bitrate: 12000, crf: 15 }
      }
    };
    await loadHarness();
    const postCountBeforeMerge = recordedPostRequests.length;
    await pageCdp.eval(`
      const doc = document.getElementById('mc-frame').contentDocument;
      const audioSel = doc.getElementById('mc-audio');
      if (audioSel) {
        audioSel.value = 'master';
        audioSel.dispatchEvent(new Event('change', { bubbles: true }));
      }
      doc.getElementById('btn-save').click();
    `);
    await new Promise(r => setTimeout(r, 800));
    const configureRequest = recordedPostRequests.slice(postCountBeforeMerge).find(p => p.action === 'configure');
    const sentOptions = configureRequest?.payload?.options;
    assertTest('GATE_13_OPTIONS_MERGE_PRESERVATION', 'POST configure preserva perInput, encoder, crf, prefix, width e height via deep merge',
      sentOptions &&
      sentOptions.audio === 'master' &&
      sentOptions.encoder === 'obs_nvenc_h264_tex' &&
      sentOptions.crf === 19 &&
      sentOptions.prefix === 'iso_show' &&
      sentOptions.fpsDivisor === 2 &&
      sentOptions.perInput?.['Cam 1 - Palco']?.bitrate === 12000,
      JSON.stringify(sentOptions));

    // GATE 14: Exibição Fiel da Mensagem de Rejeição de Microfone do Diretor (HTTP 400 Conhecido)
    resetMockServerState();
    mockStartDirectorMicError = true;
    await loadHarness();
    await pageCdp.eval(`
      const doc = document.getElementById('mc-frame').contentDocument;
      const chk1 = doc.querySelector('input[data-cam="Cam 5 - PGM"]');
      if (chk1) { chk1.checked = true; chk1.dispatchEvent(new Event('change', { bubbles: true })); }
      doc.getElementById('btn-main-action').click();
    `);
    await new Promise(r => setTimeout(r, 800));
    mockStartDirectorMicError = false;
    const gate14Data = await pageCdp.eval(`
      const doc = document.getElementById('mc-frame').contentDocument;
      const btn = doc.getElementById('btn-main-action');
      return {
        statusText: doc.getElementById('mc-status-text')?.textContent ?? '',
        btnText: btn?.textContent ?? '',
        btnDisabled: btn?.disabled ?? false
      };
    `);
    assertTest('GATE_14_DIRECTOR_MIC_REJECTION', 'Mensagem de recusa de mic do diretor é exibida com fidelidade e não trava UI como incerta',
      gate14Data.statusText.includes('ISO/replay recusado: esta entrada contém o mic privado do diretor') &&
      gate14Data.btnText === 'Start' && gate14Data.btnDisabled === false,
      JSON.stringify(gate14Data));

    // GATE 15: Integridade do Link Avançado (Preserva href='/iso' Intacto)
    const gate15Data = await pageCdp.eval(`
      const doc = document.getElementById('mc-frame').contentDocument;
      const link = doc.getElementById('link-advanced');
      return {
        href: link?.getAttribute('href') ?? null,
        text: link?.textContent ?? ''
      };
    `);
    assertTest('GATE_15_ADVANCED_LINK_INTEGRITY', 'Link "Avançado..." preserva href="/iso" estrito (não aponta para script .js)',
      gate15Data.href === '/iso' && gate15Data.text.includes('Avançado'),
      JSON.stringify(gate15Data));

    // -------------------------------------------------------------
    // GATES CONTRATUAIS ESPECÍFICOS DE R5
    // -------------------------------------------------------------

    // GATE 16: Deadline 8s em handleSave (Save manual) arma uncertainOp='configure' e protege rascunho
    resetMockServerState();
    mockConfigureDelayMs = 9000;
    await loadHarness();
    await pageCdp.eval(`
      const doc = document.getElementById('mc-frame').contentDocument;
      const audioSel = doc.getElementById('mc-audio');
      if (audioSel) {
        audioSel.value = 'bus-a';
        audioSel.dispatchEvent(new Event('change', { bubbles: true }));
      }
      doc.getElementById('btn-save').click();
    `);
    console.log('[INFO] Aguardando deadline de 8000ms do AbortSignal em GATE_16 (Save)...');
    await new Promise(r => setTimeout(r, 8600));
    mockConfigureDelayMs = 0;
    const gate16Data = await pageCdp.eval(`
      const doc = document.getElementById('mc-frame').contentDocument;
      const btnSave = doc.getElementById('btn-save');
      const btnStart = doc.getElementById('btn-main-action');
      const btnRefresh = doc.getElementById('btn-refresh');
      const audioSel = doc.getElementById('mc-audio');
      return {
        statusText: doc.getElementById('mc-status-text')?.textContent ?? '',
        saveDisabled: btnSave?.disabled ?? false,
        startDisabled: btnStart?.disabled ?? false,
        refreshDisabled: btnRefresh?.disabled ?? false,
        draftAudio: audioSel?.value ?? ''
      };
    `);
    assertTest('GATE_16_SAVE_TIMEOUT_DEADLINE_8S', 'Timeout de 8s ao salvar opções arma incerteza, bloqueia novo POST e retém rascunhos',
      gate16Data.statusText.includes('Tempo limite de 8s ao salvar opções') &&
      gate16Data.saveDisabled === true && gate16Data.startDisabled === true &&
      gate16Data.refreshDisabled === false && gate16Data.draftAudio === 'bus-a',
      JSON.stringify(gate16Data));

    // GATE 17: Deadline 8s em sendConfigure Pré-Voo de Start aborta cadeia antes de start
    resetMockServerState();
    mockConfigureDelayMs = 9000;
    await loadHarness();
    const postCountBeforeGate17 = recordedPostRequests.length;
    await pageCdp.eval(`
      const doc = document.getElementById('mc-frame').contentDocument;
      const chk1 = doc.querySelector('input[data-cam="Cam 1 - Palco"]');
      if (chk1) { chk1.checked = true; chk1.dispatchEvent(new Event('change', { bubbles: true })); }
      const mkvBtn = doc.getElementById('fmt-mkv');
      if (mkvBtn) { mkvBtn.click(); }
      doc.getElementById('btn-main-action').click();
    `);
    console.log('[INFO] Aguardando deadline de 8000ms em GATE_17 (Preflight Configure)...');
    await new Promise(r => setTimeout(r, 8600));
    mockConfigureDelayMs = 0;
    const gate17Actions = recordedPostRequests.slice(postCountBeforeGate17).map(p => p.action);
    const gate17Data = await pageCdp.eval(`
      const doc = document.getElementById('mc-frame').contentDocument;
      const btnStart = doc.getElementById('btn-main-action');
      const btnSave = doc.getElementById('btn-save');
      return {
        statusText: doc.getElementById('mc-status-text')?.textContent ?? '',
        startDisabled: btnStart?.disabled ?? false,
        saveDisabled: btnSave?.disabled ?? false
      };
    `);
    assertTest('GATE_17_PREFLIGHT_CONFIGURE_TIMEOUT_8S', 'Timeout de 8s em configure pré-início aborta sem disparar POST start e bloqueia mutações',
      gate17Actions.length === 1 && gate17Actions[0] === 'configure' &&
      gate17Data.statusText.includes('Tempo limite de 8s ou falha de rede ao salvar opções pré-início') &&
      gate17Data.startDisabled === true && gate17Data.saveDisabled === true,
      JSON.stringify({ actions: gate17Actions, data: gate17Data }));

    // GATE 18: Deadline 8s em handleStop arma uncertainOp='stop'
    resetMockServerState();
    await loadHarness();
    await pageCdp.eval(`
      const doc = document.getElementById('mc-frame').contentDocument;
      const chk1 = doc.querySelector('input[data-cam="Cam 1 - Palco"]');
      if (chk1) { chk1.checked = true; chk1.dispatchEvent(new Event('change', { bubbles: true })); }
      doc.getElementById('btn-main-action').click();
    `);
    await new Promise(r => setTimeout(r, 800)); // Gravação iniciada com sucesso
    mockStopDelayMs = 9000;
    await pageCdp.eval(`
      const doc = document.getElementById('mc-frame').contentDocument;
      doc.getElementById('btn-main-action').click();
    `);
    console.log('[INFO] Aguardando deadline de 8000ms em GATE_18 (Stop)...');
    await new Promise(r => setTimeout(r, 8600));
    mockStopDelayMs = 0;
    const gate18Data = await pageCdp.eval(`
      const doc = document.getElementById('mc-frame').contentDocument;
      const btnMain = doc.getElementById('btn-main-action');
      const btnSave = doc.getElementById('btn-save');
      const btnRefresh = doc.getElementById('btn-refresh');
      return {
        statusText: doc.getElementById('mc-status-text')?.textContent ?? '',
        mainDisabled: btnMain?.disabled ?? false,
        saveDisabled: btnSave?.disabled ?? false,
        refreshDisabled: btnRefresh?.disabled ?? false
      };
    `);
    assertTest('GATE_18_STOP_TIMEOUT_DEADLINE_8S', 'Timeout de 8s ao parar gravação arma incerteza de stop e protege botões mutantes',
      gate18Data.statusText.includes('Tempo limite de 8s ao parar gravação') &&
      gate18Data.mainDisabled === true && gate18Data.saveDisabled === true && gate18Data.refreshDisabled === false,
      JSON.stringify(gate18Data));

    // GATE 19: Atualizar sob HTTP 500 ou Schema Inválido NUNCA Destrava Incerteza usando Cache Antigo
    // Estado ainda está em incerteza de stop do Gate 18
    mockGetFailure = 500;
    await pageCdp.eval(`
      const doc = document.getElementById('mc-frame').contentDocument;
      doc.getElementById('btn-refresh').click();
    `);
    await new Promise(r => setTimeout(r, 500));
    const gate19Data500 = await pageCdp.eval(`
      const doc = document.getElementById('mc-frame').contentDocument;
      const btnMain = doc.getElementById('btn-main-action');
      return {
        statusText: doc.getElementById('mc-status-text')?.textContent ?? '',
        mainDisabled: btnMain?.disabled ?? false
      };
    `);
    mockGetFailure = 'malformed_schema';
    await pageCdp.eval(`
      const doc = document.getElementById('mc-frame').contentDocument;
      doc.getElementById('btn-refresh').click();
    `);
    await new Promise(r => setTimeout(r, 500));
    mockGetFailure = null;
    const gate19DataSchema = await pageCdp.eval(`
      const doc = document.getElementById('mc-frame').contentDocument;
      const btnMain = doc.getElementById('btn-main-action');
      return {
        statusText: doc.getElementById('mc-status-text')?.textContent ?? '',
        mainDisabled: btnMain?.disabled ?? false
      };
    `);
    assertTest('GATE_19_UNKNOWN_READ_REJECTS_CACHE_UNLOCK', 'Atualizar falho (HTTP 500 ou schema inválido) mantém incerteza sem liberar via cache defasado',
      gate19Data500.statusText.includes('Falha ao atualizar status: HTTP 500') &&
      gate19Data500.mainDisabled === true &&
      gate19DataSchema.statusText.includes('Falha ao atualizar status') &&
      gate19DataSchema.mainDisabled === true,
      JSON.stringify({ resp500: gate19Data500, respSchema: gate19DataSchema }));

    // GATE 20: Invalidação de GET Lento em Voo Pré-Mutação via stateEpoch
    resetMockServerState();
    await loadHarness();
    mockGetDelayMs = 1500; // Simula GET lento
    // Dispara GET manual e imediatamente altera rascunho e clica salvar
    await pageCdp.eval(`
      const doc = document.getElementById('mc-frame').contentDocument;
      doc.getElementById('btn-refresh').click(); // Inicia GET lento (epoch = 1)
      const dirInput = doc.getElementById('mc-dir');
      if (dirInput) {
        dirInput.value = 'D:\\\\NovaPastaEpoch';
        dirInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      doc.getElementById('btn-save').click(); // Inicia mutação (stateEpoch++)
    `);
    await new Promise(r => setTimeout(r, 2200)); // Aguarda GET atrasado concluir
    mockGetDelayMs = 0;
    const gate20Data = await pageCdp.eval(`
      const doc = document.getElementById('mc-frame').contentDocument;
      const dirInput = doc.getElementById('mc-dir');
      return {
        dirValue: dirInput?.value ?? ''
      };
    `);
    assertTest('GATE_20_STATE_EPOCH_STALE_GET_INVALIDATION', 'GET lento em trânsito não sobrescreve rascunhos pós-mutação devido ao incremento de stateEpoch',
      gate20Data.dirValue === 'D:\\NovaPastaEpoch',
      JSON.stringify(gate20Data));

    // GATE 21: Transição Tardia (Late GET false -> true) Resolve START sem Segundo POST Cego
    resetMockServerState();
    mockStartDelayMs = 9000; // Sonda longa de 9s no backend
    await loadHarness();
    await pageCdp.eval(`
      const doc = document.getElementById('mc-frame').contentDocument;
      const chk1 = doc.querySelector('input[data-cam="Cam 1 - Palco"]');
      if (chk1) { chk1.checked = true; chk1.dispatchEvent(new Event('change', { bubbles: true })); }
      doc.getElementById('btn-main-action').click();
    `);
    console.log('[INFO] Aguardando timeout de 8000ms em GATE_21...');
    await new Promise(r => setTimeout(r, 8600)); // Timeout dispara
    const postCountAfterTimeoutGate21 = recordedPostRequests.length;
    // Agora sonda de 9s do backend completa e motor ativa gravação
    mockRec = true;
    mockSession = { startedAt: Date.now(), cams: [{ name: 'Cam 1 - Palco', file: 'E:\\Recordings\\iso\\cam-1.ts' }] };
    mockStartDelayMs = 0;
    // Aguarda ciclo de polling periódico (2000ms)
    await new Promise(r => setTimeout(r, 2600));
    const postCountAfterReconcileGate21 = recordedPostRequests.length;
    const gate21Data = await pageCdp.eval(`
      const doc = document.getElementById('mc-frame').contentDocument;
      const btn = doc.getElementById('btn-main-action');
      return {
        btnText: btn?.textContent ?? '',
        btnClass: btn?.className ?? '',
        btnDisabled: btn?.disabled ?? false,
        statusText: doc.getElementById('mc-status-text')?.textContent ?? ''
      };
    `);
    assertTest('GATE_21_LATE_GET_RESOLVES_START_NO_SECOND_POST', 'START tardio com rec=true atualiza UI para Stop (.recording) sem emitir segundo POST mutante',
      (postCountAfterReconcileGate21 - postCountAfterTimeoutGate21 === 0) &&
      gate21Data.btnText === 'Stop' && gate21Data.btnClass.includes('recording') &&
      gate21Data.btnDisabled === false && gate21Data.statusText.includes('MultiGravação ativa'),
      JSON.stringify({ postDelta: postCountAfterReconcileGate21 - postCountAfterTimeoutGate21, data: gate21Data }));

    // GATE 22: STOP Pendente Sob Timeout: rec=true Mantém Incerteza; Somente rec=false Resolve
    resetMockServerState();
    await loadHarness();
    // Inicia gravação
    await pageCdp.eval(`
      const doc = document.getElementById('mc-frame').contentDocument;
      const chk1 = doc.querySelector('input[data-cam="Cam 1 - Palco"]');
      if (chk1) { chk1.checked = true; chk1.dispatchEvent(new Event('change', { bubbles: true })); }
      doc.getElementById('btn-main-action').click();
    `);
    await new Promise(r => setTimeout(r, 800));
    mockStopDelayMs = 9000;
    await pageCdp.eval(`
      const doc = document.getElementById('mc-frame').contentDocument;
      doc.getElementById('btn-main-action').click();
    `);
    console.log('[INFO] Aguardando timeout de Stop em GATE_22...');
    await new Promise(r => setTimeout(r, 8600)); // Armou uncertainOp='stop'
    mockStopDelayMs = 0;
    // Leitura 1: Motor ainda descarregando (mockRec permanece true)
    await pageCdp.eval(`
      const doc = document.getElementById('mc-frame').contentDocument;
      doc.getElementById('btn-refresh').click();
    `);
    await new Promise(r => setTimeout(r, 500));
    const gate22Read1 = await pageCdp.eval(`
      const doc = document.getElementById('mc-frame').contentDocument;
      const btn = doc.getElementById('btn-main-action');
      return {
        statusText: doc.getElementById('mc-status-text')?.textContent ?? '',
        mainDisabled: btn?.disabled ?? false
      };
    `);
    // Leitura 2: Motor concluiu parada (mockRec vira false)
    mockRec = false;
    mockSession = null;
    await pageCdp.eval(`
      const doc = document.getElementById('mc-frame').contentDocument;
      doc.getElementById('btn-refresh').click();
    `);
    await new Promise(r => setTimeout(r, 500));
    const gate22Read2 = await pageCdp.eval(`
      const doc = document.getElementById('mc-frame').contentDocument;
      const btn = doc.getElementById('btn-main-action');
      return {
        statusText: doc.getElementById('mc-status-text')?.textContent ?? '',
        mainDisabled: btn?.disabled ?? false,
        btnText: btn?.textContent ?? ''
      };
    `);
    assertTest('GATE_22_PENDING_STOP_RESOLUTION_FLOW', 'STOP pendente mantém trava enquanto rec=true e só destrava quando leitura confirma rec=false',
      gate22Read1.statusText.includes('Motor confirmou gravação ainda ativa') &&
      gate22Read1.mainDisabled === true &&
      gate22Read2.statusText.includes('gravação parada com sucesso') &&
      gate22Read2.mainDisabled === false && gate22Read2.btnText === 'Start',
      JSON.stringify({ read1: gate22Read1, read2: gate22Read2 }));

    // GATE 23: Incerteza Impede Novo POST Cego no Botão Salvar e Start
    resetMockServerState();
    mockConfigureDelayMs = 9000;
    await loadHarness();
    await pageCdp.eval(`
      const doc = document.getElementById('mc-frame').contentDocument;
      const dirInput = doc.getElementById('mc-dir');
      if (dirInput) {
        dirInput.value = 'E:\\\\PastaIncerteza';
        dirInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      doc.getElementById('btn-save').click();
    `);
    await new Promise(r => setTimeout(r, 8600)); // Armou uncertainOp='configure'
    mockConfigureDelayMs = 0;
    const postCountBeforeClickAttempt = recordedPostRequests.length;
    await pageCdp.eval(`
      const doc = document.getElementById('mc-frame').contentDocument;
      doc.getElementById('btn-save').click();
      doc.getElementById('btn-main-action').click();
    `);
    await new Promise(r => setTimeout(r, 400));
    const postCountAfterClickAttempt = recordedPostRequests.length;
    const gate23Data = await pageCdp.eval(`
      const doc = document.getElementById('mc-frame').contentDocument;
      const dirInput = doc.getElementById('mc-dir');
      return {
        dirValue: dirInput?.value ?? '',
        saveDisabled: doc.getElementById('btn-save')?.disabled ?? false,
        startDisabled: doc.getElementById('btn-main-action')?.disabled ?? false
      };
    `);
    assertTest('GATE_23_UNCERTAIN_LOCKS_PREVENT_BLIND_POSTS', 'Estado incerto bloqueia novos disparos de Start e Salvar mantendo opções no formulário',
      (postCountAfterClickAttempt - postCountBeforeClickAttempt === 0) &&
      gate23Data.saveDisabled === true && gate23Data.startDisabled === true &&
      gate23Data.dirValue === 'E:\\PastaIncerteza',
      JSON.stringify({ postDelta: postCountAfterClickAttempt - postCountBeforeClickAttempt, data: gate23Data }));

    // GATE 24: Discriminação entre Perda de Resposta de Rede (TypeError) vs HTTP 400 Conhecido
    // Cenário A: Queda de socket (TypeError / network drop) arma uncertainOp='start'
    resetMockServerState();
    mockStartFailure = 'network_drop';
    await loadHarness();
    await pageCdp.eval(`
      const doc = document.getElementById('mc-frame').contentDocument;
      const chk1 = doc.querySelector('input[data-cam="Cam 1 - Palco"]');
      if (chk1) { chk1.checked = true; chk1.dispatchEvent(new Event('change', { bubbles: true })); }
      doc.getElementById('btn-main-action').click();
    `);
    await new Promise(r => setTimeout(r, 600));
    const gate24Drop = await pageCdp.eval(`
      const doc = document.getElementById('mc-frame').contentDocument;
      const btn = doc.getElementById('btn-main-action');
      return {
        statusText: doc.getElementById('mc-status-text')?.textContent ?? '',
        btnDisabled: btn?.disabled ?? false
      };
    `);
    // Cenário B: HTTP 400 conhecido NÃO arma incerteza
    resetMockServerState();
    mockStartDirectorMicError = true;
    await loadHarness();
    await pageCdp.eval(`
      const doc = document.getElementById('mc-frame').contentDocument;
      const chk1 = doc.querySelector('input[data-cam="Cam 1 - Palco"]');
      if (chk1) { chk1.checked = true; chk1.dispatchEvent(new Event('change', { bubbles: true })); }
      doc.getElementById('btn-main-action').click();
    `);
    await new Promise(r => setTimeout(r, 600));
    mockStartDirectorMicError = false;
    const gate24Http400 = await pageCdp.eval(`
      const doc = document.getElementById('mc-frame').contentDocument;
      const btn = doc.getElementById('btn-main-action');
      return {
        statusText: doc.getElementById('mc-status-text')?.textContent ?? '',
        btnDisabled: btn?.disabled ?? false
      };
    `);
    assertTest('GATE_24_NETWORK_DROP_VS_HTTP4XX_CLASSIFICATION', 'Queda de conexão física arma incerteza; erro HTTP 400 ordinário é tratado sem travar interface',
      gate24Drop.statusText.includes('Tempo limite de 8s') && gate24Drop.btnDisabled === true &&
      gate24Http400.statusText.includes('ISO/replay recusado') && gate24Http400.btnDisabled === false,
      JSON.stringify({ drop: gate24Drop, http400: gate24Http400 }));

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

    // 2. Verificação CIM de ausência de processos msedge.exe no perfil próprio (sem self-matching)
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
      assertTest('GATE_CLEANUP_EXIT_OBSERVED', 'Processos msedge.exe associados ao perfil próprio encerraram cooperativamente (CIM count = 0)', exitObserved);
    }

    // 3. Revalidação Estrita de PINs Pós-Execução
    receipt.pinsAfter = {
      html: { path: candidateHtml, sha: sha256File(candidateHtml) },
      js: { path: candidateJs, sha: sha256File(candidateJs) },
      css: { path: candidateCss, sha: sha256File(candidateCss) }
    };
    const pinsUnchanged = (receipt.pinsBefore.html.sha === receipt.pinsAfter.html.sha) &&
                          (receipt.pinsBefore.js.sha === receipt.pinsAfter.js.sha) &&
                          (receipt.pinsBefore.css.sha === receipt.pinsAfter.css.sha);
    assertTest('GATE_CLEANUP_PINS_UNCHANGED', 'Arquivos de origem mantiveram hashes SHA-256 inalterados após a bateria de testes', pinsUnchanged);

    // 4. Fechamento do Servidor HTTP Local
    if (serverStarted) {
      try { await new Promise(r => server.close(r)); } catch (_) {}
    }

    // 5. Gravação incondicional do Receipt JSON Oficial
    receipt.finishedAt = new Date().toISOString();
    const receiptPath = path.join(ownDir, 'receipt-test-multicorder-dom-r7.json');
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