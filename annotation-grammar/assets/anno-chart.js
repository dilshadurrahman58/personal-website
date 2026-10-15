/* A small chart that places one annotation the way the paper describes:
   the annotation names a target in the data, the target is resolved to a mark
   at runtime, and an automatic placement looks for free space near it.
   It is an illustration drawn by this page, not the Vega-Lite Annotation prototype. */
(() => {
  const NS = "http://www.w3.org/2000/svg";
  const reduce = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  function s(tag, attrs = {}, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  function tween(ms, step, done) {
    if (reduce() || ms === 0) {
      step(1);
      done && done();
      return () => {};
    }
    let raf;
    let t0 = null;
    const f = (now) => {
      if (t0 == null) t0 = now;
      const p = Math.min(1, (now - t0) / ms);
      step(ease(p));
      if (p < 1) raf = requestAnimationFrame(f);
      else done && done();
    };
    raf = requestAnimationFrame(f);
    return () => cancelAnimationFrame(raf);
  }

  // illustrative values, not data from the paper
  const CARS = [
    { type: "Compact", price: 22, mpg: 34, sales: 410 },
    { type: "Sedan", price: 28, mpg: 31, sales: 520 },
    { type: "Hybrid", price: 47, mpg: 50, sales: 160 },
    { type: "SUV", price: 38, mpg: 25, sales: 690 },
    { type: "Minivan", price: 36, mpg: 22, sales: 210 },
    { type: "Pickup", price: 43, mpg: 19, sales: 640 },
    { type: "Luxury", price: 58, mpg: 24, sales: 170 },
    { type: "Sports", price: 66, mpg: 20, sales: 90 },
  ];
  const FIELD = { price: "Price ($k)", mpg: "Fuel economy (mpg)", sales: "Sales (k units)", type: "Type" };
  const MODES = {
    scatter: { mark: "point", x: "price", y: "mpg", name: "Scatterplot" },
    bar: { mark: "bar", x: "type", y: "mpg", name: "Bar chart" },
    hbar: { mark: "bar", x: "sales", y: "type", name: "Horizontal bars" },
  };
  const argmax = (k) => (d) => d.reduce((a, b) => (b[k] > a[k] ? b : a));
  const TARGETS = {
    hybrid: { expr: "datum.type == 'Hybrid'", text: "The hybrid", pick: (d) => d.find((r) => r.type === "Hybrid") },
    mpg: { expr: "datum.mpg == max(mpg)", text: "Most fuel-efficient", pick: argmax("mpg") },
    price: { expr: "datum.price == max(price)", text: "Most expensive", pick: argmax("price") },
    sales: { expr: "datum.sales == max(sales)", text: "Best seller", pick: argmax("sales") },
  };

  function niceStep(span, n) {
    const raw = span / n;
    const p = Math.pow(10, Math.floor(Math.log10(raw)));
    const f = raw / p;
    return (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * p;
  }
  function domain(vals, zero, n) {
    let lo = zero ? 0 : Math.min(...vals);
    let hi = Math.max(...vals);
    const pad = zero ? 0 : (hi - lo) * 0.12;
    const step = niceStep(hi - lo + 2 * pad || 1, n);
    lo = zero ? 0 : Math.floor((lo - pad) / step) * step;
    hi = Math.ceil((hi + pad * (zero ? 0 : 1)) / step) * step;
    if (zero && hi === Math.max(...vals)) hi += step;
    const ticks = [];
    for (let v = lo; v <= hi + 1e-9; v += step) ticks.push(+v.toFixed(6));
    return { lo, hi, ticks };
  }

  function layout(mode, data, W, H, compact) {
    const m = MODES[mode];
    const fs = compact ? 9.5 : 10.5;
    const M =
      mode === "scatter"
        ? { l: compact ? 30 : 44, r: 14, t: 14, b: compact ? 26 : 42 }
        : mode === "bar"
          ? { l: compact ? 30 : 44, r: 10, t: 14, b: compact ? 40 : 54 }
          : { l: compact ? 56 : 70, r: 18, t: 10, b: compact ? 26 : 42 };
    const x0 = M.l, x1 = W - M.r, y0 = M.t, y1 = H - M.b;
    const n = data.length;
    const marks = {};
    const axes = { ticksX: [], ticksY: [], cats: [], fs, plot: { x0, x1, y0, y1 }, titleX: "", titleY: "" };
    const nt = compact ? 3 : 4;
    if (mode === "scatter") {
      const dx = domain(data.map((r) => r[m.x]), false, nt);
      const dy = domain(data.map((r) => r[m.y]), false, nt);
      const sx = (v) => lerp(x0, x1, (v - dx.lo) / (dx.hi - dx.lo));
      const sy = (v) => lerp(y1, y0, (v - dy.lo) / (dy.hi - dy.lo));
      const r = compact ? 4.5 : 5.5;
      data.forEach((d) => (marks[d.type] = { x: sx(d[m.x]) - r, y: sy(d[m.y]) - r, w: 2 * r, h: 2 * r, rx: r }));
      axes.ticksX = dx.ticks.map((v) => ({ p: sx(v), v }));
      axes.ticksY = dy.ticks.map((v) => ({ p: sy(v), v }));
    } else if (mode === "bar") {
      const dy = domain(data.map((r) => r[m.y]), true, nt);
      const sy = (v) => lerp(y1, y0, v / dy.hi);
      const band = (x1 - x0) / n;
      const bw = Math.min(band * 0.64, 34);
      data.forEach((d, i) => {
        const y = sy(d[m.y]);
        marks[d.type] = { x: x0 + i * band + (band - bw) / 2, y, w: bw, h: y1 - y, rx: 2 };
        axes.cats.push({ x: x0 + i * band + band / 2, y: y1, t: d.type, rot: true });
      });
      axes.ticksY = dy.ticks.map((v) => ({ p: sy(v), v }));
    } else {
      const dx = domain(data.map((r) => r[m.x]), true, nt);
      const sx = (v) => lerp(x0, x1, v / dx.hi);
      const band = (y1 - y0) / n;
      const bh = Math.min(band * 0.64, 22);
      data.forEach((d, i) => {
        marks[d.type] = { x: x0, y: y0 + i * band + (band - bh) / 2, w: sx(d[m.x]) - x0, h: bh, rx: 2 };
        axes.cats.push({ x: x0, y: y0 + i * band + band / 2, t: d.type, rot: false });
      });
      axes.ticksX = dx.ticks.map((v) => ({ p: sx(v), v }));
    }
    axes.titleX = m.x === "type" ? "" : FIELD[m.x];
    axes.titleY = m.y === "type" ? "" : FIELD[m.y];
    return { marks, axes, plot: { x0, x1, y0, y1 } };
  }

  // text measurement for wrapping and placement
  const ctx = document.createElement("canvas").getContext("2d");
  function wrap(text, maxW, font) {
    ctx.font = font;
    const words = String(text).trim().split(/\s+/).filter(Boolean);
    const lines = [];
    let line = "";
    for (const w of words) {
      const next = line ? `${line} ${w}` : w;
      if (ctx.measureText(next).width > maxW && line) {
        lines.push(line);
        line = w;
      } else line = next;
    }
    if (line) lines.push(line);
    const out = lines.slice(0, 3);
    return { lines: out, w: Math.max(0, ...out.map((l) => ctx.measureText(l).width)) };
  }

  const overlap = (a, b) =>
    Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) *
    Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));

  const DIRS = [
    [1, -1, "up and to the right"],
    [0, -1, "above"],
    [-1, -1, "up and to the left"],
    [1, 0, "to the right"],
    [-1, 0, "to the left"],
    [1, 1, "down and to the right"],
    [0, 1, "below"],
    [-1, 1, "down and to the left"],
  ];

  function place(B, lw, lh, obstacles, bounds, pref) {
    const inside = (box) => {
      const a = box.w * box.h;
      return a - overlap(box, { x: bounds.x0, y: bounds.y0, w: bounds.x1 - bounds.x0, h: bounds.y1 - bounds.y0 });
    };
    const clamp = (box) => ({
      ...box,
      x: Math.min(Math.max(box.x, bounds.x0), bounds.x1 - box.w),
      y: Math.min(Math.max(box.y, bounds.y0), bounds.y1 - box.h),
    });
    const count = (box) => obstacles.filter((o) => overlap(box, o) > 4).length;
    if (pref === "upLeft") {
      const box = clamp({ x: B.x - lw - 10, y: B.y - lh - 10, w: lw, h: lh });
      return { box, dir: "up and to the left (anchored)", overlaps: count(box) };
    }
    if (pref === "midRight") {
      const box = clamp({ x: B.x + B.w + 14, y: B.y + B.h / 2 - lh / 2, w: lw, h: lh });
      return { box, dir: "to the right (anchored)", overlaps: count(box) };
    }
    let best = null;
    DIRS.forEach(([dx, dy, name], k) => {
      for (const g of [14, 28, 46, 70, 100]) {
        const x = dx > 0 ? B.x + B.w + g : dx < 0 ? B.x - g - lw : B.x + B.w / 2 - lw / 2;
        const y = dy < 0 ? B.y - g - lh : dy > 0 ? B.y + B.h + g : B.y + B.h / 2 - lh / 2;
        const box = { x, y, w: lw, h: lh };
        let ov = 0;
        for (const o of obstacles) ov += overlap(box, o);
        const score = ov * 4 + inside(box) * 30 + g * 1.4 + k * 4;
        if (!best || score < best.score) best = { score, box, dir: name };
      }
    });
    const box = clamp(best.box);
    return { box, dir: best.dir, overlaps: count(box) };
  }

  function nearestOnBox(p, b) {
    return { x: Math.min(Math.max(p.x, b.x), b.x + b.w), y: Math.min(Math.max(p.y, b.y), b.y + b.h) };
  }

  function curve(P, Q) {
    const mx = (P.x + Q.x) / 2;
    const my = (P.y + Q.y) / 2;
    const dx = Q.x - P.x;
    const dy = Q.y - P.y;
    const k = 0.22;
    return `M${P.x.toFixed(1)} ${P.y.toFixed(1)} Q${(mx - dy * k).toFixed(1)} ${(my + dx * k).toFixed(1)} ${Q.x.toFixed(1)} ${Q.y.toFixed(1)}`;
  }

  const fmt = (v) => (Math.abs(v) >= 1000 ? `${v / 1000}k` : String(v));

  function Chart(svg, opt = {}) {
    const compact = !!opt.compact;
    const font = `500 ${compact ? 11 : 12.5}px Inter, -apple-system, sans-serif`;
    const lineH = compact ? 13 : 15.5;
    const st = {
      mode: "scatter",
      data: CARS.map((r) => ({ ...r })),
      target: "hybrid",
      text: TARGETS.hybrid.text,
      effects: { text: true, enclosure: true, connector: true },
      position: "auto",
      show: true,
      ghost: false,
    };
    Object.assign(st, opt.state || {});
    svg.classList.add("ac");
    svg.classList.toggle("ac--overlay", !!opt.overlay);
    const gAxes = s("g", { class: "ac-axes" }, svg);
    const gMarks = s("g", { class: "ac-marks" }, svg);
    const gGhost = s("g", { class: "ac-ghost" }, svg);
    const gAnn = s("g", { class: "ac-ann" }, svg);
    const encl = s("rect", { class: "ac-encl", rx: 5 }, gAnn);
    const conn = s("path", { class: "ac-conn" }, gAnn);
    const dot = s("circle", { class: "ac-dot", r: 3.2 }, gAnn);
    const lab = s("g", { class: "ac-label" }, gAnn);
    const labBg = s("rect", { class: "ac-label-bg", rx: 4 }, lab);
    const labText = s("text", {}, lab);
    labText.setAttribute("font-size", compact ? 11 : 12.5);
    const marks = {};
    CARS.forEach((d) => {
      marks[d.type] = s("rect", { class: "ac-mark" }, gMarks);
      s("title", {}, marks[d.type]).textContent = d.type;
    });

    let W = 0;
    let H = 0;
    let stop = () => {};
    let cur = null; // what is on screen right now: { marks, B, box }
    let ghostFix = null;
    let linesKey = "";
    const plans = new Map();
    const axes = new Map(); // key -> { g, mode }

    const dataKey = () => st.data.map((d) => `${d.price},${d.mpg},${d.sales}`).join("|");
    const axKey = (mode) => `${mode}|${W}|${H}|${dataKey()}`;

    function size() {
      const w = Math.max(240, Math.round(svg.parentNode.clientWidth));
      const h = Math.round(opt.height ? opt.height(w) : w * 0.62);
      if (w === W && h === H) return;
      W = w;
      H = h;
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      svg.setAttribute("width", W);
      svg.setAttribute("height", H);
      plans.clear();
      cur = null;
    }

    // layout and placement for one chart type, computed once and reused
    function plan(mode) {
      const key = `${axKey(mode)}|${st.target}|${st.text}|${st.effects.text}|${st.position}`;
      if (plans.has(key)) return plans.get(key);
      if (plans.size > 24) plans.clear();
      const L = layout(mode, st.data, W, H, compact);
      const T = TARGETS[st.target].pick(st.data).type;
      const lines = st.effects.text ? wrap(st.text || "", compact ? 96 : Math.min(170, W * 0.36), font) : { lines: [], w: 0 };
      const lw = Math.ceil(lines.w) + 14;
      const lh = lines.lines.length * lineH + 9;
      const Bf = L.marks[T];
      const obstacles = Object.entries(L.marks)
        .filter(([k]) => k !== T)
        .map(([, g]) => ({ x: g.x - 3, y: g.y - 3, w: g.w + 6, h: g.h + 6 }));
      obstacles.push({ x: Bf.x - 8, y: Bf.y - 8, w: Bf.w + 16, h: Bf.h + 16 });
      const bounds = { x0: L.plot.x0 + 2, x1: W - 4, y0: 3, y1: L.plot.y1 - 2 };
      const res = st.effects.text
        ? place(Bf, lw, lh, obstacles, bounds, st.position)
        : { box: { x: Bf.x, y: Bf.y, w: 0, h: 0 }, dir: "no text to place", overlaps: 0 };
      const pl = { mode, L, T, Bf, res, lines: lines.lines, datum: st.data.find((d) => d.type === T) };
      plans.set(key, pl);
      return pl;
    }
    const stateOf = (pl) => ({ marks: pl.L.marks, B: pl.Bf, box: pl.res.box });

    function setLines(lines) {
      const k = lines.join("\n");
      if (k === linesKey) return;
      linesKey = k;
      while (labText.firstChild) labText.firstChild.remove();
      lines.forEach((l) => (s("tspan", {}, labText).textContent = l));
    }

    function axesGroup(mode, L) {
      const key = axKey(mode);
      if (axes.has(key)) return axes.get(key).g;
      const ax = L.axes;
      const g = s("g", { class: "ac-axgroup" }, gAxes);
      g.style.opacity = 0;
      const { x0, x1, y0, y1 } = ax.plot;
      ax.ticksY.forEach((t) => {
        s("line", { class: "ac-grid", x1: x0, x2: x1, y1: t.p, y2: t.p }, g);
        s("text", { class: "ac-tick", x: x0 - 6, y: t.p + 3.5, "text-anchor": "end", "font-size": ax.fs }, g).textContent = fmt(t.v);
      });
      ax.ticksX.forEach((t) => {
        s("line", { class: "ac-grid", x1: t.p, x2: t.p, y1: y0, y2: y1 }, g);
        s("text", { class: "ac-tick", x: t.p, y: y1 + ax.fs + 5, "text-anchor": "middle", "font-size": ax.fs }, g).textContent = fmt(t.v);
      });
      s("line", { class: "ac-base", x1: x0, x2: x1, y1: y1, y2: y1 }, g);
      if (!ax.ticksY.length) s("line", { class: "ac-base", x1: x0, x2: x0, y1: y0, y2: y1 }, g);
      ax.cats.forEach((c) => {
        const t = c.rot
          ? s("text", { class: "ac-tick", x: c.x, y: c.y + 8, "text-anchor": "end", "font-size": ax.fs, transform: `rotate(-38 ${c.x} ${c.y + 8})` }, g)
          : s("text", { class: "ac-tick", x: c.x - 7, y: c.y + 3.5, "text-anchor": "end", "font-size": ax.fs }, g);
        t.textContent = c.t;
      });
      if (!compact) {
        if (ax.titleX) s("text", { class: "ac-title", x: (x0 + x1) / 2, y: H - 6, "text-anchor": "middle" }, g).textContent = ax.titleX;
        if (ax.titleY) s("text", { class: "ac-title", x: 12, y: (y0 + y1) / 2, "text-anchor": "middle", transform: `rotate(-90 12 ${(y0 + y1) / 2})` }, g).textContent = ax.titleY;
      }
      axes.set(key, { g, mode });
      return g;
    }

    // weights: Map(axes key -> opacity). Groups not named fade out and, if stale, leave.
    function showAxes(weights, animate) {
      axes.forEach((a, key) => {
        const o = weights.get(key) || 0;
        a.g.style.transition = animate && !reduce() ? "opacity 0.45s ease" : "none";
        a.g.style.opacity = o;
        const stale = !key.startsWith(`${a.mode}|${W}|${H}|${dataKey()}`);
        if (stale && o === 0) {
          axes.delete(key);
          setTimeout(() => a.g.remove(), animate ? 480 : 0);
        }
      });
    }

    function setMark(type, g) {
      const r = marks[type];
      r.setAttribute("x", g.x.toFixed(2));
      r.setAttribute("y", g.y.toFixed(2));
      r.setAttribute("width", Math.max(0, g.w).toFixed(2));
      r.setAttribute("height", Math.max(0, g.h).toFixed(2));
      r.setAttribute("rx", g.rx.toFixed(2));
    }

    function drawAnn(B, box, lines, pad) {
      const E = { x: B.x - pad, y: B.y - pad, w: B.w + 2 * pad, h: B.h + 2 * pad };
      encl.setAttribute("x", E.x);
      encl.setAttribute("y", E.y);
      encl.setAttribute("width", E.w);
      encl.setAttribute("height", E.h);
      encl.style.display = st.effects.enclosure ? "" : "none";
      const showText = st.effects.text && lines.length;
      lab.style.display = showText ? "" : "none";
      if (showText) {
        labBg.setAttribute("x", box.x);
        labBg.setAttribute("y", box.y);
        labBg.setAttribute("width", box.w);
        labBg.setAttribute("height", box.h);
        [...labText.children].forEach((t, i) => {
          t.setAttribute("x", box.x + 7);
          t.setAttribute("y", box.y + 5 + lineH * (i + 0.78));
        });
      }
      const target = st.effects.enclosure ? E : B;
      const C = { x: target.x + target.w / 2, y: target.y + target.h / 2 };
      const P = nearestOnBox(C, box);
      const Q = nearestOnBox(P, target);
      const on = showText && st.effects.connector && Math.hypot(P.x - Q.x, P.y - Q.y) > 8;
      conn.style.display = on ? "" : "none";
      dot.style.display = on ? "" : "none";
      if (on) {
        conn.setAttribute("d", curve(P, Q));
        dot.setAttribute("cx", Q.x);
        dot.setAttribute("cy", Q.y);
      }
    }

    const lerpBox = (a, b, t) => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t), rx: lerp(a.rx ?? 0, b.rx ?? 0, t) });

    // draw a blend of two states; t = 0 is a, t = 1 is b
    function draw(a, b, t, T, lines, pad) {
      const m = {};
      CARS.forEach((d) => {
        m[d.type] = lerpBox(a.marks[d.type] || b.marks[d.type], b.marks[d.type], t);
        setMark(d.type, m[d.type]);
        marks[d.type].classList.toggle("is-target", d.type === T && (st.show || st.hl));
      });
      const B = m[T];
      const box = { ...lerpBox(a.box, b.box, t), w: b.box.w, h: b.box.h };
      drawAnn(B, box, lines, pad);
      cur = { marks: m, B, box };
    }

    function drawGhost(broken) {
      while (gGhost.firstChild) gGhost.firstChild.remove();
      if (!ghostFix) return;
      const { box, pt, lines, encl: E } = ghostFix;
      gGhost.classList.toggle("is-broken", !!broken);
      if (opt.overlay) s("rect", { class: "ac-ghost-encl", x: E.x, y: E.y, width: E.w, height: E.h, rx: 5 }, gGhost);
      const P = nearestOnBox({ x: E.x + E.w / 2, y: E.y + E.h / 2 }, box);
      const Q = opt.overlay ? nearestOnBox(P, E) : pt;
      s("path", { class: "ac-ghost-conn", d: curve(P, Q) }, gGhost);
      s("circle", { class: "ac-ghost-dot", cx: Q.x, cy: Q.y, r: opt.overlay ? 3.2 : 3 }, gGhost);
      s("rect", { class: "ac-ghost-bg", x: box.x, y: box.y, width: box.w, height: box.h, rx: 4 }, gGhost);
      const t = s("text", { class: "ac-ghost-text", "font-size": compact ? 11 : 12.5 }, gGhost);
      lines.forEach((l, i) => (s("tspan", { x: box.x + 7, y: box.y + 5 + lineH * (i + 0.78) }, t).textContent = l));
    }
    function fixGhost(pl) {
      if (!st.ghost) {
        ghostFix = null;
        return;
      }
      if (!ghostFix || ghostFix.W !== W) {
        const B = pl.Bf;
        ghostFix = { W, mode: pl.mode, box: { ...pl.res.box }, pt: { x: B.x + B.w / 2, y: B.y + B.h / 2 }, encl: { x: B.x - 6, y: B.y - 6, w: B.w + 12, h: B.h + 12 }, lines: pl.lines };
      }
    }

    const info = (pl) => ({
      datum: pl.datum,
      mark: MODES[pl.mode].mark,
      px: { x: Math.round(pl.Bf.x + pl.Bf.w / 2), y: Math.round(pl.Bf.y + pl.Bf.h / 2) },
      dir: pl.res.dir,
      overlaps: pl.res.overlaps,
      mode: pl.mode,
    });

    // animate from whatever is on screen to the current state
    function render({ animate = true, ms = 760 } = {}) {
      stop();
      size();
      const pl = plan(st.mode);
      setLines(pl.lines);
      axesGroup(st.mode, pl.L);
      showAxes(new Map([[axKey(st.mode), 1]]), animate && !!cur);
      gAnn.classList.toggle("is-on", !!st.show);
      const from = cur || stateOf(pl);
      const to = stateOf(pl);
      const pad = st.mode === "scatter" ? 6 : 4;
      stop = tween(animate && cur ? ms : 0, (t) => draw(from, to, t, pl.T, pl.lines, pad));
      fixGhost(pl);
      drawGhost(ghostFix && ghostFix.mode !== st.mode);
      return info(pl);
    }

    // scroll-driven: a still frame between two chart types
    function frame(modeA, modeB, t) {
      stop();
      size();
      const a = plan(modeA);
      const b = plan(modeB);
      setLines(b.lines);
      axesGroup(modeA, a.L);
      axesGroup(modeB, b.L);
      const w = new Map([[axKey(modeA), modeA === modeB ? 1 : 1 - t]]);
      if (modeA !== modeB) w.set(axKey(modeB), t);
      showAxes(w, false);
      gAnn.classList.toggle("is-on", !!st.show);
      draw(stateOf(a), stateOf(b), t, b.T, b.lines, lerp(modeA === "scatter" ? 6 : 4, modeB === "scatter" ? 6 : 4, t));
      st.mode = t < 0.5 ? modeA : modeB;
      fixGhost(a);
      const at = (m) => ghostFix && ghostFix.mode === m;
      drawGhost(ghostFix && !((at(modeA) && t < 0.08) || (at(modeB) && t > 0.92)));
      return info(t < 0.5 ? a : b);
    }

    return {
      state: st,
      set(patch, o) {
        Object.assign(st, patch);
        return render(o);
      },
      render,
      frame,
      size: () => ({ W, H }),
    };
  }

  // a light, seeded change to the data, so "update the data" is repeatable
  function perturb(data, seed) {
    let x = seed * 9301 + 49297;
    const rnd = () => ((x = (x * 9301 + 49297) % 233280) / 233280);
    return data.map((d) => ({
      ...d,
      price: Math.round(Math.max(15, Math.min(80, d.price * (0.75 + rnd() * 0.5)))),
      mpg: Math.round(Math.max(14, Math.min(58, d.mpg * (0.72 + rnd() * 0.56)))),
      sales: Math.round(Math.max(40, Math.min(800, d.sales * (0.6 + rnd() * 0.8))) / 10) * 10,
    }));
  }

  window.AnnoChart = { Chart, CARS, MODES, TARGETS, FIELD, perturb, tween };
})();
