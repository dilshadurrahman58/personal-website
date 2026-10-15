// assets/app.js
// Strategies, figure gallery, and detail view.
// Data lives in data/content.js and data/sizes.js (no fetch, so file:// works too).

(() => {
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));
  const root = document.documentElement;
  const reduceMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isPhone = () => matchMedia("(max-width: 700px)").matches;

  const STRATS = (window.STRATEGIES || []).slice().sort((a, b) => a.n - b.n);
  const SIZES = window.FIGURE_SIZES || {};
  const byStrat = Object.fromEntries(STRATS.map((s) => [s.id, s]));

  const FIGS = (window.FIGURES || []).map((f) => ({
    ...f,
    strats: STRATS.filter((s) => f.paper && f.paper[s.id]).map((s) => s.id),
    size: SIZES[f.id] || null,
  }));
  const byId = Object.fromEntries(FIGS.map((f) => [f.id, f]));
  const byFig = Object.fromEntries(FIGS.map((f) => [f.fig.toLowerCase(), f]));
  const TOTAL = FIGS.length;

  const els = {
    strats: $("#strats"),
    facet: $("#facet"),
    count: $("#count"),
    clear: $("#clear"),
    cards: $("#cards"),
    atypes: $("#atypes"),
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

  if (!STRATS.length || !FIGS.length) {
    els.count.textContent = "The figures could not be loaded.";
    return;
  }

  // ── State and URL ─────────────────────────────────────────────
  // s: the strategy the gallery is filtered by; ex: the open figure; focus: the strategy to emphasize in it
  const state = { s: null, ex: null, focus: null };

  function readUrl() {
    const q = new URL(location.href).searchParams;
    const s = STRATS.find((x) => String(x.n) === (q.get("s") || "").trim());
    state.s = s ? s.id : null;
    const f = byFig[(q.get("fig") || "").trim().toLowerCase()];
    state.ex = f ? f.id : null;
  }

  function urlFor(ex = state.ex) {
    const url = new URL(location.href);
    ["s", "fig"].forEach((k) => url.searchParams.delete(k));
    const parts = url.search ? [url.search.slice(1)] : [];
    if (state.s) parts.push("s=" + byStrat[state.s].n);
    if (ex) parts.push("fig=" + encodeURIComponent(byId[ex].fig));
    return url.pathname + (parts.length ? "?" + parts.join("&") : "");
  }

  const filtered = () => (state.s ? FIGS.filter((f) => f.strats.includes(state.s)) : FIGS);

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

  const num = (s, on) => h("span", { class: "num" + (on ? " is-on" : ""), "aria-hidden": "true", text: s.n });
  const sep = () => h("span", { class: "sep", "aria-hidden": "true", text: "·" });
  const figName = (f) => `Fig. ${f.fig}`;
  const chartAlt = (f) => `${f.title}. Chart from ${f.pub}, shown as Figure ${f.fig} in the paper.`;

  function picture(f, variant, { lazy = false } = {}) {
    const [w, ht] = f.size || [];
    const img = h("img", {
      src: `professional-vis-examples/${f.id}.png`,
      alt: chartAlt(f),
      decoding: "async",
      loading: lazy ? "lazy" : null,
      width: w,
      height: ht,
    });
    const done = () => img.classList.add("is-loaded");
    if (img.complete && img.naturalWidth) done();
    img.addEventListener("load", done, { once: true });
    img.addEventListener("error", done, { once: true });
    return h(
      "picture",
      {},
      h("source", { type: "image/webp", srcset: `images/web/${f.id}${variant === "card" ? "-card" : ""}.webp` }),
      img,
    );
  }

  const andList = (xs) =>
    xs.length < 2 ? xs.join("") : xs.length === 2 ? `${xs[0]} and ${xs[1]}` : `${xs.slice(0, -1).join(", ")}, and ${xs.at(-1)}`;

  // ── Contents (masthead) ───────────────────────────────────────
  function renderContents() {
    $("#contents").replaceChildren(
      ...STRATS.map((s) =>
        h(
          "li",
          {},
          h(
            "a",
            { href: `#strategy-${s.n}`, class: "contents__link" },
            num(s),
            h("span", { class: "contents__text", text: s.headline }),
          ),
        ),
      ),
    );
  }

  // ── Strategies ────────────────────────────────────────────────
  // The featured chart carries circled marks in warm ink, each beside the annotation it names.
  // Marks and notes light up together, so the reader can match them in either direction.
  function markedChart(s, f) {
    const marks = (s.marks || []).map((m, k) =>
      h("span", {
        class: "mark-pin",
        "data-k": k,
        "aria-hidden": "true",
        style: `left:${m.x}%; top:${m.y}%; --k:${k}`,
        text: k + 1,
      }),
    );
    return h("span", { class: "plate__art" }, picture(f, "card", { lazy: true }), marks);
  }

  function linkMarks(li) {
    const set = (k, on) => {
      $$(`[data-k="${k}"]`, li).forEach((el) => el.classList.toggle("is-hot", on));
    };
    $$("[data-k]", li).forEach((el) => {
      const k = el.dataset.k;
      el.addEventListener("pointerenter", () => set(k, true));
      el.addEventListener("pointerleave", () => set(k, false));
      el.addEventListener("focusin", () => set(k, true));
      el.addEventListener("focusout", () => set(k, false));
    });
  }

  function renderStrategies() {
    els.strats.replaceChildren(
      ...STRATS.map((s) => {
        const featured = byId[s.featured];
        const others = FIGS.filter((f) => f.strats.includes(s.id) && f.id !== s.featured);

        const cited = others.length
          ? h(
              "div",
              { class: "cited strat__cited" },
              h("p", { class: "cited__label", text: `The paper also points to` }),
              h(
                "ul",
                { class: "cited__list" },
                others.map((f) =>
                  h(
                    "li",
                    {},
                    h(
                      "button",
                      {
                        class: "cited__btn",
                        type: "button",
                        "aria-label": `${figName(f)}: ${f.title}, ${f.pub}`,
                        onclick: () => openDetail(f.id, { focus: s.id }),
                      },
                      h(
                        "span",
                        { class: "cited__thumb", "aria-hidden": "true" },
                        h("img", { src: `images/web/${f.id}-card.webp`, alt: "", loading: "lazy", decoding: "async" }),
                      ),
                      figName(f),
                    ),
                  ),
                ),
              ),
            )
          : null;

        const text = h(
          "div",
          { class: "strat__text" },
          h(
            "p",
            { class: "strat__head" },
            num(s),
            h("span", { class: "strat__sec" }, `§${s.section}`, h("span", { class: "strat__paper", text: s.name })),
          ),
          h("h3", {}, h("span", { class: "visually-hidden", text: `Strategy ${s.n}: ` }), s.headline),
          h("p", { class: "strat__finding", text: s.finding }),
          h("p", { class: "strat__impl" }, h("em", { text: "For design. " }), s.implication),
        );

        const plate = h(
          "figure",
          { class: "strat__plate" },
          h(
            "button",
            {
              class: "plate__btn",
              type: "button",
              "aria-label": `Open ${figName(featured)}: ${featured.title}`,
              onclick: () => openDetail(featured.id, { focus: s.id }),
            },
            h("div", { class: "sheet plate__sheet" }, markedChart(s, featured)),
          ),
          h(
            "figcaption",
            { class: "plate__cap" },
            h(
              "p",
              { class: "plate__src" },
              h("span", { class: "plate__fig", text: figName(featured) }),
              h("span", { text: featured.pub }),
            ),
            h(
              "ol",
              { class: "plate__notes" },
              (s.marks || []).map((m, k) =>
                h("li", { "data-k": k }, h("span", { class: "plate__n", "aria-hidden": "true", text: k + 1 }), m.note),
              ),
            ),
          ),
        );

        const li = h("li", { class: "strat in-view", id: `strategy-${s.n}` }, text, plate, cited);
        linkMarks(li);
        return li;
      }),
    );
  }

  // ── Facet ─────────────────────────────────────────────────────
  function chip({ pressed, label, n, numEl, onclick, title }) {
    return h(
      "button",
      {
        class: "chip" + (numEl ? "" : " chip--text"),
        type: "button",
        "aria-pressed": pressed ? "true" : "false",
        title,
        onclick,
      },
      numEl,
      h("span", { text: label }),
      n != null ? h("span", { class: "chip__n", text: n }) : null,
    );
  }

  function renderFacet() {
    els.facet.replaceChildren(
      chip({ pressed: !state.s, label: "All figures", n: TOTAL, onclick: () => setFilter(null) }),
      ...STRATS.map((s) =>
        chip({
          pressed: state.s === s.id,
          numEl: num(s),
          label: s.short,
          n: FIGS.filter((f) => f.strats.includes(s.id)).length,
          title: `Section ${s.section}: ${s.name}`,
          onclick: () => setFilter(state.s === s.id ? null : s.id),
        }),
      ),
    );
  }

  function setFilter(id) {
    state.s = id;
    history.replaceState(history.state, "", urlFor());
    render(true);
    // a shorter list can leave the reader below the gallery: bring its top back under the toolbar
    const top = $("#figures-heading").getBoundingClientRect().top;
    if (els.cards.getBoundingClientRect().bottom < innerHeight * 0.5 || top < -innerHeight) {
      window.scrollTo({ top: top + scrollY - 24, behavior: "auto" });
    }
  }

  els.clear.addEventListener("click", () => setFilter(null));

  // ── Status ────────────────────────────────────────────────────
  function renderStatus(n) {
    if (!state.s) {
      els.count.innerHTML = `All <strong>${TOTAL}</strong> figures from the paper`;
    } else {
      const s = byStrat[state.s];
      els.count.innerHTML = `<strong>${n}</strong> of ${TOTAL} figures, discussed in Section ${s.section}, ${s.name}`;
    }
    els.clear.hidden = !state.s;
  }

  // ── Cards ─────────────────────────────────────────────────────
  const cardNodes = new Map();

  function cardFor(f) {
    if (cardNodes.has(f.id)) return cardNodes.get(f.id);
    const link = h("a", { class: "card__link", href: `?fig=${encodeURIComponent(f.fig)}`, "data-id": f.id, text: f.title });
    const foot = f.strats.length
      ? h(
          "ul",
          {
            class: "card__nums",
            "aria-label": `Discussed under ${andList(f.strats.map((id) => byStrat[id].name))}`,
          },
          f.strats.map((id) => h("li", { title: `${byStrat[id].section} · ${byStrat[id].name}` }, num(byStrat[id]))),
        )
      : h("span", { class: "card__fig1", text: "Shown in Figure 1 as an example" });
    const card = h(
      "article",
      { class: "card", "data-id": f.id },
      h("div", { class: "sheet card__sheet" }, picture(f, "card", { lazy: true })),
      h("p", { class: "card__meta" }, h("span", { class: "card__fig", text: figName(f) }), sep(), h("span", { text: f.pub })),
      h("h3", { class: "card__title" }, link),
      // Figure 1e's caption clause begins "another line chart", which only reads in the paper's sentence
      h("p", { class: "card__cap", text: f.caption.replace(/^Another /, "A ") }),
      h("div", { class: "card__foot" }, foot),
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

    els.cards.replaceChildren(...list.map(cardFor));

    list.forEach((f, i) => {
      const node = cardNodes.get(f.id);
      $$(".card__nums .num", node).forEach((el, k) => el.classList.toggle("is-on", state.s === f.strats[k]));
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

    renderStatus(list.length);
  }

  function render(animate) {
    renderFacet();
    renderCards(animate);
  }

  els.cards.addEventListener("click", (e) => {
    const link = e.target.closest(".card__link");
    if (!link || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    openDetail(link.dataset.id, { focus: state.s });
  });

  // ── Annotation types (Section 3) ──────────────────────────────
  const GLYPHS = {
    enclosure:
      '<circle class="g-dot" cx="8" cy="31" r="2.4"/><circle class="g-dot" cx="21" cy="20" r="2.4"/><circle class="g-dot" cx="31" cy="25" r="2.4"/><circle class="g-dot" cx="49" cy="10" r="2.4"/><ellipse class="g-warm" cx="26" cy="22.5" rx="12.5" ry="9"/>',
    connector:
      '<path class="g-ink" d="M3 7h17M3 13h11"/><circle class="g-dot" cx="47" cy="32" r="3"/><path class="g-warm" d="M18 18c10 1 20 4 25 10"/><path class="g-warm" d="M37.5 27.6l5.6.8-1.3-5.4"/>',
    text:
      '<text class="g-text" x="1" y="27">Aa</text><path class="g-ink" d="M27 13h26M27 20h22M27 27h15"/>',
    mark:
      '<circle class="g-dot" cx="7" cy="31" r="2.4"/><circle class="g-dot" cx="19" cy="24" r="2.4"/><circle class="g-dot" cx="31" cy="28" r="2.4"/><circle class="g-dot" cx="45" cy="19" r="2.4"/><path class="g-warmfill" d="M45 4l4.2 6.6h-8.4z"/>',
    color:
      '<rect class="g-bar" x="4" y="22" width="9" height="16" rx="1"/><rect class="g-bar" x="17" y="14" width="9" height="24" rx="1"/><rect class="g-warmfill" x="30" y="5" width="9" height="33" rx="1"/><rect class="g-bar" x="43" y="18" width="9" height="20" rx="1"/>',
    trend:
      '<circle class="g-dot" cx="6" cy="30" r="2.2"/><circle class="g-dot" cx="14" cy="33" r="2.2"/><circle class="g-dot" cx="21" cy="22" r="2.2"/><circle class="g-dot" cx="30" cy="21" r="2.2"/><circle class="g-dot" cx="36" cy="13" r="2.2"/><circle class="g-dot" cx="47" cy="11" r="2.2"/><path class="g-warm" stroke-dasharray="4 3.5" d="M3 35L53 6"/>',
    geometric:
      '<rect class="g-ink" x="3" y="25" width="9" height="9" rx="1"/><path class="g-ink" stroke-dasharray="2 3" d="M12 25L27 6M12 34L27 34"/><rect class="g-warm" x="27" y="6" width="26" height="28" rx="1.5"/>',
  };

  function renderTypes() {
    els.atypes.replaceChildren(
      ...(window.ANNOTATION_TYPES || []).map((t) =>
        h(
          "li",
          { class: "atype" },
          h("span", {
            "aria-hidden": "true",
            html: `<svg viewBox="0 0 56 40">${GLYPHS[t.key] || ""}</svg>`,
          }),
          h("h4", { text: t.name }),
          h("p", { text: t.text }),
        ),
      ),
    );
  }

  // ── Detail ────────────────────────────────────────────────────
  let pushed = false;
  let lastId = null;

  function sequence() {
    const list = filtered();
    return state.ex && !list.some((f) => f.id === state.ex) ? FIGS : list;
  }

  function buildDetail(f) {
    const [w, ht] = f.size || [4, 3];
    const figure = h(
      "figure",
      { class: "detail__figure" },
      h(
        "div",
        { class: "detail__stage" },
        h(
          "button",
          {
            class: "detail__zoom",
            type: "button",
            style: `--ar:${w} / ${ht}; --arn:${(w / ht).toFixed(4)}`,
            "aria-label": "View the chart at full size",
            onclick: () => openZoom(f),
          },
          picture(f, "full"),
        ),
      ),
      h(
        "figcaption",
        { class: "detail__credit" },
        h("span", { text: `Source: ${f.pub}${f.year ? `, ${f.year}` : ""}.` }),
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

    const fig1 = f.fig.startsWith("1");
    const quote = h(
      "figure",
      { class: "quote" },
      h("blockquote", { text: f.caption }),
      h("figcaption", { text: fig1 ? `From the caption of Figure 1, panel (${f.fig.slice(1)})` : `Caption of Figure ${f.fig} in the paper` }),
    );

    const says = h(
      "section",
      { class: "detail__section", "aria-labelledby": "says-label" },
      h("span", { class: "label", id: "says-label", text: "What the paper says" }),
      f.strats.length
        ? h(
            "ul",
            { class: "says" },
            f.strats.map((id) => {
              const s = byStrat[id];
              return h(
                "li",
                { class: state.focus === id ? "is-on" : null },
                h(
                  "div",
                  { class: "says__head" },
                  num(s),
                  h("span", { class: "says__name", text: s.name }),
                  h("span", { class: "says__sec", text: `§${s.section}` }),
                ),
                h("p", { text: f.paper[id] }),
              );
            }),
          )
        : h("p", {
            class: "says__none",
            text: "The paper shows this chart in Figure 1 as one of its examples of annotated professional charts. It is not discussed under a specific strategy.",
          }),
    );

    const notice = h(
      "section",
      { class: "detail__section", "aria-labelledby": "notice-label" },
      h("span", { class: "label", id: "notice-label", text: "What to notice" }),
      h("ol", { class: "notice" }, f.notice.map((b) => h("li", { text: b }))),
    );

    const text = h(
      "div",
      { class: "detail__text" },
      h(
        "p",
        { class: "detail__meta" },
        h("span", { class: "card__fig", text: `Figure ${f.fig}` }),
        sep(),
        f.pub,
        f.year ? sep() : null,
        f.year ? String(f.year) : null,
        sep(),
        f.type,
      ),
      h("h2", { id: "detail-title", text: f.title }),
      f.url
        ? h(
            "div",
            { class: "detail__actions" },
            h(
              "a",
              { class: "btn btn--small", href: f.url, target: "_blank", rel: "noopener" },
              `See it in ${f.pub}`,
              h("span", { "aria-hidden": "true", text: "↗" }),
            ),
          )
        : null,
      quote,
      says,
      notice,
    );

    return [figure, text];
  }

  function openDetail(id, { push = true, focus } = {}) {
    const f = byId[id];
    if (!f) return;
    const wasOpen = els.detail.open;
    if (focus !== undefined) state.focus = focus;
    state.ex = id;
    lastId = id;

    els.body.replaceChildren(...buildDetail(f));
    els.body.scrollTop = 0;
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
    state.focus = null;
    $$(".card.is-last").forEach((c) => c.classList.remove("is-last"));
    const card = cardNodes.get(lastId);
    // return focus to the card only when the reader came from the gallery
    if (card && card.isConnected) {
      const r = card.getBoundingClientRect();
      const visible = r.bottom > 0 && r.top < innerHeight;
      card.classList.add("is-last");
      if (visible) $(".card__link", card).focus({ preventScroll: true });
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
    render(false);
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
  // a click on the backdrop closes
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

  $("#detail-link").addEventListener("click", () => copy(location.origin + urlFor(state.ex), "Link copied"));

  // ── Full-size chart ───────────────────────────────────────────
  // The chart is fitted to the screen, enlarged up to twice its own size.
  // A chart the screen had to shrink can then be opened at its own pixels.
  const MAX_ENLARGE = 2;
  let fitted = 0; // the fitted chart's width, without its mat

  function fitZoom() {
    const img = els.zoomImg;
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    if (!els.zoom.open || !nw || !nh) return;
    const st = getComputedStyle(els.zoomStage);
    const mat = 2 * (parseFloat(getComputedStyle(img).paddingLeft) || 0);
    const aw = els.zoomStage.clientWidth - parseFloat(st.paddingLeft) - parseFloat(st.paddingRight) - mat;
    const ah = els.zoomStage.clientHeight - parseFloat(st.paddingTop) - parseFloat(st.paddingBottom) - mat;
    fitted = Math.floor(nw * Math.max(0.05, Math.min(aw / nw, ah / nh, MAX_ENLARGE)));
    const actual = els.zoomStage.classList.contains("is-actual");
    img.style.width = (actual ? nw : fitted) + mat + "px";
    img.style.cursor = actual || nw <= fitted + 1 ? "zoom-out" : "zoom-in";
    img.classList.add("is-loaded");
  }

  function openZoom(f) {
    const img = els.zoomImg;
    els.zoomStage.classList.remove("is-actual");
    img.classList.remove("is-loaded");
    img.style.width = "";
    img.onerror = () => {
      img.onerror = null;
      img.src = `professional-vis-examples/${f.id}.png`;
    };
    img.alt = chartAlt(f);
    img.src = `images/web/${f.id}.webp`;
    els.zoom.showModal();
    if (img.complete && img.naturalWidth) fitZoom();
  }
  els.zoomImg.addEventListener("load", fitZoom);
  window.addEventListener("resize", fitZoom);
  els.zoomImg.addEventListener("click", (e) => {
    e.stopPropagation();
    if (els.zoomStage.classList.contains("is-actual") || els.zoomImg.naturalWidth > fitted + 1) {
      els.zoomStage.classList.toggle("is-actual");
      fitZoom();
    } else els.zoom.close();
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

  // ── Entry motion ──────────────────────────────────────────────
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
  readUrl();
  renderContents();
  renderStrategies();
  renderTypes();
  observeInView();
  render(false);
  if (state.ex) openDetail(state.ex, { push: false });
})();
