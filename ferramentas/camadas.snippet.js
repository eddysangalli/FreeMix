//@@HELPER
  // Inputs instead of scenes: for the operator an input is one thing (a camera, a video, a title). What the engine
  // calls a scene is only the container of that input. Composition is done the way the reference does it:
  // layers (other inputs drawn on top of this one), audio joined to the input, and overlays 1-8.
  // [id, label, x, y, width, height] as fractions of the production frame.
  const LAYOUTS = [["full", "Tela cheia", 0, 0, 1, 1], ["tr", "Quadro em cima à direita", 0.68, 0.04, 0.3, 0.3], ["tl", "Quadro em cima à esquerda", 0.02, 0.04, 0.3, 0.3], ["br", "Quadro embaixo à direita", 0.68, 0.66, 0.3, 0.3], ["bl", "Quadro embaixo à esquerda", 0.02, 0.66, 0.3, 0.3], ["left", "Metade esquerda", 0, 0.25, 0.5, 0.5], ["right", "Metade direita", 0.5, 0.25, 0.5, 0.5]];
  const frame = () => [st.video?.baseWidth || 1920, st.video?.baseHeight || 1080];
  const layoutTransform = (L) => { const [W, H] = frame(); return { positionX: L[2] * W, positionY: L[3] * H, alignment: 5, rotation: 0, cropLeft: 0, cropRight: 0, cropTop: 0, cropBottom: 0, boundsType: "OBS_BOUNDS_SCALE_INNER", boundsAlignment: 0, boundsWidth: L[4] * W, boundsHeight: L[5] * H }; };
  // Audio inputs with automatic mixing switched off: kept always on air inside the bus scene.
  st.fixed = new Set();
  document.addEventListener("change", (e) => { const t = e.target; if (t.dataset?.layer) A.layerlayout(t.dataset.layer, t.value); else if (t.id === "ly-src" && t.value) A.layeradd(t.value); });
//@@ACT
    follow: (d) => run((async () => {
      const name = d.v;
      if (!inputNumber(name)) return toast("Fonte de áudio global do motor: fica sempre ligada, não acompanha o vídeo.");
      if (!st.busOn) return toast("Para desligar a mistura automática de uma entrada, ligue antes os barramentos (seção OUTPUTS).", true);
      const it = (await req("GetSceneItemList", { sceneName: BUS_SCENE })).sceneItems.find((i) => i.sourceName === name);
      if (it) await req("RemoveSceneItem", { sceneName: BUS_SCENE, sceneItemId: it.sceneItemId });
      else { const r = await req("CreateSceneItem", { sceneName: BUS_SCENE, sourceName: name }); await req("SetSceneItemTransform", { sceneName: BUS_SCENE, sceneItemId: r.sceneItemId, sceneItemTransform: { positionX: -30000, positionY: -30000 } }); }
      await syncItems();
      toast(it ? "Mistura automática ligada: o áudio acompanha o vídeo" : "Mistura automática desligada: o áudio fica sempre no ar");
    })()),
    layers: (d) => openPop("layers", d.v),
    layersload: () => run((async () => {
      const [W, H] = frame(), near = (a, b) => Math.abs(a - b) < 1.5, r = await req("GetSceneItemList", { sceneName: st.popArg });
      st.layers = r.sceneItems.filter((i) => i.sourceType === "OBS_SOURCE_TYPE_SCENE" && !i.isGroup).sort((a, b) => a.sceneItemIndex - b.sceneItemIndex).map((i) => { const t = i.sceneItemTransform;
        const hit = LAYOUTS.find((L) => t.boundsType === "OBS_BOUNDS_SCALE_INNER" && near(t.positionX, L[2] * W) && near(t.positionY, L[3] * H) && near(t.boundsWidth, L[4] * W) && near(t.boundsHeight, L[5] * H));
        return { id: i.sceneItemId, source: i.sourceName, on: i.sceneItemEnabled, layout: hit ? hit[0] : "custom" }; });
      if (st.pop === "layers") renderPop();
    })()),
    layeradd: (src) => run((async () => { const r = await req("CreateSceneItem", { sceneName: st.popArg, sourceName: src }); await req("SetSceneItemTransform", { sceneName: st.popArg, sceneItemId: r.sceneItemId, sceneItemTransform: layoutTransform(LAYOUTS[1]) }); await A.layersload(); })()),
    layerlayout: (id, layout) => run((async () => { const L = LAYOUTS.find((x) => x[0] === layout); if (L) await req("SetSceneItemTransform", { sceneName: st.popArg, sceneItemId: +id, sceneItemTransform: layoutTransform(L) }); await A.layersload(); })()),
    layertoggle: (d) => run((async () => { const l = st.layers.find((x) => x.id === +d.v); await req("SetSceneItemEnabled", { sceneName: st.popArg, sceneItemId: +d.v, sceneItemEnabled: !l.on }); await A.layersload(); })()),
    layerdel: (d) => run((async () => { await req("RemoveSceneItem", { sceneName: st.popArg, sceneItemId: +d.v }); await A.layersload(); })()),
    audioadd: (d) => openPop("audioadd", d.v),
    audioaddgo: () => run((async () => {
      const scene = st.popArg, v = $("aa-src").value; if (!v) return;
      if (v === "+mic") { let n = scene + " (áudio)", k = 2; while (st.audio.has(n)) n = scene + " (áudio " + k++ + ")"; await req("CreateInput", { sceneName: scene, inputName: n, inputKind: "wasapi_input_capture", inputSettings: {} }); closePop(); await req("OpenInputPropertiesDialog", { inputName: n }); }
      else { await req("CreateSceneItem", { sceneName: scene, sourceName: v }); closePop(); }
      await syncItems(); await syncAudio(); toast("Áudio juntado à entrada " + scene);
    })()),
//@@POP
    else if (st.pop === "layers") { const name = st.popArg, L = st.layers, others = st.scenes.filter((n) => n !== name);
      p.innerHTML = `<h3>Camadas · ${esc(name)}</h3><div class="layers">` + (!L ? "<p>Lendo…</p>" : L.map((l, i) => `<div class="lyr" data-src="${esc(l.source)}"><b>${i + 1}</b><span title="${esc(l.source)}">${esc(l.source)}</span><select data-layer="${l.id}">${l.layout === "custom" ? `<option value="custom" selected>Posição própria</option>` : ""}${LAYOUTS.map(([id, label]) => `<option value="${id}"${l.layout === id ? " selected" : ""}>${label}</option>`).join("")}</select><button class="b${l.on ? " on" : ""}" data-a="layertoggle" data-v="${l.id}" title="Mostra ou esconde esta camada">${l.on ? "Ligada" : "Desligada"}</button><button class="b" data-a="layerdel" data-v="${l.id}" title="Tira esta camada da entrada">Remover</button></div>`).join("") || `<p>Esta entrada ainda não tem camadas.</p>`)
        + `</div>` + (L && L.length >= 10 ? `<p>Limite de 10 camadas.</p>` : `<label>Pôr outra entrada por cima desta<select id="ly-src"><option value="">Escolha a entrada…</option>${others.map((n) => `<option>${esc(n)}</option>`).join("")}</select></label>`)
        + `<p>Cada camada é outra entrada desenhada por cima desta, de baixo para cima, com o áudio dela junto.</p><div class="row end"><button class="b" data-a="close">Fechar</button></div>`; }
    else if (st.pop === "audioadd") { const name = st.popArg, mine = new Set((st.items.get(name) || []).map((i) => i.name)), opts = [...st.audio].filter(([n, a]) => !a.bus && !mine.has(n)).map(([n]) => n);
      p.innerHTML = `<h3>Juntar áudio · ${esc(name)}</h3><label>Áudio que passa a fazer parte desta entrada<select id="aa-src"><option value="">Escolha…</option><option value="+mic">Novo microfone ou dispositivo de áudio…</option>${opts.map((n) => `<option>${esc(n)}</option>`).join("")}</select></label><p>O áudio escolhido entra e sai do ar junto com esta entrada e tem a sua faixa no mixer.</p><div class="row end"><button class="b on" data-a="audioaddgo">OK</button><button class="b" data-a="close">Cancelar</button></div>`; }
//@@FOLLOWBTN
<button class="fw${n && !st.fixed.has(name) ? " lit" : ""}" data-a="follow" data-v="${v}" title="${!n ? "Fonte global do motor: áudio sempre ligado, não acompanha o vídeo" : st.fixed.has(name) ? "Mistura automática desligada: o áudio fica sempre no ar. Clique para voltar a acompanhar o vídeo" : "Mistura automática ligada: o áudio entra e sai junto com o vídeo. Clique para deixar sempre no ar"}">${ARR}</button>
