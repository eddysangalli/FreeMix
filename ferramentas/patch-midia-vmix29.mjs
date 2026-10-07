import { readFileSync, writeFileSync } from "node:fs";

const file = "D:/DRIVE/IA/antigravity/vmixtwste/obs-vmix/painel/mesa.html";
let s = readFileSync(file, "utf8");

// 1. Atualizar grid-template-rows do body para 44px
s = s.replace(
  "    display: grid; grid-template-rows: 28px 24px minmax(0, 1fr) 34px 22px; overflow: hidden;",
  "    display: grid; grid-template-rows: 44px 24px minmax(0, 1fr) 34px 22px; overflow: hidden;"
);

// 2. Substituir o bloco CSS da media-row pelo estilo broadcast vMix 29
const oldCssStart = "  /* media controls row under preview/output */";
const oldCssEnd = "  /* category tabs & brand */";
const newCss = `  /* media controls row under preview/output - vMix 29 Broadcast Style */
  .media-row {
    display: grid; grid-template-columns: 1fr 1fr;
    background: #12151b; border-bottom: 1px solid #232c3a; height: 44px;
    gap: 12px; padding: 2px 10px; box-sizing: border-box;
  }
  .media-bar {
    display: flex; flex-direction: column; justify-content: center; gap: 2px;
    position: relative; overflow: hidden;
  }
  .media-bar.pv { padding-right: 4px; border-right: 1px solid #1a2029; }
  .media-bar.pgm { padding-left: 4px; }
  .media-bar.disabled { opacity: 0.35; filter: grayscale(0.6); pointer-events: none; }

  /* 1. Time display row: 00:00:03 / 00:00:10 / 00:00:07 */
  .media-time-row {
    display: flex; justify-content: center; align-items: center; gap: 4px;
    font-family: Consolas, "Courier New", monospace; font-size: 13px; font-weight: 700;
    color: #ff2222; text-shadow: 0 0 5px rgba(255, 34, 34, 0.45); line-height: 1; letter-spacing: 0.5px;
  }
  .media-bar.disabled .media-time-row { color: #5a1818; text-shadow: none; }
  .media-time-row .sep { color: #801818; margin: 0 3px; font-weight: 400; }

  /* 2. Control row: Fader track + Reiniciar + Pause/Play */
  .media-ctrl-row {
    display: flex; align-items: center; gap: 6px; height: 22px;
  }
  .vmix-track-wrap {
    flex: 1; position: relative; height: 20px; display: flex; align-items: center; cursor: pointer;
  }
  .vmix-track {
    width: 100%; height: 5px; background: #080a0e; border: 1px solid #303a48;
    border-radius: 1px; box-shadow: inset 0 1px 2px rgba(0,0,0,0.85); position: relative;
  }
  .vmix-progress {
    position: absolute; left: 0; top: 0; bottom: 0; width: 0%;
    background: #3e4c60; border-radius: 1px;
  }
  .vmix-thumb {
    position: absolute; top: 50%; left: 0%; transform: translate(-50%, -50%);
    width: 13px; height: 18px;
    background: linear-gradient(180deg, #d8e0ec 0%, #a4afbf 50%, #7d8b9e 100%);
    border: 1px solid #14171d; border-radius: 1px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.9);
    cursor: ew-resize; display: flex; align-items: center; justify-content: center;
  }
  .vmix-thumb::after {
    content: ""; width: 2px; height: 10px; background: #444f5e;
    border-right: 1px solid rgba(255,255,255,0.4);
  }
  .vmix-btn {
    height: 20px; font-size: 11px; font-weight: 600; color: #d0d7e2;
    background: linear-gradient(180deg, #374150 0%, #252c37 100%);
    border: 1px solid #4a576a; border-radius: 2px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15);
    cursor: pointer; display: inline-flex; align-items: center; justify-content: center;
    white-space: nowrap; user-select: none;
  }
  .vmix-btn:hover {
    background: linear-gradient(180deg, #445163 0%, #2c3542 100%); color: #fff; border-color: #5d6d84;
  }
  .vmix-btn:active {
    background: #1c222b; box-shadow: inset 0 1px 2px rgba(0,0,0,0.6);
  }
  .vmix-btn.restart { padding: 0 8px; font-size: 10.5px; }
  .vmix-btn.pp { width: 24px; font-size: 11px; }

`;

const cssIdx1 = s.indexOf(oldCssStart);
const cssIdx2 = s.indexOf(oldCssEnd);
if (cssIdx1 !== -1 && cssIdx2 !== -1) {
  s = s.slice(0, cssIdx1) + newCss + s.slice(cssIdx2);
} else {
  console.error("Não encontrou bloco CSS");
}

// 3. Substituir o HTML da media-row
const oldHtmlStart = '<div class="media-row" id="media-row">';
const oldHtmlEnd = '<div class="tabs" id="tabs"></div>';
const newHtml = `<div class="media-row" id="media-row">
    <!-- Preview Media Control -->
    <div class="media-bar pv disabled" id="mb-pv">
      <div class="media-time-row">
        <span id="mb-pv-cur">00:00:00</span>
        <span class="sep">/</span>
        <span id="mb-pv-dur">00:00:00</span>
        <span class="sep">/</span>
        <span id="mb-pv-rem">00:00:00</span>
      </div>
      <div class="media-ctrl-row">
        <div class="vmix-track-wrap" id="mb-pv-wrap" data-side="pv">
          <div class="vmix-track">
            <div class="vmix-progress" id="mb-pv-bar"></div>
            <div class="vmix-thumb" id="mb-pv-thumb"></div>
          </div>
        </div>
        <button class="vmix-btn restart" data-a="mb_restart" data-side="pv" title="Reiniciar do Início">Reiniciar</button>
        <button class="vmix-btn pp" data-a="mb_play" data-side="pv" id="mb-pv-play" title="Tocar / Pausar">⏸</button>
      </div>
    </div>

    <!-- Output Media Control -->
    <div class="media-bar pgm disabled" id="mb-pgm">
      <div class="media-time-row">
        <span id="mb-pgm-cur">00:00:00</span>
        <span class="sep">/</span>
        <span id="mb-pgm-dur">00:00:00</span>
        <span class="sep">/</span>
        <span id="mb-pgm-rem">00:00:00</span>
      </div>
      <div class="media-ctrl-row">
        <div class="vmix-track-wrap" id="mb-pgm-wrap" data-side="pgm">
          <div class="vmix-track">
            <div class="vmix-progress" id="mb-pgm-bar"></div>
            <div class="vmix-thumb" id="mb-pgm-thumb"></div>
          </div>
        </div>
        <button class="vmix-btn restart" data-a="mb_restart" data-side="pgm" title="Reiniciar do Início">Reiniciar</button>
        <button class="vmix-btn pp" data-a="mb_play" data-side="pgm" id="mb-pgm-play" title="Tocar / Pausar">⏸</button>
      </div>
    </div>
  </div>
  `;

const htmlIdx1 = s.indexOf(oldHtmlStart);
const htmlIdx2 = s.indexOf(oldHtmlEnd);
if (htmlIdx1 !== -1 && htmlIdx2 !== -1) {
  s = s.slice(0, htmlIdx1) + newHtml + s.slice(htmlIdx2);
} else {
  console.error("Não encontrou bloco HTML");
}

// 4. Substituir a lógica de syncMediaBar e handlers do fader
const oldScriptStart = "  /* ---- Barra de Mídia (VideoControls sob Preview e Output) ---- */";
const oldScriptEnd = "  renderAll(); connect(); thumbLoop(); slowLoop(); mediaLoop();";
const newScript = `  /* ---- Barra de Mídia (vMix 29 Broadcast Controls sob Preview e Output) ---- */
  const fmtMs = (ms) => {
    if (ms == null || isNaN(ms) || ms < 0) return "00:00:00";
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return (h > 0 ? String(h).padStart(2, "0") + ":" : "") + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
  };

  const mediaSourceOf = (sceneName) => {
    if (!sceneName) return null;
    const items = st.items.get(sceneName) || [];
    return items.find((i) => isMedia(i.kind)) || null;
  };

  const mbState = {
    pv: { name: "", dur: 0, cur: 0, state: "", dragging: false },
    pgm: { name: "", dur: 0, cur: 0, state: "", dragging: false },
  };

  async function syncMediaBar(side, sceneName) {
    const bar = $("mb-" + side);
    if (!bar) return;
    const media = mediaSourceOf(sceneName);
    const s = mbState[side];

    if (!media) {
      bar.classList.add("disabled");
      $("mb-" + side + "-cur").textContent = "00:00:00";
      $("mb-" + side + "-dur").textContent = "00:00:00";
      $("mb-" + side + "-rem").textContent = "00:00:00";
      $("mb-" + side + "-bar").style.width = "0%";
      $("mb-" + side + "-thumb").style.left = "0%";
      $("mb-" + side + "-play").textContent = "▶";
      s.name = ""; s.dur = 0; s.cur = 0;
      return;
    }

    bar.classList.remove("disabled");
    s.name = media.name;

    const stMedia = await tryReq("GetMediaInputStatus", { inputName: media.name });
    if (!stMedia) return;

    s.dur = stMedia.mediaDuration || 0;
    s.state = stMedia.mediaState || "";
    const isPlaying = s.state === "OBS_MEDIA_STATE_PLAYING";
    $("mb-" + side + "-play").textContent = isPlaying ? "⏸" : "▶";

    if (!s.dragging) {
      s.cur = stMedia.mediaCursor || 0;
      const rem = Math.max(0, s.dur - s.cur);
      const pct = s.dur > 0 ? Math.min(100, Math.max(0, (s.cur / s.dur) * 100)) : 0;

      $("mb-" + side + "-cur").textContent = fmtMs(s.cur);
      $("mb-" + side + "-dur").textContent = fmtMs(s.dur);
      $("mb-" + side + "-rem").textContent = fmtMs(rem);
      $("mb-" + side + "-bar").style.width = pct + "%";
      $("mb-" + side + "-thumb").style.left = pct + "%";
    }
  }

  // Interatividade do Fader Broadcast do vMix
  ["pv", "pgm"].forEach((side) => {
    const wrap = $("mb-" + side + "-wrap");
    if (!wrap) return;

    const setPositionFromEvent = (e) => {
      const s = mbState[side];
      if (!s.dur) return;
      const rect = wrap.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const pct = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      const curMs = Math.round(pct * s.dur);

      $("mb-" + side + "-bar").style.width = (pct * 100) + "%";
      $("mb-" + side + "-thumb").style.left = (pct * 100) + "%";
      $("mb-" + side + "-cur").textContent = fmtMs(curMs);
      $("mb-" + side + "-rem").textContent = fmtMs(Math.max(0, s.dur - curMs));
      return curMs;
    };

    const startDrag = (e) => {
      e.preventDefault();
      mbState[side].dragging = true;
      const curMs = setPositionFromEvent(e);

      const onMove = (me) => {
        if (mbState[side].dragging) setPositionFromEvent(me);
      };
      const onEnd = (ue) => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onEnd);
        window.removeEventListener("touchmove", onMove);
        window.removeEventListener("touchend", onEnd);
        const finalMs = setPositionFromEvent(ue);
        if (s.name && finalMs != null) {
          run(req("SetMediaInputCursor", { inputName: s.name, mediaCursor: finalMs }));
        }
        setTimeout(() => { mbState[side].dragging = false; }, 250);
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onEnd);
      window.addEventListener("touchmove", onMove);
      window.addEventListener("touchend", onEnd);
    };

    wrap.addEventListener("mousedown", startDrag);
    wrap.addEventListener("touchstart", startDrag);
  });

  // Ações dos botões vMix
  A.mb_restart = (d) => {
    const s = mbState[d.side];
    if (s.name) run(req("TriggerMediaInputAction", { inputName: s.name, mediaAction: "OBS_WEBSOCKET_MEDIA_INPUT_ACTION_RESTART" }));
  };
  A.mb_play = (d) => {
    const s = mbState[d.side];
    if (!s.name) return;
    const act = s.state === "OBS_MEDIA_STATE_PLAYING" ? "OBS_WEBSOCKET_MEDIA_INPUT_ACTION_PAUSE" : "OBS_WEBSOCKET_MEDIA_INPUT_ACTION_PLAY";
    run(req("TriggerMediaInputAction", { inputName: s.name, mediaAction: act }));
  };

  async function mediaLoop() {
    while (true) {
      if (st.on) {
        await syncMediaBar("pv", st.preview).catch(() => {});
        await syncMediaBar("pgm", st.program).catch(() => {});
      }
      await sleep(200);
    }
  }
`;

const scrIdx1 = s.indexOf(oldScriptStart);
const scrIdx2 = s.indexOf(oldScriptEnd);
if (scrIdx1 !== -1 && scrIdx2 !== -1) {
  s = s.slice(0, scrIdx1) + newScript + s.slice(scrIdx2);
} else {
  console.error("Não encontrou bloco de script");
}

writeFileSync(file, s, "utf8");
console.log("Patch aplicado com sucesso em mesa.html!");
