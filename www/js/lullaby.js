// Fun Lingo — lullabies
// A calm night sky: twinkling stars, a sleepy moon, drifting clouds. Four songs, each
// sung in the language spoken at home (the comfort language at bedtime), with the
// language the child is learning shown softly underneath. The words glow line by line (with the
// home-language meaning underneath). Once a song is tapped, the next one follows by
// itself; after the last one the room dims softly.

import * as THREE from 'three';
import { stopSpeech } from './speech.js?v=2';
import { sticker } from './art.js?v=3';
import { t, homeLanguage, learnLanguage } from './ui.js?v=2';
import { countUp } from './parent.js?v=2';

const INTRO = 7, VERSE = 26, BREAK = 6;            // seconds, same shape as tools/audio/make_lullabies.py
const ICONS = {
  star: '<svg viewBox="0 0 24 24"><path d="M12 2.8l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 16.8 6.6 19.7l1-6.1L3.2 9.3l6.1-.9z" fill="#ffd23f" stroke="#2b2150" stroke-width="1.3" stroke-linejoin="round"/></svg>',
  moon: '<svg viewBox="0 0 24 24"><path d="M15.5 3.5a8.5 8.5 0 1 0 5 13.6A7 7 0 0 1 15.5 3.5z" fill="#fff0a3" stroke="#2b2150" stroke-width="1.3" stroke-linejoin="round"/></svg>',
  pets: '<svg viewBox="0 0 24 24"><ellipse cx="12" cy="16" rx="5" ry="4" fill="#ffb26b" stroke="#2b2150" stroke-width="1.2"/><circle cx="6" cy="10.5" r="2.2" fill="#ffb26b" stroke="#2b2150" stroke-width="1.2"/><circle cx="18" cy="10.5" r="2.2" fill="#ffb26b" stroke="#2b2150" stroke-width="1.2"/><circle cx="9.3" cy="6.6" r="2.2" fill="#ffb26b" stroke="#2b2150" stroke-width="1.2"/><circle cx="14.7" cy="6.6" r="2.2" fill="#ffb26b" stroke="#2b2150" stroke-width="1.2"/></svg>',
  rain: '<svg viewBox="0 0 24 24"><path d="M7 15h10a4 4 0 0 0 .5-8 5.5 5.5 0 0 0-10.6 1.2A3.4 3.4 0 0 0 7 15z" fill="#fff" stroke="#2b2150" stroke-width="1.3"/><path d="M8 18l-1 2.5M12 18l-1 2.5M16 18l-1 2.5" stroke="#4cc3ff" stroke-width="1.8" stroke-linecap="round"/></svg>',
  owl: '<svg viewBox="0 0 24 24"><ellipse cx="12" cy="13.5" rx="7" ry="8" fill="#b08968" stroke="#2b2150" stroke-width="1.2"/><path d="M5.5 7l2 2.5M18.5 7l-2 2.5" stroke="#2b2150" stroke-width="1.4" stroke-linecap="round"/><circle cx="9.3" cy="11.5" r="2.6" fill="#fff" stroke="#2b2150" stroke-width="1"/><circle cx="14.7" cy="11.5" r="2.6" fill="#fff" stroke="#2b2150" stroke-width="1"/><circle cx="9.5" cy="11.7" r="1.1" fill="#2b2150"/><circle cx="14.5" cy="11.7" r="1.1" fill="#2b2150"/><path d="M11 14l1 1.4 1-1.4z" fill="#ffb703"/><ellipse cx="12" cy="17.5" rx="3.6" ry="2.6" fill="#ede0d4"/></svg>',
  flower: '<svg viewBox="0 0 24 24"><path d="M12 13v8" stroke="#2fbf4a" stroke-width="2" stroke-linecap="round"/><ellipse cx="9" cy="18" rx="2.6" ry="1.3" fill="#4fd36a" transform="rotate(-30 9 18)"/><g fill="#ff8fc1" stroke="#2b2150" stroke-width="1"><circle cx="12" cy="5.5" r="3"/><circle cx="16.3" cy="8.8" r="3"/><circle cx="14.6" cy="13.5" r="3"/><circle cx="9.4" cy="13.5" r="3"/><circle cx="7.7" cy="8.8" r="3"/></g><circle cx="12" cy="10" r="2.6" fill="#ffd23f" stroke="#2b2150" stroke-width="1"/></svg>',
  roof: '<svg viewBox="0 0 24 24"><path d="M3 12l9-7 9 7" fill="#ff8a5c" stroke="#2b2150" stroke-width="1.3" stroke-linejoin="round"/><rect x="6" y="11.5" width="12" height="9" rx="1" fill="#ffe8b8" stroke="#2b2150" stroke-width="1.2"/><rect x="10" y="14.5" width="4" height="6" fill="#ff8fc1"/><path d="M5 2.5l-1 2M10 1.5l-1 2M16 1.5l-1 2M21 2.5l-1 2" stroke="#4cc3ff" stroke-width="1.6" stroke-linecap="round"/></svg>',
  family: '<svg viewBox="0 0 24 24"><circle cx="7" cy="8" r="3" fill="#ffcda4" stroke="#2b2150" stroke-width="1.1"/><circle cx="17" cy="8" r="3" fill="#f2b48a" stroke="#2b2150" stroke-width="1.1"/><circle cx="12" cy="12.5" r="2.4" fill="#ffd9bc" stroke="#2b2150" stroke-width="1.1"/><path d="M2.5 21c0-4 2-6.5 4.5-6.5S11 17 11 21zM13 21c0-4 1.5-6.5 4-6.5s4.5 2.5 4.5 6.5z" fill="#ff5fa2" stroke="#2b2150" stroke-width="1.1"/><path d="M12 4.5c-1.4-1.3-3 .3-1.6 1.5L12 7.5l1.6-1.5c1.4-1.2-.2-2.8-1.6-1.5z" fill="#ff3b6b"/></svg>',
};

export function startLullaby(app) {
  // songs are sung in the home language; the learning language is the small line underneath
  const lang = homeLanguage(), home = learnLanguage();
  const bilingual = home && home !== lang;
  const ui = document.getElementById('lullaby-ui');
  const cleanups = [], timers = [];
  let gone = false, raf = 0, audio = null;
  const on = (el, ev, fn) => { el.addEventListener(ev, fn); cleanups.push(() => el.removeEventListener(ev, fn)); };

  stopSpeech();
  app.scene = new THREE.Scene();
  app.camera = new THREE.PerspectiveCamera();
  app.update = () => {};
  document.body.style.background = 'linear-gradient(180deg, #0d1640 0%, #23306e 55%, #4a3f8a 100%)';
  ui.classList.remove('hidden');

  // the night sky: stars, a sleepy moon, slow clouds
  const sky = ui.querySelector('.night-sky');
  sky.innerHTML = '';
  for (let i = 0; i < 70; i++) {
    const s = document.createElement('i');
    s.className = 'twinkle';
    const size = 2 + Math.random() * 4;
    Object.assign(s.style, { left: Math.random() * 100 + '%', top: Math.random() * 70 + '%', width: size + 'px', height: size + 'px',
      animationDelay: (Math.random() * 4).toFixed(2) + 's', animationDuration: (2.5 + Math.random() * 3).toFixed(2) + 's' });
    sky.append(s);
  }
  const moon = document.createElement('div');
  moon.className = 'sleepy-moon';
  moon.innerHTML = sticker('bye');
  sky.append(moon);
  for (let i = 0; i < 3; i++) {
    const c = document.createElement('div');
    c.className = 'night-cloud';
    c.style.top = (12 + i * 22) + '%';
    c.style.animationDuration = (60 + i * 25) + 's';
    c.style.animationDelay = (-i * 20) + 's';
    sky.append(c);
  }

  const list = ui.querySelector('.song-list'), player = ui.querySelector('.song-player'), dim = ui.querySelector('.night-dim');
  on(ui.querySelector('.lullaby-home'), 'click', () => app.switchTo('home'));
  let songs = [], index = [];

  async function load() {
    try { songs = (await (await fetch('assets/lullabies/lyrics.json')).json()).songs; } catch { songs = []; }
    try { index = await (await fetch('assets/lullabies/index.json')).json(); } catch { index = []; }
    if (gone) return;
    showList();
  }
  const ready = (id) => { const e = index.find((x) => x.id === id); return !!(e && e.langs.includes(lang)); };

  function showList() {
    stopSong();
    player.classList.add('hidden');
    list.classList.remove('hidden');
    list.innerHTML = `<div class="song-hint">${t('tapSong')}</div><div class="song-row"></div>`;
    const row = list.querySelector('.song-row');
    for (const s of songs) {
      const b = document.createElement('button');
      const ok = ready(s.id);
      b.className = 'song-card' + (ok ? '' : ' not-yet');
      b.innerHTML = `<span class="song-icon">${ICONS[s.icon] || ICONS.star}</span><span class="song-title">${s.title[lang] || s.title.en}</span>` +
        (bilingual ? `<span class="song-sub">${s.title[home] || ''}</span>` : '') + (ok ? '' : `<span class="song-soon">${t('comingSoon')}</span>`);
      b.addEventListener('click', () => { if (ok) playSong(s); else { b.classList.remove('wiggle'); void b.offsetWidth; b.classList.add('wiggle'); } });
      row.append(b);
    }
  }

  // timings: when each line is sung (the same simple layout the song was made with)
  function timedLines(s) {
    const out = [];
    const [v1, v2] = s.lyrics[lang], [h1, h2] = bilingual ? s.lyrics[home] : [[], []];
    let t0 = INTRO;
    [[v1, h1], [v2, h2]].forEach(([v, h]) => {
      const step = VERSE / v.length;
      v.forEach((text, i) => out.push({ text, sub: h[i] || '', start: t0 + i * step, end: t0 + (i + 1) * step }));
      t0 += VERSE + BREAK;
    });
    return out;
  }

  function playSong(s) {
    stopSong();
    list.classList.add('hidden');
    player.classList.remove('hidden');
    dim.classList.remove('on');
    const lines = timedLines(s);
    player.innerHTML = `<div class="song-now">${ICONS[s.icon] || ICONS.star}<span>${s.title[lang] || s.title.en}</span></div>
      <div class="lyrics"></div>
      <div class="song-controls">
        <button class="ctl back" aria-label="Songs"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        <button class="ctl pause" aria-label="Pause"><svg viewBox="0 0 24 24"><rect x="6" y="5" width="4" height="14" rx="1.5" fill="#fff"/><rect x="14" y="5" width="4" height="14" rx="1.5" fill="#fff"/></svg></button>
        <div class="song-bar"><i></i></div>
      </div>`;
    const ly = player.querySelector('.lyrics');
    ly.innerHTML = lines.map((l) => `<div class="ly"><div class="ly-main">${l.text}</div>${l.sub ? `<div class="ly-sub">${l.sub}</div>` : ''}</div>`).join('');
    const rows = [...ly.children];
    const bar = player.querySelector('.song-bar i');
    audio = new Audio(`assets/lullabies/${lang}/${s.id}.mp3`);
    audio.volume = 0.9;
    const pauseBtn = player.querySelector('.pause');
    const setIcon = () => { pauseBtn.innerHTML = audio.paused
      ? '<svg viewBox="0 0 24 24"><path d="M8.5 5.5v13l10-6.5z" fill="#fff"/></svg>'
      : '<svg viewBox="0 0 24 24"><rect x="6" y="5" width="4" height="14" rx="1.5" fill="#fff"/><rect x="14" y="5" width="4" height="14" rx="1.5" fill="#fff"/></svg>'; };
    pauseBtn.addEventListener('click', () => { if (audio.paused) { audio.play(); dim.classList.remove('on'); } else audio.pause(); setIcon(); });
    player.querySelector('.back').addEventListener('click', showList);
    countUp('lullabies');
    audio.addEventListener('ended', () => {
      // next song after a short, quiet pause; after the last one, dim the room
      const order = songs.filter((x) => ready(x.id));
      const next = order[order.indexOf(s) + 1];
      setIcon();
      if (next) timers.push(setTimeout(() => { if (!gone && audio && audio.ended) playSong(next); }, 3500));
      else dim.classList.add('on');
    });
    audio.play().catch(() => {}).then(setIcon);
    let shown = -1;
    const tick = () => {
      if (!audio) return;
      const tnow = audio.currentTime;
      bar.style.width = (audio.duration ? tnow / audio.duration * 100 : 0) + '%';
      const k = lines.findIndex((l) => tnow >= l.start && tnow < l.end);
      if (k !== shown) {
        shown = k;
        rows.forEach((r, i) => r.classList.toggle('on', i === k));
        if (k >= 0) rows[k].scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }
  function stopSong() {
    cancelAnimationFrame(raf);
    if (audio) { audio.pause(); audio = null; }
    dim.classList.remove('on');
  }

  load();
  return () => {
    gone = true;
    stopSong();
    for (const x of timers) clearTimeout(x);
    for (const c of cleanups) c();
    ui.classList.add('hidden');
    list.innerHTML = '';
    player.innerHTML = '';
    sky.innerHTML = '';
  };
}
