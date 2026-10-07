# FreeMix Architecture & Technical Design

## 1. Executive Summary

**FreeMix** is an open-source live video production suite designed to provide a professional, broadcast-grade switcher workflow (inspired by vMix and hardware vision mixers) while running atop the battle-tested, high-performance rendering engine of **OBS Studio** (`libobs`).

Instead of a monolithic, destructive fork that alters the compiled C++ core of OBS (which historically causes "merge hell" and abandoned codebases, as seen in commercial forks like Quicklink StudioPro), FreeMix employs a **modular, layered architecture**:

```
+-----------------------------------------------------------------+
|                   FreeMix Application Layer                     |
|  - Switcher Console Dock (Broadcast UI, Tally, Crossbars)       |
|  - FreeMix Call (WebRTC P2P Multi-Guest Remote Engine)         |
|  - Audio Bus Routing (Master, Aux A, Aux B / Mix-Minus)         |
|  - Win32 Process Branding & Native GPU Splash Screen           |
+-----------------------------------------------------------------+
                                |
                                v (Non-blocking IPC / obs-frontend-api)
+-----------------------------------------------------------------+
|                    OBS Studio Core & Plugins                    |
|  - libobs (C/C++ Direct3D 11 / OpenGL render engine)           |
|  - obs-websocket 5.x protocol                                   |
|  - Community Plugins: Source Record (MultiCorder), Replay, DSK |
|  - Hardware Encoders: NVENC, QuickSync, Apple VT, AMF, x264     |
+-----------------------------------------------------------------+
```

---

## 2. Decoupled Architectural Layers

### Phase 1: Portable Extension & Broadcast Dock (Current)
- **Engine**: Official unmodified OBS Studio 64-bit portable runtime.
- **Switching Surface**: Native Chromium Embedded Framework (CEF) browser dock running at hardware refresh rate.
- **Communication**: Asynchronous, high-throughput WebSocket (`obs-websocket 5.x`). If the UI encounters an intense DOM repaint, video rendering and hardware encoding continue at 60 fps without dropping a single frame.
- **Process Integration**: Win32 background daemons handle dynamic window titles and taskbar icon assignment (`WM_SETICON`) without altering signed executables.

### Phase 2: Native Qt/C++ Extension Plugin (`obs-freemix`)
- Utilizing `obs-frontend-api` to register custom top-level menu bars:
  - `Produção` (Production): New production, Open, Save, Templates, Backup.
  - `Entradas` (Inputs): Add, Duplicate, Batch configure, Categories.
  - `Áudio` (Audio): Master and Aux Bus matrix, mix-minus routing.
  - `Saídas` (Outputs): Streaming multi-destinations, Recording profiles, Virtual Camera.
  - `Layout`: Preview/Program densities, multiview configurations, Operate vs. Edit toggle.
  - `Ferramentas` (Tools): Replay director, FreeMix Call manager, SPX-GC Graphics.
- Native dock replacement using `obs_frontend_add_dock_by_id`.

### Phase 3: Modular UI Fork (Long-Term)
- Should deep customizations require restructuring the root `QMainWindow` beyond Qt hook capabilities, maintain a dedicated **UI-only fork** while linking directly against upstream `libobs` and plugin headers.

---

## 3. Operational Workflow vs. Edit Modes

Traditional OBS keeps transformation bounding boxes and crop handles active in the preview canvas. FreeMix introduces distinct operational states:

1. **Operate Mode (`Modo Operar`)**:
   - Preview canvas acts strictly as a confidence monitor for the next on-air source.
   - Accidental dragging, resizing, or transformation of scene items is locked.
   - Single-click prepares the source into Preview; Double-click opens its specific Properties dialog.
   - Transition buttons (`Cut`, `Fade`, `Quick Play`) trigger state changes immediately.

2. **Compose Mode (`Modo Editar`)**:
   - Unlocks bounding boxes, scale gizmos, alignment guides, and layer ordering.

---

## 4. Audio Architecture & Mix-Minus (Audio Buses)

FreeMix exposes a broadcast bus matrix built upon OBS's 6 audio tracks:
- **Track 1 (`M` - Master)**: PGM audio sent to the primary livestream and recording.
- **Track 2**: Clean feed (isolated program minus graphics/voiceovers).
- **Track 3 (`A` - Aux A)**: Remote guest return bus (Mix-Minus: hears program audio minus their own voice to eliminate feedback/echo).
- **Track 4 (`B` - Aux B)**: Operator headphones & intercom monitoring.

---

## 5. FreeMix Call (Low-Latency Remote Guests)

- Powered by peer-to-peer WebRTC via modern browser capture (`browser_source`).
- **Zero Cloud Subscription**: Directly negotiates encrypted audio/video peer connections.
- **Audio Separation**: `reroute_audio: true` injects the guest's discrete audio feed into the mixer as an independent strip, allowing custom EQ, filters, and bus routing.
- **Program Return**: Automated reverse link broadcasting the OBS Virtual Camera feed back to the guest's smartphone or browser.

---

## 6. License & Compliance

FreeMix is licensed under the **GNU General Public License v2.0 (GPL-2.0)** to maintain 100% compliance with OBS Studio and its ecosystem. Commercial distribution or monetization is permitted under the terms of the GPL, provided corresponding source code is made available.
