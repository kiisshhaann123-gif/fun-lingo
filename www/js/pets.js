// Fun Lingo — pets room
// All nine pets stand on little stands. Friends already earned are in colour and can be
// chosen as "my pet" (a gold ring shows which one); the others wait in shadow with a lock.

import * as THREE from 'three';
import { say, stopSpeech, updateMouth, isSpeaking } from './speech.js?v=2';
import { PET_ACTOR } from './objects.js?v=9';
import { t, ALL_PETS, PET_NAMES, ownedPets, learnLanguage, homeLanguage } from './ui.js?v=2';

const SPOTS = [                     // back row of five, front row of four
  [-4.8, -2.4], [-2.4, -2.4], [0, -2.4], [2.4, -2.4], [4.8, -2.4],
  [-3.6, 1.4], [-1.2, 1.4], [1.2, 1.4], [3.6, 1.4],
];
const STAND_COLOURS = [0xff8fab, 0xffd166, 0x8ecae6, 0x95d5b2, 0xcdb4db, 0xffb4a2, 0x90e0ef, 0xf4a261, 0xb5e48c];
const STORE = {
  get(k, d) { try { const v = localStorage.getItem('funlingo.' + k); return v === null ? d : v; } catch { return d; } },
  set(k, v) { try { localStorage.setItem('funlingo.' + k, v); } catch { /* fine */ } },
};

export function startPets(app) {
  const { renderer, actorsById, updateBlink } = app;
  const lang = learnLanguage();          // pets talk in the language being learned
  const nameLang = homeLanguage();       // written names are for grown-ups: home language
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
  const cleanups = [];
  const timers = [];
  const on = (el, ev, fn, opt) => { el.addEventListener(ev, fn, opt); cleanups.push(() => el.removeEventListener(ev, fn, opt)); };

  function fit() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const dist = Math.max(12.5, 17 / camera.aspect);             // keep all nine in view on narrow screens
    camera.position.set(0, dist * 0.68, dist);                   // looking down a little, so the rows don't hide each other
    camera.lookAt(0, 0.6, -0.4);
    camera.updateProjectionMatrix();
  }
  on(window, 'resize', fit);
  fit();

  // ---------------- a soft, bright room
  document.body.style.background = 'linear-gradient(180deg, #ffd6ec 0%, #fff1d6 60%, #ffe8b8 100%)';
  scene.add(new THREE.HemisphereLight(0xffffff, 0xffd9b0, 1.6));
  const sun = new THREE.DirectionalLight(0xffffff, 1.8);
  sun.position.set(-4, 10, 8);
  scene.add(sun);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(9, 64), new THREE.MeshStandardMaterial({ color: 0xffe3c2, roughness: 0.9 }));
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  // ---------------- the pets on their stands
  const owned = ownedPets();
  let current = STORE.get('pet', 'beep');
  if (!owned.includes(current)) current = 'beep';
  const silhouette = new THREE.MeshBasicMaterial({ color: 0x4a3f7a });
  const pets = [];
  ALL_PETS.forEach((name, i) => {
    const a = actorsById[PET_ACTOR[name]];
    if (!a) return;
    const [x, z] = SPOTS[i];
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 0.35, 32), new THREE.MeshStandardMaterial({ color: STAND_COLOURS[i], roughness: 0.6 }));
    stand.position.set(x, 0.175, z);
    scene.add(stand);
    a.loopOff = true;
    a.isPet = true;
    a.holder.removeFromParent();
    a.holder.position.set(x, 0.35, z);
    a.holder.rotation.set(0, 0, 0);
    a.holder.scale.setScalar(1);
    a.holder.visible = true;
    a.holder.children[0].scale.setScalar(1.45);
    a.holder.traverse((o) => { if (o.isMesh) for (const m of [].concat(o.material)) { m.clippingPlanes = null; m.needsUpdate = true; } });
    const have = owned.includes(name);
    if (!have) a.holder.traverse((o) => { if (o.isMesh && !o.userData.realMat) { o.userData.realMat = o.material; o.material = silhouette; } });
    a.play('idle', { fade: 0.2 });
    scene.add(a.holder);
    pets.push({ name, a, have, stand, x, z, hop: -1 });
  });
  for (const p of pets) {
    const fn = (e) => { if (e.action.getClip().name === 'wave') p.a.play('idle', { fade: 0.4 }); };
    p.a.mixer.addEventListener('finished', fn);
    cleanups.push(() => p.a.mixer.removeEventListener('finished', fn));
  }

  // gold ring under "my pet"
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.02, 0.08, 12, 48), new THREE.MeshStandardMaterial({ color: 0xffc400, emissive: 0xffa000, emissiveIntensity: 0.6 }));
  ring.rotation.x = -Math.PI / 2;
  scene.add(ring);
  const moveRing = () => { const p = pets.find((x) => x.name === current); if (p) ring.position.set(p.x, 0.37, p.z); };
  moveRing();

  // ---------------- labels: names under friends, locks on the shadows, the counter
  const ui = document.getElementById('pets-ui');
  ui.classList.remove('hidden');
  ui.querySelector('.pets-count').innerHTML = `<b>${owned.length} / ${ALL_PETS.length}</b> ${t('friends')}`;
  const tags = ui.querySelector('.pets-tags');
  tags.innerHTML = '';
  for (const p of pets) {
    const el = document.createElement('div');
    el.className = 'pet-tag' + (p.have ? '' : ' locked');
    el.innerHTML = p.have ? `<span>${(PET_NAMES[p.name] || {})[nameLang] || p.name}</span>` : '<i class="lock"></i>';
    tags.append(el);
    p.tag = el;
  }
  const tip = ui.querySelector('.pets-tip');
  tip.textContent = t('locked');
  on(ui.querySelector('.pets-home'), 'click', () => app.switchTo('home'));

  // ---------------- taps
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const canvas = renderer.domElement;
  const bump = (el) => { el.classList.remove('wiggle'); void el.offsetWidth; el.classList.add('wiggle'); };
  on(canvas, 'pointerdown', (e) => {
    ndc.set(e.clientX / window.innerWidth * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(pets.map((p) => p.a.holder).concat(pets.map((p) => p.stand)), true);
    if (!hits.length) return;
    const p = pets.find((x) => { let o = hits[0].object; while (o) { if (o === x.a.holder || o === x.stand) return true; o = o.parent; } return false; });
    if (!p) return;
    if (!p.have) {                                   // still locked: the lock wiggles
      bump(p.tag);
      tip.classList.remove('show'); void tip.offsetWidth; tip.classList.add('show');
      return;
    }
    p.hop = 0;
    p.a.play('wave', { loop: false, fade: 0.25 });
    if (current !== p.name) {
      current = p.name;
      STORE.set('pet', current);
      moveRing();
      sparkle(p);
    }
    if (!isSpeaking()) say(p.a, lang, `pet.${p.name}.${pick(['hi_friend', 'happy_meet', 'yay_here', 'lets_play'])}`);
  });
  const pick = (a) => a[Math.floor(Math.random() * a.length)];

  // little stars when a new pet is chosen
  const sparks = [];
  function sparkle(p) {
    const n = 30, geo = new THREE.BufferGeometry(), pos = new Float32Array(n * 3), vel = [];
    for (let i = 0; i < n; i++) { pos.set([p.x, 1.6, p.z], i * 3); vel.push(new THREE.Vector3((Math.random() - 0.5) * 4, 2 + Math.random() * 3, (Math.random() - 0.5) * 2)); }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffd23f, size: 0.22, transparent: true }));
    scene.add(pts);
    sparks.push({ pts, vel, t: 0 });
  }

  // a friendly hello from my pet when the room opens
  timers.push(setTimeout(() => {
    const p = pets.find((x) => x.name === current);
    if (p) { p.hop = 0; p.a.play('wave', { loop: false, fade: 0.25 }); say(p.a, lang, `pet.${p.name}.hi_friend`); }
  }, 700));

  // ---------------- every frame
  app.scene = scene;
  app.camera = camera;
  const v = new THREE.Vector3(), tmp = new THREE.Vector3();
  app.update = (dt, time) => {
    for (const p of pets) {
      p.a.mixer.update(dt);
      if (p.have) { updateBlink(p.a, dt); updateMouth(p.a, dt, time); }
      if (p.hop >= 0) {
        p.hop += dt;
        p.a.holder.position.y = 0.35 + Math.sin(Math.min(p.hop / 0.45, 1) * Math.PI) * 0.5;
        if (p.hop >= 0.45) { p.a.holder.position.y = 0.35; p.hop = -1; }
      }
      // name / lock just under each stand
      v.set(p.x, 0, p.z + 0.95).project(camera);
      p.tag.style.left = ((v.x + 1) / 2 * window.innerWidth) + 'px';
      p.tag.style.top = ((1 - v.y) / 2 * window.innerHeight) + 'px';
    }
    ring.rotation.z += dt * 0.8;
    for (let i = sparks.length - 1; i >= 0; i--) {
      const b = sparks[i];
      b.t += dt;
      const a = b.pts.geometry.attributes.position;
      for (let k = 0; k < b.vel.length; k++) { b.vel[k].y -= 6 * dt; tmp.fromArray(a.array, k * 3).addScaledVector(b.vel[k], dt).toArray(a.array, k * 3); }
      a.needsUpdate = true;
      b.pts.material.opacity = Math.max(0, 1 - b.t / 1.2);
      if (b.t > 1.2) { scene.remove(b.pts); sparks.splice(i, 1); }
    }
  };

  // leaving: give every pet its colours back and send it home
  return () => {
    stopSpeech();
    for (const t2 of timers) clearTimeout(t2);
    for (const c of cleanups) c();
    for (const p of pets) {
      p.a.holder.traverse((o) => { if (o.isMesh && o.userData.realMat) { o.material = o.userData.realMat; delete o.userData.realMat; } });
      p.a.speech = null;
      p.a.holder.removeFromParent();
      p.a.holder.position.y = 0;
    }
    ui.classList.add('hidden');
    tags.innerHTML = '';
  };
}
