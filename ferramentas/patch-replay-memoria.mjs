// One-off edit of painel/mesa.html: the Replay window shows the engine's memory, each angle gets a Remover button
// (scene, replay source and the capture filter left on the camera), and the status line flags high memory.
import { readFileSync, writeFileSync } from "node:fs";
const file = "D:/DRIVE/IA/antigravity/vmixtwste/obs-vmix/painel/mesa.html";
let s = readFileSync(file, "utf8"), done = 0, missing = 0;
const rep = (a, b, optional) => { const hit = typeof a === "string" ? s.includes(a) : a.test(s); if (!hit) { if (!optional) missing++; console.log((optional ? "opcional não encontrado: " : "trecho não encontrado: ") + String(a).slice(0, 70)); return; } s = s.replace(a, () => b); done++; };

rep('data-a="rpair" data-v="${esc(r.scene)}">No ar</button></td></tr>',
    'data-a="rpair" data-v="${esc(r.scene)}">No ar</button><button class="b" data-a="rpdel" data-v="${esc(r.scene)}" title="Desliga este ângulo e libera a memória dele"${r.scene === st.program ? " disabled" : ""}>Remover</button></td></tr>');
rep('p.innerHTML = `<h3>Replay</h3>` + (',
    'p.innerHTML = `<h3>Replay</h3><p>Memória do programa agora: <b>${st.stats ? Math.round(st.stats.memoryUsage) : "?"} MB</b>. Cada ângulo ligado ocupa memória o tempo todo, mesmo sem uso.</p>` + (');
rep('    record: () => run(req("ToggleRecord")),',
    `    rpdel: (d) => run((async () => {
      const reps = (st.items.get(d.v) || []).filter((i) => i.kind === "replay_source").map((i) => i.name), cams = [];
      for (const r of reps) cams.push((await req("GetInputSettings", { inputName: r })).inputSettings.source);
      await req("RemoveScene", { sceneName: d.v });
      for (const r of reps) await tryReq("RemoveInput", { inputName: r });
      for (const c of cams.filter(Boolean)) for (const f of (await tryReq("GetSourceFilterList", { sourceName: c }))?.filters ?? []) if (f.filterKind.startsWith("replay_filter")) await tryReq("RemoveSourceFilter", { sourceName: c, filterName: f.filterName });
      await sleep(2500); st.stats = await tryReq("GetStats"); renderStat(); if (st.pop === "replay") renderPop();
      toast("Ângulo removido e memória liberada");
    })()),
    record: () => run(req("ToggleRecord")),`);
rep(/<span>Memória: <b>\$\{s\.memoryUsage\.toFixed\(0\)\} MB<\/b><\/span>/,
    '<span${s.memoryUsage > 4000 ? ` class="bad" title="Memória alta: confira os ângulos de replay ligados (botão Replay)"` : ""}>Memória: <b>${s.memoryUsage.toFixed(0)} MB</b></span>', true);
if (!missing) writeFileSync(file, s);
console.log(`${done} trechos alterados, ${missing} não encontrados${missing ? " (arquivo NÃO gravado)" : ""}`);
