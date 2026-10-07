import path from 'path';
import { convertGtzipFile } from './gtzip_converter.mjs';

const outDir = 'D:/DRIVE/IA/antigravity/vmixtwste/obs-vmix/assets/graphics/converted';

const samples = [
  'D:/DRIVE/IA/antigravity/vmixtwste/vMix27-copia/titles/GT Title/Title 0- The Classic Blue.gtzip',
  'D:/DRIVE/IA/antigravity/vmixtwste/vMix27-copia/titles/GT ScoreBoard/Scoreboard 1- VBA.gtzip',
  'D:/DRIVE/IA/antigravity/vmixtwste/vMix27-copia/titles/GT Ticker/Ticker 1- Basic Blue.gtzip'
];

for (const sample of samples) {
  try {
    console.log(`\nIniciando conversão de: ${path.basename(sample)}`);
    const res = convertGtzipFile(sample, outDir);
    console.log('Resultado manifest:', JSON.stringify(res.manifest, null, 2));
  } catch (err) {
    console.error('Erro ao converter:', err);
  }
}
