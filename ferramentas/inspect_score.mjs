import fs from 'fs';
import path from 'path';
import cp from 'child_process';

const target = 'D:/DRIVE/IA/antigravity/vmixtwste/obs-vmix/ferramentas/scratch_inspect_score';
if (fs.existsSync(target)) fs.rmSync(target, { recursive: true });
fs.mkdirSync(target, { recursive: true });

const src = 'D:/DRIVE/IA/antigravity/vmixtwste/vMix27-copia/titles/GT ScoreBoard/Scoreboard 1- VBA.gtzip';
cp.execSync(`tar -xf "${src}" -C "${target}"`);

const files = fs.readdirSync(target);
console.log('Arquivos:', files);

const doc = fs.readFileSync(path.join(target, 'document.xml'), 'utf8');
const images = doc.match(/<Image[\s\S]*?<\/Image>|<Image[^>]*\/>/g);
console.log('Imagens encontradas:', images);

const textBlocks = doc.match(/<TextBlock[\s\S]*?<\/TextBlock>|<TextBlock[^>]*\/>/g);
console.log('TextBlocks total:', textBlocks ? textBlocks.length : 0);
if (textBlocks) {
  textBlocks.slice(0, 5).forEach(t => console.log('TB:', t.substring(0, 150)));
}

const storyboards = doc.match(/<Storyboard[\s\S]*?<\/Storyboard>/g);
console.log('Storyboards:', storyboards ? storyboards.length : 0);
