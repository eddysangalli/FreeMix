# FreeMix Roadmap

This roadmap outlines the milestones for the FreeMix live production switcher project.

---

## 🎯 Phase 1: Portable Broadcast Suite (Current · v0.1.0)
- [x] Studio Mode with vMix color scheme (Preview Orange `#f7931e`, Output Green `#0e8a16`).
- [x] Hardware-accelerated WPF borderless splash screen (`splash.ps1`).
- [x] Dynamic Win32 window title and icon daemon (`set-freemix-title.ps1`).
- [x] Broadcast center transition column with T-Bar slider (`Yami_MesaDeCorte.ovt`).
- [x] FreeMix Call integration (VDO.Ninja WebRTC P2P guest connection & return PGM).
- [x] Color-coded category tabs, real-time live clock, and broadcast status bar.
- [x] MultiCorder (ISO recording) via Source Record filter integration.
- [x] Replay angles integration via Replay Source.
- [x] Automated CDP/WebSocket regression test suites (`test-inputs.mjs`, `test-mesa.mjs`).

---

## 🚀 Phase 2: Native Qt Integration & Workflow Refinement (v0.2.0 - v0.4.0)
- [ ] Dedicated FreeMix top menu bar (`Produção`, `Entradas`, `Áudio`, `Saídas`, `Layout`, `Ferramentas`).
- [ ] Dual-state Operate vs. Edit mode toggle (disabling canvas transformation handles during live switching).
- [ ] Crossbar hardware switcher row (1-10 Preview and Program buttons).
- [ ] Conference Room mode in FreeMix Call (multi-guest room where guests see each other before switching).
- [ ] Dedicated Input Properties modal replacing native OBS property popups with streamlined tabs (General, Video, Audio, Bus, Shortcuts).

---

## 🏆 Phase 3: Modular C++ Plugin & Standalone Packaging (v0.5.0+)
- [ ] Compile standalone `obs-freemix.dll` using `obs-frontend-api`.
- [ ] Native QWidget mixer strips for ultra-low latency VU meters.
- [ ] SPX-GC / CasparCG graphics pack integration out-of-the-box.
- [ ] One-click Windows installer (Inno Setup / MSIX) alongside the portable ZIP format.
