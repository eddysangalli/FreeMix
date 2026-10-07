//@@ACT
    cfgload: () => run((async () => {
      const P = (cat, name) => tryReq("GetProfileParameter", { parameterCategory: cat, parameterName: name }).then((r) => r?.parameterValue ?? "");
      const simple = (await P("Output", "Mode")) !== "Advanced", cat = simple ? "SimpleOutput" : "AdvOut";
      const [sv, dir, v, fmt, fname, quality, recEnc, strEnc, vbit, abit] = await Promise.all([req("GetStreamServiceSettings"), req("GetRecordDirectory"), req("GetVideoSettings"), P(cat, "RecFormat2"), P("Output", "FilenameFormatting"), P(cat, "RecQuality"), P(cat, "RecEncoder"), P(cat, "StreamEncoder"), P(cat, "VBitrate"), P(cat, "ABitrate")]);
      st.cfg = { simple, cat, server: sv.streamServiceSettings.server || "", key: sv.streamServiceSettings.key || "", dir: dir.recordDirectory, fmt: fmt || "mkv", fname, quality: quality || "Stream", recEnc: recEnc || "x264", strEnc: strEnc || "x264", vbit: vbit || "2500", abit: abit || "160", res: `${v.baseWidth}x${v.baseHeight}`, fps: `${v.fpsNumerator}/${v.fpsDenominator}` };
      if (["recset", "streamset", "config"].includes(st.pop)) renderPop();
    })()),
    cfggrab: () => { const c = st.cfg; if (!c) return; for (const [id, key] of [["cf-dir", "dir"], ["cf-fname", "fname"], ["cf-res", "res"], ["cf-fps", "fps"], ["cf-q", "quality"], ["cf-renc", "recEnc"], ["cf-senc", "strEnc"], ["cf-vbit", "vbit"], ["cf-abit", "abit"], ["cf-server", "server"], ["cf-key", "key"]]) { const el = $(id); if (el) c[key] = el.value; } },
    recfmt: (d) => { A.cfggrab(); st.cfg.fmt = d.v; renderPop(); },
    cfgrec: () => run((async () => {
      A.cfggrab(); const c = st.cfg, set = (cat, name, value) => req("SetProfileParameter", { parameterCategory: cat, parameterName: name, parameterValue: String(value) });
      if (!c.dir.trim()) return toast("Informe a pasta de gravação", true);
      await req("SetRecordDirectory", { recordDirectory: c.dir.trim() }); await set(c.cat, "RecFormat2", c.fmt);
      if (c.fname.trim()) await set("Output", "FilenameFormatting", c.fname.trim());
      if (c.simple) { await set(c.cat, "RecQuality", c.quality); await set(c.cat, "RecEncoder", c.recEnc); await set(c.cat, "VBitrate", Math.max(200, Math.round(+c.vbit) || 2500)); await set(c.cat, "ABitrate", c.abit); }
      const v = await req("GetVideoSettings");
      if (`${v.baseWidth}x${v.baseHeight}` !== c.res || `${v.fpsNumerator}/${v.fpsDenominator}` !== c.fps) { const [w, h] = c.res.split("x").map(Number), [n, den] = c.fps.split("/").map(Number); await req("SetVideoSettings", { baseWidth: w, baseHeight: h, outputWidth: w, outputHeight: h, fpsNumerator: n, fpsDenominator: den }); st.video = await req("GetVideoSettings"); renderStat(); }
      closePop(); toast("Gravação configurada");
    })()),
    cfgstream: () => run((async () => {
      A.cfggrab(); const c = st.cfg, set = (name, value) => req("SetProfileParameter", { parameterCategory: c.cat, parameterName: name, parameterValue: String(value) });
      if (!c.server.trim()) return toast("Informe a URL do servidor", true);
      await req("SetStreamServiceSettings", { streamServiceType: "rtmp_custom", streamServiceSettings: { server: c.server.trim(), key: c.key } });
      if (c.simple) { await set("VBitrate", Math.max(200, Math.round(+c.vbit) || 2500)); await set("ABitrate", c.abit); await set("StreamEncoder", c.strEnc); }
      closePop(); toast("Transmissão configurada");
    })()),
    streamstatus: () => run((async () => { const s = await req("GetStreamStatus"); $("st-status").textContent = s.outputActive ? `No ar há ${s.outputTimecode.slice(0, 8)} · ${(s.outputBytes / 1048576).toFixed(1)} MB enviados · ${s.outputSkippedFrames} de ${s.outputTotalFrames} quadros perdidos${s.outputReconnecting ? " · reconectando" : ""}` : "Transmissão parada."; })()),
//@@POP
      else if (st.pop === "streamset") { const ENC = withCur([["x264", "x264 (processador)"], ["nvenc", "NVIDIA NVENC H.264"], ["qsv", "Intel QuickSync H.264"], ["amd", "AMD H.264"]], c.strEnc), AB = withCur(["96", "128", "160", "192", "256", "320"].map((b) => [b, b]), c.abit);
        p.innerHTML = `<h3>Configurações de transmissão</h3><div class="add"><div class="types"><button class="on" title="Destino 1">1 · Principal</button>${[2, 3, 4, 5].map((n) => `<button class="off" title="Destinos 2 a 5 dependem do multistream, que ainda não foi incorporado">${n} · indisponível</button>`).join("")}</div>
          <div class="form"><label>Destino<select disabled><option>Servidor RTMP personalizado</option></select></label><label>URL<input id="cf-server" value="${esc(c.server)}" placeholder="rtmp://…"></label><label>Chave de stream<input id="cf-key" type="password" value="${esc(c.key)}" autocomplete="off"></label>
          ${c.simple ? `<div class="two"><label>Taxa de bits de vídeo (kbps)<input id="cf-vbit" type="number" min="200" step="100" value="${esc(c.vbit)}"></label><label>Taxa de bits de áudio (kbps)<select id="cf-abit">${opt(AB, c.abit)}</select></label></div><label>Codificador<select id="cf-senc">${opt(ENC, c.strEnc)}</select></label>` : `<label>Qualidade<input disabled value="Definida no perfil avançado do motor"></label>`}
          <p>Destino 1 de 5. O tamanho e a taxa de quadros são os do vídeo da produção.</p><div id="st-status" style="margin-top:6px;color:#333a42"></div></div></div>
          <div class="row end"><button class="b${st.stream ? " live" : ""}" data-a="stream">${st.stream ? "Parar 1" : "Iniciar 1"}</button><button class="b" data-a="streamstatus">Ver status</button><button class="b" data-a="cfgstream">Salvar e fechar</button><button class="b" data-a="close">Cancelar</button></div>`; }
      else if (st.pop === "recset") { const FM = withCur([["mkv", "MKV"], ["mp4", "MP4"], ["hybrid_mp4", "MP4 híbrido"], ["mov", "MOV"], ["flv", "FLV"], ["ts", "MPEG-TS"]], c.fmt), Q = [["Stream", "Igual à transmissão"], ["Small", "Alta, arquivo médio"], ["HQ", "Indistinguível, arquivo grande"], ["Lossless", "Sem perdas, arquivo enorme"]], ENC = withCur([["x264", "x264 (processador)"], ["nvenc", "NVIDIA NVENC H.264"], ["qsv", "Intel QuickSync H.264"], ["amd", "AMD H.264"]], c.recEnc), AB = withCur(["96", "128", "160", "192", "256", "320"].map((b) => [b, b]), c.abit);
        const safe = { mkv: "tolerante a falhas: se o programa fechar, o arquivo continua válido", hybrid_mp4: "MP4 tolerante a falhas", mp4: "se o programa fechar no meio, o arquivo se perde", mov: "se o programa fechar no meio, o arquivo se perde", flv: "tolerante a falhas, uma trilha de áudio", ts: "tolerante a falhas" }[c.fmt] || "";
        p.innerHTML = `<h3>Configuração de gravação</h3><div class="add"><div class="types">${FM.map(([f, l]) => `<button class="${f === c.fmt ? "on" : ""}" data-a="recfmt" data-v="${esc(f)}">${l}</button>`).join("")}</div>
          <div class="form"><label>Pasta<input id="cf-dir" value="${esc(c.dir)}"></label><label>Nome do arquivo<input id="cf-fname" value="${esc(c.fname)}" placeholder="%CCYY-%MM-%DD %hh-%mm-%ss"></label>
          <div class="two"><label>Tamanho<select id="cf-res">${opt(withCur(RES, c.res), c.res)}</select></label><label>Taxa de quadros<select id="cf-fps">${opt(withCur(FPS, c.fps), c.fps)}</select></label></div>
          ${c.simple ? `<div class="two"><label>Qualidade<select id="cf-q">${opt(withCur(Q, c.quality), c.quality)}</select></label><label>Codificador<select id="cf-renc">${opt(ENC, c.recEnc)}</select></label></div><div class="two"><label>Taxa de bits de vídeo (kbps)<input id="cf-vbit" type="number" min="200" step="100" value="${esc(c.vbit)}"></label><label>Taxa de bits de áudio (kbps)<select id="cf-abit">${opt(AB, c.abit)}</select></label></div>` : ""}
          <p>${(FM.find(([f]) => f === c.fmt) || ["", c.fmt])[1]}: ${safe}. Tamanho e taxa de quadros valem para toda a produção.</p></div></div>
          <div class="row end"><button class="b" data-a="cfgrec">OK</button><button class="b" data-a="close">Cancelar</button></div>`; }
