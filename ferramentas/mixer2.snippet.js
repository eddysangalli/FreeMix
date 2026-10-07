//@@RENDER
    const ARR = `<svg viewBox="0 0 24 24"><path style="fill:#3fd145" d="M3 6h12V3l6 5-6 5v-3H3z"/><path style="fill:#f7931e" d="M21 15H9v-3l-6 5 6 5v-3h12z"/></svg>`;
    const BUS = [["1", "M", "Master"], ["2", "A", "barramento A"], ["3", "B", "barramento B"]];
    const list = [...st.audio].map(([name, a]) => ({ name, a, n: inputNumber(name) })).sort((x, y) => (x.n || 999) - (y.n || 999));
    const why = "O motor só tem as trilhas de mixagem: ainda não existe fader, medidor nem liga/desliga do barramento. Entra com o componente de barramentos.";
    const out = ([k, l]) => `<div class="strip out" title="${why}"><div class="hd"><span>${l === "M" ? "Master" : l}</span></div><div class="pan"></div><div class="bd"><div class="col"><button class="na">${GEAR}</button><button class="na">${SPK}</button></div><div class="fdx"></div><div class="mt"></div><div class="mt"></div></div><div class="bt"><small>trilha ${k} · ${list.filter((x) => x.a.tracks[k]).length} entr.</small></div></div>`;
    const inp = ({ name, a, n }) => { const v = esc(name);
      return `<div class="strip" data-n="${v}"><div class="hd" title="${v}">${n ? `<b>${n}</b>` : ""}<span>${v}</span></div><div class="pan"><input type="range" min="0" max="1" step="0.05" value="${a.bal}" data-pan="${v}" title="Balanço esquerda / direita"></div>`
        + `<div class="bd"><div class="col"><button data-a="audioset" data-v="${v}" title="Configurar o áudio: ganho, atraso, EQ, compressor, noise gate">${GEAR}</button><button class="${a.mon !== "OBS_MONITORING_TYPE_NONE" ? "on" : ""}" data-a="solo" data-v="${v}" title="Solo: ouvir esta entrada no fone, sem mexer na mixagem">S</button>`
        + `<button class="fw${n ? " lit" : ""}" data-a="follow" data-v="${v}" title="${n ? "Mistura automática ligada: o áudio entra e sai junto com o vídeo (fixo neste motor)" : "Fonte global do motor: áudio sempre ligado, não acompanha o vídeo"}">${ARR}</button><button class="${a.muted ? "muted" : "on"}" data-a="mute" data-v="${v}" title="Liga ou desliga o áudio desta entrada">${SPK}</button></div>`
        + `<div class="fd" data-f="${v}"><i></i></div><div class="mt"></div><div class="mt"></div></div><div class="bt">${BUS.map(([k, l, t]) => `<button class="${a.tracks[k] ? "on" : ""}" data-a="bus" data-k="${k}" data-v="${v}" title="Enviar o áudio desta entrada para ${t} (trilha ${k} do motor)">${l}</button>`).join("")}</div></div>`; };
    box.innerHTML = `<div class="sec">OUTPUTS</div>${BUS.map(out).join("")}<div class="sec">INPUTS</div>` + (list.map(inp).join("") || `<div class="none">Nenhuma fonte de áudio.<br>Adicione microfone e áudio do sistema em Configurações › Áudio, ou crie uma entrada de mídia.</div>`);
//@@EVENT
    else if (type === "InputAudioBalanceChanged") { const a = st.audio.get(d.inputName); if (a) { a.bal = d.inputAudioBalance; const el = document.querySelector(`[data-pan="${CSS.escape(d.inputName)}"]`); if (el && document.activeElement !== el) el.value = a.bal; } }
//@@ACT
    follow: (d) => toast(inputNumber(d.v) ? "Mistura automática: neste motor o áudio desta entrada já entra e sai junto com o vídeo. Ainda não dá para desligar isso por aqui." : "Fonte de áudio global do motor: fica sempre ligada, não acompanha o vídeo."),
//@@HELPER
  // Number of the tile (scene) that holds this audio input; 0 for the engine's global audio devices.
  const inputNumber = (name) => st.scenes.findIndex((s) => (st.items.get(s) || []).some((i) => i.name === name)) + 1;
