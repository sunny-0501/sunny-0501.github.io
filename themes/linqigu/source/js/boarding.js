(() => {
  const dialog = document.querySelector('#boardingDialog');
  if (!dialog || typeof dialog.showModal !== 'function') return;

  document.querySelectorAll('button[data-boarding-open], a[data-boarding-open]').forEach((control) => {
    control.hidden = false;
    control.setAttribute('aria-haspopup', 'dialog');
    control.setAttribute('aria-controls', dialog.id);
  });

  const sessionKey = 'houseboat-boarding-seen-v1';
  let returnFocus = null;
  let openedAutomatically = false;
  let sessionAvailable = true;
  let alreadySeen = false;
  let departureTimer = null;
  const motionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
  const prefersReducedMotion = () => motionMedia.matches || document.documentElement.dataset.motion === 'reduced';
  const clearDeparture = () => {
    if (departureTimer !== null) window.clearTimeout(departureTimer);
    departureTimer = null;
    dialog.classList.remove('is-boarding');
  };
  try {
    alreadySeen = sessionStorage.getItem(sessionKey) === 'true';
    const probe = `${sessionKey}-probe`;
    sessionStorage.setItem(probe, '1');
    sessionStorage.removeItem(probe);
  } catch {
    sessionAvailable = false;
  }

  const rememberVisit = () => {
    try { sessionStorage.setItem(sessionKey, 'true'); } catch { /* Manual boarding remains usable when storage is unavailable. */ }
  };

  const openBoarding = (trigger = null) => {
    if (dialog.open || document.querySelector('dialog[open]')) return;
    returnFocus = trigger || document.activeElement;
    openedAutomatically = !trigger;
    try {
      clearDeparture();
      dialog.showModal();
      document.body.classList.add('boarding-open');
      rememberVisit();
      dialog.querySelector('.boarding__enter')?.focus({ preventScroll: true });
    } catch {
      document.body.classList.remove('boarding-open');
    }
  };

  const closeBoarding = () => {
    clearDeparture();
    if (!dialog.open) return;
    rememberVisit();
    dialog.close();
  };

  const board = () => {
    if (!dialog.open || dialog.classList.contains('is-boarding')) return;
    if (prefersReducedMotion()) {
      closeBoarding();
      return;
    }
    dialog.classList.add('is-boarding');
    // A short paper-stamp sequence; Escape and Skip always finish immediately.
    departureTimer = window.setTimeout(closeBoarding, 620);
  };

  dialog.querySelectorAll('[data-boarding-close]').forEach((button) => {
    button.addEventListener('click', button.classList.contains('boarding__enter') ? board : closeBoarding);
  });
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeBoarding();
  });
  dialog.addEventListener('close', () => {
    clearDeparture();
    document.body.classList.remove('boarding-open');
    const target = openedAutomatically ? document.querySelector('#top') : returnFocus;
    if (target instanceof HTMLElement && target.isConnected) {
      if (!target.matches('a, button, input, select, textarea, [tabindex]')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }
    returnFocus = null;
  });

  const applyMotionPreference = () => {
    if (prefersReducedMotion() && dialog.classList.contains('is-boarding')) closeBoarding();
  };
  motionMedia.addEventListener('change', applyMotionPreference);
  new MutationObserver(applyMotionPreference).observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion'] });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && dialog.classList.contains('is-boarding')) closeBoarding();
  });

  document.addEventListener('click', (event) => {
    const trigger = event.target instanceof Element ? event.target.closest('[data-boarding-open]') : null;
    if (!trigger) return;
    event.preventDefault();
    openBoarding(trigger);
  });

  // Respect deep links and disable automatic interruption when a session cannot be remembered.
  if (dialog.dataset.boardingHome === 'true' && sessionAvailable && !alreadySeen && !location.hash) openBoarding();
})();
