(() => {
  const toggle = document.querySelector('#themeToggle');
  const search = document.querySelector('#searchInput');
  const buttons = [...document.querySelectorAll('.filter-button')];
  const rows = [...document.querySelectorAll('.article-row')];
  const emptyState = document.querySelector('#emptyState');
  let activeCategory = 'all';

  const applyTheme = (dark) => {
    document.body.classList.toggle('dark', dark);
    if (toggle) toggle.textContent = dark ? '◑' : '◐';
  };
  applyTheme(localStorage.getItem('blog-theme') === 'dark');
  toggle?.addEventListener('click', () => {
    const dark = !document.body.classList.contains('dark');
    applyTheme(dark);
    localStorage.setItem('blog-theme', dark ? 'dark' : 'light');
  });

  const filterRows = () => {
    const query = (search?.value || '').trim().toLowerCase();
    let visible = 0;
    rows.forEach((row) => {
      const matchesCategory = activeCategory === 'all' || row.dataset.category === activeCategory;
      const matchesQuery = !query || row.dataset.title.toLowerCase().includes(query);
      row.hidden = !(matchesCategory && matchesQuery);
      if (!row.hidden) visible += 1;
    });
    if (emptyState) emptyState.hidden = visible > 0;
  };
  search?.addEventListener('input', filterRows);
  buttons.forEach((button) => button.addEventListener('click', () => {
    activeCategory = button.dataset.filter || 'all';
    buttons.forEach((item) => item.classList.toggle('active', item === button));
    filterRows();
  }));

  const quoteCard = document.querySelector('.quote-card');
  const quoteSlides = [...document.querySelectorAll('.quote-slide')];
  const quoteControls = [...document.querySelectorAll('.quote-control')];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let quoteIndex = 0;
  let quoteTimer = null;

  const showQuote = (nextIndex) => {
    if (!quoteSlides.length) return;
    quoteIndex = (nextIndex + quoteSlides.length) % quoteSlides.length;
    quoteSlides.forEach((slide, index) => {
      const active = index === quoteIndex;
      slide.classList.toggle('is-active', active);
      slide.setAttribute('aria-hidden', String(!active));
      slide.inert = !active;
    });
    quoteControls.forEach((control, index) => {
      const active = index === quoteIndex;
      control.classList.toggle('is-active', active);
      control.setAttribute('aria-selected', String(active));
      control.tabIndex = active ? 0 : -1;
    });
  };

  const stopQuoteRotation = () => {
    window.clearInterval(quoteTimer);
    quoteTimer = null;
  };

  const startQuoteRotation = () => {
    stopQuoteRotation();
    if (quoteSlides.length < 2 || reducedMotion.matches || document.hidden) return;
    quoteTimer = window.setInterval(() => showQuote(quoteIndex + 1), 7000);
  };

  quoteControls.forEach((control, index) => {
    control.addEventListener('click', () => {
      showQuote(index);
      startQuoteRotation();
    });
  });
  quoteCard?.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    showQuote(quoteIndex + (event.key === 'ArrowRight' ? 1 : -1));
    startQuoteRotation();
  });
  quoteCard?.addEventListener('mouseenter', stopQuoteRotation);
  quoteCard?.addEventListener('mouseleave', startQuoteRotation);
  quoteCard?.addEventListener('focusin', stopQuoteRotation);
  quoteCard?.addEventListener('focusout', (event) => {
    if (!quoteCard.contains(event.relatedTarget)) startQuoteRotation();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopQuoteRotation();
    else startQuoteRotation();
  });
  startQuoteRotation();
})();
