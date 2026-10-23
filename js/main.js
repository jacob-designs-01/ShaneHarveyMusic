// Mobile nav
const toggle = document.querySelector('.nav-toggle');
const nav = document.getElementById('nav');
if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
  });
}

// Players: add data-src="assets/audio/file.mp3" to any .track, .album-track or .single to make it play.
const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
let current = null;

document.querySelectorAll('.track, .album-track, .single').forEach(item => {
  const btn = item.querySelector('.track__play');
  const fill = item.querySelector('.track__fill');
  const bar = item.querySelector('.track__bar');
  const time = item.querySelector('.track__time');
  let audio = null;
  if (!btn) return;

  btn.addEventListener('click', () => {
    const src = item.dataset.src;
    if (!src) return; // no audio file wired up yet
    if (!audio) {
      audio = new Audio(src);
      audio.preload = 'none';
      audio.addEventListener('loadedmetadata', () => { if (time) time.textContent = fmt(audio.duration); });

      // Update remaining time as the audio plays
      audio.addEventListener('timeupdate', () => {
        const remaining = Math.max(0, (audio.duration || 0) - audio.currentTime);
        if (time && audio.duration) {
          time.textContent = fmt(remaining);
        }

        const pct = (audio.currentTime / audio.duration) * 100 || 0;
        if (fill) fill.style.width = pct + '%';
        if (bar) bar.setAttribute('aria-valuenow', Math.round(pct));
      });
      audio.addEventListener('ended', () => item.classList.remove('is-playing'));
      audio.addEventListener('pause', () => item.classList.remove('is-playing'));
      audio.addEventListener('play', () => {
        item.classList.add('is-playing');
        if (item.classList.contains('album-track')) {
          document.querySelectorAll('.album-track.is-active').forEach(el => el.classList.remove('is-active'));
          item.classList.add('is-active');
        }
      });
    }
    if (current && current !== audio) current.pause();
    current = audio;
    audio.paused ? audio.play() : audio.pause();
  });

  if (bar) {
    let seeking = false;

    const seek = (e) => {
      if (!audio || !audio.duration) return;
      const r = bar.getBoundingClientRect();
      
      if (current && current !== audio) current.pause();
      current = audio;
      if (audio.paused) audio.play();
      
      // Support both touch and mouse events
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      let pct = (clientX - r.left) / r.width;
      pct = Math.max(0, Math.min(1, pct));
      audio.currentTime = pct * audio.duration;
    };

    bar.addEventListener('mousedown', (e) => {
      if (!audio || !audio.duration) return;
      seeking = true;
      seek(e);
      document.body.style.userSelect = 'none';
    });

    bar.addEventListener('touchstart', (e) => {
      if (!audio || !audio.duration) return;
      seeking = true;
      seek(e);
      document.body.style.userSelect = 'none';
      e.preventDefault();
    }, { passive: false });

    window.addEventListener('mousemove', (e) => {
      if (!seeking) return;
      seek(e);
    });

    window.addEventListener('touchmove', (e) => {
      if (!seeking) return;
      seek(e);
      e.preventDefault();
    }, { passive: false });

    window.addEventListener('mouseup', () => {
      if (seeking) {
        seeking = false;
        document.body.style.userSelect = '';
      }
    });

    window.addEventListener('touchend', () => {
      if (seeking) {
        seeking = false;
        document.body.style.userSelect = '';
      }
    });
  }
});

// "Play full album" starts the first track
document.querySelectorAll('[data-play-album]').forEach(b =>
  b.addEventListener('click', () => document.querySelector('.album-track .track__play')?.click())
);

// "See all tracks" reveals any tracks marked with the hidden attribute
document.querySelectorAll('[data-toggle-tracks]').forEach(b =>
  b.addEventListener('click', () => {
    const list = document.querySelector(b.dataset.toggleTracks);
    const open = b.getAttribute('aria-expanded') === 'true';
    console.log(b.dataset);
    console.log(list);
    list.querySelectorAll('.album-track[data-extra]').forEach(t => { t.hidden = open; });
    b.setAttribute('aria-expanded', String(!open));
    b.textContent = open ? 'See all tracks' : 'Show fewer tracks';
  })
);

// "Read More" reveals the bio pargraphs marked with the hidden attribute
document.querySelectorAll('[data-toggle-bio]').forEach(b =>
  b.addEventListener('click', () => {
    const list = document.querySelector(b.dataset.toggleBio);
    const open = b.getAttribute('aria-expanded') === 'true';
    console.log(b);
    console.log(list);
    list.querySelectorAll('.bio__copy p[data-extra]').forEach(t => { t.hidden = open; });
    b.setAttribute('aria-expanded', String(!open));
    b.textContent = open ? 'Read More' : 'Read Less';
  })
);

// "See All Highlights" reveals the highlights marked with the hidden attribute
document.querySelectorAll('[data-toggle-highlights]').forEach(b =>
  b.addEventListener('click', () => {
    const list = document.querySelector(b.dataset.toggleHighlights);
    const open = b.getAttribute('aria-expanded') === 'true';
    console.log(b);
    console.log(list);
    list.querySelectorAll('.highlights__list article[data-extra]').forEach(t => { t.hidden = open; });
    b.setAttribute('aria-expanded', String(!open));
    b.textContent = open ? 'See All Highlights' : 'See Less Highlights';
  })
);

// ---------- Contact card ----------
// Edit the details here once; the popup on every page and contact.html all use them.
const CONTACT = {
  name: 'Shane Harvey',
  role: 'Composer',
  tagline: 'Film · Television · Advertising',
  phone: '+48 577 953 260',
  email: 'shaneharveymusic@gmail.com',
  website: 'shaneharveymusic.com',
  bluesky: '@shaneharvey.bsky.social',
};

const standalone = document.body.hasAttribute('data-contact-standalone');
const X_ICON = '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M9 9l14 14M23 9 9 23"/></svg>';
let contactDialog = null;

function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
  return new Promise((resolve, reject) => {
    const ta = Object.assign(document.createElement('textarea'), { value: text });
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.append(ta);
    ta.select();
    document.execCommand('copy') ? resolve() : reject();
    ta.remove();
  });
}

function saveVcard() {
  const c = CONTACT;
  const lines = [
    'BEGIN:VCARD', 'VERSION:3.0',
    `FN:${c.name}`, `N:${c.name.split(' ').reverse().join(';')};;;`,
    `TITLE:${c.role}`, `TEL:${c.phone}`, `EMAIL:${c.email}`,
    `URL:https://${c.website}`, `URL:https://bsky.app/profile/${c.bluesky.replace('@', '')}`,
    'END:VCARD',
  ];
  const url = URL.createObjectURL(new Blob([lines.join('\r\n')], { type: 'text/vcard' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: 'shane-harvey.vcf' });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function buildContact() {
  const c = CONTACT;
  const rows = [
    ['Phone', c.phone, `tel:${c.phone.replace(/[^+\d]/g, '')}`, ''],
    ['Email', c.email, `mailto:${c.email}`, ''],
    ['Website', c.website, `https://${c.website}`, ' target="_blank" rel="noopener"'],
    ['Bluesky', c.bluesky, `https://bsky.app/profile/${c.bluesky.replace('@', '')}`, ' target="_blank" rel="noopener"'],
  ];
  const d = document.createElement('dialog');
  d.className = 'contact-dialog';
  d.setAttribute('aria-labelledby', 'contact-title');
  d.innerHTML = `
    <div class="contact-card">
      <button class="contact-card__close" type="button" data-close aria-label="Close">${X_ICON}</button>
      <div class="contact-card__banner">
        <div class="media-fade contact-card__media">
          <img src="../assets/img/contact-portrait.jpg" alt="">
        </div>
      </div>
      <div class="contact-card__body">
        <div class="contact-card__id">
          <div>
            <h2 class="contact-card__name" id="contact-title">${c.name}</h2>
            <p class="contact-card__role">${c.role}</p>
          </div>
          <p class="contact-card__tagline">${c.tagline}</p>
        </div>
        ${rows.map(([label, value, href, extra]) => `
        <div class="contact-row">
          <div>
            <p class="contact-row__label">${label}</p>
            <a class="contact-row__value" href="${href}"${extra}>${value}</a>
          </div>
          <button class="contact-copy" type="button" data-copy="${value}" aria-label="Copy ${label.toLowerCase()}">Copy</button>
        </div>`).join('')}
        <div class="contact-actions">
          <button class="btn btn--primary" type="button" data-save>Save to contacts</button>
          <button class="btn btn--outline" type="button" data-qr aria-expanded="false">Show QR</button>
        </div>
        <div class="contact-qr" hidden>
          <img src="../assets/svg/contact-qr.svg" alt="QR code linking to this contact card" width="200" height="200">
          <p>Scan to open this card on your phone</p>
        </div>
        <p class="sr-only" role="status" aria-live="polite" data-status></p>
      </div>
    </div>`;

  d.addEventListener('click', e => {
    if (e.target === d) { if (!standalone) d.close(); return; } // backdrop click
    if (e.target.closest('[data-close]')) return d.close();
    if (e.target.closest('[data-save]')) return saveVcard();
    const qr = e.target.closest('[data-qr]');
    if (qr) {
      const panel = d.querySelector('.contact-qr');
      panel.hidden = !panel.hidden;
      qr.textContent = panel.hidden ? 'Show QR' : 'Hide QR';
      qr.setAttribute('aria-expanded', String(!panel.hidden));
      return;
    }
    const copy = e.target.closest('[data-copy]');
    if (copy) {
      copyText(copy.dataset.copy).then(() => {
        copy.textContent = 'Copied';
        d.querySelector('[data-status]').textContent = `${copy.dataset.copy} copied to clipboard`;
        setTimeout(() => { copy.textContent = 'Copy'; }, 1600);
      }).catch(() => { });
    }
  });
  d.addEventListener('close', () => {
    document.documentElement.classList.remove('is-locked');
    if (standalone) location.href = 'index.html'; // nothing behind the card, so go home
  });
  document.body.append(d);
  return d;
}

function openContact() {
  contactDialog ||= buildContact();
  if (contactDialog.open) return;
  nav?.classList.remove('is-open');
  toggle?.setAttribute('aria-expanded', 'false');
  contactDialog.showModal();
  document.documentElement.classList.add('is-locked');
}

document.addEventListener('click', e => {
  if (e.target.closest('[data-open-contact]')) openContact();
});
if (standalone) openContact();
