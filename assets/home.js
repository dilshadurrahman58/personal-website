/* dilshadur.com · homepage interactions */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const root = document.documentElement;
  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Theme ─────────────────────────────────────────────────────
  $('#theme-toggle').addEventListener('click', (e) => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    const apply = () => {
      root.dataset.theme = next;
      $('#theme-color-meta').setAttribute('content', next === 'dark' ? '#0E1013' : '#F5F4F0');
    };
    try {
      localStorage.setItem('theme', next);
    } catch (err) {}
    if (!document.startViewTransition || reduceMotion()) return apply();
    // the new theme spreads outward from the toggle
    const r = e.currentTarget.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    root.classList.add('theme-vt');
    const vt = document.startViewTransition(apply);
    vt.ready.then(() => {
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 650, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)', pseudoElement: '::view-transition-new(root)' },
      );
    }, () => {});
    vt.finished.finally(() => root.classList.remove('theme-vt'));
  });

  // ── Top bar: hairline once scrolled, steps aside on phones ────
  const bar = $('#bar');
  const compact = window.matchMedia('(max-width: 880px)');
  let lastY = scrollY;
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const y = scrollY;
    bar.classList.toggle('is-scrolled', y > 8);
    const delta = y - lastY;
    if (!compact.matches || y < 120 || root.classList.contains('menu-open') || bar.contains(document.activeElement)) {
      bar.classList.remove('is-away');
    } else if (delta > 8) {
      bar.classList.add('is-away');
    } else if (delta < -8) {
      bar.classList.remove('is-away');
    }
    if (Math.abs(delta) > 8) lastY = y;
  };
  addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScroll);
    }
  }, { passive: true });
  onScroll();

  // ── Menu on small screens ─────────────────────────────────────
  const menuBtn = $('#menu-btn');
  const setMenu = (open) => {
    root.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Menu');
  };
  menuBtn.addEventListener('click', () => setMenu(!root.classList.contains('menu-open')));
  $$('#bar-links a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && root.classList.contains('menu-open')) {
      setMenu(false);
      menuBtn.focus();
    }
  });
  document.addEventListener('click', (e) => {
    if (root.classList.contains('menu-open') && !bar.contains(e.target)) setMenu(false);
  });
  compact.addEventListener?.('change', () => setMenu(false));

  // ── Current section in the bar ────────────────────────────────
  const navLinks = $$('#bar-links a');
  const sections = navLinks.map((a) => $(a.getAttribute('href'))).filter(Boolean);
  const markCurrent = () => {
    const line = innerHeight * 0.32;
    let current = null;
    for (const s of sections) if (s.getBoundingClientRect().top <= line) current = s;
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) current = sections[sections.length - 1];
    navLinks.forEach((a) => {
      if (current && a.getAttribute('href') === `#${current.id}`) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  };
  let navTick = false;
  addEventListener('scroll', () => {
    if (!navTick) {
      navTick = true;
      requestAnimationFrame(() => {
        navTick = false;
        markCurrent();
      });
    }
  }, { passive: true });
  markCurrent();

  // ── IEEE VIS 2026: countdown, then retire the invitation ──────
  const VIS_START = new Date('2026-11-09T00:00:00-05:00');
  const VIS_END = new Date('2026-11-14T00:00:00-05:00');
  const now = new Date();
  const visOver = now >= VIS_END;
  const soon = $('#vis-soon');
  if (visOver) {
    $('#invite')?.remove();
  } else if (soon) {
    const days = Math.ceil((VIS_START - now) / 86400000);
    soon.textContent = now >= VIS_START ? 'This week' : days <= 1 ? 'Tomorrow' : `In ${days} days`;
    soon.hidden = false;
  }

  // the VIS logo travels between this page and the VIS page
  const visibleLogo = () => $$('.invite__logo').find((el) => el.offsetParent !== null);
  const onScreen = (el) => {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.bottom > 0 && r.top < innerHeight;
  };
  const nameLogo = (e) => {
    if (!e.viewTransition) return;
    e.viewTransition.ready.catch(() => {}); // a skipped transition is not an error
    const logo = visibleLogo();
    if (onScreen(logo)) logo.style.viewTransitionName = 'vis-logo';
    const clear = () => $$('.invite__logo').forEach((el) => (el.style.viewTransitionName = ''));
    e.viewTransition.finished.then(clear, clear);
  };
  addEventListener('pageswap', nameLogo);
  addEventListener('pagereveal', nameLogo);

  // ── News: a few at first, the rest on request ─────────────────
  const NEWS_SHOWN = 6;
  const newsItems = $$('#news-list li');
  const newsMore = $('#news-more');
  if (newsItems.length > NEWS_SHOWN) {
    const label = newsMore.querySelector('span');
    const setNews = (open) => {
      newsItems.forEach((li, i) => {
        if (i < NEWS_SHOWN) return;
        li.hidden = !open;
        li.classList.toggle('is-new', open);
        li.style.animationDelay = open ? `${Math.min(i - NEWS_SHOWN, 10) * 30}ms` : '';
      });
      newsMore.setAttribute('aria-expanded', String(open));
      label.textContent = open ? 'Show fewer' : `Show all ${newsItems.length} updates`;
    };
    newsMore.hidden = false;
    newsMore.addEventListener('click', () => {
      const open = newsMore.getAttribute('aria-expanded') !== 'true';
      setNews(open);
      if (!open) $('#news-h').scrollIntoView({ block: 'start', behavior: reduceMotion() ? 'auto' : 'smooth' });
    });
    setNews(false);
  }

  // ── Publications ──────────────────────────────────────────────
  const groups = $$('.pub-group');
  const source = $$('.pub-group:not([data-type="vis"]):not([data-type="selected"]) .pub');

  const selected = source
    .filter((p) => p.dataset.selected !== undefined)
    .sort((a, b) => a.dataset.selected - b.dataset.selected);
  const selList = $('.selected-list');
  selected.forEach((p) => selList.append(p.cloneNode(true)));

  // papers presented at IEEE VIS 2026, in talk order
  const VIS_ORDER = ['guidelines', 'mllm-claims', 'wastewater', 'annotation-survey', 'annotation-design'];
  const visList = $('.vis-list');
  if (visOver) {
    $('.pub-group[data-type="vis"]')?.remove();
    $('.filter[data-filter="vis"]')?.remove();
    $$('.pub__vis').forEach((a) => a.remove());
  } else {
    VIS_ORDER.forEach((key) => {
      const p = source.find((el) => el.dataset.vis === key);
      if (p) visList.append(p.cloneNode(true));
    });
  }

  const counts = {
    all: source.length,
    selected: selected.length,
    journal: $$('.pub-group[data-type="journal"] .pub').length,
    conference: $$('.pub-group[data-type="conference"] .pub').length,
    poster: $$('.pub-group[data-type="poster"] .pub').length,
    vis: visList ? visList.children.length : 0,
  };
  $$('[data-count]').forEach((el) => (el.textContent = counts[el.dataset.count] ?? ''));

  const filters = $$('.filter');
  const status = $('#filter-status');
  const MAIN = ['journal', 'conference', 'poster'];
  const applyFilter = (type, animate = true) => {
    filters.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filter === type)));
    $$('.pub-group').forEach((g) => {
      const show = type === 'all' ? MAIN.includes(g.dataset.type) : g.dataset.type === type;
      g.classList.toggle('is-hidden', !show);
      g.classList.remove('is-entering');
      if (show && animate && !reduceMotion()) {
        $$('.row', g).forEach((r, i) => r.style.setProperty('--i', Math.min(i, 8)));
        void g.offsetWidth;
        g.classList.add('is-entering');
      }
    });
    const n = counts[type];
    const name = $(`.filter[data-filter="${type}"]`);
    status.textContent = `Showing ${n} ${n === 1 ? 'publication' : 'publications'}: ${name.getAttribute('aria-label') || name.firstChild.textContent.trim()}`;
  };
  filters.forEach((b) =>
    b.addEventListener('click', () => {
      applyFilter(b.dataset.filter);
      // keep the list in view when a short filter result moves things
      const top = $('.filters').getBoundingClientRect().top;
      if (top < 0) $('.filters').scrollIntoView({ block: 'start', behavior: reduceMotion() ? 'auto' : 'smooth' });
    }),
  );
  applyFilter('all', false);

  // ── Copy email ────────────────────────────────────────────────
  const copyBtn = $('#copy-email');
  copyBtn?.addEventListener('click', async () => {
    const text = $('#email-addr').textContent.trim();
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.append(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    copyBtn.classList.add('is-done');
    copyBtn.querySelector('span').textContent = 'Copied';
    copyBtn.setAttribute('aria-label', 'Email address copied');
    clearTimeout(copyBtn._t);
    copyBtn._t = setTimeout(() => {
      copyBtn.classList.remove('is-done');
      copyBtn.querySelector('span').textContent = 'Copy';
      copyBtn.setAttribute('aria-label', 'Copy email address');
    }, 2200);
  });

  // ── Sections fade up once as they enter the view ─────────────
  const inView = $$('.in-view');
  if (!('IntersectionObserver' in window) || reduceMotion()) {
    inView.forEach((el) => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          en.target.classList.add('is-in');
          io.unobserve(en.target);
        }),
      { rootMargin: '0px 0px -6% 0px' },
    );
    inView.forEach((el) => io.observe(el));
  }
})();
