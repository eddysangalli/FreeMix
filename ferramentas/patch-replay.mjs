// One-off edit of painel/mesa.html: Replay button and window (Exeldro's Replay Source plugin, one source per camera angle).
import { readFileSync, writeFileSync } from "node:fs";

const file = "D:/DRIVE/IA/antigravity/vmixtwste/obs-vmix/painel/mesa.html";
let s = readFileSync(file, "utf8");
let done = 0, missing = 0;
const rep = (a, b) => { if (!s.includes(a)) { missing++; console.log("trecho não encontrado:", a.slice(0, 70).replace(/\n/g, " ")); return; } s = s.replace(a, () => b); done++; };

rep(`hasIso: false, pl: null, tags:`, `hasIso: false, pl: null, rp: [], rpBack: "", rpSpeed: 100, tags:`);
rep(`const items = new Map(), loop = new Map(), iso = new Map(); let pl = null;`, `const items = new Map(), loop = new Map(), iso = new Map(), rp = []; let pl = null;`);
rep(`        if (isPlaylist(i.kind) && !pl) pl = {`, `        if (i.kind === "replay_source") rp.push({ name: i.name, scene: name });
        if (isPlaylist(i.kind) && !pl) pl = {`);
rep(`st.items = items; st.loop = loop; st.iso = iso; st.pl = pl;`, `st.items = items; st.loop = loop; st.iso = iso; st.pl = pl; st.rp = rp;`);
rep(`if (st.pop === "iso" || st.pop === "playlist") renderPop();`, `if (st.pop === "iso" || st.pop === "playlist" || st.pop === "replay") renderPop();`);
rep(`if (type === "CurrentProgramSceneChanged") { st.program = d.sceneName; renderTiles(); }`, `if (type === "CurrentProgramSceneChanged") { st.program = d.sceneName; renderTiles(); renderBot(); if (st.pop === "replay") renderPop(); }`);

rep(`    record: () => run(req("ToggleRecord")),`,
  `    rpadd: () => run((async () => {
      const cam = $("rp-cam").value, sec = +$("rp-sec").value, inside = st.items.get(cam) || []; if (!cam) return;
      // One source in the entry: buffer that source directly (lighter). Otherwise buffer the whole entry.
      const source = inside.length === 1 ? inside[0].name : cam, scene = \`REPLAY \${cam}\`, input = \`Replay \${cam}\`, w = st.video?.baseWidth || 1920, h = st.video?.baseHeight || 1080;
      await req("CreateScene", { sceneName: scene });
      const { sceneItemId } = await req("CreateInput", { sceneName: scene, inputName: input, inputKind: "replay_source", inputSettings: { source, duration: sec * 1000, replays: 10, speed_percent: st.rpSpeed } });
      await tryReq("SetSceneItemTransform", { sceneName: scene, sceneItemId, sceneItemTransform: { positionX: 0, positionY: 0, boundsType: "OBS_BOUNDS_SCALE_INNER", boundsWidth: w, boundsHeight: h, boundsAlignment: 0 } });
      toast(\`Ângulo de replay de \${cam}: últimos \${sec} s\`);
    })()),
    rpgrab: () => run((async () => { for (const r of st.rp) await req("TriggerHotkeyByName", { hotkeyName: "ReplaySource.Replay", contextName: r.name }); toast("Lance capturado"); })()),
    rpspeed: (d) => run((async () => { for (const r of st.rp) await req("SetInputSettings", { inputName: r.name, inputSettings: { speed_percent: +d.v } }); st.rpSpeed = +d.v; if (st.pop === "replay") renderPop(); })()),
    rpmedia: (d) => run((async () => { for (const r of st.rp) await req("TriggerMediaInputAction", { inputName: r.name, mediaAction: "OBS_WEBSOCKET_MEDIA_INPUT_ACTION_" + d.v }); })()),
    rpair: (d) => { if (!st.rp.some((r) => r.scene === st.program)) st.rpBack = st.program; A.quick({ v: d.v }); },
    rplive: () => { if (st.rpBack) A.quick({ v: st.rpBack }); },
    record: () => run(req("ToggleRecord")),`);

rep(`<button class="b" data-a="pop" data-v="playlist"\${off}>PlayList</button>`,
  `<button class="b" data-a="pop" data-v="playlist"\${off}>PlayList</button>
        \${st.kinds.includes("replay_source") ? \`<button class="b\${st.rp.some((r) => r.scene === st.program) ? " live" : ""}" data-a="pop" data-v="replay"\${off}>Replay</button>\` : ""}`);

rep(`    else if (st.pop === "gear") p.innerHTML =`,
  `    else if (st.pop === "replay") {
      const cams = st.scenes.filter((n) => !st.rp.some((r) => r.scene === n)), onAir = st.rp.some((r) => r.scene === st.program);
      p.innerHTML = \`<h3>Replay</h3>\` + (st.rp.length ? \`<table>\${st.rp.map((r) => \`<tr><td><b>\${esc(r.scene)}</b></td><td style="text-align:right"><button class="b\${r.scene === st.program ? " live" : ""}" data-a="rpair" data-v="\${esc(r.scene)}">No ar</button></td></tr>\`).join("")}</table>
        <div class="row"><button class="b on" data-a="rpgrab">Capturar lance</button><button class="b" data-a="rpmedia" data-v="PREVIOUS">Anterior</button><button class="b" data-a="rpmedia" data-v="NEXT">Próximo</button><button class="b" data-a="rpmedia" data-v="PAUSE">Pause</button><button class="b" data-a="rpmedia" data-v="PLAY">Play</button></div>
        <div class="row">\${[25, 50, 100].map((v) => \`<button class="b\${st.rpSpeed === v ? " on" : ""}" data-a="rpspeed" data-v="\${v}">\${v}%</button>\`).join("")}<button class="b" data-a="rplive"\${st.rpBack && onAir ? "" : " disabled"}>Voltar ao vivo</button></div>\` : \`<p>Nenhum ângulo ainda.</p>\`)
        + \`<p style="margin-top:8px">Novo ângulo: guarda os últimos segundos da câmera na memória (cerca de 0,2 GB por segundo em 1080p).</p><div class="row"><select id="rp-cam">\${cams.map((n) => \`<option>\${esc(n)}</option>\`).join("")}</select><select id="rp-sec">\${[5, 10, 15, 20, 30].map((v) => \`<option value="\${v}">\${v} s</option>\`).join("")}</select><button class="b" data-a="rpadd">Adicionar ângulo</button><button class="b" data-a="close">Fechar</button></div>\`;
    }
    else if (st.pop === "gear") p.innerHTML =`);

if (!missing) writeFileSync(file, s);
console.log(`${done} trechos alterados, ${missing} não encontrados${missing ? " (arquivo NÃO gravado)" : ""}`);
