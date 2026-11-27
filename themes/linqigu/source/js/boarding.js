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
      dialog.showModal();
      document.body.classList.add('boarding-open');
      rememberVisit();
      dialog.querySelector('.boarding__enter')?.focus({ preventScroll: true });
    } catch {
      document.body.classList.remove('boarding-open');
    }
  };

  const closeBoarding = () => {
    if (!dialog.open) return;
    rememberVisit();
    dialog.close();
  };

  dialog.querySelectorAll('[data-boarding-close]').forEach((button) => {
    button.addEventListener('click', closeBoarding);
  });
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeBoarding();
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('boarding-open');
    const target = openedAutomatically ? document.querySelector('#top') : returnFocus;
    if (target instanceof HTMLElement && target.isConnected) {
      if (!target.matches('a, button, input, select, textarea, [tabindex]')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }
    returnFocus = null;
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
