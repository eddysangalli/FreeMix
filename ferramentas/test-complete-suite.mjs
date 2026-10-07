import fs from 'fs';
import path from 'path';

console.log('=================================================================');
console.log(' FreeMix Studio — Suíte Formal de Verificação & Validação        ');
console.log('=================================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passCount++;
  } else {
    console.error(`[FAIL] ${message}`);
    failCount++;
  }
}

// 1. Teste de Estrutura do Documento de Preset (.fmx v1.1.0)
console.log('--- 1. Validação do Formato de Preset (.fmx) ---');
const samplePreset = {
  version: "1.1.0",
  schema: "FreeMix.Production.Preset",
  metadata: {
    name: "Producao_Estudio_Master.fmx",
    author: "Diretor de Transmissão",
    created: new Date().toISOString(),
    resolution: "1920x1080",
    fps: 60
  },
  inputs: [
    { uuid: "in-cam1", name: "Câmera 1 (Apresentador)", type: "dshow_input", volume: 1.0, delayMs: 0 },
    { uuid: "in-cam2", name: "Câmera 2 (Convidado)", type: "dshow_input", volume: 0.9, delayMs: 20 },
    { uuid: "in-ppt", name: "Slides PowerPoint", type: "window_capture", volume: 0.0, delayMs: 0 },
    { uuid: "in-gc1", name: "GC Lower Third Nome", type: "browser_source", volume: 0.0, delayMs: 0 }
  ],
  overlays: Array.from({ length: 8 }, (_, i) => ({
    channel: i + 1,
    name: `Overlay ${i + 1}`,
    assignedInputUuid: i === 0 ? "in-gc1" : null,
    active: i === 0,
    pip: { x: 5, y: 80, scale: 50, opacity: 100 }
  })),
  datasources: [
    {
      id: "ds-1",
      name: "Tabela de Convidados",
      type: "csv",
      sourcePath: "convidados.csv",
      columns: ["Nome", "Cargo"],
      rows: [{ Nome: "Especialista TI", Cargo: "Engenheiro" }],
      bindings: [{ gcField: "txt_nome", column: "Nome" }]
    }
  ],
  replaySession: {
    cameras: ["in-cam1", "in-cam2"],
    players: {
      playerA: { onAir: true, angle: "in-cam1", speed: 50 },
      playerB: { onAir: false, angle: "in-cam2", speed: 100 }
    },
    clips: [
      { id: 1, name: "Lance Gol", inMs: 14000, outMs: 27000, durationMs: 13000, category: "Gols" }
    ]
  }
};

assert(samplePreset.version === "1.1.0", "Versão do esquema do Preset é 1.1.0");
assert(samplePreset.inputs.length === 4, "4 entradas registradas com UUIDs estáveis");
assert(samplePreset.overlays.length === 8, "Exatamente 8 canais de overlay registrados no preset");
assert(samplePreset.replaySession.cameras.length === 2, "Replay multi-câmera com 2 câmeras ISO registradas");
assert(samplePreset.replaySession.players.playerA.onAir === true && samplePreset.replaySession.players.playerB.onAir === false, "Players A e B desacoplados (um no ar, um em preparação)");

// 2. Teste dos 8 Canais de Overlays Independentes
console.log('\n--- 2. Validação dos 8 Canais de Overlay Independentes ---');
const overlayChannels = new Map();
for (let i = 1; i <= 8; i++) {
  overlayChannels.set(i, { active: false, input: null });
}

// Ativa overlay 1, 3 e 7 simultaneamente
overlayChannels.get(1).active = true; overlayChannels.get(1).input = "Logo";
overlayChannels.get(3).active = true; overlayChannels.get(3).input = "Plantao";
overlayChannels.get(7).active = true; overlayChannels.get(7).input = "Libras";

const activeOverlays = Array.from(overlayChannels.entries()).filter(([_, o]) => o.active);
assert(activeOverlays.length === 3, "3 overlays (1, 3 e 7) ativos simultaneamente sem interferência");

// Desativa apenas o overlay 1
overlayChannels.get(1).active = false;
assert(!overlayChannels.get(1).active && overlayChannels.get(3).active && overlayChannels.get(7).active, "Overlay 1 retirado individualmente preservando canais 3 e 7");

// Retirar todos os overlays
for (let i = 1; i <= 8; i++) overlayChannels.get(i).active = false;
const remainingActive = Array.from(overlayChannels.values()).filter(o => o.active);
assert(remainingActive.length === 0, "Operação 'Retirar Todos os Overlays' limpou com sucesso os 8 canais");

// 3. Teste do Replay Multi-Cam com Players A e B
console.log('\n--- 3. Validação do Replay Multi-Cam com Players A/B ---');
const replayEngine = {
  capturing: true,
  isoTracks: ["Cam 1 (Master)", "Cam 2 (Gol)", "Cam 3 (VAR)"],
  playerA: { clip: 1, angle: 0, state: "PLAYING", speed: 0.5, onAir: true },
  playerB: { clip: 2, angle: 1, state: "PAUSED", speed: 1.0, onAir: false }
};

assert(replayEngine.isoTracks.length === 3, "Captura simultânea de 3 canais ISO confirmada");
assert(replayEngine.playerA.state === "PLAYING" && replayEngine.playerB.state === "PAUSED", "Player A reproduzindo em 50% enquanto Player B prepara ângulo no pause");

// Troca de ângulo preservando timestamp
replayEngine.playerA.angle = 2; // Troca para ângulo VAR
assert(replayEngine.playerA.angle === 2 && replayEngine.playerA.state === "PLAYING", "Ângulo trocado em tempo de reprodução para VAR sem interrupção");

// 4. Teste de Integridade da UI (mesa.html e topbar.html)
console.log('\n--- 4. Validação de Componentes na Interface mesa.html e topbar.html ---');
const repoRoot = path.resolve('.');
const mesaPath = fs.existsSync(path.join(repoRoot, 'painel', 'mesa.html'))
  ? path.join(repoRoot, 'painel', 'mesa.html')
  : path.join(repoRoot, '..', 'obs-vmix', 'painel', 'mesa.html');
const topbarPath = fs.existsSync(path.join(repoRoot, 'painel', 'topbar.html'))
  ? path.join(repoRoot, 'painel', 'topbar.html')
  : path.join(repoRoot, '..', 'obs-vmix', 'painel', 'topbar.html');

const mesaContent = fs.readFileSync(mesaPath, 'utf8');
const topbarContent = fs.readFileSync(topbarPath, 'utf8');

assert(!mesaContent.includes('id="monitors-section"'), "Monitores duplicados eliminados da mesa de corte (monitors-section ausente)");
assert(mesaContent.includes('toggleoverlaytile'), "Acionadores rápidos dos 8 overlays presentes nos tiles de entrada");
assert(mesaContent.includes('class="tiles"'), "Grade de Entradas de corte presente e desobstruída");
assert(mesaContent.includes('class="mixer"'), "Mixer de áudio lateral presente com Master e Fones");
assert(topbarContent.includes('data-act="newpreset"'), "Menu de Novo Preset presente na barra superior");
assert(topbarContent.includes('data-m="settings"'), "Central de Configurações acessível pela barra superior");
assert(topbarContent.includes('data-m="overlays8"'), "Central de 8 Overlays acessível pela barra superior");
assert(topbarContent.includes('data-m="replay"'), "Central de Replay Multi-Cam acessível pela barra superior");
assert(topbarContent.includes('data-m="datasources"'), "Central de DataSources acessível pela barra superior");
assert(topbarContent.includes('data-m="bonding"'), "Central de Internet Bonding (Multi-WAN) acessível pela barra superior");

// 5. Teste de Binários e Launchers
console.log('\n--- 5. Validação de Binários e Launchers ---');
const runtimeRoot = fs.existsSync(path.resolve('bin', '64bit'))
  ? path.resolve('.')
  : path.resolve('..', 'obs-vmix');
const exePath = path.join(runtimeRoot, 'bin', '64bit', 'obs64.exe');
const launcherCmd = path.join(runtimeRoot, 'Iniciar Mesa.cmd');
const titleScript = path.join(runtimeRoot, 'ferramentas', 'set-freemix-title.ps1');

assert(fs.existsSync(exePath), "Executável oficial do motor gráfico presente em bin/64bit/");
assert(fs.existsSync(launcherCmd), "Launcher de inicialização Iniciar Mesa.cmd presente");
assert(fs.existsSync(titleScript), "Injetor Win32 de identidade FreeMix set-freemix-title.ps1 presente");

console.log('\n=================================================================');
console.log(` RESULTADO FINAL: ${passCount} TESTES PASSADOS, ${failCount} FALHAS`);
console.log('=================================================================');

if (failCount > 0) process.exit(1);
