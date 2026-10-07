import fs from 'fs';
import path from 'path';
import cp from 'child_process';

const sampleGtzip = 'D:/DRIVE/IA/antigravity/vmixtwste/vMix27-copia/titles/GT Title/Title 0- The Classic Blue.gtzip';
const targetDir = 'D:/DRIVE/IA/antigravity/vmixtwste/obs-vmix/ferramentas/sample_gtzip_extracted';

if (fs.existsSync(targetDir)) {
  fs.rmSync(targetDir, { recursive: true, force: true });
}
fs.mkdirSync(targetDir, { recursive: true });

// Extrair usando tar do Windows (que suporta .zip nativamente)
cp.execSync(`tar -xf "${sampleGtzip}" -C "${targetDir}"`);

console.log('Arquivos extraídos:');
const files = fs.readdirSync(targetDir);
for (const file of files) {
  const stat = fs.statSync(path.join(targetDir, file));
  console.log(`- ${file} (${stat.size} bytes)`);
}

// Ler os XMLs se existirem
for (const file of files) {
  if (file.endsWith('.xml') || file.endsWith('.gtxml') || file.endsWith('.txt')) {
    console.log(`\n=== CONTEÚDO DE ${file} ===`);
    const content = fs.readFileSync(path.join(targetDir, file), 'utf8');
    console.log(content.substring(0, 2000));
  }
}
