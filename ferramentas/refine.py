# Second pass on the portable build (OBS must be closed): transition names, status bar, preview zoom bar.
import json, os, re, shutil

ROOT = r"D:\DRIVE\IA\antigravity\vmixtwste\obs-vmix"
CFG = ROOT + r"\config\obs-studio"

# transition names as on a switcher keyboard (portable copy only)
loc = ROOT + r"\data\obs-plugins\obs-transitions\locale\pt-BR.ini"
keep = ROOT + r"\originais\obs-transitions-pt-BR.ini"
if not os.path.exists(keep):
    shutil.copy2(loc, keep)
text = open(loc, encoding="utf-8").read()
for key, value in {"CutTransition": "Cut", "FadeTransition": "Fade"}.items():
    text, n = re.subn(rf'(?m)^{key}=".*"$', f'{key}="{value}"', text)
    print(f"{key}: {'ok' if n else 'não encontrado'}")
open(loc, "w", encoding="utf-8", newline="\n").write(text)

col_path = CFG + r"\basic\scenes\Demonstracao.json"
col = json.load(open(col_path, encoding="utf-8"))
rename = {"Cortar": "Cut", "Esmaecer": "Fade"}
col["current_transition"] = rename.get(col.get("current_transition"), col.get("current_transition"))
for q in col["quick_transitions"]:
    q["name"] = rename.get(q["name"], q["name"])
col["transition_duration"] = 500
json.dump(col, open(col_path, "w", encoding="utf-8"), ensure_ascii=False, indent=4)
print("transição atual:", col["current_transition"], "| rápidas:", [q["name"] + (" (FTB)" if q["fade_to_black"] else "") for q in col["quick_transitions"]])
print("cenas:", [s["name"] for s in col["scene_order"]], "| fontes de áudio/mídia:", [s["name"] for s in col["sources"] if s["id"] == "ffmpeg_source"])

ini_path = CFG + r"\user.ini"
ini = open(ini_path, encoding="utf-8").read()
ini = re.sub(r"(?m)^ShowStatusBar=.*$", "ShowStatusBar=false", ini)
open(ini_path, "w", encoding="utf-8", newline="\n").write(ini)

theme = CFG + r"\themes\Yami_MesaDeCorte.ovt"
t = open(theme, encoding="utf-8").read()
marker = "/* Preview without the zoom bar */"
if marker not in t:
    t += f"""
{marker}

#previewXContainer {{
    min-height: 0px;
    max-height: 0px;
    border: none;
    margin: 0px;
    padding: 0px;
}}

#previewYScrollBar {{
    min-width: 0px;
    max-width: 0px;
    border: none;
}}
"""
    open(theme, "w", encoding="utf-8", newline="\n").write(t)
print("tema e user.ini atualizados")
