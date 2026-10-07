//@@HELPER
  // Extra streaming destinations (multistream). They are kept and run by the program itself (FreeMixMultistream.cpp):
  // up to four besides the main one, on air together with it. The panel only edits the list and shows the state.
  const fmx = (type, data = {}) => req("CallVendorRequest", { vendorName: "freemix", requestType: type, requestData: data }).then((r) => r.responseData);
  st.dest = null; st.destTab = 0;
  async function syncDest() {
    try { const r = await fmx("get_destinations"); st.dest = r.destinations || []; } catch { st.dest = null; }
    if (st.pop === "streamset" && !/^(INPUT|SELECT)$/.test(document.activeElement?.tagName || "")) renderPop();
    renderBot();
  }
  const DEST_STATE = { starting: "conectando", live: "NO AR", error: "ERRO" };
  const destTabs = () => [0, 1, 2, 3].map((i) => { const d = st.dest?.[i], n = i + 2;
    if (!st.dest) return `<button class="off" title="Este executável não tem os destinos extras: instale a compilação atual do FreeMix">${n} · indisponível</button>`;
    const tag = DEST_STATE[d?.state] || (d?.enabled ? "pronto" : d?.server ? "desligado" : "vazio");
    return `<button class="${st.destTab === i + 1 ? "on" : ""}${d?.state === "live" ? " dlive" : d?.state === "error" ? " derr" : ""}" data-a="desttab" data-v="${i + 1}" title="Destino ${n}">${n} · ${esc(d?.name || "Destino " + n)} <small>${tag}</small></button>`; }).join("");
  const destForm = () => { const i = st.destTab - 1, d = st.dest?.[i] || {}, n = i + 2;
    return `<div class="form"><label>Nome<input id="ds-name" maxlength="24" value="${esc(d.name || "")}" placeholder="Ex.: YouTube reserva"></label><label>URL<input id="ds-server" value="${esc(d.server || "")}" placeholder="rtmp://…, rtmps://… ou srt://…"></label><label>Chave de stream<input id="ds-key" type="password" value="${esc(d.key || "")}" autocomplete="off"></label>`
      + `<label class="chk"><input type="checkbox" id="ds-on"${d.enabled ? " checked" : ""}> Usar este destino</label>`
      + `<p>Destino ${n} de 5. Entra no ar junto com o destino 1 e leva a mesma imagem e o mesmo som já codificados para ele: mesma qualidade, sem gastar mais processador. Ligado com a transmissão no ar, começa na hora.</p>`
      + `<p id="ds-state">${d.state === "live" ? "No ar." : d.state === "starting" ? "Conectando…" : d.state === "error" ? "Erro: " + esc(d.error || "") : st.stream ? "Parado." : "Aguardando a transmissão começar."}</p>`
      + `<div class="row"><button class="b on" data-a="destsave">Salvar destino ${n}</button></div></div>`; };
//@@ACT
    desttab: (d) => { st.destTab = +d.v; renderPop(); },
    destsave: () => run((async () => {
      const i = st.destTab - 1, list = (st.dest || []).map((x) => ({ name: x.name, server: x.server, key: x.key, enabled: x.enabled }));
      while (list.length < 4) list.push({ name: "", server: "", key: "", enabled: false });
      list[i] = { name: $("ds-name").value.trim(), server: $("ds-server").value.trim(), key: $("ds-key").value, enabled: $("ds-on").checked };
      if (list[i].enabled && !/^(rtmps?|srt|rist):\/\//i.test(list[i].server)) return toast("Endereço do destino: comece com rtmp://, rtmps://, srt:// ou rist://", true);
      const r = await fmx("set_destinations", { destinations: list });
      st.dest = r.destinations; document.activeElement?.blur(); renderPop(); toast("Destino " + (i + 2) + " salvo");
    })()),
//@@EVENT
    else if (type === "VendorEvent" && d.vendorName === "freemix" && d.eventType === "destinations_changed") { st.dest = d.eventData.destinations || []; if (st.pop === "streamset" && !/^(INPUT|SELECT)$/.test(document.activeElement?.tagName || "")) renderPop(); renderBot(); }
