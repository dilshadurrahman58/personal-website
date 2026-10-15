/* AnnoGram companion site. Everything the page says about the grammar, the pipeline,
   and the evaluation is taken from the paper (arXiv:2507.04236). */
(() => {
  const root = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduceMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // ── Figures fade in once loaded ──────────────────────────────
  $$(".sheet img").forEach((img) => {
    const done = () => img.classList.add("is-loaded");
    if (img.complete && img.naturalWidth) done();
    else {
      img.addEventListener("load", done, { once: true });
      img.addEventListener("error", done, { once: true });
    }
  });

  // ── Figure 1: the spec and the chart point at each other ─────
  const specimen = $("#specimen-box");
  let locked = null;
  function showAnn(k) {
    specimen.classList.toggle("has-on", k != null);
    $$("[data-k]", specimen).forEach((el) => {
      const on = el.dataset.k === String(k);
      el.classList.toggle("is-on", on);
      if (el.matches(".spec__block")) el.setAttribute("aria-pressed", String(on && locked === k));
    });
  }
  $$(".spec__block, .notes li, .pin", specimen).forEach((el) => {
    const k = el.dataset.k;
    el.addEventListener("pointerenter", (e) => e.pointerType === "mouse" && showAnn(k));
    el.addEventListener("pointerleave", (e) => e.pointerType === "mouse" && showAnn(locked));
  });
  $$(".spec__block", specimen).forEach((el) => {
    el.addEventListener("click", () => {
      locked = locked === el.dataset.k ? null : el.dataset.k;
      showAnn(locked);
    });
    el.addEventListener("focus", () => showAnn(el.dataset.k));
    el.addEventListener("blur", () => showAnn(locked));
  });
  $$(".notes li", specimen).forEach((el) =>
    el.addEventListener("click", () => {
      locked = locked === el.dataset.k ? null : el.dataset.k;
      showAnn(locked);
    }),
  );

  // ── Figure 2: what the paper says about each name ────────────
  // Snippets are quoted from Figure 1B; nothing here is invented syntax.
  const FIG1B = {
    targets: `"target": {
  "type": "data-space",
  "x": "2021-01-11", "y": 0
},
"target": {
  "type": "data-expr",
  "expr": "datum.date ==
          '2021-01-11'"
}`,
    text: `"text": {
  "text": "Jan. 2021 peak",
  "position": "upperMiddle",
  "style": { ... }
}`,
    enclosure: `"enclosure": {
  "shape": { ... },
  "style": { ... },
}`,
    connector: `"connector": {
  "curve": "natural",
  "style": {...}
}`,
  };

  const TERMS = {
    Root: {
      kind: "The top-level primitive",
      name: "Root",
      rule: false,
      text: [
        "AnnoGram elevates annotations to the same level as other primary Grammar of Graphics components, such as geometries and scales, rather than treating them as guides or secondary datasets.",
        "Each annotation has a target and associated visual effects, each with its own positioning and styling. Every effect is optional, so one target can carry several, as the gray band and its label do in the COVID-19 chart above.",
      ],
      src: "Sections 1 and 3, Figure 2",
      rel: ["target", "Annotation", "more"],
    },
    target: {
      kind: "Field",
      name: "<code>target</code>",
      text: [
        "An annotation must first define its target: the specific visualization element it applies to.",
        "In the grammar a target is a list. Each entry is an id, a fixed position, a chart part, a data point, an axis, or none.",
      ],
      src: "Section 3, Target; Figure 3",
      ex: { label: "Both targets from the COVID-19 chart above", code: FIG1B.targets },
      rel: ["DataPoint", "Axis", "ChartPart", "FixedPos", "id", "None"],
    },
    id: {
      kind: "Terminal",
      name: "<code>id</code>",
      text: [
        "Every annotation carries an id, and a target can be one. That is how one annotation refers to another: a marker on an anomaly, for example, can point to a separate annotation that explains its cause.",
      ],
      src: "Section 3, Target",
      rel: ["Annotation", "target"],
    },
    None: {
      kind: "Primitive",
      name: "<em>None</em>",
      text: [
        "As a target, None means the annotation is not tied to any specific chart element. It serves as a standalone note, positioned independently to offer supplementary context.",
        "Elsewhere in the grammar, None fills an optional slot, as in a text or an enclosure without a set position.",
      ],
      src: "Section 3, Target",
      rel: ["target", "TextAnn", "EnclosureAnn"],
    },
    DataPoint: {
      kind: "Annotation target",
      name: "DataPoint",
      text: [
        "Data points let annotations highlight individual points or subsets defined by direct indexing or by expressions. An annotation can highlight all values exceeding a temperature threshold, for example, and update as the data changes.",
        "Because the target is a rule over the data rather than a position, the annotation follows the point when the data or the chart changes.",
      ],
      src: "Section 3, Target",
      rel: ["target", "Axis", "ChartPart"],
    },
    ChartPart: {
      kind: "Annotation target",
      name: "ChartPart",
      text: [
        "Chart parts are situating elements such as titles, legends, and axis labels. They support meta-level explanations, such as clarifying what colors or shapes represent in a legend.",
        "They let an annotation explain the chart itself, not only its data.",
      ],
      src: "Section 3, Target",
      rel: ["target", "DataPoint", "Axis"],
    },
    Axis: {
      kind: "Annotation target",
      name: "Axis",
      text: [
        "Axis targets apply annotations to the x- or y-axis, marking significant values, ranges, or structural elements such as tick marks, gridlines, and labels. An annotation might highlight a time range on the x-axis to give historical context.",
        "The range is optional: a list of coordinates, or an expression.",
      ],
      src: "Section 3, Target",
      rel: ["target", "Coord"],
    },
    FixedPos: {
      kind: "Placement, and a target",
      name: "FixedPos",
      text: [
        "Fixed positioning places annotations in data space or in pixel space. Data space anchors an annotation to the encoding scales, which lets it be reused across chart types; pixel space gives absolute control through screen coordinates. Fine adjustments use dx and dy offsets.",
        "When an author gives a fixed position, it takes priority over automatic placement.",
      ],
      src: "Sections 3 and 4, Placement and Architecture",
      rel: ["Position", "Coord", "target"],
    },
    Annotation: {
      kind: "Annotation type",
      name: "Annotation⟨<em>X</em>⟩",
      text: [
        "The common shape of every annotation type: an id, a style, and the type's own body X. The text, enclosure, connector, and indicator fields of the root are each an Annotation of their type.",
      ],
      src: "Figure 2",
      rel: ["Style", "TextAnn", "EnclosureAnn", "ConnectorAnn", "IndicatorAnn", "id"],
    },
    Style: {
      kind: "Annotation type",
      name: "Style",
      text: [
        "Style is left open on purpose, since each type styles differently: font size, color, and alignment for text; padding and stroke for enclosures; stroke color, width, and arrowheads for indicators.",
      ],
      src: "Section 3, Annotation Types",
      rel: ["Annotation"],
    },
    TextAnn: {
      kind: "Annotation type",
      name: "TextAnn",
      text: [
        "Text annotations convey explanatory context for specific data points, chart regions, or encodings, like the notes in the COVID-19 chart above. They are highly customizable, with properties such as font size, color, and alignment.",
      ],
      src: "Section 3, Annotation Types",
      ex: { label: "From the COVID-19 chart above", code: FIG1B.text },
      rel: ["Annotation", "Position", "None"],
    },
    EnclosureAnn: {
      kind: "Annotation type",
      name: "EnclosureAnn",
      text: [
        "Enclosure annotations draw attention to clusters or regions of interest with shapes such as rectangles, ellipses, brackets, or curly braces, like the gray band in the COVID-19 chart above. They support adjustable padding and stroke styles.",
        "Shapes that need special rendering, such as ellipses, are added directly to the rendered scene.",
      ],
      src: "Sections 3 and 4",
      ex: { label: "From the COVID-19 chart above", code: FIG1B.enclosure },
      rel: ["Annotation", "Position", "None"],
    },
    ConnectorAnn: {
      kind: "Annotation type",
      name: "ConnectorAnn",
      text: [
        "Connector annotations link visual elements, such as data points and their explanations, with paths or lines, like the arrow tying the note to the January 2021 peak above. They support interpolation modes including linear, curved, and stepwise.",
      ],
      src: "Section 3, Annotation Types",
      ex: { label: "From the COVID-19 chart above", code: FIG1B.connector },
      rel: ["Annotation", "None"],
    },
    IndicatorAnn: {
      kind: "Annotation type",
      name: "IndicatorAnn",
      text: [
        "Indicator annotations mark thresholds, trends, or events with visual markers such as lines, arrows, or highlights, such as an arrow along a rising trend. Styling options include stroke color, width, and arrowheads.",
      ],
      src: "Section 3, Annotation Types",
      rel: ["Annotation"],
    },
    Position: {
      kind: "Placement",
      name: "Position",
      text: [
        "A target implies constraints, since an annotation should stay visually associated with its referent; positioning strategies add flexibility. Placement defaults can be overridden, much as inline CSS takes precedence over external stylesheets.",
        "Manual positioning is never required: annotations receive meaningful placement automatically from the target and the layout, and authors keep full control when they want it.",
      ],
      src: "Section 3, Placement",
      ex: { label: "A position from the COVID-19 chart above", code: `"position": "upperMiddle"` },
      rel: ["FixedPos", "Anchor1D", "Anchor2D"],
    },
    Anchor1D: {
      kind: "Placement",
      name: "Anchor1D",
      text: [
        "Relative positioning and anchoring align annotations with their targets as the chart changes. Anchors may apply in one or both dimensions, snapping to element edges or centers; this is the one-dimensional case.",
        "In the prototype, offsets and anchor values are applied between the Position Resolver and the Assembler.",
      ],
      src: "Sections 3 and 4",
      rel: ["Anchor2D", "Position"],
    },
    Anchor2D: {
      kind: "Placement",
      name: "Anchor2D",
      text: [
        "Relative positioning and anchoring align annotations with their targets as the chart changes. Anchors may apply in one or both dimensions, snapping to element edges or centers; this is the two-dimensional case, and the list of values continues.",
        "In the prototype, offsets and anchor values are applied between the Position Resolver and the Assembler.",
      ],
      src: "Sections 3 and 4",
      rel: ["Anchor1D", "Position"],
    },
    Coord: {
      kind: "Placement",
      name: "Coord",
      text: [
        "A coordinate is a string or a number. It gives the x and y of a fixed position and the bounds of an axis range.",
      ],
      src: "Figure 2",
      rel: ["FixedPos", "Axis"],
    },
    more: {
      kind: "The root continues",
      name: "···",
      rule: false,
      text: [
        "The root is left open. The grammar can hold all seven annotation types of an earlier annotation taxonomy by the same group; the four shown here are the ones the prototype draws.",
      ],
      src: "Section 3, Annotation Types",
      rel: ["Root", "Annotation"],
    },
  };

  const gram = $("#gram");
  const readerBody = $("#reader-body");
  const readerLabel = $("#reader-label");
  const readerClear = $("#reader-clear");
  const tsheet = $("#tsheet");
  const tsheetBody = $("#tsheet-body");
  const wide = matchMedia("(min-width: 1101px)");
  let term = null;

  const LABELS = { more: "More annotation types" };

  // the root's brace, drawn to the height of its rules
  const brace = $(".gram__brace", gram);
  const drawBrace = () => {
    const h = Math.round(brace.getBoundingClientRect().height);
    if (!h) return;
    const m = h / 2;
    brace.setAttribute("viewBox", `0 0 14 ${h}`);
    brace.firstElementChild.setAttribute(
      "d",
      `M13 1 C 8.5 1, 7 2.5, 7 7 L 7 ${m - 7} C 7 ${m - 2.5}, 5 ${m}, 1.5 ${m} C 5 ${m}, 7 ${m + 2.5}, 7 ${m + 7} L 7 ${h - 7} C 7 ${h - 2.5}, 8.5 ${h - 1}, 13 ${h - 1}`,
    );
  };
  if ("ResizeObserver" in window) new ResizeObserver(drawBrace).observe(brace);
  drawBrace();
  const nameOf = (t) => TERMS[t].name.replace(/<[^>]+>/g, "");

  // three families, the same colors the rest of the page uses
  const FAM = {
    Root: "root", target: "target", id: "target", None: "target", DataPoint: "target", ChartPart: "target", Axis: "target",
    Annotation: "type", Style: "type", TextAnn: "type", EnclosureAnn: "type", ConnectorAnn: "type", IndicatorAnn: "type", more: "type",
    Position: "place", Anchor1D: "place", Anchor2D: "place", FixedPos: "place", Coord: "place",
  };
  const FAM_NAME = { root: "Top level", target: "Target", type: "Annotation type", place: "Placement" };
  $$("[data-t]", gram).forEach((b) => (b.dataset.f = FAM[b.dataset.t] || "root"));
  const gist = (t) => {
    const p = TERMS[t].text[0];
    const m = p.match(/^.*?[.!?](?=\s|$)/);
    return m ? m[0] : p;
  };

  const rules = $$(".rule", gram);
  const defRow = (t) => rules.find((r) => (r.dataset.d || "").split(" ").includes(t)) || null;
  const ownerOf = (r) => (r.dataset.d ? r.dataset.d.split(" ")[0] : r.closest(".gram__root") ? "Root" : null);
  function builtFrom(t) {
    const r = defRow(t);
    if (!r) return [];
    return [...new Set($$(".rule__rhs [data-t]", r).map((b) => b.dataset.t))].filter((x) => x !== t);
  }
  function usedIn(t) {
    const d = defRow(t);
    return [...new Set(rules.filter((r) => r !== d && r.querySelector(`[data-t="${t}"]`)).map(ownerOf).filter(Boolean))].filter((x) => x !== t);
  }

  function ruleFor(t) {
    const row = defRow(t) || rules.find((r) => r.querySelector(`[data-t="${t}"]`));
    if (!row) return "";
    const lhs = row.querySelector(".rule__lhs")?.innerHTML || "";
    const op = row.querySelector(".rule__op")?.textContent.replace("opt", "").trim() || "";
    const rhs = row.querySelector(".rule__rhs")?.innerHTML || "";
    return `<div class="term__rule">${lhs} ${op ? `<span class="rule__op">${esc(op)}</span>` : ""} ${rhs}</div>`
      .replace(/<button/g, '<span tabindex="-1"')
      .replace(/<\/button>/g, "</span>")
      .replace(/ is-(on|def)\b/g, "");
  }

  const chip = (r) =>
    `<button type="button" class="chip" data-go="${r}" data-f="${FAM[r] || "root"}">${esc(LABELS[r] || nameOf(r))}</button>`;

  function introHtml() {
    return `
      <p class="term__text" style="margin-top:0">Each line defines the name on its left by the expression on its right. Names are colored by the part of an annotation they describe.</p>
      <ul class="voices">
        <li><span class="nt" data-f="target" style="text-decoration:none">DataPoint</span><span>Targets: what an annotation refers to.</span></li>
        <li><span class="nt" data-f="type" style="text-decoration:none">TextAnn</span><span>Annotation types: what is drawn.</span></li>
        <li><span class="nt" data-f="place" style="text-decoration:none">Position</span><span>Placement: where it goes.</span></li>
        <li><span class="kw">upLeft</span><span>A literal keyword or value.</span></li>
        <li><span class="prim">Expression</span><span>A primitive, such as a string, a number, or an expression.</span></li>
        <li><span><span class="fld">text</span> <span class="rule__op" style="display:inline-block;margin-left:8px">:=<sup>opt</sup></span></span><span>An optional field.</span></li>
      </ul>
      <div class="term__rel reader__start"><span class="label">Start with</span>${["Root", "target", "Position"].map(chip).join("")}</div>`;
  }

  function termHtml(t, inSheet) {
    const d = TERMS[t];
    const f = FAM[t] || "root";
    const from = builtFrom(t);
    const used = usedIn(t);
    const structure =
      from.length || used.length
        ? `<div class="term__uses">${from.length ? `<span class="label">Built from</span><div>${from.map(chip).join("")}</div>` : ""}${used.length ? `<span class="label">Used in</span><div>${used.map(chip).join("")}</div>` : ""}</div>`
        : `<div class="term__rel"><span class="label">Related</span>${d.rel.map(chip).join("")}</div>`;
    return `
      <p class="label term__kind" data-f="${f}"><i></i>${esc(FAM_NAME[f])}<span aria-hidden="true">·</span>${esc(d.kind)}</p>
      <h3 class="term__name" data-f="${f}" ${inSheet ? 'id="tsheet-title"' : ""}>${d.name}</h3>
      ${d.rule === false ? "" : ruleFor(t)}
      ${d.text.map((p) => `<p class="term__text">${esc(p)}</p>`).join("")}
      ${d.ex ? `<div class="term__ex"><span class="label">${esc(d.ex.label)}</span><pre>${esc(d.ex.code)}</pre></div>` : ""}
      ${structure}`;
  }

  // paint a selected name, or a whole family
  function paint({ t = null, fam = null } = {}) {
    $$("[data-t]", gram).forEach((b) => {
      const on = t ? b.dataset.t === t : fam ? b.dataset.f === fam : false;
      b.classList.toggle("is-on", on);
      b.classList.remove("is-def");
      b.setAttribute("aria-pressed", String(!!t && b.dataset.t === term));
    });
    gram.classList.toggle("has-on", !!(t || fam));
    rules.forEach((r) => {
      const defs = (r.dataset.d || "").split(" ").filter(Boolean);
      let rel = false;
      if (t) rel = defs.includes(t) || !!r.querySelector(`[data-t="${t}"]`) || (t === "Root" && !!r.closest(".gram__root"));
      else if (fam) rel = defs.some((d) => FAM[d] === fam) || !!r.querySelector(`[data-f="${fam}"]`);
      r.classList.toggle("is-rel", rel);
      const isDef = !!t && defs.includes(t);
      r.classList.toggle("is-defrow", isDef);
      if (isDef) {
        r.style.setProperty("--rowf", `var(--c-${{ target: "tgt", type: "typ", place: "plc" }[FAM[t]] || "tgt"})`);
        r.querySelector(`.rule__lhs [data-t="${t}"]`)?.classList.add("is-def");
      }
    });
    if (t === "Root") $(".gram__rootlabel", gram).classList.add("is-def");
  }

  // arcs in the left margin tie every use of a name to its definition
  const arcs = $("#gram-arcs");
  function drawArcs(t, from) {
    while (arcs.firstChild) arcs.firstChild.remove();
    const d = t && defRow(t);
    if (!d || !wide.matches) return;
    const g = gram.getBoundingClientRect();
    const defBtn = d.querySelector(`.rule__lhs [data-t="${t}"]`) || d;
    const yOf = (el) => {
      const r = el.getBoundingClientRect();
      return r.top + r.height / 2 - g.top;
    };
    const yd = yOf(defBtn);
    const fromDef = !from || d.contains(from);
    const uses = fromDef
      ? rules.filter((r) => r !== d && r.querySelector(`[data-t="${t}"]`)).map((r) => r.querySelector(`[data-t="${t}"]`))
      : [from];
    arcs.style.setProperty("--f", `var(--c-${{ target: "tgt", type: "typ", place: "plc" }[FAM[t]] || "tgt"})`);
    const x = parseFloat(getComputedStyle(gram).paddingLeft) - 9;
    const NS = "http://www.w3.org/2000/svg";
    const seen = new Set();
    uses.forEach((u) => {
      const yu = Math.round(yOf(u));
      if (seen.has(yu) || Math.abs(yu - yd) < 6) return;
      seen.add(yu);
      const bulge = Math.min(x - 2, 7 + Math.abs(yu - yd) * 0.035);
      const p = document.createElementNS(NS, "path");
      p.setAttribute("d", `M${x} ${yu} C ${x - bulge} ${yu}, ${x - bulge} ${yd}, ${x} ${yd}`);
      arcs.appendChild(p);
      p.style.setProperty("--len", p.getTotalLength());
      const c = document.createElementNS(NS, "circle");
      c.setAttribute("cx", x);
      c.setAttribute("cy", yu);
      c.setAttribute("r", 2.2);
      arcs.appendChild(c);
    });
    if (seen.size) {
      const c = document.createElementNS(NS, "circle");
      c.setAttribute("cx", x);
      c.setAttribute("cy", yd);
      c.setAttribute("r", 3);
      arcs.appendChild(c);
    }
  }

  // a short tip on hover, from the paper's own first sentence
  const tip = $("#gtip");
  const canHover = matchMedia("(hover: hover) and (pointer: fine)");
  function showTip(b) {
    if (!canHover.matches || !wide.matches) return;
    const t = b.dataset.t;
    const f = FAM[t] || "root";
    tip.innerHTML = `<b>${esc(FAM_NAME[f])}</b>${esc(gist(t))}<span>${term === t ? "Selected" : "Click to read more"}</span>`;
    const g = gram.getBoundingClientRect();
    const r = b.getBoundingClientRect();
    tip.style.left = "0px";
    tip.style.top = "0px";
    tip.classList.add("is-on");
    const w = tip.offsetWidth;
    const left = Math.min(Math.max(8, r.left - g.left - 6), g.width - w - 8);
    tip.style.left = `${left}px`;
    tip.style.top = `${r.bottom - g.top + 8}px`;
  }
  const hideTip = () => tip.classList.remove("is-on");

  let famLock = null;
  function restore() {
    if (term) {
      paint({ t: term });
      drawArcs(term);
    } else {
      paint({ fam: famLock });
      drawArcs(null);
    }
  }
  function preview(b) {
    paint({ t: b.dataset.t });
    drawArcs(b.dataset.t, b);
    showTip(b);
  }
  gram.addEventListener("pointerover", (e) => {
    if (e.pointerType !== "mouse") return;
    const b = e.target.closest("[data-t]");
    if (b) preview(b);
  });
  gram.addEventListener("pointerout", (e) => {
    if (e.pointerType !== "mouse") return;
    const b = e.target.closest("[data-t]");
    if (b && !b.contains(e.relatedTarget)) {
      hideTip();
      restore();
    }
  });
  gram.addEventListener("focusin", (e) => {
    const b = e.target.closest("[data-t]");
    if (b && b.matches(":focus-visible")) preview(b);
  });
  gram.addEventListener("focusout", () => {
    hideTip();
    restore();
  });

  // the color key highlights a family
  $$(".gkey[data-fam]", gram).forEach((k) => {
    k.addEventListener("pointerenter", () => !term && paint({ fam: k.dataset.fam }));
    k.addEventListener("pointerleave", () => restore());
    k.addEventListener("click", () => {
      famLock = famLock === k.dataset.fam ? null : k.dataset.fam;
      $$(".gkey[data-fam]", gram).forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.fam === famLock)));
      if (term) setTerm(null);
      else restore();
    });
  });

  function renderReader() {
    readerBody.innerHTML = term ? termHtml(term) : introHtml();
    readerLabel.textContent = term ? "About this name" : "Reading the grammar";
    readerClear.hidden = !term;
    if (!reduceMotion()) {
      readerBody.classList.remove("is-swap");
      void readerBody.offsetWidth;
      readerBody.classList.add("is-swap");
    }
    readerBody.scrollTop = 0;
  }

  function setTerm(t, { from } = {}) {
    term = t && TERMS[t] ? t : null;
    if (term) {
      famLock = null;
      $$(".gkey[data-fam]", gram).forEach((x) => x.setAttribute("aria-pressed", "false"));
    }
    hideTip();
    restore();
    if (wide.matches) return renderReader();
    if (!term) return closeSheet();
    tsheetBody.innerHTML = termHtml(term, true);
    tsheetBody.scrollTop = 0;
    if (!tsheet.open) {
      sheetReturn = from || document.activeElement;
      tsheet.showModal();
      root.classList.add("has-modal");
    }
  }

  let sheetReturn = null;
  function closeSheet() {
    if (!tsheet.open) return;
    tsheet.close();
  }
  tsheet.addEventListener("close", () => {
    root.classList.remove("has-modal");
    tsheet.style.transform = "";
    if (!wide.matches) {
      term = null;
      restore();
    }
    sheetReturn?.focus?.({ preventScroll: true });
  });
  tsheet.addEventListener("click", (e) => e.target === tsheet && closeSheet());
  $("#tsheet-close").addEventListener("click", closeSheet);

  gram.addEventListener("click", (e) => {
    const b = e.target.closest("[data-t]");
    if (!b) return;
    setTerm(term === b.dataset.t && wide.matches ? null : b.dataset.t, { from: b });
  });
  document.addEventListener("click", (e) => {
    const go = e.target.closest("[data-go]");
    if (go) setTerm(go.dataset.go);
  });
  readerClear.addEventListener("click", () => setTerm(null));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && (term || famLock) && wide.matches && !$("#zoom").open) {
      famLock = null;
      $$(".gkey[data-fam]", gram).forEach((x) => x.setAttribute("aria-pressed", "false"));
      setTerm(null);
    }
  });
  wide.addEventListener("change", () => {
    closeSheet();
    renderReader();
    restore();
  });
  if ("ResizeObserver" in window) new ResizeObserver(() => term && drawArcs(term)).observe(gram);
  renderReader();

  // drag the sheet down to dismiss it
  (function dragToDismiss(handle, sheet, onDismiss) {
    let y0 = null;
    let dy = 0;
    handle.addEventListener("pointerdown", (e) => {
      if (e.target.closest("button")) return;
      y0 = e.clientY;
      dy = 0;
      handle.setPointerCapture(e.pointerId);
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
      sheet.style.transition = "transform 0.3s var(--ease-out)";
      if (dy > 90) onDismiss();
      else sheet.style.transform = "";
    };
    handle.addEventListener("pointerup", end);
    handle.addEventListener("pointercancel", end);
  })($(".tsheet__bar"), tsheet, closeSheet);

  // ── Table 1 ──────────────────────────────────────────────────
  // [Bar Ann. LOC, Bar LOC, Line Ann. LOC, Line LOC, Scatter Ann. LOC, Scatter LOC,
  //  1st-class support, Intuitiveness, Error proneness, Portability], exactly as printed.
  const TABLE = [
    { group: "High" },
    { tool: "d3", v: [151, 81, 175, 76, 170, 104, "×", "Hard", "High", "Hard"] },
    { tool: "d3-annotate", v: [161, 81, 174, 77, 177, 99, "✓", "Med.", "Med.", "Med."] },
    { tool: "ggplot2", v: [120, 22, 128, 43, 208, 101, "✓", "Med.", "High", "Med."] },
    { tool: "ggplot2-annotate", v: [73, 20, 117, 42, 178, 101, "✓", "Med.", "High", "Med."] },
    { group: "Low" },
    { tool: "HighCharts", v: [82, 32, 231, 82, 169, 79, "✓", "Med.", "Low", "Hard"] },
    { tool: "Vega", v: [515, 161, 491, 219, 387, 186, "×", "Hard", "High", "Hard"] },
    { tool: "Vega-Lite", v: [259, 23, 253, 29, 177, 34, "×", "Hard", "High", "Hard"] },
    { tool: "VL Annotation", ours: true, v: [101, 19, 95, 25, 79, 31, "✓", "Easy", "Low", "Easy"] },
    { group: "–" },
    { tool: "Visual Editors", note: "PowerPoint, Figma, etc.", v: ["–", "–", "–", "–", "–", "–", "–", "Easy", "Low", "Hard"] },
  ];
  const COLS = ["Bar Ann. LOC", "Bar LOC", "Line Ann. LOC", "Line LOC", "Scatter Ann. LOC", "Scatter LOC"];
  const QCOLS = ["1st-class support", "Intuitiveness", "Error proneness", "Portability"];
  // the paper shades favorable codes blue and medium ones gray
  function rating(v, q) {
    if (q === 0) {
      if (v === "✓") return `<span class="mk mk--yes" aria-label="Yes">✓</span>`;
      if (v === "×") return `<span class="mk" aria-label="No">×</span>`;
      return `<span class="mk" aria-label="Not applicable">–</span>`;
    }
    const good = v === "Easy" || (q === 2 && v === "Low");
    const cls = good ? "r--good" : v === "Med." ? "r--mid" : "r--bad";
    return `<span class="r ${cls}">${esc(v)}</span>`;
  }
  const t1 = $("#t1-body");
  if (t1) t1.innerHTML = TABLE.map((r) => {
    if (r.group)
      return `<tr class="grp-row"><th colspan="11" scope="colgroup">Programmability: ${esc(r.group)}</th></tr>`;
    const loc = r.v
      .slice(0, 6)
      .map(
        (x, i) =>
          `<td class="${i % 2 ? "" : "ann "}x${(i >> 1) + 1} ${i % 2 ? "yt" : "ya"}" data-l="${COLS[i]}">${x}</td>`,
      )
      .join("");
    const q = r.v
      .slice(6)
      .map((x, i) => `<td class="c q q${i + 1}${i ? "" : " l"}" data-l="${QCOLS[i]}">${rating(x, i)}</td>`)
      .join("");
    const name = `${esc(r.tool)}${r.ours ? ' <span class="ed">(the prototype)</span>' : ""}${r.note ? `<br><span class="ed">${esc(r.note)}</span>` : ""}`;
    return `<tr${r.ours ? ' class="is-ours"' : ""}><th scope="row">${name}</th>${loc}${q}</tr>`;
  }).join("");

  // ── Annotation LOC, per chart type ───────────────────────────
  const CODED = TABLE.filter((r) => r.tool && typeof r.v[0] === "number");
  const CHART = { bar: [0, "bar chart"], line: [2, "line chart"], scatter: [4, "scatterplot"] };
  const MAX = 550;
  const ROW = 40;
  const bars = $("#bars");
  bars.style.height = `${CODED.length * ROW + 6}px`;
  bars.innerHTML =
    `<li class="bars__axis" aria-hidden="true">${[0, 100, 200, 300, 400, 500]
      .map((t) => `<span class="bars__tick" style="left:calc((100% - 44px) * ${t / MAX})"><span>${t}</span></span>`)
      .join("")}</li>` +
    CODED.map(
      (r) =>
        `<li class="bars__row${r.ours ? " is-ours" : ""}" data-tool="${esc(r.tool)}"><span class="bars__name">${esc(r.tool)}</span><span class="bars__track"><span class="bars__fill"></span><span class="bars__val"></span></span></li>`,
    ).join("");
  const rows = $$(".bars__row", bars);

  function drawLoc(c) {
    const [col, label] = CHART[c];
    const sorted = [...CODED].sort((a, b) => a.v[col] - b.v[col]);
    rows.forEach((li) => {
      const r = CODED.find((x) => x.tool === li.dataset.tool);
      const n = r.v[col];
      li.style.transform = `translateY(${sorted.indexOf(r) * ROW}px)`;
      $(".bars__fill", li).style.width = `calc((100% - 44px) * ${n / MAX})`;
      $(".bars__val", li).textContent = n;
      li.setAttribute("aria-label", `${r.tool}: ${n} lines`);
    });
    $$("#loc-seg button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.c === c)));
    $("#loc-sub").textContent = `Annotated ${label}`;

    const ours = CODED.find((r) => r.ours);
    const vl = CODED.find((r) => r.tool === "Vega-Lite");
    const fewer = sorted.filter((r) => r.v[col] < ours.v[col]);
    const cap = label[0].toUpperCase() + label.slice(1);
    let read = `${cap}: VL Annotation needs ${ours.v[col]} lines for the annotation, against ${vl.v[col]} in Vega-Lite, which it extends.`;
    read +=
      fewer.length === 0
        ? ` That is the fewest of the eight tools with code.`
        : ` ${fewer.map((r) => `${r.tool} (${r.v[col]})`).join(" and ")} ${fewer.length > 1 ? "need" : "needs"} fewer.`;
    $("#loc-read").textContent = read;
  }
  $("#loc-seg").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-c]");
    if (b) drawLoc(b.dataset.c);
  });
  drawLoc("bar");

  // color the keys of every spec by family
  $$(".spec .j-k").forEach((k) => {
    const v = k.textContent;
    if (v === '"target"') k.classList.add("k-tgt");
    else if (['"text"', '"enclosure"', '"connector"'].includes(v)) k.classList.add("k-typ");
    else if (v === '"position"') k.classList.add("k-plc");
  });

  // ── Scroll scenes: a figure holds still while scrolling drives it ──
  // Pinned only when the figure fits the screen and motion is welcome; otherwise it plays on its own.
  function scene(wrap, { length, onProgress, onPin }) {
    const pin = $(".scene__pin", wrap);
    let pinned = null;
    let top = 0;
    let h = 0;
    let vh = innerHeight;
    let vw = innerWidth;
    let raf = 0;
    function update() {
      if (!pinned) return;
      const r = wrap.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (top - r.top) / Math.max(1, r.height - h)));
      wrap.classList.toggle("is-done", p > 0.97);
      onProgress(p);
    }
    // only touches the page height when something really changed, so scrolling never jumps
    function measure() {
      const nh = pin.offsetHeight;
      const next = !reduceMotion() && nh + 40 < vh;
      const ntop = Math.max(60, Math.round((vh - nh) / 2));
      if (next === pinned && Math.abs(nh - h) < 2 && ntop === top) return update();
      const changed = next !== pinned;
      h = nh;
      top = ntop;
      pinned = next;
      wrap.classList.toggle("is-pinned", pinned);
      pin.style.top = pinned ? `${top}px` : "";
      wrap.style.height = pinned ? `${Math.round(h + vh * length)}px` : "";
      if (changed) onPin(pinned);
      update();
    }
    addEventListener("scroll", () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    }, { passive: true });
    let rt = 0;
    addEventListener("resize", () => {
      // phones resize as the address bar moves; only a real change of width counts
      if (innerWidth === vw && Math.abs(innerHeight - vh) < 120) return;
      clearTimeout(rt);
      rt = setTimeout(() => {
        vw = innerWidth;
        vh = innerHeight;
        measure();
      }, 150);
    });
    if ("ResizeObserver" in window) new ResizeObserver(() => requestAnimationFrame(measure)).observe(pin);
    requestAnimationFrame(measure);
    return {
      get pinned() {
        return !!pinned;
      },
      scrollTo(p) {
        const r = wrap.getBoundingClientRect();
        window.scrollTo({ top: scrollY + r.top - top + p * (r.height - h), behavior: reduceMotion() ? "auto" : "smooth" });
      },
    };
  }

  // a timed loop, used when a figure is not pinned
  function looper(fig, { beats, loop, onBeat, playBtn }) {
    let elapsed = 0;
    let cur = -1;
    let playing = !reduceMotion();
    let visible = false;
    let enabled = true;
    let lastT = null;
    const indexAt = (t) => beats.reduce((k, at, i) => (at <= t ? i : k), 0);
    const show = (k) => {
      if (k === cur) return;
      cur = k;
      onBeat(k);
    };
    function frame(now) {
      if (lastT != null && playing && visible && enabled) {
        elapsed += now - lastT;
        if (elapsed >= loop) {
          elapsed = 0;
          cur = -1;
        }
        show(indexAt(elapsed));
      }
      lastT = now;
      requestAnimationFrame(frame);
    }
    function setPlaying(p) {
      playing = p;
      fig.classList.toggle("is-paused", !p);
      playBtn.setAttribute("aria-label", p ? "Pause the animation" : "Play the animation");
    }
    playBtn.addEventListener("click", () => setPlaying(!playing));
    if ("IntersectionObserver" in window)
      new IntersectionObserver((en) => en.forEach((e) => (visible = e.isIntersecting)), { threshold: 0.3 }).observe(fig);
    else visible = true;
    setPlaying(playing);
    requestAnimationFrame(frame);
    return {
      jump(k, pause) {
        elapsed = beats[k] + 1;
        cur = -1;
        show(k);
        if (pause) setPlaying(false);
      },
      enable(on) {
        enabled = on;
        cur = -1;
      },
    };
  }
  const clamp01 = (x) => Math.min(1, Math.max(0, x));
  const smooth = (t) => t * t * (3 - 2 * t);
  function swapText(el, text) {
    if (el.textContent === text) return;
    el.textContent = text;
    if (!reduceMotion() && el.animate)
      el.animate([{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], { duration: 420, easing: "ease-out" });
  }

  // ── Why · one blueprint, many libraries ──────────────────────
  const tree = $("#tree");
  if (tree) {
    const CAPS = [
      "Charting libraries share one blueprint: data, scales, geometries, coordinates, and guides.",
      "AnnoGram adds annotations to the blueprint itself, beside scales and geometries.",
      "Libraries built on the blueprint could inherit annotations from it. The prototype does this for Vega-Lite.",
    ];
    const beatBtns = $$("#tree-beats button");
    const cap = $("#tree-cap");
    const parts = $$(".tree__parts li:not(.tree__new)", tree);
    const libs = $$("#tree-libs li");
    let beat = -1;
    function setBeat(k) {
      if (k === beat) return;
      beat = k;
      tree.classList.toggle("is-b1", k >= 1);
      tree.classList.toggle("is-b2", k >= 2);
      swapText(cap, CAPS[k]);
      beatBtns.forEach((b, i) => {
        b.classList.toggle("is-on", i === k);
        b.classList.toggle("is-done", i < k);
        b.setAttribute("aria-current", i === k ? "step" : "false");
      });
    }
    // scroll position → what is drawn
    const treeRail = $(".fig__rail span", tree);
    function scrub(p) {
      treeRail.style.transform = `scaleX(${p.toFixed(4)})`;
      const shown = Math.min(parts.length, 1 + Math.floor(p / 0.045));
      parts.forEach((li, i) => li.classList.toggle("is-hidden", i >= shown));
      setBeat(p < 0.3 ? 0 : p < 0.55 ? 1 : 2);
      const w = clamp01((p - 0.55) / 0.25);
      $$(".tree__wire", tree).forEach((path) => {
        const len = parseFloat(path.style.getPropertyValue("--len")) || 300;
        path.style.strokeDashoffset = String(len * (1 - w));
      });
      libs.forEach((li, i) => li.classList.toggle("is-lit", p >= 0.58 + (0.22 * (i + 1)) / libs.length));
      tree.classList.toggle("is-flowing", p >= 0.82);
    }
    const L = looper(tree, {
      beats: [0, 2600, 5200],
      loop: 11000,
      playBtn: $("#tree-play"),
      onBeat: (k) => {
        parts.forEach((li) => li.classList.remove("is-hidden"));
        $$(".tree__wire", tree).forEach((path) => (path.style.strokeDashoffset = ""));
        libs.forEach((li) => li.classList.toggle("is-lit", k >= 2));
        tree.classList.toggle("is-flowing", k >= 2);
        beat = -1;
        setBeat(k);
      },
    });
    const S = scene($("#scene-tree"), {
      length: 1.8,
      onProgress: scrub,
      onPin(on) {
        tree.classList.toggle("is-scrub", on);
        L.enable(!on);
        if (!on) L.jump(reduceMotion() ? 2 : 0, reduceMotion());
      },
    });
    beatBtns.forEach((b) =>
      b.addEventListener("click", () => {
        const k = +b.dataset.beat;
        if (S.pinned) S.scrollTo([0.12, 0.42, 0.92][k]);
        else L.jump(k, true);
      }),
    );

    const wires = $("#tree-wires");
    const stage = $("#tree-stage");
    function layoutTree() {
      const NS = "http://www.w3.org/2000/svg";
      while (wires.firstChild) wires.firstChild.remove();
      const Sr = stage.getBoundingClientRect();
      const g = $("#tree-gog").getBoundingClientRect();
      const x1 = g.left + g.width / 2 - Sr.left;
      const y1 = g.bottom - Sr.top;
      libs.forEach((li, i) => {
        const r = li.getBoundingClientRect();
        const x2 = r.left + r.width / 2 - Sr.left;
        const y2 = r.top - Sr.top;
        const my = y1 + Math.min(40, (y2 - y1) * 0.55);
        const d = `M${x1} ${y1} C ${x1} ${my}, ${x2} ${my}, ${x2} ${y2}`;
        const p = document.createElementNS(NS, "path");
        p.setAttribute("d", d);
        p.setAttribute("class", `tree__wire${li.classList.contains("is-proto") ? " is-proto" : ""}`);
        p.style.setProperty("--i", i);
        wires.appendChild(p);
        p.style.setProperty("--len", Math.ceil(p.getTotalLength()) + 2);
        if (!reduceMotion()) {
          const c = document.createElementNS(NS, "circle");
          c.setAttribute("r", 3);
          c.setAttribute("class", `tree__pulse${li.classList.contains("is-proto") ? " is-proto" : ""}`);
          c.style.offsetPath = `path("${d}")`;
          c.style.animationDelay = `${i * 0.18}s`;
          wires.appendChild(c);
        }
      });
    }
    if ("ResizeObserver" in window) new ResizeObserver(() => requestAnimationFrame(layoutTree)).observe(stage);
    layoutTree();
  }

  // ── Why · drawn on top vs. declared in the grammar ───────────
  const duo = $("#duo");
  if (duo && window.AnnoChart) {
    const { Chart } = window.AnnoChart;
    const h = (w) => Math.round(Math.max(190, Math.min(w * 0.62, innerHeight * 0.42)));
    const A = Chart($("#duo-a"), { compact: true, overlay: true, height: h, state: { show: false, hl: true, ghost: true } });
    const B = Chart($("#duo-b"), { compact: true, height: h, state: { show: true, hl: true } });
    const ORDER = ["scatter", "bar", "hbar"];
    const seg = $("#duo-mode");
    const sa = $("#duo-sa");
    const sb = $("#duo-sb");
    let mode = null;
    function status(m) {
      if (m === mode) return;
      mode = m;
      $$("button", seg).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.v === m)));
      const lost = m !== "scatter";
      $("#duo-pa").classList.toggle("is-lost", lost);
      sa.innerHTML = lost
        ? '<span class="duo__icon is-bad" aria-hidden="true">✕</span>Left where it was drawn'
        : '<span class="duo__icon" aria-hidden="true">✓</span>On the hybrid';
      sb.innerHTML = `<span class="duo__icon is-good" aria-hidden="true">✓</span>${lost ? "Followed the hybrid" : "On the hybrid"}`;
    }
    function setMode(m, animate = true) {
      A.set({ mode: m }, { animate });
      B.set({ mode: m }, { animate });
      status(m);
    }
    A.render({ animate: false });
    B.render({ animate: false });
    setMode("scatter", false);
    const L = looper(duo, {
      beats: [0, 3600, 7200],
      loop: 10800,
      playBtn: $("#duo-play"),
      onBeat: (k) => setMode(ORDER[k]),
    });
    // scroll position → a blend between two chart types
    const SPANS = [
      [0, 0.16, "scatter", "scatter"],
      [0.16, 0.42, "scatter", "bar"],
      [0.42, 0.58, "bar", "bar"],
      [0.58, 0.84, "bar", "hbar"],
      [0.84, 1.01, "hbar", "hbar"],
    ];
    const duoRail = $(".fig__rail span", duo);
    function scrubDuo(p) {
      duoRail.style.transform = `scaleX(${p.toFixed(4)})`;
      const [a, b, ma, mb] = SPANS.find(([a, b]) => p >= a && p < b) || SPANS[SPANS.length - 1];
      const t = ma === mb ? 0 : smooth(clamp01((p - a) / (b - a)));
      A.frame(ma, mb, t);
      B.frame(ma, mb, t);
      status(t < 0.5 ? ma : mb);
    }
    const S = scene($("#scene-duo"), {
      length: 1.8,
      onProgress: scrubDuo,
      onPin(on) {
        duo.classList.toggle("is-scrub", on);
        L.enable(!on);
        if (!on) setMode(reduceMotion() ? "scatter" : mode || "scatter", false);
      },
    });
    seg.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-v]");
      if (!b) return;
      const k = ORDER.indexOf(b.dataset.v);
      if (S.pinned) S.scrollTo([0.08, 0.5, 0.92][k]);
      else L.jump(k, true);
    });
    // redraw only when the width changes; height changes (a status line wrapping) must not interrupt motion
    if ("ResizeObserver" in window) {
      let raf = 0;
      let lastW = 0;
      new ResizeObserver((en) => {
        const w = Math.round(en[0].contentRect.width);
        if (w === lastW) return;
        lastW = w;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          A.render({ animate: false });
          B.render({ animate: false });
        });
      }).observe($(".duo__grid", duo));
    }
  }

  // ── How it works: the steps light up as the page scrolls past ──
  const flow = $("#flow");
  if (flow) {
    const steps = $$(".flow__step", flow);
    const lightFlow = () => {
      const r = flow.getBoundingClientRect();
      const p = reduceMotion() ? 1 : clamp01((innerHeight * 0.82 - r.top) / (innerHeight * 0.45));
      const n = Math.round(p * steps.length);
      steps.forEach((s, i) => s.classList.toggle("is-lit", i < n));
      flow.style.setProperty("--fill", n <= 1 ? 0 : (n - 1) / (steps.length - 1));
    };
    let raf = 0;
    addEventListener("scroll", () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(lightFlow);
    }, { passive: true });
    lightFlow();
  }

  // ── Portability playground ───────────────────────────────────
  const pg = $("#pg");
  if (pg && window.AnnoChart) {
    const { Chart, CARS, MODES, TARGETS, perturb } = window.AnnoChart;
    const canvas = $("#pg-canvas");
    const ch = Chart($("#pg-chart"), { height: (w) => Math.round(Math.min(420, Math.max(270, w * 0.62))) });
    const st = ch.state;
    const txt = $("#pg-text");
    let seed = 0;
    let edited = false;
    const n = { chart: 0, edits: 0 };
    txt.value = st.text;

    const k = (s, f) => `<span class="j-k${f ? ` k-${f}` : ""}">"${s}"</span>`;
    const v = (s) => `<span class="j-s">"${esc(s)}"</span>`;
    const p = (s) => `<span class="j-p">${s}</span>`;
    function specLines() {
      const m = MODES[st.mode];
      const L = [];
      const add = (kind, html) => L.push({ kind, html });
      add("", p("{"));
      add("data", `  ${k("data")}${p(": {")} ${k("values")}${p(": [")} <span class="j-c">${st.data.length} rows</span> ${p("] },")}`);
      add("chart", `  ${k("mark")}${p(":")} ${v(m.mark)}${p(",")}`);
      add("chart", `  ${k("encoding")}${p(": {")}`);
      add("chart", `    ${k("x")}${p(": {")} ${k("field")}${p(":")} ${v(m.x)} ${p("},")}`);
      add("chart", `    ${k("y")}${p(": {")} ${k("field")}${p(":")} ${v(m.y)} ${p("}")}`);
      add("chart", `  ${p("},")}`);
      add("ann", `  ${k("annotations")}${p(": [{")}`);
      add("ann", `    ${k("target", "tgt")}${p(": {")}`);
      add("ann", `      ${k("type")}${p(":")} ${v("data-expr")}${p(",")}`);
      add("ann", `      ${k("expr")}${p(":")} ${v(TARGETS[st.target].expr)}`);
      const tail = [];
      if (st.effects.text)
        tail.push([
          `    ${k("text", "typ")}${p(": {")}`,
          `      ${k("text")}${p(":")} ${v(st.text)}${p(",")}`,
          `      ${k("position", "plc")}${p(":")} ${v(st.position)}`,
          `    ${p("}")}`,
        ]);
      if (st.effects.enclosure) tail.push([`    ${k("enclosure", "typ")}${p(": {")} ${k("shape")}${p(": { ... } }")}`]);
      if (st.effects.connector) tail.push([`    ${k("connector", "typ")}${p(": {")} ${k("curve")}${p(":")} ${v("natural")} ${p("}")}`]);
      add("ann", `    ${p(tail.length ? "}," : "}")}`);
      tail.forEach((blk, i) => {
        blk.forEach((line, j) => add("ann", j === blk.length - 1 && i < tail.length - 1 ? `${line}${p(",")}` : line));
      });
      add("ann", `  ${p("}]")}`);
      add("", p("}"));
      return L;
    }
    const specEl = $("#pg-spec");
    function drawSpec(flash) {
      specEl.innerHTML = specLines()
        .map((l) => `<span class="ln${l.kind ? ` ln--${l.kind}` : ""}">${l.html}</span>`)
        .join("");
      if (!flash || reduceMotion()) return;
      $$(flash === "ann" ? ".ln--ann" : flash === "data" ? ".ln--data" : ".ln--chart", specEl).forEach((l) =>
        l.classList.add(flash === "ann" ? "is-flash-ann" : "is-flash-chart"),
      );
    }

    const pillC = $("#pg-s-chart");
    const pillA = $("#pg-s-ann");
    function pills(kind) {
      pillC.className = "pill";
      pillA.className = "pill pill--ann";
      if (kind === "ann") {
        pillC.textContent = "Chart unchanged";
        pillA.textContent = "Annotation edited";
        pillA.classList.add("is-edited");
      } else if (kind) {
        pillC.textContent = kind === "data" ? "Data changed" : kind === "width" ? "Layout changed" : "Chart changed";
        pillC.classList.add("is-changed");
        pillA.textContent = "✓ Annotation unchanged";
        pillA.classList.add("is-same");
      } else {
        pillC.textContent = "Chart";
        pillA.textContent = "Annotation";
      }
    }

    const last = {};
    function readout(info) {
      const set = (id, html) => {
        const el = $(id);
        if (last[id] !== html) {
          el.innerHTML = html;
          if (last[id] !== undefined && !reduceMotion()) {
            el.classList.remove("is-flash");
            void el.offsetWidth;
            el.classList.add("is-flash");
          }
          last[id] = html;
        }
      };
      set("#r-target", `<code>${esc(TARGETS[st.target].expr)}</code> matches <strong>${esc(info.datum.type)}</strong>`);
      set("#r-mark", `the ${info.mark === "point" ? "point" : "bar"} for ${esc(info.datum.type)}, at (${info.px.x}, ${info.px.y}) px`);
      set(
        "#r-place",
        st.effects.text
          ? `<code>${esc(st.position)}</code>: ${esc(info.dir)}${info.overlaps ? `, touching ${info.overlaps} mark${info.overlaps > 1 ? "s" : ""}` : ", clear of other marks"}`
          : "No text to place",
      );
      $("#pg-live").textContent = `${MODES[st.mode].name}. The annotation targets ${info.datum.type} and sits ${info.dir}.`;
      $("#pg-tally").innerHTML =
        `Changes to the chart, data, or layout: <strong>${n.chart}</strong>. Edits the annotation needed: <strong>0</strong>.` +
        (n.edits ? ` Your own edits to it: ${n.edits}.` : "");
    }

    function go(patch, kind, o) {
      if (kind && kind !== "ann") n.chart++;
      if (kind === "ann") n.edits++;
      const info = ch.set(patch, o);
      drawSpec(kind);
      pills(kind);
      readout(info);
    }

    const pressSeg = (seg, val) => $$("button", seg).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.v === val)));
    $("#pg-mode").addEventListener("click", (e) => {
      const b = e.target.closest("button[data-v]");
      if (!b || b.dataset.v === st.mode) return;
      pressSeg($("#pg-mode"), b.dataset.v);
      go({ mode: b.dataset.v }, "chart");
    });
    $("#pg-data").addEventListener("click", () => {
      seed++;
      go({ data: perturb(CARS, seed) }, "data");
    });
    $("#pg-width").addEventListener("click", (e) => {
      const b = e.target.closest("button[data-v]");
      if (!b || b.getAttribute("aria-pressed") === "true") return;
      pressSeg($("#pg-width"), b.dataset.v);
      canvas.classList.toggle("is-narrow", b.dataset.v === "narrow");
      n.chart++;
      pills("width");
      drawSpec(null);
    });
    $("#pg-target").addEventListener("change", (e) => {
      const t = e.target.value;
      const patch = { target: t };
      if (!edited) {
        patch.text = TARGETS[t].text;
        txt.value = patch.text;
      }
      go(patch, "ann");
    });
    let typing = false;
    txt.addEventListener("input", () => {
      edited = true;
      if (!typing) n.edits++;
      typing = true;
      const info = ch.set({ text: txt.value }, { ms: 300 });
      drawSpec(null);
      pills("ann");
      readout(info);
    });
    txt.addEventListener("blur", () => (typing = false));
    $("#pg-effects").addEventListener("click", (e) => {
      const b = e.target.closest("button[data-e]");
      if (!b) return;
      const on = b.getAttribute("aria-pressed") !== "true";
      b.setAttribute("aria-pressed", String(on));
      go({ effects: { ...st.effects, [b.dataset.e]: on } }, "ann");
    });
    $("#pg-pos").addEventListener("click", (e) => {
      const b = e.target.closest("button[data-v]");
      if (!b || b.dataset.v === st.position) return;
      pressSeg($("#pg-pos"), b.dataset.v);
      go({ position: b.dataset.v }, "ann");
    });
    $("#pg-ghost").addEventListener("change", (e) => {
      const info = ch.set({ ghost: e.target.checked }, { animate: false });
      readout(info);
    });
    $("#pg-reset").addEventListener("click", () => {
      seed = 0;
      edited = false;
      typing = false;
      n.chart = 0;
      n.edits = 0;
      txt.value = TARGETS.hybrid.text;
      $("#pg-target").value = "hybrid";
      $("#pg-ghost").checked = false;
      pressSeg($("#pg-mode"), "scatter");
      pressSeg($("#pg-pos"), "auto");
      pressSeg($("#pg-width"), "wide");
      canvas.classList.remove("is-narrow");
      $$("#pg-effects button").forEach((b) => b.setAttribute("aria-pressed", "true"));
      const info = ch.set({
        mode: "scatter", data: CARS.map((r) => ({ ...r })), target: "hybrid", text: TARGETS.hybrid.text,
        effects: { text: true, enclosure: true, connector: true }, position: "auto", ghost: false,
      });
      drawSpec(null);
      pills(null);
      readout(info);
    });

    let raf = 0;
    let lastW = 0;
    if ("ResizeObserver" in window)
      new ResizeObserver((en) => {
        const w = Math.round(en[0].contentRect.width);
        if (w === lastW) return;
        lastW = w;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => readout(ch.render({ animate: false })));
      }).observe(canvas);
    drawSpec(null);
    pills(null);
    readout(ch.render({ animate: false }));
  }

  // ── Full-size figures ────────────────────────────────────────
  const zoom = $("#zoom");
  const zoomImg = $("#zoom-img");
  let zoomReturn = null;
  $$("[data-zoom]").forEach((b) =>
    b.addEventListener("click", (e) => {
      if (e.target.closest(".pin")) return;
      const img = $("img", b);
      zoomReturn = b;
      zoomImg.src = `images/${b.dataset.zoom}.webp`;
      zoomImg.alt = img ? img.alt : "";
      zoom.showModal();
      root.classList.add("has-modal");
    }),
  );
  const closeZoom = () => zoom.open && zoom.close();
  $("#zoom-close").addEventListener("click", closeZoom);
  $("#zoom-stage").addEventListener("click", closeZoom);
  zoom.addEventListener("close", () => {
    root.classList.remove("has-modal");
    zoomReturn?.focus({ preventScroll: true });
  });

  // ── Copy ─────────────────────────────────────────────────────
  const toastEl = $("#toast");
  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("is-on"), 2200);
  }
  async function copy(text, msg) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.readOnly = true;
      ta.style.cssText = "position:fixed;opacity:0";
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

  // ── Theme ────────────────────────────────────────────────────
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

  // ── Entry motion ─────────────────────────────────────────────
  const items = $$(".in-view");
  if (!("IntersectionObserver" in window)) items.forEach((el) => el.classList.add("is-in"));
  else {
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
})();
