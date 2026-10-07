// One-off edit of painel/mesa.html, on top of patch-audio.mjs: the mixer in the reference layout (the owner's
// screenshot of the real mixer): fixed-size strips that wrap into rows, OUTPUTS (Master, A, B) before INPUTS,
// number + name on top, pan slider, cog / S / automatic-mix arrows / speaker in a column, bus buttons underneath.
// The output strips are shown as pending: the engine has mix tracks but no bus fader, meter or mute.
import { readFileSync, writeFileSync } from "node:fs";
const dir = "D:/DRIVE/IA/antigravity/vmixtwste/obs-vmix";
const snip = readFileSync(dir + "/ferramentas/mixer2.snippet.js", "utf8").replace(/\r\n/g, "\n");
const part = (name, next) => snip.slice(snip.indexOf("//@@" + name) + name.length + 5, next ? snip.indexOf("//@@" + next) : undefined).replace(/\n$/, "");
let s = readFileSync(dir + "/painel/mesa.html", "utf8"), done = 0, missing = 0;
const rep = (a, b) => { if (!s.includes(a)) { missing++; console.log("trecho não encontrado: " + a.slice(0, 70)); return; } s = s.replace(a, () => b); done++; };

const from = s.indexOf("    box.innerHTML = (st.audio.size ?"), endMark = "crie uma entrada de mídia.</div>`;", to = s.indexOf(endMark, from);
if (from < 0 || to < 0) { missing++; console.log("trecho não encontrado: montagem do mixer"); } else { s = s.slice(0, from) + part("RENDER", "EVENT") + s.slice(to + endMark.length); done++; }
rep('mon: mo?.monitorType || "OBS_MONITORING_TYPE_NONE" });', 'mon: mo?.monitorType || "OBS_MONITORING_TYPE_NONE", bal: (await tryReq("GetInputAudioBalance", { inputName: i.inputName }))?.inputAudioBalance ?? 0.5 });');
rep('el.querySelector(".db").textContent = ', 'el.querySelector(".fd").title = ');
rep('    else if (type === "InputMuteStateChanged")', part("EVENT", "ACT") + '\n    else if (type === "InputMuteStateChanged")');
rep('    audioset: (d) => openPop("audioset", d.v),', part("ACT", "HELPER") + '\n    audioset: (d) => openPop("audioset", d.v),');
rep('  let dragging = null;', part("HELPER") + '\n  let dragging = null;');
rep('renderTiles(); renderBot(); if (st.pop === "iso"', 'renderTiles(); if (!dragging) renderMixer(); renderBot(); if (st.pop === "iso"');
rep('const t = e.target, d = t.dataset; if (!d || !d.fx || !st.aset) return;',
    'const t = e.target, d = t.dataset; if (d && d.pan) { const a = st.audio.get(d.pan); if (a) a.bal = +t.value; run(req("SetInputAudioBalance", { inputName: d.pan, inputAudioBalance: +t.value })); return; } if (!d || !d.fx || !st.aset) return;');
rep("</style>", `  /* Mixer in the reference layout: fixed-size strips that wrap into rows, OUTPUTS before INPUTS. */
  .mixer { width: 34vw; min-width: 336px; max-width: none; flex-wrap: wrap; align-content: flex-start; gap: 6px 4px; padding: 6px; overflow: hidden auto; }
  .mixer .sec { width: 20px; height: 186px; padding: 0; line-height: 20px; }
  .strip { width: 100px; height: 186px; padding: 0; gap: 0; display: grid; grid-template-rows: 18px 12px minmax(0, 1fr) 27px; align-items: stretch; background: #0b0d11; border: 1px solid #2a313c; border-radius: 0; }
  .strip .hd { display: flex; min-width: 0; background: #000; font-size: 11px; line-height: 18px; }
  .strip .hd b { flex: none; min-width: 18px; padding: 0 3px; text-align: center; background: #2b323d; color: #fff; font-weight: 700; }
  .strip .hd span { flex: 1; min-width: 0; padding: 0 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #f3ecc8; }
  .strip.out .hd { background: #3a4350; } .strip.out .hd span { color: #fff; font-weight: 700; text-align: center; }
  .strip .pan { display: grid; place-items: center; }
  .strip .pan input { width: 48px; height: 10px; margin: 0; padding: 0; border: 0; -webkit-appearance: none; appearance: none; background: transparent; cursor: ew-resize; }
  .strip .pan input::-webkit-slider-runnable-track { height: 2px; background: #5b6676; }
  .strip .pan input::-webkit-slider-thumb { -webkit-appearance: none; width: 5px; height: 10px; margin-top: -4px; background: #e3e8ef; border: 1px solid #10141a; }
  .strip .bd { flex: none; min-height: 0; display: grid; grid-template-columns: 26px minmax(0, 1fr) 5px 5px; gap: 2px; padding: 1px 3px 0 4px; }
  .strip .col { gap: 3px; } .strip .col button, .strip .bt button { width: 26px; height: 22px; } .strip .col button svg { width: 14px; height: 14px; }
  .strip .col .fw { cursor: default; } .strip .col .fw svg { opacity: .28; } .strip .col .fw.lit svg { opacity: 1; }
  .strip .col .na { color: #505966; cursor: default; background: #1c2129; }
  .strip .fd, .strip .fdx { width: auto; background: repeating-linear-gradient(180deg, #7f8a99 0 1px, transparent 1px 12px) left 5px top 5px / 6px calc(100% - 10px) no-repeat, repeating-linear-gradient(180deg, #7f8a99 0 1px, transparent 1px 12px) right 5px top 5px / 6px calc(100% - 10px) no-repeat; }
  .strip .fd i { left: 50%; right: auto; width: 22px; margin-left: -11px; }
  .strip .fdx { position: relative; opacity: .3; } .strip .fdx::before { content: ""; position: absolute; left: 50%; top: 4px; bottom: 4px; width: 2px; margin-left: -1px; background: #505966; }
  .strip .mt { width: 5px; border-radius: 0; }
  .strip .bt { gap: 3px; padding: 0 4px; align-items: center; } .strip .bt small { font-size: 9px; color: var(--mut); white-space: nowrap; }
</style>`);
if (!missing) writeFileSync(dir + "/painel/mesa.html", s);
console.log(`${done} trechos alterados, ${missing} não encontrados${missing ? " (arquivo NÃO gravado)" : ""}`);
