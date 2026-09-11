/* Small, dependency-free motion layer. Decorations never intercept input. */
(() => {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  let layer;
  let observer;

  function burst(target, count = 10) {
    if (motion.matches || document.hidden || !target) return;
    const box = target.getBoundingClientRect();
    if (!layer?.isConnected) {
      layer = document.createElement('div');
      layer.className = 'magic-particles';
      layer.setAttribute('aria-hidden', 'true');
      document.body.append(layer);
    }
    // A hard cap keeps repeated taps inexpensive on mobile devices.
    count = Math.min(count, 60 - layer.childElementCount);
    for (let i = 0; i < count; i++) {
      const particle = document.createElement('i');
      const angle = Math.random() * Math.PI * 2;
      const distance = 35 + Math.random() * (count > 15 ? 190 : 65);
      particle.style.cssText = `left:${box.x + box.width / 2}px;top:${box.y + box.height / 2}px;--dx:${Math.cos(angle) * distance}px;--dy:${Math.sin(angle) * distance - 40}px;--spin:${Math.random() * 240}deg;--spark:${['#edb88c', '#dd8aaf', '#bba5ee', '#f6dca7'][i % 4]};animation-duration:${650 + Math.random() * 450}ms`;
      layer.append(particle);
      particle.addEventListener('animationend', () => particle.remove(), { once: true });
      setTimeout(() => particle.remove(), 1300);
    }
  }

  function reveal(root) {
    if (!root || motion.matches) return;
    observer?.disconnect();
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('magic-revealed');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08 });
    root.querySelectorAll('.magic-occasion, .magic-section-heading, .magic-draft, .home-letter-card, .magic-review-paper').forEach((el, i) => {
      el.style.setProperty('--reveal-delay', `${Math.min(i % 3, 2) * 80}ms`);
      observer.observe(el);
    });
  }

  let demoDialog;
  function preview(payload) {
    if (demoDialog?.open) return;
    const returnFocus = document.activeElement;
    const dialog = document.createElement('dialog');
    demoDialog = dialog;
    dialog.className = 'magic-dialog';
    dialog.setAttribute('aria-labelledby', 'magicDialogTitle');
    dialog.innerHTML = `<button type="button" class="magic-dialog-close" aria-label="Закрити перегляд">×</button>
      <span class="magic-eyebrow" id="magicDialogTitle">ТАК ПОЧИНАЄТЬСЯ МАЛЕНЬКЕ ДИВО</span>
      <div class="magic-dialog-stage"><button type="button" class="magic-demo-envelope" aria-label="Відкрити конверт"><span aria-hidden="true">♡</span><strong></strong><small>Торкнись, щоб відкрити</small></button></div>`;
    dialog.querySelector('.magic-demo-envelope strong').textContent = payload.recipient || 'Для тебе';
    document.body.append(dialog);
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.addEventListener('close', () => {
      document.body.style.overflow = oldOverflow;
      dialog.remove();
      demoDialog = null;
      if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
    }, { once: true });
    dialog.querySelector('.magic-dialog-close').onclick = () => dialog.close();
    dialog.addEventListener('click', event => {
      const rect = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
    });
    dialog.querySelector('.magic-demo-envelope').onclick = event => {
      const button = event.currentTarget;
      button.disabled = true;
      button.classList.add('is-opening');
      setTimeout(() => {
        if (!dialog.open) return;
        const stage = dialog.querySelector('.magic-dialog-stage');
        // Use the app's escaped renderer so user text remains text, not HTML.
        stage.innerHTML = previewLetter(payload, true);
        hydrateWordPortraits(stage, payload);
        const replay = document.createElement('button');
        replay.className = 'magic-secondary';
        replay.type = 'button';
        replay.textContent = 'Зберегти це відчуття';
        replay.onclick = () => dialog.close();
        stage.append(replay);
        replay.focus({ preventScroll: true });
        dialog.querySelector('#magicDialogTitle').textContent = 'КІЛЬКА СЛІВ. ЦІЛИЙ ВСЕСВІТ.';
      }, motion.matches ? 0 : 650);
    };
    dialog.showModal();
  }

  function demo() {
    preview({recipient:'Для тебе', letterTo:'Моїй особливій людині', letterTitle:'Ти робиш світ теплішим.',
      letterMessage:'Серед сотень повідомлень я хочу залишити тобі дещо інше.\n\nМаленьку паузу. Трохи тепла. Нагадування, що хтось усміхається, коли думає про тебе.\n\nІ цей хтось — я.',
      letterSign:'З ніжністю, я', letterFont:'classic', mediaEnabled:false, mediaMode:'none'});
  }

  window.LetterMagic = {
    reduced: () => motion.matches, burst, reveal, demo, preview,
    celebrate: () => requestAnimationFrame(() => burst(document.querySelector('.ma-ready-wax'), 38))
  };

  document.addEventListener('click', event => {
    const button = event.target.closest?.('.magic-primary, .magic-occasion, .mw-contact-card, #mwNextBtn, .recipient-choice-card');
    if (button && !button.disabled) burst(button);
  }, true);

  let frame = 0;
  document.addEventListener('pointermove', event => {
    if (!finePointer.matches || motion.matches) return;
    const art = event.target.closest?.('.magic-art');
    if (!art || frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      if (!art.isConnected) return;
      const rect = art.getBoundingClientRect();
      art.style.setProperty('--tilt-x', `${-(event.clientY - rect.y - rect.height / 2) / 45}deg`);
      art.style.setProperty('--tilt-y', `${(event.clientX - rect.x - rect.width / 2) / 45}deg`);
    });
  }, { passive: true });
  document.addEventListener('pointerout', event => {
    const art = event.target.closest?.('.magic-art');
    if (art && !art.contains(event.relatedTarget)) {
      art.style.setProperty('--tilt-x', '0deg');
      art.style.setProperty('--tilt-y', '0deg');
    }
  }, { passive: true });
  motion.addEventListener('change', () => { if (motion.matches) layer?.replaceChildren(); });
  document.addEventListener('visibilitychange', () => {
    document.documentElement.classList.toggle('magic-paused', document.hidden);
    if (document.hidden) layer?.replaceChildren();
  });
})();
