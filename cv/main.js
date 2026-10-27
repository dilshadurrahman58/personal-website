/* Curriculum Vitae · Md Dilshadur Rahman
   The reader bar, the publication list, and the contents that follow
   the reader down the page. */

const root = document.documentElement;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ── Theme: one preference shared by every page on dilshadur.com ── */
const themeMeta = document.getElementById("theme-color-meta");
const applyTheme = (theme) => {
  root.setAttribute("data-theme", theme);
  if (themeMeta) themeMeta.setAttribute("content", theme === "dark" ? "#0B0C0E" : "#EEECE6");
};

// the switch is named for where a press leads, as its icon shows
const themeToggle = document.getElementById("theme-toggle");
const nameThemeToggle = () => {
  const label = root.getAttribute("data-theme") === "dark" ? "Switch to light theme" : "Switch to dark theme";
  themeToggle?.setAttribute("aria-label", label);
  if (themeToggle) themeToggle.title = label;
};
nameThemeToggle();
new MutationObserver(nameThemeToggle).observe(root, { attributes: true, attributeFilter: ["data-theme"] });

themeToggle?.addEventListener("click", () => {
  const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
  try {
    localStorage.setItem("theme", next);
  } catch (e) {
    /* storage can be unavailable; the switch still applies */
  }
  applyTheme(next);
});

window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
  let stored = null;
  try {
    stored = localStorage.getItem("theme");
  } catch (err) {
    /* ignore */
  }
  if (!stored) applyTheme(e.matches ? "dark" : "light");
});

/* ── Reading progress: a hairline under the bar ─────────────────── */
const progress = document.getElementById("progress");
const updateProgress = () => {
  if (!progress) return;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.transform = `scaleX(${max > 0 ? Math.min(window.scrollY / max, 1) : 0})`;
};
window.addEventListener("scroll", updateProgress, { passive: true });
window.addEventListener("resize", updateProgress);

/* ── Contents: a small card from the bar on narrower screens ────── */
const contentsBtn = document.getElementById("contents-btn");
const contentsPanel = document.getElementById("contents-panel");

const setContents = (open) => {
  if (!contentsBtn || !contentsPanel) return;
  contentsBtn.setAttribute("aria-expanded", String(open));
  contentsPanel.hidden = !open;
  if (open) contentsPanel.querySelector("a")?.focus({ preventScroll: true });
};

contentsBtn?.addEventListener("click", () => {
  setContents(contentsBtn.getAttribute("aria-expanded") !== "true");
});

contentsPanel?.addEventListener("click", (e) => {
  if (e.target.closest("a")) setContents(false);
});

document.querySelector(".contents")?.addEventListener("focusout", (e) => {
  if (!e.currentTarget.contains(e.relatedTarget)) setContents(false);
});

document.addEventListener("click", (e) => {
  if (contentsPanel?.hidden) return;
  if (!e.target.closest(".contents")) setContents(false);
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && contentsPanel && !contentsPanel.hidden) {
    setContents(false);
    contentsBtn.focus();
  }
});

/* ── The current part, marked in both contents lists ────────────── */
const parts = Array.from(document.querySelectorAll(".part[id]"));
const tocLinks = Array.from(document.querySelectorAll(".margin-toc a, .contents__panel a"));

const markCurrent = () => {
  const line = window.scrollY + window.innerHeight * 0.3;
  let current = parts[0]?.id;
  parts.forEach((part) => {
    if (part.offsetTop <= line) current = part.id;
  });
  if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
    current = parts[parts.length - 1]?.id;
  }
  tocLinks.forEach((a) => {
    if (a.getAttribute("href") === `#${current}`) a.setAttribute("aria-current", "location");
    else a.removeAttribute("aria-current");
  });
};

let tick = null;
window.addEventListener(
  "scroll",
  () => {
    if (tick) return;
    tick = requestAnimationFrame(() => {
      tick = null;
      markCurrent();
    });
  },
  { passive: true },
);

/* ── Publications ───────────────────────────────────────────────── */
const GROUPS = [
  { type: "journal", label: "Journal articles", prefix: "J" },
  { type: "conference", label: "Conference and workshop papers", prefix: "C" },
  { type: "poster", label: "Posters", prefix: "P" },
  { type: "review", label: "Under review and in preparation", prefix: "R" },
];
const SUMMARY = {
  all: "all publications",
  journal: "journal articles",
  conference: "conference and workshop papers",
  poster: "posters",
  review: "works under review or in preparation",
};

const escapeHtml = (s) =>
  s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const strong = (s) => escapeHtml(s).replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
const italic = (s) =>
  escapeHtml(s)
    .replace(/\*\*(.*?)\*\*/g, "<i>$1</i>")
    .replace(/, ((?:19|20)\d{2})\b/g, ",\u00a0$1")
    // short abbreviations such as (IEEE TVCG) never split across lines
    .replace(/\(([^()]{1,16})\)/g, (m) => m.replace(/ /g, "\u00a0"));
const yearOf = (pub) => {
  const years = (pub.venue.match(/\b(?:19|20)\d{2}\b/g) || []).map(Number);
  return years.length ? Math.max(...years) : 0;
};

const linkHtml = (l) => {
  // pages on dilshadur.com open in place; everything else opens a new tab.
  // Links stay absolute so they also work inside the printed PDF.
  if (l.url.startsWith("https://dilshadur.com/")) {
    return `<a href="${l.url}">${escapeHtml(l.label)}</a>`;
  }
  return `<a href="${l.url}" target="_blank" rel="noopener">${escapeHtml(l.label)}<span class="pub__ext" aria-hidden="true">↗</span></a>`;
};

const pubHtml = (pub, number) => {
  const meta = [];
  if (pub.note) meta.push(`<span class="pub__note">${escapeHtml(pub.note)}</span>`);
  pub.links.forEach((l) => meta.push(linkHtml(l)));
  return `
    <li class="entry pub" data-type="${pub.type}">
      <span class="when">${number}</span>
      <div class="what">
        <h4 class="pub__title">${escapeHtml(pub.title)}</h4>
        <p class="pub__authors">${strong(pub.authors)}</p>
        <p class="pub__venue">${italic(pub.venue)}</p>
        ${meta.length ? `<p class="pub__meta">${meta.join("")}</p>` : ""}
      </div>
    </li>`;
};

const pubList = document.getElementById("publications-list");
const pubStatus = document.getElementById("pub-status");
const filterButtons = Array.from(document.querySelectorAll(".filter"));
const filtersRow = document.querySelector(".filters");

const keepFiltersInView = () => {
  if (!filtersRow) return;
  const bar = document.getElementById("reader")?.offsetHeight || 0;
  const top = filtersRow.getBoundingClientRect().top;
  if (top < bar || top > window.innerHeight * 0.6) {
    window.scrollTo({ top: window.scrollY + top - bar - 24, behavior: reduceMotion ? "instant" : "smooth" });
  }
};

// noticed so a late re-anchor never fights a reader who has already moved
let readerMoved = false;
["wheel", "touchmove", "keydown"].forEach((type) =>
  window.addEventListener(type, () => (readerMoved = true), { once: true, passive: true }),
);
let publications = [];
let currentFilter = "all";

const render = (filter) => {
  currentFilter = filter;
  const html = GROUPS.filter((g) => filter === "all" || g.type === filter)
    .map((g) => {
      const items = publications
        .map((p, i) => ({ p, i }))
        .filter(({ p }) => p.type === g.type)
        .sort((a, b) => yearOf(b.p) - yearOf(a.p) || a.i - b.i);
      if (!items.length) return "";
      const list = items.map(({ p }, n) => pubHtml(p, `${g.prefix}${n + 1}`)).join("");
      return `<section class="pub-group" aria-label="${g.label}">
        <h3 class="pub-group__title">${g.label}</h3>
        <ol class="entries">${list}</ol>
      </section>`;
    })
    .join("");
  pubList.innerHTML = html;
  pubList.setAttribute("aria-busy", "false");
  filterButtons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.filter === filter)));
  const shown = filter === "all" ? publications.length : publications.filter((p) => p.type === filter).length;
  if (pubStatus) pubStatus.textContent = `Showing ${shown} ${SUMMARY[filter]}.`;
  markCurrent();
  updateProgress();
};

fetch("data.json")
  .then((r) => r.json())
  .then((data) => {
    publications = data.publications;
    const counts = { all: publications.length };
    publications.forEach((p) => (counts[p.type] = (counts[p.type] || 0) + 1));
    Object.entries(counts).forEach(([type, n]) => {
      const el = document.getElementById(`count-${type}`);
      if (el) el.textContent = n;
    });
    render("all");

    // a link straight to a part (#talks) lands on it once the list has pushed things down
    const target = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (target && !readerMoved) target.scrollIntoView({ behavior: "instant", block: "start" });

    filterButtons.forEach((btn) =>
      btn.addEventListener("click", () => {
        const next = btn.dataset.filter;
        if (next === currentFilter) return;
        const swapList = () => {
          render(next);
          keepFiltersInView();
        };
        if (reduceMotion) return swapList();
        pubList.classList.add("is-switching");
        setTimeout(() => {
          swapList();
          requestAnimationFrame(() => pubList.classList.remove("is-switching"));
        }, 180);
      }),
    );

    // a printed CV always carries every publication
    window.addEventListener("beforeprint", () => {
      if (currentFilter !== "all") {
        window.__cvFilterBeforePrint = currentFilter;
        render("all");
      }
    });
    window.addEventListener("afterprint", () => {
      if (window.__cvFilterBeforePrint) {
        render(window.__cvFilterBeforePrint);
        window.__cvFilterBeforePrint = null;
      }
    });
  })
  .catch(() => {
    pubList.innerHTML =
      '<p class="pub-error">The publication list could not load just now. The <a href="dilshadur-cv.pdf">PDF</a> has the full list.</p>';
    pubList.setAttribute("aria-busy", "false");
  });

markCurrent();
updateProgress();
