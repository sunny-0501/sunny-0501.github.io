(() => {
  'use strict';
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const allowed = () => !motion.matches && document.documentElement.dataset.motion !== 'reduced';
  const hero = document.querySelector('.voyage-hero');
  const sceneWindow = hero?.querySelector('[data-scene-window]');
  const pictures = [...(hero?.querySelectorAll('[data-scene-image]') || [])];
  const choices = [...(hero?.querySelectorAll('[data-scene-select]') || [])];
  const sceneStatus = hero?.querySelector('[data-scene-status]');
  let current = 0;
  let revision = 0;
  let gustTimer;
  const stopGust = () => { window.clearTimeout(gustTimer); hero?.classList.remove('is-gust'); };
  const chooseScene = async (index) => {
    if (!pictures[index]) return;
    const request = ++revision;
    if (index === current) {
      sceneWindow.removeAttribute('aria-busy');
      if (sceneStatus) sceneStatus.textContent = '';
      return;
    }
    const picture = pictures[index];
    picture.loading = 'eager';
    sceneWindow.setAttribute('aria-busy', 'true');
    try {
      if (typeof picture.decode === 'function') await picture.decode();
      if (picture.complete && !picture.naturalWidth) throw new Error('Image unavailable');
      if (request !== revision) return;
      pictures.forEach((item, position) => {
        item.classList.toggle('is-current', position === index);
        item.setAttribute('aria-hidden', String(position !== index));
      });
      choices.forEach((choice, position) => choice.setAttribute('aria-pressed', String(position === index)));
      const label = choices[index].getAttribute('aria-label').replace(/^看/, '');
      const caption = hero.querySelector('[data-scene-name]');
      if (caption) caption.textContent = label;
      sceneWindow.dataset.tone = picture.dataset.sceneTone;
      current = index;
      if (sceneStatus) sceneStatus.textContent = '';
    } catch {
      if (request === revision && sceneStatus) sceneStatus.textContent = '这张图片暂时没能打开，再试试其他的。';
    } finally {
      if (request === revision) sceneWindow.removeAttribute('aria-busy');
    }
  };
  if (pictures.length && choices.length) {
    const controls = hero.querySelector('.scene-controls');
    if (controls) controls.hidden = false;
    sceneWindow.dataset.tone = pictures[0].dataset.sceneTone;
    choices.forEach((choice, index) => choice.addEventListener('click', () => chooseScene(index)));
    hero.querySelector('[data-scene-shuffle]')?.addEventListener('click', () => {
      const candidates = pictures.map((_, index) => index).filter((index) => index !== current);
      chooseScene(candidates[Math.floor(Math.random() * candidates.length)]);
    });
    const gust = hero.querySelector('[data-gust]');
    if (gust) {
      gust.hidden = false;
      gust.addEventListener('click', () => {
        stopGust();
        if (sceneStatus) sceneStatus.textContent = '';
        if (!allowed()) {
          chooseScene((current + 1) % pictures.length);
          if (sceneStatus) sceneStatus.textContent = '已换一张风景。';
          return;
        }
        void hero.offsetWidth;
        hero.classList.add('is-gust');
        gustTimer = window.setTimeout(stopGust, 1700);
        if (sceneStatus) sceneStatus.textContent = '起风了。';
      });
    }
  }
  const pile = document.querySelector('[data-photo-pile]');
  const stack = pile?.querySelector('.photo-pile__stack');
  const flip = pile?.querySelector('[data-pile-next]');
  let flipping = null;
  let flipTimer;
  const syncPrints = () => {
    const prints = [...stack.querySelectorAll('[data-pile-print]')];
    prints.forEach((print, index) => {
      print.style.setProperty('--pile-position', index);
      print.tabIndex = index === prints.length - 1 ? 0 : -1;
      if (index === prints.length - 1) print.removeAttribute('aria-hidden');
      else print.setAttribute('aria-hidden', 'true');
    });
    const status = pile.querySelector('[data-pile-status]');
    if (status) status.textContent = prints[prints.length - 1].querySelector('img').alt;
  };
  const finishFlip = () => {
    window.clearTimeout(flipTimer);
    if (!flipping) return;
    flipping.classList.remove('is-flipping');
    stack.prepend(flipping);
    flipping = null;
    syncPrints();
  };
  if (stack && flip) {
    flip.hidden = false;
    flip.addEventListener('click', () => {
      finishFlip();
      flipping = stack.lastElementChild;
      if (!allowed()) { finishFlip(); return; }
      flipping.classList.add('is-flipping');
      flipTimer = window.setTimeout(finishFlip, 450);
    });
    stack.addEventListener('animationend', (event) => { if (event.animationName === 'print-flip') finishFlip(); });
    syncPrints();
  }
  const syncMotion = () => { if (!allowed()) { stopGust(); finishFlip(); } };
  motion.addEventListener('change', syncMotion);
  document.querySelector('#windIntensity')?.addEventListener('input', syncMotion);
  new MutationObserver(syncMotion).observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion'] });
  window.addEventListener('pagehide', () => { stopGust(); finishFlip(); });
})();
