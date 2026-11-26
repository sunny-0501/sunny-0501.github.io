(() => {
  const shell = document.querySelector('[data-archive-shell]');
  const routeData = document.querySelector('#archiveRoutes');
  if (!shell || !routeData || !window.history?.pushState) return;

  let routes;
  try {
    routes = JSON.parse(routeData.textContent);
    if (!Array.isArray(routes)) return;
  } catch {
    return;
  }

  const normalizePath = (path) => {
    let value = path;
    try { value = decodeURIComponent(value); } catch {}
    return value.replace(/\/index\.html$/i, '/').replace(/\/?$/, '/');
  };
  const routeMap = new Map(routes.map((route) => [normalizePath(new URL(route.path, window.location.href).pathname), route]));
  const panes = [...shell.querySelectorAll('[data-archive-pane]')];
  const readNames = (value) => {
    try { const result = JSON.parse(value || '[]'); return Array.isArray(result) ? result : []; } catch { return []; }
  };
  const posts = [...shell.querySelectorAll('[data-archive-post]')].map((element) => ({
    element,
    categories: readNames(element.dataset.archiveCategories),
    tags: readNames(element.dataset.archiveTags),
    period: element.dataset.archivePeriod || '',
  }));
  const viewLinks = [...shell.querySelectorAll('[data-archive-view-link]')];
  const categoryLinks = [...shell.querySelectorAll('[data-archive-category-link]')];
  const topicLinks = [...shell.querySelectorAll('.archive-topic-links a')];
  const heading = shell.querySelector('#archiveViewHeading');
  const title = shell.querySelector('#archiveViewTitle');
  const hint = shell.querySelector('#filterHint');
  const empty = shell.querySelector('#emptyState');
  const siteTitle = shell.dataset.archiveSiteTitle || '';
  const countKind = (kind) => routes.filter((route) => route.kind === kind).length;
  const getRoute = (path = window.location.pathname) => routeMap.get(normalizePath(path));
  const groupFor = (kind) => kind === 'category' ? 'categories' : kind === 'tag' ? 'tags' : kind === 'period' ? 'posts' : kind;
  const setSelected = (link, selected) => {
    link.classList.toggle('selected', selected);
    if (selected) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  };
  const sameRoute = (first, second) => Boolean(first && second && first.kind === second.kind && first.name === second.name);

  // Keep the original hero, sidebars and article nodes alive during every switch.
  const showRoute = (route, focusHeading = false) => {
    const pane = route.kind === 'categories' || route.kind === 'tags' ? route.kind : 'posts';
    panes.forEach((element) => { element.hidden = element.dataset.archivePane !== pane; });
    let visible = 0;
    posts.forEach((post) => {
      const matches = route.kind === 'category' ? post.categories.includes(route.name)
        : route.kind === 'tag' ? post.tags.includes(route.name)
        : route.kind === 'period' ? post.period.startsWith(route.name) : true;
      post.element.hidden = !matches;
      if (matches) visible += 1;
    });
    if (empty) empty.hidden = visible > 0;
    if (title) title.textContent = route.kind === 'categories' ? '文章分类' : route.kind === 'tags' ? '文章标签'
      : route.kind === 'category' ? route.name : route.kind === 'tag' ? '# ' + route.name
      : route.kind === 'period' ? route.name + ' 的文章' : '全部文章';
    if (hint) hint.textContent = route.kind === 'categories' ? `共 ${countKind('category')} 个分类 · 按主题继续阅读`
      : route.kind === 'tags' ? `共 ${countKind('tag')} 个标签 · 从关键词出发`
      : `${route.kind === 'category' ? route.name + ' · ' : route.kind === 'tag' ? '#' + route.name + ' · ' : route.kind === 'period' ? route.name + ' · ' : ''}共 ${visible} 篇公开文章`;
    viewLinks.forEach((link) => setSelected(link, link.dataset.archiveViewLink === groupFor(route.kind)));
    categoryLinks.forEach((link) => setSelected(link, route.kind === 'category'
      ? link.dataset.archiveCategoryLink === route.name
      : route.kind === 'posts' && link.dataset.archiveCategoryLink === ''));
    topicLinks.forEach((link) => setSelected(link, sameRoute(getRoute(new URL(link.href).pathname), route)));

    document.querySelectorAll('[data-archive-link]').forEach((link) => {
      const linkedRoute = getRoute(new URL(link.href).pathname);
      const selected = Boolean(linkedRoute && groupFor(linkedRoute.kind) === groupFor(route.kind));
      link.classList.toggle('active', selected);
      if (selected) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    document.querySelectorAll('[data-archive-section]').forEach((link) => {
      link.classList.add('active');
      link.closest('.nav-dropdown')?.classList.add('is-active');
    });
    document.title = route.title + (siteTitle ? ' · ' + siteTitle : '');
    shell.dataset.archiveCurrentView = route.kind;
    if (focusHeading) heading?.focus({ preventScroll: true });
    document.dispatchEvent(new CustomEvent('archive:navigate', { detail: { kind: route.kind, name: route.name, path: route.path } }));
  };

  const initialRoute = getRoute();
  if (initialRoute) showRoute(initialRoute);

  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    const link = target.closest('a[href]');
    if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
    if ((link.getAttribute('href') || '').startsWith('#')) return;
    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin || url.search || url.hash) return;
    const route = getRoute(url.pathname);
    if (!route) return;
    event.preventDefault();
    if (normalizePath(url.pathname) !== normalizePath(window.location.pathname)) {
      window.history.pushState({ archiveView: route.kind }, '', url.pathname);
    }
    showRoute(route, true);
    // A menu link no longer navigates away, so close its popover explicitly.
    const dropdown = link.closest('.nav-dropdown');
    if (dropdown) {
      dropdown.classList.remove('is-open');
      const menu = dropdown.querySelector('.nav-dropdown__menu');
      if (menu) menu.hidden = true;
      dropdown.querySelector('.nav-dropdown__toggle')?.setAttribute('aria-expanded', 'false');
    }
  });

  window.addEventListener('popstate', () => {
    const route = getRoute();
    if (route) showRoute(route);
  });
})();
