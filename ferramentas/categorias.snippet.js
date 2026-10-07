//@@TABS
  function renderTabs() {
    const used = new Set(Object.values(st.tags)), names = st.catNames;
    const tip = "mostrar só as entradas desta categoria. Clique direito: dar nome às categorias. Arraste uma miniatura até aqui para pôr a entrada nela.";
    $("tabs").innerHTML = `<span class="fm-brand"><span class="dot"></span>Free<b>Mix</b></span>`
      + `<button class="c all${st.filter === -1 ? " on" : ""}" data-a="filter" data-v="-1" title="Mostrar todas as entradas. Clique direito: dar nome às categorias.">Todas</button>`
      + COLORS.map((c, i) => `<button class="c${names[i] ? " named" : ""}${st.filter === i ? " on" : ""}" style="background:${c};opacity:${used.has(i) || names[i] ? 1 : .45}" data-a="filter" data-v="${i}" data-cat="${i}" title="${names[i] ? esc(names[i]) + ": " : "Categoria: "}${tip}">${esc(names[i] || "")}</button>`).join("")
      + `<button class="c find${st.filter === -2 ? " on" : ""}" data-a="catfind" title="Busca: mostrar só as entradas cujo nome contém um texto. Clique de novo para trocar o texto.">${FIND}${st.filter === -2 && st.find ? `<span>${esc(st.find)}</span>` : ""}</button>`
      + `<span class="sp"></span><button class="mx${st.mixer ? " on" : ""}" data-a="mixer">${SPK} Mixer de áudio</button>`;
    // The line under the tabs takes the colour of the selected category.
    $("tabs").style.borderBottomColor = st.filter >= 0 ? COLORS[st.filter] : st.filter === -2 ? "#e6ebf2" : "";
  }
//@@HELPER
  // Categories of inputs: seven colours that may be given names, plus a search by name (filter -2).
  const FIND = `<svg viewBox="0 0 24 24"><path d="M10 3a7 7 0 0 1 5.6 11.2l5 5-1.4 1.4-5-5A7 7 0 1 1 10 3zm0 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10z"/></svg>`;
  st.catNames = store.get("mesa.catnames", COLORS.map(() => "")); st.find = store.get("mesa.find", "");
  document.addEventListener("dragstart", (e) => { const t = e.target.closest?.(".tile"); if (!t) return; e.dataTransfer.setData("text/plain", t.dataset.s); e.dataTransfer.effectAllowed = "move"; });
  document.addEventListener("dragover", (e) => { if (e.target.closest?.(".c[data-cat], .c.all")) e.preventDefault(); });
  document.addEventListener("drop", (e) => {
    const c = e.target.closest?.(".c[data-cat], .c.all"), scene = e.dataTransfer?.getData("text/plain"); if (!c || !scene || !st.scenes.includes(scene)) return;
    e.preventDefault();
    if (c.dataset.cat === undefined) delete st.tags[scene]; else st.tags[scene] = +c.dataset.cat;
    store.set("mesa.tags", st.tags); renderTabs(); renderTiles();
  });
//@@ACT
    catfind: () => openPop("catfind"),
    catfindgo: () => { st.find = $("cf-find").value.trim(); store.set("mesa.find", st.find); st.filter = st.find ? -2 : -1; closePop(); renderTabs(); renderTiles(); },
    catnames: () => openPop("catnames"),
    catnamesgo: () => { st.catNames = COLORS.map((c, i) => $("cn-" + i).value.trim().slice(0, 16)); store.set("mesa.catnames", st.catNames); closePop(); renderTabs(); renderTiles(); },
//@@POP
    else if (st.pop === "catfind") p.innerHTML = `<h3>Busca de entradas</h3><label>Mostrar só as entradas cujo nome contém<input id="cf-find" maxlength="40" value="${esc(st.find)}" placeholder="Ex.: CAM"></label><div class="row"><button class="b on" data-a="catfindgo">OK</button><button class="b" data-a="close">Cancelar</button></div>`;
    else if (st.pop === "catnames") p.innerHTML = `<h3>Categorias das entradas</h3><p>Dê um nome a cada cor. Sem nome, a aba mostra só a cor.</p>` + COLORS.map((c, i) => `<label class="catrow"><i style="background:${c}"></i><input id="cn-${i}" maxlength="16" value="${esc(st.catNames[i] || "")}" placeholder="sem nome"></label>`).join("") + `<div class="row"><button class="b on" data-a="catnamesgo">OK</button><button class="b" data-a="close">Cancelar</button></div>`;
