(() => {
  'use strict';
  const legacyGuestbook = document.querySelector('[data-guestbook-redirect]');
  if (legacyGuestbook) {
    const destination = new URL(legacyGuestbook.dataset.guestbookRedirect, window.location.href);
    if (destination.origin === window.location.origin) window.location.replace(destination.href);
    return;
  }
  const mailbox = document.querySelector('details#guestbook');
  const revealMailbox = () => {
    if (window.location.hash !== '#guestbook' || !mailbox) return;
    mailbox.open = true;
    requestAnimationFrame(() => mailbox.scrollIntoView({ block: 'start', behavior: 'instant' }));
  };
  revealMailbox();
  window.addEventListener('hashchange', revealMailbox);
  document.querySelectorAll('a[href="#guestbook"]').forEach((link) => {
    link.addEventListener('click', () => { if (mailbox) mailbox.open = true; });
  });
  const message = document.querySelector('#guestbookMessage');
  const count = document.querySelector('#guestbookCount');
  message?.addEventListener('input', () => { if (count) count.textContent = `${message.value.length} / 1200`; });
  const siteInfo = document.querySelector('#friendSiteInfo');
  const copyButton = document.querySelector('[data-copy-site]');
  const copyStatus = document.querySelector('#siteCopyStatus');
  copyButton?.addEventListener('click', async () => {
    if (!siteInfo) return;
    try {
      await navigator.clipboard.writeText(siteInfo.textContent);
      if (copyStatus) copyStatus.textContent = '本站信息已复制，可以粘贴到你的友链页。';
    } catch {
      const range = document.createRange();
      range.selectNodeContents(siteInfo);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      if (copyStatus) copyStatus.textContent = '请按 Ctrl / ⌘ + C 复制已选中的站点信息。';
    }
  });
  document.querySelectorAll('.harbor-friend__avatar img').forEach((avatar) => {
    const hideBrokenAvatar = () => { avatar.hidden = true; };
    avatar.addEventListener('error', hideBrokenAvatar, { once: true });
    if (avatar.complete && !avatar.naturalWidth) hideBrokenAvatar();
  });

  const cards = [...document.querySelectorAll('.harbor-friend')];
  if (!cards.length) return;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const precisePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const motionAllowed = () => !reduceMotion.matches && document.documentElement.dataset.motion !== 'reduced' && precisePointer.matches;
  let activeCard = null;
  let activeBounds = null;
  let pointerFrame = 0;
  let pendingPointer = null;
  const resetCard = () => {
    if (pointerFrame) cancelAnimationFrame(pointerFrame);
    pointerFrame = 0;
    activeCard?.style.removeProperty('--friend-tilt-x');
    activeCard?.style.removeProperty('--friend-tilt-y');
    activeCard = null;
    activeBounds = null;
  };
  cards.forEach((card) => {
    card.addEventListener('pointerenter', () => {
      resetCard();
      if (!motionAllowed()) return;
      activeCard = card;
      activeBounds = card.getBoundingClientRect();
    });
    card.addEventListener('pointermove', (event) => {
      if (activeCard !== card || !activeBounds || !motionAllowed()) return;
      pendingPointer = { x: event.clientX, y: event.clientY };
      if (pointerFrame) return;
      pointerFrame = requestAnimationFrame(() => {
        pointerFrame = 0;
        if (!activeCard || !activeBounds || !pendingPointer) return;
        const x = Math.max(-.5, Math.min(.5, (pendingPointer.x - activeBounds.left) / activeBounds.width - .5));
        const y = Math.max(-.5, Math.min(.5, (pendingPointer.y - activeBounds.top) / activeBounds.height - .5));
        activeCard.style.setProperty('--friend-tilt-x', `${(-y * 5).toFixed(2)}deg`);
        activeCard.style.setProperty('--friend-tilt-y', `${(x * 5).toFixed(2)}deg`);
      });
    });
    card.addEventListener('pointerleave', resetCard);
    card.addEventListener('pointercancel', resetCard);
  });
  window.addEventListener('resize', resetCard, { passive: true });
  window.addEventListener('scroll', resetCard, { passive: true });
  reduceMotion.addEventListener('change', resetCard);
  precisePointer.addEventListener('change', resetCard);
  new MutationObserver(resetCard).observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion'] });
})();
