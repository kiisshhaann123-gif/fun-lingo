// Fun Lingo — word cards on the digital board
// Each card is a bright picture (from art.js) with the word in the language the
// child is learning, big, and the word in the home language, smaller, underneath.

import * as THREE from 'three';
import { ART, hasArt } from './art.js?v=2';

let WORDS = null;              // word -> { en, ja, ko, ne }
let LEARN = 'en', HOME = '';
// call once before making cards: loads the word list and sets the two languages
export async function prepareWords(learn, home) {
  if (!WORDS) {
    try { WORDS = await (await fetch('assets/course/words.json')).json(); } catch { WORDS = {}; }
  }
  LEARN = learn;
  HOME = home && home !== learn ? home : '';
}
export function hasObject(word) { return hasArt(word); }

const FRAMES = ['#ff8a1f', '#2f9bff', '#2fbf4a', '#a259ff', '#ff4f8b'];
const FONT = '"Arial Rounded MT Bold", "Hiragino Maru Gothic ProN", "Hiragino Sans", "Apple SD Gothic Neo", "Kohinoor Devanagari", "Noto Sans Devanagari", "Noto Sans JP", "Noto Sans KR", system-ui, sans-serif';
const CW = 512, CH = 700;      // card texture size
const label = (w, lang) => {
  const s = (WORDS && WORDS[w] && WORDS[w][lang]) || '';
  return lang === 'en' ? s.charAt(0).toUpperCase() + s.slice(1) : s;
};
function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
function fitText(g, text, max, size, weight) {
  let s = size;
  do { g.font = `${weight} ${s}px ${FONT}`; s -= 4; } while (g.measureText(text).width > max && s > 20);
}
function drawCard(word, i, img) {
  const c = document.createElement('canvas');
  c.width = CW; c.height = CH;
  const g = c.getContext('2d');
  const frame = FRAMES[i % FRAMES.length];
  g.fillStyle = 'rgba(0,0,0,.18)'; roundRect(g, 10, 22, CW - 20, CH - 26, 64); g.fill();      // soft shadow
  g.fillStyle = frame; roundRect(g, 4, 4, CW - 8, CH - 20, 64); g.fill();
  g.fillStyle = '#fff'; roundRect(g, 26, 26, CW - 52, CH - 64, 46); g.fill();
  if (img) g.drawImage(img, 66, 40, 380, 380);
  const learn = label(word, LEARN), home = HOME ? label(word, HOME) : '';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = '#2b2150';
  fitText(g, learn, CW - 90, home ? 88 : 100, 800);
  g.fillText(learn, CW / 2, home ? 498 : 530);
  if (home) {
    g.fillStyle = frame;
    fitText(g, home, CW - 110, 64, 700);
    g.fillText(home, CW / 2, 586);
  }
  return c;
}

// Returns a ready-to-place card. userData.toy is the part that moves.
export function makeObject(word, i = 0) {
  const root = new THREE.Group();
  const tex = new THREE.CanvasTexture(drawCard(word, i, null));
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const w = 1.62, h = w * CH / CW;
  const card = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide }));
  card.geometry.translate(0, h / 2, 0);                     // pivot at the bottom, so it bounces nicely
  root.add(card);
  if (ART[word]) {
    const img = new Image();
    img.onload = () => { tex.image = drawCard(word, i, img); tex.needsUpdate = true; };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(ART[word]);
  }
  root.userData = { word, toy: card, anim: null, t: 0, base: 1.8 };
  return root;
}

// Little animations: 'pop' (appear), 'wiggle' (look at me), 'dance' (right!), 'giggle' (oops), 'hint' (here I am)
export function animateObject(obj, kind) { obj.userData.anim = kind; obj.userData.t = 0; }

export function updateObject(obj, dt, time) {
  const u = obj.userData, toy = u.toy, B = u.base || 1;
  u.t += dt;
  const t = u.t;
  toy.rotation.set(0, 0, Math.sin(time * 1.3 + obj.position.x) * 0.025);
  toy.position.y = Math.sin(time * 2 + obj.position.x) * 0.03;
  obj.scale.setScalar(B);
  switch (u.anim) {
    case 'pop': {
      const k = Math.min(t / 0.5, 1);
      const c = 1.7;
      obj.scale.setScalar(B * Math.max(0.001, 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2)));
      if (k >= 1) u.anim = null;
      break;
    }
    case 'wiggle':
      toy.rotation.z = Math.sin(t * 16) * 0.12 * Math.max(0, 1 - t / 1.2);
      if (t > 1.2) u.anim = null;
      break;
    case 'dance':
      toy.position.y += Math.abs(Math.sin(t * 9)) * 0.3 * Math.max(0, 1 - t / 1.6);
      toy.rotation.z = Math.sin(t * 14) * 0.15 * Math.max(0, 1 - t / 1.6);
      obj.scale.setScalar(B * (1 + Math.abs(Math.sin(t * 9)) * 0.08 * Math.max(0, 1 - t / 1.6)));
      if (t > 1.6) u.anim = null;
      break;
    case 'giggle':
      toy.rotation.z = Math.sin(t * 30) * 0.08 * Math.max(0, 1 - t / 0.8);
      if (t > 0.8) u.anim = null;
      break;
    case 'hint':
      obj.scale.setScalar(B * (1 + Math.abs(Math.sin(t * 6)) * 0.1));
      toy.position.y += Math.abs(Math.sin(t * 6)) * 0.15;
      if (t > 2.4) u.anim = null;
      break;
    case 'leave': {
      const k = Math.min(t / 0.35, 1);
      obj.scale.setScalar(B * Math.max(0.001, 1 - k));
      break;
    }
  }
}

// ---------------- text from the language packs (phrases, story lines)
let TEXTS = null;
export async function loadTexts() {
  if (!TEXTS) { try { TEXTS = await (await fetch('assets/course/texts.json')).json(); } catch { TEXTS = {}; } }
}
export const textFor = (id, lang) => (TEXTS && TEXTS[lang] && TEXTS[lang][id]) || '';
// which teacher recorded a word clip (each word belongs to the teacher who taught it)
export const speakerOf = (id) => (TEXTS && TEXTS._speaker && TEXTS._speaker[id]) || '';
export const learnLang = () => LEARN;
export const homeLang = () => HOME;
const svgImage = (svg) => new Promise((res) => {
  const img = new Image();
  img.onload = () => res(img);
  img.onerror = () => res(null);
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
});

// A big panel for the board: pictures in a row, the line to say in the learning
// language, and its meaning in the home language underneath.
export function makeBanner(title, sub, words = [], colour = '#ff8a1f') {
  const W = 1024, H = 600;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const draw = (imgs) => {
    const g = c.getContext('2d');
    g.clearRect(0, 0, W, H);
    g.fillStyle = 'rgba(0,0,0,.18)'; roundRect(g, 10, 22, W - 20, H - 26, 60); g.fill();
    g.fillStyle = colour; roundRect(g, 4, 4, W - 8, H - 20, 60); g.fill();
    g.fillStyle = '#fff'; roundRect(g, 26, 26, W - 52, H - 64, 44); g.fill();
    const n = imgs.length, size = n ? Math.min(250, (W - 120) / n - 20) : 0;
    imgs.forEach((img, i) => { if (img) g.drawImage(img, W / 2 - (n * (size + 20) - 20) / 2 + i * (size + 20), 44, size, size); });
    g.textAlign = 'center'; g.textBaseline = 'middle';
    const y0 = n ? 44 + size + 30 : 200;
    g.fillStyle = '#2b2150';
    fitText(g, title, W - 110, sub ? 92 : 110, 800);
    g.fillText(title, W / 2, y0 + 50);
    if (sub) { g.fillStyle = colour; fitText(g, sub, W - 130, 60, 700); g.fillText(sub, W / 2, y0 + 140); }
    tex.needsUpdate = true;
  };
  draw([]);
  Promise.all(words.filter((w) => ART[w]).slice(0, 3).map((w) => svgImage(ART[w]))).then(draw);
  const w = 8.4, h = w * H / W;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
  const root = new THREE.Group();
  root.add(mesh);
  root.userData = { toy: mesh, anim: null, t: 0, base: 1 };
  return root;
}

// A caption strip for stories: the line in the learning language, meaning underneath.
export function makeCaption(title, sub) {
  const W = 1400, H = 190;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = 'rgba(255,255,255,.92)'; roundRect(g, 4, 4, W - 8, H - 8, 50); g.fill();
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = '#2b2150'; fitText(g, title, W - 80, sub ? 64 : 76, 800); g.fillText(title, W / 2, sub ? 66 : 95);
  if (sub) { g.fillStyle = '#ff4f8b'; fitText(g, sub, W - 100, 44, 700); g.fillText(sub, W / 2, 140); }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const w = 9.6, h = w * H / W;
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
}

// map a pet's name to its 3D model
export const PET_ACTOR = { beep: 'beep', gaju: 'elephant', sparky: 'dragon', bobo: 'monkey', himu: 'yeti', mimi: 'kitten', pandu: 'red_panda', stardust: 'stardust', roary: 'roary' };
