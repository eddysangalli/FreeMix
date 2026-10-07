import { readFileSync } from "node:fs";
for (const f of ["mesa.html", "topbar.html"]) { const h = readFileSync("D:/DRIVE/IA/antigravity/vmixtwste/obs-vmix/painel/" + f, "utf8"); const js = h.slice(h.lastIndexOf("<script>") + 8, h.lastIndexOf("</script>")); try { new Function(js); console.log(f + ": sintaxe ok"); } catch (e) { console.log(f + ": ERRO " + e.message); } }
