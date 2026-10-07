# Wire the embedded switcher panel into the portable OBS: panel credentials file, scene collection, labels, theme, dock layout.
import base64, copy, json, os, re, shutil, sys, uuid
from PySide6.QtCore import Qt, QSize
from PySide6.QtWidgets import QApplication, QDockWidget, QMainWindow, QSizePolicy, QWidget

ROOT = r"D:\DRIVE\IA\antigravity\vmixtwste\obs-vmix"
CFG = ROOT + r"\config\obs-studio"
PANEL_TITLE = "Mesa"
PANEL_DOCK = PANEL_TITLE + "_extraBrowser"
W, H, PANEL_H = 1536, 881, 400

# 1. panel/local.js: address and password of this OBS's control server (kept out of the page and of any URL)
ws = json.load(open(CFG + r"\plugin_config\obs-websocket\config.json", encoding="utf-8"))
open(ROOT + r"\painel\local.js", "w", encoding="utf-8", newline="\n").write(
    "// Gerado a partir de config/obs-studio/plugin_config/obs-websocket/config.json. Se trocar a senha no OBS, troque aqui.\n"
    "window.MESA_LOCAL = " + json.dumps({"url": "ws://127.0.0.1:%d" % ws["server_port"], "password": ws["server_password"]}) + ";\n")

# 2. scene collection
col_path = CFG + r"\basic\scenes\Demonstracao.json"
col = json.load(open(col_path, encoding="utf-8"))
col["modules"]["source-dock"] = {"docks": [], "windows": [], "corner_tl": False, "corner_tr": False, "corner_br": False, "corner_bl": False}
base = copy.deepcopy(col["modules"]["downstream_keyers"][0])
keyers = []
for n in "1234":
    k = copy.deepcopy(base)
    k.update({"name": n, "scene": "", "hide_after": 0, "scenes": [{"name": "GC TARJA"}] if n == "1" else []})
    keyers.append(k)
col["modules"]["downstream_keyers"] = keyers
have = {t["name"] for t in col.get("transitions", [])}
for name, kind in [("Wipe", "wipe_transition"), ("Slide", "slide_transition")]:
    if name not in have:
        col.setdefault("transitions", []).append({"name": name, "id": kind, "settings": {}})
col["quick_transitions"] = [
    {"name": "Cortar", "duration": 300, "hotkeys": [], "id": 1, "fade_to_black": False},
    {"name": "Esmaecer", "duration": 500, "hotkeys": [], "id": 2, "fade_to_black": False},
    {"name": "Wipe", "duration": 500, "hotkeys": [], "id": 3, "fade_to_black": False},
    {"name": "Slide", "duration": 500, "hotkeys": [], "id": 4, "fade_to_black": False},
    {"name": "Esmaecer", "duration": 500, "hotkeys": [], "id": 5, "fade_to_black": True},
]
json.dump(col, open(col_path, "w", encoding="utf-8"), ensure_ascii=False, indent=4)

# 3. labels of the portable copy only (original kept in originais/)
loc = ROOT + r"\data\obs-studio\locale\pt-BR.ini"
os.makedirs(ROOT + r"\originais", exist_ok=True)
if not os.path.exists(ROOT + r"\originais\pt-BR.ini"):
    shutil.copy2(loc, ROOT + r"\originais\pt-BR.ini")
text = open(loc, encoding="utf-8").read()
for key, value in {"StudioMode.Preview": "Preview", "StudioMode.Program": "Output", "StudioMode.PreviewSceneName": "Preview: %1",
                   "StudioMode.ProgramSceneName": "Output: %1", "FadeToBlack": "FTB", "Transition.Cut": None, "Transition.Fade": None}.items():
    if value is not None:
        text, n = re.subn(rf'(?m)^{re.escape(key)}=".*"$', f'{key}="{value}"', text)
        print(f"rótulo {key}: {'ok' if n else 'não encontrado'}")
open(loc, "w", encoding="utf-8", newline="\n").write(text)

# 4. theme additions (idempotent)
theme = CFG + r"\themes\Yami_MesaDeCorte.ovt"
t = open(theme, encoding="utf-8").read()
marker = "/* Embedded panel */"
if marker not in t:
    t += f"""
{marker}

QWidget {{
    font-family: 'Segoe UI', 'Open Sans', Arial, sans-serif;
}}

QDockWidget#{PANEL_DOCK} {{
    font-size: 7pt;
    font-weight: normal;
    color: var(--text_muted);
}}

QDockWidget#{PANEL_DOCK}::title {{
    background-color: var(--grey8);
    padding: 1px 6px;
}}
"""
    open(theme, "w", encoding="utf-8", newline="\n").write(t)

# 5. dock layout: the panel across the bottom, OBS's own docks parked (hidden) as tabs on the right
app = QApplication(sys.argv)
win = QMainWindow()
win.setDockNestingEnabled(True)
win.setAttribute(Qt.WidgetAttribute.WA_DontShowOnScreen, True)
central = QWidget()
central.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Expanding)
win.setCentralWidget(central)
win.menuBar().addMenu("Arquivo")
win.statusBar().showMessage(" ")
for corner in (Qt.Corner.BottomLeftCorner, Qt.Corner.BottomRightCorner):
    win.setCorner(corner, Qt.DockWidgetArea.BottomDockWidgetArea)

def dock(name):
    d = QDockWidget(name, win)
    d.setObjectName(name)
    body = QWidget()
    body.setMinimumSize(QSize(20, 20))
    d.setWidget(body)
    return d

panel = dock(PANEL_DOCK)
win.addDockWidget(Qt.DockWidgetArea.BottomDockWidgetArea, panel)
parked = [dock(n) for n in ["scenesDock", "sourcesDock", "mixerDock", "transitionsDock", "DownstreamKeyerDock", "controlsDock"]]
for d in parked:
    win.addDockWidget(Qt.DockWidgetArea.RightDockWidgetArea, d)
for d in parked[1:]:
    win.tabifyDockWidget(parked[0], d)
stats = dock("statsDock")
win.addDockWidget(Qt.DockWidgetArea.RightDockWidgetArea, stats)
stats.setFloating(True)
win.resize(W, H)
win.show()
app.processEvents()
win.resizeDocks([panel], [PANEL_H], Qt.Orientation.Vertical)
win.resizeDocks([parked[0]], [330], Qt.Orientation.Horizontal)
app.processEvents()
for d in parked + [stats]:
    d.hide()
app.processEvents()
print(f"painel {panel.geometry().width()}x{panel.geometry().height()} | central {central.geometry().width()}x{central.geometry().height()}")
state = bytes(win.saveState().toBase64()).decode()

ini_path = CFG + r"\user.ini"
ini = open(ini_path, encoding="utf-8").read()
def setkey(text, key, value):
    if re.search(rf"(?m)^{re.escape(key)}=", text):
        return re.sub(rf"(?m)^{re.escape(key)}=.*$", lambda m: f"{key}={value}", text)
    return text.replace("[BasicWindow]\n", f"[BasicWindow]\n{key}={value}\n", 1)
old = re.search(r"(?m)^ExtraBrowserDocks=(.*)$", ini)
docks = [d for d in json.loads(old.group(1) or "[]") if d.get("title") != PANEL_TITLE] if old else []
docks.append({"title": PANEL_TITLE, "url": "file:///" + ROOT.replace("\\", "/") + "/painel/mesa.html", "uuid": uuid.uuid4().hex})
ini = setkey(ini, "ExtraBrowserDocks", json.dumps(docks, separators=(",", ":")))
ini = setkey(ini, "DockState", state)
ini = setkey(ini, "SideDocks", "false")
ini = setkey(ini, "DocksLocked", "true")
open(ini_path, "w", encoding="utf-8", newline="\n").write(ini)
print("user.ini atualizado | DockState", len(state), "caracteres")
