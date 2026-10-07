// One-off edit of painel/mesa.html after comparing with the official vMix 27 help screenshots:
// Input Select with green selection, dark instruction strip, light content area and bottom button bar; tile rows with play / window / gear.
import { readFileSync, writeFileSync } from "node:fs";
const file = "D:/DRIVE/IA/antigravity/vmixtwste/obs-vmix/painel/mesa.html";
let s = readFileSync(file, "utf8"), done = 0, missing = 0;
const rep = (a, b) => { if (!s.includes(a)) { missing++; console.log("trecho não encontrado:", a.slice(0, 70)); return; } s = s.replace(a, () => b); done++; };

rep(`  .toast { position: fixed;`,
`  .pop.wide { padding: 0; } .pop.wide h3 { margin: 0; padding: 6px 10px; background: #0d1014; font-weight: 600; }
  .add { gap: 0; } .add .types { border: 0; background: #0f1418; }
  .add .types button { border-bottom: 0; padding: 4px 8px 4px 10px; } .add .types button.on { background: #0a6b0a; }
  .add .types button::before { content: ""; display: inline-block; width: 9px; height: 9px; margin-right: 9px; border: 2px solid #e3e7ec; vertical-align: -2px; }
  .add .types button.off::before { border-color: var(--dim); }
  .add .form { display: flex; flex-direction: column; background: #f2f3f5; color: #15191e; padding: 8px 10px; }
  .add .form p { order: -1; margin: -8px -10px 10px; padding: 9px 10px; background: #10151a; color: #e3e7ec; }
  .add .form label { color: #333a42; } .add .form input { background: #fff; color: #15191e; border: 1px solid #8f98a3; }
  .pop.wide .row.end { margin: 0; padding: 8px 10px; background: var(--bar); gap: 8px; }
  .pop.wide .row.end .b { min-width: 104px; height: 28px; font-weight: 600; } .pop.wide .row.end .b.on { background: var(--btn); border-color: var(--bd); }
  .r .ic { flex: none; width: 21px; } .r .ic svg { width: 11px; height: 11px; }
  .tri { width: 0; height: 0; border-left: 7px solid currentColor; border-top: 4px solid transparent; border-bottom: 4px solid transparent; }
  .toast { position: fixed;`);
rep(`  const NA = "Sem equivalente no OBS";`, `  const MON = \`<svg viewBox="0 0 24 24"><path d="M3 5h18v11H3zm6 14h6v-2H9z"/></svg>\`;
  const NA = "Sem equivalente no OBS";`);
rep(`title="Cor da entrada"></i><button class="tg" data-a="menu" data-v="\${v}" title="Menu da entrada (ou clique direito)">\${GEAR}</button></div>`, `title="Cor da entrada"></i></div>`);
rep(`title="Corte seco para o programa">Cut</button>\${loopB}</div>`, `title="Corte seco para o programa">Cut</button>\${loopB}\${media.length ? \`<button class="ic" data-a="playpause" data-v="\${v}" title="Play / Pause da mídia"><i class="tri"></i></button>\` : \`<button class="ic na" title="Só para entradas com mídia"><i class="tri"></i></button>\`}</div>`);
rep(`<div class="r">\${ov(name)}\${audioB}</div></div>\`;`, `<div class="r">\${ov(name)}\${audioB}<button class="ic" data-a="projector" data-v="\${v}" title="Abrir em janela">\${MON}</button><button class="ic" data-a="menu" data-v="\${v}" title="Menu da entrada (ou clique direito)">\${GEAR}</button></div></div>\`;`);
rep(`    menu: (d) => openPop("menu", d.v),`, `    menu: (d) => openPop("menu", d.v),
    playpause: (d) => run((async () => { for (const i of (st.items.get(d.v) || []).filter((i) => isMedia(i.kind))) { const playing = (await tryReq("GetMediaInputStatus", { inputName: i.name }))?.mediaState === "OBS_MEDIA_STATE_PLAYING"; await req("TriggerMediaInputAction", { inputName: i.name, mediaAction: "OBS_WEBSOCKET_MEDIA_INPUT_ACTION_" + (playing ? "PAUSE" : "PLAY") }); } })()),`);
if (!missing) writeFileSync(file, s);
console.log(`${done} trechos alterados, ${missing} não encontrados${missing ? " (arquivo NÃO gravado)" : ""}`);
