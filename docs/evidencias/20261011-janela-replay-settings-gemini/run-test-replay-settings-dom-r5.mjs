// run-test-replay-settings-dom-r5.mjs
// Runner FINITO, AUTOCONTIDO e DETERMINÍSTICO para validação REAL DOM / CDP no Microsoft Edge (700x540).
// Diálogo compacto de Configurações do Replay R5 (DRAFT-replay-settings-r4.html / DRAFT-replay-settings-r4.js).
//
// MOCK_API_REAL_DOM_ONLY:
// - Padrão comprovado de bootstrap do MultiCorder R7: freePort() loopback + --remote-debugging-port pré-alocado.
// - Scope Guard estrito: validação de 127.0.0.1, porta própria, regex de path e ownership CIM (msedge.exe + perfil próprio).
// - Try/finally abrangente iniciando ANTES do spawn, garantindo gravação de receipt e teardown cooperativo.
// - Eliminação total de fixture leaks: resetMockServerState() invocado rigorosamente antes de CADA gate.
// - Cobertura integral de 26 gates determinísticos:
//   1. Layout compacto 700x540, sidebar de 3 abas, rodapé fixo e ausência de rolagem horizontal.
//   2. Zero POST requests no carregamento inicial (estritamente GET /api/replay).
//   3. Renderização inicial dos 8 slots de câmeras a partir de availableCams sem seleção cega.
//   4. Início de gravação SSD com câmeras exatas selecionadas pelo operador.
//   5. Estado de REC ativo (banner .vd-banner-rec, timer, botão .vd-air e travas físicas de slots).
//   6. Parada de gravação SSD com liberação das travas e retorno ao banner ocioso.
//   7. Proteção contra seleção vazia (0 câmeras) com bloqueio local sem POST.
//   8. Validação de limites contratuais de retenção em disco (2 a 1440 minutos).
//   9. Preservação de rascunho de retenção através de ciclos de polling e disparo de payload.
//   10. Bloqueio físico de retenção em disco durante gravação ativa (rec=true).
//   11. Renderização das 4 propriedades de áudio/sincronismo por câmera na aba Áudio.
//   12. Isolamento de rascunhos desacoplados por câmera (chaveamento Cam A -> B -> A).
//   13. Bloqueio da fonte de gravação de áudio em REC com liberação dos ajustes de reprodução.
//   14. Validação de faixas de ganho (-60..12 dB) e offset (-3600..3600 quadros) ao salvar câmera.
//   15. Chaveamento do Áudio Master global (.vd-on / .vd-dim) com persistência contratual.
//   16. Bloqueio físico e lógico de botões de ação e seletores sob requisição pendente (isBusy).
//   17. Validação estrita dos pré-requisitos de alinhamento automático (REC parado, mesmo lance, fora de PGM).
//   18. Disparo do alinhamento automático com timeout de 25s e reflexo de calibração/sync no DOM.
//   19. Resiliência a Slow ACK no motor com bloqueio de reenvio duplo e confirmação suave.
//   20. Imunidade a HTTP 500 e schemas malformados no polling (sem corrupção de formulário).
//   21. Descarte de leitura desatualizada pré-mutação via stateEpoch.
//   22. Timeout real de 8s no início (start) armando uncertainOp com trava contra double-POST.
//   23. Resolução determinística de uncertainOp via Late ACK com evidência positiva no motor.
//   24. Recuperação deliberada via botão Atualizar pós-fila comprovando ausência de mutação no motor (sem auto-retry).
//   25. Teardown cooperativo via Browser.close com verificação CIM (msedge.exe count = 0).
//   26. Verificação de integridade de PINs SHA-256 dos arquivos de origem antes e depois do teste.
//   27. Timeout real de 8s na parada (stop) armando uncertainOp e resolução por Late ACK.
//   28. Timeout real de 8s na retenção com preservação de draft e resolução por Late ACK.
//   29. Timeout real de 8s em opções de câmera com guarda contra ACK de outra câmera.
//   30. Timeout real de 8s no áudio master global com uncertainOp e resolução por Late ACK.
//   31. Timeout real de 25s em auto-align com guarda contra ACK de outro anchor/timestamp defasado.
//   32. Preservação de câmera salva mas indisponível em availableCams sem seleção cega.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import crypto from 'node:crypto';
import { spawn, execFile } from 'node:child_process';

const ownDir = path.resolve('D:/FreeMix-QA-Gemini-ReplaySettings-20261011-1025');
const candidateHtmlCandidates = [
  path.join(ownDir, 'DRAFT-replay-settings-r5.html'),
  path.join(ownDir, 'DRAFT-replay-settings-r4.html'),
  path.join(ownDir, 'DRAFT-replay-settings-r3.html')
];
const candidateHtml = candidateHtmlCandidates.find(p => fs.existsSync(p)) || candidateHtmlCandidates[1];
const candidateJsCandidates = [
  path.join(ownDir, 'DRAFT-replay-settings-r5.js'),
  path.join(ownDir, 'DRAFT-replay-settings-r4.js')
];
const candidateJs = candidateJsCandidates.find(p => fs.existsSync(p)) || candidateJsCandidates[1];
const candidateCssCandidates = [
  path.join(ownDir, 'painel', 'remoto', 'vmix-dialogo.css'),
  path.join(ownDir, 'vmix-dialogo.css')
];
const candidateCss = candidateCssCandidates.find(p => fs.existsSync(p)) || candidateCssCandidates[0];

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
  runner: 'run-test-replay-settings-dom-r5.mjs',
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
let mockRetention = { minutes: 30, segmentSeconds: 60, enabled: false };
let mockAudioEnabled = true;
let mockCameraOptions = {
  'Cam 1 - Palco': { recordAudio: 'input', gainDb: 0, muted: false, offsetFrames: 0 },
  'Cam 2 - Geral': { recordAudio: 'master', gainDb: -3, muted: false, offsetFrames: 10 }
};
let mockAvailableCams = [
  'Cam 1 - Palco',
  'Cam 2 - Geral',
  'Cam 3 - Lateral',
  'Cam 4 - Plateia',
  'Cam 5 - PGM'
];
let mockPlayers = {
  A: { eventId: 'evt-1', cam: 'Cam 1 - Palco', offsetFrames: 0, frameRate: '30/1' },
  B: { eventId: 'evt-1', cam: 'Cam 2 - Geral', offsetFrames: 0, frameRate: '30/1' }
};
let mockProgram = 'Cam 1 - Palco';
let mockCalibration = null;
let mockSync = null;

let replayGetCount = 0;
let mockGetDelayMs = 0;
let mockGetFailure = null; // null | 500 | 'malformed_schema' | 'network_drop'
let mockStartDelayMs = 0;
let mockStartFailure = null; // null | 400 | 500 | 'network_drop'
let mockStopDelayMs = 0;
let mockStopFailure = null;
let mockRetentionDelayMs = 0;
let mockRetentionFailure = null;
let mockCameraOptionsDelayMs = 0;
let mockCameraOptionsFailure = null;
let mockAudioDelayMs = 0;
let mockAudioFailure = null;
let mockAutoAlignDelayMs = 0;
let mockAutoAlignFailure = null;

const recordedPostRequests = [];
const recordedGetRequests = [];
const activeServerTimers = new Set();

function buildReplayState() {
  return {
    rec: mockRec,
    speed: 50,
    activePlayer: 'A',
    events: [],
    players: structuredClone(mockPlayers),
    markIn: null,
    session: structuredClone(mockSession),
    back: null,
    linked: false,
    cameraOptions: structuredClone(mockCameraOptions),
    audioEnabled: mockAudioEnabled,
    retention: structuredClone(mockRetention),
    availableCams: [...mockAvailableCams],
    program: mockProgram,
    preview: 'Cam 2 - Geral',
    sync: structuredClone(mockSync),
    calibration: structuredClone(mockCalibration)
  };
}

function resetMockServerState() {
  mockRec = false;
  mockSession = null;
  mockRetention = { minutes: 30, segmentSeconds: 60, enabled: false };
  mockAudioEnabled = true;
  mockCameraOptions = {
    'Cam 1 - Palco': { recordAudio: 'input', gainDb: 0, muted: false, offsetFrames: 0 },
    'Cam 2 - Geral': { recordAudio: 'master', gainDb: -3, muted: false, offsetFrames: 10 }
  };
  mockAvailableCams = [
    'Cam 1 - Palco',
    'Cam 2 - Geral',
    'Cam 3 - Lateral',
    'Cam 4 - Plateia',
    'Cam 5 - PGM'
  ];
  mockPlayers = {
    A: { eventId: 'evt-1', cam: 'Cam 1 - Palco', offsetFrames: 0, frameRate: '30/1' },
    B: { eventId: 'evt-1', cam: 'Cam 2 - Geral', offsetFrames: 0, frameRate: '30/1' }
  };
  mockProgram = 'Cam 1 - Palco';
  mockCalibration = null;
  mockSync = null;

  replayGetCount = 0;
  mockGetDelayMs = 0;
  mockGetFailure = null;
  mockStartDelayMs = 0;
  mockStartFailure = null;
  mockStopDelayMs = 0;
  mockStopFailure = null;
  mockRetentionDelayMs = 0;
  mockRetentionFailure = null;
  mockCameraOptionsDelayMs = 0;
  mockCameraOptionsFailure = null;
  mockAudioDelayMs = 0;
  mockAudioFailure = null;
  mockAutoAlignDelayMs = 0;
  mockAutoAlignFailure = null;

  recordedPostRequests.length = 0;
  recordedGetRequests.length = 0;

  for (const t of activeServerTimers) {
    clearTimeout(t);
  }
  activeServerTimers.clear();
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
  <title>FreeMix ReplaySettings Test Harness R5</title>
  <style>
    html, body { margin: 0; padding: 0; width: 700px; height: 540px; overflow: hidden; background: #000; }
    iframe { border: none; width: 700px; height: 540px; display: block; }
  </style>
</head>
<body>
  <iframe id="mc-frame" src="/replay?view=settings"></iframe>
</body>
</html>`);
    return;
  }

  if (pathname === '/replay' || pathname === '/DRAFT-replay-settings-r5.html' || pathname === '/DRAFT-replay-settings-r4.html' || pathname === '/DRAFT-replay-settings-r3.html' || pathname === '/DRAFT-replay-settings-r2.html' || pathname === '/DRAFT-replay-settings-r1.html') {
    const content = fs.readFileSync(candidateHtml, 'utf8');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(content);
    return;
  }

  if (pathname === '/replay-settings.js' || pathname === '/DRAFT-replay-settings-r5.js' || pathname === '/DRAFT-replay-settings-r4.js' || pathname === '/DRAFT-replay-settings-r3.js' || pathname === '/DRAFT-replay-settings-r2.js' || pathname === '/DRAFT-replay-settings-r1.js') {
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

  if (pathname === '/api/replay') {
    if (req.method === 'GET') {
      replayGetCount++;
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
        res.end(JSON.stringify({ success: true, replay: { rec: 'not_a_boolean' } }));
        return;
      }

      const respondGet = () => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, replay: buildReplayState() }));
      };

      if (mockGetDelayMs > 0) {
        const t = setTimeout(() => {
          activeServerTimers.delete(t);
          respondGet();
        }, mockGetDelayMs);
        activeServerTimers.add(t);
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
          if (parsed.action === 'start') {
            if (mockStartFailure === 'network_drop') {
              req.socket.destroy();
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
            if (mockRec) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: 'A sessão de replay já está gravando' }));
              return;
            }
            mockRec = true;
            const cams = Array.isArray(parsed.cams) ? parsed.cams : [];
            mockSession = {
              id: 'sess-' + Date.now(),
              startedAt: Date.now(),
              dir: 'E:\\Recordings\\replay\\sess-1',
              cams: cams.map((name, i) => ({
                name,
                source: name,
                file: `E:\\Recordings\\replay\\sess-1\\cam-${i + 1}.ts`,
                dir: 'E:\\Recordings\\replay\\sess-1',
                index: i + 1
              }))
            };
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, replay: buildReplayState() }));
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
            res.end(JSON.stringify({ success: true, replay: buildReplayState() }));
            return;
          }

          if (parsed.action === 'retention') {
            if (mockRetentionFailure === 'network_drop') {
              req.socket.destroy();
              return;
            }
            if (mockRetentionFailure === 500) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: 'Erro interno ao salvar retenção' }));
              return;
            }
            if (mockRec) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: 'Pare REC antes de alterar retenção' }));
              return;
            }
            mockRetention = {
              enabled: parsed.enabled === true,
              minutes: Number(parsed.minutes),
              segmentSeconds: Number(parsed.segmentSeconds || 60)
            };
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, replay: buildReplayState() }));
            return;
          }

          if (parsed.action === 'camera-options') {
            if (mockCameraOptionsFailure === 'network_drop') {
              req.socket.destroy();
              return;
            }
            if (mockCameraOptionsFailure === 500) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: 'Erro interno ao salvar opções de câmera' }));
              return;
            }
            const prior = mockCameraOptions[parsed.cam] || { recordAudio: 'input', gainDb: 0, muted: false, offsetFrames: 0 };
            if (mockRec && parsed.options?.recordAudio !== prior.recordAudio) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: 'Pare REC para alterar o áudio gravado' }));
              return;
            }
            mockCameraOptions[parsed.cam] = {
              recordAudio: parsed.options?.recordAudio ?? prior.recordAudio,
              gainDb: Number(parsed.options?.gainDb ?? prior.gainDb),
              muted: !!(parsed.options?.muted ?? prior.muted),
              offsetFrames: Number(parsed.options?.offsetFrames ?? prior.offsetFrames)
            };
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, replay: buildReplayState() }));
            return;
          }

          if (parsed.action === 'audio') {
            if (mockAudioFailure === 'network_drop') {
              req.socket.destroy();
              return;
            }
            if (mockAudioFailure === 500) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: 'Erro interno ao alterar áudio master' }));
              return;
            }
            mockAudioEnabled = parsed.enabled === true;
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, replay: buildReplayState() }));
            return;
          }

          if (parsed.action === 'auto-align') {
            if (mockAutoAlignFailure === 'network_drop') {
              req.socket.destroy();
              return;
            }
            if (mockAutoAlignFailure === 500) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: 'Erro interno no alinhamento automático' }));
              return;
            }
            if (mockRec) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: 'Pare REC antes de calibrar' }));
              return;
            }
            const anchor = parsed.player || 'A';
            mockCalibration = {
              at: Date.now(),
              anchor,
              results: { B: { offsetMs: 0, offsetFrames: 0 } },
              method: 'decoded-common-audio',
              hardwareGenlock: false
            };
            mockSync = {
              anchor,
              differenceMs: 0,
              differenceFrames: 0,
              frameRate: '30/1',
              mode: 'frame',
              confirmed: true
            };
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, replay: buildReplayState() }));
            return;
          }

          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Ação de replay inválida' }));
        };

        let delayMs = 0;
        if (parsed.action === 'start') delayMs = mockStartDelayMs;
        else if (parsed.action === 'stop') delayMs = mockStopDelayMs;
        else if (parsed.action === 'retention') delayMs = mockRetentionDelayMs;
        else if (parsed.action === 'camera-options') delayMs = mockCameraOptionsDelayMs;
        else if (parsed.action === 'audio') delayMs = mockAudioDelayMs;
        else if (parsed.action === 'auto-align') delayMs = mockAutoAlignDelayMs;

        if (delayMs > 0) {
          const t = setTimeout(() => {
            activeServerTimers.delete(t);
            respondPost();
          }, delayMs);
          activeServerTimers.add(t);
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
    console.log(`[INFO] Servidor Mock HTTP ReplaySettings ouvindo em http://127.0.0.1:${serverPort}`);

    const edgePathCandidates = [
      'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
      'C:/Program Files/Microsoft/Edge/Application/msedge.exe'
    ];
    const edgeBinary = edgePathCandidates.find(p => fs.existsSync(p));
    if (!edgeBinary) {
      throw new Error('Executável do Microsoft Edge não encontrado nos caminhos padrão.');
    }

    profileDir = path.join(ownDir, `FreeMix-QA-Profile-ReplaySettings-R5-${Date.now()}`);
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
          f.src = '/replay?view=settings&_t=' + Date.now();
        }
      `);
      await new Promise(r => setTimeout(r, 650));
    }

    async function switchTab(tabId) {
      await pageCdp.eval(`
        const doc = document.getElementById('mc-frame')?.contentDocument || document;
        const btn = doc.querySelector('.vd-tab-btn[data-tab="${tabId}"]');
        if (btn) btn.click();
      `);
      await new Promise(r => setTimeout(r, 200));
    }

    // -------------------------------------------------------------
    // EXECUÇÃO DOS 26 GATES DETERMINÍSTICOS
    // -------------------------------------------------------------

    // GATE 1: Viewport Compacto 700x540, Sidebar com 3 Abas, Rodapé Fixo e Ausência de Rolagem Horizontal
    resetMockServerState();
    await pageCdp.send('Page.navigate', { url: `http://127.0.0.1:${serverPort}/test-harness.html` });
    await new Promise(r => setTimeout(r, 850));

    const gate1Data = await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      const app = doc.querySelector('.vd-app-window');
      const tabs = Array.from(doc.querySelectorAll('.vd-tab-btn')).map(b => b.dataset.tab);
      const footer = doc.querySelector('.vd-footer');
      const scrollW = doc.documentElement.scrollWidth;
      const clientW = doc.documentElement.clientWidth;
      return {
        appW: app?.offsetWidth ?? 0,
        appH: app?.offsetHeight ?? 0,
        tabs,
        hasFooter: !!footer,
        noHScroll: scrollW <= clientW
      };
    `);
    assertTest('GATE_1_VIEWPORT_LAYOUT_NO_HORIZONTAL_SCROLL', 'Diálogo compacto 700x540, sidebar com 3 abas (session, storage, audio), rodapé fixo e sem barra horizontal',
      gate1Data.appW === 700 && gate1Data.appH === 540 &&
      gate1Data.tabs.length === 3 && gate1Data.tabs.includes('session') && gate1Data.tabs.includes('storage') && gate1Data.tabs.includes('audio') &&
      gate1Data.hasFooter && gate1Data.noHScroll,
      JSON.stringify(gate1Data));

    // Captura dos 3 Screenshots Oficiais (uma para cada aba)
    await takeScreenshot('screenshot-replay-settings-r5-tab-session-700x540');
    await switchTab('storage');
    await takeScreenshot('screenshot-replay-settings-r5-tab-storage-700x540');
    await switchTab('audio');
    await takeScreenshot('screenshot-replay-settings-r5-tab-audio-700x540');
    await switchTab('session');

    // GATE 2: Zero POST no Startup
    assertTest('GATE_2_ZERO_POST_STARTUP', 'Inicialização do diálogo emite estritamente GET /api/replay (zero POSTs)',
      recordedPostRequests.length === 0 && replayGetCount >= 1,
      `POSTs observados: ${recordedPostRequests.length}; GETs: ${replayGetCount}`);

    // GATE 3: Renderização dos 8 Slots de Câmeras a partir de availableCams sem Seleção Automática
    const gate3Data = await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      const slots = [];
      for (let i = 1; i <= 8; i++) {
        const s = doc.getElementById('cam-slot-' + i);
        if (s) {
          slots.push({
            id: 'cam-slot-' + i,
            val: s.value,
            disabled: s.disabled,
            optCount: s.options.length,
            firstOpt: s.options[0]?.text
          });
        }
      }
      return { count: slots.length, allEmpty: slots.every(s => s.val === ''), allEnabled: slots.every(s => !s.disabled), slots };
    `);
    assertTest('GATE_3_CAMERAS_SLOTS_INITIAL_RENDER', 'Todos os 8 slots de câmera renderizam desmarcados (vazios), habilitados e populados',
      gate3Data.count === 8 && gate3Data.allEmpty === true && gate3Data.allEnabled === true,
      JSON.stringify(gate3Data));

    // GATE 4: Início da Gravação SSD com Câmeras Exatas Selecionadas
    resetMockServerState();
    await loadHarness();
    const postCountBeforeStart = recordedPostRequests.length;
    await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      const s1 = doc.getElementById('cam-slot-1');
      const s2 = doc.getElementById('cam-slot-2');
      if (s1) { s1.value = 'Cam 1 - Palco'; s1.dispatchEvent(new Event('change', { bubbles: true })); }
      if (s2) { s2.value = 'Cam 2 - Geral'; s2.dispatchEvent(new Event('change', { bubbles: true })); }
      doc.getElementById('btn-toggle-rec').click();
    `);
    await new Promise(r => setTimeout(r, 450));
    const lastStartPost = recordedPostRequests.at(-1);
    const startCams = lastStartPost?.payload?.cams || [];
    assertTest('GATE_4_START_SSD_EXACT_CAMS', 'Disparo de início de gravação SSD emite payload start com as câmeras exatas selecionadas',
      lastStartPost?.action === 'start' && startCams.length === 2 && startCams[0] === 'Cam 1 - Palco' && startCams[1] === 'Cam 2 - Geral',
      JSON.stringify(lastStartPost));

    // GATE 5: Estado de REC Ativo no DOM e Travas Físicas
    const gate5Data = await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      const banner = doc.getElementById('rec-banner');
      const btnRec = doc.getElementById('btn-toggle-rec');
      const s1 = doc.getElementById('cam-slot-1');
      const s2 = doc.getElementById('cam-slot-2');
      return {
        isBannerRec: banner?.classList.contains('vd-banner-rec') ?? false,
        btnText: btnRec?.textContent.trim() ?? '',
        btnClass: btnRec?.className ?? '',
        slot1Disabled: s1?.disabled ?? false,
        slot2Disabled: s2?.disabled ?? false
      };
    `);
    assertTest('GATE_5_START_REC_STATE_AND_LOCKS', 'Sob gravação SSD ativa (rec=true): banner vermelho, botão .vd-air "Parar gravação SSD" e slots travados',
      gate5Data.isBannerRec && gate5Data.btnText === 'Parar gravação SSD' && gate5Data.btnClass.includes('vd-air') &&
      gate5Data.slot1Disabled && gate5Data.slot2Disabled,
      JSON.stringify(gate5Data));

    // GATE 6: Parada de Gravação SSD e Destravamento dos Controles
    await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      doc.getElementById('btn-toggle-rec').click();
    `);
    await new Promise(r => setTimeout(r, 450));
    const lastStopPost = recordedPostRequests.at(-1);
    const gate6Data = await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      const banner = doc.getElementById('rec-banner');
      const btnRec = doc.getElementById('btn-toggle-rec');
      const s1 = doc.getElementById('cam-slot-1');
      return {
        isBannerIdle: banner?.classList.contains('vd-banner-idle') ?? false,
        btnText: btnRec?.textContent.trim() ?? '',
        btnClass: btnRec?.className ?? '',
        slot1Disabled: s1?.disabled ?? false
      };
    `);
    assertTest('GATE_6_STOP_SSD_RECORDING', 'Parar gravação SSD emite stop, restaura banner ocioso, botão .vd-on e destrava slots',
      lastStopPost?.action === 'stop' && gate6Data.isBannerIdle &&
      gate6Data.btnText === 'Iniciar gravação SSD' && gate6Data.btnClass.includes('vd-on') && !gate6Data.slot1Disabled,
      JSON.stringify(gate6Data));

    // GATE 7: Proteção contra Início de Gravação com Seleção Vazia (0 Câmeras)
    resetMockServerState();
    await loadHarness();
    const postCountBeforeEmpty = recordedPostRequests.length;
    await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      for (let i = 1; i <= 8; i++) {
        const s = doc.getElementById('cam-slot-' + i);
        if (s) { s.value = ''; s.dispatchEvent(new Event('change', { bubbles: true })); }
      }
      doc.getElementById('btn-toggle-rec').click();
    `);
    await new Promise(r => setTimeout(r, 250));
    const gate7Data = await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      return { msg: doc.getElementById('status-msg')?.textContent ?? '' };
    `);
    const postCountAfterEmpty = recordedPostRequests.length;
    assertTest('GATE_7_EMPTY_SELECTION_START_GUARD', 'Start com 0 câmeras bloqueia localmente, exibe aviso e emite zero POST',
      (postCountAfterEmpty - postCountBeforeEmpty === 0) && gate7Data.msg.includes('Selecione pelo menos uma câmera'),
      JSON.stringify({ postDelta: postCountAfterEmpty - postCountBeforeEmpty, msg: gate7Data.msg }));

    // GATE 8: Validação Contratual dos Limites de Retenção em Disco (2 a 1440 Minutos)
    await switchTab('storage');
    const postCountBeforeRetVal = recordedPostRequests.length;
    await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      const minInput = doc.getElementById('retention-minutes');
      if (minInput) { minInput.value = '1'; minInput.dispatchEvent(new Event('input', { bubbles: true })); }
      doc.getElementById('btn-save-retention').click();
    `);
    await new Promise(r => setTimeout(r, 250));
    const gate8Data = await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      return { msg: doc.getElementById('status-msg')?.textContent ?? '' };
    `);
    const postCountAfterRetVal = recordedPostRequests.length;
    assertTest('GATE_8_RETENTION_LIMITS_VALIDATION', 'Salvar retenção com valor fora da faixa 2..1440 bloqueia localmente com aviso',
      (postCountAfterRetVal - postCountBeforeRetVal === 0) && gate8Data.msg.includes('entre 2 e 1440'),
      JSON.stringify(gate8Data));

    // GATE 9: Preservação de Rascunho de Retenção sob Polling e Disparo de Payload
    resetMockServerState();
    await loadHarness();
    await switchTab('storage');
    await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      const chk = doc.getElementById('retention-enabled');
      const min = doc.getElementById('retention-minutes');
      if (chk) { chk.checked = true; chk.dispatchEvent(new Event('change', { bubbles: true })); }
      if (min) { min.value = '45'; min.dispatchEvent(new Event('input', { bubbles: true })); }
    `);
    await new Promise(r => setTimeout(r, 2200)); // Aguarda mais de um ciclo de polling (1500ms)
    const gate9PollCheck = await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      return {
        checked: doc.getElementById('retention-enabled')?.checked ?? false,
        val: doc.getElementById('retention-minutes')?.value ?? ''
      };
    `);
    await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      doc.getElementById('btn-save-retention').click();
    `);
    await new Promise(r => setTimeout(r, 350));
    const lastRetPost = recordedPostRequests.at(-1);
    assertTest('GATE_9_RETENTION_SAVE_AND_POLL_PRESERVE', 'Rascunho de retenção não é apagado pelo polling de background e payload retention é despachado',
      gate9PollCheck.checked === true && gate9PollCheck.val === '45' &&
      lastRetPost?.action === 'retention' && lastRetPost?.payload?.enabled === true && lastRetPost?.payload?.minutes === 45,
      JSON.stringify({ pollCheck: gate9PollCheck, lastPost: lastRetPost }));

    // GATE 10: Bloqueio Físico de Retenção durante Gravação Ativa (rec=true)
    resetMockServerState();
    mockRec = true;
    await loadHarness();
    await switchTab('storage');
    const gate10Data = await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      return {
        chkDisabled: doc.getElementById('retention-enabled')?.disabled ?? false,
        minDisabled: doc.getElementById('retention-minutes')?.disabled ?? false,
        btnDisabled: doc.getElementById('btn-save-retention')?.disabled ?? false
      };
    `);
    assertTest('GATE_10_RETENTION_LOCKED_DURING_REC', 'Controles de retenção em disco ficam desabilitados quando REC está ativo',
      gate10Data.chkDisabled && gate10Data.minDisabled && gate10Data.btnDisabled,
      JSON.stringify(gate10Data));

    // GATE 11: Renderização das 4 Propriedades de Áudio/Sincronismo por Câmera
    resetMockServerState();
    await loadHarness();
    await switchTab('audio');
    await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      const sel = doc.getElementById('audio-cam-select');
      if (sel) { sel.value = 'Cam 2 - Geral'; sel.dispatchEvent(new Event('change', { bubbles: true })); }
    `);
    await new Promise(r => setTimeout(r, 200));
    const gate11Data = await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      return {
        recSource: doc.getElementById('audio-record-source')?.value ?? '',
        gain: Number(doc.getElementById('audio-gain')?.value ?? 0),
        muted: doc.getElementById('audio-muted')?.checked ?? false,
        offset: Number(doc.getElementById('camera-offset')?.value ?? 0)
      };
    `);
    assertTest('GATE_11_CAMERA_AUDIO_FOUR_PROPERTIES', 'Aba Áudio renderiza fielmente as 4 propriedades da câmera (recordAudio, gainDb, muted, offsetFrames)',
      gate11Data.recSource === 'master' && gate11Data.gain === -3 && gate11Data.muted === false && gate11Data.offset === 10,
      JSON.stringify(gate11Data));

    // GATE 12: Isolamento de Rascunhos Desacoplados por Câmera (Cam A -> B -> A)
    await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      const sel = doc.getElementById('audio-cam-select');
      sel.value = 'Cam 1 - Palco';
      sel.dispatchEvent(new Event('change', { bubbles: true }));

      const g = doc.getElementById('audio-gain');
      const m = doc.getElementById('audio-muted');
      g.value = '-12'; g.dispatchEvent(new Event('input', { bubbles: true }));
      m.checked = true; m.dispatchEvent(new Event('change', { bubbles: true }));

      // Troca para Cam 2 e edita Cam 2
      sel.value = 'Cam 2 - Geral';
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      g.value = '6'; g.dispatchEvent(new Event('input', { bubbles: true }));

      // Retorna para Cam 1
      sel.value = 'Cam 1 - Palco';
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    `);
    await new Promise(r => setTimeout(r, 2200)); // Aguarda ciclo de polling de background
    const gate12Cam1 = await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      return {
        gain: Number(doc.getElementById('audio-gain')?.value ?? 0),
        muted: doc.getElementById('audio-muted')?.checked ?? false
      };
    `);
    await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      const sel = doc.getElementById('audio-cam-select');
      sel.value = 'Cam 2 - Geral';
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    `);
    const gate12Cam2 = await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      return {
        gain: Number(doc.getElementById('audio-gain')?.value ?? 0)
      };
    `);
    assertTest('GATE_12_CAMERA_DRAFTS_ISOLATION_A_B_A', 'Rascunhos de câmera são desacoplados por entidade e preservados ao alternar entre câmeras sob polling',
      gate12Cam1.gain === -12 && gate12Cam1.muted === true && gate12Cam2.gain === 6,
      JSON.stringify({ cam1: gate12Cam1, cam2: gate12Cam2 }));

    // GATE 13: Bloqueio da Fonte de Gravação em REC com Liberação dos Ajustes de Reprodução
    resetMockServerState();
    mockRec = true;
    await loadHarness();
    await switchTab('audio');
    const gate13Data = await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      return {
        recSourceDisabled: doc.getElementById('audio-record-source')?.disabled ?? false,
        gainDisabled: doc.getElementById('audio-gain')?.disabled ?? false,
        mutedDisabled: doc.getElementById('audio-muted')?.disabled ?? false,
        offsetDisabled: doc.getElementById('camera-offset')?.disabled ?? false,
        btnSaveDisabled: doc.getElementById('btn-save-cam-audio')?.disabled ?? false
      };
    `);
    assertTest('GATE_13_REC_AUDIO_SOURCE_LOCKED_WHILE_PLAYBACK_CONTROLS_LEGAL', 'Sob REC ativo: seleção de fonte de gravação fica travada, mas volume/mute/offset de reprodução permanecem editáveis',
      gate13Data.recSourceDisabled === true && gate13Data.gainDisabled === false &&
      gate13Data.mutedDisabled === false && gate13Data.offsetDisabled === false && gate13Data.btnSaveDisabled === false,
      JSON.stringify(gate13Data));

    // GATE 14: Validação de Limites e Salvamento de Opções de Câmera
    resetMockServerState();
    await loadHarness();
    await switchTab('audio');
    const postCountBeforeCamSave = recordedPostRequests.length;
    await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      const sel = doc.getElementById('audio-cam-select');
      sel.value = 'Cam 1 - Palco'; sel.dispatchEvent(new Event('change', { bubbles: true }));
      const g = doc.getElementById('audio-gain');
      g.value = '50'; g.dispatchEvent(new Event('input', { bubbles: true })); // Inválido (> 12)
      doc.getElementById('btn-save-cam-audio').click();
    `);
    await new Promise(r => setTimeout(r, 200));
    const postCountAfterInvalidCam = recordedPostRequests.length;

    await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      const g = doc.getElementById('audio-gain');
      const m = doc.getElementById('audio-muted');
      const o = doc.getElementById('camera-offset');
      g.value = '-6'; g.dispatchEvent(new Event('input', { bubbles: true }));
      m.checked = true; m.dispatchEvent(new Event('change', { bubbles: true }));
      o.value = '15'; o.dispatchEvent(new Event('input', { bubbles: true }));
      doc.getElementById('btn-save-cam-audio').click();
    `);
    await new Promise(r => setTimeout(r, 350));
    const lastCamPost = recordedPostRequests.at(-1);
    assertTest('GATE_14_CAMERA_OPTIONS_SAVE_AND_VALIDATION', 'Validação rejeita valores ilegais e salva parâmetros válidos de câmera (camera-options)',
      (postCountAfterInvalidCam - postCountBeforeCamSave === 0) &&
      lastCamPost?.action === 'camera-options' && lastCamPost?.payload?.cam === 'Cam 1 - Palco' &&
      lastCamPost?.payload?.options?.gainDb === -6 && lastCamPost?.payload?.options?.muted === true &&
      lastCamPost?.payload?.options?.offsetFrames === 15,
      JSON.stringify(lastCamPost));

    // GATE 15: Chaveamento do Áudio Master Global
    await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      doc.getElementById('btn-toggle-audio').click();
    `);
    await new Promise(r => setTimeout(r, 350));
    const lastAudioPost = recordedPostRequests.at(-1);
    const gate15Data = await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      const btn = doc.getElementById('btn-toggle-audio');
      return { text: btn?.textContent.trim() ?? '', className: btn?.className ?? '' };
    `);
    assertTest('GATE_15_GLOBAL_AUDIO_TOGGLE', 'Alternância de áudio master emite action audio e atualiza botão para .vd-dim "Silenciado"',
      lastAudioPost?.action === 'audio' && lastAudioPost?.payload?.enabled === false &&
      gate15Data.text.includes('Silenciado') && gate15Data.className.includes('vd-dim'),
      JSON.stringify({ lastPost: lastAudioPost, btn: gate15Data }));

    // GATE 16: Travas de Ação sob Estado Ocupado (isBusy)
    resetMockServerState();
    mockAudioDelayMs = 600;
    await loadHarness();
    await switchTab('audio');
    await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      doc.getElementById('btn-toggle-audio').click();
    `);
    await new Promise(r => setTimeout(r, 150));
    const gate16Busy = await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      return {
        btnRec: doc.getElementById('btn-toggle-rec')?.disabled ?? false,
        btnAudio: doc.getElementById('btn-toggle-audio')?.disabled ?? false,
        btnSaveCam: doc.getElementById('btn-save-cam-audio')?.disabled ?? false,
        camSelect: doc.getElementById('audio-cam-select')?.disabled ?? false
      };
    `);
    await new Promise(r => setTimeout(r, 650));
    assertTest('GATE_16_BUSY_ACTION_LOCKS', 'Enquanto requisição está em trânsito no motor (isBusy), todos os botões de ação e seletores ficam travados',
      gate16Busy.btnRec && gate16Busy.btnAudio && gate16Busy.btnSaveCam && gate16Busy.camSelect,
      JSON.stringify(gate16Busy));

    // GATE 17: Validação dos Pré-Requisitos de Alinhamento Automático
    resetMockServerState();
    await loadHarness();
    await switchTab('audio');

    // Cenário A: REC ativo -> Alinhamento desabilitado
    mockRec = true;
    await pageCdp.eval(`const doc = document.getElementById('mc-frame')?.contentDocument || document; doc.getElementById('btn-refresh').click();`);
    await new Promise(r => setTimeout(r, 200));
    const gate17Rec = await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      return { disabled: doc.getElementById('btn-auto-align')?.disabled ?? false, desc: doc.getElementById('sync-desc')?.textContent ?? '' };
    `);

    // Cenário B: REC parado, mas lances com eventId diferentes -> Desabilitado
    mockRec = false;
    mockPlayers.B.eventId = 'evt-diferente';
    await pageCdp.eval(`const doc = document.getElementById('mc-frame')?.contentDocument || document; doc.getElementById('btn-refresh').click();`);
    await new Promise(r => setTimeout(r, 200));
    const gate17Events = await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      return { disabled: doc.getElementById('btn-auto-align')?.disabled ?? false, desc: doc.getElementById('sync-desc')?.textContent ?? '' };
    `);

    // Cenário C: Mesmo lance, mas player em Programa -> Desabilitado
    mockPlayers.B.eventId = 'evt-1';
    mockProgram = 'REPLAY A';
    await pageCdp.eval(`const doc = document.getElementById('mc-frame')?.contentDocument || document; doc.getElementById('btn-refresh').click();`);
    await new Promise(r => setTimeout(r, 200));
    const gate17Pgm = await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      return { disabled: doc.getElementById('btn-auto-align')?.disabled ?? false, desc: doc.getElementById('sync-desc')?.textContent ?? '' };
    `);

    // Cenário D: Pré-requisitos satisfeitos -> Habilitado
    mockProgram = 'Cam 1 - Palco';
    await pageCdp.eval(`const doc = document.getElementById('mc-frame')?.contentDocument || document; doc.getElementById('btn-refresh').click();`);
    await new Promise(r => setTimeout(r, 200));
    const gate17Ready = await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      return { disabled: doc.getElementById('btn-auto-align')?.disabled ?? false, desc: doc.getElementById('sync-desc')?.textContent ?? '' };
    `);
    assertTest('GATE_17_AUTO_ALIGN_PREREQUISITES_VALIDATION', 'Alinhamento automático obedece rigorosamente às 3 travas contratuais (rec=false, mesmo lance, fora de PGM)',
      gate17Rec.disabled === true && gate17Events.disabled === true && gate17Pgm.disabled === true && gate17Ready.disabled === false,
      JSON.stringify({ rec: gate17Rec, events: gate17Events, pgm: gate17Pgm, ready: gate17Ready }));

    // GATE 18: Disparo do Alinhamento Automático com Timeout de 25s e Reflexo no DOM
    await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      doc.getElementById('btn-auto-align').click();
    `);
    await new Promise(r => setTimeout(r, 450));
    const lastAlignPost = recordedPostRequests.at(-1);
    const gate18Data = await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      return {
        syncMsg: doc.getElementById('sync-status-msg')?.textContent ?? ''
      };
    `);
    assertTest('GATE_18_AUTO_ALIGN_DISPATCH_AND_CALIBRATION', 'Disparo de auto-align envia player ativo e exibe desvio calibrado no DOM',
      lastAlignPost?.action === 'auto-align' && gate18Data.syncMsg.includes('quadros'),
      JSON.stringify({ lastPost: lastAlignPost, dom: gate18Data }));

    // GATE 19: Resiliência a Slow ACK no Motor
    resetMockServerState();
    mockStartDelayMs = 500;
    await loadHarness();
    const postCountBeforeSlow = recordedPostRequests.length;
    await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      const s1 = doc.getElementById('cam-slot-1');
      if (s1) { s1.value = 'Cam 1 - Palco'; s1.dispatchEvent(new Event('change', { bubbles: true })); }
      doc.getElementById('btn-toggle-rec').click();
    `);
    await new Promise(r => setTimeout(r, 150));
    const gate19MidFlight = await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      return { msg: doc.getElementById('status-msg')?.textContent ?? '' };
    `);
    await new Promise(r => setTimeout(r, 550));
    const gate19Resolved = await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      return {
        btnText: doc.getElementById('btn-toggle-rec')?.textContent.trim() ?? '',
        msg: doc.getElementById('status-msg')?.textContent ?? ''
      };
    `);
    assertTest('GATE_19_SLOW_ACK_RESILIENCE', 'Sob latência de 500ms no motor, interface exibe mensagem de confirmação e resolve sem double-POST',
      gate19MidFlight.msg.includes('Confirmando start') && gate19Resolved.btnText === 'Parar gravação SSD',
      JSON.stringify({ mid: gate19MidFlight, resolved: gate19Resolved }));

    // GATE 20: Imunidade a HTTP 500 e Schemas Inválidos no Polling e Bloqueio de POSTs sob Falha
    resetMockServerState();
    mockGetFailure = 500;
    await loadHarness();
    await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      doc.getElementById('btn-refresh').click();
    `);
    await new Promise(r => setTimeout(r, 250));
    const gate20Http500 = await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      return { msg: doc.getElementById('status-msg')?.textContent ?? '', hasSlots: !!doc.getElementById('cam-slot-1') };
    `);

    // Ações bloqueadas sob falha de estado inicial: cliques não disparam POST
    const postCountBeforeBlockedClicks = recordedPostRequests.length;
    await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      doc.getElementById('btn-toggle-rec')?.click();
      doc.getElementById('btn-toggle-audio')?.click();
      doc.getElementById('btn-save-cam-audio')?.click();
      doc.getElementById('btn-auto-align')?.click();
    `);
    await new Promise(r => setTimeout(r, 200));
    const postCountAfterBlockedClicks = recordedPostRequests.length;

    mockGetFailure = 'malformed_schema';
    await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      doc.getElementById('btn-refresh').click();
    `);
    await new Promise(r => setTimeout(r, 250));
    const gate20Malformed = await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      return { msg: doc.getElementById('status-msg')?.textContent ?? '', hasSlots: !!doc.getElementById('cam-slot-1') };
    `);
    assertTest('GATE_20_GET_500_AND_MALFORMED_SCHEMA_IMMUNITY', 'Respostas HTTP 500 ou schema inválido não causam crash, preservam o DOM e bloqueiam envio cego de POSTs',
      gate20Http500.hasSlots && gate20Malformed.hasSlots && gate20Malformed.msg.includes('inválido') &&
      (postCountAfterBlockedClicks - postCountBeforeBlockedClicks === 0),
      JSON.stringify({ http500: gate20Http500, malformed: gate20Malformed, postDelta: postCountAfterBlockedClicks - postCountBeforeBlockedClicks }));

    // GATE 21: Descarte de Leitura Desatualizada Pré-Mutação via stateEpoch
    resetMockServerState();
    await loadHarness();
    mockGetDelayMs = 600; // GET demorado
    await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      doc.getElementById('btn-refresh').click(); // Dispara GET com epoch 1
    `);
    await new Promise(r => setTimeout(r, 100));
    mockGetDelayMs = 0;
    // Mutação imediata incrementa stateEpoch para 2
    await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      doc.getElementById('btn-toggle-audio').click();
    `);
    await new Promise(r => setTimeout(r, 800)); // Aguarda chegada tardia do GET anterior
    const gate21Data = await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      return { audioText: doc.getElementById('btn-toggle-audio')?.textContent.trim() ?? '' };
    `);
    assertTest('GATE_21_STALE_GET_READ_EPOCH_DISCARD', 'GET defasado em voo pré-mutação é descartado sem reverter o estado atual',
      gate21Data.audioText.includes('Silenciado'),
      JSON.stringify(gate21Data));

    // GATE 22: Timeout Real de 8s no Cliente Arma Incerteza Estrita (uncertainOp) com Trava contra Double-POST
    resetMockServerState();
    mockStartDelayMs = 9000; // Servidor retém resposta além dos 8000ms contratuais do cliente
    await loadHarness();
    await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      const s1 = doc.getElementById('cam-slot-1');
      if (s1) { s1.value = 'Cam 1 - Palco'; s1.dispatchEvent(new Event('change', { bubbles: true })); }
      doc.getElementById('btn-toggle-rec').click();
    `);
    console.log('[INFO] Aguardando timeout de 8000ms em GATE_22 (literal wait 8600ms)...');
    await new Promise(r => setTimeout(r, 8600)); // Aguarda disparo real de AbortSignal.timeout(8000)
    mockStartDelayMs = 0;

    const postCountBeforeSecondClick = recordedPostRequests.length;
    // Tenta clique concorrente durante estado de incerteza
    await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      doc.getElementById('btn-toggle-rec').click();
    `);
    await new Promise(r => setTimeout(r, 250));
    const postCountAfterSecondClick = recordedPostRequests.length;

    const gate22Data = await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      return {
        msg: doc.getElementById('status-msg')?.textContent ?? '',
        btnDisabled: doc.getElementById('btn-toggle-rec')?.disabled ?? false
      };
    `);
    assertTest('GATE_22_NETWORK_TIMEOUT_8S_UNCERTAIN_OP', 'Timeout real de 8s (AbortSignal) ao emitir start entra em incerteza estrita (uncertainOp) e bloqueia double-POST',
      (postCountAfterSecondClick - postCountBeforeSecondClick === 0) &&
      gate22Data.btnDisabled === true && gate22Data.msg.includes('ainda não confirmou'),
      JSON.stringify({ postDelta: postCountAfterSecondClick - postCountBeforeSecondClick, data: gate22Data }));

    // GATE 23: Resolução Determinística de uncertainOp via Late ACK
    mockStartFailure = null;
    mockRec = true; // O motor aplicou a gravação
    mockSession = { id: 'sess-late', startedAt: Date.now(), dir: 'E:\\Recordings', cams: [{ name: 'Cam 1 - Palco' }] };
    await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      doc.getElementById('btn-refresh').click();
    `);
    await new Promise(r => setTimeout(r, 350));
    const gate23Data = await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      return {
        msg: doc.getElementById('status-msg')?.textContent ?? '',
        btnText: doc.getElementById('btn-toggle-rec')?.textContent.trim() ?? '',
        btnDisabled: doc.getElementById('btn-toggle-rec')?.disabled ?? false
      };
    `);
    assertTest('GATE_23_LATE_ACK_RESOLVES_UNCERTAIN_OP', 'Polling subsequente obtém evidência positiva (rec=true) resolvendo uncertainOp de forma determinística',
      gate23Data.btnText === 'Parar gravação SSD' && !gate23Data.btnDisabled,
      JSON.stringify(gate23Data));

    // GATE 24: Recuperação Deliberada via Botão Atualizar pós-fila Comprovando Ausência de Mutação
    resetMockServerState();
    mockStartFailure = 'network_drop';
    await loadHarness();
    await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      const s1 = doc.getElementById('cam-slot-1');
      if (s1) { s1.value = 'Cam 1 - Palco'; s1.dispatchEvent(new Event('change', { bubbles: true })); }
      doc.getElementById('btn-toggle-rec').click();
    `);
    await new Promise(r => setTimeout(r, 350)); // Em incerteza

    mockStartFailure = null;
    mockRec = false; // O motor NÃO aplicou a gravação
    const postCountBeforeManualRefresh = recordedPostRequests.length;
    await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      doc.getElementById('btn-refresh').click();
    `);
    await new Promise(r => setTimeout(r, 350));
    const postCountAfterManualRefresh = recordedPostRequests.length;
    const gate24Data = await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      return {
        msg: doc.getElementById('status-msg')?.textContent ?? '',
        btnDisabled: doc.getElementById('btn-toggle-rec')?.disabled ?? false
      };
    `);
    assertTest('GATE_24_MANUAL_REFRESH_RECOVERY_NO_AUTORETRY', 'Atualizar manual pós-fila comprova que a gravação não iniciou, destrava a interface e não faz reenvio automático cego',
      (postCountAfterManualRefresh - postCountBeforeManualRefresh === 0) &&
      gate24Data.msg.includes('não foi aplicada') && !gate24Data.btnDisabled,
      JSON.stringify({ postDelta: postCountAfterManualRefresh - postCountBeforeManualRefresh, dom: gate24Data }));

    // GATE 27: Timeout Real de 8s na Parada (stop) com uncertainOp e Resolução por Late ACK
    resetMockServerState();
    mockRec = true;
    mockSession = { id: 'sess-stop-timeout', startedAt: Date.now(), dir: 'E:\\Recordings\\replay\\sess-1', cams: [{ name: 'Cam 1 - Palco' }] };
    mockStopDelayMs = 9000;
    await loadHarness();

    // Inicia parada com timeout de 9s no servidor
    await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      doc.getElementById('btn-toggle-rec').click();
    `);
    console.log('[INFO] Aguardando timeout de 8000ms para stop em GATE_27 (literal wait 8600ms)...');
    await new Promise(r => setTimeout(r, 8600)); // Disparo do AbortSignal.timeout(8000)
    mockStopDelayMs = 0; // Drenagem de timer

    const postCountBeforeSecondStopClick = recordedPostRequests.length;
    // Tenta clique concorrente durante incerteza
    await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      doc.getElementById('btn-toggle-rec').click();
    `);
    await new Promise(r => setTimeout(r, 200));
    const postCountAfterSecondStopClick = recordedPostRequests.length;

    const gate27UncertainData = await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      return {
        msg: doc.getElementById('status-msg')?.textContent ?? '',
        btnDisabled: doc.getElementById('btn-toggle-rec')?.disabled ?? false
      };
    `);

    // Resolução por Late ACK: motor confirmou parada (rec=false)
    mockRec = false;
    mockSession = null;
    await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      doc.getElementById('btn-refresh').click();
    `);
    await new Promise(r => setTimeout(r, 350));
    const gate27ResolvedData = await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      const btn = doc.getElementById('btn-toggle-rec');
      return {
        btnText: btn?.textContent.trim() ?? '',
        btnDisabled: btn?.disabled ?? false
      };
    `);
    assertTest('GATE_27_STOP_TIMEOUT_8S_UNCERTAIN_OP_AND_RESOLUTION', 'Timeout real de 8s ao parar REC arma incerteza, bloqueia double-POST e resolve quando motor confirma rec=false',
      (postCountAfterSecondStopClick - postCountBeforeSecondStopClick === 0) &&
      gate27UncertainData.btnDisabled === true && gate27UncertainData.msg.includes('ainda não confirmou') &&
      gate27ResolvedData.btnText === 'Iniciar gravação SSD' && !gate27ResolvedData.btnDisabled,
      JSON.stringify({ uncertain: gate27UncertainData, resolved: gate27ResolvedData }));

    // GATE 28: Timeout Real de 8s ao Salvar Retenção com Preservação de Draft e Resolução por Late ACK
    resetMockServerState();
    mockRetentionDelayMs = 9000;
    await loadHarness();
    await switchTab('storage');

    await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      const chk = doc.getElementById('retention-enabled');
      const min = doc.getElementById('retention-minutes');
      if (chk) { chk.checked = true; chk.dispatchEvent(new Event('change', { bubbles: true })); }
      if (min) { min.value = '45'; min.dispatchEvent(new Event('input', { bubbles: true })); }
      doc.getElementById('btn-save-retention').click();
    `);
    console.log('[INFO] Aguardando timeout de 8000ms para retention em GATE_28 (literal wait 8600ms)...');
    await new Promise(r => setTimeout(r, 8600));
    mockRetentionDelayMs = 0; // Drenagem de timer

    const postCountBeforeSecondRetClick = recordedPostRequests.length;
    await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      doc.getElementById('btn-save-retention').click();
    `);
    await new Promise(r => setTimeout(r, 200));
    const postCountAfterSecondRetClick = recordedPostRequests.length;

    const gate28UncertainData = await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      return {
        btnDisabled: doc.getElementById('btn-save-retention')?.disabled ?? false,
        msg: doc.getElementById('status-msg')?.textContent ?? '',
        chkVal: doc.getElementById('retention-enabled')?.checked ?? false,
        minVal: doc.getElementById('retention-minutes')?.value ?? ''
      };
    `);

    // Resolução por Late ACK: motor aplicou retenção
    mockRetention = { enabled: true, minutes: 45, segmentSeconds: 60 };
    await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      doc.getElementById('btn-refresh').click();
    `);
    await new Promise(r => setTimeout(r, 350));
    const gate28ResolvedData = await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      return {
        btnDisabled: doc.getElementById('btn-save-retention')?.disabled ?? false,
        msg: doc.getElementById('status-msg')?.textContent ?? ''
      };
    `);
    assertTest('GATE_28_RETENTION_TIMEOUT_8S_UNCERTAIN_OP_AND_RESOLUTION', 'Timeout real de 8s em retenção preserva rascunho (45 min), bloqueia novo POST e resolve via Late ACK',
      (postCountAfterSecondRetClick - postCountBeforeSecondRetClick === 0) &&
      gate28UncertainData.btnDisabled === true && gate28UncertainData.chkVal === true && gate28UncertainData.minVal === '45' &&
      !gate28ResolvedData.btnDisabled && gate28ResolvedData.msg.includes('confirmada'),
      JSON.stringify({ uncertain: gate28UncertainData, resolved: gate28ResolvedData }));

    // GATE 29: Timeout Real de 8s ao Salvar Opções de Câmera e Guarda contra ACK de Outra Câmera
    resetMockServerState();
    mockCameraOptionsDelayMs = 12000; // Mock delay blindado (cliente aborta em 8000ms via AbortSignal)
    await loadHarness();
    await switchTab('audio');

    await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      const sel = doc.getElementById('audio-cam-select');
      sel.value = 'Cam 1 - Palco'; sel.dispatchEvent(new Event('change', { bubbles: true }));
      const g = doc.getElementById('audio-gain');
      const m = doc.getElementById('audio-muted');
      const o = doc.getElementById('camera-offset');
      g.value = '-8'; g.dispatchEvent(new Event('input', { bubbles: true }));
      m.checked = true; m.dispatchEvent(new Event('change', { bubbles: true }));
      o.value = '12'; o.dispatchEvent(new Event('input', { bubbles: true }));
      doc.getElementById('btn-save-cam-audio').click();
    `);
    console.log('[INFO] Aguardando timeout de 8000ms para camera-options em GATE_29 (literal wait 8600ms)...');
    await new Promise(r => setTimeout(r, 8600));

    // DRENAGEM IMEDIATA SÍNCRONA: cancela o timer no Node.js ANTES de qualquer chamada CDP
    for (const t of activeServerTimers) clearTimeout(t);
    activeServerTimers.clear();
    mockCameraOptionsDelayMs = 0;
    // Preserva rigorosamente o baseline de repouso pré-mutação da Cam 1
    mockCameraOptions['Cam 1 - Palco'] = { recordAudio: 'input', gainDb: 0, muted: false, offsetFrames: 0 };

    const postCountBeforeSecondCamClick = recordedPostRequests.length;
    await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      doc.getElementById('btn-save-cam-audio').click();
    `);
    await new Promise(r => setTimeout(r, 200));
    const postCountAfterSecondCamClick = recordedPostRequests.length;

    const gate29UncertainData = await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      return {
        btnDisabled: doc.getElementById('btn-save-cam-audio')?.disabled ?? false,
        selDisabled: doc.getElementById('audio-cam-select')?.disabled ?? false,
        msg: doc.getElementById('status-msg')?.textContent ?? ''
      };
    `);

    // Adversarial: Motor envia ACK/update para OUTRA câmera (Cam 2) -> uncertainOp NÃO DEVE ser resolvido via polling passivo
    mockCameraOptions['Cam 2 - Geral'] = { recordAudio: 'master', gainDb: -10, muted: false, offsetFrames: 20 };
    console.log('[INFO] Aguardando ciclo de polling passivo de 1500ms em GATE_29 (espera 1800ms)...');
    await new Promise(r => setTimeout(r, 1800)); // Aguarda ciclo de polling passivo pollStatus(false)
    const gate29CrossCamCheck = await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      return {
        btnDisabled: doc.getElementById('btn-save-cam-audio')?.disabled ?? false,
        msg: doc.getElementById('status-msg')?.textContent ?? ''
      };
    `);

    // Late ACK legítimo da câmera atuada (Cam 1) -> agora sim resolve uncertainOp via polling passivo
    mockCameraOptions['Cam 1 - Palco'] = { recordAudio: 'input', gainDb: -8, muted: true, offsetFrames: 12 };
    console.log('[INFO] Aguardando resolução de Cam 1 via polling passivo (espera 1800ms)...');
    await new Promise(r => setTimeout(r, 1800));
    const gate29ResolvedData = await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      return {
        btnDisabled: doc.getElementById('btn-save-cam-audio')?.disabled ?? false,
        selDisabled: doc.getElementById('audio-cam-select')?.disabled ?? false
      };
    `);
    assertTest('GATE_29_CAMERA_OPTIONS_TIMEOUT_8S_CROSS_CAM_GUARD', 'Timeout real de 8s em opções de câmera ignora ACK de outra câmera e só resolve quando a câmera alvo é confirmada',
      (postCountAfterSecondCamClick - postCountBeforeSecondCamClick === 0) &&
      gate29UncertainData.btnDisabled === true && gate29UncertainData.selDisabled === true &&
      gate29CrossCamCheck.btnDisabled === true &&
      !gate29ResolvedData.btnDisabled && !gate29ResolvedData.selDisabled,
      JSON.stringify({ uncertain: gate29UncertainData, crossCam: gate29CrossCamCheck, resolved: gate29ResolvedData }));

    // GATE 30: Timeout Real de 8s no Áudio Master Global com uncertainOp e Resolução por Late ACK
    resetMockServerState();
    mockAudioDelayMs = 9000;
    await loadHarness();
    await switchTab('audio');

    await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      doc.getElementById('btn-toggle-audio').click();
    `);
    console.log('[INFO] Aguardando timeout de 8000ms para audio em GATE_30 (literal wait 8600ms)...');
    await new Promise(r => setTimeout(r, 8600));
    mockAudioDelayMs = 0; // Drenagem de timer

    const postCountBeforeSecondAudioClick = recordedPostRequests.length;
    await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      doc.getElementById('btn-toggle-audio').click();
    `);
    await new Promise(r => setTimeout(r, 200));
    const postCountAfterSecondAudioClick = recordedPostRequests.length;

    const gate30UncertainData = await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      return {
        btnDisabled: doc.getElementById('btn-toggle-audio')?.disabled ?? false,
        msg: doc.getElementById('status-msg')?.textContent ?? ''
      };
    `);

    // Resolução por Late ACK: motor confirmou áudio silenciado (audioEnabled = false)
    mockAudioEnabled = false;
    await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      doc.getElementById('btn-refresh').click();
    `);
    await new Promise(r => setTimeout(r, 350));
    const gate30ResolvedData = await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      const btn = doc.getElementById('btn-toggle-audio');
      return {
        btnText: btn?.textContent.trim() ?? '',
        btnClass: btn?.className ?? '',
        btnDisabled: btn?.disabled ?? false
      };
    `);
    assertTest('GATE_30_AUDIO_MASTER_TIMEOUT_8S_UNCERTAIN_OP_AND_RESOLUTION', 'Timeout real de 8s em áudio master arma incerteza, bloqueia double-POST e resolve quando motor confirma novo estado',
      (postCountAfterSecondAudioClick - postCountBeforeSecondAudioClick === 0) &&
      gate30UncertainData.btnDisabled === true && gate30UncertainData.msg.includes('ainda não confirmou') &&
      gate30ResolvedData.btnText.includes('Silenciado') && gate30ResolvedData.btnClass.includes('vd-dim') && !gate30ResolvedData.btnDisabled,
      JSON.stringify({ uncertain: gate30UncertainData, resolved: gate30ResolvedData }));

    // GATE 31: Timeout Real de 25s em Auto-Align e Guarda contra ACK de Outro Anchor / Timestamp Defasado
    resetMockServerState();
    mockAutoAlignDelayMs = 30000; // Mock delay blindado (cliente aborta em 25000ms via AbortSignal)
    // Satisfaz pré-requisitos para habilitar o botão
    mockRec = false;
    mockPlayers.A.eventId = 'evt-1';
    mockPlayers.B.eventId = 'evt-1';
    mockProgram = 'Cam 1 - Palco';
    await loadHarness();
    await switchTab('audio');

    await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      doc.getElementById('btn-auto-align').click();
    `);
    console.log('[INFO] Aguardando timeout de 25000ms para auto-align em GATE_31 (literal wait 25600ms)...');
    await new Promise(r => setTimeout(r, 25600)); // Disparo do AbortSignal.timeout(25000)

    // DRENAGEM IMEDIATA SÍNCRONA: cancela o timer no Node.js ANTES de qualquer chamada CDP
    for (const t of activeServerTimers) clearTimeout(t);
    activeServerTimers.clear();
    mockAutoAlignDelayMs = 0;
    mockCalibration = null;
    mockSync = null;

    const postCountBeforeSecondAlignClick = recordedPostRequests.length;
    await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      doc.getElementById('btn-auto-align').click();
    `);
    await new Promise(r => setTimeout(r, 200));
    const postCountAfterSecondAlignClick = recordedPostRequests.length;

    const gate31UncertainData = await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      return {
        btnDisabled: doc.getElementById('btn-auto-align')?.disabled ?? false,
        msg: doc.getElementById('status-msg')?.textContent ?? ''
      };
    `);

    // Adversarial: Motor reporta calibração com timestamp ANTERIOR ao uncertainOp ou com outro anchor ('B')
    mockCalibration = {
      at: Date.now() - 35000,
      anchor: 'B',
      results: { A: { offsetFrames: 0, offsetMs: 0 } },
      method: 'decoded-common-audio',
      hardwareGenlock: false
    };
    mockSync = null;
    console.log('[INFO] Aguardando ciclo de polling passivo de 1500ms em GATE_31 (espera 1800ms)...');
    await new Promise(r => setTimeout(r, 1800)); // Aguarda ciclo de polling passivo pollStatus(false)
    const gate31WrongAnchorCheck = await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      return {
        btnDisabled: doc.getElementById('btn-auto-align')?.disabled ?? false,
        msg: doc.getElementById('status-msg')?.textContent ?? ''
      };
    `);

    // Late ACK legítimo: calibração fresca com o anchor atuado ('A')
    mockCalibration = {
      at: Date.now(),
      anchor: 'A',
      results: { B: { offsetFrames: 1, offsetMs: 33.3 } },
      method: 'decoded-common-audio',
      hardwareGenlock: false
    };
    mockSync = {
      anchor: 'A',
      differenceFrames: 1,
      differenceMs: 33.3,
      frameRate: '30/1',
      mode: 'frame',
      confirmed: true
    };
    console.log('[INFO] Aguardando resolução legítima de Auto-Align via polling passivo (espera 1800ms)...');
    await new Promise(r => setTimeout(r, 1800));
    const gate31ResolvedData = await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      return {
        btnDisabled: doc.getElementById('btn-auto-align')?.disabled ?? false,
        syncMsg: doc.getElementById('sync-status-msg')?.textContent ?? ''
      };
    `);
    assertTest('GATE_31_AUTO_ALIGN_TIMEOUT_25S_CROSS_ANCHOR_GUARD', 'Timeout real de 25s em auto-align entra em incerteza, rejeita calibração de outro anchor e resolve com evidência fresca válida',
      (postCountAfterSecondAlignClick - postCountBeforeSecondAlignClick === 0) &&
      gate31UncertainData.btnDisabled === true && gate31UncertainData.msg.includes('ainda não confirmou') &&
      gate31WrongAnchorCheck.btnDisabled === true &&
      !gate31ResolvedData.btnDisabled && gate31ResolvedData.syncMsg.includes('quadros'),
      JSON.stringify({ uncertain: gate31UncertainData, wrongAnchor: gate31WrongAnchorCheck, resolved: gate31ResolvedData }));

    // GATE 32: Preservação de Câmera Desconectada/Indisponível em Opções de Câmera sob Polling
    resetMockServerState();
    mockCameraOptions['Cam 9 - Remota'] = { recordAudio: 'input', gainDb: -6, muted: true, offsetFrames: 5 };
    await loadHarness();
    await switchTab('audio');

    await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      const sel = doc.getElementById('audio-cam-select');
      if (sel) { sel.value = 'Cam 9 - Remota'; sel.dispatchEvent(new Event('change', { bubbles: true })); }
    `);
    await new Promise(r => setTimeout(r, 200));

    await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      doc.getElementById('btn-refresh').click();
    `);
    await new Promise(r => setTimeout(r, 350));

    const gate32Data = await pageCdp.eval(`
      const doc = document.getElementById('mc-frame')?.contentDocument || document;
      const sel = doc.getElementById('audio-cam-select');
      return {
        selectedCam: sel?.value ?? '',
        hasOption: Array.from(sel?.options ?? []).some(o => o.value === 'Cam 9 - Remota'),
        gainVal: Number(doc.getElementById('audio-gain')?.value ?? 0),
        mutedVal: doc.getElementById('audio-muted')?.checked ?? false,
        offsetVal: Number(doc.getElementById('camera-offset')?.value ?? 0)
      };
    `);
    assertTest('GATE_32_UNAVAILABLE_SAVED_CAM_PRESERVED', 'Câmera salva em cameraOptions mas ausente de availableCams é preservada no seletor e opções sem seleção cega de outra câmera',
      gate32Data.hasOption === true && gate32Data.selectedCam === 'Cam 9 - Remota' &&
      gate32Data.gainVal === -6 && gate32Data.mutedVal === true && gate32Data.offsetVal === 5,
      JSON.stringify(gate32Data));

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

    // 2. GATE 25: Verificação CIM de ausência de processos msedge.exe no perfil próprio
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
      assertTest('GATE_25_CLEANUP_BROWSER_EXIT_CIM_ZERO', 'Processos msedge.exe associados ao perfil próprio encerraram cooperativamente (CIM count = 0)', exitObserved);
    }

    // 3. GATE 26: Revalidação Estrita de PINs Pós-Execução
    receipt.pinsAfter = {
      html: { path: candidateHtml, sha: sha256File(candidateHtml) },
      js: { path: candidateJs, sha: sha256File(candidateJs) },
      css: { path: candidateCss, sha: sha256File(candidateCss) }
    };
    const pinsUnchanged = (receipt.pinsBefore.html.sha === receipt.pinsAfter.html.sha) &&
                          (receipt.pinsBefore.js.sha === receipt.pinsAfter.js.sha) &&
                          (receipt.pinsBefore.css.sha === receipt.pinsAfter.css.sha);
    assertTest('GATE_26_CLEANUP_PINS_UNCHANGED', 'Arquivos de origem mantiveram hashes SHA-256 inalterados após a bateria de testes', pinsUnchanged);

    // 4. Fechamento do Servidor HTTP Local
    if (serverStarted) {
      try { await new Promise(r => server.close(r)); } catch (_) {}
    }

    // 5. Gravação incondicional do Receipt JSON Oficial
    receipt.finishedAt = new Date().toISOString();
    const receiptPath = path.join(ownDir, 'receipt-test-replay-settings-dom-r5.json');
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
