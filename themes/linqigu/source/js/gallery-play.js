(() => {
  'use strict';
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const motionAllowed = () => !motion.matches && document.documentElement.dataset.motion !== 'reduced';
  const running = new Map();
  const stopDeveloping = (element) => {
    if (running.has(element)) window.clearTimeout(running.get(element));
    running.delete(element);
    element.classList.remove('is-developing');
    element.style.removeProperty('--develop-delay');
  };
  const develop = (element, delay = 0) => {
    stopDeveloping(element);
    if (!motionAllowed()) return;
    // Restart a finite filter animation without hiding the underlying image.
    void element.offsetWidth;
    element.style.setProperty('--develop-delay', `${delay}ms`);
    element.classList.add('is-developing');
    running.set(element, window.setTimeout(() => stopDeveloping(element), delay + 950));
  };

  document.querySelectorAll('[data-gallery-proof]').forEach((proof) => {
    const album = proof.closest('[data-gallery-album]');
    const image = album?.querySelector('.gallery-album-cover > img');
    const choices = [...proof.querySelectorAll('[data-gallery-cover-src]')];
    const cycle = proof.querySelector('[data-gallery-cover-cycle]');
    const status = proof.querySelector('[data-gallery-proof-status]');
    if (!album || !image || !choices.length) return;
    proof.hidden = false;
    const select = (choice) => {
      image.src = choice.dataset.galleryCoverSrc;
      image.alt = choice.dataset.galleryCoverAlt || '';
      choices.forEach((item) => item.setAttribute('aria-pressed', String(item === choice)));
      if (status) status.textContent = `已更换${choice.getAttribute('aria-label') || '封面'}`;
      if (image.complete) develop(album);
      else image.addEventListener('load', () => develop(album), { once: true });
    };
    choices.forEach((choice) => choice.addEventListener('click', () => select(choice)));
    proof.querySelector('.gallery-proof__frames')?.addEventListener('keydown', (event) => {
      const current = choices.indexOf(event.target);
      if (current < 0 || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const index = event.key === 'Home' ? 0 : event.key === 'End' ? choices.length - 1
        : (current + (event.key === 'ArrowRight' ? 1 : -1) + choices.length) % choices.length;
      choices[index].focus();
      select(choices[index]);
    });
    if (cycle) {
      cycle.disabled = choices.length < 2;
      cycle.addEventListener('click', () => {
        const candidates = choices.filter((item) => item.getAttribute('aria-pressed') !== 'true');
        if (candidates.length) select(candidates[Math.floor(Math.random() * candidates.length)]);
      });
    }
  });

  const grid = document.querySelector('#galleryGrid');
  const tools = document.querySelector('[data-gallery-play-tools]');
  const status = document.querySelector('[data-gallery-play-status]');
  const developButton = tools?.querySelector('[data-gallery-develop]');
  const shuffleButton = tools?.querySelector('[data-gallery-shuffle]');
  const visiblePhotos = () => grid ? [...grid.querySelectorAll('[data-gallery-photo]')].filter((item) => !item.hidden) : [];
  const updateTools = () => {
    if (!grid || !tools) return;
    const visible = visiblePhotos();
    if (shuffleButton) shuffleButton.disabled = visible.length < 2;
    if (developButton) {
      developButton.disabled = !visible.length || !motionAllowed();
      developButton.title = motionAllowed() ? '重新播放显影效果' : '减少动态效果已开启';
    }
  };
  if (grid && tools) {
    tools.hidden = false;
    if (status) status.hidden = false;
    developButton?.addEventListener('click', () => {
      const photos = visiblePhotos();
      photos.forEach((photo, index) => develop(photo, Math.min(index * 65, 390)));
      if (status) status.textContent = `重新显影 ${photos.length} 张。`;
    });
    shuffleButton?.addEventListener('click', () => {
      const visible = visiblePhotos();
      if (visible.length < 2) return;
      const shuffled = [...visible];
      for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const swap = Math.floor(Math.random() * (index + 1));
        [shuffled[index], shuffled[swap]] = [shuffled[swap], shuffled[index]];
      }
      if (shuffled.every((photo, index) => photo === visible[index])) shuffled.push(shuffled.shift());
      // Move the existing figures so filtering, grid/list and lightbox handlers survive.
      shuffled.forEach((photo) => grid.appendChild(photo));
      shuffled.forEach((photo, index) => develop(photo, Math.min(index * 45, 270)));
      if (status) status.textContent = `已打乱 ${visible.length} 张照片的顺序。`;
    });
    document.querySelector('#gallerySearch')?.addEventListener('input', updateTools);
    document.querySelectorAll('[data-gallery-filter]').forEach((filter) => filter.addEventListener('click', updateTools));
    updateTools();
  }

  const stacks = [...document.querySelectorAll('[data-photo-stack]')];
  const resetStack = (stack) => ['--stack-x', '--stack-y', '--stack-turn'].forEach((name) => stack.style.removeProperty(name));
  stacks.forEach((stack) => {
    stack.addEventListener('pointermove', (event) => {
      if (!motionAllowed() || !finePointer.matches) { resetStack(stack); return; }
      const box = stack.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width - .5;
      const y = (event.clientY - box.top) / box.height - .5;
      stack.style.setProperty('--stack-x', `${x * -13}px`);
      stack.style.setProperty('--stack-y', `${y * -7}px`);
      stack.style.setProperty('--stack-turn', `${Math.abs(x) * 9}deg`);
    }, { passive: true });
    stack.addEventListener('pointerleave', () => resetStack(stack));
    stack.addEventListener('blur', () => resetStack(stack));
  });
  const syncMotion = () => {
    if (!motionAllowed()) [...running.keys()].forEach(stopDeveloping);
    stacks.forEach(resetStack);
    updateTools();
  };
  motion.addEventListener('change', syncMotion);
  finePointer.addEventListener('change', syncMotion);
  document.querySelector('#windIntensity')?.addEventListener('input', syncMotion);
  if ('MutationObserver' in window) new MutationObserver(syncMotion).observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion'] });
})();
