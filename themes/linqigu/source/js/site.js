(() => {
  const toggle = document.querySelector('#themeToggle');
  const rows = [...document.querySelectorAll('.article-row')];
  const emptyState = document.querySelector('#emptyState');
  const themeMedia = window.matchMedia('(prefers-color-scheme: dark)');
  const appearanceToggle = document.querySelector('#appearanceToggle');
  const appearancePanel = document.querySelector('#appearancePanel');
  const themeHue = document.querySelector('#themeHue');
  const themeHueValue = document.querySelector('#themeHueValue');
  const accentHue = document.querySelector('#accentHue');
  const accentHueValue = document.querySelector('#accentHueValue');
  const layoutOptions = [...document.querySelectorAll('[data-layout-mode]')];
  const windIntensity = document.querySelector('#windIntensity');
  const windIntensityValue = document.querySelector('#windIntensityValue');
  const windLayer = document.querySelector('#windLayer');
  const motionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
  let finishArchiveTypewriter = () => {};
  const storage = {
    getItem(key) { try { return window.localStorage.getItem(key); } catch { return null; } },
    setItem(key, value) { try { window.localStorage.setItem(key, value); } catch {} },
  };
  const initialWindIntensity = () => {
    const stored = storage.getItem('blog-wind-intensity');
    if (stored !== null) {
      const value = Number(stored);
      return Number.isFinite(value) ? Math.round(Math.max(0, Math.min(100, value)) / 10) * 10 : 60;
    }
    return storage.getItem('blog-reduce-motion') === 'true' || storage.getItem('blog-wind') === 'false' ? 0 : 60;
  };
  if (windIntensity) windIntensity.value = String(initialWindIntensity());
  const reducedMotion = { get matches() { return motionMedia.matches || Number(windIntensity?.value ?? 60) === 0; } };
  const createWind = (intensity) => {
    if (!windLayer) return;
    const maxStreaks = window.innerWidth < 720 ? 6 : 11;
    const streakCount = intensity === 0 ? 0 : Math.max(1, Math.round(maxStreaks * intensity / 100));
    if (windLayer.childElementCount === streakCount) return;
    windLayer.replaceChildren();
    for (let index = 0; index < streakCount; index += 1) {
      const streak = document.createElement('span');
      streak.className = 'wind-streak';
      streak.style.setProperty('--wind-top', `${8 + Math.random() * 84}%`);
      streak.style.setProperty('--wind-width', `${70 + Math.random() * 170}px`);
      streak.style.setProperty('--wind-drift', `${-28 + Math.random() * 56}px`);
      streak.style.setProperty('--wind-angle', `${-3 + Math.random() * 6}deg`);
      streak.dataset.windFactor = String(.72 + Math.random() * .28);
      streak.style.setProperty('--wind-duration', `${5 + Math.random() * 5}s`);
      streak.style.setProperty('--wind-delay', `${-Math.random() * 10}s`);
      windLayer.append(streak);
    }
  };
  const applyWind = (rawIntensity) => {
    if (!windLayer) return;
    const intensity = Math.round(Math.max(0, Math.min(100, Number(rawIntensity) || 0)) / 10) * 10;
    createWind(intensity);
    const opacity = .12 + intensity / 100 * .55;
    windLayer.querySelectorAll('.wind-streak').forEach((streak) => {
      streak.style.setProperty('--wind-opacity', String(opacity * Number(streak.dataset.windFactor)));
    });
    if (windIntensityValue) windIntensityValue.textContent = intensity === 0 ? '关闭' : `${intensity}%`;
    document.body.classList.toggle('wind-on', intensity > 0 && !motionMedia.matches);
    return intensity;
  };
  window.addEventListener('resize', () => applyWind(windIntensity?.value ?? 60), { passive: true });
  let activeCategory = 'all';
  let revealObserver;

  const applyMotionPreference = () => {
    const wasReduced = document.documentElement.dataset.motion === 'reduced';
    const isReduced = reducedMotion.matches;
    document.documentElement.dataset.motion = isReduced ? 'reduced' : 'full';
    if (isReduced) finishArchiveTypewriter();
    if (windIntensity) windIntensity.disabled = motionMedia.matches;
    applyWind(windIntensity?.value ?? 60);
    if (isReduced && !wasReduced) {
      revealObserver?.disconnect();
      document.querySelectorAll('.reveal-pending').forEach((element) => element.classList.remove('reveal-pending'));
      document.getAnimations().forEach((animation) => animation.cancel());
    }
  };
  const startArchiveTypewriter = () => {
    let skipTypewriter = false;
    try {
      skipTypewriter = window.sessionStorage.getItem('archive-typewriter-seen') === 'true';
      if (skipTypewriter) window.sessionStorage.removeItem('archive-typewriter-seen');
    } catch {}
    const targets = [...document.querySelectorAll('.archive-hero [data-typewriter]')];
    if (!targets.length || reducedMotion.matches || skipTypewriter) return;

    const queue = [];
    targets.forEach((target) => {
      const visual = document.createElement('span');
      visual.setAttribute('aria-hidden', 'true');
      visual.append(...[...target.childNodes].map((node) => node.cloneNode(true)));
      const accessibleText = document.createElement('span');
      accessibleText.className = 'sr-only';
      accessibleText.textContent = [...target.childNodes].map((node) => node.nodeName === 'BR' ? ' ' : node.textContent).join('');
      const walker = document.createTreeWalker(visual, NodeFilter.SHOW_TEXT);
      const textNodes = [];
      while (walker.nextNode()) textNodes.push(walker.currentNode);
      textNodes.forEach((node) => {
        const fragment = document.createDocumentFragment();
        const characters = typeof Intl.Segmenter === 'function'
          ? [...new Intl.Segmenter('zh', { granularity: 'grapheme' }).segment(node.textContent)].map((part) => part.segment)
          : Array.from(node.textContent);
        characters.forEach((character) => {
          const span = document.createElement('span');
          span.dataset.typewriterChar = '';
          span.textContent = character;
          queue.push({ span, delay: /[，。！？、]/u.test(character) ? 160 : target.tagName === 'H1' ? 85 : 42 });
          fragment.append(span);
        });
        node.replaceWith(fragment);
      });
      target.replaceChildren(accessibleText, visual);
      target.classList.add('typewriter-running');
      queue.push({ delay: 320 });
    });

    let finished = false;
    let timer;
    let current;
    finishArchiveTypewriter = () => {
      if (finished) return;
      finished = true;
      window.clearTimeout(timer);
      current?.classList.remove('typewriter-cursor');
      targets.forEach((target) => target.classList.remove('typewriter-running'));
    };
    let index = 0;
    const typeNext = () => {
      if (finished) return;
      const item = queue[index++];
      if (!item) { finishArchiveTypewriter(); return; }
      if (item.span) {
        current?.classList.remove('typewriter-cursor');
        current = item.span;
        current.classList.add('is-typed', 'typewriter-cursor');
      }
      timer = window.setTimeout(typeNext, item.delay);
    };
    timer = window.setTimeout(typeNext, 200);
  };
  motionMedia.addEventListener('change', applyMotionPreference);
  windIntensity?.addEventListener('input', () => {
    const intensity = Math.round(Math.max(0, Math.min(100, Number(windIntensity.value) || 0)) / 10) * 10;
    windIntensity.value = String(intensity);
    storage.setItem('blog-wind-intensity', String(intensity));
    applyMotionPreference();
  });
  applyMotionPreference();
  startArchiveTypewriter();
  document.querySelectorAll('.inner-page .content-tabs a').forEach((link) => {
    link.addEventListener('click', () => {
      try { window.sessionStorage.setItem('archive-typewriter-seen', 'true'); } catch {}
    });
  });

  const themePanel = document.querySelector('#themePanel');
  const themeOptions = [...document.querySelectorAll('[data-theme-mode]')];
  const savedThemeMode = storage.getItem('blog-theme-mode');
  const legacyThemeMode = storage.getItem('blog-theme');
  let themeMode = ['light', 'dark', 'system'].includes(savedThemeMode)
    ? savedThemeMode
    : ['light', 'dark'].includes(legacyThemeMode) ? legacyThemeMode : 'system';
  const themeModeNames = { light: '亮色', dark: '暗色', system: '跟随系统' };
  const applyTheme = (mode) => {
    const dark = mode === 'system' ? themeMedia.matches : mode === 'dark';
    document.body.classList.toggle('dark', dark);
    toggle?.setAttribute('aria-label', `颜色主题：${themeModeNames[mode]}（当前${dark ? '暗色' : '亮色'}）`);
    toggle?.setAttribute('title', `颜色主题：${themeModeNames[mode]}`);
    themeOptions.forEach((option) => option.setAttribute('aria-pressed', String(option.dataset.themeMode === mode)));
  };
  applyTheme(themeMode);
  themeMedia.addEventListener('change', () => {
    if (themeMode === 'system') applyTheme('system');
  });

  const applyThemeHue = (value) => {
    const hue = Math.max(0, Math.min(360, Number(value) || 0));
    document.body.style.setProperty('--theme-hue', String(hue % 360));
    document.body.style.setProperty('--theme-warm-hue', String((hue + 210) % 360));
    document.body.style.setProperty('--theme-butter-hue', String((hue + 240) % 360));
    document.body.style.setProperty('--theme-cool-hue', String((hue + 42) % 360));
    if (themeHue) themeHue.value = String(hue);
    if (themeHueValue) themeHueValue.value = String(hue);
  };
  applyThemeHue(storage.getItem('blog-hue') || '165');
  themeHue?.addEventListener('input', () => {
    applyThemeHue(themeHue.value);
    storage.setItem('blog-hue', themeHue.value);
  });

  const applyAccentHue = (value) => {
    const hue = Math.round(Math.max(0, Math.min(360, Number(value) || 0)));
    document.body.style.setProperty('--accent-hue', String(hue % 360));
    if (accentHue) accentHue.value = String(hue);
    if (accentHueValue) accentHueValue.value = String(hue);
  };
  applyAccentHue(storage.getItem('blog-accent-hue') || '210');
  accentHue?.addEventListener('input', () => {
    applyAccentHue(accentHue.value);
    storage.setItem('blog-accent-hue', accentHue.value);
  });

  let layoutSwitchTimer = null;
  let layoutSwitchRevision = 0;
  const applyLayout = (mode, animate = false) => {
    const revision = ++layoutSwitchRevision;
    const grid = mode === 'grid';
    const articleList = document.querySelector('.home-page .article-list');
    const isGrid = document.body.classList.contains('layout-grid');
    if (layoutSwitchTimer !== null) {
      window.clearTimeout(layoutSwitchTimer);
      layoutSwitchTimer = null;
    }
    const setLayout = () => {
      document.body.classList.toggle('layout-grid', grid);
      layoutOptions.forEach((option) => option.setAttribute('aria-pressed', String(option.dataset.layoutMode === mode)));
      storage.setItem('blog-layout', grid ? 'grid' : 'list');
    };

    if (!animate || !articleList || isGrid === grid || reducedMotion.matches) {
      articleList?.classList.remove('is-switching');
      setLayout();
      return;
    }

    articleList.classList.add('is-switching');
    layoutSwitchTimer = window.setTimeout(() => {
      if (revision !== layoutSwitchRevision) return;
      layoutSwitchTimer = null;
      setLayout();
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (revision !== layoutSwitchRevision) return;
        articleList.classList.remove('is-switching');
      }));
    }, 200);
  };

  applyLayout(storage.getItem('blog-layout') || 'list');
  layoutOptions.forEach((option) => option.addEventListener('click', () => applyLayout(option.dataset.layoutMode, true)));

  const setAppearanceOpen = (open) => {
    if (!appearancePanel || !appearanceToggle) return;
    appearancePanel.hidden = !open;
    appearanceToggle.setAttribute('aria-expanded', String(open));
    if (open) appearancePanel.querySelector('input:not(:disabled), button:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href]')?.focus();
  };
  const setThemePanelOpen = (open, restoreFocus = false) => {
    if (!themePanel || !toggle) return;
    themePanel.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    if (open) themeOptions.find((option) => option.dataset.themeMode === themeMode)?.focus();
    else if (restoreFocus) toggle.focus();
  };
  toggle?.addEventListener('click', (event) => {
    event.stopPropagation();
    setAppearanceOpen(false);
    setThemePanelOpen(themePanel?.hidden !== false);
  });
  themeOptions.forEach((option) => option.addEventListener('click', () => {
    themeMode = option.dataset.themeMode;
    applyTheme(themeMode);
    storage.setItem('blog-theme-mode', themeMode);
    setThemePanelOpen(false, true);
  }));
  appearanceToggle?.addEventListener('click', (event) => {
    event.stopPropagation();
    setThemePanelOpen(false);
    setAppearanceOpen(appearancePanel?.hidden !== false);
  });
  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (appearancePanel && !appearancePanel.hidden && !appearancePanel.contains(target) && !appearanceToggle?.contains(target)) setAppearanceOpen(false);
    if (themePanel && !themePanel.hidden && !themePanel.contains(target) && !toggle?.contains(target)) setThemePanelOpen(false);
  });
  appearancePanel?.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    requestAnimationFrame(() => {
      if (!appearancePanel.contains(document.activeElement)) setAppearanceOpen(false);
    });
  });
  themePanel?.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    requestAnimationFrame(() => {
      if (!themePanel.contains(document.activeElement)) setThemePanelOpen(false);
    });
  });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (themePanel && !themePanel.hidden) {
      event.preventDefault();
      setThemePanelOpen(false, true);
      return;
    }
    if (appearancePanel && !appearancePanel.hidden) {
      event.preventDefault();
      setAppearanceOpen(false);
      appearanceToggle?.focus();
    }
  });

  const navDropdowns = [...document.querySelectorAll('.nav-dropdown')];
  const setNavDropdownOpen = (dropdown, open) => {
    const button = dropdown.querySelector('.nav-dropdown__toggle');
    const menu = dropdown.querySelector('.nav-dropdown__menu');
    if (!button || !menu) return;
    menu.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
    dropdown.classList.toggle('is-open', open);
  };
  const closeNavDropdowns = (restoreFocus = false) => {
    navDropdowns.forEach((dropdown) => {
      const wasOpen = dropdown.classList.contains('is-open');
      setNavDropdownOpen(dropdown, false);
      if (restoreFocus && wasOpen) dropdown.querySelector('.nav-dropdown__toggle')?.focus();
    });
  };
  navDropdowns.forEach((dropdown) => {
    const button = dropdown.querySelector('.nav-dropdown__toggle');
    let pointerIsOver = false;
    dropdown.addEventListener('pointerenter', (event) => {
      if (event.pointerType === 'mouse') {
        pointerIsOver = true;
        closeNavDropdowns();
        setNavDropdownOpen(dropdown, true);
      }
    });
    dropdown.addEventListener('pointerleave', (event) => {
      if (event.pointerType === 'mouse') {
        pointerIsOver = false;
        if (!dropdown.contains(document.activeElement)) setNavDropdownOpen(dropdown, false);
      }
    });
    dropdown.addEventListener('focusin', () => {
      closeNavDropdowns();
      setNavDropdownOpen(dropdown, true);
    });
    dropdown.addEventListener('focusout', () => {
      requestAnimationFrame(() => {
        if (!pointerIsOver && !dropdown.contains(document.activeElement)) setNavDropdownOpen(dropdown, false);
      });
    });

    button?.addEventListener('click', (event) => {
      event.stopPropagation();
      const shouldOpen = button.getAttribute('aria-expanded') !== 'true';
      closeNavDropdowns();
      if (shouldOpen) setNavDropdownOpen(dropdown, true);
    });
    dropdown.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || !dropdown.classList.contains('is-open')) return;
      event.preventDefault();
      closeNavDropdowns(true);
    });
  });
  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Node)) return;
    if (!navDropdowns.some((dropdown) => dropdown.contains(event.target))) closeNavDropdowns();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && navDropdowns.some((dropdown) => dropdown.classList.contains('is-open'))) closeNavDropdowns(true);
  });


  const searchTrigger = document.querySelector('#searchTrigger');
  const searchDialog = document.querySelector('#siteSearchDialog');
  const searchInput = document.querySelector('#siteSearchInput');
  const searchStatus = document.querySelector('#siteSearchStatus');
  const searchResults = document.querySelector('#siteSearchResults');
  const searchRetry = document.querySelector('#searchRetry');
  let searchIndexPromise = null;
  let searchIndexLoaded = false;
  let searchRevision = 0;

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
          if (documentXml.querySelector('parsererror')) throw new Error('Invalid search index');
          searchIndexLoaded = true;
          return [...documentXml.querySelectorAll('entry')].map((entry) => {
            const rawContent = entry.querySelector('content')?.textContent || '';
            const contentDocument = new DOMParser().parseFromString(rawContent, 'text/html');
            return {
              title: entry.querySelector('title')?.textContent || '未命名文章',
              url: entry.querySelector('url')?.textContent || '/',
              content: contentDocument.body.textContent.replace(/\s+/g, ' ').trim(),
            };
          });
        })
        .catch((error) => {
          searchIndexPromise = null;
          searchIndexLoaded = false;
          throw error;
        });
    }
    return searchIndexPromise;
  };

  const renderSearchResults = (entries, rawQuery) => {
    if (!searchResults || !searchStatus) return;
    const query = rawQuery.trim().toLowerCase();
    searchResults.replaceChildren();

    if (!query) {
      searchStatus.textContent = entries.length ? '输入关键词，可按标题或正文搜索全部文章。' : '暂无可搜索的文章，稍后再来看看。';
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
      : `没有找到与“${rawQuery.trim()}”相关的文章，试试其他关键词。`;

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

  const updateSearch = () => {
    if (!searchDialog?.open) return;
    const revision = ++searchRevision;
    const query = searchInput?.value || '';
    searchResults?.setAttribute('aria-busy', 'true');
    if (searchRetry) searchRetry.hidden = true;
    if (!searchIndexLoaded) {
      searchResults?.replaceChildren();
      if (searchStatus) searchStatus.textContent = '正在加载文章索引…';
    }
    loadSearchIndex()
      .then((entries) => {
        if (revision === searchRevision && searchDialog.open) renderSearchResults(entries, query);
      })
      .catch(() => {
        if (revision !== searchRevision || !searchDialog.open) return;
        searchResults?.replaceChildren();
        if (searchStatus) searchStatus.textContent = '搜索暂时不可用，请检查网络后重试。';
        if (searchRetry) searchRetry.hidden = false;
      })
      .finally(() => {
        if (revision === searchRevision) searchResults?.setAttribute('aria-busy', 'false');
      });
  };

  const openSearch = () => {
    if (!searchDialog) return;
    setAppearanceOpen(false);
    if (!searchDialog.open) searchDialog.showModal();
    document.body.classList.add('search-open');
    requestAnimationFrame(() => searchInput?.focus());
    updateSearch();
  };

  const resetSearchState = () => {
    searchRevision += 1;
    searchResults?.setAttribute('aria-busy', 'false');
    document.body.classList.remove('search-open');
  };
  const closeSearch = () => {
    resetSearchState();
    if (searchDialog?.open) searchDialog.close();
  };

  searchTrigger?.addEventListener('click', openSearch);
  document.querySelector('[data-search-close]')?.addEventListener('click', closeSearch);
  searchDialog?.addEventListener('close', resetSearchState);
  searchDialog?.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    closeSearch();
  });
  searchDialog?.addEventListener('click', (event) => {
    if (event.target === searchDialog) closeSearch();
  });
  searchInput?.addEventListener('input', updateSearch);
  searchRetry?.addEventListener('click', () => {
    searchInput?.focus();
    updateSearch();
  });
  document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      openSearch();
    }
  });

  const gallerySearch = document.querySelector('#gallerySearch');
  const galleryFilters = [...document.querySelectorAll('[data-gallery-filter]')];
  const galleryPhotos = [...document.querySelectorAll('[data-gallery-photo]')];
  const galleryAlbums = [...document.querySelectorAll('[data-gallery-album]')];
  const galleryCards = galleryPhotos.length ? galleryPhotos : galleryAlbums;
  const galleryPhotoCount = document.querySelector('#galleryPhotoCount');
  const galleryEmpty = document.querySelector('#galleryEmpty');
  const galleryGrid = document.querySelector('#galleryGrid');
  const galleryViewOptions = [...document.querySelectorAll('[data-gallery-view]')];
  let activeGalleryFilter = 'all';
  const filterGallery = () => {
    const query = gallerySearch?.value.trim().toLowerCase() || '';
    let visible = 0;
    galleryCards.forEach((card) => {
      const categories = (card.dataset.galleryCategory || '').split(/\s+/);
      const searchText = `${card.dataset.gallerySearch || ''} ${card.textContent || ''}`.toLowerCase();
      const matchesCategory = activeGalleryFilter === 'all' || categories.includes(activeGalleryFilter);
      const matchesSearch = !query || searchText.includes(query);
      card.hidden = !(matchesCategory && matchesSearch);
      if (!card.hidden) visible += 1;
    });
    if (galleryPhotoCount) {
      galleryPhotoCount.textContent = activeGalleryFilter === 'all' && !query
        ? `共 ${galleryPhotos.length} 张照片`
        : `找到 ${visible} 张照片 · 共 ${galleryPhotos.length} 张`;
    }
    if (galleryEmpty) galleryEmpty.hidden = visible > 0;
  };
  galleryFilters.forEach((filter) => filter.addEventListener('click', () => {
    activeGalleryFilter = filter.dataset.galleryFilter || 'all';
    galleryFilters.forEach((item) => item.setAttribute('aria-pressed', String(item === filter)));
    filterGallery();
  }));
  gallerySearch?.addEventListener('input', filterGallery);
  filterGallery();

  const applyGalleryView = (view) => {
    if (!galleryGrid) return;
    const layout = view === 'list' ? 'list' : 'grid';
    galleryGrid.dataset.galleryLayout = layout;
    galleryViewOptions.forEach((option) => option.setAttribute('aria-pressed', String(option.dataset.galleryView === layout)));
  };
  applyGalleryView(storage.getItem('blog-gallery-view'));
  galleryViewOptions.forEach((option) => option.addEventListener('click', () => {
    const view = option.dataset.galleryView === 'list' ? 'list' : 'grid';
    applyGalleryView(view);
    storage.setItem('blog-gallery-view', view);
  }));

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

  const filterHint = document.querySelector('#filterHint');
  const tabFilters = [...document.querySelectorAll('.home-page .content-tabs [data-filter]')];
  const isHomeFilter = Boolean(document.querySelector('.home-page #articleList'));
  const filterRows = () => {
    let visible = 0;
    rows.forEach((row) => {
      const show = activeCategory === 'all' || row.dataset.category === activeCategory;
      if (show) visible += 1;
      const wasHidden = row.hidden;
      row.hidden = !show;
      if (show) {
        revealObserver?.unobserve(row);
        row.classList.remove('reveal-pending');
        if (wasHidden && !reducedMotion.matches) {
          row.getAnimations().forEach((animation) => animation.cancel());
          row.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 200, easing: 'ease-out' });
        }
      }
    });
    if (emptyState) emptyState.hidden = visible > 0;
    if (filterHint) filterHint.textContent = activeCategory === 'all' ? '共 ' + visible + ' 篇文章' : activeCategory + ' · ' + visible + ' 篇文章';
  };
  const setActiveCategory = (category) => {
    activeCategory = tabFilters.some((tab) => tab.dataset.filter === category) ? category : 'all';
    filterRows();
    tabFilters.forEach((item) => {
      const selected = item.dataset.filter === activeCategory;
      item.classList.toggle('selected', selected);
      if (selected) item.setAttribute('aria-current', 'true');
      else item.removeAttribute('aria-current');
    });
  };
  if (isHomeFilter) {
    setActiveCategory(new URLSearchParams(window.location.search).get('category') || 'all');
    tabFilters.forEach((tab) => tab.addEventListener('click', (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      const category = tab.dataset.filter;
      if (activeCategory === category) return;

      const url = new URL(window.location.href);
      if (category === 'all') url.searchParams.delete('category');
      else url.searchParams.set('category', category);
      window.history.pushState({ category }, '', url);
      setActiveCategory(category);
    }));
    window.addEventListener('popstate', () => {
      setActiveCategory(new URLSearchParams(window.location.search).get('category') || 'all');
    });
  }

  const quoteCard = document.querySelector('.quote-card');
  const quoteSlides = [...document.querySelectorAll('.quote-slide')];
  const quoteControls = [...document.querySelectorAll('.quote-control')];
  let quoteIndex = 0;
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
  quoteControls.forEach((control, index) => control.addEventListener('click', () => showQuote(index)));
  quoteCard?.querySelector('[role="tablist"]')?.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? quoteSlides.length - 1 : quoteIndex + (event.key === 'ArrowRight' ? 1 : -1);
    showQuote(next);
    quoteControls[quoteIndex]?.focus();
  });

  const backToTop = document.querySelector('#backToTop');
  const readingProgress = document.querySelector('#readingProgressBar');
  const articleContent = document.querySelector('.article-content');
  const siteHeader = document.querySelector('.site-header');
  let scrollTicking = false;
  let articleStart = 0;
  let articleDistance = 1;

  const setClass = (element, className, enabled) => {
    if (!element || element.classList.contains(className) === enabled) return;
    element.classList.toggle(className, enabled);
  };

  const refreshArticleMetrics = () => {
    if (!articleContent) return;
    articleStart = articleContent.getBoundingClientRect().top + window.scrollY;
    articleDistance = Math.max(articleContent.offsetHeight - window.innerHeight * .65, 1);
  };

  const updateScrollInterface = () => {
    const scrollTop = window.scrollY;
    setClass(backToTop, 'is-visible', scrollTop > 520);
    if (backToTop) backToTop.inert = scrollTop <= 520;
    setClass(siteHeader, 'navbar-sticky-shadow', scrollTop > 14);
    if (readingProgress && articleContent) {
      const progress = Math.min(1, Math.max(0, (scrollTop - articleStart + window.innerHeight * .35) / articleDistance));
      readingProgress.style.transform = `scaleX(${progress})`;
    }
    scrollTicking = false;
  };

  const requestScrollUpdate = () => {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(updateScrollInterface);
  };

  if (articleContent && 'ResizeObserver' in window) {
    new ResizeObserver(() => { refreshArticleMetrics(); requestScrollUpdate(); }).observe(articleContent);
  }
  refreshArticleMetrics();
  window.addEventListener('scroll', requestScrollUpdate, { passive: true });
  window.addEventListener('resize', () => {
    refreshArticleMetrics();
    requestScrollUpdate();
  });
  updateScrollInterface();
  backToTop?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
  });

  const tocLinks = [...document.querySelectorAll('.article-toc a')];
  const headingForLink = (link) => {
    try { return document.getElementById(decodeURIComponent(link.hash.slice(1))); } catch { return null; }
  };
  const tocHeadings = tocLinks.map(headingForLink).filter(Boolean);
  if (tocHeadings.length && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      const entry = entries.find((item) => item.isIntersecting);
      if (!entry) return;
      tocLinks.forEach((link) => {
        const active = headingForLink(link) === entry.target;
        link.classList.toggle('is-active', active);
        if (active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }, { rootMargin: '-18% 0px -60% 0px' });
    tocHeadings.forEach((heading) => observer.observe(heading));
  }

  // Reveal navigational cards once; article text always stays visible.
  const revealSelector = '.article-row, .taxonomy-card, .explore-card, .link-card, .gallery-card, .post-nav-card';
  if (!reducedMotion.matches && 'IntersectionObserver' in window) {
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.remove('reveal-pending');
        if (!reducedMotion.matches) {
          entry.target.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'ease-out' });
        }
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px 40px 0px', threshold: 0 });
    document.querySelectorAll(revealSelector).forEach((element) => {
      if (element.getBoundingClientRect().top < window.innerHeight || element.hidden) return;
      element.classList.add('reveal-pending');
      revealObserver.observe(element);
    });
  }
  window.addEventListener('pageshow', () => {
    document.querySelectorAll('.reveal-pending').forEach((element) => {
      const rect = element.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < window.innerHeight) {
        element.classList.remove('reveal-pending');
        revealObserver?.unobserve(element);
      }
    });
    refreshArticleMetrics();
    requestScrollUpdate();
  });
})();
