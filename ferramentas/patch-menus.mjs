// One-off edit of painel/mesa.html: the small menus (input settings, Configurar, the bottom-right menu, the arrows of
// the bottom bar) had no style at all (items ran together on one line) and always opened in the bottom-left corner.
// Now they are a column of rows and open where the mouse was clicked, flipping upwards or leftwards near the edges.
import { readFileSync, writeFileSync } from "node:fs";
const file = "D:/DRIVE/IA/antigravity/vmixtwste/obs-vmix/painel/mesa.html";
let s = readFileSync(file, "utf8"), done = 0, missing = 0;
const rep = (a, b) => { if (!s.includes(a)) { missing++; console.log("trecho não encontrado: " + a.slice(0, 70)); return; } s = s.replace(a, () => b); done++; };

rep("  function renderPop() {", `  // Where the last click happened: menus open there.
  document.addEventListener("pointerdown", (e) => { st.popAt = { x: e.clientX, y: e.clientY }; }, true);
  function placePop() {
    const p = $("pop"), menu = st.pop && !p.classList.contains("wide") && !!p.querySelector(".menu");
    p.classList.toggle("ctx", !!menu);
    if (!menu) { p.style.left = p.style.top = p.style.right = p.style.bottom = ""; return; }
    const at = st.popAt || { x: 8, y: innerHeight }, w = p.offsetWidth, h = p.offsetHeight;
    p.style.left = clamp(at.x, 6, Math.max(6, innerWidth - w - 6)) + "px";
    p.style.top = (at.y + h + 6 > innerHeight ? Math.max(6, at.y - h) : at.y) + "px";
    p.style.right = p.style.bottom = "auto";
  }
  function renderPop() { renderPopBody(); placePop(); }
  function renderPopBody() {`);
rep('if (f && f.open === "config") A.nativecfg(); else if (f && f.open) { st.pop = null;', 'if (f && f.open === "config") A.nativecfg(); else if (f && f.open) { st.pop = null; st.popAt = { x: innerWidth, y: 0 };');
rep('const closePop = () => { st.pop = null; $("pop").className = "pop"; };', 'const closePop = () => { const p = $("pop"); st.pop = null; p.className = "pop"; p.style.left = p.style.top = p.style.right = p.style.bottom = ""; };');
rep("</style>", `  /* Small menus: a column of rows, opened where the mouse was (see placePop). */
  .pop.ctx { width: auto; min-width: 240px; max-width: 360px; padding: 0 0 4px; border-radius: 0; border-color: #55647a; }
  .pop.ctx h3 { margin: 0 0 4px; padding: 6px 12px; font-size: 12px; background: var(--bar); border-bottom: 1px solid #2f3744; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pop .menu { display: flex; flex-direction: column; }
  .pop .menu button { text-align: left; padding: 6px 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--tx); }
  .pop .menu button:hover { background: #0b6bbf; color: #fff; }
  .pop.ctx .row { padding: 4px 10px 2px; margin: 0; } .pop.ctx p { padding: 4px 12px 0; }
</style>`);
if (!missing) writeFileSync(file, s);
console.log(`${done} trechos alterados, ${missing} não encontrados${missing ? " (arquivo NÃO gravado)" : ""}`);
