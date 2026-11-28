(() => {
  'use strict';

  const storageKey = 'houseboat-last-voyage';
  const tickets = [...document.querySelectorAll('[data-voyage]')];
  if (!tickets.length) return;
  const motionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
  const prefersReducedMotion = () => motionMedia.matches || document.documentElement.dataset.motion === 'reduced';
  const finishDeparture = () => tickets.forEach((ticket) => ticket.classList.remove('is-departing'));
  const applyMotionPreference = () => { if (prefersReducedMotion()) finishDeparture(); };
  motionMedia.addEventListener('change', applyMotionPreference);
  new MutationObserver(applyMotionPreference).observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion'] });
  document.addEventListener('visibilitychange', () => { if (document.hidden) finishDeparture(); });
  let lastDestination = '';
  try { lastDestination = sessionStorage.getItem(storageKey) || ''; } catch {}

  tickets.forEach((ticket) => {
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

    ticket.addEventListener('animationend', (event) => {
      if (event.animationName === 'voyage-sailing-wake') ticket.classList.remove('is-departing');
    });

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
      if (!prefersReducedMotion()) ticket.classList.add('is-departing');
    };
    link.addEventListener('click', depart);
    link.addEventListener('auxclick', depart);
  });
})();
