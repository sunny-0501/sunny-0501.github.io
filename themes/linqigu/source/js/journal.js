(() => {
  const scene = document.querySelector('.voyage-hero');
  if (!scene) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const reset = () => { scene.style.removeProperty('--drift-x'); scene.style.removeProperty('--drift-y'); };
  scene.addEventListener('pointermove', (event) => {
    if (reduced.matches || !finePointer.matches || document.documentElement.dataset.motion === 'reduced') { reset(); return; }
    const box = scene.getBoundingClientRect();
    scene.style.setProperty('--drift-x', `${((event.clientX - box.left) / box.width - .5) * 9}px`);
    scene.style.setProperty('--drift-y', `${((event.clientY - box.top) / box.height - .5) * 6}px`);
  }, { passive: true });
  scene.addEventListener('pointerleave', reset);
  reduced.addEventListener('change', reset);
  document.querySelector('#windIntensity')?.addEventListener('input', reset);
})();
