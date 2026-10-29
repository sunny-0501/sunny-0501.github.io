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

  const searchTrigger = document.querySelector('#searchTrigger');
  const searchDialog = document.querySelector('#siteSearchDialog');
  const searchInput = document.querySelector('#siteSearchInput');
  const searchStatus = document.querySelector('#siteSearchStatus');
  const searchResults = document.querySelector('#siteSearchResults');
  let searchIndexPromise = null;

  const loadSearchIndex = () => {
    if (!searchDialog) return Promise.resolve([]);
    if (!searchIndexPromise) {
      const searchUrl = searchDialog.dataset.searchUrl;
      searchIndexPromise = fetch(searchUrl, { cache: 'force-cache' })
        .then((response) => {
          if (!response.ok) throw new Error('Search index unavailable');
          return response.text();
        })
        .then((xml) => {
          const documentXml = new DOMParser().parseFromString(xml, 'application/xml');
          return [...documentXml.querySelectorAll('entry')].map((entry) => {
            const rawContent = entry.querySelector('content')?.textContent || '';
            const contentDocument = new DOMParser().parseFromString(rawContent, 'text/html');
            return {
              title: entry.querySelector('title')?.textContent || '未命名文章',
              url: entry.querySelector('url')?.textContent || '/',
              content: contentDocument.body.textContent.replace(/\s+/g, ' ').trim(),
            };
          });
        });
    }
    return searchIndexPromise;
  };

  const renderSearchResults = (entries, rawQuery) => {
    if (!searchResults || !searchStatus) return;
    const query = rawQuery.trim().toLowerCase();
    searchResults.replaceChildren();

    if (!query) {
      searchStatus.textContent = '输入关键词，搜索全部文章。';
      return;
    }

    const matches = entries
      .map((entry) => {
        const title = entry.title.toLowerCase();
        const content = entry.content.toLowerCase();
        const titleMatch = title.includes(query);
        const contentMatch = content.includes(query);
        return { ...entry, titleMatch, score: titleMatch ? 2 : contentMatch ? 1 : 0 };
      })
      .filter((entry) => entry.score > 0)
      .sort((first, second) => second.score - first.score)
      .slice(0, 8);

    searchStatus.textContent = matches.length
      ? `找到 ${matches.length} 篇相关文章`
      : `没有找到与“${rawQuery.trim()}”相关的文章`;

    matches.forEach((entry) => {
      const result = document.createElement('a');
      result.className = 'search-result';
      result.href = entry.url;

      const title = document.createElement('strong');
      title.textContent = entry.title;
      const summary = document.createElement('span');
      const lowerContent = entry.content.toLowerCase();
      const matchIndex = lowerContent.indexOf(query);
      const start = Math.max(0, matchIndex - 46);
      summary.textContent = `${start > 0 ? '…' : ''}${entry.content.slice(start, start + 126)}${entry.content.length > start + 126 ? '…' : ''}`;
      const arrow = document.createElement('i');
      arrow.setAttribute('aria-hidden', 'true');
      arrow.textContent = '↗';

      result.append(title, summary, arrow);
      searchResults.append(result);
    });
  };

  const openSearch = () => {
    if (!searchDialog) return;
    if (!searchDialog.open) searchDialog.showModal();
    document.body.classList.add('search-open');
    requestAnimationFrame(() => searchInput?.focus());
    loadSearchIndex()
      .then((entries) => renderSearchResults(entries, searchInput?.value || ''))
      .catch(() => {
        if (searchStatus) searchStatus.textContent = '搜索索引暂时不可用，请稍后重试。';
      });
  };

  const closeSearch = () => {
    if (searchDialog?.open) searchDialog.close();
    document.body.classList.remove('search-open');
  };

  searchTrigger?.addEventListener('click', openSearch);
  document.querySelector('[data-search-close]')?.addEventListener('click', closeSearch);
  searchDialog?.addEventListener('close', () => document.body.classList.remove('search-open'));
  searchDialog?.addEventListener('click', (event) => {
    if (event.target === searchDialog) closeSearch();
  });
  searchInput?.addEventListener('input', () => {
    loadSearchIndex()
      .then((entries) => renderSearchResults(entries, searchInput.value))
      .catch(() => {
        if (searchStatus) searchStatus.textContent = '搜索索引暂时不可用，请稍后重试。';
      });
  });
  document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      openSearch();
    }
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

  const backToTop = document.querySelector('#backToTop');
  const readingProgress = document.querySelector('#readingProgressBar');
  const articleContent = document.querySelector('.article-content');
  let scrollTicking = false;

  const updateScrollInterface = () => {
    const scrollTop = window.scrollY;
    if (backToTop) backToTop.classList.toggle('is-visible', scrollTop > 520);
    if (readingProgress && articleContent) {
      const start = articleContent.offsetTop;
      const distance = articleContent.offsetHeight - window.innerHeight * .35;
      const progress = Math.min(1, Math.max(0, (scrollTop - start + window.innerHeight * .35) / Math.max(distance, 1)));
      readingProgress.style.transform = `scaleX(${progress})`;
    }
    scrollTicking = false;
  };

  const requestScrollUpdate = () => {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(updateScrollInterface);
  };

  window.addEventListener('scroll', requestScrollUpdate, { passive: true });
  window.addEventListener('resize', requestScrollUpdate);
  updateScrollInterface();
  backToTop?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
  });

  const tocLinks = [...document.querySelectorAll('.article-toc a')];
  const tocHeadings = tocLinks
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);
  if (tocHeadings.length && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        tocLinks.forEach((link) => {
          link.classList.toggle('is-active', link.getAttribute('href') === `#${entry.target.id}`);
        });
      });
    }, { rootMargin: '-18% 0px -68% 0px' });
    tocHeadings.forEach((heading) => observer.observe(heading));
  }
})();
