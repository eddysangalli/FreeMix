import fs from 'fs';
import path from 'path';

const placarDir = 'obs-vmix/painel/gc/gt_titles/PLACAR CENTRAL';
const htmlFile = path.join(placarDir, 'index.html');

console.log('--- TESTE DE INTEGRIDADE DO TÍTULO CONVERTIDO (PLACAR CENTRAL) ---');
if (!fs.existsSync(htmlFile)) {
  console.error('ERRO: index.html não encontrado!');
  process.exit(1);
}

const html = fs.readFileSync(htmlFile, 'utf8');

// 1. Verificar se não há nenhum background vermelho sólido que causou o bug
const redSolidMatch = html.match(/background(?:-color)?:\s*(?:#ff0000|rgba\(255,\s*0,\s*0|red)/i);
if (redSolidMatch) {
  console.error('FALHA: Encontrado preenchimento vermelho que causou o bug:', redSolidMatch[0]);
  process.exit(1);
} else {
  console.log('✓ OK: Nenhum preenchimento vermelho de fallback (#FFFF0000) encontrado no HTML.');
}

// 2. Verificar se todas as fatias de imagem referenciadas no HTML existem no disco
const imgRegex = /background-image:\s*url\('([^']+)'\)/g;
let match;
let countImgs = 0;
let missing = [];

while ((match = imgRegex.exec(html)) !== null) {
  countImgs++;
  const imgName = match[1];
  const fullPath = path.join(placarDir, imgName);
  if (!fs.existsSync(fullPath)) {
    missing.push(imgName);
  }
}

if (missing.length > 0) {
  console.error('FALHA: Imagens ausentes no diretório:', missing);
  process.exit(1);
} else {
  console.log(`✓ OK: Todas as ${countImgs} texturas e imagens do GT Title existem e estão vinculadas.`);
}

// 3. Verificar escudos específicos do Manchester City e PSG
if (html.includes('Manchester_City_Football_Club.png') && html.includes('PSG.png')) {
  console.log('✓ OK: Escudos do Manchester City e PSG mapeados com sucesso.');
} else {
  console.error('FALHA: Escudos não encontrados no index.html!');
  process.exit(1);
}

// 4. Verificar se a tag script aponta para o gc.js correto
if (html.includes('../../gc.js')) {
  console.log('✓ OK: Runtime broadcast do FreeMix (gc.js) vinculado corretamente com caminho relativo ../../gc.js.');
} else {
  console.error('FALHA: Script gc.js com caminho incorreto!');
  process.exit(1);
}

console.log('--- TODOS OS TESTES DE VALIDAÇÃO PASSARAM (4/4) ---');
