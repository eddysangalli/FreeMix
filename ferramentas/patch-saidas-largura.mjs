// One-off edit of painel/mesa.html: the outputs central needs the full width of the panel and must fit its height.
import { readFileSync, writeFileSync } from "node:fs";
const file = "D:/DRIVE/IA/antigravity/vmixtwste/obs-vmix/painel/mesa.html";
let s = readFileSync(file, "utf8"), done = 0;
const rep = (a, b) => { if (!s.includes(a)) { console.log("trecho não encontrado:", a.slice(0, 60)); return; } s = s.replace(a, () => b); done++; };
rep('${st.pop === "add" || st.pop === "ext" ? " wide" : ""}`;', '${st.pop === "add" || st.pop === "ext" ? " wide" : ""}${st.pop === "ext" ? " xwide" : ""}`;');
rep("  .outs select { height: 22px;", "  .pop.xwide { width: min(1260px, calc(100vw - 16px)); bottom: 26px; } .pop.xwide .outs { max-height: calc(100vh - 150px); }\n  .outs td { max-width: 330px; overflow: hidden; text-overflow: ellipsis; }\n  .outs select { height: 22px;");
writeFileSync(file, s);
console.log(done, "trechos alterados");
