# Top bar dock above Preview/Output, panel below, native docks parked; menu bar and tally colours in the theme.
# Run with the engine closed. Needs PySide6 (pip install PySide6-Essentials).
import base64, json, re, shutil, sys
from PySide6.QtCore import Qt, QSize
from PySide6.QtWidgets import QApplication, QDockWidget, QMainWindow, QSizePolicy, QWidget

ROOT = r"D:\DRIVE\IA\antigravity\vmixtwste\obs-vmix"
CFG = ROOT + r"\config\obs-studio"
W, H, TOP_H, PANEL_H = 1920, 1127, 46, 431

if len(sys.argv) > 1:      # engine's own base theme file, as shipped
    shutil.copy2(sys.argv[1], ROOT + r"\data\obs-studio\themes\Yami.obt")
theme = CFG + r"\themes\Yami_MesaDeCorte.ovt"
t = open(theme, encoding="utf-8").read()
t = re.sub(r"(?ms)^QMenuBar[^{\n]*\{.*?^\}\n?", "", t)
t = t.split("/* FreeMix top area */")[0].rstrip() + """

/* FreeMix top area */

QMenuBar {
    background-color: var(--grey8);
    padding: 0px 4px;
}

QMenuBar::item {
    background: transparent;
    padding: 3px 9px;
}

QMenuBar::item:selected {
    background-color: var(--grey4);
}

QDockWidget#Menu_extraBrowser {
    min-height: 46px;
    max-height: 46px;
    font-size: 7pt;
    font-weight: normal;
    color: var(--text_muted);
}

QDockWidget#Menu_extraBrowser::title {
    background-color: var(--grey8);
    padding: 0px 6px;
}

/* Tally colours: red is on air, green is preview */

.label-preview-title {
    background-color: #d92418;
    color: #ffffff;
}

#previewLabel {
    background-color: #12a31a;
    color: #ffffff;
}
"""
open(theme, "w", encoding="utf-8", newline="\n").write(t)

loc = ROOT + r"\data\obs-studio\locale\pt-BR.ini"
text = open(loc, encoding="utf-8").read()
text = re.sub(r'(?m)^Basic\.MainMenu\.Profile=".*"$', 'Basic.MainMenu.Profile="&Perfil"', text)
open(loc, "w", encoding="utf-8", newline="\n").write(text)

app = QApplication(sys.argv)
win = QMainWindow(); win.setDockNestingEnabled(True); win.setAttribute(Qt.WidgetAttribute.WA_DontShowOnScreen, True)
central = QWidget(); central.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Expanding); win.setCentralWidget(central)
win.menuBar().addMenu("Arquivo")
def dock(name):
    d = QDockWidget(name, win); d.setObjectName(name); body = QWidget(); body.setMinimumSize(QSize(20, 20)); d.setWidget(body); return d
top, panel = dock("Menu_extraBrowser"), dock("Mesa_extraBrowser")
win.addDockWidget(Qt.DockWidgetArea.TopDockWidgetArea, top)
win.addDockWidget(Qt.DockWidgetArea.BottomDockWidgetArea, panel)
parked = [dock(n) for n in ["scenesDock", "sourcesDock", "mixerDock", "transitionsDock", "DownstreamKeyerDock", "controlsDock"]]
for d in parked: win.addDockWidget(Qt.DockWidgetArea.RightDockWidgetArea, d)
for d in parked[1:]: win.tabifyDockWidget(parked[0], d)
stats = dock("statsDock"); win.addDockWidget(Qt.DockWidgetArea.RightDockWidgetArea, stats); stats.setFloating(True)
win.resize(W, H); win.show(); app.processEvents()
win.resizeDocks([top, panel], [TOP_H, PANEL_H], Qt.Orientation.Vertical)
win.resizeDocks([parked[0]], [330], Qt.Orientation.Horizontal); app.processEvents()
for d in parked + [stats]: d.hide()
app.processEvents()
print(f"topo {top.geometry().width()}x{top.geometry().height()} | central {central.geometry().width()}x{central.geometry().height()} | painel {panel.geometry().width()}x{panel.geometry().height()}")
state = bytes(win.saveState().toBase64()).decode()

ini_path = CFG + r"\user.ini"
ini = open(ini_path, encoding="utf-8").read()
docks = json.loads(re.search(r"(?m)^ExtraBrowserDocks=(.*)$", ini).group(1))
for d in docks:
    if d["url"].endswith("/topbar.html"): d["title"] = "Menu"
ini = re.sub(r"(?m)^ExtraBrowserDocks=.*$", lambda m: "ExtraBrowserDocks=" + json.dumps(docks), ini)
ini = re.sub(r"(?m)^DockState=.*$", lambda m: "DockState=" + state, ini)
open(ini_path, "w", encoding="utf-8", newline="\n").write(ini)
print("painéis:", [d["title"] for d in docks])
