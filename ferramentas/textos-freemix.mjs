// Adds (or updates) the FreeMix texts in the language files: the ones of the fork's source and the ones the program
// reads in this portable copy. Run after adding a new FreeMix.* text key to the C++ code; safe to run again.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../../", import.meta.url));
// A key with null is removed from the files (texts the code no longer uses).
const TEXTS = {
  "FreeMix.Close.Title": ["FreeMix Studio", "FreeMix Studio"],
  "FreeMix.Close.Question": ["Do you want to save the changes to the current Preset?", "Deseja salvar as alterações no Preset atual?"],
  "FreeMix.Close.Save": ["Save and close", "Salvar e fechar"],
  "FreeMix.Close.Discard": ["Discard changes and Close", "Descartar alterações e Fechar"],
  "FreeMix.Close.Cancel": ["Cancel", "Cancelar"],
  "FreeMix.Close.LiveText": ["FreeMix Studio is RECORDING or STREAMING LIVE. Closing the program now stops it at once.", "O FreeMix Studio está GRAVANDO ou TRANSMITINDO AO VIVO. Fechar o programa agora interrompe a emissão na hora."],
  "FreeMix.Close.Text": null,
  "FreeMix.Close.LiveTitle": null,
};
const files = [["freemix-app/frontend/data/locale/en-US.ini", 0], ["freemix-app/frontend/data/locale/pt-BR.ini", 1], ["obs-vmix/data/obs-studio/locale/en-US.ini", 0], ["obs-vmix/data/obs-studio/locale/pt-BR.ini", 1]];
for (const [rel, lang] of files) {
  const file = root + rel; if (!existsSync(file)) { console.log("ausente: " + rel); continue; }
  let s = readFileSync(file, "utf8"); const nl = s.includes("\r\n") ? "\r\n" : "\n"; let added = 0, changed = 0;
  for (const [key, values] of Object.entries(TEXTS)) {
    if (values === null) { const kept = s.split(/\r?\n/).filter((l) => !l.startsWith(key + "=")); if (kept.length !== s.split(/\r?\n/).length) { s = kept.join(nl); changed++; } continue; }
    const line = `${key}="${values[lang]}"`, at = s.split(/\r?\n/).findIndex((l) => l.startsWith(key + "="));
    if (at < 0) { s = s.replace(/(\r?\n)*$/, "") + nl + line + nl; added++; }
    else { const lines = s.split(/\r?\n/); if (lines[at] !== line) { lines[at] = line; s = lines.join(nl); changed++; } }
  }
  writeFileSync(file, s); console.log(`${rel}: ${added} novos, ${changed} atualizados`);
}
