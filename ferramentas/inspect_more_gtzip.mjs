import fs from 'fs';
import path from 'path';
import cp from 'child_process';

function inspect(zipPath) {
  const targetDir = 'D:/DRIVE/IA/antigravity/vmixtwste/obs-vmix/ferramentas/scratch_inspect';
  if (fs.existsSync(targetDir)) fs.rmSync(targetDir, { recursive: true, force: true });
  fs.mkdirSync(targetDir, { recursive: true });
  cp.execSync(`tar -xf "${zipPath}" -C "${targetDir}"`);
  console.log(`\n===================\nINSPECIONANDO: ${path.basename(zipPath)}`);
  const files = fs.readdirSync(targetDir);
  console.log('Arquivos:', files);
  if (files.includes('document.xml')) {
    const xml = fs.readFileSync(path.join(targetDir, 'document.xml'), 'utf8');
    console.log(xml.substring(0, 3000));
  }
}

inspect('D:/DRIVE/IA/antigravity/vmixtwste/vMix27-copia/titles/GT ScoreBoard/Scoreboard 1- VBA.gtzip');
inspect('D:/DRIVE/IA/antigravity/vmixtwste/vMix27-copia/titles/GT Ticker/Ticker 1- Basic Blue.gtzip');
