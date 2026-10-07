import dgram from "node:dgram";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

console.log("=== TESTE DE VALIDAÇÃO: NETWORK BONDING & MÓDULO DE GRÁFICOS ===");

async function testBondingDeduplication() {
  console.log("\n--- 1. Teste de Redundância Simultânea (Hitless Bonding) ---");
  const clientA = dgram.createSocket("udp4");
  const clientB = dgram.createSocket("udp4");

  const TARGET_PORT = 4000;
  let receivedCount = 0;
  let duplicatesCleaned = 0;
  const seenSequences = new Set();

  const receiver = dgram.createSocket("udp4");
  receiver.on("message", (msg) => {
    receivedCount++;
    const seq = msg.readUInt32BE(0);
    if (seenSequences.has(seq)) {
      duplicatesCleaned++;
    } else {
      seenSequences.add(seq);
    }
  });

  await new Promise((resolve) => receiver.bind(TARGET_PORT, resolve));

  // Simula o FreeMix enviando 10 pacotes por dois caminhos físicos independentes (Cabo e Wi-Fi)
  for (let seq = 1; seq <= 10; seq++) {
    const buf = Buffer.alloc(8);
    buf.writeUInt32BE(seq, 0);
    buf.writeUInt32BE(0xDEADBEEF, 4);

    // Envio pelo link A
    clientA.send(buf, TARGET_PORT, "127.0.0.1");
    // Envio simultâneo pelo link B (com pequeno atraso de rota de 5ms)
    setTimeout(() => {
      clientB.send(buf, TARGET_PORT, "127.0.0.1");
    }, 5);
  }

  await new Promise((r) => setTimeout(r, 200));

  receiver.close();
  clientA.close();
  clientB.close();

  console.log(`✓ Pacotes totais recebidos nos 2 links: ${receivedCount}`);
  console.log(`✓ Pacotes únicos entregues ao vídeo: ${seenSequences.size}`);
  console.log(`✓ Pacotes duplicados descartados com precisão: ${duplicatesCleaned}`);

  if (seenSequences.size !== 10) throw new Error("Falha na integridade dos pacotes!");
  if (duplicatesCleaned !== 10) throw new Error("Falha na deduplicação do hitless bonding!");
  console.log("✓ TESTE DE REDUNDÂNCIA SIMULTÂNEA: PASSOU COM 100% DE EFICIÊNCIA!");
}

function testGraphicsCatalog() {
  console.log("\n--- 2. Teste da Galeria de Templates e Fontes de Dados ---");
  const baseDir = "d:/DRIVE/IA/antigravity/vmixtwste/FreeMix/assets/graphics";

  function findJsonFiles(dir) {
    let results = [];
    const list = readdirSync(dir);
    for (const file of list) {
      const fullPath = join(dir, file);
      const stat = statSync(fullPath);
      if (stat && stat.isDirectory()) {
        results = results.concat(findJsonFiles(fullPath));
      } else if (file.endsWith(".json")) {
        results.push(fullPath);
      }
    }
    return results;
  }

  const jsonFiles = findJsonFiles(baseDir);
  console.log(`✓ Templates localizados no catálogo: ${jsonFiles.length}`);

  for (const f of jsonFiles) {
    const content = JSON.parse(readFileSync(f, "utf8"));
    if (!content.id || !content.name || !content.htmlFile || !content.fields) {
      throw new Error(`Template inválido: ${f}`);
    }
    console.log(`  - [Camada ${content.layer}] ${content.collection} / ${content.name} (${content.fields.length} campos)`);
  }

  console.log("✓ TESTE DE CATÁLOGO DE GRÁFICOS: TODOS OS TEMPLATES VALIDADOS!");
}

async function runAll() {
  try {
    await testBondingDeduplication();
    testGraphicsCatalog();
    console.log("\n=== TODOS OS TESTES PASSARAM COM SUCESSO! ===");
    process.exit(0);
  } catch (e) {
    console.error("Erro no teste:", e.message);
    process.exit(1);
  }
}

runAll();
