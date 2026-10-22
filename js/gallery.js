// Mosaic gallery lightbox (About page)
(() => {
  const items = [...document.querySelectorAll('.gallery__item')];
  if (!items.length) return;

  const ICON = {
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    prev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
    next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
  };

  const dlg = document.createElement('dialog');
  dlg.className = 'lightbox';
  dlg.setAttribute('aria-label', 'Photo viewer');
  dlg.innerHTML = `
    <button class="lightbox__btn lightbox__close" type="button" aria-label="Close">${ICON.close}</button>
    <button class="lightbox__btn lightbox__prev" type="button" aria-label="Previous photo">${ICON.prev}</button>
    <figure class="lightbox__figure">
      <img class="lightbox__img" alt="">
      <figcaption class="lightbox__count" aria-live="polite"></figcaption>
    </figure>
    <button class="lightbox__btn lightbox__next" type="button" aria-label="Next photo">${ICON.next}</button>`;
  document.body.append(dlg);

  const img = dlg.querySelector('.lightbox__img');
  const count = dlg.querySelector('.lightbox__count');
  let index = 0;

  const src = i => items[i].querySelector('img');
  const getLargeImgSrc = el => {
    // Transform thumbnail src to large image src
    //   ../assets/img/gallery-small/12.webp
    // → ../assets/img/gallery-large/12.webp
    return el.src.replace('gallery-small', 'gallery-large');
  };
  const show = i => {
    index = (i + items.length) % items.length;
    const el = src(index);
    img.src = getLargeImgSrc(el);
    img.alt = el.alt;
    count.textContent = `${index + 1} / ${items.length}`;
    // warm the cache for neighbours
    [index - 1, index + 1].forEach(n => {
      const neighbor = src((n + items.length) % items.length);
      new Image().src = getLargeImgSrc(neighbor);
    });
  };
  const open = i => {
    show(i);
    dlg.showModal();
    document.documentElement.classList.add('is-locked');
  };

  items.forEach((btn, i) => btn.addEventListener('click', () => open(i)));
  dlg.addEventListener('close', () => document.documentElement.classList.remove('is-locked'));

  dlg.addEventListener('click', e => {
    if (e.target.closest('.lightbox__close')) return dlg.close();
    if (e.target.closest('.lightbox__prev')) return show(index - 1);
    if (e.target.closest('.lightbox__next')) return show(index + 1);
    if (!e.target.closest('.lightbox__img')) dlg.close(); // click on the dark area
  });
  dlg.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') show(index - 1);
    if (e.key === 'ArrowRight') show(index + 1);
  });

  // swipe on touch screens
  let startX = null;
  img.addEventListener('pointerdown', e => { startX = e.clientX; });
  img.addEventListener('pointerup', e => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    startX = null;
    if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
  });
})();
