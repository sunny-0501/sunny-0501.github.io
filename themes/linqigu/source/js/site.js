(() => {
  const toggle = document.querySelector('#themeToggle');
  const search = document.querySelector('#searchInput');
  const buttons = [...document.querySelectorAll('.filter-button')];
  const rows = [...document.querySelectorAll('.article-row')];
  const emptyState = document.querySelector('#emptyState');
  const themeMedia = window.matchMedia('(prefers-color-scheme: dark)');
  const appearanceToggle = document.querySelector('#appearanceToggle');
  const appearancePanel = document.querySelector('#appearancePanel');
  const themeHue = document.querySelector('#themeHue');
  const themeHueValue = document.querySelector('#themeHueValue');
  const layoutOptions = [...document.querySelectorAll('[data-layout-mode]')];
  const wallpaperTitleToggle = document.querySelector('#wallpaperTitleToggle');
  const wallpaperCarouselToggle = document.querySelector('#wallpaperCarouselToggle');
  const wallpaperGradientToggle = document.querySelector('#wallpaperGradientToggle');
  const sakuraToggle = document.querySelector('#sakuraToggle');
  const sakuraLayer = document.querySelector('#sakuraLayer');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const wallpaperImages = [
    '/images/header-landscape.png',
    '/images/forest-rest.png',
    '/images/archive-howls-castle.png',
  ];
  let wallpaperIndex = 0;
  let wallpaperTimer = null;
  let activeCategory = 'all';

  const applyTheme = (mode) => {
    const dark = mode === 'system' ? themeMedia.matches : mode === 'dark';
    document.body.classList.toggle('dark', dark);
    if (toggle) toggle.textContent = dark ? '◑' : '◐';
  };
  let themeMode = localStorage.getItem('blog-theme-mode') || (localStorage.getItem('blog-theme') === 'dark' ? 'dark' : 'light');
  applyTheme(themeMode);
  toggle?.addEventListener('click', () => {
    const dark = !document.body.classList.contains('dark');
    themeMode = dark ? 'dark' : 'light';
    applyTheme(themeMode);
    localStorage.setItem('blog-theme-mode', themeMode);
  });
  themeMedia.addEventListener('change', () => {
    if (themeMode === 'system') applyTheme('system');
  });

  const applyThemeHue = (value) => {
    const hue = Number(value) || 0;
    document.body.style.setProperty('--peach', `hsl(${hue} 57% 63%)`);
    document.body.style.setProperty('--butter', `hsl(${hue} 62% 76%)`);
    document.body.style.setProperty('--mint', `hsl(${hue} 36% 76%)`);
    document.body.style.setProperty('--lilac', `hsl(${(hue + 42) % 360} 34% 78%)`);
    if (themeHue) themeHue.value = String(hue);
    if (themeHueValue) themeHueValue.value = String(hue);
  };
  applyThemeHue(localStorage.getItem('blog-hue') || '165');
  themeHue?.addEventListener('input', () => {
    applyThemeHue(themeHue.value);
    localStorage.setItem('blog-hue', themeHue.value);
  });

  const isHomePage = document.body.classList.contains('home-page');
  const readToggle = (key, fallback) => {
    const stored = localStorage.getItem(key);
    return stored === null ? fallback : stored === 'true';
  };
  const setWallpaper = (nextIndex, animate = true) => {
    if (!isHomePage) return;
    wallpaperIndex = (nextIndex + wallpaperImages.length) % wallpaperImages.length;
    const applyImage = () => {
      document.documentElement.style.setProperty('--wallpaper-image', `url("${wallpaperImages[wallpaperIndex]}")`);
    };
    const canFade = animate && wallpaperGradientToggle?.checked && !reducedMotion.matches;
    if (!canFade) {
      applyImage();
      return;
    }
    document.body.classList.add('is-wallpaper-fading');
    window.setTimeout(() => {
      applyImage();
      requestAnimationFrame(() => document.body.classList.remove('is-wallpaper-fading'));
    }, 260);
  };
  const stopWallpaperRotation = () => {
    window.clearInterval(wallpaperTimer);
    wallpaperTimer = null;
  };
  const startWallpaperRotation = () => {
    stopWallpaperRotation();
    if (!isHomePage || !wallpaperCarouselToggle?.checked || reducedMotion.matches || document.hidden) return;
    wallpaperTimer = window.setInterval(() => setWallpaper(wallpaperIndex + 1), 9000);
  };
  const applyWallpaperSettings = () => {
    if (!isHomePage) return;
    document.body.classList.toggle('hide-wallpaper-title', !wallpaperTitleToggle?.checked);
    document.body.classList.toggle('wallpaper-no-gradient', !wallpaperGradientToggle?.checked);
    setWallpaper(wallpaperIndex, false);
    startWallpaperRotation();
  };

  const createSakura = () => {
    if (!sakuraLayer || sakuraLayer.childElementCount) return;
    const petalCount = window.innerWidth < 720 ? 9 : 16;
    for (let index = 0; index < petalCount; index += 1) {
      const petal = document.createElement('span');
      petal.className = 'sakura-petal';
      petal.style.setProperty('--petal-left', `${Math.random() * 100}%`);
      petal.style.setProperty('--petal-size', `${7 + Math.random() * 6}px`);
      petal.style.setProperty('--petal-drift', `${-80 + Math.random() * 160}px`);
      petal.style.setProperty('--petal-duration', `${7 + Math.random() * 7}s`);
      petal.style.setProperty('--petal-delay', `${-Math.random() * 12}s`);
      sakuraLayer.append(petal);
    }
  };
  const applySakura = (enabled) => {
    if (!sakuraLayer) return;
    createSakura();
    document.body.classList.toggle('sakura-on', enabled && !reducedMotion.matches);
  };
  const applyLayout = (mode) => {
    const grid = mode === 'grid';
    document.body.classList.toggle('layout-grid', grid);
    layoutOptions.forEach((option) => option.setAttribute('aria-pressed', String(option.dataset.layoutMode === mode)));
    localStorage.setItem('blog-layout', grid ? 'grid' : 'list');
  };

  if (wallpaperTitleToggle) wallpaperTitleToggle.checked = readToggle('blog-wallpaper-title', true);
  if (wallpaperCarouselToggle) wallpaperCarouselToggle.checked = readToggle('blog-wallpaper-carousel', true);
  if (wallpaperGradientToggle) wallpaperGradientToggle.checked = readToggle('blog-wallpaper-gradient', true);
  if (sakuraToggle) sakuraToggle.checked = readToggle('blog-sakura', true);
  applyLayout(localStorage.getItem('blog-layout') || 'list');
  applyWallpaperSettings();
  applySakura(sakuraToggle?.checked);

  wallpaperTitleToggle?.addEventListener('change', () => {
    localStorage.setItem('blog-wallpaper-title', String(wallpaperTitleToggle.checked));
    applyWallpaperSettings();
  });
  wallpaperCarouselToggle?.addEventListener('change', () => {
    localStorage.setItem('blog-wallpaper-carousel', String(wallpaperCarouselToggle.checked));
    startWallpaperRotation();
  });
  wallpaperGradientToggle?.addEventListener('change', () => {
    localStorage.setItem('blog-wallpaper-gradient', String(wallpaperGradientToggle.checked));
    applyWallpaperSettings();
  });
  sakuraToggle?.addEventListener('change', () => {
    localStorage.setItem('blog-sakura', String(sakuraToggle.checked));
    applySakura(sakuraToggle.checked);
  });
  layoutOptions.forEach((option) => option.addEventListener('click', () => applyLayout(option.dataset.layoutMode)));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopWallpaperRotation();
    else startWallpaperRotation();
  });

  const setAppearanceOpen = (open) => {
    if (!appearancePanel || !appearanceToggle) return;
    appearancePanel.hidden = !open;
    appearanceToggle.setAttribute('aria-expanded', String(open));
  };
  appearanceToggle?.addEventListener('click', (event) => {
    event.stopPropagation();
    setAppearanceOpen(appearancePanel?.hidden !== false);
  });
  document.addEventListener('click', (event) => {
    if (!appearancePanel || appearancePanel.hidden) return;
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (!appearancePanel.contains(target) && !appearanceToggle?.contains(target)) setAppearanceOpen(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setAppearanceOpen(false);
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

  const lightboxDialog = document.querySelector('#lightboxDialog');
  const lightboxImage = document.querySelector('#lightboxImage');
  const lightboxCaption = document.querySelector('#lightboxCaption');
  const closeLightbox = () => {
    if (lightboxDialog?.open) lightboxDialog.close();
    document.body.classList.remove('lightbox-open');
  };
  const openLightbox = (source, caption, alt) => {
    if (!lightboxDialog || !lightboxImage) return;
    lightboxImage.src = source;
    lightboxImage.alt = alt || caption || '';
    if (lightboxCaption) lightboxCaption.textContent = caption || alt || '';
    lightboxDialog.showModal();
    document.body.classList.add('lightbox-open');
  };
  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const galleryItem = target.closest('.gallery-item');
    if (galleryItem) {
      openLightbox(
        galleryItem.dataset.lightboxSrc,
        galleryItem.dataset.lightboxCaption,
        galleryItem.querySelector('img')?.alt,
      );
      return;
    }
    const articleImage = target.closest('.article-content img');
    if (articleImage) {
      event.preventDefault();
      openLightbox(articleImage.src, articleImage.alt);
    }
  });
  document.querySelector('[data-lightbox-close]')?.addEventListener('click', closeLightbox);
  lightboxDialog?.addEventListener('close', () => document.body.classList.remove('lightbox-open'));
  lightboxDialog?.addEventListener('click', (event) => {
    if (event.target === lightboxDialog) closeLightbox();
  });

  const guestbookForm = document.querySelector('#guestbookForm');
  guestbookForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = document.querySelector('#guestbookName')?.value.trim() || '一位访客';
    const message = document.querySelector('#guestbookMessage')?.value.trim();
    if (!message) return;
    const title = `留言：来自 ${name}`;
    const body = `**称呼**：${name}\n\n${message}`;
    const issueUrl = `https://github.com/sunny-0501/sunny-0501.github.io/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
    window.open(issueUrl, '_blank', 'noopener,noreferrer');
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
  const siteHeader = document.querySelector('.site-header');
  const routeProgress = document.querySelector('#routeProgress');
  let previousScrollTop = window.scrollY;
  let scrollTicking = false;

  const updateScrollInterface = () => {
    const scrollTop = window.scrollY;
    if (backToTop) backToTop.classList.toggle('is-visible', scrollTop > 520);
    if (siteHeader) {
      const scrollingUp = scrollTop < previousScrollTop - 3;
      const scrollingDown = scrollTop > previousScrollTop + 4;
      if (scrollTop < 32 || scrollingUp || document.body.classList.contains('search-open')) {
        siteHeader.classList.remove('navbar-hidden');
      } else if (scrollingDown && scrollTop > 150) {
        siteHeader.classList.add('navbar-hidden');
      }
      siteHeader.classList.toggle('navbar-sticky-shadow', scrollTop > 14);
    }
    if (readingProgress && articleContent) {
      const start = articleContent.offsetTop;
      const distance = articleContent.offsetHeight - window.innerHeight * .35;
      const progress = Math.min(1, Math.max(0, (scrollTop - start + window.innerHeight * .35) / Math.max(distance, 1)));
      readingProgress.style.transform = `scaleX(${progress})`;
    }
    previousScrollTop = scrollTop;
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

  let pageLeaving = false;
  const prefetchedPages = new Set();
  const isInternalNavigation = (link) => {
    if (!link || link.target === '_blank' || link.hasAttribute('download')) return null;
    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin) return null;
    if (url.pathname === window.location.pathname) return null;
    return url;
  };

  document.addEventListener('pointerover', (event) => {
    const link = event.target.closest?.('a[href]');
    const url = isInternalNavigation(link);
    if (!url || prefetchedPages.has(url.pathname)) return;
    prefetchedPages.add(url.pathname);
    const prefetch = document.createElement('link');
    prefetch.rel = 'prefetch';
    prefetch.href = url.href;
    prefetch.as = 'document';
    document.head.append(prefetch);
  });

  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest?.('a[href]');
    const url = isInternalNavigation(link);
    if (!url || pageLeaving) return;
    if (reducedMotion.matches) return;
    event.preventDefault();
    pageLeaving = true;
    document.documentElement.classList.add('is-page-leaving');
    routeProgress?.classList.add('is-loading');
    window.setTimeout(() => window.location.assign(url.href), 155);
  });

  window.addEventListener('pageshow', () => {
    pageLeaving = false;
    document.documentElement.classList.remove('is-page-leaving');
    routeProgress?.classList.remove('is-loading');
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
