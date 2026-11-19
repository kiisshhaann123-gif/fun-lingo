// Fun Lingo — home page
// A spinning toy globe with the four language flags, Dai Leo and Didi Asha on
// either side, the child's pet beside them, and four big buttons that never move.
// The background changes on every launch (theme, time of day, weather); the
// layout does not.

import * as THREE from 'three';
import { fresh, teacherGreetings, PET_GREETINGS, shuffle } from './variety.js?v=1';
import { PET_ACTOR } from './objects.js?v=9';
import { t as tr } from './ui.js?v=2';
import { renderProgress } from './parent.js?v=2';
import { say, stopSpeech, updateMouth, isSpeaking } from './speech.js?v=2';

const LANGS = [
  { code: 'en', name: 'English' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ne', name: 'Nepali' },
];
const STORE = {
  get(k, d) { try { const v = localStorage.getItem('funlingo.' + k); return v === null ? d : v; } catch { return d; } },
  set(k, v) { try { localStorage.setItem('funlingo.' + k, v); } catch { /* storage blocked: fine */ } },
};
const THEMES = ['village', 'jungle'];                    // more themes join this list later
const TIMES = ['morning', 'day', 'sunset', 'night'];
const VIEW = { left: -8.6, right: 8.6, bottom: -0.2, top: 8.6 };
const GLOBE = { x: 0, y: 3.35, r: 1.75 };
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0, ...extra });

// ------------------------------------------------------------------ flags drawn on canvases
function flagCanvas(code) {
  const c = document.createElement('canvas');
  c.width = 384; c.height = 256;
  const g = c.getContext('2d');
  const W = c.width, H = c.height;
  if (code === 'ja') {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#bc002d'; g.beginPath(); g.arc(W / 2, H / 2, H * 0.3, 0, Math.PI * 2); g.fill();
  } else if (code === 'ko') {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2, r = H * 0.25, a = Math.atan2(2, 3);
    g.save(); g.translate(cx, cy); g.rotate(a);
    g.fillStyle = '#cd2e3a'; g.beginPath(); g.arc(0, 0, r, Math.PI, 0); g.fill();
    g.fillStyle = '#0047a0'; g.beginPath(); g.arc(0, 0, r, 0, Math.PI); g.fill();
    g.fillStyle = '#cd2e3a'; g.beginPath(); g.arc(-r / 2, 0, r / 2, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#0047a0'; g.beginPath(); g.arc(r / 2, 0, r / 2, 0, Math.PI * 2); g.fill();
    g.restore();
    // four trigrams
    const bars = [[3, 3, 3], [2, 2, 2], [3, 2, 3], [2, 3, 2]];
    const spots = [[-1, -1], [1, 1], [1, -1], [-1, 1]];
    spots.forEach(([sx, sy], i) => {
      g.save();
      g.translate(cx + sx * W * 0.3, cy + sy * H * 0.3);
      g.rotate(sx * sy > 0 ? a : -a);
      g.fillStyle = '#000000';
      bars[i].forEach((kind, j) => {
        const y = (j - 1) * 14;
        if (kind === 3) g.fillRect(-24, y - 5, 48, 10);
        else { g.fillRect(-24, y - 5, 21, 10); g.fillRect(3, y - 5, 21, 10); }
      });
      g.restore();
    });
  } else if (code === 'ne') {
    // two stacked pennants, crimson with a blue border, moon above and sun below
    g.clearRect(0, 0, W, H);
    const pts = [[40, 8], [300, 118], [120, 118], [300, 248], [40, 248]];
    const path = () => { g.beginPath(); g.moveTo(...pts[0]); for (const p of pts.slice(1)) g.lineTo(...p); g.closePath(); };
    path(); g.fillStyle = '#003893'; g.fill();
    g.save(); g.translate(150, 132); g.scale(0.86, 0.9); g.translate(-150, -132);
    path(); g.fillStyle = '#dc143c'; g.fill(); g.restore();
    g.fillStyle = '#ffffff';
    g.beginPath(); g.arc(100, 92, 24, 0, Math.PI); g.fill();           // moon
    for (let i = 0; i < 12; i++) {                                         // sun
      const t = i / 12 * Math.PI * 2;
      g.beginPath(); g.moveTo(100 + Math.cos(t) * 30, 196 + Math.sin(t) * 30);
      g.lineTo(100 + Math.cos(t + 0.26) * 18, 196 + Math.sin(t + 0.26) * 18);
      g.lineTo(100 + Math.cos(t - 0.26) * 18, 196 + Math.sin(t - 0.26) * 18); g.fill();
    }
    g.beginPath(); g.arc(100, 196, 19, 0, Math.PI * 2); g.fill();
  } else {
    // neutral English banner: rainbow stripes with A B C blocks
    const cols = ['#ff5a5f', '#ffb400', '#3ec300', '#00a6ed', '#7b61ff'];
    cols.forEach((col, i) => { g.fillStyle = col; g.fillRect(0, i * H / cols.length, W, H / cols.length + 1); });
    const letters = [['A', '#ff5a5f'], ['B', '#00a6ed'], ['C', '#3ec300']];
    letters.forEach(([ch, col], i) => {
      const x = 52 + i * 112, y = 70;
      g.fillStyle = '#ffffff'; g.beginPath(); g.roundRect(x, y, 92, 116, 18); g.fill();
      g.fillStyle = col; g.font = 'bold 92px "Arial Rounded MT Bold", Arial, sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ch, x + 46, y + 62);
    });
  }
  return c;
}

// ------------------------------------------------------------------ globe texture (a toy globe, not a map)
function globeTexture() {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 512;
  const g = c.getContext('2d');
  const sea = g.createLinearGradient(0, 0, 0, 512);
  sea.addColorStop(0, '#5ec8ff'); sea.addColorStop(0.5, '#2f9be8'); sea.addColorStop(1, '#5ec8ff');
  g.fillStyle = sea; g.fillRect(0, 0, 1024, 512);
  let s = 7;
  const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const lands = ['#7ed957', '#5bc044', '#a3e06b', '#f4d27a'];
  for (let i = 0; i < 16; i++) {
    const cx = rnd() * 1024, cy = 90 + rnd() * 330, n = 6 + Math.floor(rnd() * 8);
    g.fillStyle = lands[i % lands.length];
    for (let k = 0; k < n; k++) {
      const x = cx + (rnd() - 0.5) * 150, y = cy + (rnd() - 0.5) * 90, r = 20 + rnd() * 46;
      for (const dx of [-1024, 0, 1024]) { g.beginPath(); g.arc(x + dx, y, r, 0, Math.PI * 2); g.fill(); }
    }
  }
  g.fillStyle = '#ffffff';                                    // ice caps
  g.fillRect(0, 0, 1024, 26); g.fillRect(0, 486, 1024, 26);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

// ------------------------------------------------------------------ audio + lip sync (shared)
const speak = (actor, lang, id, opts) => say(actor, lang, id, opts);
// teachers: the line in the home language first, a pause, then in the learning language
function speak2(actor, lang, id) {
  const home = (() => { try { return localStorage.getItem('funlingo.homeLang') || ''; } catch { return ''; } })();
  if (home && home !== lang) { say(actor, home, id); return say(actor, lang, id, { gap: 600 }); }
  return say(actor, lang, id);
}

// ------------------------------------------------------------------ the page
export function startHome(app) {
  const { renderer, actorsById, updateBlink } = app;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 400);
  const lookAt = new THREE.Vector3();
  const look = {
    theme: (() => { const last = STORE.get('lastTheme', ''); const opts = THEMES.filter((t) => t !== last); const t = pick(opts.length ? opts : THEMES); STORE.set('lastTheme', t); return t; })(),
    time: pick(TIMES),
  };
  look.weather = Math.random() < 0.35 ? (look.theme === 'village' ? 'snow' : 'rain') : (Math.random() < 0.5 ? 'cloudy' : 'clear');
  const updaters = [];
  const actors = [];
  const timers = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  const listeners = [];
  const on = (el, ev, fn) => { el.addEventListener(ev, fn); listeners.push([el, ev, fn]); };
  let targetLang = STORE.get('targetLang', '');

  // ---------------- camera fits the scene on any screen shape
  function fit() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const halfH = (VIEW.top - VIEW.bottom) / 2, halfW = (VIEW.right - VIEW.left) / 2;
    const dist = Math.max(halfH / t, halfW / (t * camera.aspect)) + 2.2;
    lookAt.set(0, (VIEW.top + VIEW.bottom) / 2, 0);
    camera.position.set(0, lookAt.y + 0.8, dist);
    camera.lookAt(lookAt);
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', fit);
  fit();

  // ---------------- sky, light, time of day
  const SKY = {
    morning: ['#ffd6a5', '#bde0fe', '#e9f7ff'],
    day: ['#4fb3ff', '#9ad8ff', '#e6f6ff'],
    sunset: ['#ff8c69', '#ffb38a', '#ffe0b3'],
    night: ['#0b1d4a', '#22357a', '#4a4f8f'],
  }[look.time];
  document.body.style.background = `linear-gradient(180deg, ${SKY[0]} 0%, ${SKY[1]} 55%, ${SKY[2]} 100%)`;
  const night = look.time === 'night';
  const hemi = new THREE.HemisphereLight(night ? 0x8fa6ff : 0xe6f4ff, night ? 0x2a3a2a : 0x9bd17a, night ? 0.9 : 1.6);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight({ morning: 0xffe0b8, day: 0xfff4e0, sunset: 0xffa36b, night: 0x9fb4ff }[look.time], night ? 0.9 : 2.1);
  sun.position.set(look.time === 'sunset' ? 10 : -7, 12, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -2, near: 1, far: 40 });
  scene.add(sun);
  if (night) {
    const lamp = new THREE.PointLight(0xffc98a, 10, 14, 1.6);
    lamp.position.set(0, 4, 3);
    scene.add(lamp);
    const starGeo = new THREE.BufferGeometry();
    const pts = [];
    for (let i = 0; i < 260; i++) pts.push(rand(-40, 40), rand(8, 30), rand(-45, -30));
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.18, sizeAttenuation: true }));
    scene.add(stars);
    updaters.push((dt, t) => { stars.material.opacity = 0.75 + Math.sin(t * 2) * 0.25; stars.material.transparent = true; });
    const moon = new THREE.Mesh(new THREE.CircleGeometry(3.2, 40), new THREE.MeshBasicMaterial({ color: 0xfff6cc }));
    moon.position.set(-24, 31, -80);                        // high in the sky, behind everything
    scene.add(moon);
  } else {
    const sunDisc = new THREE.Mesh(new THREE.CircleGeometry(3.4, 40), new THREE.MeshBasicMaterial({ color: look.time === 'sunset' ? 0xffb347 : 0xffe066, fog: false }));
    // far behind the mountains (z -80) and high above their peaks, so it always hangs in open sky
    sunDisc.position.set(look.time === 'sunset' ? 26 : -24, look.time === 'sunset' ? 26 : 32, -80);
    scene.add(sunDisc);
  }

  // ---------------- ground + theme scenery
  const grassCol = { village: 0x8fd16a, jungle: 0x5fbf54 }[look.theme];
  const ground = new THREE.Mesh(new THREE.CircleGeometry(60, 64), mat(night ? 0x3e6b3a : grassCol));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  const stage = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.4, 0.18, 48), mat(look.theme === 'village' ? 0xe9d8b0 : 0xd8c79a));
  stage.position.set(0, 0.09, 0.6);
  stage.receiveShadow = true;
  scene.add(stage);
  if (look.theme === 'village') buildVillage(scene, updaters, night); else buildJungle(scene, updaters, night);
  buildClouds(scene, updaters, look);
  if (look.weather === 'snow' || look.weather === 'rain') buildWeather(scene, updaters, look.weather);

  // ---------------- the globe on its stand
  const globeRoot = new THREE.Group();
  globeRoot.position.set(GLOBE.x, GLOBE.y, 0);
  scene.add(globeRoot);
  const standMat = mat(0xffb703, { roughness: 0.4, metalness: 0.2 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.0, 0.3, 32), standMat);
  base.position.set(0, 0.33, 0);
  base.castShadow = true;
  scene.add(base);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, GLOBE.y - GLOBE.r - 0.3, 16), standMat);
  post.position.set(0, (GLOBE.y - GLOBE.r) / 2 + 0.3, 0);
  scene.add(post);
  const arc = new THREE.Mesh(new THREE.TorusGeometry(GLOBE.r + 0.18, 0.06, 12, 64, Math.PI * 1.25), standMat);
  arc.rotation.set(0, Math.PI / 2, -Math.PI * 0.62);
  globeRoot.add(arc);
  const tilt = new THREE.Group();
  tilt.rotation.z = -0.2;
  globeRoot.add(tilt);
  const globe = new THREE.Mesh(new THREE.SphereGeometry(GLOBE.r, 64, 40), new THREE.MeshStandardMaterial({ map: globeTexture(), roughness: 0.45 }));
  globe.castShadow = true;
  tilt.add(globe);

  // ---------------- globe spinning: drag anywhere, it keeps turning, then slows down
  let spin = 0.15, dragging = false, lastX = 0, downX = 0, downY = 0, downT = 0;
  const targetSpin = { active: false, angle: 0 };

  // ---------------- characters
  const leo = actorsById.leo, asha = actorsById.asha;
  const petId = STORE.get('pet', 'beep');
  const pet = actorsById[PET_ACTOR[petId]] || actorsById.beep;
  const placed = [];
  function place(actor, x, z, height, rotY) {
    if (!actor) return;
    actor.loopOff = true;                                  // stop the loading-page namaste loop
    actor.holder.removeFromParent();
    actor.holder.position.set(x, 0.18, z);
    actor.holder.rotation.set(0, rotY, 0);
    actor.holder.scale.setScalar(1);
    actor.holder.children[0].scale.setScalar(height);
    actor.holder.traverse((o) => {
      if (o.isMesh) for (const m of [].concat(o.material)) { m.clippingPlanes = null; m.needsUpdate = true; }
    });
    actor.play('idle', { fade: 0.2 });
    scene.add(actor.holder);
    actors.push(actor);
    placed.push(actor.holder);
  }
  place(leo, -3.35, 0.7, 3.6, 0.28);
  if (leo && !leo.restMouth) leo.restMouth = { viseme_E: 0.45, viseme_aa: 0.22 };   // open, friendly smile instead of closed lips
  place(asha, 3.35, 0.7, 3.5, -0.28);
  if (pet) { pet.isPet = true; place(pet, 5.35, 1.7, 1.55, -0.45); }

  // greetings when the page opens
  const lang = () => targetLang || 'en';
  // only one or two of them speak each time, in a random order, with lines that don't repeat;
  // the others just wave
  {
    const crew = shuffle([['asha', asha], ['leo', leo], ['pet', pet]].filter(([, a]) => a));
    const talkers = crew.slice(0, Math.random() < 0.5 ? 1 : 2);
    let at = 700;
    for (const [who, a] of crew) {
      const speaks = talkers.some(([w]) => w === who);
      const t = at;
      later(() => {
        a.play(who === 'pet' ? 'wave' : 'wave_goodbye', { loop: false, fade: 0.3 });
        if (!speaks) return;
        if (who === 'pet') speak(a, lang(), `pet.${petId}.${fresh('pet.greet', PET_GREETINGS)}`);
        else speak2(a, lang(), `t.${fresh('teacher.greet', teacherGreetings())}.${who}`);
      }, t);
      at += speaks ? 1700 : 500;
    }
  }
  for (const a of [leo, asha, pet]) {
    if (!a || a.idleHooked) continue;
    a.idleHooked = true;
    a.mixer.addEventListener('finished', (e) => {
      const n = e.action.getClip().name;
      if (n === 'wave' || n === 'wave_goodbye' || n === 'bow') a.play('idle', { fade: 0.4 });
    });
  }

  // ---------------- buttons (HTML, fixed places)
  const ui = document.getElementById('home-ui');
  ui.classList.remove('hidden');
  const btn = (id) => ui.querySelector('#' + id);
  function bounce(el) { el.classList.remove('boing'); void el.offsetWidth; el.classList.add('boing'); }

  let starting = false;
  async function startLesson() {
    if (starting) return;
    starting = true;
    spin += 2.5;                                            // a happy whirl of the globe
    const [who, t] = Math.random() < 0.5 ? ['asha', asha] : ['leo', leo];   // either teacher sends them off
    t && t.play('wave_goodbye', { loop: false, fade: 0.3 });
    pet && pet.play('wave', { loop: false, fade: 0.3 });
    burst(new THREE.Vector3(0, GLOBE.y + GLOBE.r + 0.6, 0.5));
    await speak2(t, lang(), `t.${fresh('teacher.go', ['ready', 'fun_today', 'yay_youre_here', 'super'])}.${who}`);
    app.switchTo('map', { lang: lang() });                  // the map shows which lesson is today
  }
  on(btn('btn-start'), 'click', (e) => { bounce(e.currentTarget); startLesson(); });
  on(btn('btn-pets'), 'click', (e) => { bounce(e.currentTarget); stopSpeech(); app.switchTo('pets'); });
  on(btn('btn-stories'), 'click', (e) => { bounce(e.currentTarget); stopSpeech(); app.switchTo('stories'); });
  on(btn('btn-lullaby'), 'click', (e) => { bounce(e.currentTarget); stopSpeech(); app.switchTo('lullaby'); });

  // words for grown-ups (in the home language): button names, and how to change languages
  function paintLabels() {
    for (const el of document.querySelectorAll('#home-ui .lbl')) el.textContent = tr(el.dataset.k);
    const tip = document.getElementById('parent-tip');
    tip.textContent = tr('parentTip');
  }
  paintLabels();
  later(() => document.getElementById('parent-tip').classList.add('show'), 1200);   // always there for grown-ups

  // parent lock: hold for 3 seconds (too long for a toddler to do by accident)
  const lock = btn('btn-parent');
  let holdTimer = null;
  const holdStart = () => { lock.classList.add('holding'); holdTimer = setTimeout(() => { lock.classList.remove('holding'); openLanguagePicker(); }, 3000); };
  const holdEnd = () => { lock.classList.remove('holding'); clearTimeout(holdTimer); };
  on(lock, 'pointerdown', holdStart);
  on(lock, 'pointerup', holdEnd);
  on(lock, 'pointerleave', holdEnd);

  // ---------------- parent setup: the language spoken at home + the language the child learns
  const picker = document.getElementById('lang-picker');
  let homeLang = STORE.get('homeLang', '');
  function openLanguagePicker() {
    picker.innerHTML = '';
    const box = document.createElement('div');
    box.className = 'setup-box';
    const tabs = document.createElement('div');
    tabs.className = 'setup-tabs';
    tabs.innerHTML = `<button class="on" data-tab="lang">${tr('tabLanguages')}</button><button data-tab="prog">${tr('tabProgress')}</button>`;
    const langPane = document.createElement('div');
    langPane.className = 'setup-pane';
    const progPane = document.createElement('div');
    progPane.className = 'setup-pane progress-pane hidden';
    box.append(tabs, langPane, progPane);
    tabs.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      for (const x of tabs.children) x.classList.toggle('on', x === b);
      langPane.classList.toggle('hidden', b.dataset.tab !== 'lang');
      progPane.classList.toggle('hidden', b.dataset.tab !== 'prog');
      if (b.dataset.tab === 'prog') renderProgress(progPane);
    });
    const rows = {};
    const section = (title, key) => {
      const h = document.createElement('h3');
      h.textContent = title;                                // parent-facing, so words are fine here
      const row = document.createElement('div');
      row.className = 'setup-row';
      rows[key] = [];
      for (const L of LANGS) {
        const card = document.createElement('button');
        card.className = 'picker-card';
        card.dataset.code = L.code;
        const img = document.createElement('img');
        img.src = flagCanvas(L.code).toDataURL();
        img.alt = L.name;
        const label = document.createElement('span');
        label.textContent = L.name;
        card.append(img, label);
        card.addEventListener('click', () => {
          if (key === 'home') { homeLang = L.code; STORE.set('homeLang', L.code); }
          else { targetLang = L.code; STORE.set('targetLang', L.code); markChosen(); }
          paint();
          speak(asha, L.code, 'w.hello.say');
        });
        row.append(card);
        rows[key].push(card);
      }
      langPane.append(h, row);
    };
    const paint = () => {
      for (const c of rows.home) c.classList.toggle('chosen', c.dataset.code === homeLang);
      for (const c of rows.learn) c.classList.toggle('chosen', c.dataset.code === targetLang);
      done.disabled = !(homeLang && targetLang);
      done.style.opacity = done.disabled ? 0.4 : 1;
    };
    section(tr('weSpeak'), 'home');
    section(tr('childLearns'), 'learn');
    const done = document.createElement('button');
    done.className = 'setup-done';
    done.textContent = tr('done') + ' ✓';
    done.addEventListener('click', () => { if (!done.disabled) { picker.classList.add('hidden'); paintLabels(); } });
    box.append(done);
    picker.append(box);
    paint();
    picker.classList.remove('hidden');
  }
  // ---------------- the language row: swipe sideways, tap to hear hello; the chosen one glows
  const NATIVE = { en: 'English', ja: '日本語', ko: '한국어', ne: 'नेपाली' };
  const row = document.getElementById('lang-row');
  row.innerHTML = '';
  const cards = {};
  for (const L of LANGS) {
    const card = document.createElement('button');
    card.className = 'lang-card';
    card.setAttribute('aria-label', L.name);
    const img = document.createElement('img');
    img.src = flagCanvas(L.code).toDataURL();
    img.alt = '';
    const name = document.createElement('span');
    name.textContent = NATIVE[L.code];
    card.append(img, name);
    card.addEventListener('click', () => {
      bounce(card);
      if (L.code === targetLang) { startLesson(); return; }
      stopSpeech(); speak(null, L.code, 'w.hello.say');   // hear hello in any language
    });
    row.append(card);
    cards[L.code] = card;
  }
  row.classList.remove('hidden');
  function markChosen() {
    for (const [code, card] of Object.entries(cards)) card.classList.toggle('chosen', code === targetLang);
    const c = cards[targetLang];
    if (c) c.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }
  markChosen();
  if (!targetLang || !homeLang) setTimeout(openLanguagePicker, 400);

  // ---------------- taps on the 3D scene
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const canvas = renderer.domElement;
  function hitTest(x, y) {
    ndc.set(x / window.innerWidth * 2 - 1, -(y / window.innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects([globe, ...placed], true);
    return hits[0] || null;
  }
  function ownerActor(obj) {
    for (const a of actors) { let o = obj; while (o) { if (o === a.holder) return a; o = o.parent; } }
    return null;
  }
  function onTap(x, y) {
    const h = hitTest(x, y);
    if (!h) return;
    if (h.object === globe) { spin += 1.4; return; }
    const a = ownerActor(h.object);
    if (!a) return;
    hop(a.holder);
    if (isSpeaking()) { /* someone is talking: just the animation */ }
    else if (a === pet) speak(pet, lang(), `pet.${petId}.tickles`);
    else if (a === leo) { leo.play('wave_goodbye', { loop: false, fade: 0.3 }); if (!isSpeaking()) speak2(leo, lang(), 't.hello_friend.leo'); }
    else if (a === asha) { asha.play('wave_goodbye', { loop: false, fade: 0.3 }); if (!isSpeaking()) speak2(asha, lang(), 't.hello_friend.asha'); }
  }
  const onDown = (e) => { dragging = true; lastX = downX = e.clientX; downY = e.clientY; downT = performance.now(); targetSpin.active = false; };
  const onMove = (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX; lastX = e.clientX;
    globe.rotation.y += dx * 0.01;
    spin = dx * 0.6;
  };
  const onUp = (e) => {
    if (!dragging) return;
    dragging = false;
    if (Math.hypot(e.clientX - downX, e.clientY - downY) < 10 && performance.now() - downT < 400) onTap(e.clientX, e.clientY);
  };
  canvas.addEventListener('pointerdown', onDown);
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);


  // ---------------- little effects
  const hops = [];
  function hop(holder) { hops.push({ holder, t: 0, y0: 0.18 }); }
  const bursts = [];
  function burst(at) {
    const n = 40, geo = new THREE.BufferGeometry(), pos = new Float32Array(n * 3), vel = [];
    for (let i = 0; i < n; i++) { pos.set([at.x, at.y, at.z], i * 3); vel.push(new THREE.Vector3(rand(-2, 2), rand(1, 4), rand(-1, 1.5))); }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffd23f, size: 0.22, transparent: true }));
    scene.add(pts);
    bursts.push({ pts, vel, t: 0 });
  }

  // ---------------- per-frame update
  const tmp = new THREE.Vector3();
  app.scene = scene;
  app.camera = camera;
  app.update = (dt, time) => {
    for (const a of actors) {
      a.mixer.update(dt);
      updateBlink(a, dt);
      updateMouth(a, dt, time);
    }
    // globe spin with inertia, or easing to a chosen flag
    if (!dragging) {
      if (targetSpin.active) {
        globe.rotation.y += (targetSpin.angle - globe.rotation.y) * Math.min(1, dt * 3);
        if (Math.abs(targetSpin.angle - globe.rotation.y) < 0.002) targetSpin.active = false;
        spin = 0;
      } else {
        globe.rotation.y += spin * dt;
        spin += (0.15 - spin) * Math.min(1, dt * 0.8);       // settles to a slow idle turn
      }
    }
    for (let i = hops.length - 1; i >= 0; i--) {
      const h = hops[i];
      h.t += dt;
      h.holder.position.y = h.y0 + Math.sin(Math.min(h.t / 0.4, 1) * Math.PI) * 0.35;
      if (h.t >= 0.4) { h.holder.position.y = h.y0; hops.splice(i, 1); }
    }
    for (let i = bursts.length - 1; i >= 0; i--) {
      const b = bursts[i];
      b.t += dt;
      const a = b.pts.geometry.attributes.position;
      for (let k = 0; k < b.vel.length; k++) {
        b.vel[k].y -= 6 * dt;
        tmp.fromArray(a.array, k * 3).addScaledVector(b.vel[k], dt).toArray(a.array, k * 3);
      }
      a.needsUpdate = true;
      b.pts.material.opacity = Math.max(0, 1 - b.t / 1.2);
      if (b.t > 1.2) { scene.remove(b.pts); bursts.splice(i, 1); }
    }
    for (const u of updaters) u(dt, time);
  };
  window.__home = { scene, look, actors };   // debug handle

  // called when leaving the home page
  return () => {
    stopSpeech();
    document.getElementById('parent-tip').classList.remove('show');
    for (const t of timers) clearTimeout(t);
    clearTimeout(holdTimer);
    window.removeEventListener('resize', fit);
    canvas.removeEventListener('pointerdown', onDown);
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    for (const [el, ev, fn] of listeners) el.removeEventListener(ev, fn);
    ui.classList.add('hidden');
    row.classList.add('hidden');
    picker.classList.add('hidden');
    for (const a of actors) a.speech = null;
  };
}

// ------------------------------------------------------------------ themes
function buildVillage(scene, updaters, night) {
  // snowy Himalaya behind, green hills, little houses, a stupa and prayer flags
  const rock = mat(night ? 0x56607a : 0x8a9bb4, { flatShading: true });
  const snow = mat(0xffffff, { flatShading: true });
  for (const [x, z, r, h] of [[-22, -40, 9, 15], [-8, -46, 11, 19], [8, -44, 10, 17], [24, -40, 9, 14], [36, -48, 10, 16], [-34, -48, 10, 16]]) {
    const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 7), rock);
    m.position.set(x, h / 2 - 1, z);
    scene.add(m);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(r * 0.38, h * 0.38, 7), snow);
    cap.position.set(x, h - 1 - h * 0.19 + 0.05, z);
    scene.add(cap);
  }
  const hill = mat(night ? 0x355e33 : 0x6cc04a, { flatShading: true });
  for (const [x, z, s] of [[-16, -18, 8], [0, -22, 9], [15, -17, 8], [-28, -20, 7], [29, -21, 7]]) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(s, 16, 10), hill);
    m.scale.y = 0.45;
    m.position.set(x, -0.5, z);
    scene.add(m);
  }
  const wall = mat(0xfff3e0), roofs = [0xc0392b, 0x8e5a3c, 0x2e86de];
  for (const [x, z, s, i] of [[-13, -15, 1.2, 0], [-10.5, -16, 1, 1], [11, -14, 1.2, 2], [14, -16, 1, 0], [-19, -14, 0.9, 1]]) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(2 * s, 1.5 * s, 1.6 * s), wall);
    body.position.y = 0.75 * s;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.6 * s, 0.9 * s, 4), mat(roofs[i]));
    roof.position.y = 1.95 * s; roof.rotation.y = Math.PI / 4;
    g.add(body, roof);
    g.position.set(x, 1.7, z);
    scene.add(g);
  }
  // stupa
  const st = new THREE.Group();
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1.4, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xffffff));
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.0, 0.5, 24), mat(0xf1e6d0));
  plinth.position.y = 0.25; dome.position.y = 0.5;
  const harmika = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.7), mat(0xffd166));
  harmika.position.y = 2.1;
  const spire = new THREE.Mesh(new THREE.ConeGeometry(0.32, 1.4, 12), mat(0xffc107, { metalness: 0.4, roughness: 0.3 }));
  spire.position.y = 3.0;
  st.add(plinth, dome, harmika, spire);
  st.position.set(-9.5, 0, -6);
  scene.add(st);
  // prayer flags strung across the top of the view
  const cols = [0x1e88e5, 0xffffff, 0xe53935, 0x43a047, 0xfdd835];
  const strings = [[new THREE.Vector3(-14, 7.6, -4), new THREE.Vector3(-4.5, 6.4, -4)], [new THREE.Vector3(4.5, 6.4, -4), new THREE.Vector3(14, 7.6, -4)]];
  for (const [a, b] of strings) {
    const n = 14;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const p = a.clone().lerp(b, t);
      p.y -= Math.sin(t * Math.PI) * 0.7;
      const f = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.52), mat(cols[i % 5], { side: THREE.DoubleSide }));
      f.position.copy(p).add(new THREE.Vector3(0, -0.28, 0));
      scene.add(f);
      updaters.push((dt, time) => { f.rotation.x = Math.sin(time * 3 + i) * 0.25; });
    }
  }
  // a few round trees near the front
  for (const [x, z] of [[-7.5, -2.2], [7.8, -2.6], [-11.5, 0.5], [11.5, 0.2]]) tree(scene, x, z, 0x2d6a4f, 0x52b788);
}

function buildJungle(scene, updaters, night) {
  const dark = night ? 0x1b4332 : 0x2d6a4f, light = night ? 0x2d6a4f : 0x52b788;
  // layered trees behind
  for (let i = 0; i < 26; i++) {
    const x = rand(-30, 30), z = rand(-38, -12);
    tree(scene, x, z, dark, light, rand(1.6, 2.8));
  }
  for (const [x, z] of [[-8.2, -2.2], [8.4, -2.6], [-12, 0.8], [12.2, 0.2], [-6.5, -6], [6.8, -6.5]]) tree(scene, x, z, dark, light, 1.5);
  // giant leaves in the front corners
  const leafMat = mat(light, { side: THREE.DoubleSide });
  for (const [x, rz, ry] of [[-9.6, 0.5, 0.6], [-10.4, 0.9, 0.2], [9.8, -0.5, -0.6], [10.6, -0.9, -0.2]]) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(1.4, 16, 8), leafMat);
    leaf.scale.set(0.45, 1.5, 0.08);
    leaf.position.set(x, 1.3, 3.2);
    leaf.rotation.set(0.2, ry, rz);
    scene.add(leaf);
    updaters.push((dt, t) => { leaf.rotation.z = rz + Math.sin(t * 1.3 + x) * 0.05; });
  }
  // flowers
  for (let i = 0; i < 18; i++) {
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), mat(pick([0xff6fb5, 0xffd23f, 0xff8c42, 0xc77dff])));
    f.position.set(rand(-11, 11), 0.18, rand(-3, 3));
    if (Math.abs(f.position.x) < 4.6 && f.position.z > -1) continue;
    scene.add(f);
  }
  // butterflies: two-lobed wings with a dark edge and spots, a body and antennae
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0.0, 0.04);
  wingShape.bezierCurveTo(0.10, 0.42, 0.52, 0.48, 0.46, 0.14);   // big upper wing
  wingShape.bezierCurveTo(0.43, 0.02, 0.28, -0.03, 0.06, -0.02);
  wingShape.bezierCurveTo(0.30, -0.10, 0.30, -0.36, 0.12, -0.34); // smaller lower wing
  wingShape.bezierCurveTo(0.04, -0.32, 0.02, -0.16, 0.0, -0.06);
  wingShape.lineTo(0.0, 0.04);
  const wingGeo = new THREE.ShapeGeometry(wingShape, 16);
  const edgeMat = mat(0x2b2b3a, { side: THREE.DoubleSide, roughness: 0.6 });
  const spotMat = mat(0xffffff, { side: THREE.DoubleSide, roughness: 0.5 });
  const bodyMat = mat(0x2b2b3a, { roughness: 0.6 });
  const palettes = [[0xff8c42, 0xffd23f], [0x00a6ed, 0x7fdbff], [0xff6fb5, 0xffc2e0], [0x8e5cff, 0xd0b8ff], [0xffd23f, 0xfff3a6]];
  for (let i = 0; i < 6; i++) {
    const [c1, c2] = palettes[i % palettes.length];
    const b = new THREE.Group();
    const makeWing = (side) => {
      const w = new THREE.Group();
      const edge = new THREE.Mesh(wingGeo, edgeMat);
      edge.scale.set(1.12, 1.1, 1);
      edge.position.set(-0.01, 0.0, -0.004);
      const main = new THREE.Mesh(wingGeo, mat(c1, { side: THREE.DoubleSide, roughness: 0.5 }));
      const inner = new THREE.Mesh(wingGeo, mat(c2, { side: THREE.DoubleSide, roughness: 0.5 }));
      inner.scale.set(0.55, 0.55, 1);
      inner.position.set(0.03, 0.02, 0.003);
      const spot1 = new THREE.Mesh(new THREE.CircleGeometry(0.035, 12), spotMat);
      spot1.position.set(0.36, 0.28, 0.006);
      const spot2 = new THREE.Mesh(new THREE.CircleGeometry(0.025, 12), spotMat);
      spot2.position.set(0.42, 0.18, 0.006);
      w.add(edge, main, inner, spot1, spot2);
      w.scale.x = side;                                          // mirror for the left wing
      return w;
    };
    const right = new THREE.Group(), left = new THREE.Group();
    right.add(makeWing(1)); left.add(makeWing(-1));
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.03, 0.34, 4, 8), bodyMat);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), bodyMat);
    head.position.y = 0.23;
    const antenna = (side) => {
      const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 0.25, 0), new THREE.Vector3(side * 0.05, 0.36, 0.02), new THREE.Vector3(side * 0.11, 0.42, 0));
      const a = new THREE.Mesh(new THREE.TubeGeometry(curve, 8, 0.008, 5), bodyMat);
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), bodyMat);
      tip.position.set(side * 0.11, 0.42, 0);
      return [a, tip];
    };
    b.add(right, left, body, head, ...antenna(1), ...antenna(-1));
    b.scale.setScalar(rand(0.75, 1.05));
    scene.add(b);
    const ox = rand(-9, 9), oy = rand(2, 6), oz = rand(-3, 1), sp = rand(0.25, 0.5), ph = rand(0, 6);
    updaters.push((dt, t) => {
      const x = ox + Math.sin(t * sp + ph) * 2.5, y = oy + Math.sin(t * sp * 2 + ph) * 0.5 + Math.sin(t * 9 + ph) * 0.05;
      b.position.set(x, y, oz + Math.cos(t * sp + ph) * 1.2);
      b.rotation.set(-0.35, Math.cos(t * sp + ph) > 0 ? 0.5 : -0.5, Math.sin(t * sp + ph) * 0.15);   // tilted, turning as it drifts
      const flap = 0.15 + (Math.sin(t * 14 + ph) * 0.5 + 0.5) * 1.15;                               // wings open and close
      right.rotation.y = -flap;
      left.rotation.y = flap;
    });
  }
}

function tree(scene, x, z, dark, light, s = 1.3) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18 * s, 0.26 * s, 2.2 * s, 10), mat(0x8d5a3b));
  trunk.position.y = 1.1 * s;
  g.add(trunk);
  const leaves = mat(light, { flatShading: true }), leaves2 = mat(dark, { flatShading: true });
  for (const [dx, dy, r, m] of [[0, 2.6, 1.1, leaves], [-0.6, 2.2, 0.8, leaves2], [0.6, 2.3, 0.85, leaves2]]) {
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(r * s, 1), m);
    b.position.set(dx * s, dy * s, 0);
    b.castShadow = true;
    g.add(b);
  }
  g.position.set(x, 0, z);
  scene.add(g);
}

function buildClouds(scene, updaters, look) {
  const n = look.weather === 'cloudy' || look.weather === 'rain' || look.weather === 'snow' ? 9 : 4;
  const col = look.time === 'night' ? 0x8090c0 : (look.weather === 'rain' ? 0xd7dde8 : 0xffffff);
  const cloudMat = mat(col, { roughness: 1 });
  for (let i = 0; i < n; i++) {
    const c = new THREE.Group();
    for (const [dx, dy, r] of [[0, 0, 1.1], [1.1, 0.15, 0.85], [-1.1, 0.1, 0.8], [0.4, 0.65, 0.75]]) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 12), cloudMat);
      puff.position.set(dx, dy, 0);
      c.add(puff);
    }
    c.scale.setScalar(rand(0.8, 1.4));
    c.position.set(rand(-26, 26), rand(10, 15), rand(-26, -18));
    const sp = rand(0.2, 0.45);
    scene.add(c);
    updaters.push((dt) => { c.position.x += sp * dt; if (c.position.x > 30) c.position.x = -30; });
  }
}

function buildWeather(scene, updaters, kind) {
  const n = kind === 'snow' ? 500 : 700;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) pos.set([rand(-16, 16), rand(0, 14), rand(-10, 5)], i * 3);
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({
    color: kind === 'snow' ? 0xffffff : 0xb3d9ff, size: kind === 'snow' ? 0.14 : 0.07, transparent: true, opacity: kind === 'snow' ? 0.95 : 0.6,
  }));
  scene.add(pts);
  updaters.push((dt, t) => {
    const a = geo.attributes.position.array;
    for (let i = 0; i < n; i++) {
      a[i * 3 + 1] -= (kind === 'snow' ? 0.9 : 9) * dt;
      if (kind === 'snow') a[i * 3] += Math.sin(t + i) * 0.004;
      if (a[i * 3 + 1] < 0) a[i * 3 + 1] = 14;
    }
    geo.attributes.position.needsUpdate = true;
  });
}
