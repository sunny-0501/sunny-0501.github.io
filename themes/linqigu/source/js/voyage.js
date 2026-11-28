(() => {
  'use strict';

  const storageKey = 'houseboat-last-voyage';
  let lastDestination = '';
  try { lastDestination = sessionStorage.getItem(storageKey) || ''; } catch {}

  document.querySelectorAll('[data-voyage]').forEach((ticket) => {
    const link = ticket.querySelector('[data-voyage-random]');
    const status = ticket.querySelector('[data-voyage-status]');
    if (!link) return;

    let destinations = [];
    try {
      const parsed = JSON.parse(ticket.dataset.voyageDestinations || '[]');
      if (Array.isArray(parsed)) {
        const seen = new Set();
        destinations = parsed.filter((destination) => {
          if (!destination || typeof destination.name !== 'string' || typeof destination.url !== 'string') return false;
          try {
            const url = new URL(destination.url);
            if (url.protocol !== 'https:' || url.origin === location.origin || seen.has(url.href)) return false;
            seen.add(url.href);
            destination.url = url.href;
            return true;
          } catch { return false; }
        });
      }
    } catch {}
    if (!destinations.length) return;

    const depart = (event) => {
      if (event.defaultPrevented || (event.type === 'auxclick' && event.button !== 1)) return;
      const unvisited = destinations.filter((destination) => destination.url !== lastDestination);
      const candidates = unvisited.length ? unvisited : destinations;
      const destination = candidates[Math.floor(Math.random() * candidates.length)];

      // A normal anchor navigation keeps keyboard/modifier clicks and popup blockers working.
      link.href = destination.url;
      lastDestination = destination.url;
      try { sessionStorage.setItem(storageKey, lastDestination); } catch {}
      if (status) status.textContent = `已打开：${destination.name}`;
    };
    link.addEventListener('click', depart);
    link.addEventListener('auxclick', depart);
  });
})();
