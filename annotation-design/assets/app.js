// assets/app.js
// Considerations, example gallery, and detail view.
// Data lives in data/considerations.js, data/figures.js and data/sizes.js (no fetch, so file:// works too).

(() => {
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));
  const root = document.documentElement;
  const reduceMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isPhone = () => matchMedia("(max-width: 700px)").matches;

  const CONS = (window.CONSIDERATIONS || []).slice().sort((a, b) => a.n - b.n);
  const SIZES = window.FIGURE_SIZES || {};
  const byCons = Object.fromEntries(CONS.map((c) => [c.id, c]));

  // Publications, in the order the masthead names them
  const PUBS = [
    { key: "wp", name: "The Washington Post", short: "Washington Post" },
    { key: "nyt", name: "The New York Times", short: "New York Times" },
    { key: "wsj", name: "The Wall Street Journal", short: "Wall Street Journal" },
    { key: "eco", name: "The Economist", short: "Economist" },
  ];
  const pubByName = Object.fromEntries(PUBS.map((p) => [p.name, p]));

  const CHART_TYPES = {
    "line": "Line chart",
    "bar": "Bar chart",
    "stacked-bar": "Stacked bar chart",
    "diverging-bar": "Diverging bar chart",
    "scatter": "Scatterplot",
    "multi-series": "Multi-series chart",
    "small-multiples": "Small multiples",
    "time-series": "Time series",
    "forest-plot": "Forest plot",
    "population-pyramid": "Population pyramid",
    "waterfall": "Waterfall chart",
  };

  function parseSource(src) {
    const m = (src || "").match(/^(.*?)\s*\[([^\]]+)\]\s*$/);
    return m ? { name: m[1].trim(), url: m[2].trim() } : { name: (src || "").trim(), url: null };
  }

  const FIGS = (window.FIGURES || []).map((f) => {
    const src = parseSource(f.source);
    const pub = pubByName[src.name] || { key: "other", name: src.name, short: src.name };
    return {
      ...f,
      pub,
      url: src.url,
      cons: f.considerations.slice().sort((a, b) => byCons[a].n - byCons[b].n),
      size: SIZES[f.id] || null,
    };
  });
  const byId = Object.fromEntries(FIGS.map((f) => [f.id, f]));
  const TOTAL = FIGS.length;

  const els = {
    cons: $("#cons"),
    facetC: $("#facet-c"),
    facetP: $("#facet-p"),
    count: $("#count"),
    clear: $("#clear"),
    cards: $("#cards"),
    empty: $("#empty"),
    detail: $("#detail"),
    body: $("#detail-body"),
    pos: $("#detail-pos"),
    prev: $("#detail-prev"),
    next: $("#detail-next"),
    zoom: $("#zoom"),
    zoomStage: $("#zoom-stage"),
    zoomImg: $("#zoom-img"),
    toast: $("#toast"),
  };

  if (!CONS.length || !FIGS.length) {
    els.count.textContent = "The examples could not be loaded.";
    return;
  }

  // ── State and URL ─────────────────────────────────────────────
  const state = { c: new Set(), p: new Set(), ex: null };

  function readUrl() {
    const q = new URL(location.href).searchParams;
    state.c.clear();
    state.p.clear();
    (q.get("c") || "")
      .split(",")
      .map((s) => s.trim().toUpperCase().replace(/^C?/, "C"))
      .filter((id) => byCons[id])
      .forEach((id) => state.c.add(id));
    (q.get("pub") || "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter((k) => PUBS.some((p) => p.key === k))
      .forEach((k) => state.p.add(k));
    const ex = q.get("ex");
    state.ex = ex && byId[ex] ? ex : null;
  }

  function urlFor(ex = state.ex) {
    const url = new URL(location.href);
    ["c", "pub", "ex"].forEach((k) => url.searchParams.delete(k));
    const parts = url.search ? [url.search.slice(1)] : [];
    if (state.c.size) parts.push("c=" + [...state.c].map((id) => byCons[id].n).sort().join(","));
    if (state.p.size) parts.push("pub=" + PUBS.filter((p) => state.p.has(p.key)).map((p) => p.key).join(","));
    if (ex) parts.push("ex=" + encodeURIComponent(ex));
    return url.pathname + (parts.length ? "?" + parts.join("&") : "");
  }

  // ── Filtering ─────────────────────────────────────────────────
  // Considerations: a chart must show every selected one. Publications: any selected one.
  function match(f, c = state.c, p = state.p) {
    for (const id of c) if (!f.cons.includes(id)) return false;
    return !p.size || p.has(f.pub.key);
  }
  const filtered = () => FIGS.filter((f) => match(f));
  const countWith = (c, p) => FIGS.reduce((n, f) => n + (match(f, c, p) ? 1 : 0), 0);

  // ── Small builders ────────────────────────────────────────────
  function h(tag, attrs = {}, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === "class") el.className = v;
      else if (k === "text") el.textContent = v;
      else if (k === "html") el.innerHTML = v;
      else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? "" : v);
    }
    for (const kid of kids.flat()) if (kid != null) el.append(kid);
    return el;
  }

  const num = (c, on) => h("span", { class: "num" + (on ? " is-on" : ""), "aria-hidden": "true", text: c.n });

  function picture(webp, png, alt, { lazy = false, w, h: ht } = {}) {
    const img = h("img", {
      src: png,
      alt,
      decoding: "async",
      loading: lazy ? "lazy" : null,
      width: w,
      height: ht,
    });
    const done = () => img.classList.add("is-loaded");
    img.addEventListener("load", done, { once: true });
    img.addEventListener("error", done, { once: true });
    return h("picture", {}, h("source", { type: "image/webp", srcset: webp }), img);
  }

  const chartAlt = (f) => `${f.title}. Chart from ${f.pub.name}, ${f.year}.`;
  const andList = (xs, word = "and") =>
    xs.length < 2 ? xs.join("") : xs.length === 2 ? `${xs[0]} ${word} ${xs[1]}` : `${xs.slice(0, -1).join(", ")}, ${word} ${xs.at(-1)}`;

  // ── Considerations ────────────────────────────────────────────
  function renderConsiderations() {
    const counts = Object.fromEntries(CONS.map((c) => [c.id, FIGS.filter((f) => f.cons.includes(c.id)).length]));
    els.cons.replaceChildren(
      ...CONS.map((c, i) =>
        h(
          "li",
          { class: "con in-view", id: `consideration-${c.n}`, style: `--d:${i % 2}` },
          h(
            "div",
            { class: "sheet con__sheet" },
            picture(`${c.img}.webp`, `${c.img}.png`, `Sketch for consideration ${c.n}, ${c.name}, from Figure 1 of the paper`, {
              lazy: true,
              w: c.size?.[0],
              h: c.size?.[1],
            }),
          ),
          h("h3", {}, h("span", { class: "visually-hidden", text: `${c.n}. ${c.name}: ` }), c.title),
          h("p", { class: "con__text", text: c.takeaway }),
          h(
            "button",
            {
              class: "con__go",
              type: "button",
              onclick: () => showConsideration(c.id),
            },
            h("span", { text: `See the ${counts[c.id]} ${counts[c.id] === 1 ? "example" : "examples"}` }),
            h("span", {
              "aria-hidden": "true",
              html: '<svg viewBox="0 0 24 24"><path d="M12 5v14M6 13l6 6 6-6"/></svg>',
              class: "con__arrow",
            }),
          ),
        ),
      ),
    );
  }

  function showConsideration(id) {
    state.c = new Set([id]);
    state.p.clear();
    history.replaceState(history.state, "", urlFor());
    render(false);
    // wait a frame so the new layout settles, or the browser may drop the smooth scroll
    requestAnimationFrame(() => {
      const top = $("#examples-heading").getBoundingClientRect().top + scrollY - 24;
      window.scrollTo({ top, behavior: reduceMotion() ? "auto" : "smooth" });
    });
  }

  // ── Facets ────────────────────────────────────────────────────
  function chip({ pressed, disabled, label, n, numEl, onclick, title }) {
    return h(
      "button",
      {
        class: "chip" + (numEl ? "" : " chip--text"),
        type: "button",
        "aria-pressed": pressed ? "true" : "false",
        disabled: disabled || null,
        title,
        onclick,
      },
      numEl,
      h("span", { text: label }),
      n != null ? h("span", { class: "chip__n", text: n }) : null,
    );
  }

  function renderFacets() {
    els.facetC.replaceChildren(
      chip({
        pressed: state.c.size === 0,
        label: "All",
        n: countWith(new Set(), state.p),
        onclick: () => setFilter(() => state.c.clear()),
      }),
      ...CONS.map((c) => {
        const on = state.c.has(c.id);
        const n = countWith(new Set([...state.c, c.id]), state.p);
        return chip({
          pressed: on,
          disabled: !on && n === 0,
          numEl: num(c),
          label: c.name,
          n,
          title: c.title,
          onclick: () => setFilter(() => (on ? state.c.delete(c.id) : state.c.add(c.id))),
        });
      }),
    );
    els.facetP.replaceChildren(
      chip({
        pressed: state.p.size === 0,
        label: "All",
        n: countWith(state.c, new Set()),
        onclick: () => setFilter(() => state.p.clear()),
      }),
      ...PUBS.map((p) => {
        const on = state.p.has(p.key);
        const n = countWith(state.c, new Set([p.key]));
        return chip({
          pressed: on,
          disabled: !on && n === 0,
          label: p.short,
          n,
          onclick: () => setFilter(() => (on ? state.p.delete(p.key) : state.p.add(p.key))),
        });
      }),
    );
  }

  function setFilter(mutate) {
    mutate();
    history.replaceState(history.state, "", urlFor());
    render(true);
  }

  function clearFilters() {
    setFilter(() => {
      state.c.clear();
      state.p.clear();
    });
  }
  els.clear.addEventListener("click", clearFilters);
  $$("[data-clear]").forEach((b) => b.addEventListener("click", clearFilters));

  // ── Status ────────────────────────────────────────────────────
  function renderStatus(n) {
    const lead = n === TOTAL ? `All <strong>${TOTAL}</strong> examples` : `<strong>${n}</strong> of ${TOTAL} examples`;
    let tail = "";
    if (state.c.size) tail += ` that show ${andList(CONS.filter((c) => state.c.has(c.id)).map((c) => c.name))}`;
    if (state.p.size) tail += `, from ${andList(PUBS.filter((p) => state.p.has(p.key)).map((p) => p.name), "or")}`;
    els.count.innerHTML = lead + tail;
    els.clear.hidden = !(state.c.size || state.p.size);
  }

  // ── Cards ─────────────────────────────────────────────────────
  const cardNodes = new Map();

  function cardFor(f) {
    if (cardNodes.has(f.id)) return cardNodes.get(f.id);
    const link = h("a", {
      class: "card__link",
      href: `?ex=${encodeURIComponent(f.id)}`,
      "data-id": f.id,
      text: f.title,
    });
    const nums = h(
      "ul",
      { class: "card__nums", "aria-label": `Shows ${andList(f.cons.map((id) => byCons[id].name))}` },
      f.cons.map((id) => h("li", { title: `${byCons[id].n} · ${byCons[id].name}` }, num(byCons[id]))),
    );
    const card = h(
      "article",
      { class: "card", "data-id": f.id },
      h(
        "div",
        { class: "sheet card__sheet" },
        picture(`images/web/${f.id}-card.webp`, f.img, chartAlt(f), {
          lazy: true,
          w: f.size?.[0],
          h: f.size?.[1],
        }),
      ),
      h(
        "p",
        { class: "card__meta" },
        h("span", { text: f.pub.name }),
        h("span", { class: "sep", "aria-hidden": "true", text: "·" }),
        h("span", { class: "year", text: f.year }),
      ),
      h("h3", { class: "card__title" }, link),
      h("p", { class: "card__why", text: f.whyShort }),
      nums,
    );
    cardNodes.set(f.id, card);
    return card;
  }

  function renderCards(animate) {
    const list = filtered();
    const motion = animate && !reduceMotion();
    const before = new Map();
    if (motion) {
      for (const [id, node] of cardNodes) if (node.isConnected) before.set(id, node.getBoundingClientRect());
    }

    const nodes = list.map(cardFor);
    els.cards.replaceChildren(...nodes);

    list.forEach((f, i) => {
      const node = cardNodes.get(f.id);
      $$(".card__nums .num", node).forEach((el, k) => el.classList.toggle("is-on", state.c.has(f.cons[k])));
      if (!motion) return;
      const was = before.get(f.id);
      if (was) {
        const now = node.getBoundingClientRect();
        const dx = was.left - now.left;
        const dy = was.top - now.top;
        if (dx || dy) {
          node.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], {
            duration: 560,
            easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          });
        }
      } else {
        node.classList.remove("is-new");
        void node.offsetWidth;
        node.style.setProperty("--i", i);
        node.classList.add("is-new");
      }
    });

    els.empty.hidden = list.length > 0;
    renderStatus(list.length);
    return list;
  }

  function render(animate) {
    renderFacets();
    renderCards(animate);
  }

  els.cards.addEventListener("click", (e) => {
    const link = e.target.closest(".card__link");
    if (!link || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    openDetail(link.dataset.id);
  });

  // ── Detail ────────────────────────────────────────────────────
  let pushed = false;
  let lastId = null;

  function sequence() {
    const list = filtered();
    return state.ex && !list.some((f) => f.id === state.ex) ? FIGS : list;
  }

  const humanType = (s) =>
    s.replace(/-/g, " ").replace(/^in (chart|situ|band)\b/, "in-$1").replace(/^./, (m) => m.toUpperCase());

  function buildDetail(f) {
    const [w, ht] = f.size || [4, 3];
    const zoomBtn = h(
      "button",
      {
        class: "detail__zoom",
        type: "button",
        style: `--ar:${w} / ${ht}`,
        "aria-label": "View the chart at full size",
        onclick: () => openZoom(f),
      },
      picture(`images/web/${f.id}.webp`, f.img, chartAlt(f), { w, h: ht }),
    );

    const figure = h(
      "figure",
      { class: "detail__figure" },
      zoomBtn,
      h(
        "figcaption",
        { class: "detail__credit" },
        h("span", { text: `Source: ${f.pub.name}, ${f.year}.` }),
        h(
          "button",
          { class: "detail__full", type: "button", onclick: () => openZoom(f) },
          h("span", {
            "aria-hidden": "true",
            class: "detail__fullicon",
            html: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5M11 8.5v5M8.5 11h5"/></svg>',
          }),
          "Full size",
        ),
      ),
    );

    const actions = h(
      "div",
      { class: "detail__actions" },
      f.url
        ? h(
            "a",
            { class: "btn btn--small", href: f.url, target: "_blank", rel: "noopener" },
            `See it in ${f.pub.name}`,
            h("span", { "aria-hidden": "true", text: "↗" }),
          )
        : null,
    );

    const notice = h(
      "section",
      { class: "detail__section", "aria-labelledby": "notice-label" },
      h("span", { class: "label", id: "notice-label", text: "What to notice" }),
      h("ol", { class: "notice" }, (f.evidenceBullets || []).map((b) => h("li", { text: b }))),
    );

    const why = h(
      "section",
      { class: "detail__section", "aria-labelledby": "why-label" },
      h("span", { class: "label", id: "why-label", text: "How it reflects each consideration" }),
      h(
        "ul",
        { class: "why" },
        f.cons.map((id) => {
          const c = byCons[id];
          return h(
            "li",
            { class: state.c.has(id) ? "is-on" : null },
            h(
              "div",
              { class: "why__head" },
              num(c),
              h(
                "div",
                {},
                h("span", { class: "why__name", text: c.name }),
                h("span", { class: "why__title", text: c.title }),
              ),
            ),
            h("p", { text: (f.perConsiderationWhy || {})[id] || "" }),
          );
        }),
      ),
    );

    const types = (f.annotationTypes || []).length
      ? h(
          "section",
          { class: "detail__section", "aria-labelledby": "types-label" },
          h("span", { class: "label", id: "types-label", text: "Annotation types" }),
          h("ul", { class: "types" }, f.annotationTypes.map((t) => h("li", { text: humanType(t) }))),
        )
      : null;

    const text = h(
      "div",
      { class: "detail__text" },
      h(
        "p",
        { class: "detail__meta" },
        f.pub.name,
        h("span", { class: "sep", "aria-hidden": "true", text: "·" }),
        String(f.year),
        h("span", { class: "sep", "aria-hidden": "true", text: "·" }),
        CHART_TYPES[f.chartType] || humanType(f.chartType),
      ),
      h("h2", { id: "detail-title", text: f.title }),
      actions,
      h("p", { class: "detail__lead", text: f.whyShort }),
      notice,
      why,
      types,
    );

    return [figure, text];
  }

  function openDetail(id, { push = true } = {}) {
    const f = byId[id];
    if (!f) return;
    const wasOpen = els.detail.open;
    state.ex = id;
    lastId = id;

    els.body.replaceChildren(...buildDetail(f));
    els.body.scrollTop = 0;
    const text = $(".detail__text", els.body);
    if (text) text.scrollTop = 0;
    if (wasOpen && !reduceMotion()) {
      els.body.classList.remove("is-swap");
      void els.body.offsetWidth;
      els.body.classList.add("is-swap");
    }

    const seq = sequence();
    const i = seq.findIndex((x) => x.id === id);
    els.pos.textContent = `${i + 1} of ${seq.length}`;
    els.prev.disabled = i <= 0;
    els.next.disabled = i >= seq.length - 1;

    if (!wasOpen) {
      els.detail.showModal();
      root.classList.add("has-modal");
      $("#detail-close").focus({ preventScroll: true });
    }
    if (push && !wasOpen) {
      history.pushState({ ex: id }, "", urlFor(id));
      pushed = true;
    } else {
      history.replaceState(history.state, "", urlFor(id));
    }
  }

  function step(d) {
    const seq = sequence();
    const i = seq.findIndex((x) => x.id === state.ex);
    const nxt = seq[i + d];
    if (nxt) openDetail(nxt.id);
  }

  function finishClose() {
    if (els.zoom.open) els.zoom.close();
    if (els.detail.open) els.detail.close();
    root.classList.remove("has-modal");
    state.ex = null;
    $$(".card.is-last").forEach((c) => c.classList.remove("is-last"));
    const card = cardNodes.get(lastId);
    if (card && card.isConnected) {
      card.classList.add("is-last");
      const link = $(".card__link", card);
      link.focus({ preventScroll: true });
      const r = card.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) card.scrollIntoView({ block: "center" });
    }
  }

  function closeDetail() {
    if (pushed) {
      pushed = false;
      history.back(); // popstate finishes the close
      return;
    }
    history.replaceState(history.state, "", urlFor(null));
    finishClose();
  }

  window.addEventListener("popstate", () => {
    readUrl();
    render(false); // first, so the card that takes focus back stays in the page
    if (!state.ex && els.detail.open) {
      pushed = false;
      finishClose();
    } else if (state.ex) {
      openDetail(state.ex, { push: false });
    }
  });

  els.prev.addEventListener("click", () => step(-1));
  els.next.addEventListener("click", () => step(1));
  $("#detail-close").addEventListener("click", closeDetail);
  els.detail.addEventListener("cancel", (e) => {
    e.preventDefault();
    closeDetail();
  });
  // click on the backdrop closes
  els.detail.addEventListener("click", (e) => {
    if (e.target !== els.detail) return;
    const r = els.detail.getBoundingClientRect();
    const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    if (!inside) closeDetail();
  });
  document.addEventListener("keydown", (e) => {
    if (!els.detail.open || els.zoom.open || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
  });

  $("#detail-link").addEventListener("click", () => {
    copy(location.origin + urlFor(state.ex), "Link copied");
  });

  // ── Full-size chart ───────────────────────────────────────────
  function openZoom(f) {
    els.zoomStage.classList.remove("is-actual");
    els.zoomImg.src = `images/web/${f.id}.webp`;
    els.zoomImg.onerror = () => {
      els.zoomImg.onerror = null;
      els.zoomImg.src = f.img;
    };
    els.zoomImg.alt = chartAlt(f);
    els.zoom.showModal();
  }
  els.zoomImg.addEventListener("click", (e) => {
    e.stopPropagation();
    const fits = els.zoomImg.naturalWidth > els.zoomImg.clientWidth + 1 || els.zoomStage.classList.contains("is-actual");
    if (fits) els.zoomStage.classList.toggle("is-actual");
    else els.zoom.close();
  });
  els.zoomStage.addEventListener("click", () => els.zoom.close());
  $("#zoom-close").addEventListener("click", () => els.zoom.close());

  // ── Sheets on phones can be pulled down to close ──────────────
  (function dragToDismiss(handle, sheet, onDismiss) {
    let y0 = null;
    let dy = 0;
    let t0 = 0;
    handle.addEventListener("pointerdown", (e) => {
      if (!isPhone() || e.target.closest("button, a")) return;
      y0 = e.clientY;
      dy = 0;
      t0 = performance.now();
      handle.setPointerCapture?.(e.pointerId);
      sheet.style.transition = "none";
    });
    handle.addEventListener("pointermove", (e) => {
      if (y0 == null) return;
      dy = Math.max(0, e.clientY - y0);
      sheet.style.transform = `translateY(${dy}px)`;
    });
    const end = () => {
      if (y0 == null) return;
      y0 = null;
      const speed = dy / Math.max(1, performance.now() - t0);
      sheet.style.transition = "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)";
      if (dy > 110 || (dy > 30 && speed > 0.6)) {
        sheet.style.transform = "translateY(100%)";
        setTimeout(() => {
          onDismiss();
          sheet.style.transform = "";
          sheet.style.transition = "";
        }, 220);
      } else {
        sheet.style.transform = "";
        setTimeout(() => (sheet.style.transition = ""), 300);
      }
    };
    handle.addEventListener("pointerup", end);
    handle.addEventListener("pointercancel", end);
  })($(".detail__bar"), els.detail, closeDetail);

  // ── Copy ──────────────────────────────────────────────────────
  let toastTimer;
  function toast(msg) {
    els.toast.textContent = msg;
    els.toast.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.remove("is-on"), 2200);
  }

  async function copy(text, msg) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      const ta = h("textarea", { readonly: true, style: "position:fixed;opacity:0" });
      ta.value = text;
      document.body.append(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    toast(msg);
  }

  $$("[data-copy]").forEach((b) =>
    b.addEventListener("click", () => copy($(`#${b.dataset.copy}`).textContent, "Citation copied")),
  );

  // ── Theme ─────────────────────────────────────────────────────
  // the switch is named for where a press leads, as its icon shows
  const nameThemeToggle = () => {
    const label = root.dataset.theme === "dark" ? "Switch to light theme" : "Switch to dark theme";
    $("#theme-toggle").setAttribute("aria-label", label);
    $("#theme-toggle").title = label;
  };
  nameThemeToggle();
  new MutationObserver(nameThemeToggle).observe(root, { attributes: true, attributeFilter: ["data-theme"] });

  $("#theme-toggle").addEventListener("click", (e) => {
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    const apply = () => {
      root.dataset.theme = next;
      $("#theme-color-meta").setAttribute("content", next === "dark" ? "#0E1013" : "#F5F4F0");
    };
    try {
      localStorage.setItem("theme", next);
    } catch (err) {}
    if (!document.startViewTransition || reduceMotion()) return apply();
    // the new theme spreads outward from the toggle
    const r = e.currentTarget.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    document.startViewTransition(apply).ready.then(() => {
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 650, easing: "cubic-bezier(0.2, 0.7, 0.2, 1)", pseudoElement: "::view-transition-new(root)" },
      );
    });
  });

  // ── Entry motion for the considerations ───────────────────────
  function observeInView() {
    const items = $$(".in-view");
    if (!("IntersectionObserver" in window)) return items.forEach((el) => el.classList.add("is-in"));
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          en.target.classList.add("is-in");
          io.unobserve(en.target);
        }),
      { rootMargin: "0px 0px -8% 0px" },
    );
    items.forEach((el) => io.observe(el));
  }

  // ── Boot ──────────────────────────────────────────────────────
  $$('[data-stat="examples"]').forEach((el) => (el.textContent = TOTAL));
  readUrl();
  renderConsiderations();
  observeInView();
  render(false);
  if (state.ex) openDetail(state.ex, { push: false });
})();
