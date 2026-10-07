//@@BOT
    if (st.listMode === undefined) { // first paint: restore the view toggles of the icon buttons
      st.listMode = store.get("mesa.list", false); st.bigTiles = store.get("mesa.big", false); st.locked = store.get("mesa.lock", false);
      document.body.classList.toggle("list", st.listMode); document.body.classList.toggle("big", st.bigTiles); document.body.classList.toggle("locked", st.locked);
    }
    const cg = (pop, tip) => `<button class="b cg" data-a="pop" data-v="${pop}"${off} title="${tip}">${GEAR}</button>`;
    const tc = (on, text) => (on ? `<span class="tc">${text}</span>` : "");
    const ib = (act, on, tip, icon, dis) => `<button class="b ib${on ? " on" : ""}" data-a="${act}"${dis ? off : ""} title="${tip}"><svg viewBox="0 0 24 24"><path d="${icon}"/></svg></button>`;
    $("bot").innerHTML = `<div class="g l"><button class="b" data-a="pop" data-v="add"${off}>Adicionar Entrada</button><button class="b dd" data-a="pop" data-v="addquick"${off} title="Entrada rápida">▲</button>
        <span class="pair">${cg("recset", "Configurar a gravação")}<button class="b${st.rec ? " live" : ""}" data-a="record"${off}>Gravar</button>${tc(st.rec, st.recTc)}</span>
        <span class="pair">${cg("ext", "Central de saídas")}<button class="b${st.vcam ? " on" : ""}" data-a="pop" data-v="ext"${off}>Externo</button></span>
        <span class="pair">${cg("streamset", "Configurar a transmissão")}<button class="b${st.stream ? " live" : ""}" data-a="stream"${off}>Transmitir</button><button class="b dd" data-a="pop" data-v="streammenu"${off} title="Transmissão">▲</button>${tc(st.stream, st.streamTc)}</span>
        ${st.hasIso ? `<span class="pair">${cg("iso", "Escolher as entradas da gravação isolada")}<button class="b${[...st.iso.values()].some(Boolean) ? " live" : ""}" data-a="multicorder"${off} title="Grava cada entrada marcada no seu próprio arquivo">MultiGravação</button></span>` : ""}
        <span class="pair">${cg("playlist", "Lista de reprodução")}<button class="b" data-a="pop" data-v="playlist"${off}>Playlist</button></span></div>
      <div class="g r">${st.kinds.includes("replay_source") ? `<button class="b${st.rp.some((r) => r.scene === st.program) ? " live" : ""}" data-a="pop" data-v="replay"${off}>Replay</button>` : ""}<button class="b" data-a="pop" data-v="overlay"${off}>Overlay</button>
        ${ib("viewlist", st.listMode, "Entradas em lista, sem miniatura", "M3 5h18v3H3zm0 5.5h18v3H3zM3 16h18v3H3z")}${ib("mixer2", st.mixer, "Mixer de áudio", "M4 20V10h4v10zm6 0V4h4v16zm6 0v-7h4v7z")}${ib("viewsize", st.bigTiles, "Entradas maiores", "M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z")}${ib("snapshot", false, "Foto da entrada que está no ar, na pasta de gravação", "M9 4 7.5 6H4v13h16V6h-3.5L15 4zm3 4.5a4 4 0 1 1 0 8 4 4 0 0 1 0-8z", true)}${ib("lock", st.locked, "Trava: impede fechar entradas por engano", "M7 10V7a5 5 0 0 1 10 0v3h2v11H5V10zm2 0h6V7a3 3 0 0 0-6 0z")}</div>`;
//@@ACT
    viewlist: () => { st.listMode = !st.listMode; document.body.classList.toggle("list", st.listMode); store.set("mesa.list", st.listMode); renderBot(); },
    viewsize: () => { st.bigTiles = !st.bigTiles; document.body.classList.toggle("big", st.bigTiles); store.set("mesa.big", st.bigTiles); renderBot(); },
    mixer2: () => { A.mixer(); renderBot(); },
    lock: () => { st.locked = !st.locked; document.body.classList.toggle("locked", st.locked); store.set("mesa.lock", st.locked); renderBot(); toast(st.locked ? "Trava ligada: fechar entradas está bloqueado" : "Trava desligada"); },
    snapshot: () => run((async () => {
      const dir = (await req("GetRecordDirectory")).recordDirectory.replace(/[\\/]+$/, ""), d = new Date(), p = (n) => String(n).padStart(2, "0");
      const file = `${dir}\\foto ${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}-${p(d.getMinutes())}-${p(d.getSeconds())}.png`;
      await req("SaveSourceScreenshot", { sourceName: st.program, imageFormat: "png", imageFilePath: file });
      toast("Foto gravada em " + file);
    })()),
    addquickgo: (d) => { st.addType = d.v; st.addName = ""; st.pop = null; openPop("add"); },
//@@POP
    else if (st.pop === "addquick") p.innerHTML = `<h3>Adicionar Entrada</h3><div class="menu">${[["blank", "Blank"], ["colour", "Colour"], ["video", "Video"], ["title", "Title"], ["list", "List"], ["image", "Image"], ["photos", "Photos"], ["audio", "Audio"], ["camera", "Camera"], ["web", "Web Browser"]].map(([id, label]) => `<button data-a="addquickgo" data-v="${id}">${label}</button>`).join("")}<button data-a="addquickgo" data-v="camera"><b>Mais…</b></button></div>`;
    else if (st.pop === "streammenu") p.innerHTML = `<h3>Transmissão</h3><div class="menu"><button data-a="stream">${st.stream ? "Parar a transmissão" : "Iniciar a transmissão…"}</button><button data-a="pop" data-v="streamset">Configurações de transmissão…</button></div><div class="row" style="margin-top:8px"><button class="b" data-a="close">Fechar</button></div>`;
