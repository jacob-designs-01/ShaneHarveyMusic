// Film clip lightbox (Film & TV page) — no next/prev between clips
(() => {
  const clips = [...document.querySelectorAll('.film-card__clip:not(.external), .single__link:not(.external)')];
  if (!clips.length) return;

  const ICON_CLOSE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';

  const youtubeId = href => {
    try {
      const u = new URL(href, location.href);
      const host = u.hostname.replace(/^www\./, '');
      if (host === 'youtu.be') return u.pathname.split('/').filter(Boolean)[0] || null;
      if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
        if (u.searchParams.get('v')) return u.searchParams.get('v');
        const parts = u.pathname.split('/').filter(Boolean);
        const i = parts.findIndex(p => p === 'embed' || p === 'shorts' || p === 'live');
        if (i >= 0) return parts[i + 1] || null;
      }
    } catch { /* ignore */ }
    return null;
  };

  const isFile = href => /\.(mp4|webm|ogg|mov)(\?|#|$)/i.test(href);

  const resolve = href => {
    if (!href || href === '#' ) return null;
    const id = youtubeId(href);
    if (id) {
      return {
        type: 'youtube',
        src: `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`,
      };
    }
    if (isFile(href)) return { type: 'file', src: href };
    return null;
  };

  const dlg = document.createElement('dialog');
  dlg.className = 'lightbox lightbox--film';
  dlg.setAttribute('aria-label', 'Film clip');
  dlg.innerHTML = `
    <button class="lightbox__btn lightbox__close" type="button" aria-label="Close">${ICON_CLOSE}</button>
    <div class="lightbox__media"></div>`;
  document.body.append(dlg);

  const media = dlg.querySelector('.lightbox__media');

  const clear = () => {
    media.replaceChildren();
  };

  const open = (clip, title) => {
    clear();
    dlg.setAttribute('aria-label', title ? `Film clip: ${title}` : 'Film clip');

    if (clip.type === 'youtube') {
      const iframe = document.createElement('iframe');
      iframe.src = clip.src;
      iframe.title = title || 'Film clip';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      media.append(iframe);
    } else {
      const video = document.createElement('video');
      video.controls = true;
      video.playsInline = true;
      video.autoplay = true;
      video.title = title || 'Film clip';
      const source = document.createElement('source');
      source.src = clip.src;
      source.type = clip.src.endsWith('.webm') ? 'video/webm' : 'video/mp4';
      video.append(source);
      media.append(video);
      video.play().catch(() => {});
    }

    dlg.showModal();
    document.documentElement.classList.add('is-locked');
  };

  clips.forEach(link => {
    link.addEventListener('click', e => {
      const clip = resolve(link.getAttribute('href'));
      if (!clip) {
        if (!link.getAttribute('href') || link.getAttribute('href') === '#') e.preventDefault();
        return;
      }
      e.preventDefault();
      const title = link.closest('.film-card')?.querySelector('.film-card__title')?.textContent?.trim() || '';
      open(clip, title);
    });
  });

  dlg.addEventListener('close', () => {
    clear();
    document.documentElement.classList.remove('is-locked');
  });

  dlg.addEventListener('click', e => {
    if (e.target.closest('.lightbox__close')) return dlg.close();
    if (!e.target.closest('.lightbox__media')) dlg.close();
  });
})();
