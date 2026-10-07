//@@HELPER
  // Titles (GC): animated HTML templates kept in painel/gc and listed in gc/catalogo.js. A title is a browser
  // source whose address names the template and carries the field values; gc/gc.js inside each template does the
  // rest (see the comments there).
  const GCS = window.GC_CATALOG || [];
  st.gcTpl = GCS[0]?.id || ""; st.gcNames = new Set(); st.gcEdit = null;
  const gcTemplate = (id = st.gcTpl) => GCS.find((x) => x.id === id) || GCS[0];
  const gcType = (x) => (x.type === "number" ? "number" : x.type === "color" ? "color" : "text");
  const gcFields = () => (gcTemplate()?.fields || []).map((x) => [x.key, x.label, x.default, gcType(x)]);
  const gcData = (tpl, f) => Object.fromEntries(tpl.fields.map((x) => [x.key, x.type === "number" ? +f[x.key] : f[x.key]]));
  const gcUrl = (tpl, name, d) => new URL("gc/" + tpl.file, location.href).href + "#" + encodeURIComponent(JSON.stringify({ n: name, t: tpl.id, d }));
  const gcParse = (url) => { const m = /\/gc\/[^#]+#(.+)$/.exec(url || ""); if (!m) return null; try { return JSON.parse(decodeURIComponent(m[1])); } catch { return null; } };
  const gcSettings = (f, name) => { const tpl = gcTemplate(); return { url: gcUrl(tpl, name, gcData(tpl, f)), width: 1920, height: 1080, reroute_audio: true, shutdown: false, restart_when_active: false }; };
  const gcPicker = () => (GCS.length ? `<label>Modelo<select id="add-gc">${GCS.map((x) => `<option value="${x.id}"${x.id === st.gcTpl ? " selected" : ""}>${esc(x.collection)} · ${esc(x.name)}</option>`).join("")}</select></label>` : `<p><b>Nenhum modelo de título em painel/gc.</b></p>`);
  const gcEmit = (name, data) => tryReq("CallVendorRequest", { vendorName: "obs-browser", requestType: "emit_event", requestData: { event_name: name, event_data: data } });
  const gcOnAir = () => { const names = []; for (const s of new Set([st.program, ...(st.keyers || []).map((k) => k.scene).filter(Boolean)])) for (const i of st.items.get(s) || []) if (i.kind === "browser_source") names.push(i.name); return names; };
  // A title edited while on air changes at once on screen; its saved address is only rewritten (which reloads the
  // page) after it has left the air.
  const gcDefer = new Map();
  setInterval(() => {
    if (!st.on) return;
    const air = gcOnAir(); gcEmit("freemix-gc-air", { names: air });
    for (const [name, url] of gcDefer) if (!air.includes(name)) { gcDefer.delete(name); tryReq("SetInputSettings", { inputName: name, inputSettings: { url } }); }
  }, 2000);
  async function syncGcNames() {
    const names = new Set();
    for (const n of new Set([...st.items.values()].flat().filter((i) => i.kind === "browser_source").map((i) => i.name))) if (gcParse((await tryReq("GetInputSettings", { inputName: n }))?.inputSettings?.url)) names.add(n);
    st.gcNames = names;
  }
  // Lets the exit animation of the titles of an overlay be seen before the overlay itself is cut.
  const gcLeave = async (scene) => { const names = (st.items.get(scene) || []).filter((i) => st.gcNames.has(i.name)).map((i) => i.name); if (!names.length) return; for (const n of names) await gcEmit("freemix-gc", { name: n, show: false }); await sleep(550); };
  document.addEventListener("change", (e) => { if (e.target.id === "add-gc") { st.addName = $("add-name")?.dataset.edited ? $("add-name").value : ""; st.gcTpl = e.target.value; renderPop(); } });
//@@ACT
    gcedit: (d) => run((async () => {
      const cfg = gcParse(gcDefer.get(d.v) || (await req("GetInputSettings", { inputName: d.v })).inputSettings.url);
      if (!cfg) return toast("Esta fonte não é um título da galeria", true);
      st.gcEdit = { name: d.v, cfg }; openPop("gcedit", d.v);
    })()),
    gcapply: () => run((async () => {
      const { name, cfg } = st.gcEdit, tpl = gcTemplate(cfg.t), f = {}; for (const x of tpl.fields) f[x.key] = $("gc-f-" + x.key).value;
      const d = gcData(tpl, f), url = gcUrl(tpl, name, d);
      await gcEmit("freemix-gc", { name, data: d });
      if (gcOnAir().includes(name)) gcDefer.set(name, url); else await req("SetInputSettings", { inputName: name, inputSettings: { url } });
      cfg.d = d; toast("Título atualizado");
    })()),
//@@POP
    else if (st.pop === "gcedit") { const { name, cfg } = st.gcEdit, tpl = gcTemplate(cfg.t);
      p.innerHTML = `<h3>Título · ${esc(name)}</h3><p>${esc(tpl.collection)} · ${esc(tpl.name)}</p>` + tpl.fields.map((x) => `<label>${esc(x.label)}<input id="gc-f-${x.key}" type="${gcType(x)}" value="${esc(cfg.d?.[x.key] ?? x.default)}"></label>`).join("")
        + `<p>Aplicar muda o título na hora, mesmo com ele no ar.</p><div class="row end"><button class="b on" data-a="gcapply">Aplicar</button><button class="b" data-a="close">Fechar</button></div>`; }
