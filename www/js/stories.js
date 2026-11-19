// Fun Lingo — story time
// A shelf of picture books. Each story plays as a little cartoon: a sunny meadow,
// drifting clouds, swaying flowers, and characters that walk, hop, fly and pop up
// in time with the narration. Slow on purpose: every scene waits so little ones can look.

import * as THREE from 'three';
import { say, stopSpeech, isSpeaking } from './speech.js?v=2';
import { loadTexts, textFor } from './objects.js?v=9';
import { sticker } from './art.js?v=3';
import { t, homeLanguage, learnLanguage } from './ui.js?v=2';
import { countUp } from './parent.js?v=2';

const NS = 'http://www.w3.org/2000/svg';
const W = 1600, H = 900, GROUND = 760;
const SOUNDS = {
  woof: { en: 'Woof!', ja: 'ワンワン！', ko: '멍멍!', ne: 'भुक भुक!' },
  meow: { en: 'Meow!', ja: 'ニャー！', ko: '야옹!', ne: 'म्याउँ!' },
  moo: { en: 'Moo!', ja: 'モー！', ko: '음매!', ne: 'म्बाँ!' },
  tweet: { en: 'Tweet!', ja: 'ピヨピヨ！', ko: '짹짹!', ne: 'चिरबिर!' },
  yum: { en: 'Yum!', ja: 'おいしい！', ko: '냠냠!', ne: 'मीठो!' },
};
export const STORY_LIST = [
  { id: 'who_says_hello', cover: ['dog', 'cat', 'bird'], colour: '#ff8a1f',
    title: { en: 'Who Says Hello?', ja: 'だれが こんにちは？', ko: '누가 인사할까?', ne: 'को-कोले नमस्ते भन्छ?' } },
  { id: 'beeps_big_day', cover: ['apple', 'banana', 'milk'], colour: '#a259ff',
    title: { en: "Beep's Big Day", ja: 'ビープの とくべつな ひ', ko: '비프의 특별한 날', ne: 'बिपको ठूलो दिन' } },
];

export function startStories(app) {
  const lang = learnLanguage(), home = homeLanguage();
  const bilingual = home && home !== lang;
  const ui = document.getElementById('stories-ui');
  const cleanups = [], timers = [];
  let gone = false, raf = 0;
  const on = (el, ev, fn) => { el.addEventListener(ev, fn); cleanups.push(() => el.removeEventListener(ev, fn)); };
  const wait = (ms) => new Promise((r, x) => timers.push(setTimeout(() => (gone ? x('gone') : r()), ms)));

  // nothing 3D on this page
  app.scene = new THREE.Scene();
  app.camera = new THREE.PerspectiveCamera();
  app.update = () => {};
  document.body.style.background = 'linear-gradient(180deg, #ffe4f1 0%, #fff4d6 100%)';
  ui.classList.remove('hidden');
  const shelf = ui.querySelector('.story-shelf'), player = ui.querySelector('.story-player');
  on(ui.querySelector('.stories-home'), 'click', () => app.switchTo('home'));

  // ---------------- the shelf
  function showShelf() {
    if (typeof run !== 'undefined') run.alive = false;
    cancelAnimationFrame(raf);
    stopSpeech();
    player.classList.add('hidden');
    shelf.classList.remove('hidden');
    shelf.innerHTML = `<div class="shelf-hint">${t('tapToStart')}</div><div class="shelf-row"></div>`;
    const row = shelf.querySelector('.shelf-row');
    for (const s of STORY_LIST) {
      const b = document.createElement('button');
      b.className = 'book';
      b.style.setProperty('--c', s.colour);
      b.innerHTML = `<div class="cover">${s.cover.map((w, i) => `<span class="cv cv${i}">${sticker(w)}</span>`).join('')}</div>
        <div class="book-title">${s.title[lang] || s.title.en}</div>${bilingual ? `<div class="book-sub">${s.title[home] || ''}</div>` : ''}`;
      b.addEventListener('click', () => play(s.id));
      row.append(b);
    }
  }

  // ---------------- the stage: a little animated world in SVG
  let stage, actors, actorLayer, fxLayer, caption;
  function el(tag, attrs = {}, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.append(e);
    return e;
  }
  function buildStage(mood = 'day') {
    player.innerHTML = '';
    stage = el('svg', { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'xMidYMid slice', class: 'story-stage' }, player);
    const defs = el('defs', {}, stage);
    defs.innerHTML = `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mood === 'party' ? '#ffb3d9' : '#5ec8ff'}"/><stop offset="1" stop-color="${mood === 'party' ? '#ffe9a8' : '#d4f3ff'}"/></linearGradient>
      <radialGradient id="glow"><stop offset="0" stop-color="#fff6b0" stop-opacity=".9"/><stop offset="1" stop-color="#fff6b0" stop-opacity="0"/></radialGradient>`;
    el('rect', { x: 0, y: 0, width: W, height: H, fill: 'url(#sky)' }, stage);
    // sun with slowly turning rays
    const sun = el('g', { class: 'sun' }, stage);
    el('circle', { cx: 1380, cy: 150, r: 150, fill: 'url(#glow)' }, sun);
    const rays = el('g', { class: 'rays' }, sun);
    for (let i = 0; i < 12; i++) el('rect', { x: 1373, y: 40, width: 14, height: 40, rx: 7, fill: '#ffb703', transform: `rotate(${i * 30} 1380 150)` }, rays);
    el('circle', { cx: 1380, cy: 150, r: 70, fill: '#ffd23f', stroke: '#2b2150', 'stroke-width': 6 }, sun);
    // drifting clouds
    const clouds = el('g', {}, stage);
    for (const [x, y, s] of [[200, 140, 1], [700, 90, 0.8], [1050, 210, 0.65]]) {
      const c = el('g', { class: 'cloud', 'data-x': x, 'data-s': 8 + Math.random() * 8 }, clouds);
      c.innerHTML = `<g transform="translate(${x} ${y}) scale(${s})"><circle cx="0" cy="0" r="50" fill="#fff"/><circle cx="55" cy="10" r="40" fill="#fff"/><circle cx="-55" cy="12" r="38" fill="#fff"/><rect x="-90" y="10" width="180" height="40" rx="20" fill="#fff"/></g>`;
    }
    // hills, grass, bushes, flowers
    el('path', { d: `M0 ${GROUND - 120} Q 300 ${GROUND - 260} 650 ${GROUND - 110} T 1600 ${GROUND - 150} V ${H} H 0 Z`, fill: '#9be07c' }, stage);
    el('path', { d: `M0 ${GROUND - 40} Q 400 ${GROUND - 140} 820 ${GROUND - 40} T 1600 ${GROUND - 60} V ${H} H 0 Z`, fill: '#6fcf5a' }, stage);
    for (const [x, s] of [[120, 1.1], [1480, 1.2], [860, 0.8]]) {
      const b = el('g', { transform: `translate(${x} ${GROUND - 40}) scale(${s})` }, stage);
      b.innerHTML = '<circle cx="-40" cy="0" r="46" fill="#3fb24f"/><circle cx="20" cy="-20" r="56" fill="#4cc35c"/><circle cx="70" cy="4" r="40" fill="#3fb24f"/>';
    }
    const flowers = el('g', {}, stage);
    [[60, '#ff5fa2'], [300, '#ffd23f'], [520, '#a259ff'], [990, '#ff5fa2'], [1250, '#ffd23f'], [1540, '#2f9bff']].forEach(([x, c], i) => {
      const f = el('g', { class: 'flower', 'data-x': x, 'data-p': i }, flowers);
      f.innerHTML = `<path d="M${x} ${H} Q${x - 6} ${H - 60} ${x} ${H - 110}" stroke="#2fbf4a" stroke-width="8" fill="none"/>` +
        [0, 72, 144, 216, 288].map((a) => `<circle cx="${x}" cy="${H - 128}" r="13" fill="${c}" transform="rotate(${a} ${x} ${H - 110})"/>`).join('') +
        `<circle cx="${x}" cy="${H - 110}" r="11" fill="#fff3b0"/>`;
    });
    actorLayer = el('g', {}, stage);
    fxLayer = el('g', {}, stage);
    caption = document.createElement('div');
    caption.className = 'story-caption';
    player.append(caption);
    const back = document.createElement('button');
    back.className = 'hbtn small story-back';
    back.innerHTML = '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    back.addEventListener('click', showShelf);
    player.append(back);
    actors = {};
  }

  // ---------------- characters: cut-out pictures that move smoothly
  function addActor(name, word, x, y, size = 260, extra = {}) {
    const g = el('g', { class: 'actor' }, actorLayer);
    const inner = el('g', {}, g);
    const pic = el('svg', { x: -size / 2, y: -size, width: size, height: size, viewBox: '0 0 200 200' }, inner);
    pic.innerHTML = sticker(word).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
    const shadow = el('ellipse', { cx: 0, cy: 6, rx: size * 0.28, ry: 12, fill: 'rgba(0,0,0,.14)' }, g);
    g.insertBefore(shadow, inner);
    const a = { name, g, inner, shadow, x, y, s: 0, r: 0, bob: 0, phase: Math.random() * 6, alive: true, talk: 0, hopT: -1, tweens: [], ...extra };
    g.addEventListener('pointerdown', () => { wiggle(a); if (name === 'beep' && !isSpeaking()) say(null, lang, 'pet.beep.tickles'); });
    actors[name] = a;
    return a;
  }
  const ease = { inOut: (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2), out: (k) => 1 - Math.pow(1 - k, 3),
    back: (k) => { const c = 1.7; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); } };
  function tween(a, props, ms, e = 'inOut') {
    return new Promise((res) => {
      const from = {};
      for (const k in props) from[k] = a[k];
      a.tweens.push({ from, to: props, t: 0, ms, e: ease[e], res });
    });
  }
  const pop = (a, ms = 600) => tween(a, { s: 1 }, ms, 'back');
  async function walk(a, x, ms = 2200) { a.walking = true; await tween(a, { x }, ms, 'inOut'); a.walking = false; }
  function hop(a) { a.hopT = 0; }
  function wiggle(a) { a.wig = 0; }
  async function flyIn(a, x, y, ms = 2400) { a.flying = true; await tween(a, { x, y }, ms, 'inOut'); a.flying = false; }

  // speech bubbles and sparkles
  function bubble(a, text, ms = 2200) {
    const b = el('g', { class: 'bubble' }, fxLayer);
    const w = Math.max(160, text.length * 34 + 60);
    b.innerHTML = `<g transform="translate(${a.x - w / 2} ${a.y - 380})"><rect width="${w}" height="90" rx="45" fill="#fff" stroke="#2b2150" stroke-width="6"/>` +
      `<path d="M${w / 2 - 18} 86 L${w / 2} 120 L${w / 2 + 18} 86 Z" fill="#fff" stroke="#2b2150" stroke-width="6" stroke-linejoin="round"/><rect x="${w / 2 - 20}" y="80" width="40" height="10" fill="#fff"/>` +
      `<text x="${w / 2}" y="60" text-anchor="middle" font-size="46" font-weight="800" fill="#2b2150" font-family="Arial Rounded MT Bold, Hiragino Maru Gothic ProN, Apple SD Gothic Neo, Kohinoor Devanagari, system-ui, sans-serif">${text}</text></g>`;
    timers.push(setTimeout(() => b.remove(), ms));
  }
  function hearts(x, y, n = 6, colour = '#ff5fa2') {
    for (let i = 0; i < n; i++) {
      const h = el('path', { d: 'M0 7C-15 -3 -9 -16 0 -8C9 -16 15 -3 0 7Z', fill: i % 2 ? '#ffd23f' : colour, class: 'fx-heart' }, fxLayer);
      const dx = (Math.random() - 0.5) * 260, dy = -150 - Math.random() * 160, rot = (Math.random() - 0.5) * 60;
      h.animate([{ transform: `translate(${x}px, ${y}px) scale(.4)`, opacity: 1 }, { transform: `translate(${x + dx}px, ${y + dy}px) scale(2) rotate(${rot}deg)`, opacity: 0 }],
        { duration: 1600 + Math.random() * 600, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'forwards' });
      timers.push(setTimeout(() => h.remove(), 2400));
    }
  }
  function confetti(n = 60) {
    const cols = ['#ff5fa2', '#ffd23f', '#2fbf4a', '#2f9bff', '#a259ff', '#ff8a1f'];
    for (let i = 0; i < n; i++) {
      const c = el('rect', { width: 18, height: 28, rx: 5, fill: cols[i % cols.length] }, fxLayer);
      const x = Math.random() * W, rot = Math.random() * 720;
      c.animate([{ transform: `translate(${x}px, -40px) rotate(0deg)` }, { transform: `translate(${x + (Math.random() - 0.5) * 300}px, ${H + 40}px) rotate(${rot}deg)` }],
        { duration: 2600 + Math.random() * 1600, delay: Math.random() * 600, easing: 'ease-in', fill: 'forwards' });
      timers.push(setTimeout(() => c.remove(), 5000));
    }
  }

  // ---------------- frame loop: tweens, idle bobbing, walking bounce, talking wobble
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const time = now / 1000;
    for (const c of stage.querySelectorAll('.cloud')) {
      const x0 = +c.dataset.x, sp = +c.dataset.s;
      c.setAttribute('transform', `translate(${((time * sp + x0) % (W + 400)) - x0 - 200} 0)`);
    }
    for (const f of stage.querySelectorAll('.flower')) {
      const x = +f.dataset.x;
      f.setAttribute('transform', `rotate(${Math.sin(time * 1.4 + +f.dataset.p) * 4} ${x} ${H})`);
    }
    const rays = stage.querySelector('.rays');
    if (rays) rays.setAttribute('transform', `rotate(${(time * 8) % 360} 1380 150)`);
    for (const a of Object.values(actors)) {
      for (let i = a.tweens.length - 1; i >= 0; i--) {
        const tw = a.tweens[i];
        tw.t = Math.min(1, tw.t + (dt * 1000) / tw.ms);
        const k = tw.e(tw.t);
        for (const p in tw.to) a[p] = tw.from[p] + (tw.to[p] - tw.from[p]) * k;
        if (tw.t >= 1) { a.tweens.splice(i, 1); tw.res(); }
      }
      let y = a.y, sx = 1, sy = 1, r = a.r;
      if (a.alive) { y += Math.sin(time * 2.2 + a.phase) * 5; sy += Math.sin(time * 2.2 + a.phase) * 0.015; }
      if (a.walking) { y -= Math.abs(Math.sin(time * 9)) * 26; r += Math.sin(time * 9) * 4; }
      if (a.flying) { y += Math.sin(time * 6) * 18; }
      if (a.hopT >= 0) {
        a.hopT += dt;
        const k = Math.min(a.hopT / 0.55, 1);
        y -= Math.sin(k * Math.PI) * 120;
        if (k < 0.12) { sy *= 0.86; sx *= 1.1; } else if (k > 0.9) { sy *= 0.9; sx *= 1.08; }
        if (k >= 1) a.hopT = -1;
      }
      if (a.wig !== undefined && a.wig >= 0) { a.wig += dt; r += Math.sin(a.wig * 30) * 10 * Math.max(0, 1 - a.wig / 0.7); if (a.wig > 0.7) a.wig = -1; }
      if (a.talking) { sy *= 1 + Math.abs(Math.sin(time * 14)) * 0.05; }
      const s = Math.max(0.001, a.s);
      a.g.setAttribute('transform', `translate(${a.x} ${y})`);
      a.inner.setAttribute('transform', `rotate(${r}) scale(${s * sx * (a.flip ? -1 : 1)} ${s * sy})`);
      a.shadow.setAttribute('transform', `translate(0 ${a.y - y}) scale(${s * (1 - (a.y - y) / 400)})`);
    }
    raf = requestAnimationFrame(frame);
  }

  // ---------------- narration: captions + voices (teacher lines in both languages)
  async function line(id, by, speaker) {
    if (gone) throw 'gone';
    const title = textFor(id, lang), sub = bilingual ? textFor(id, home) : '';
    caption.innerHTML = `<div class="cap-main">${title}</div>${sub ? `<div class="cap-sub">${sub}</div>` : ''}`;
    caption.classList.remove('show'); void caption.offsetWidth; caption.classList.add('show');
    if (speaker) speaker.talking = true;
    if (by === 'narr' && bilingual) { await say(null, home, id); await say(null, lang, id, { gap: 600 }); }
    else await say(null, lang, id);
    if (speaker) speaker.talking = false;
    if (gone) throw 'gone';
  }
  const S = (k) => SOUNDS[k][lang] || SOUNDS[k].en;

  // ---------------- the stories, scene by scene
  const STORIES = {
    async who_says_hello(x) {
      const { wait, line } = x;
      buildStage('day');
      const beep = addActor('beep', 'beep', -200, GROUND, 250);
      beep.s = 1;
      await wait(900);
      const L = (n, by, sp) => line(`story.who_says_hello.${n}`, by, sp);
      // 1. Beep goes for a walk
      const w1 = walk(beep, 380, 3000);
      await L(1, 'narr');
      await w1; await wait(1200);
      // 2. "Hello!"
      hop(beep);
      await L(2, 'pet', beep); await wait(1400);
      // 3. a dog pops out of the bush
      const dog = addActor('dog', 'dog', 1480, GROUND, 240);
      await pop(dog); await walk(dog, 1180, 1500);
      hop(dog); bubble(dog, S('woof'));
      await L(3, 'narr'); await wait(1800);
      // 4. a cat
      const cat = addActor('cat', 'cat', 1750, GROUND, 230);
      cat.s = 1;
      await walk(cat, 900, 2000);
      hop(cat); bubble(cat, S('meow'));
      await L(4, 'narr'); await wait(1800);
      // 5. a cow
      await Promise.all([walk(dog, 1100, 1200), walk(cat, 760, 1200)]);
      const cow = addActor('cow', 'cow', 1800, GROUND + 10, 280);
      cow.s = 1;
      await walk(cow, 1380, 2400);
      wiggle(cow); bubble(cow, S('moo'));
      await L(5, 'narr'); await wait(1800);
      // 6. a bird flies in
      const bird = addActor('bird', 'bird', 1700, 120, 190, { alive: false });
      bird.s = 1;
      await flyIn(bird, 640, 330, 2600);
      bubble(bird, S('tweet'));
      await L(6, 'narr'); await wait(1800);
      // 7. an elephant and a monkey
      const ele = addActor('elephant', 'elephant', -260, GROUND + 20, 290);
      const mon = addActor('monkey', 'monkey', -500, GROUND, 220);
      ele.s = mon.s = 1;
      await Promise.all([walk(beep, 520, 1500), walk(ele, 170, 2600), walk(mon, -40, 2600)]);
      await walk(mon, 300, 900);
      hop(mon);
      await L(7, 'narr'); await wait(1800);
      // 8. everyone says hello: a wave of hops
      for (const a of [ele, mon, beep, cat, dog, cow]) { hop(a); await wait(220); }
      hearts(W / 2, GROUND - 260, 10);
      await L(8, 'narr'); await wait(1800);
      // 9. Beep: Hello, friends! Bye-bye!
      hop(beep);
      await L(9, 'pet', beep); await wait(800);
      for (const a of [ele, mon, cat, dog, cow]) hop(a);
      await wait(1500);
    },

    async beeps_big_day(x) {
      const { wait, line } = x;
      buildStage('party');
      const beep = addActor('beep', 'beep', W / 2, GROUND, 280);
      const L = (n, by, sp) => line(`story.beeps_big_day.${n}`, by, sp);
      await wait(600);
      // 1. It's Beep's big day!
      await pop(beep, 800);
      confetti(70); hop(beep);
      await L(1, 'narr'); await wait(1600);
      // 2. "Hello! My name is Beep!"
      wiggle(beep);
      await L(2, 'pet', beep); await wait(1400);
      // 3. a red apple and a yellow banana roll in
      await walk(beep, 520, 1200);
      const apple = addActor('apple', 'apple', 1800, GROUND, 200);
      const banana = addActor('banana', 'banana', 2050, GROUND, 210);
      apple.s = banana.s = 1;
      await Promise.all([tween(apple, { x: 1000, r: -720 }, 2400, 'out'), tween(banana, { x: 1260, r: -360 }, 2600, 'out')]);
      apple.r = 0; banana.r = 0;
      await L(3, 'narr'); await wait(1600);
      // 4. "Yummy!"
      hop(beep); bubble(beep, S('yum')); hearts(beep.x, GROUND - 260, 8);
      await L(4, 'pet', beep); await wait(1600);
      // 5. Mom brings rice and an egg
      await Promise.all([tween(apple, { s: 0 }, 500), tween(banana, { s: 0 }, 500)]);
      const mom = addActor('mom', 'mom', 1900, GROUND, 300);
      mom.s = 1;
      await walk(mom, 1260, 2600);
      const rice = addActor('rice', 'rice', 1060, GROUND - 40, 170);
      const egg = addActor('egg', 'egg', 880, GROUND - 30, 150);
      await pop(rice); await pop(egg);
      await L(5, 'narr'); await wait(1600);
      // 6. "Thank you!"
      hop(beep); hearts(beep.x, GROUND - 260, 10);
      await L(6, 'pet', beep); await wait(1600);
      // 7. Dad brings milk and water
      await Promise.all([tween(rice, { s: 0 }, 500), tween(egg, { s: 0 }, 500), walk(mom, 1900, 2200)]);
      const dad = addActor('dad', 'dad', -300, GROUND, 300);
      dad.s = 1;
      await walk(dad, 200, 2600);
      const milk = addActor('milk', 'milk', 760, GROUND - 30, 160);
      const water = addActor('water', 'water', 900, GROUND - 30, 150);
      await pop(milk); await pop(water);
      await L(7, 'narr'); await wait(1600);
      // 8. a blue fish, a green butterfly, a black and white cow
      await Promise.all([tween(milk, { s: 0 }, 500), tween(water, { s: 0 }, 500), walk(dad, -400, 2000)]);
      await walk(beep, 300, 1400);
      const fish = addActor('fish', 'fish', 1700, 300, 180, { alive: false });
      const fly = addActor('butterfly', 'butterfly', 1750, 140, 170, { alive: false });
      const cow = addActor('cow', 'cow', 1900, GROUND + 10, 280);
      fish.s = fly.s = cow.s = 1;
      await Promise.all([flyIn(fish, 700, 360, 2600), flyIn(fly, 1000, 200, 3000), walk(cow, 1300, 3000)]);
      await L(8, 'narr'); await wait(1800);
      // 9. "I love my big day! Bye-bye!"
      hop(beep); confetti(80); hearts(beep.x, GROUND - 260, 12);
      await L(9, 'pet', beep); await wait(1200);
      for (const a of [fish, fly, cow]) wiggle(a);
      await wait(1500);
    },
  };

  // each play is a "run"; going back or replaying stops the old run at its next step
  let run = { alive: false };
  async function play(id) {
    run.alive = false;
    stopSpeech();
    cancelAnimationFrame(raf);
    const me = { alive: true };
    run = me;
    shelf.classList.add('hidden');
    player.classList.remove('hidden');
    await loadTexts();
    const guard = (p) => p.then((v) => { if (!me.alive) throw 'gone'; return v; });
    const x = {
      wait: (ms) => (me.alive ? guard(wait(ms)) : Promise.reject('gone')),
      line: (...a) => (me.alive ? guard(line(...a)) : Promise.reject('gone')),
    };
    last = performance.now();
    try {
      const go = STORIES[id](x);
      raf = requestAnimationFrame(frame);
      await go;
      if (me.alive) { countUp('stories'); theEnd(id); }
    } catch (e) { if (e !== 'gone') console.error('Story stopped:', e); }
  }
  function theEnd(id) {
    caption.classList.remove('show');
    const end = document.createElement('div');
    end.className = 'story-end';
    end.innerHTML = `<div class="end-card"><div class="end-title">${t('theEnd', lang)}</div>${bilingual ? `<div class="end-sub">${t('theEnd', home)}</div>` : ''}
      <div class="end-buttons"><button class="done-btn home" aria-label="Books"><svg viewBox="0 0 24 24"><path d="M3 5.5c3-1.2 6-1 9 1v13c-3-2-6-2.2-9-1z" fill="#fff"/><path d="M21 5.5c-3-1.2-6-1-9 1v13c3-2 6-2.2 9-1z" fill="#fff" opacity=".85"/></svg></button>
      <button class="done-btn next" aria-label="Again"><svg viewBox="0 0 24 24"><path d="M19 12a7 7 0 1 1-2.05-4.95M19 4v4h-4" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div></div>`;
    player.append(end);
    end.querySelector('.home').addEventListener('click', showShelf);
    end.querySelector('.next').addEventListener('click', () => play(id));
  }

  showShelf();
  return () => {
    gone = true;
    cancelAnimationFrame(raf);
    stopSpeech();
    for (const x of timers) clearTimeout(x);
    for (const c of cleanups) c();
    ui.classList.add('hidden');
    shelf.innerHTML = '';
    player.innerHTML = '';
  };
}
