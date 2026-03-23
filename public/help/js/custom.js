(() => {
  const nav = document.querySelector('nav.sidebar');
  if (!nav) return;

  const links = Array.from(nav.querySelectorAll('a[href^="#"]'));
  if (!links.length) return;

  const safeDecode = (s) => {
    try {
      return decodeURIComponent(s);
    } catch {
      return s;
    }
  };

  const linkById = new Map();
  for (const a of links) {
    const href = a.getAttribute('href') || '';
    if (!href.startsWith('#')) continue;
    const id = safeDecode(href.slice(1));
    if (id) linkById.set(id, a);
  }
  if (!linkById.size) return;

  const setActive = (id) => {
    for (const a of links) {
      const isActive = safeDecode((a.getAttribute('href') || '').slice(1)) === id;
      a.classList.toggle('active', isActive);
      if (isActive) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    }
  };

  const getOffset = () => {
    const page = document.body?.dataset?.helpPage;
    if (page === 'lclf') return 18;
    const header = document.querySelector('.header');
    const h = header?.getBoundingClientRect?.().height;
    return (h || 92) + 18;
  };

  const sectionEls = () =>
    Array.from(linkById.keys())
      .map((id) => document.getElementById(id))
      .filter(Boolean);

  const updateFromHash = () => {
    const id = safeDecode((location.hash || '').slice(1));
    if (id && linkById.has(id)) {
      setActive(id);
      return;
    }
    updateFromScroll();
  };

  let ticking = false;
  const updateFromScroll = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      ticking = false;
      const y = window.scrollY + getOffset();
      let current = '';
      for (const el of sectionEls()) {
        const top = el.getBoundingClientRect().top + window.scrollY;
        if (top <= y) current = el.id;
      }
      if (current) setActive(current);
    });
  };

  window.addEventListener('hashchange', updateFromHash, { passive: true });
  window.addEventListener('scroll', updateFromScroll, { passive: true });
  window.addEventListener('resize', updateFromScroll, { passive: true });

  updateFromHash();
  updateFromScroll();
})();

/* Collapsible help sidebar (localStorage preference) */
(() => {
  const STORAGE_KEY = 'gbl-help-sidebar-collapsed';
  const body = document.body;
  const btn = document.getElementById('help-sidebar-toggle');
  const panel = document.getElementById('help-sidebar-nav');
  if (!btn || !panel) return;

  const setCollapsed = (collapsed) => {
    body.classList.toggle('help-sidebar-collapsed', collapsed);
    btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    btn.title = collapsed ? 'Expand navigation' : 'Collapse navigation';
    const label = btn.querySelector('.visually-hidden');
    if (label) label.textContent = collapsed ? 'Expand navigation' : 'Collapse navigation';
  };

  try {
    if (localStorage.getItem(STORAGE_KEY) === '1') setCollapsed(true);
  } catch (_) {
    /* ignore */
  }

  btn.addEventListener('click', () => {
    const next = !body.classList.contains('help-sidebar-collapsed');
    setCollapsed(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
    } catch (_) {
      /* ignore */
    }
  });
})();
