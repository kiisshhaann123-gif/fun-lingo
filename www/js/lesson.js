// Fun Lingo — lesson screen
// Teach lessons: hello, warm-up, meet the new words, play, phrase, celebrate, goodbye.
// Review lessons: name the last lessons' words again and play with them.
// Lessons 10 and 20 add a picture story on the board; lesson 20 unlocks a new pet.
// Teachers say each line in the home language first, then in the learning language.
// Nothing is ever marked wrong.

import * as THREE from 'three';
import { fresh, teacherGreetings, PET_GREETINGS } from './variety.js?v=1';
import { say, stopSpeech, updateMouth, isSpeaking } from './speech.js?v=2';
import { makeObject, animateObject, updateObject, hasObject, prepareWords, loadTexts, textFor, speakerOf, makeBanner, makeCaption, PET_ACTOR } from './objects.js?v=9';

const STORE = {
  get(k, d) { try { const v = localStorage.getItem('funlingo.' + k); return v === null ? d : v; } catch { return d; } },
  set(k, v) { try { localStorage.setItem('funlingo.' + k, v); } catch { /* fine */ } },
};
const EXPRESSIONS = new Set(['hello', 'bye', 'thankyou', 'yes', 'no', 'please']);
const PACKS = ['en', 'ja', 'ko', 'ne'];
const VIEW = { left: -8.6, right: 8.6, bottom: -0.2, top: 8.4 };
const SLOTS = [-2.6, 0.6, 3.8];          // positions across the board
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((x) => x[1]);
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...extra });
const ABORT = Symbol('abort');

export function loadProgress(lang) {
  try { return JSON.parse(STORE.get('progress.' + lang, '')) || { done: [], next: 1 }; } catch { return { done: [], next: 1 }; }
}
function saveProgress(lang, p) { STORE.set('progress.' + lang, JSON.stringify(p)); }

// ---------------- classroom decoration: colourful, soft, and kept away from the board
// The wall texture covers x -20..20, y 0..16 (world units) at 64 px per unit.
const PX = 64;
function wallTexture() {
  const W = 40 * PX, H = 16 * PX;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const X = (x) => (x + 20) * PX, Y = (y) => H - y * PX;          // world -> canvas
  // two-tone wall: warm cream above, soft mint below, with gentle dots and stripes
  g.fillStyle = '#fff3dc'; g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(255,170,190,.18)';
  for (let x = 0; x < W; x += 72) for (let y = 0; y < Y(2.4); y += 72) { g.beginPath(); g.arc(x + ((y / 72) % 2) * 36, y, 7, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = '#c9f0e1'; g.fillRect(0, Y(2.4), W, H);
  g.fillStyle = 'rgba(255,255,255,.45)';
  for (let x = 0; x < W; x += 56) g.fillRect(x, Y(2.4), 22, H);
  g.fillStyle = '#ffd166'; g.fillRect(0, Y(2.5), W, 12);
  // paper flags along the top
  const flagCols = ['#ff6b6b', '#ffd166', '#06d6a0', '#4cc9f0', '#b388ff', '#ff8fc1'];
  g.strokeStyle = '#9c7a5b'; g.lineWidth = 4;
  g.beginPath(); g.moveTo(0, Y(9.7));
  for (let x = -20; x <= 20; x += 0.5) g.lineTo(X(x), Y(9.7 - Math.sin((x + 20) / 40 * Math.PI * 6) * -0.15 - 0.15));
  g.stroke();
  for (let i = 0, x = -19.5; x < 20; x += 1.1, i++) {
    const y = 9.55 - Math.abs(Math.sin((x + 20) / 40 * Math.PI * 6)) * 0.15;
    g.fillStyle = flagCols[i % flagCols.length];
    g.beginPath(); g.moveTo(X(x - 0.38), Y(y)); g.lineTo(X(x + 0.38), Y(y)); g.lineTo(X(x), Y(y - 0.75)); g.closePath(); g.fill();
  }
  // rainbow (top left) and a smiling sun (top right)
  const rx = X(-8.2), ry = Y(7.4);
  ['#ff6b6b', '#ffa94d', '#ffd166', '#69db7c', '#4dabf7', '#b197fc'].forEach((col, i) => {
    g.strokeStyle = col; g.lineWidth = 0.28 * PX;
    g.beginPath(); g.arc(rx, ry, (1.9 - i * 0.28) * PX, Math.PI, 0); g.stroke();
  });
  for (const dx of [-1.9, 1.9]) { g.fillStyle = '#fff'; for (const [ox, oy, r] of [[0, 0, 0.45], [0.45, 0.1, 0.35], [-0.45, 0.1, 0.35]]) { g.beginPath(); g.arc(rx + (dx + ox) * PX, ry + oy * PX, r * PX, 0, Math.PI * 2); g.fill(); } }
  const sx = X(9.0), sy = Y(8.0);
  g.fillStyle = '#ffb703';
  for (let a = 0; a < 12; a++) { g.save(); g.translate(sx, sy); g.rotate(a * Math.PI / 6); g.beginPath(); g.ellipse(0, -1.25 * PX, 0.14 * PX, 0.32 * PX, 0, 0, Math.PI * 2); g.fill(); g.restore(); }
  g.fillStyle = '#ffd43b'; g.beginPath(); g.arc(sx, sy, 0.9 * PX, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#2b2150';
  g.beginPath(); g.arc(sx - 0.3 * PX, sy - 0.1 * PX, 0.09 * PX, 0, Math.PI * 2); g.arc(sx + 0.3 * PX, sy - 0.1 * PX, 0.09 * PX, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#2b2150'; g.lineWidth = 5; g.beginPath(); g.arc(sx, sy + 0.1 * PX, 0.32 * PX, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();
  g.fillStyle = 'rgba(255,120,160,.6)'; g.beginPath(); g.arc(sx - 0.5 * PX, sy + 0.2 * PX, 0.13 * PX, 0, Math.PI * 2); g.arc(sx + 0.5 * PX, sy + 0.2 * PX, 0.13 * PX, 0, Math.PI * 2); g.fill();
  // framed "kid drawings" on both sides of the board
  const frame = (x, y, w, h, col, draw) => {
    g.save();
    g.translate(X(x), Y(y)); g.rotate((Math.random() - 0.5) * 0.08);
    g.fillStyle = 'rgba(0,0,0,.1)'; g.fillRect(-w * PX / 2 + 6, -h * PX / 2 + 8, w * PX, h * PX);
    g.fillStyle = col; g.fillRect(-w * PX / 2, -h * PX / 2, w * PX, h * PX);
    g.fillStyle = '#fff'; g.fillRect(-w * PX / 2 + 12, -h * PX / 2 + 12, w * PX - 24, h * PX - 24);
    draw(g, w * PX - 24, h * PX - 24);
    g.restore();
  };
  frame(-7.6, 5.0, 2.2, 1.8, '#ff8fab', (g) => {          // a house
    g.fillStyle = '#ffd166'; g.fillRect(-36, -6, 72, 46);
    g.fillStyle = '#ff6b6b'; g.beginPath(); g.moveTo(-46, -6); g.lineTo(0, -44); g.lineTo(46, -6); g.fill();
    g.fillStyle = '#4dabf7'; g.fillRect(-8, 14, 18, 26);
    g.fillStyle = '#69db7c'; g.fillRect(-64, 40, 128, 8);
  });
  frame(-8.2, 2.9, 1.8, 1.5, '#4dabf7', (g) => {          // a flower
    g.fillStyle = '#69db7c'; g.fillRect(-3, 0, 6, 40);
    g.fillStyle = '#ff8fc1'; for (let a = 0; a < 5; a++) { g.beginPath(); g.arc(Math.cos(a * 1.26) * 16, -6 + Math.sin(a * 1.26) * 16, 11, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#ffd166'; g.beginPath(); g.arc(0, -6, 9, 0, Math.PI * 2); g.fill();
  });
  frame(8.4, 5.4, 2.0, 1.7, '#69db7c', (g) => {           // a rocket
    g.fillStyle = '#ff6b6b'; g.beginPath(); g.moveTo(0, -46); g.quadraticCurveTo(22, -16, 16, 26); g.lineTo(-16, 26); g.quadraticCurveTo(-22, -16, 0, -46); g.fill();
    g.fillStyle = '#4dabf7'; g.beginPath(); g.arc(0, -10, 8, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#ffd166'; g.beginPath(); g.moveTo(-10, 26); g.lineTo(0, 46); g.lineTo(10, 26); g.fill();
  });
  // a little bookshelf (right) with colourful books
  const bx = X(8.0), by = Y(3.1);
  g.fillStyle = '#c98a55'; g.fillRect(bx - 1.3 * PX, by, 2.6 * PX, 0.16 * PX); g.fillRect(bx - 1.3 * PX, by - 1.1 * PX, 2.6 * PX, 0.14 * PX);
  let x0 = bx - 1.2 * PX;
  for (const [w, h, col] of [[0.24, 0.8, '#ff6b6b'], [0.2, 0.7, '#4dabf7'], [0.28, 0.86, '#ffd166'], [0.2, 0.66, '#69db7c'], [0.26, 0.8, '#b197fc'], [0.22, 0.74, '#ff8fc1']]) {
    g.fillStyle = col; g.fillRect(x0, by - h * PX, w * PX, h * PX); x0 += w * PX + 4;
  }
  g.fillStyle = '#ffd166'; g.beginPath(); g.arc(bx + 0.9 * PX, by - 0.3 * PX, 0.28 * PX, 0, Math.PI * 2); g.fill();   // a ball on the shelf
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}
function floorTexture() {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#f0c48f'; g.fillRect(0, 0, 1024, 512);
  for (let y = 0; y < 512; y += 32) {
    g.fillStyle = (y / 32) % 2 ? '#ecbd86' : '#f3c997'; g.fillRect(0, y, 1024, 30);
    g.fillStyle = 'rgba(150,100,60,.25)'; g.fillRect(0, y + 30, 1024, 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
// a potted plant in the corner
function plant(x, z) {
  const g = new THREE.Group();
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.35, 0.8, 20), new THREE.MeshStandardMaterial({ color: 0xff8a5c, roughness: 0.7 }));
  pot.position.y = 0.4;
  g.add(pot);
  const leaf = new THREE.MeshStandardMaterial({ color: 0x4fc26a, roughness: 0.8 });
  for (const [lx, ly, lz, r] of [[0, 1.25, 0, 0.5], [-0.3, 1.0, 0.1, 0.38], [0.32, 1.05, 0, 0.4], [0.05, 1.6, 0, 0.32]]) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), leaf);
    m.position.set(lx, ly, lz);
    g.add(m);
  }
  g.position.set(x, 0, z);
  return g;
}

export function startLesson(app, { lang, n }) {
  const { renderer, actorsById, updateBlink } = app;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
  const cleanups = [];
  const timers = [];
  let aborted = false;
  const objects = [];
  const actors = [];

  // ---------------- camera
  const lookAt = new THREE.Vector3();
  function fit() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const dist = Math.max((VIEW.top - VIEW.bottom) / 2 / t, (VIEW.right - VIEW.left) / 2 / (t * camera.aspect)) + 2;
    lookAt.set(0, (VIEW.top + VIEW.bottom) / 2, 0);
    camera.position.set(0, lookAt.y + 0.6, dist);
    camera.lookAt(lookAt);
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', fit);
  cleanups.push(() => window.removeEventListener('resize', fit));
  fit();

  // ---------------- a calm classroom with one big digital board (all learning happens on it)
  document.body.style.background = 'linear-gradient(180deg, #ffe9c7 0%, #fff4e0 100%)';
  scene.add(new THREE.HemisphereLight(0xfff6e8, 0xd9b38c, 1.5));
  const sun = new THREE.DirectionalLight(0xfff1d6, 2.0);
  sun.position.set(-5, 12, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -2, near: 1, far: 40 });
  scene.add(sun);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 20), new THREE.MeshStandardMaterial({ map: floorTexture(), roughness: 0.85 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(40, 16), new THREE.MeshBasicMaterial({ map: wallTexture() }));
  wall.position.set(0, 8, -4);
  scene.add(wall);
  scene.add(plant(-9.4, -2.9));
  scene.add(plant(9.8, -2.6));
  const skirting = new THREE.Mesh(new THREE.BoxGeometry(40, 0.5, 0.1), mat(0xff9fb8));
  skirting.position.set(0, 0.25, -3.95);
  scene.add(skirting);
  const BOARD = { x: 0.6, y: 4.35, w: 10.6, h: 6.0, z: -2.7 };
  const bezel = new THREE.Mesh(new THREE.BoxGeometry(BOARD.w + 0.5, BOARD.h + 0.5, 0.3), mat(0x2b2f3a, { roughness: 0.4 }));
  bezel.position.set(BOARD.x, BOARD.y, BOARD.z - 0.2);
  bezel.castShadow = true;
  scene.add(bezel);
  const sc = document.createElement('canvas');
  sc.width = 1024; sc.height = 580;
  const g2 = sc.getContext('2d');
  let screenTex = null;
  function paintScreen(mode) {
    if (mode === 'story') {                       // picture-book: sky, sun, clouds, hills
      const sky = g2.createLinearGradient(0, 0, 0, 580);
      sky.addColorStop(0, '#5ec8ff'); sky.addColorStop(1, '#c9f0ff');
      g2.fillStyle = sky; g2.fillRect(0, 0, 1024, 580);
      g2.fillStyle = '#ffd23f'; g2.beginPath(); g2.arc(900, 90, 52, 0, Math.PI * 2); g2.fill();
      g2.fillStyle = '#fff';
      for (const [x, y] of [[170, 90], [520, 60], [700, 130]]) for (const [dx, dy, r] of [[0, 0, 34], [36, 8, 28], [-34, 10, 26]]) { g2.beginPath(); g2.arc(x + dx, y + dy, r, 0, Math.PI * 2); g2.fill(); }
      g2.fillStyle = '#7ad66b'; g2.beginPath(); g2.ellipse(250, 600, 420, 190, 0, 0, Math.PI * 2); g2.fill();
      g2.fillStyle = '#54c25a'; g2.beginPath(); g2.ellipse(820, 620, 460, 200, 0, 0, Math.PI * 2); g2.fill();
    } else {
      const grad = g2.createLinearGradient(0, 0, 0, 580);
      grad.addColorStop(0, '#1d3b8a'); grad.addColorStop(1, '#2f6fd0');
      g2.fillStyle = grad; g2.fillRect(0, 0, 1024, 580);
      g2.fillStyle = 'rgba(255,255,255,0.07)';
      for (let x = 24; x < 1024; x += 48) for (let y = 24; y < 580; y += 48) { g2.beginPath(); g2.arc(x, y, 3, 0, Math.PI * 2); g2.fill(); }
    }
    if (screenTex) screenTex.needsUpdate = true;
  }
  paintScreen('board');
  screenTex = new THREE.CanvasTexture(sc);
  screenTex.colorSpace = THREE.SRGBColorSpace;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(BOARD.w, BOARD.h), new THREE.MeshBasicMaterial({ map: screenTex }));
  screen.position.set(BOARD.x, BOARD.y, BOARD.z - 0.04);
  scene.add(screen);
  const glowLight = new THREE.PointLight(0x9cc8ff, 6, 9, 1.6);   // the screen lights the toys on it
  glowLight.position.set(BOARD.x, BOARD.y, BOARD.z + 2.2);
  scene.add(glowLight);
  const led = new THREE.Mesh(new THREE.CircleGeometry(0.07, 16), new THREE.MeshBasicMaterial({ color: 0x3ec300 }));
  led.position.set(BOARD.x + BOARD.w / 2 - 0.05, BOARD.y - BOARD.h / 2 - 0.12, BOARD.z - 0.04);
  scene.add(led);

  // ---------------- characters
  const course = { lessons: [] };
  let petId = STORE.get('pet', 'beep');
  if (!PET_ACTOR[petId]) petId = 'beep';
  const pet = actorsById[PET_ACTOR[petId]] || actorsById.beep;
  const leads = { asha: actorsById.asha, leo: actorsById.leo };
  function place(actor, x, z, height, rotY) {
    if (!actor) return;
    actor.loopOff = true;
    actor.holder.removeFromParent();
    actor.holder.position.set(x, 0, z);
    actor.holder.rotation.set(0, rotY, 0);
    actor.holder.scale.setScalar(1);
    actor.holder.children[0].scale.setScalar(height);
    actor.holder.traverse((o) => { if (o.isMesh) for (const m of [].concat(o.material)) { m.clippingPlanes = null; m.needsUpdate = true; } });
    if (!actor.idleHooked) {
      actor.idleHooked = true;
      actor.mixer.addEventListener('finished', (e) => {
        const nm = e.action.getClip().name;
        if (nm === 'wave' || nm === 'wave_goodbye' || nm === 'bow') actor.play('idle', { fade: 0.4 });
      });
    }
    actor.play('idle', { fade: 0.2 });
    scene.add(actor.holder);
    actors.push(actor);
  }

  // ---------------- UI: back home, and the bar towards the next pet
  const ui = document.getElementById('lesson-ui');
  ui.classList.remove('hidden');
  const barFill = ui.querySelector('.unit-fill');
  const prog = loadProgress(lang);
  const doneInUnit = () => prog.done.filter((x) => x <= 20).length;
  barFill.style.width = (doneInUnit() / 20 * 100) + '%';
  const exitBtn = document.getElementById('btn-exit');
  const onExit = () => { aborted = true; stopSpeech(); app.switchTo('home'); };
  exitBtn.addEventListener('click', onExit);
  cleanups.push(() => exitBtn.removeEventListener('click', onExit));

  // ---------------- helpers that stop when the child leaves
  const check = () => { if (aborted) throw ABORT; };
  const wait = (ms) => new Promise((res) => timers.push(setTimeout(res, ms))).then(check);
  const voiceOf = (actor, id) => (id.startsWith('w.') && leads[speakerOf(id)]) || actor;   // word clips: the teacher who recorded it
  const talk = async (actor, id, opts) => { check(); await say(voiceOf(actor, id), lang, id, opts); check(); };
  const homeLang = STORE.get('homeLang', '');
  const bilingual = !!homeLang && homeLang !== lang && PACKS.includes(homeLang);
  const heard = new Set();
  // a teacher line: home language, a pause, then the learning language. Instructions
  // that keep coming back (t.*) are said in both languages only the first time.
  const two = async (actor, id, { always = false } = {}) => {
    check();
    const key = id.replace(/\.(asha|leo)$/, '');
    if (bilingual && (always || !id.startsWith('t.') || !heard.has(key))) {
      heard.add(key);
      await say(voiceOf(actor, id), homeLang, id); check();
      await say(voiceOf(actor, id), lang, id, { gap: 600 }); check();
    } else await talk(actor, id);
  };
  const anim = (actor, name) => { if (actor && actor.clips[name]) actor.play(name, { loop: false, fade: 0.3 }); };
  const petLine = (key) => talk(pet, `pet.${petId}.${key}`);
  const sayHint = async (word) => {               // pet whispers the word in the parent's language
    if (bilingual) { check(); await say(pet, homeLang, `w.${word}.say`, { volume: 0.6 }); check(); }
  };

  // ---------------- objects on the rug
  function showObjects(words) {
    clearObjects();
    const slots = words.length === 1 ? [SLOTS[1]] : words.length === 2 ? [SLOTS[0] + 0.6, SLOTS[2] - 0.6] : SLOTS;
    words.forEach((w, i) => {
      const o = makeObject(w, i);
      o.userData.base = words.length === 3 ? 1.85 : 2.2;      // bigger cards when there are fewer
      o.position.set(slots[i], 1.75, -2.3);            // standing on the board
      o.scale.setScalar(0.001);
      animateObject(o, 'pop');
      scene.add(o);
      objects.push(o);
    });
  }
  function clearObjects() { for (const o of objects.splice(0)) scene.remove(o); }

  // ---------------- taps
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let tapHandler = null;
  const canvas = renderer.domElement;
  const ownerOf = (obj) => {
    for (const o of objects) { let p = obj; while (p) { if (p === o) return { kind: 'object', o }; p = p.parent; } }
    for (const a of actors) { let p = obj; while (p) { if (p === a.holder) return { kind: 'actor', a }; p = p.parent; } }
    return null;
  };
  const onPointer = (e) => {
    ndc.set(e.clientX / window.innerWidth * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects([...objects, ...actors.map((a) => a.holder)], true);
    const who = hits.length ? ownerOf(hits[0].object) : null;
    if (!who) return;
    if (tapHandler) { tapHandler(who); return; }
    // free taps between steps: characters react
    if (who.kind === 'actor' && who.a === pet) { hop(pet.holder); if (!isSpeaking()) say(pet, lang, `pet.${petId}.tickles`); }
    else if (who.kind === 'object') animateObject(who.o, 'wiggle');
  };
  canvas.addEventListener('pointerdown', onPointer);
  cleanups.push(() => canvas.removeEventListener('pointerdown', onPointer));

  // Waits until the child taps the right object. Wrong taps giggle; after two, the teacher shows it.
  function waitForTap(word, lead) {
    return new Promise((resolve, reject) => {
      let misses = 0, busy = false;
      const target = objects.find((o) => o.userData.word === word);
      showHint(objects.slice(), 2.2, 4.1);
      tapHandler = async (who) => {
        if (busy || aborted) return;
        if (who.kind !== 'object') { if (who.a === pet) hop(pet.holder); return; }
        busy = true;
        try {
          if (who.o === target) {
            tapHandler = null;
            hideHint();
            animateObject(target, 'dance');
            resolve();
            return;
          }
          misses++;
          animateObject(who.o, 'giggle');
          if (misses === 1) await two(lead, `t.oops_look_again.${lead.id}`);
          else {
            await sayHint(word);
            animateObject(target, 'hint');
            showHint([target], 0, 4.1);                       // now the finger points at the right one
            await two(lead, `t.here_it_is.${lead.id}`);
          }
        } catch (err) { tapHandler = null; reject(err); return; }
        busy = false;
      };
    });
  }
  function waitForPetTap() {
    showHint([pet.holder], 0.8, 1.75);
    return new Promise((resolve) => { tapHandler = (who) => { if (who.kind === 'actor' && who.a === pet) { tapHandler = null; hideHint(); hop(pet.holder); resolve(); } }; });
  }

  // ---------------- tap hint: a bouncing finger shows the child where to tap
  const hintEl = document.getElementById('tap-hint');
  let hint = null;                   // { targets: [Object3D], t, delay, upBy }
  function showHint(targets, delay = 1.6, upBy = 2.2) { hint = { targets, t: 0, delay, upBy }; }
  function hideHint() { hint = null; hintEl.classList.add('hidden'); }
  const hintPos = new THREE.Vector3();
  function updateHint(dt) {
    if (!hint) return;
    hint.t += dt;
    if (hint.t < hint.delay || !hint.targets.length) { hintEl.classList.add('hidden'); return; }
    // with several choices the finger visits each one in turn, so it never gives the answer away
    const k = Math.floor((hint.t - hint.delay) / 1.3) % hint.targets.length;
    hint.targets[k].getWorldPosition(hintPos);
    hintPos.y += hint.upBy;
    hintPos.project(camera);
    hintEl.style.left = ((hintPos.x + 1) / 2 * window.innerWidth) + 'px';
    hintEl.style.top = ((1 - hintPos.y) / 2 * window.innerHeight) + 'px';
    hintEl.classList.remove('hidden');
  }

  // ---------------- effects
  const hops = [];
  function hop(holder) { hops.push({ holder, t: 0 }); }
  const sparks = [];
  function burst(at, color = 0xffd23f) {
    const n = 46, geo = new THREE.BufferGeometry(), pos = new Float32Array(n * 3), vel = [];
    for (let i = 0; i < n; i++) { pos.set([at.x, at.y, at.z], i * 3); vel.push(new THREE.Vector3(rand(-2.5, 2.5), rand(1.5, 5), rand(-1, 2))); }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color, size: 0.24, transparent: true }));
    scene.add(pts);
    sparks.push({ pts, vel, t: 0 });
  }
  function flyStar() {
    const s = document.createElement('div');
    s.className = 'fly-star';
    document.body.append(s);
    const bar = ui.querySelector('.unit-bar').getBoundingClientRect();
    requestAnimationFrame(() => {
      s.style.left = (bar.left + bar.width * Math.min(1, (doneInUnit() + 1) / 20)) + 'px';
      s.style.top = (bar.top + bar.height / 2) + 'px';
      s.style.transform = 'translate(-50%, -50%) scale(.5) rotate(360deg)';
    });
    timers.push(setTimeout(() => s.remove(), 1300));
  }

  // ---------------- board panels: the phrase to say, story captions
  let banner = null, caption = null;
  function showBanner(title, sub, words, colour) {
    hideBanner();
    banner = makeBanner(title, sub, words, colour);
    banner.position.set(BOARD.x, BOARD.y - 0.15, BOARD.z + 0.35);
    banner.userData.base = 1.15;
    banner.scale.setScalar(0.001);
    animateObject(banner, 'pop');
    scene.add(banner);
  }
  function hideBanner() { if (banner) { scene.remove(banner); banner = null; } }
  function showCaption(id) {
    hideCaption();
    const title = textFor(id, lang), sub = bilingual ? textFor(id, homeLang) : '';
    if (!title) return;
    caption = makeCaption(title, sub);
    caption.position.set(BOARD.x, BOARD.y + BOARD.h / 2 - 0.85, BOARD.z + 0.3);
    scene.add(caption);
  }
  function hideCaption() { if (caption) { scene.remove(caption); caption = null; } }
  const phraseText = (id) => ({ title: textFor(id, lang), sub: bilingual ? textFor(id, homeLang) : '' });

  // ---------------- story cards: a few small cards on the picture-book board
  const storyCards = new Map();
  function setStoryCards(list, anim = 'pop') {
    for (const [w, o] of storyCards) if (!list.includes(w)) { scene.remove(o); storyCards.delete(w); objects.splice(objects.indexOf(o), 1); }
    const n = list.length;
    const twoRows = n > 3;
    const perRow = twoRows ? Math.ceil(n / 2) : n;
    const base = twoRows ? 0.92 : 1.3;
    const gapX = twoRows ? 2.6 : 3.3;
    list.forEach((w, i) => {
      let o = storyCards.get(w);
      const fresh = !o;
      if (fresh) { o = makeObject(w, i); storyCards.set(w, o); objects.push(o); scene.add(o); o.scale.setScalar(0.001); }
      o.userData.base = base;
      const row = twoRows ? Math.floor(i / perRow) : 0, col = twoRows ? i % perRow : i;
      const cols = twoRows ? (row === 0 ? perRow : n - perRow) : n;
      o.position.set(BOARD.x + (col - (cols - 1) / 2) * gapX, twoRows ? (row === 0 ? 3.75 : 1.45) : 1.75, -2.3);
      if (fresh) animateObject(o, anim);
    });
  }
  function clearStoryCards() { setStoryCards([]); }

  // ---------------- the pet walks across the front of the board
  const moves = [];
  function walkPet(toX, secs = 1.6) {
    return new Promise((res) => {
      const h = pet.holder, fromX = h.position.x;
      pet.play('walk', { fade: 0.2 });
      h.rotation.y = toX > fromX ? Math.PI / 2 : -Math.PI / 2;
      moves.push({ h, fromX, toX, t: 0, secs, done: () => { h.rotation.y = 0.35; pet.play('idle', { fade: 0.3 }); res(); } });
    });
  }

  // ---------------- stories (lines are in the packs; this says what moves on screen)
  const STORIES = {
    who_says_hello: [
      { by: 'narr', walk: 2.4 }, { by: 'pet', wave: true },
      { by: 'narr', cards: ['dog'] }, { by: 'narr', cards: ['dog', 'cat'] }, { by: 'narr', cards: ['dog', 'cat', 'cow'] },
      { by: 'narr', cards: ['dog', 'cat', 'cow', 'bird'] }, { by: 'narr', cards: ['dog', 'cat', 'cow', 'bird', 'elephant', 'monkey'] },
      { by: 'narr', dance: true }, { by: 'pet', wave: true, walk: -3.3, wiggle: true },
    ],
    beeps_big_day: [
      { by: 'narr', burst: true, hop: true }, { by: 'pet', wave: true },
      { by: 'narr', cards: ['apple', 'banana'] }, { by: 'pet', dance: true, hop: true },
      { by: 'narr', cards: ['mom', 'rice', 'egg'] }, { by: 'pet', cards: ['mom', 'rice', 'egg', 'thankyou'], wave: true },
      { by: 'narr', cards: ['dad', 'milk', 'water'] }, { by: 'narr', cards: ['fish', 'butterfly', 'cow'] },
      { by: 'pet', cards: ['bye'], wave: true, burst: true },
    ],
  };
  async function playStory(name, narr) {
    const steps = STORIES[name];
    if (!steps) return;
    await two(narr, `t.story_time.${narr.id}`);
    paintScreen('story');
    await wait(1200);
    const seen = [];
    for (let i = 0; i < steps.length; i++) {
      const st = steps[i], id = `story.${name}.${i + 1}`;
      const before = [...storyCards.keys()];
      if (st.cards) setStoryCards(st.cards);
      const added = st.cards ? st.cards.filter((w) => !before.includes(w)) : [];
      showCaption(id);
      await wait(added.length ? 900 : 500);                    // a moment to see what popped up
      if (st.burst) burst(new THREE.Vector3(BOARD.x, 5, -1.5), pick([0xffd23f, 0xff6fb5, 0x3ec300]));
      if (st.hop) hop(pet.holder);
      if (st.wave) anim(pet, 'wave');
      if (st.dance) for (const o of storyCards.values()) animateObject(o, 'dance');
      if (st.wiggle) for (const o of storyCards.values()) animateObject(o, 'wiggle');
      const walking = st.walk !== undefined ? walkPet(st.walk) : null;
      if (st.by === 'pet') await talk(pet, id);
      else await two(narr, id, { always: true });
      if (walking) await walking;
      await wait(1400);                                        // time to think about it
      // name each new picture slowly, one at a time
      for (const w of added) {
        const o = storyCards.get(w);
        if (o) animateObject(o, 'hint');
        await talk(narr, `w.${w}.say`);
        await wait(1300);
        if (!seen.includes(w)) seen.push(w);
      }
      if (added.length) await wait(600);
    }
    hideCaption();
    // look back: what did we see in the story?
    if (seen.length) {
      await wait(800);
      await two(narr, `t.remember.${narr.id}`);
      const recap = seen.slice(-6);
      setStoryCards(recap);
      await wait(1200);
      for (const w of recap) {
        const o = storyCards.get(w);
        if (o) animateObject(o, 'wiggle');
        await talk(narr, `w.${w}.say`);
        await wait(1500);
      }
      anim(pet, 'wave');
      await petLine(fresh('pet.story', ['like_word', 'yay', 'so_clever', 'hooray']));
      await wait(800);
    }
    clearStoryCards();
    paintScreen('board');
  }

  // ---------------- lesson 20: choose a new pet
  const PET_NAMES = ['gaju', 'sparky', 'bobo', 'himu', 'mimi', 'pandu', 'stardust', 'roary'];
  const silhouette = new THREE.MeshBasicMaterial({ color: 0x3a2f6b });
  const shadowed = [];
  function darken(actor, on) {
    actor.holder.traverse((o) => {
      if (!o.isMesh) return;
      if (on) { if (!o.userData.realMat) { o.userData.realMat = o.material; o.material = silhouette; shadowed.push(o); } }
      else if (o.userData.realMat) { o.material = o.userData.realMat; delete o.userData.realMat; }
    });
  }
  cleanups.push(() => { for (const o of shadowed) if (o.userData.realMat) { o.material = o.userData.realMat; delete o.userData.realMat; } });
  async function choosePet(lead) {
    const owned = (() => { try { return JSON.parse(STORE.get('pets', '[]')); } catch { return []; } })();
    const names = PET_NAMES.filter((p) => !owned.includes(p) && actorsById[PET_ACTOR[p]]);
    if (!names.length) return;
    await two(lead, `unlock.did_it_20.${lead.id}`);
    for (let i = 0; i < 5; i++) timers.push(setTimeout(() => burst(new THREE.Vector3(rand(-4, 5), rand(3, 6), -1), pick([0xffd23f, 0xff6fb5, 0x3ec300, 0x00a6ed])), i * 300));
    await two(lead, `unlock.who_new_friend.${lead.id}`);
    // the old pet steps aside; the new friends wait in a row, still in shadow
    walkPet(-7.4, 1.2);
    const lineup = names.map((name, i) => {
      const a = actorsById[PET_ACTOR[name]];
      place(a, -3.9 + i * (9.4 / Math.max(names.length - 1, 1)), 2.0, 1.65, 0);
      a.isPet = true;
      darken(a, true);
      return { name, a };
    });
    showBanner('?', '', ['gift'], '#a259ff');
    showHint(lineup.map((p) => p.a.holder), 1.5, 1.95);
    const chosen = await new Promise((resolve) => {
      tapHandler = (who) => {
        if (who.kind !== 'actor') return;
        const p = lineup.find((x) => x.a === who.a);
        if (p) { tapHandler = null; resolve(p); }
      };
    });
    check();
    hideHint();
    hideBanner();
    darken(chosen.a, false);
    chosen.a.holder.position.x = BOARD.x;                        // the new friend steps to the middle
    chosen.a.holder.children[0].scale.setScalar(2.2);
    hop(chosen.a.holder);
    anim(chosen.a, 'wave');
    burst(chosen.a.holder.position.clone().add(new THREE.Vector3(0, 1.4, 0)), 0xffd23f);
    for (const p of lineup) if (p !== chosen) { darken(p.a, false); p.a.holder.visible = false; }
    owned.push(chosen.name);
    STORE.set('pets', JSON.stringify(owned));
    STORE.set('pet', chosen.name);
    await two(lead, `unlock.this_is_${chosen.name}.${lead.id}`);
    await talk(chosen.a, `pet.${chosen.name}.happy_meet`);
    await two(lead, `unlock.hooray.${lead.id}`);
    for (const p of lineup) if (p !== chosen) { scene.remove(p.a.holder); p.a.holder.visible = true; actors.splice(actors.indexOf(p.a), 1); }
  }

  // ---------------- the lesson itself
  async function run() {
    const res = await fetch('assets/course/unit1.json');
    Object.assign(course, await res.json());
    check();
    const L = course.lessons.find((l) => l.n === n) || course.lessons[0];
    const lead = leads[L.lead], other = leads[L.lead === 'asha' ? 'leo' : 'asha'];
    lead.id = L.lead; other.id = L.lead === 'asha' ? 'leo' : 'asha';
    place(lead, -5.3, 0.5, 3.6, 0.45);
    place(other, 6.2, -1.2, 3.3, -0.5);
    if (pet) { pet.isPet = true; place(pet, -3.3, 1.9, 1.35, 0.35); pet.holder.visible = n !== 1; }
    await Promise.all([prepareWords(lang, homeLang), loadTexts()]);
    check();
    const isTeach = L.type === 'teach';
    const teachWords = (from, to) => course.lessons.filter((l) => l.n >= from && l.n <= to && l.type === 'teach').flatMap((l) => l.words);
    const learnedNouns = teachWords(1, L.n - 1).filter((w) => !EXPRESSIONS.has(w) && hasObject(w));
    // review lessons look back at the four lessons before them
    const reviewPool = teachWords(L.n - 4, L.n - 1).filter(hasObject);
    const reviewNouns = reviewPool.filter((w) => !EXPRESSIONS.has(w));
    const words = isTeach ? L.words : L.type === 'review' ? shuffle(reviewPool).slice(0, 3) : [];

    // 1. hello (lesson 1: Beep arrives)
    if (n === 1) await beepArrives(lead, other);
    else {
      anim(lead, 'wave_goodbye');
      await two(lead, `t.${fresh('teacher.greet', teacherGreetings())}.${lead.id}`, { always: true });
      anim(pet, 'wave');
      await petLine(fresh('pet.greet', PET_GREETINGS));
    }

    if (isTeach) {
      // 2. warm-up with two older words
      if (learnedNouns.length >= 2) {
        await two(lead, `t.game_first.${lead.id}`);
        const pair = shuffle(learnedNouns).slice(0, 2);
        showObjects(pair);
        await wait(600);
        const w = pick(pair);
        await two(lead, `w.${w}.find`);
        await waitForTap(w, lead);
        await talk(lead, `w.${w}.yes`);
        await petLine(fresh('pet.cheer1', ['yay', 'great_job', 'high_five']));
        clearObjects();
      }

      // 3. meet the new words
      for (const w of words) {
        showObjects([w]);
        await wait(500);
        animateObject(objects[0], 'wiggle');
        if (w === 'hello' || w === 'bye') anim(lead, 'wave_goodbye');
        if (w === 'thankyou') anim(lead, 'bow');
        if (EXPRESSIONS.has(w)) {
          await talk(lead, `w.${w}.say`);
          await sayHint(w);                                      // what it means, in the home language
        } else {
          await two(lead, `w.${w}.look`);                        // "Look! A nose!" in both languages
          await talk(lead, `w.${w}.say`);
        }
        await two(lead, `t.say_with_me.${lead.id}`);
        await talk(lead, `w.${w}.say`);
        await wait(1700);                                        // time for the child to say it
        await petLine(fresh('pet.cheer2', ['like_word', 'again_again', 'yay', 'say_it']));
        clearObjects();
      }

      // 4. play: find the new words (with older words mixed in)
      const nouns = words.filter((w) => !EXPRESSIONS.has(w) && hasObject(w));
      if (nouns.length) {
        await findGame(lead, nouns, learnedNouns);
      } else {
        // greetings and little words: the child says it to the pet, with the card on the board
        for (const w of words) {
          showObjects([w]);
          await two(lead, `t.your_turn.${lead.id}`);
          await petLine('your_turn');
          await waitForPetTap();
          anim(pet, 'wave');
          await petLine(w === 'bye' ? 'bye' : w === 'hello' ? 'hi_friend' : fresh('pet.reply', ['yay', 'like_word', 'great_job']));
          await two(lead, `t.great_job.${lead.id}`);
          clearObjects();
        }
      }

      // 5. phrase: both teachers say it, then the child; the board shows what to say
      if (L.phrase) {
        const id = `${L.phrase}.${lead.id}`;
        const { title, sub } = phraseText(id);
        showBanner(title, sub, words.filter(hasObject), pick(['#ff8a1f', '#2f9bff', '#2fbf4a', '#a259ff', '#ff4f8b']));
        await wait(500);
        await two(lead, id, { always: true });
        await talk(other, `${L.phrase}.${other.id}`);
        await two(lead, `t.your_turn.${lead.id}`);
        if (banner) animateObject(banner, 'hint');
        await wait(2200);
        await two(lead, `t.well_done.${lead.id}`);
        hideBanner();
      }
    } else if (L.type === 'review') {
      // 2. remember these? the teacher names each card again
      await two(lead, `t.remember.${lead.id}`);
      showObjects(words);
      await wait(600);
      for (const o of objects.slice()) {
        animateObject(o, 'wiggle');
        await talk(lead, `w.${o.userData.word}.say`);
        await wait(900);
      }
      await petLine(fresh('pet.cheer2', ['like_word', 'again_again', 'yay']));
      clearObjects();
      // 3. play with all of them
      await findGame(lead, shuffle(reviewNouns).slice(0, 4), reviewNouns, 4);
    }

    // story time (lessons 10 and 20)
    if (L.story) await playStory(L.story, leads.leo);

    // 6. celebrate
    burst(new THREE.Vector3(0.6, 4.4, -1.6));
    flyStar();
    if (!prog.done.includes(L.n)) prog.done.push(L.n);
    prog.next = Math.max(prog.next || 1, L.n + 1);
    saveProgress(lang, prog);
    timers.push(setTimeout(() => { barFill.style.width = (doneInUnit() / 20 * 100) + '%'; }, 900));
    await two(lead, `t.got_star.${lead.id}`, { always: true });
    anim(pet, 'wave');
    await petLine(fresh('pet.cheer5', ['you_did_it', 'proud', 'hooray']));

    // lesson 20: a new friend
    if (L.unlock) await choosePet(lead);

    // 7. goodbye: today's words once more
    if (words.length) {
      await two(lead, `t.learned_so_much.${lead.id}`);
      showObjects(words.filter(hasObject).slice(0, 3));
      for (const w of words) {
        const o = objects.find((x) => x.userData.word === w);
        if (o) animateObject(o, 'wiggle');
        await talk(lead, `w.${w}.say`);
        await wait(300);
      }
      clearObjects();
    }
    anim(lead, 'wave_goodbye');
    anim(other, 'wave_goodbye');
    await two(lead, `t.bye.${lead.id}`, { always: true });
    await petLine('bye');
    showDone(L);
  }

  // tap the right card: "Where is the nose?" in both languages, then the child taps
  async function findGame(lead, targets, others, maxRounds) {
    await two(lead, `t.tap_it.${lead.id}`);
    const extra = shuffle(others.filter((w) => !targets.includes(w))).slice(0, Math.max(0, 3 - Math.min(targets.length, 3)));
    let set = shuffle([...targets.slice(0, 3), ...extra]).slice(0, 3);
    showObjects(set);
    await wait(700);
    const rounds = shuffle([...targets, ...targets]).slice(0, maxRounds || Math.min(4, targets.length * 2));
    for (let i = 0; i < rounds.length; i++) {
      const w = rounds[i];
      if (!set.includes(w)) {                                   // bring the word onto the board
        set = shuffle([w, ...shuffle(set).slice(0, 2)]);
        showObjects(set);
        await wait(600);
      }
      if (i === rounds.length - 1) await two(lead, `t.last_one.${lead.id}`);
      await two(lead, `w.${w}.find`);
      await waitForTap(w, lead);
      await talk(lead, `w.${w}.yes`);
      anim(pet, 'wave');
      await petLine(fresh('pet.cheer4', ['yay', 'you_did_it', 'great_job', 'so_clever', 'high_five']));
    }
    clearObjects();
  }

  // big, wordless "you finished!" card: three stars, the unit's 20 dots, home or next
  function showDone(L) {
    const done = document.getElementById('lesson-done');
    const dots = done.querySelector('.done-dots');
    dots.innerHTML = '';
    for (let i = 1; i <= 20; i++) {
      const d = document.createElement('span');
      if (prog.done.includes(i)) d.className = i === L.n ? 'on now' : 'on';
      dots.append(d);
    }
    done.classList.remove('hidden');
    for (let i = 0; i < 4; i++) timers.push(setTimeout(() => burst(new THREE.Vector3(rand(-3, 4), rand(3, 6), -1), pick([0xffd23f, 0xff6fb5, 0x3ec300, 0x00a6ed])), i * 350));
    anim(pet, 'wave');
    hop(pet.holder);
    const home = document.getElementById('btn-done-home'), next = document.getElementById('btn-done-next');
    const goHome = () => { done.classList.add('hidden'); app.switchTo('home'); };
    const goNext = () => { done.classList.add('hidden'); app.switchTo('map', { lang }); };
    home.addEventListener('click', goHome, { once: true });
    next.addEventListener('click', goNext, { once: true });
    cleanups.push(() => { home.removeEventListener('click', goHome); next.removeEventListener('click', goNext); done.classList.add('hidden'); });
  }

  async function beepArrives(lead, other) {
    // a gift box wobbles, pops open, and Beep jumps out
    const box = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.1, 1.3), mat(0xff6fb5, { roughness: 0.5 }));
    body.position.y = 0.55;
    const lid = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.3, 1.45), mat(0xff8fab, { roughness: 0.5 }));
    lid.position.y = 1.25;
    const ribbon1 = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.12, 1.32), mat(0xffd23f));
    ribbon1.position.y = 0.55;
    const ribbon2 = new THREE.Mesh(new THREE.BoxGeometry(1.32, 1.12, 0.22), mat(0xffd23f));
    ribbon2.position.y = 0.55;
    box.add(body, lid, ribbon1, ribbon2);
    box.position.set(-3.3, 0, 1.9);
    box.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    scene.add(box);
    const lines = [lead, other, lead, pet, other, pet, lead, pet];
    const ids = lines.map((_, i) => `beep_intro.${i + 1}`);
    anim(lead, 'wave_goodbye');
    await two(lead, ids[0]);
    anim(other, 'wave_goodbye');
    await two(other, ids[1]);
    boxWobble = { box, t: 0 };
    await two(lead, ids[2]);
    boxWobble = null;
    // pop!
    lidFly = { lid, t: 0 };
    burst(new THREE.Vector3(-3.3, 1.6, 1.9), 0xff6fb5);
    timers.push(setTimeout(() => { scene.remove(box); }, 700));
    pet.holder.visible = true;
    hop(pet.holder);
    anim(pet, 'wave');
    await talk(pet, ids[3]);
    await two(other, ids[4]);
    await talk(pet, ids[5]);
    await two(lead, ids[6]);
    await waitForPetTap();
    anim(pet, 'wave');
    await talk(pet, ids[7]);
  }
  let boxWobble = null, lidFly = null;

  // ---------------- every frame
  app.scene = scene;
  app.camera = camera;
  const tmp = new THREE.Vector3();
  app.update = (dt, time) => {
    for (const a of actors) { a.mixer.update(dt); updateBlink(a, dt); updateMouth(a, dt, time); }
    for (const o of objects) updateObject(o, dt, time);
    if (banner) updateObject(banner, dt, time);
    for (let i = moves.length - 1; i >= 0; i--) {
      const m = moves[i];
      m.t = Math.min(m.t + dt / m.secs, 1);
      m.h.position.x = m.fromX + (m.toX - m.fromX) * m.t;
      if (m.t >= 1) { moves.splice(i, 1); m.done(); }
    }
    updateHint(dt);
    for (let i = hops.length - 1; i >= 0; i--) {
      const h = hops[i];
      h.t += dt;
      h.holder.position.y = Math.sin(Math.min(h.t / 0.4, 1) * Math.PI) * 0.4;
      if (h.t >= 0.4) { h.holder.position.y = 0; hops.splice(i, 1); }
    }
    if (boxWobble) { boxWobble.t += dt; boxWobble.box.rotation.z = Math.sin(boxWobble.t * 22) * 0.08; }
    if (lidFly) {
      lidFly.t += dt;
      lidFly.lid.position.y = 1.25 + lidFly.t * 6 - lidFly.t * lidFly.t * 9;
      lidFly.lid.rotation.z = lidFly.t * 6;
      if (lidFly.t > 1) lidFly = null;
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const b = sparks[i];
      b.t += dt;
      const a = b.pts.geometry.attributes.position;
      for (let k = 0; k < b.vel.length; k++) { b.vel[k].y -= 7 * dt; tmp.fromArray(a.array, k * 3).addScaledVector(b.vel[k], dt).toArray(a.array, k * 3); }
      a.needsUpdate = true;
      b.pts.material.opacity = Math.max(0, 1 - b.t / 1.4);
      if (b.t > 1.4) { scene.remove(b.pts); sparks.splice(i, 1); }
    }
  };

  // test hook (only with ?debug in the address): tap things from the console
  if (location.search.includes('debug')) {
    window.__lesson = {
      waiting: () => !!tapHandler,
      words: () => objects.map((o) => o.userData.word),
      tapWord: (w) => { const o = objects.find((x) => x.userData.word === w); if (o && tapHandler) tapHandler({ kind: 'object', o }); },
      tapPet: () => tapHandler && tapHandler({ kind: 'actor', a: pet }),
      tapActor: (id) => { const a = actorsById[id]; if (a && tapHandler) tapHandler({ kind: 'actor', a }); },
    };
  }
  run().catch((err) => { if (err !== ABORT) console.error('Lesson stopped:', err); });

  // called when leaving this page
  return () => {
    aborted = true;
    tapHandler = null;
    stopSpeech();
    hideHint();
    for (const t of timers) clearTimeout(t);
    for (const c of cleanups) c();
    ui.classList.add('hidden');
    for (const a of actors) { a.speech = null; if (a.holder) { a.holder.visible = true; a.holder.rotation.set(0, 0, 0); } }
  };
}
