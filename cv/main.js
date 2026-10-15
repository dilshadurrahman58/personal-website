// ── SCROLL TO TOP BUTTON + READING PROGRESS ──────────
const scrollToTopBtn = document.getElementById("scrollToTopBtn");
const progressBar = document.getElementById("reading-progress");

const updateScrollUI = () => {
  const scrollY = window.scrollY;

  // Scroll-to-top visibility
  if (scrollToTopBtn) {
    scrollToTopBtn.classList.toggle("show", scrollY > 320);
  }

  // Reading progress bar
  if (progressBar) {
    const docHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? Math.min(scrollY / docHeight, 1) : 0;
    progressBar.style.transform = `scaleX(${progress})`;
  }
};

window.addEventListener("scroll", updateScrollUI, { passive: true });
updateScrollUI();

if (scrollToTopBtn) {
  scrollToTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;
const root = document.documentElement;

// Theme mode (light/dark) with persistence.
const themeToggles = Array.from(
  document.querySelectorAll("[data-theme-toggle]"),
);
const getCurrentTheme = () =>
  root.getAttribute("data-theme") === "dark" ? "dark" : "light";

const updateThemeToggleUI = (theme, announce = false) => {
  const isDark = theme === "dark";
  const nextModeText = isDark ? "Light Mode" : "Dark Mode";
  themeToggles.forEach((btn) => {
    btn.setAttribute(
      "aria-label",
      `Switch to ${isDark ? "light" : "dark"} mode`,
    );
    btn.setAttribute("aria-pressed", isDark ? "true" : "false");
    const text = btn.querySelector(".theme-toggle-text");
    if (text) text.textContent = nextModeText;
    // Icon swap logic for dual SVGs
    const sun = btn.querySelector(".icon-sun");
    const moon = btn.querySelector(".icon-moon");
    if (sun && moon) {
      if (isDark) {
        sun.style.display = "";
        moon.style.display = "none";
      } else {
        sun.style.display = "none";
        moon.style.display = "";
      }
    }
  });
  // Update theme-color meta
  const themeColorMeta = document.getElementById("theme-color-meta");
  if (themeColorMeta) {
    themeColorMeta.setAttribute("content", isDark ? "#141517" : "#fdfcfa");
  }
  // Announce to screen readers
  const themeStatus = document.getElementById("theme-status");
  if (themeStatus && announce) {
    themeStatus.textContent = `${isDark ? "Dark" : "Light"} mode enabled`;
  }
};

const applyTheme = (theme, persist = true, announce = true) => {
  root.classList.add("theme-transitioning");
  root.setAttribute("data-theme", theme);
  if (persist) {
    try {
      localStorage.setItem("theme", theme);
    } catch (e) {
      // Ignore storage errors (private mode/restricted environments).
    }
  }
  updateThemeToggleUI(theme, announce);
  setTimeout(() => root.classList.remove("theme-transitioning"), 350);
};

updateThemeToggleUI(getCurrentTheme());
themeToggles.forEach((btn) => {
  btn.addEventListener("click", () => {
    const next = getCurrentTheme() === "dark" ? "light" : "dark";
    applyTheme(next, true);
  });
});

// Follow OS preference changes when no saved preference exists.
window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", (e) => {
    try {
      if (!localStorage.getItem("theme")) {
        applyTheme(e.matches ? "dark" : "light", false);
      }
    } catch (e) {
      /* ignore */
    }
  });

// Apply year badge style to non-publication date elements.
document
  .querySelectorAll(
    ".edu-period, .teach-period, .honor-year, .service-year, .reviewer-year, .talk-year",
  )
  .forEach((el) => {
    el.classList.add("year-badge");
  });

// Ensure new-tab links in static HTML are safe.
document.querySelectorAll('a[target="_blank"]').forEach((link) => {
  if (!link.rel || !link.rel.includes("noopener")) {
    link.rel = "noopener noreferrer";
  }
  if (!link.hasAttribute("aria-label")) {
    const text = link.textContent.replace(/\s+/g, " ").trim();
    if (text) {
      link.setAttribute("aria-label", `${text} (opens in a new tab)`);
    }
  }
});

// Mark decorative SVG icons as hidden from assistive tech.
document.querySelectorAll("svg").forEach((svg) => {
  if (!svg.hasAttribute("aria-label") && !svg.querySelector("title")) {
    svg.setAttribute("aria-hidden", "true");
  }
  svg.setAttribute("focusable", "false");
});

// SVG icons for publication link types.
const pubIcons = {
  doi: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 13a5 5 0 0 1 0-7l2-2a5 5 0 0 1 7 7l-1.5 1.5"></path><path d="M14 11a5 5 0 0 1 0 7l-2 2a5 5 0 1 1-7-7L6.5 11.5"></path></svg>',
  web: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M3 12h18"></path><path d="M12 3a14 14 0 0 1 0 18"></path><path d="M12 3a14 14 0 0 0 0 18"></path></svg>',
  external:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 5h5v5"></path><path d="M10 14 19 5"></path><path d="M19 14v5h-5"></path><path d="M5 10V5h5"></path><path d="M5 19h5v-5"></path></svg>',
};

// Build a publication card DOM element from a data object.
const buildPubItem = (pub, index) => {
  const el = document.createElement("article");
  el.className = "pub-item";
  el.dataset.type = pub.type;
  const titleId = `publication-title-${index}`;

  const bold = (str) => str.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  const highlight = (str) =>
    str.replace(/\*\*(.*?)\*\*/g, '<span class="venue-name">$1</span>');

  const linksHtml = pub.links.length
    ? `<div class="pub-links">${pub.links
        .map(
          (l) =>
            // dilshadur.com pages open in place; everything else opens a new tab
            l.url.startsWith("https://dilshadur.com/")
              ? `<a href="${l.url.slice("https://dilshadur.com".length)}" class="pub-link">${l.label}</a>`
              : `<a href="${l.url}" target="_blank" rel="noopener noreferrer" class="pub-link">${l.label}</a>`,
        )
        .join("")}</div>`
    : "";

  const checkSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>`;
  const noteHtml = pub.note
    ? `<div class="pub-note">${checkSvg}${pub.note}</div>`
    : "";

  el.innerHTML = `
    <div class="pub-top">
      <div class="pub-title" id="${titleId}">${pub.title}</div>
      <span class="pub-badge ${pub.type}">${pub.badge}</span>
    </div>
    <div class="pub-authors">${bold(pub.authors)}</div>
    <div class="pub-venue">${highlight(pub.venue)}</div>
    ${noteHtml}
    ${linksHtml}
  `;
  el.setAttribute("aria-labelledby", titleId);

  // Wrap years in venue line with year-badge pill.
  const venueEl = el.querySelector(".pub-venue");
  venueEl.innerHTML = venueEl.innerHTML.replace(
    /\b(?:19|20)\d{2}(?:[–-](?:\d{2}|\d{4}))?\b/g,
    '<span class="pub-year year-badge">$&</span>',
  );

  // Add semantic icons to pub links.
  el.querySelectorAll(".pub-link").forEach((link) => {
    const label = link.textContent.trim().toLowerCase();
    let type = "external";
    if (label.startsWith("doi:")) type = "doi";
    if (label.includes("interactive website")) type = "web";
    link.classList.add(`pub-link-${type}`);
    link.insertAdjacentHTML(
      "afterbegin",
      `<span class="pub-link-icon">${pubIcons[type]}</span>`,
    );
  });

  return el;
};

// Fetch publication data and initialize the publications section.
fetch("data.json")
  .then((r) => r.json())
  .then(({ publications }) => {
    const pubList = document.querySelector(".pub-list");
    const filters = document.querySelectorAll(".pub-filter");
    const pubSummary = document.getElementById("pub-summary");
    const pubStatus = document.getElementById("pub-status");
    if (!pubList) return;

    pubList.setAttribute("aria-busy", "true");
    let currentFilter = "all";
    const currentSortOrder = "desc";

    // Build all pub item elements.
    const pubItems = publications.map(buildPubItem);

    // Update filter counts.
    const counts = {
      all: publications.length,
      journal: 0,
      conference: 0,
      poster: 0,
      review: 0,
    };
    publications.forEach((p) => {
      counts[p.type] = (counts[p.type] || 0) + 1;
    });
    document.getElementById("count-all").textContent = counts.all;
    document.getElementById("count-journal").textContent = counts.journal;
    document.getElementById("count-conference").textContent = counts.conference;
    document.getElementById("count-poster").textContent = counts.poster;
    document.getElementById("count-review").textContent = counts.review;

    // Assign year metadata for sorting.
    const extractYear = (el) => {
      const text = el.querySelector(".pub-venue")?.textContent || "";
      const matches = text.match(/\b(?:19|20)\d{2}\b/g);
      return matches ? Math.max(...matches.map(Number)) : 0;
    };
    pubItems.forEach((item, i) => {
      item.dataset.pubIndex = String(i);
      item.dataset.pubYear = String(extractYear(item));
    });

    const sortedByYear = (items) =>
      [...items].sort((a, b) => {
        const yA = Number(a.dataset.pubYear || 0),
          yB = Number(b.dataset.pubYear || 0);
        const direction = -1;
        if (yA !== yB) return (yA - yB) * direction;
        return Number(a.dataset.pubIndex) - Number(b.dataset.pubIndex);
      });

    const TYPE_ORDER = ["journal", "conference", "poster", "review"];
    const TYPE_LABELS = {
      journal: "Journals",
      conference: "Conferences & Workshops",
      poster: "Posters",
      review: "Under Review",
    };
    const FILTER_SUMMARY_LABELS = {
      all: "all publications",
      journal: "journal publications",
      conference: "conference and workshop publications",
      poster: "posters",
      review: "works in progress",
    };
    const TYPE_COLORS = {
      journal: "var(--tag-journal-color)",
      conference: "var(--tag-conf-color)",
      poster: "var(--tag-poster-color)",
      review: "var(--tag-review-color)",
    };

    const getVisibleItems = (filter) =>
      filter === "all"
        ? pubItems
        : pubItems.filter((i) => i.dataset.type === filter);

    const updatePublicationFeedback = (filter, count) => {
      const orderText =
        currentSortOrder === "desc" ? "newest first" : "oldest first";
      const summaryText =
        filter === "all"
          ? `Showing all ${count} publications grouped by type, ${orderText}`
          : `Showing ${count} ${FILTER_SUMMARY_LABELS[filter]}, ${orderText}`;

      if (pubSummary) {
        pubSummary.textContent =
          filter === "all"
            ? `Showing all publications · grouped by type · ${orderText}`
            : `Showing ${count} ${FILTER_SUMMARY_LABELS[filter]} · ${orderText}`;
      }
      if (pubStatus) {
        pubStatus.textContent = summaryText;
      }
    };

    const updateFilterButtons = (activeFilter) => {
      filters.forEach((btn) => {
        const isActive = btn.dataset.filter === activeFilter;
        btn.classList.toggle("active", isActive);
        btn.setAttribute("aria-pressed", isActive ? "true" : "false");
      });
    };

    const renderPublications = (filter) => {
      currentFilter = filter;
      pubList.innerHTML = "";
      if (filter === "all") {
        // Grouped by publication type.
        TYPE_ORDER.forEach((type) => {
          const items = sortedByYear(
            pubItems.filter((i) => i.dataset.type === type),
          );
          if (!items.length) return;
          const group = document.createElement("div");
          group.className = "pub-group";
          const label = document.createElement("h3");
          label.className = "pub-group-label";
          label.innerHTML = `<span class="pub-group-dot" style="background:${TYPE_COLORS[type]}"></span>${TYPE_LABELS[type]}`;
          group.appendChild(label);
          items.forEach((item) => group.appendChild(item));
          pubList.appendChild(group);
        });
      } else {
        // Flat filtered list.
        sortedByYear(getVisibleItems(filter)).forEach((item) =>
          pubList.appendChild(item),
        );
      }
      updateFilterButtons(filter);
      updatePublicationFeedback(filter, getVisibleItems(filter).length);
      pubList.setAttribute("aria-busy", "false");
    };

    renderPublications("all");

    // Filter tab click handlers — fade out, re-render, fade in.
    filters.forEach((btn) => {
      btn.addEventListener("click", () => {
        const newFilter = btn.dataset.filter;
        if (newFilter === currentFilter) return;
        pubList.classList.add("filtering");
        setTimeout(() => {
          renderPublications(newFilter);
          requestAnimationFrame(() => pubList.classList.remove("filtering"));
        }, 140);
      });
    });
  })
  .catch(() => {
    const pubList = document.querySelector(".pub-list");
    const pubSummary = document.getElementById("pub-summary");
    const pubStatus = document.getElementById("pub-status");
    if (pubList) {
      pubList.innerHTML =
        '<p class="pub-load-error">Publications could not be loaded right now.</p>';
      pubList.setAttribute("aria-busy", "false");
    }
    if (pubSummary) {
      pubSummary.textContent = "Publications are temporarily unavailable";
    }
    if (pubStatus) {
      pubStatus.textContent = "Publications could not be loaded.";
    }
  });

// Active nav highlight on scroll (sidebar + mobile nav).
const navItems = Array.from(document.querySelectorAll(".nav-item"));
const mobileNavItems = Array.from(
  document.querySelectorAll(".mobile-nav-links a"),
);
const navLinks = [...navItems, ...mobileNavItems];
const sections = Array.from(document.querySelectorAll("section[id]"));
const setActiveNav = (id) => {
  navItems.forEach((n) => {
    const isActive = n.getAttribute("href") === `#${id}`;
    n.classList.toggle("active", isActive);
    if (isActive) {
      n.setAttribute("aria-current", "location");
    } else {
      n.removeAttribute("aria-current");
    }
  });
  mobileNavItems.forEach((n) => {
    const isActive = n.getAttribute("href") === `#${id}`;
    n.classList.toggle("active", isActive);
    if (isActive) {
      n.setAttribute("aria-current", "location");
    } else {
      n.removeAttribute("aria-current");
    }
  });
};

const getValidSectionId = (id) =>
  sections.some((section) => section.id === id) ? id : null;
const getHashSectionId = () =>
  getValidSectionId(decodeURIComponent(window.location.hash.slice(1)));
const getScrollPaddingTop = () => {
  const value = parseFloat(
    getComputedStyle(document.documentElement).scrollPaddingTop,
  );
  return Number.isFinite(value) ? value : 0;
};
const getActivationLine = () => window.scrollY + getScrollPaddingTop() + 12;
const getSectionTop = (section) =>
  window.scrollY + section.getBoundingClientRect().top;

let pendingNavTargetId = null;
let pendingNavStartedAt = 0;
let navSyncFrame = null;

const clearPendingNavTarget = () => {
  pendingNavTargetId = null;
  pendingNavStartedAt = 0;
};

const holdPendingNavTarget = (id) => {
  if (!getValidSectionId(id)) return;
  pendingNavTargetId = id;
  pendingNavStartedAt = performance.now();
  setActiveNav(id);
};

const getActiveSectionId = () => {
  if (!sections.length) return null;

  const activationLine = getActivationLine();
  const sectionPositions = sections.map((section) => ({
    id: section.id,
    top: getSectionTop(section),
  }));
  let activeId = sectionPositions[0].id;

  sectionPositions.forEach((section, index) => {
    const nextSection = sectionPositions[index + 1];
    const ownershipEnd = nextSection
      ? section.top + (nextSection.top - section.top) / 2
      : Number.POSITIVE_INFINITY;

    if (activationLine >= section.top && activationLine < ownershipEnd) {
      activeId = section.id;
    }
  });

  const viewportBottom = window.scrollY + window.innerHeight;
  const pageBottom = document.documentElement.scrollHeight - 2;
  if (viewportBottom >= pageBottom) {
    activeId = sectionPositions[sectionPositions.length - 1].id;
  }

  return activeId;
};

const syncActiveNav = () => {
  navSyncFrame = null;

  const activationLine = getActivationLine();
  let activeId = getActiveSectionId();

  if (pendingNavTargetId) {
    const pendingSection = document.getElementById(pendingNavTargetId);
    const pendingAge = performance.now() - pendingNavStartedAt;
    const pendingReached =
      pendingSection && getSectionTop(pendingSection) <= activationLine + 4;

    if (!pendingSection || pendingReached || pendingAge > 1400) {
      clearPendingNavTarget();
      activeId = getActiveSectionId();
    } else {
      activeId = pendingNavTargetId;
    }
  }

  if (activeId) setActiveNav(activeId);
};

const requestNavSync = () => {
  if (navSyncFrame !== null) return;
  navSyncFrame = window.requestAnimationFrame(syncActiveNav);
};

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    const id = getValidSectionId(link.getAttribute("href")?.slice(1) || "");
    if (!id) return;
    holdPendingNavTarget(id);
    requestNavSync();
  });
});

const initialId = getHashSectionId() || sections[0]?.id;
if (initialId) {
  setActiveNav(initialId);
}
requestNavSync();

window.addEventListener("scroll", requestNavSync, { passive: true });
window.addEventListener("resize", requestNavSync);
window.addEventListener("orientationchange", requestNavSync);
window.addEventListener("hashchange", () => {
  const nextId = getHashSectionId();
  if (!nextId) return;
  holdPendingNavTarget(nextId);
  requestNavSync();
});

// Stagger selector for static list items (not pub-items, which are dynamic).
const STAGGER_SELECTOR =
  ".edu-item, .teach-item, .honor-item, .service-item, .talk-item, .reviewer-item";

// Progressive reveal animations.
const header = document.querySelector(".page-header");
if (prefersReducedMotion) {
  if (header) {
    header.style.opacity = "1";
    header.style.transform = "none";
  }
  document
    .querySelectorAll("section")
    .forEach((s) => s.classList.add("visible"));
  // Immediately reveal all static items (no animation needed).
  document
    .querySelectorAll(STAGGER_SELECTOR)
    .forEach((el) => el.classList.add("item-visible"));
} else {
  const revealObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("visible");

        // Stagger static list items within this section.
        const items = entry.target.querySelectorAll(STAGGER_SELECTOR);
        items.forEach((item, i) => {
          const delay = 0.06 + Math.min(i, 7) * 0.042;
          item.style.transitionDelay = `${delay}s`;
          item.classList.add("item-visible");
        });

        // Clean up inline delays once animations have finished.
        if (items.length > 0) {
          const clearAt = (0.06 + Math.min(items.length - 1, 7) * 0.042 + 0.5) * 1000;
          setTimeout(() => {
            items.forEach((item) => {
              item.style.transitionDelay = "";
            });
          }, clearAt);
        }

        revealObs.unobserve(entry.target);
      });
    },
    { threshold: 0.05 },
  );

  document.querySelectorAll("section").forEach((s, i) => {
    s.style.transitionDelay = `${i * 0.04}s`;
    revealObs.observe(s);
  });

  if (header) {
    header.style.opacity = "0";
    header.style.transform = "translateY(12px)";
    header.style.transition = "opacity 0.5s ease, transform 0.5s ease";
    requestAnimationFrame(() =>
      setTimeout(() => {
        header.style.opacity = "1";
        header.style.transform = "none";
      }, 60),
    );
  }
}

// Immediate nav click feedback.
navItems.forEach((item) => {
  item.addEventListener("click", () => {
    const target = item.getAttribute("href");
    if (target && target.startsWith("#")) {
      setActiveNav(target.slice(1));
    }
  });
});

mobileNavItems.forEach((item) => {
  item.addEventListener("click", () => {
    const target = item.getAttribute("href");
    if (target && target.startsWith("#")) {
      setActiveNav(target.slice(1));
    }
  });
});
