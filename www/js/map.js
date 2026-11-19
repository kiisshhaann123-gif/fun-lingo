// Fun Lingo — lesson map
// Shown before every lesson: the unit's 20 lessons as little picture stops on one
// winding path (10 across, a U-turn, 10 back). Done stops are bright with a star,
// today's stop pulses, later stops are soft. The child's pet walks to today's stop,
// points at it and says "Let's start today's lesson!".

import * as THREE from 'three';
import { say, stopSpeech, updateMouth, isSpeaking } from './speech.js?v=2';
import { ART } from './art.js?v=3';
import { fresh } from './variety.js?v=1';
import { PET_ACTOR } from './objects.js?v=9';

const BUILT = new Set(Array.from({ length: 20 }, (_, i) => i + 1));   // lessons that exist so far (Unit 1)
const UNITS_READY = 1;
const ICON = {
  hello: '🙋', bye: '👋', mom: '👩', dad: '👨', baby: '👶', hand: '✋', eyes: '👀', nose: '👃',
  dog: '🐶', cat: '🐱', cow: '🐮', bird: '🐦', fish: '🐟', butterfly: '🦋', elephant: '🐘', monkey: '🐵',
  red: '🔴', blue: '🔵', yellow: '🟡', green: '🟢', white: '⚪', black: '⚫',
  thankyou: '🙏', yes: '👍', no: '🙅', apple: '🍎', banana: '🍌', milk: '🥛', water: '💧', rice: '🍚', egg: '🥚', please: '🤲',
};
const TILE_COLOURS = ['#ff8a1f', '#2f9bff', '#2fbf4a', '#a259ff', '#ff4f8b'];
const STORE = {
  get(k, d) { try { const v = localStorage.getItem('funlingo.' + k); return v === null ? d : v; } catch { return d; } },
};

export function startMap(app, { lang }) {
  const { renderer, actorsById, updateBlink } = app;
  const canvas = renderer.domElement;
  const ui = document.getElementById('map-ui');
  const track = ui.querySelector('.map-track');
  const svg = ui.querySelector('.map-path');
  const hintEl = document.getElementById('tap-hint');
  const cleanups = [];
  const timers = [];
  let gone = false;
  const later = (fn, ms) => timers.push(setTimeout(() => { if (!gone) fn(); }, ms));
  const on = (el, ev, fn) => { el.addEventListener(ev, fn); cleanups.push(() => el.removeEventListener(ev, fn)); };

  // ---------------- where the child is
  let prog = { done: [], next: 1 };
  try { prog = JSON.parse(STORE.get('progress.' + lang, '')) || prog; } catch { /* fresh start */ }
  const unit = Math.min(UNITS_READY, Math.ceil(Math.max(prog.next, 1) / 20));
  const first = (unit - 1) * 20 + 1;
  const today = Math.min(prog.next, unit * 20);           // lesson number (1..160)
  const todayIdx = today - first;                          // 0..19 on this map

  // ---------------- 3D layer: only the pet, drawn on top of the map (taps go to the map)
  document.body.style.background = 'linear-gradient(180deg, #7fd0ff 0%, #b9e8ff 50%, #fff3c9 100%)';
  canvas.style.zIndex = '7';
  canvas.style.pointerEvents = 'none';
  cleanups.push(() => { canvas.style.zIndex = ''; canvas.style.pointerEvents = ''; });
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(0, 1, 0, -1, 1, 3000);   // 1 world unit = 1 screen pixel
  camera.position.set(0, 0, 1000);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd9c2a0, 1.7));
  const key = new THREE.DirectionalLight(0xffffff, 2.0);
  key.position.set(-300, 600, 800);
  scene.add(key);

  const petId = STORE.get('pet', 'beep');
  const pet = actorsById[PET_ACTOR[petId]] || actorsById.beep;
  const petLine = PET_ACTOR[petId] ? petId : 'beep';
  pet.loopOff = true;
  pet.holder.removeFromParent();
  pet.holder.rotation.set(0, 0, 0);
  pet.holder.scale.setScalar(1);
  pet.holder.visible = true;
  pet.holder.traverse((o) => { if (o.isMesh) for (const m of [].concat(o.material)) { m.clippingPlanes = null; m.needsUpdate = true; } });
  scene.add(pet.holder);
  pet.play('idle', { fade: 0.2 });
  const onFinished = (e) => { const nm = e.action.getClip().name; if (nm === 'wave') pet.play('idle', { fade: 0.4 }); };
  pet.mixer.addEventListener('finished', onFinished);
  cleanups.push(() => pet.mixer.removeEventListener('finished', onFinished));

  // ---------------- the 20 stops
  const stops = [];
  for (let i = 0; i < 20; i++) {
    const b = document.createElement('button');
    b.className = 'stop';
    b.style.setProperty('--tile', TILE_COLOURS[i % TILE_COLOURS.length]);
    b.innerHTML = '<span class="face"></span><span class="num"></span>';
    b.querySelector('.num').textContent = first + i;
    const n = first + i;
    if (prog.done.includes(n)) b.classList.add('done');
    else if (n === today) b.classList.add('today');
    else b.classList.add('later');
    if (n === today) { const r = document.createElement('span'); r.className = 'ring'; b.append(r); }
    if (prog.done.includes(n)) { const s = document.createElement('i'); s.className = 'star'; b.append(s); }
    track.append(b);
    stops.push(b);
    on(b, 'click', () => tapStop(n, b));
  }
  cleanups.push(() => { for (const b of stops) b.remove(); svg.innerHTML = ''; });

  // fill the pictures from the course file (falls back to Unit 1 until later units exist)
  fetch(`assets/course/unit${unit}.json`).then((r) => (r.ok ? r : fetch('assets/course/unit1.json'))).then((r) => r.json()).then((c) => {
    const lessons = c.lessons || c;
    lessons.forEach((L, i) => {
      if (!stops[i]) return;
      const face = stops[i].querySelector('.face');
      let icons = [];
      const pic = (w) => ART[w] || `<em>${ICON[w] || '⭐'}</em>`;
      if (L.words && L.words.length) icons = L.words.map(pic);
      else if ((L.type || '').startsWith('celebration')) { face.classList.add('gift'); icons = [ART.gift]; }
      else {                                            // review: one picture from each lesson it reviews
        face.classList.add('review');
        for (let k = i - 4; k < i; k++) { const p = lessons[k]; if (p && p.words && p.words[0]) icons.push(pic(p.words[0])); }
      }
      face.dataset.count = icons.length;
      face.innerHTML = icons.map((e) => `<b>${e}</b>`).join('');
      if (face.classList.contains('review')) face.insertAdjacentHTML('beforeend', '<i class="rstar"></i>');
    });
  }).catch(() => { /* pictures stay blank */ });

  // ---------------- layout: two gently waving rows joined by a U-turn on the right
  let L = null;
  function layout() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.left = 0; camera.right = w; camera.top = 0; camera.bottom = -h;
    camera.updateProjectionMatrix();
    const margin = Math.max(w * 0.07, 40);
    const step = (w - margin * 2.4) / 9;
    const tile = Math.min(step * 0.86, h * 0.15, 104);
    const rows = [h * 0.42, h * 0.75];
    const pts = [];
    for (let i = 0; i < 20; i++) {
      const row = i < 10 ? 0 : 1;
      const col = row === 0 ? i : 19 - i;
      pts.push({ x: margin + col * step, y: rows[row] + (col % 2 ? -1 : 1) * tile * 0.12 });
    }
    stops.forEach((b, i) => {
      Object.assign(b.style, { left: pts[i].x + 'px', top: pts[i].y + 'px', width: tile + 'px', height: tile + 'px' });
    });
    // path pieces; the walked part is golden
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    const seg = (a, b, i) => {
      if (i === 9) {                                     // the U-turn
        const r = (b.y - a.y) / 2, x = a.x + step * 0.2 + r * 0.55;
        return `M${a.x} ${a.y} C${x} ${a.y} ${x} ${b.y} ${b.x} ${b.y}`;
      }
      return `M${a.x} ${a.y} Q${(a.x + b.x) / 2} ${(a.y + b.y) / 2 + (i % 2 ? 1 : -1) * tile * 0.15} ${b.x} ${b.y}`;
    };
    let html = '';
    for (let i = 0; i < 19; i++) {
      const walked = i < todayIdx;
      html += `<path d="${seg(pts[i], pts[i + 1], i)}" class="${walked ? 'walked' : 'ahead'}"/>`;
    }
    svg.innerHTML = html;
    L = { pts, tile, petH: tile * 1.45 };
    pet.holder.children[0].scale.setScalar(L.petH);
    if (!walk) parkPet(Math.max(todayIdx, 0));
    if (hintOn) placeHint();
  }
  // the pet stands on top of a stop
  const standAt = (i) => ({ x: L.pts[i].x, y: -(L.pts[i].y - L.tile / 2 + 2) });
  function parkPet(i) { const p = standAt(i); pet.holder.position.set(p.x, p.y, 0); }

  // ---------------- the pet walks to today's stop and points at it
  let walk = null;                       // { from, to, t, dur }
  let hintOn = false;
  function placeHint() {
    const p = L.pts[todayIdx];
    hintEl.classList.add('up');
    hintEl.style.left = p.x + 'px';
    hintEl.style.top = (p.y + L.tile * 0.42) + 'px';
    hintEl.classList.remove('hidden');
  }
  function showHint() { hintOn = true; placeHint(); }
  function hideHint() { hintOn = false; hintEl.classList.add('hidden'); hintEl.classList.remove('up'); }

  // "Let's start today's lesson!" most of the time, with friendly variations
  async function startLine() {
    const k = Math.random() < 0.45 ? 'start_today' : fresh('pet.map', ['start_today', 'learn_together', 'you_can', 'lets_play', 'yay_here']);
    return `pet.${petLine}.${k}`;
  }

  async function intro() {
    const fromIdx = Math.max(todayIdx - 1, 0);
    parkPet(fromIdx);
    if (fromIdx !== todayIdx) {
      const a = standAt(fromIdx), b = standAt(todayIdx);
      walk = { a, b, t: 0, dur: 1.3 };
      pet.play('walk', { fade: 0.2 });
      pet.holder.rotation.y = b.x >= a.x ? Math.PI / 2 : -Math.PI / 2;
      await new Promise((r) => later(r, 1350));
    } else {
      hops.push({ t: 0 });
    }
    if (gone) return;
    walk = null;
    pet.holder.rotation.y = 0;
    parkPet(todayIdx);
    pet.play('wave', { loop: false, fade: 0.25 });
    const line = await startLine();
    if (gone) return;
    await say(pet, lang, line);
    if (!gone) later(showHint, 600);
  }

  // ---------------- taps
  const hops = [];
  function wiggle(b) { b.classList.remove('nope'); void b.offsetWidth; b.classList.add('nope'); }
  function tapStop(n, b) {
    if (n === today || prog.done.includes(n)) {
      if (!BUILT.has(n)) { wiggle(b); return; }            // that lesson's screen isn't built yet
      b.classList.add('go');
      hideHint();
      app.switchTo('lesson', { lang, n });
      return;
    }
    // a later stop: a gentle "not yet" and the pet points back at today's stop
    wiggle(b);
    hops.push({ t: 0 });
    pet.play('wave', { loop: false, fade: 0.25 });
    showHint();
  }
  const homeBtn = ui.querySelector('.map-home');
  on(homeBtn, 'click', () => app.switchTo('home'));

  // ---------------- go
  ui.classList.remove('hidden');
  layout();
  on(window, 'resize', layout);
  later(intro, 500);

  app.scene = scene;
  app.camera = camera;
  app.update = (dt, time) => {
    pet.mixer.update(dt);
    updateBlink(pet, dt);
    updateMouth(pet, dt, time);
    if (walk) {
      walk.t = Math.min(walk.t + dt / walk.dur, 1);
      const k = walk.t < 0.5 ? 2 * walk.t * walk.t : 1 - Math.pow(-2 * walk.t + 2, 2) / 2;
      pet.holder.position.set(walk.a.x + (walk.b.x - walk.a.x) * k, walk.a.y + (walk.b.y - walk.a.y) * k + Math.sin(walk.t * Math.PI) * L.tile * 0.35, 0);
    }
    for (let i = hops.length - 1; i >= 0; i--) {
      const h = hops[i];
      h.t += dt;
      const base = standAt(todayIdx);
      pet.holder.position.y = base.y + Math.sin(Math.min(h.t / 0.4, 1) * Math.PI) * L.tile * 0.3;
      if (h.t >= 0.4) { pet.holder.position.y = base.y; hops.splice(i, 1); }
    }
  };

  return () => {
    gone = true;
    stopSpeech();
    hideHint();
    for (const t of timers) clearTimeout(t);
    for (const c of cleanups) c();
    ui.classList.add('hidden');
    pet.speech = null;
    pet.holder.rotation.set(0, 0, 0);
  };
}
