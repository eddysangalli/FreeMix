// One-off edit: fuller Recording and Streaming windows (format list on the left, the engine's real fields on the
// right) in painel/mesa.html, and a production clock (recording time, streaming time, time of day) in painel/topbar.html.
import { readFileSync, writeFileSync } from "node:fs";
const dir = "D:/DRIVE/IA/antigravity/vmixtwste/obs-vmix";
const snip = readFileSync(dir + "/ferramentas/janelas-config.snippet.js", "utf8").replace(/\r\n/g, "\n");
const part = (name, next) => snip.slice(snip.indexOf("//@@" + name) + name.length + 5, next ? snip.indexOf("//@@" + next) : undefined).replace(/\n$/, "");
let missing = 0;
const cut = (s, from, to, body, what) => { const a = s.indexOf(from), b = s.indexOf(to, a); if (a < 0 || b < 0) { missing++; console.log("trecho não encontrado: " + what); return s; } return s.slice(0, a) + body + "\n" + s.slice(b); };

let m = readFileSync(dir + "/painel/mesa.html", "utf8");
m = cut(m, "    cfgload: () => run((async () => {", "    cfgvideo: () =>", part("ACT", "POP"), "ações de configuração");
m = cut(m, '      else if (st.pop === "streamset") p.innerHTML =', "      else p.innerHTML = `<h3>Configurar: vídeo da produção</h3>", part("POP"), "janelas de transmissão e gravação");
const wide = '${st.pop === "add" || st.pop === "ext" ? " wide" : ""}';
if (m.includes(wide)) m = m.replace(wide, () => '${["add", "ext", "recset", "streamset"].includes(st.pop) ? " wide" : ""}'); else { missing++; console.log("trecho não encontrado: largura das janelas"); }
m = m.replace("</style>", "  .two { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; } .add .form select { background: #fff; color: #15191e; border: 1px solid #8f98a3; } .add .form input:disabled, .add .form select:disabled { background: #e3e5e8; color: #5a636e; }\n</style>");

let t = readFileSync(dir + "/painel/topbar.html", "utf8");
const mark = '<button class="b dd" data-open="ext" title="Central de saídas">▼</button>';
if (t.includes(mark) && !t.includes('id="k-rec"')) {
  t = t.replace(mark, () => mark + '\n    <span class="clk" title="Relógio de produção: tempo de gravação, tempo de transmissão e hora"><b id="k-rec">REC 00:00:00</b><b id="k-str">NO AR 00:00:00</b><b id="k-now"></b></span>');
  t = t.replace("  .lab { padding:", "  .clk { display: inline-flex; gap: 10px; margin-left: 10px; padding: 0 10px; height: 22px; align-items: center; background: #000; border: 1px solid #f2f5f8; font: 700 12px Consolas, monospace; } .clk b { color: #5a636e; } .clk b.on { color: #ff5a4f; } .clk #k-now { color: #f2f5f8; }\n  .lab { padding:");
  t = t.replace("  paint(); connect();", `  // Production clock: both counters come from the engine once a second.
  setInterval(async () => {
    $("k-now").textContent = new Date().toLocaleTimeString("pt-BR");
    if (!on) return;
    const [r, s] = await Promise.all([req("GetRecordStatus").catch(() => null), req("GetStreamStatus").catch(() => null)]);
    $("k-rec").textContent = "REC " + (r && r.outputActive ? r.outputTimecode.slice(0, 8) : "00:00:00"); $("k-rec").classList.toggle("on", !!(r && r.outputActive));
    $("k-str").textContent = "NO AR " + (s && s.outputActive ? s.outputTimecode.slice(0, 8) : "00:00:00"); $("k-str").classList.toggle("on", !!(s && s.outputActive));
  }, 1000);
  paint(); connect();`);
} else if (!t.includes('id="k-rec"')) { missing++; console.log("trecho não encontrado: centro da barra de cima"); }

if (!missing) { writeFileSync(dir + "/painel/mesa.html", m); writeFileSync(dir + "/painel/topbar.html", t); }
console.log(missing ? `${missing} trechos não encontrados (nada gravado)` : "janelas de gravação e transmissão e relógio de produção aplicados");
