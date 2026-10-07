import { connect, sleep } from "./obsws.mjs";

async function main() {
  console.log("=== TESTE DE BUSES DE ÁUDIO E MIX-MINUS (FREEMIX) ===");
  const obs = await connect();
  console.log("✓ Conectado ao OBS WebSocket");

  console.log("\n--- 1. Detectando fontes com capacidade de áudio ---");
  const inputList = await obs.req("GetInputList");
  console.log(`✓ Total de fontes listadas: ${inputList?.inputs?.length || 0}`);

  let audioInput = null;
  let originalTracks = null;

  for (const input of (inputList?.inputs || [])) {
    try {
      const tracksRes = await obs.tryReq("GetInputAudioTracks", { inputName: input.inputName });
      if (tracksRes && tracksRes.inputAudioTracks) {
        audioInput = input.inputName;
        originalTracks = tracksRes.inputAudioTracks;
        console.log(`✓ Fonte de áudio encontrada: "${audioInput}"`);
        console.log(`  Pistas iniciais:`, JSON.stringify(originalTracks));
        break;
      }
    } catch (e) {
      // Entrada não possui áudio
    }
  }

  if (!audioInput) {
    throw new Error("Nenhuma fonte de áudio ativa com pistas detectada no OBS.");
  }

  console.log("\n--- 2. Testando comutação de botões M, A, B (Pistas 1, 2, 3) ---");
  const targetTracks = {
    ...originalTracks,
    "1": true,
    "2": !originalTracks["2"],
    "3": !originalTracks["3"]
  };

  console.log(`> Enviando SetInputAudioTracks para "${audioInput}" (Pista 2=${targetTracks["2"]}, Pista 3=${targetTracks["3"]})...`);
  await obs.req("SetInputAudioTracks", {
    inputName: audioInput,
    inputAudioTracks: targetTracks
  });

  await sleep(150);
  const verify1 = await obs.req("GetInputAudioTracks", { inputName: audioInput });
  console.log(`✓ Pistas lidas após envio:`, JSON.stringify(verify1.inputAudioTracks));

  if (verify1.inputAudioTracks["2"] !== targetTracks["2"] || verify1.inputAudioTracks["3"] !== targetTracks["3"]) {
    throw new Error("As pistas no motor OBS não correspondem ao estado enviado!");
  }
  console.log("✓ SUCESSO: Roteamento de M, A, B confirmado pelo motor OBS!");

  console.log("\n--- 3. Testando Matriz Mix-Minus (N-1 Real) ---");
  console.log("Configurando perfil de Convidado Remoto (Voz excluída do Aux A / Pista 2):");
  const mixMinusTracks = {
    ...originalTracks,
    "1": true,  // Master (PGM)
    "2": false, // Aux A (Retorno Mix-Minus) -> EXCLUÍDO
    "3": true   // Aux B (Fones)
  };

  await obs.req("SetInputAudioTracks", {
    inputName: audioInput,
    inputAudioTracks: mixMinusTracks
  });

  await sleep(150);
  const verifyMixMinus = await obs.req("GetInputAudioTracks", { inputName: audioInput });
  console.log(`✓ Pistas Mix-Minus verificadas:`, JSON.stringify(verifyMixMinus.inputAudioTracks));

  if (verifyMixMinus.inputAudioTracks["1"] !== true || verifyMixMinus.inputAudioTracks["2"] !== false || verifyMixMinus.inputAudioTracks["3"] !== true) {
    throw new Error("Falha na validação das pistas da matriz Mix-Minus.");
  }
  console.log("✓ SUCESSO: Matriz Mix-Minus (N-1) validada no motor OBS!");

  console.log("\n--- 4. Restaurando estado original das pistas ---");
  await obs.req("SetInputAudioTracks", {
    inputName: audioInput,
    inputAudioTracks: originalTracks
  });
  const restored = await obs.req("GetInputAudioTracks", { inputName: audioInput });
  console.log(`✓ Pistas restauradas:`, JSON.stringify(restored.inputAudioTracks));
  console.log("✓ Estado original restaurado sem efeito colateral.");

  console.log("\n========================================================");
  console.log(">>> EVIDÊNCIA EMPÍRICA CONCLUÍDA COM 100% DE SUCESSO <<<");
  console.log("========================================================");
  process.exit(0);
}

main().catch((err) => {
  console.error("ERRO NO TESTE:", err);
  process.exit(1);
});
