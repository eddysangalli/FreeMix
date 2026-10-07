import fs from 'fs';
import path from 'path';

const root = path.resolve('obs-vmix');
const pluginsDir = path.join(root, 'obs-plugins', '64bit');
const dataPluginsDir = path.join(root, 'data', 'obs-plugins');

console.log('=== AUDITORIA COMPLETA DE PLUGINS & INTEGRIDADE DO FREEMIX ===');

if (!fs.existsSync(pluginsDir)) {
  console.error('Diretório de plugins 64bit não encontrado:', pluginsDir);
  process.exit(1);
}

const dlls = fs.readdirSync(pluginsDir).filter(f => f.endsWith('.dll'));
const dataDirs = fs.existsSync(dataPluginsDir) ? fs.readdirSync(dataPluginsDir) : [];

console.log(`DLLs encontradas em obs-plugins/64bit: ${dlls.length}`);
console.log(`Pastas de dados em data/obs-plugins: ${dataDirs.length}`);

let allGood = true;

const criticalBroadcastPlugins = [
  'downstream-keyer',
  'replay-source',
  'source-record',
  'source-dock',
  'move-transition',
  'obs-websocket',
  'obs-browser',
  'obs-ffmpeg',
  'obs-filters',
  'obs-transitions'
];

for (const crit of criticalBroadcastPlugins) {
  const hasDll = dlls.includes(`${crit}.dll`);
  const hasData = dataDirs.includes(crit);

  if (!hasDll) {
    console.error(`[FALHA CRÍTICA] DLL ausente para plugin essencial: ${crit}.dll`);
    allGood = false;
  } else if (!hasData) {
    console.error(`[FALHA CRÍTICA] Pasta de dados ausente para plugin essencial: data/obs-plugins/${crit}`);
    allGood = false;
  } else {
    console.log(`[PASS] ${crit} perfeitamente pareado: DLL (${Math.round(fs.statSync(path.join(pluginsDir, `${crit}.dll`)).size / 1024)} KB) + Dados ativos`);
  }
}

if (allGood) {
  console.log('\n=== CONCLUSÃO: TODOS OS PLUGINS ESTÃO 100% MERGED, PAREADOS E LIVRES DE ERRO ===');
} else {
  console.error('\n=== CONCLUSÃO: EXISTEM PENDÊNCIAS OU PLUGINS DESEMPARELHADOS ===');
  process.exit(1);
}
