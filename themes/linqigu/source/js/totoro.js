(() => {
  const track = document.querySelector('.home-totoro-track');
  const walker = track?.querySelector('.home-totoro-walker');
  const sprite = walker?.querySelector('#homeTotoro');
  if (!track || !walker || !sprite) return;

  const root = document.documentElement;
  const motionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
  const speed = 24;
  const rampSeconds = .7;
  const strideSeconds = 1.8;
  const turnSeconds = 2.2;
  const endpointPause = .4;
  const inset = 6;
  const restFrame = 113;
  const phases = [
    { name: 'walk-right', kind: 'walk', direction: 1 },
    { name: 'settle-right', kind: 'hold', side: 1, frame: 0 },
    { name: 'turn-left', kind: 'turn', side: 1, direction: 1 },
    { name: 'ready-left', kind: 'hold', side: 1, frame: 32 },
    { name: 'walk-left', kind: 'walk', direction: -1 },
    { name: 'settle-left', kind: 'hold', side: 0, frame: 32 },
    { name: 'turn-right', kind: 'turn', side: 0, direction: -1 },
    { name: 'ready-right', kind: 'hold', side: 0, frame: 0 },
  ];
  let distance = 0;
  let legSeconds = 0;
  let ramp = 0;
  let cycles = 1;
  let phaseIndex = 0;
  let elapsed = 0;
  let lastTimestamp = null;
  let requestId = null;
  let currentFrame = -1;
  let currentPosition = null;
  let reduced = null;
  let inViewport = false;

  // Integrating velocity, rather than easing screen coordinates, gives both
  // directions the same 24px/s cruise and a planted, symmetric slowdown.
  const travelled = (seconds) => {
    if (distance <= 0 || seconds <= 0) return 0;
    if (seconds >= legSeconds) return distance;
    if (seconds < ramp) return speed * seconds * seconds / (2 * ramp);
    if (seconds > legSeconds - ramp) {
      const remaining = legSeconds - seconds;
      return distance - speed * remaining * remaining / (2 * ramp);
    }
    return speed * (seconds - ramp / 2);
  };

  const secondsAtDistance = (position) => {
    const rampDistance = speed * ramp / 2;
    if (position <= rampDistance) return Math.sqrt(2 * ramp * position / speed);
    if (position >= distance - rampDistance) {
      return legSeconds - Math.sqrt(2 * ramp * (distance - position) / speed);
    }
    return position / speed + ramp / 2;
  };

  const setFrame = (frame) => {
    if (frame === currentFrame) return;
    currentFrame = frame;
    sprite.style.backgroundPosition = `${frame % 8 * 100 / 7}% ${Math.floor(frame / 8) * 100 / 14}%`;
    walker.dataset.frame = String(frame);
  };

  const setPosition = (position) => {
    const next = Math.round(Math.max(0, Math.min(distance, position)) * 1000) / 1000;
    if (next === currentPosition) return;
    currentPosition = next;
    walker.style.transform = `translate3d(${next}px, 0, 0)`;
  };

  const phaseDuration = (phase) => phase.kind === 'walk'
    ? legSeconds
    : phase.kind === 'turn' ? turnSeconds : endpointPause / 2;

  const render = () => {
    const phase = phases[phaseIndex];
    walker.dataset.phase = phase.name;
    if (phase.kind === 'walk') {
      const progress = distance > 0 ? travelled(elapsed) / distance : 0;
      setPosition((phase.direction === 1 ? progress : 1 - progress) * distance);
      // Whole strides end in the neutral pose used by the turn endpoints.
      const frame = Math.round(progress * cycles * 32) % 32;
      setFrame((phase.direction === 1 ? 0 : 32) + frame);
      return;
    }
    setPosition(phase.side * distance);
    if (phase.kind === 'hold') {
      setFrame(phase.frame);
      return;
    }
    const progress = Math.max(0, Math.min(1, elapsed / turnSeconds));
    const eased = progress * progress * (3 - 2 * progress);
    const turnFrame = Math.round(eased * 48);
    setFrame(64 + (phase.direction === 1 ? turnFrame : 48 - turnFrame));
  };

  const showRest = () => {
    walker.dataset.phase = 'rest';
    setPosition(0);
    setFrame(restFrame);
  };

  const stop = () => {
    if (requestId !== null) cancelAnimationFrame(requestId);
    requestId = null;
    lastTimestamp = null;
  };

  const canRun = () => !reduced && inViewport && !document.hidden && distance > 0;

  const tick = (timestamp) => {
    requestId = null;
    if (!track.isConnected || !canRun()) {
      lastTimestamp = null;
      return;
    }
    if (lastTimestamp !== null) elapsed += Math.min((timestamp - lastTimestamp) / 1000, .08);
    lastTimestamp = timestamp;
    let duration = phaseDuration(phases[phaseIndex]);
    while (elapsed >= duration) {
      elapsed -= duration;
      phaseIndex = (phaseIndex + 1) % phases.length;
      duration = phaseDuration(phases[phaseIndex]);
    }
    render();
    requestId = requestAnimationFrame(tick);
  };

  const sync = () => {
    const nextReduced = root.dataset.motion === 'reduced' || motionMedia.matches;
    if (nextReduced !== reduced) {
      reduced = nextReduced;
      stop();
      if (reduced) {
        phaseIndex = 0;
        elapsed = 0;
        showRest();
      }
    }
    if (!canRun()) {
      stop();
      walker.dataset.motionState = reduced ? 'reduced' : distance <= 0 ? 'static' : 'paused';
      if (distance <= 0) showRest();
      return;
    }
    walker.dataset.motionState = 'running';
    if (requestId === null) requestId = requestAnimationFrame(tick);
  };

  const measure = () => {
    const phase = phases[phaseIndex];
    const progress = phase.kind === 'walk' && distance > 0 ? travelled(elapsed) / distance : 0;
    const nextDistance = Math.max(0, track.clientWidth - walker.getBoundingClientRect().width - inset * 2);
    if (Math.abs(nextDistance - distance) < .1) return;
    distance = nextDistance;
    ramp = Math.min(rampSeconds, distance / speed);
    legSeconds = distance / speed + ramp;
    cycles = Math.max(1, Math.round(distance / (speed * strideSeconds)));
    if (phase.kind === 'walk') elapsed = distance > 0 ? secondsAtDistance(progress * distance) : 0;
    if (reduced) showRest();
    else if (distance > 0) render();
    else showRest();
    sync();
  };

  const checkViewport = () => {
    const rect = track.getBoundingClientRect();
    inViewport = rect.bottom > 0 && rect.top < window.innerHeight
      && rect.right > 0 && rect.left < window.innerWidth;
    sync();
  };

  walker.style.left = `${inset}px`;
  showRest();
  measure();
  walker.dataset.ready = 'true';
  checkViewport();

  if ('ResizeObserver' in window) {
    const resizeObserver = new ResizeObserver(() => { measure(); checkViewport(); });
    resizeObserver.observe(track);
    resizeObserver.observe(walker);
  } else {
    window.addEventListener('resize', () => { measure(); checkViewport(); }, { passive: true });
  }
  if ('IntersectionObserver' in window) {
    const intersectionObserver = new IntersectionObserver((entries) => {
      inViewport = entries.some((entry) => entry.isIntersecting && entry.intersectionRatio > 0);
      sync();
    });
    intersectionObserver.observe(track);
  } else {
    window.addEventListener('scroll', checkViewport, { passive: true });
    window.addEventListener('resize', checkViewport, { passive: true });
  }
  new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ['data-motion'] });
  motionMedia.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('pageshow', () => { measure(); checkViewport(); });
})();
