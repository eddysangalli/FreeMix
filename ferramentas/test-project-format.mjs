import { readFileSync, writeFileSync, unlinkSync, existsSync } from "node:fs";

console.log("=== TESTE DE PERSISTÊNCIA DO FORMATO DE PROJETO FREEMIX (.FMX) ===");

const sampleProject = {
  format: "FREEMIX_PROJECT",
  version: 1,
  name: "Culto_Domingo_Manha",
  video: {
    baseWidth: 1920,
    baseHeight: 1080,
    fpsNum: 60,
    fpsDen: 1
  },
  inputs: [
    {
      id: "inp_cam1",
      name: "Câmera 1 (Púlpito)",
      kind: "dshow_input",
      category: "Cameras",
      colorTag: 0,
      volumeDb: 0.0,
      muted: false,
      routeMaster: true,
      routeAuxA: false,
      routeAuxB: true,
      syncOffsetMs: 0,
      monitorType: 2
    },
    {
      id: "inp_call1",
      name: "FreeMix Call (Pr. Convidado)",
      kind: "browser_source",
      category: "Calls",
      colorTag: 2,
      volumeDb: -1.5,
      muted: false,
      routeMaster: true,
      routeAuxA: false, // Mix-minus: voz dele não retorna para ele
      routeAuxB: true,
      syncOffsetMs: 80,
      monitorType: 1
    }
  ],
  outputs: {
    streamServer: "rtmp://a.rtmp.youtube.com/live2",
    streamKey: "xxxx-xxxx-xxxx",
    multiStreams: [
      {
        id: "ms_twitch",
        name: "Twitch",
        server: "rtmp://live.twitch.tv/app",
        key: "live_xxxx",
        active: true,
        sharedEncoder: true
      }
    ],
    recordPath: "D:/Gravacoes/FreeMix",
    recordFormat: "mkv"
  }
};

const testPath = "d:/DRIVE/IA/antigravity/vmixtwste/FreeMix/demo_project.fmx";

try {
  // 1. Grava arquivo .fmx
  writeFileSync(testPath, JSON.stringify(sampleProject, null, 2), "utf8");
  console.log("✓ Projeto .fmx serializado e salvo com sucesso:", testPath);

  // 2. Lê e valida integridade
  const content = readFileSync(testPath, "utf8");
  const loaded = JSON.parse(content);

  if (loaded.format !== "FREEMIX_PROJECT") throw new Error("Assinatura de formato inválida!");
  if (loaded.version !== 1) throw new Error("Versão incompatível!");
  if (loaded.inputs.length !== 2) throw new Error("Número incorreto de entradas salvas!");
  if (loaded.inputs[1].routeAuxA !== false) throw new Error("Falha na regra de Mix-Minus da chamada!");

  console.log("✓ Validação de integridade do formato .fmx: PASSOU COM SUCESSO!");
  console.log("✓ Resolução:", `${loaded.video.baseWidth}x${loaded.video.baseHeight} @ ${loaded.video.fpsNum}fps`);
  console.log("✓ Entradas validadas:", loaded.inputs.map(i => i.name).join(" | "));
  console.log("✓ Destinos MultiStream:", loaded.outputs.multiStreams.map(m => m.name).join(", "));

  // Limpa arquivo temporário
  if (existsSync(testPath)) unlinkSync(testPath);
  console.log("✓ Arquivo temporário de teste limpo.");
} catch (e) {
  console.error("Falha no teste de projeto:", e.message);
  process.exit(1);
}
