// Click-test of the plugin-backed buttons (MultiCorder, PlayList, Loop, Audio, Close). OBS must be running with --remote-debugging-port=9333.
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { connect, sleep, ROOT } from "./obsws.mjs";

const require = createRequire("D:/DRIVE/IA/antigravity/vmixtwste/rea/package.json");
const WebSocket = require("ws");
const SCRATCH = process.argv[2];           // temporary folder for the test recordings
if (!SCRATCH) { console.log("uso: node test-plugins.mjs <pasta temporária>"); process.exit(1); }

const target = (await (await fetch("http://127.0.0.1:9333/json")).json()).find((t) => t.url.endsWith("painel/mesa.html"));
const cdp = new WebSocket(target.webSocketDebuggerUrl); await new Promise((r) => cdp.on("open", r));
let id = 0; const waits = new Map();
cdp.on("message", (raw) => { const m = JSON.parse(String(raw)); waits.get(m.id)?.(m); waits.delete(m.id); });
const evalJs = (expression) => new Promise((r) => { const i = ++id; waits.set(i, (m) => r(m.result?.result?.value ?? m.result?.exceptionDetails?.exception?.description)); cdp.send(JSON.stringify({ id: i, method: "Runtime.evaluate", params: { expression, returnByValue: true, awaitPromise: true } })); });
const click = (sel) => evalJs(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return "sem elemento"; el.click(); return "ok"; })()`);
const tile = (name, action) => `.tile [data-a="${action}"][data-v="${name}"]`;
const obs = await connect();
let pass = 0, total = 0;
const check = (name, ok, detail = "") => { total++; if (ok) pass++; console.log(`${ok ? "OK   " : "FALHA"} ${name}${detail !== "" ? "  (" + detail + ")" : ""}`); };
// Close OBS property windows opened by the panel during the test (window title starts with "Propriedades").
const closeDialogs = () => { try { console.log(execFileSync("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", `${ROOT}/ferramentas/fechar-propriedades.ps1`], { encoding: "utf8" }).trim()); } catch (e) { console.log("não consegui fechar a janela de propriedades:", e.message.slice(0, 80)); } };

await evalJs("location.reload()"); await sleep(4000);
console.log("painel:", await evalJs(`JSON.stringify({ conectado: st.on, sourceRecord: st.hasIso, playlistKind: st.kinds.find((k) => /playlist/.test(k)) || null, itens: st.items.size })`));
const kinds = (await obs.req("GetSceneTransitionList")).transitions.map((t) => `${t.transitionName}:${t.transitionKind}`);
check("transição Merge (plugin Move) disponível", kinds.some((k) => k === "Merge:move_transition"), kinds.join(", "));

/* Loop and Audio on the VT entry */
const loopNow = async () => (await obs.req("GetInputSettings", { inputName: "VT áudio" })).inputSettings.looping;
const l0 = await loopNow();
await click(tile("VT", "loop")); await sleep(900);
check("Loop inverte a repetição da mídia", (await loopNow()) === !l0, `${l0} -> ${await loopNow()}`);
await click(tile("VT", "loop")); await sleep(900);
check("Loop de novo volta ao que era", (await loopNow()) === l0);
check("botão Loop aceso quando a mídia está em repetição", (await evalJs(`document.querySelector('${tile("VT", "loop")}').classList.contains("on")`)) === !!l0);
await click(tile("VT", "audio")); await sleep(600);
check("Audio desliga o áudio da entrada", (await obs.req("GetInputMute", { inputName: "VT áudio" })).inputMuted === true);
await click(tile("VT", "audio")); await sleep(600);
check("Audio de novo religa", (await obs.req("GetInputMute", { inputName: "VT áudio" })).inputMuted === false);
check("entrada sem áudio fica com Audio apagado", (await evalJs(`!!document.querySelector('.tile:nth-child(1) .r:last-child .w2.na')`)) === true);

/* MultiCorder: CAM 3 and VT recorded in isolation while CAM 1 is on air */
mkdirSync(SCRATCH, { recursive: true });
const realDir = (await obs.req("GetRecordDirectory")).recordDirectory;
await obs.req("SetRecordDirectory", { recordDirectory: SCRATCH });
await obs.req("SetCurrentProgramScene", { sceneName: "CAM 1" }); await sleep(900);
await evalJs(`(() => { st.isoSel = []; store.set("mesa.iso", []); })()`);
await click(`.bot [data-a="pop"][data-v="iso"]`); await sleep(300);
await click(`.pop input[data-a="isotoggle"][data-v="CAM 3"]`); await sleep(200);
await click(`.pop input[data-a="isotoggle"][data-v="VT"]`); await sleep(200);
await click(`.pop [data-a="isostart"]`); await sleep(6000);
const iso = `${SCRATCH}/iso`, files = () => (existsSync(iso) ? readdirSync(iso).map((f) => `${f} ${statSync(`${iso}/${f}`).size}`) : []);
const during = files();
check("MultiCorder cria um arquivo por entrada marcada", during.some((f) => f.startsWith("CAM 3")) && during.some((f) => f.startsWith("VT")), during.join(" | ") || "nenhum arquivo");
check("entradas gravando mostram a marca ISO", (await evalJs(`document.querySelectorAll('.tt .iso').length`)) === 2);
check("botão MultiCorder fica vermelho", (await evalJs(`!!document.querySelector('.bot .b.live[data-a="multicorder"]')`)) === true);
check("programa continua em CAM 1 durante a gravação isolada", (await obs.req("GetSceneList")).currentProgramSceneName === "CAM 1");
await click(`.bot [data-a="multicorder"]`); await sleep(3500);
const after = files();
check("MultiCorder de novo para tudo", (await evalJs(`document.querySelectorAll('.tt .iso').length`)) === 0);
check("arquivos ficaram com conteúdo", after.length >= 2 && after.every((f) => Number(f.split(" ").pop()) > 20000), after.join(" | "));
for (const s of ["CAM 3", "VT"]) await obs.tryReq("RemoveSourceFilter", { sourceName: s, filterName: "Gravação ISO" });
await evalJs(`(() => { st.isoSel = []; store.set("mesa.iso", []); closePop(); })()`);
await obs.req("SetRecordDirectory", { recordDirectory: realDir });

/* PlayList: create through the panel, fill it, drive the transport, then remove with Close */
await click(`.bot [data-a="pop"][data-v="playlist"]`); await sleep(300);
await click(`.pop [data-a="plcreate"]`); await sleep(2500);
closeDialogs(); await sleep(800);
const pk = (await obs.tryReq("GetInputSettings", { inputName: "Playlist" }))?.inputKind;
check("PlayList cria a entrada com a fonte de playlist", !!pk && (await obs.req("GetSceneList")).scenes.some((s) => s.sceneName === "PLAYLIST"), `tipo ${pk}`);
const tone = `${ROOT}/demo/tom-1khz.wav`;
await obs.req("SetInputSettings", { inputName: "Playlist", inputSettings: { playlist: [{ value: tone, selected: false, hidden: false }, { value: tone, selected: false, hidden: false }], loop: true } });
await obs.req("SetCurrentProgramScene", { sceneName: "PLAYLIST" }); await sleep(2500);
await click(`.bot [data-a="pop"][data-v="playlist"]`); await sleep(600);
const state = async () => (await obs.req("GetMediaInputStatus", { inputName: "Playlist" })).mediaState.replace("OBS_MEDIA_STATE_", "");
const s1 = await state();
await click(`.pop [data-a="plact"][data-v="PAUSE"]`); await sleep(900);
const s2 = await state();
await click(`.pop [data-a="plact"][data-v="PLAY"]`); await sleep(900);
const s3 = await state();
check("Pause e Play do PlayList comandam a fonte", s2 === "PAUSED" && s3 === "PLAYING", `${s1} -> ${s2} -> ${s3}`);
await click(`.pop [data-a="plact"][data-v="NEXT"]`); await sleep(900);
check("Próximo é aceito pela playlist", (await state()) === "PLAYING", await state());
check("janela PlayList mostra o estado", (await evalJs(`document.getElementById('pop').textContent`)).includes("tocando"));
await click(`.pop [data-a="close"]`);
await obs.req("SetCurrentProgramScene", { sceneName: "CAM 1" }); await sleep(1200);
await click(tile("PLAYLIST", "closeask")); await sleep(400);
await click(`.pop [data-a="closego"]`); await sleep(1200);
check("Close remove a entrada (com confirmação)", !(await obs.req("GetSceneList")).scenes.some((s) => s.sceneName === "PLAYLIST"));
check("Close fica apagado na entrada que está no ar", (await evalJs(`!!document.querySelector('.tile .tt.out')?.parentElement.querySelector('.r button.na')`)) === true);
await obs.tryReq("RemoveInput", { inputName: "Playlist" });

await obs.req("SetCurrentPreviewScene", { sceneName: "CAM 2" });
console.log(`${pass}/${total} verificações passaram`);
obs.close(); cdp.close();
