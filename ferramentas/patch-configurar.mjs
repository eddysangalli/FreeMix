// One-off edit of painel/mesa.html: "Configurar" opens the engine's full Settings window (through the local helper,
// which invokes the hidden native menu). The small video window stays reachable from the arrow's list.
import { readFileSync, writeFileSync } from "node:fs";
const file = "D:/DRIVE/IA/antigravity/vmixtwste/obs-vmix/painel/mesa.html";
let s = readFileSync(file, "utf8"), done = 0, missing = 0;
const rep = (a, b) => { if (!s.includes(a)) { missing++; console.log("trecho não encontrado: " + a.slice(0, 70)); return; } s = s.replace(a, () => b); done++; };
rep('if (f && f.open) { st.pop = null; openPop(f.open, f.arg || undefined); }',
    'if (f && f.open === "config") A.nativecfg(); else if (f && f.open) { st.pop = null; openPop(f.open, f.arg || undefined); }');
rep('    record: () => (st.locked && st.rec ? A.lockmsg() : run(req("ToggleRecord"))),',
    '    nativecfg: () => run((async () => { closePop(); await req("SetPersistentData", { realm: "OBS_WEBSOCKET_DATA_REALM_GLOBAL", slotName: "freemix_cmd", slotValue: { id: Date.now(), cmd: "settings" } }); toast("Abrindo as configurações completas…"); })()),\n' +
    '    record: () => (st.locked && st.rec ? A.lockmsg() : run(req("ToggleRecord"))),');
rep('<button data-a="pop" data-v="config">Vídeo da produção (tamanho, taxa de quadros)…</button>',
    '<button data-a="nativecfg"><b>Configurações completas do sistema…</b></button><button data-a="pop" data-v="config">Vídeo da produção (tamanho, taxa de quadros)…</button>');
if (!missing) writeFileSync(file, s);
console.log(`${done} trechos alterados, ${missing} não encontrados${missing ? " (arquivo NÃO gravado)" : ""}`);
