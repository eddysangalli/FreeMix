// Checks of what the compiled program draws by itself around Preview and Output:
//   - waveform / vectorscope of the Preview (colour bars icon in its title bar), through the control server
//     (vendor "freemix": get_scope, set_scope);
//   - master level meter between Preview and Output (get_master_level), against the engine's own meter of the Master;
//   - overlay buttons 1 to 8 under the T-bar, pressed for real through the accessibility interface
//     (clicar-nativo.ps1) and confirmed in the keyer.
// Uses the demo inputs "VT" (tone) and "CAM 3" / "CAM 4", and overlay channel 8. Puts back the scope, the Preview and
// Program inputs, the routing of the tone, the mute of the Master and what channel 8 was showing.
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { connect, sleep, ROOT } from "./obsws.mjs";
const levels = new Map();
const obs = await connect({ events: 65536, onEvent: (type, d) => { if (type === "InputVolumeMeters") for (const i of d.inputs) levels.set(i.inputName, Math.max(0, ...i.inputLevelsMul.map((ch) => ch[1]))); } });
let pass = 0, total = 0;
const check = (name, ok, detail = "") => { total++; if (ok) pass++; console.log(`${ok ? "OK   " : "FALHA"} ${name}${detail !== "" ? "  (" + detail + ")" : ""}`); };
const vendor = (v) => async (type, data = {}) => (await obs.tryReq("CallVendorRequest", { vendorName: v, requestType: type, requestData: data }))?.responseData;
const fmx = vendor("freemix"), dsk = vendor("downstream-keyer");
const native = (...args) => { const r = spawnSync("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", `${ROOT}/ferramentas/clicar-nativo.ps1`, ...args], { encoding: "utf8" }); return (r.stdout || "").trim().split(/\r?\n/).pop(); };

const logs = `${ROOT}/config/obs-studio/logs`, last = readdirSync(logs).map((f) => [f, statSync(`${logs}/${f}`).mtimeMs]).sort((a, b) => b[1] - a[1])[0][0], log = readFileSync(`${logs}/${last}`, "utf8");
check("o componente de medição de cor carrega do nosso código", /^\d\d:\d\d:\d\d\.\d+:\s{4,}obs-color-monitor\.dll\s*$/m.test(log));

// ---- Waveform / vectorscope ----
const scope0 = await fmx("get_scope");
check("o programa responde pelo estado do waveform/vectorscope", scope0?.success === true, JSON.stringify(scope0 && { mode: scope0.mode, with_preview: scope0.with_preview }));
if (scope0?.success) {
  try {
    check("as cinco opções do menu existem e estão disponíveis", scope0.modes.map((m) => m.name).join(",") === "None,Waveform RGB,Waveform Y,Parade RGB,Vectorscope" && scope0.modes.every((m) => m.available), scope0.modes.map((m) => `${m.name}${m.available ? "" : " (indisponível)"}`).join(", "));
    for (const mode of [1, 2, 3, 4]) {
      const set = await fmx("set_scope", { mode, with_preview: false }); await sleep(1500);
      const a = await fmx("get_scope"); await sleep(700); const b = await fmx("get_scope");
      check(`${set.name}: é desenhado no Preview a cada quadro e tem imagem medida`, a.mode === mode && b.frames_drawn > a.frames_drawn + 5 && b.width > 0 && b.height > 0, `${b.frames_drawn - a.frames_drawn} quadros em 0,7 s, gráfico de ${b.width}x${b.height}`);
    }
    const keep = await fmx("set_scope", { with_preview: true });
    check("'+ Preview' liga sem trocar o gráfico escolhido", keep.with_preview === true && keep.mode === 4);
    await fmx("set_scope", { mode: 0 }); await sleep(400);
    const off1 = await fmx("get_scope"); await sleep(600); const off2 = await fmx("get_scope");
    check("None tira o gráfico: nada mais é desenhado", off2.mode === 0 && off2.frames_drawn === off1.frames_drawn && off2.width === 0);
    const bad = await fmx("set_scope", { mode: 99 });
    check("um número de opção que não existe cai em None, sem erro", bad.mode === 0);
  } finally { await fmx("set_scope", { mode: scope0.mode, with_preview: scope0.with_preview }); }
}

// ---- Master meter ----
const IN = "VT áudio", MASTER = "FreeMix Master";
const hasBuses = (await obs.req("GetInputList")).inputs.some((i) => i.inputName === MASTER);
const prog0 = (await obs.req("GetCurrentProgramScene")).currentProgramSceneName, prev0 = (await obs.req("GetCurrentPreviewScene")).currentPreviewSceneName;
const m0 = await fmx("get_master_level");
check("o medidor do Master existe na coluna do meio", m0?.present === true);
if (!hasBuses) check("barramentos ligados (necessários para o teste do medidor)", false, "ligue os barramentos no mixer");
else {
  const tracks0 = (await obs.req("GetInputAudioTracks", { inputName: IN })).inputAudioTracks, mute0 = (await obs.req("GetInputMute", { inputName: MASTER })).inputMuted;
  try {
    await obs.req("SetInputMute", { inputName: MASTER, inputMuted: false });
    await obs.req("SetInputAudioTracks", { inputName: IN, inputAudioTracks: { "4": true, "5": false, "6": false } });
    await obs.req("SetCurrentProgramScene", { sceneName: "VT" }); await sleep(2000);
    levels.delete(MASTER); await sleep(700);
    const engine = 20 * Math.log10(Math.max(levels.get(MASTER) ?? 0, 1e-6)), shown = await fmx("get_master_level");
    check("com o tom no ar, o medidor mostra o mesmo nível que o motor mede no Master", shown.left_db > -50 && Math.abs(shown.left_db - engine) < 3, `medidor ${shown.left_db.toFixed(1)} dB / ${shown.right_db.toFixed(1)} dB, motor ${engine.toFixed(1)} dB`);
    await obs.req("SetInputMute", { inputName: MASTER, inputMuted: true }); await sleep(2500);
    const silent = await fmx("get_master_level");
    check("Master mudo: o medidor cai a zero", silent.left_db <= -59.9 && silent.right_db <= -59.9, `${silent.left_db.toFixed(1)} dB`);
  } finally {
    await obs.req("SetInputMute", { inputName: MASTER, inputMuted: mute0 });
    await obs.req("SetInputAudioTracks", { inputName: IN, inputAudioTracks: tracks0 });
    await obs.req("SetCurrentProgramScene", { sceneName: prog0 }); await sleep(300);
    await obs.req("SetCurrentPreviewScene", { sceneName: prev0 });
  }
}

// ---- Overlay buttons ----
const K = "8", A = "CAM 3", B = "CAM 4", shows = async () => (await dsk("dsk_get_scene", { dsk_name: K }))?.scene ?? null;
const listed = async () => (((await dsk("get_downstream_keyers"))?.downstream_keyers || []).find((k) => k.name === K)?.scenes || []).map((s) => s.name);
const keyers = ((await dsk("get_downstream_keyers"))?.downstream_keyers || []).map((k) => k.name), list0 = await listed();
if (!keyers.includes(K)) check("canal de overlay 8 configurado (necessário para o teste dos botões)", false, "abra o painel uma vez: ele cria os oito canais");
else {
  const before = await shows();
  try {
    if (before) { await dsk("dsk_select_scene", { dsk_name: K, scene: "" }); await sleep(400); }
    check("botão 8 apagado com o canal fora do ar", native("-IdContains", "freemixOverlayButtons", "-Name", K, "-StateOnly") === "off");
    await obs.req("SetCurrentPreviewScene", { sceneName: A }); await sleep(300);
    const s1 = native("-IdContains", "freemixOverlayButtons", "-Name", K);
    check("clique no 8 põe a entrada do Preview no canal 8, e o botão acende", (await shows()) === A && s1 === "on", `canal mostra "${await shows()}", botão ${s1}`);
    await obs.req("SetCurrentPreviewScene", { sceneName: B }); await sleep(300);
    const s2 = native("-IdContains", "freemixOverlayButtons", "-Name", K);
    check("com outra entrada no Preview, o clique troca o que o canal mostra", (await shows()) === B && s2 === "on", `canal mostra "${await shows()}"`);
    const s3 = native("-IdContains", "freemixOverlayButtons", "-Name", K);
    check("clique de novo com a mesma entrada tira o canal do ar, e o botão apaga", (await shows()) === "" && s3 === "off", `canal mostra "${await shows()}", botão ${s3}`);
  } finally {
    await dsk("dsk_select_scene", { dsk_name: K, scene: before || "" }); await sleep(200);
    for (const s of await listed()) if (!list0.includes(s)) await dsk("dsk_remove_scene", { dsk_name: K, scene: s });
    await obs.req("SetCurrentPreviewScene", { sceneName: prev0 });
  }
}

console.log(`\n${pass}/${total} verificações passaram`);
obs.close(); process.exit(pass === total ? 0 : 1);
