import { connect, sleep } from "./obsws.mjs";

async function main() {
  console.log("=== TESTE DE SAÍDAS E CAPACIDADES DO FREEMIX ===");
  const obs = await connect();
  console.log("✓ Conectado ao OBS WebSocket (Porta 4466)");

  // 1. Monitores reais
  const mon = await obs.tryReq("GetMonitorList");
  console.log(`✓ Monitores detectados: ${mon?.monitors?.length || 0}`);
  if (mon?.monitors) {
    for (const m of mon.monitors) {
      console.log(`  - Monitor [${m.monitorIndex}]: ${m.monitorName} (${m.monitorWidth}x${m.monitorHeight} @ ${m.monitorPositionX},${m.monitorPositionY})`);
    }
  }

  // 2. Status de Câmera Virtual
  const vcam = await obs.tryReq("GetVirtualCamStatus");
  console.log(`✓ Status da Câmera Virtual: ${vcam?.outputActive ? "ATIVA" : "PARADA"}`);

  // 3. Status de Transmissão (Stream)
  const stream = await obs.tryReq("GetStreamStatus");
  console.log(`✓ Status do Streaming: ${stream?.outputActive ? "AO VIVO" : "PARADO"}`);

  // 4. Status de Gravação
  const record = await obs.tryReq("GetRecordStatus");
  console.log(`✓ Status da Gravação: ${record?.outputActive ? "GRAVANDO" : "PARADA"}`);

  // 5. Teste de Abertura de Projetor em Janela (monitorIndex = -1)
  console.log("✓ Testando abertura de Projetor de Programa em Janela...");
  try {
    await obs.req("OpenVideoMixProjector", {
      videoMixType: "OBS_WEBSOCKET_VIDEO_MIX_TYPE_PROGRAM",
      monitorIndex: -1
    });
    console.log("✓ Projetor de Programa em Janela aberto com sucesso!");
  } catch (e) {
    console.error("Falha ao abrir projetor de programa:", e.message);
  }

  // 6. Teste de Abertura de Projetor Clean Feed / Fonte
  const scenes = await obs.tryReq("GetSceneList");
  const currentScene = scenes?.currentProgramSceneName || scenes?.scenes?.[0]?.sceneName;
  if (currentScene) {
    console.log(`✓ Testando abertura de Projetor de Clean Feed (${currentScene})...`);
    try {
      await obs.req("OpenSourceProjector", {
        sourceName: currentScene,
        monitorIndex: -1
      });
      console.log(`✓ Projetor Clean Feed para ${currentScene} aberto com sucesso!`);
    } catch (e) {
      console.error("Falha ao abrir projetor clean feed:", e.message);
    }
  }

  obs.close();
  console.log("=== TESTE CONCLUÍDO COM SUCESSO ===");
}

main().catch(console.error);
