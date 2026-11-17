function initClipPlayer(){
  const cards = Array.from(document.querySelectorAll('.clip-card'));
  if(!cards.length || document.querySelector('.clip-player')) return;

  const collect = () => cards.map((card) => {
    const video = card.querySelector('.clip-video');
    const caption = card.querySelector('.clip-caption');
    return {
      card,
      src: video ? video.getAttribute('src') : '',
      type: video ? (video.getAttribute('type') || '') : '',
      isVertical: card.classList.contains('is-vertical'),
      caption: caption ? caption.textContent.trim() : ''
    };
  });

  const overlay = document.createElement('div');
  overlay.className = 'clip-player';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');
  overlay.setAttribute('aria-label','Просмотр видео');
  overlay.innerHTML = '<div class="clip-player-stage"><button class="clip-player-close" type="button" aria-label="Закрыть просмотр">×</button><button class="clip-player-nav prev" type="button" aria-label="Предыдущее видео">‹</button><video class="clip-player-video" controls playsinline preload="metadata"></video><button class="clip-player-nav next" type="button" aria-label="Следующее видео">›</button><span class="clip-player-counter"></span></div>';
  overlay.hidden = true;
  document.body.appendChild(overlay);

  const stage = overlay.querySelector('.clip-player-stage');
  const player = overlay.querySelector('.clip-player-video');
  const counter = overlay.querySelector('.clip-player-counter');
  const closeBtn = overlay.querySelector('.clip-player-close');
  const prevBtn = overlay.querySelector('.clip-player-nav.prev');
  const nextBtn = overlay.querySelector('.clip-player-nav.next');

  let items = [];
  let index = 0;
  let lastFocus = null;
  let touchStartX = 0;

  const paint = (position) => {
    const item = items[position];
    player.classList.toggle('is-vertical', item.isVertical);
    player.src = item.src;
    if(item.type) player.setAttribute('type', item.type); else player.removeAttribute('type');
    counter.textContent = `${position + 1} / ${items.length}`;
  };

  const show = (delta) => {
    const current = player.currentTime;
    player.pause();
    index = (index + delta + items.length) % items.length;
    paint(index);
    if(current > 0) player.currentTime = current;
    player.play().catch(() => {});
  };

  const open = (card) => {
    items = collect();
    const position = items.findIndex((item) => item.card === card);
    if(position < 0 || !items[position].src) return;
    lastFocus = document.activeElement;
    index = position;
    overlay.hidden = false;
    document.body.classList.add('clip-player-locked');
    paint(index);
    closeBtn.focus({ preventScroll: true });
    player.play().catch(() => {});
  };

  const close = () => {
    if(overlay.hidden) return;
    player.pause();
    player.removeAttribute('src');
    player.load();
    overlay.hidden = true;
    document.body.classList.remove('clip-player-locked');
    if(lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  };

  cards.forEach((card) => {
    card.tabIndex = 0;
    card.setAttribute('role','button');
    const caption = card.querySelector('.clip-caption');
    const video = card.querySelector('.clip-video');
    card.setAttribute('aria-label', `Открыть видео: ${caption ? caption.textContent.trim() : (video ? (video.getAttribute('alt') || 'Клип') : 'Клип')}`);
    card.addEventListener('click', () => open(card));
    card.addEventListener('keydown', (event) => {
      if(event.key === 'Enter' || event.key === ' '){ event.preventDefault(); open(card); }
    });
  });

  prevBtn.addEventListener('click', (event) => { event.stopPropagation(); show(-1); });
  nextBtn.addEventListener('click', (event) => { event.stopPropagation(); show(1); });
  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', (event) => { if(event.target === overlay || event.target === stage) close(); });

  document.addEventListener('keydown', (event) => {
    if(overlay.hidden) return;
    if(event.key === 'Escape') close();
    else if(event.key === 'ArrowLeft') show(-1);
    else if(event.key === 'ArrowRight') show(1);
  });

  overlay.addEventListener('touchstart', (event) => { touchStartX = event.changedTouches[0].clientX; }, { passive: true });
  overlay.addEventListener('touchend', (event) => {
    const delta = event.changedTouches[0].clientX - touchStartX;
    if(Math.abs(delta) > 40) show(delta < 0 ? 1 : -1);
  }, { passive: true });
}

document.addEventListener('DOMContentLoaded', initClipPlayer);