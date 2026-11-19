// Fun Lingo — loading page
// One Three.js scene: a storybook house with a pet peeking from every window,
// the monkey on a tree branch, Dai Leo and Didi Asha greeting with namaste,
// and the 3D block title "FUN LINGO". The bar at the bottom fills while the
// characters load, then turns into a play button.

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

// ------------------------------------------------------------------ settings
const CHAR_DIR = 'assets/characters/';
const MAX_TEX = 1024;            // shrink 4K textures so phones cope

const TEACHERS = [
  { id: 'leo',  file: 'teacher.glb',   x: -1.3, height: 4.0 },
  { id: 'asha', file: 'didi_asha.glb', x:  1.3, height: 3.9 },
];

// windows: x centre, sill height (bottom of the opening)
const WIN_W = 1.9, WIN_H = 2.2;
const WINDOWS = [
  { pet: 'elephant',  file: 'elephant.glb',  x: -5.6, sill: 4.3, frame: 0xff8fab },
  { pet: 'kitten',    file: 'kitten.glb',    x: -3.1, sill: 4.3, frame: 0x8ecae6 },
  { pet: 'stardust',  file: 'stardust.glb',  x:  3.1, sill: 4.3, frame: 0xffd166, lift: 0.25 },
  { pet: 'dragon',    file: 'dragon.glb',    x:  5.6, sill: 4.3, frame: 0x95d5b2 },
  { pet: 'red_panda', file: 'red_panda.glb', x: -5.6, sill: 1.3, frame: 0xcdb4db },
  { pet: 'yeti',      file: 'yeti.glb',      x: -3.1, sill: 1.3, frame: 0xffb703 },
  { pet: 'beep',      file: 'beep.glb',      x:  3.1, sill: 1.3, frame: 0x90e0ef, lift: 0.3 },
  { pet: 'roary',     file: 'roary.glb',     x:  5.6, sill: 1.3, frame: 0xf4a261 },
];
const PET_HEIGHT = 2.3;
const PET_SHOW = 0.62;           // part of the body above the sill (a bit over half)
const PET_Z = -4.2;              // behind the wall (front face at z = -3)

const MONKEY = { file: 'monkey.glb', height: 1.45 };

const TITLE = 'FUN LINGO';
const TITLE_COLORS = [0xff5a5f, 0xffb400, 0x3ec300, null, 0x00a6ed, 0x7b61ff, 0xff6fb5, 0xff8c42, 0x2ec4b6];

// scene extent to keep on screen
const VIEW = { left: -10.2, right: 10.4, bottom: -0.4, top: 11.8 };

// ------------------------------------------------------------------ renderer
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
const SMALL_SCREEN = Math.min(screen.width, screen.height) < 700;   // phones
renderer.setPixelRatio(Math.min(window.devicePixelRatio, SMALL_SCREEN ? 1.5 : 2));
renderer.localClippingEnabled = true;   // lets each pet be cut off at its windowsill
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
const lookAt = new THREE.Vector3(0, 5.4, -1);

function fitCamera() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const halfH = (VIEW.top - VIEW.bottom) / 2;
  const halfW = (VIEW.right - VIEW.left) / 2;
  const dist = Math.max(halfH / t, halfW / (t * camera.aspect)) + 1.0;
  lookAt.set((VIEW.left + VIEW.right) / 2, (VIEW.top + VIEW.bottom) / 2, -1);
  camera.position.set(lookAt.x, lookAt.y + 0.6, lookAt.z + dist);
  camera.lookAt(lookAt);
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', fitCamera);
fitCamera();

// ------------------------------------------------------------------ lights
scene.add(new THREE.HemisphereLight(0xdff3ff, 0x9bd17a, 1.6));
const sunLight = new THREE.DirectionalLight(0xfff1d6, 2.2);
sunLight.position.set(-6, 14, 12);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(1024, 1024);
Object.assign(sunLight.shadow.camera, { left: -6, right: 6, top: 7, bottom: -2, near: 1, far: 40 });
sunLight.shadow.bias = -0.0005;
scene.add(sunLight);
const roomLight = new THREE.PointLight(0xffe2b8, 8, 18, 1.6);   // light inside the house
roomLight.position.set(0, 4.2, -3.6);
scene.add(roomLight);

// ------------------------------------------------------------------ helpers
const mat = (color, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0, ...extra });

// arched window outline (rectangle with a round top), bottom-centre at (cx, by)
function archPath(path, cx, by, w, h) {
  const r = w / 2, straight = h - r;
  path.moveTo(cx - r, by);
  path.lineTo(cx + r, by);
  path.lineTo(cx + r, by + straight);
  path.absarc(cx, by + straight, r, 0, Math.PI, false);
  path.lineTo(cx - r, by);
  return path;
}

function roundedRect(shape, x, y, w, h, r) {
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + h - r);
  shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  shape.lineTo(x + r, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
  return shape;
}

const easeOutBack = (t) => { const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const easeInBack = (t) => { const c = 1.7; return (c + 1) * t * t * t - c * t * t; };
const easeOutBounce = (t) => {
  const n = 7.5625, d = 2.75;
  if (t < 1 / d) return n * t * t;
  if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
  if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
  return n * (t -= 2.625 / d) * t + 0.984375;
};
const rand = (a, b) => a + Math.random() * (b - a);

// ------------------------------------------------------------------ world
function buildWorld() {
  // grass
  const grass = new THREE.Mesh(new THREE.CircleGeometry(40, 64), mat(0x8fd16a));
  grass.rotation.x = -Math.PI / 2;
  grass.receiveShadow = true;
  scene.add(grass);
  const path = new THREE.Mesh(new THREE.CircleGeometry(3.2, 48), mat(0xf6e3b4));
  path.rotation.x = -Math.PI / 2;
  path.scale.set(1.25, 0.55, 1);
  path.position.set(0, 0.01, 1.2);
  path.receiveShadow = true;
  scene.add(path);

  // house wall with window holes
  const wallShape = roundedRect(new THREE.Shape(), -7.5, 0, 15, 7.2, 0.5);
  for (const w of WINDOWS) wallShape.holes.push(archPath(new THREE.Path(), w.x, w.sill, WIN_W, WIN_H));
  const wall = new THREE.Mesh(
    new THREE.ExtrudeGeometry(wallShape, { depth: 0.5, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 3, curveSegments: 24 }),
    mat(0xffe8c2)
  );
  wall.position.z = -3.5;
  wall.receiveShadow = true;
  scene.add(wall);

  // dark cosy room behind the windows
  const room = new THREE.Mesh(new THREE.PlaneGeometry(16, 7.6), mat(0x5b4a8a, { roughness: 1 }));
  room.position.set(0, 3.6, -6.3);
  scene.add(room);
  const roomFloorTop = new THREE.Mesh(new THREE.PlaneGeometry(16, 3.4), mat(0x4a3b75, { roughness: 1 }));
  roomFloorTop.rotation.x = -Math.PI / 2;
  roomFloorTop.position.set(0, 0.02, -4.9);
  scene.add(roomFloorTop);

  // window frames and sills
  for (const w of WINDOWS) {
    const outer = archPath(new THREE.Shape(), w.x, w.sill - 0.12, WIN_W + 0.4, WIN_H + 0.32);
    outer.holes.push(archPath(new THREE.Path(), w.x, w.sill, WIN_W, WIN_H));
    const frame = new THREE.Mesh(
      new THREE.ExtrudeGeometry(outer, { depth: 0.22, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 3, curveSegments: 24 }),
      mat(w.frame, { roughness: 0.5 })
    );
    frame.position.z = -3.02;
    scene.add(frame);
    const sill = new THREE.Mesh(new THREE.BoxGeometry(WIN_W + 0.75, 0.24, 0.6), mat(0xffffff, { roughness: 0.6 }));
    sill.position.set(w.x, w.sill - 0.1, -2.85);
    sill.castShadow = true;
    scene.add(sill);
    // a little flower pot on the lower sills
    if (w.sill < 2) {
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.12, 0.26, 16), mat(0xe76f51));
      pot.position.set(w.x + (w.x < 0 ? 0.75 : -0.75), w.sill + 0.15, -2.75);
      scene.add(pot);
      const bloom = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), mat(w.frame, { roughness: 0.4 }));
      bloom.position.copy(pot.position).add(new THREE.Vector3(0, 0.25, 0));
      scene.add(bloom);
    }
  }

  // roof
  const roofShape = new THREE.Shape();
  roofShape.moveTo(-8.4, 7.0);
  roofShape.lineTo(8.4, 7.0);
  roofShape.quadraticCurveTo(4.0, 8.6, 0.0, 9.6);
  roofShape.quadraticCurveTo(-4.0, 8.6, -8.4, 7.0);
  const roof = new THREE.Mesh(
    new THREE.ExtrudeGeometry(roofShape, { depth: 1.5, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.12, bevelSegments: 4, curveSegments: 24 }),
    mat(0xff6b6b, { roughness: 0.55 })
  );
  roof.position.z = -4.2;
  roof.castShadow = true;
  scene.add(roof);
  buildBanner();

  // tree for the monkey (right side)
  const bark = mat(0x8d5a3b, { roughness: 0.9 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.6, 8.6, 18), bark);
  trunk.position.set(9.3, 4.3, -1.8);
  trunk.castShadow = true;
  scene.add(trunk);
  // branch grows from the trunk towards the front so the monkey sits clear of the leaves
  const bBase = new THREE.Vector3(9.2, 7.6, -1.8), bTip = new THREE.Vector3(5.9, 7.95, -0.45);
  const bDir = bTip.clone().sub(bBase);
  const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.22, bDir.length(), 14), bark);
  branch.position.copy(bBase).addScaledVector(bDir, 0.5);
  branch.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), bDir.clone().normalize());
  branch.castShadow = true;
  scene.add(branch);
  const leaves = mat(0x52b788, { roughness: 0.8, flatShading: true });
  const leafSpots = [[9.3, 9.4, -2.2, 1.7], [8.0, 9.0, -2.4, 1.3], [10.4, 8.7, -2.0, 1.3], [9.6, 10.6, -2.6, 1.2], [5.75, 8.05, -0.4, 0.45]];
  for (const [x, y, z, r] of leafSpots) {
    const blob = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), leaves);
    blob.position.set(x, y, z);
    scene.add(blob);
  }

  // bushes on the left
  const bushMat = mat(0x6cc04a, { flatShading: true });
  for (const [x, z, r] of [[-8.6, -1.6, 1.0], [-9.6, -1.2, 0.8], [-8.1, -0.6, 0.65], [8.0, -0.4, 0.6]]) {
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), bushMat);
    b.position.set(x, r * 0.7, z);
    b.castShadow = true;
    scene.add(b);
  }

  // sun and clouds
  const sun = new THREE.Mesh(new THREE.CircleGeometry(1.6, 48), new THREE.MeshBasicMaterial({ color: 0xffe066 }));
  sun.position.set(-10.5, 11.6, -17);   // behind the clouds (they sit at z = -13)
  scene.add(sun);
  const halo = new THREE.Mesh(new THREE.RingGeometry(1.85, 2.45, 48), new THREE.MeshBasicMaterial({ color: 0xfff3b0, transparent: true, opacity: 0.6 }));
  halo.position.copy(sun.position);
  scene.add(halo);
  world.sunHalo = halo;

  const cloudMat = mat(0xffffff, { roughness: 1 });
  for (const [x, y, s] of [[-4.5, 11.2, 1.0], [5.5, 11.6, 0.8], [13, 10.5, 0.9], [-14, 9.5, 0.9]]) {
    const c = new THREE.Group();
    for (const [dx, dy, r] of [[0, 0, 0.9], [0.9, 0.15, 0.7], [-0.9, 0.1, 0.65], [0.35, 0.55, 0.6]]) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), cloudMat);
      puff.position.set(dx, dy, 0);
      c.add(puff);
    }
    c.scale.setScalar(s);
    c.position.set(x, y, -13);
    c.userData.speed = rand(0.15, 0.3);
    scene.add(c);
    world.clouds.push(c);
  }
}

const world = { clouds: [], sunHalo: null };

// ------------------------------------------------------------------ roof banner
function bannerTexture(text) {
  const c = document.createElement('canvas');
  c.width = 2048; c.height = 220;
  const g = c.getContext('2d');
  g.fillStyle = '#fff8e7';
  g.fillRect(0, 0, c.width, c.height);
  g.strokeStyle = '#ffb703';
  g.lineWidth = 14;
  g.setLineDash([36, 22]);
  g.strokeRect(22, 22, c.width - 44, c.height - 44);       // stitched edge
  g.setLineDash([]);
  g.font = 'bold 112px "Arial Rounded MT Bold", "Nunito", "Trebuchet MS", "Helvetica Neue", Arial, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = '#7b2cbf';
  g.fillText(text, c.width / 2, c.height / 2 + 6, c.width - 140);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function buildBanner() {
  const W = 9.2, H = 0.95, y = 7.95, z = -2.42;
  const geo = new THREE.PlaneGeometry(W, H, 40, 1);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {                 // gentle smile-shaped curve, like a hung ribbon
    const u = pos.getX(i) / (W / 2);
    pos.setY(i, pos.getY(i) - (1 - u * u) * 0.18);
    pos.setZ(i, (1 - u * u) * 0.12);
  }
  geo.computeVertexNormals();
  const banner = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: bannerTexture("Kids' Language Learning Virtual School"), roughness: 0.8 }));
  banner.position.set(0, y, z);
  scene.add(banner);
  // folded ribbon tails at both ends
  const tailMat = mat(0xff8fab, { roughness: 0.7, side: THREE.DoubleSide });
  for (const sgn of [-1, 1]) {
    const t = new THREE.Shape();
    t.moveTo(0, H / 2); t.lineTo(0.9, H / 2); t.lineTo(0.62, 0); t.lineTo(0.9, -H / 2); t.lineTo(0, -H / 2); t.lineTo(0, H / 2);
    const tail = new THREE.Mesh(new THREE.ShapeGeometry(t), tailMat);
    tail.scale.x = sgn;
    tail.position.set(sgn * (W / 2 - 0.15), y - 0.12, z - 0.05);
    tail.rotation.y = sgn * -0.35;
    scene.add(tail);
  }
}

// ------------------------------------------------------------------ title
const titleLetters = [];
function buildTitle(font) {
  const group = new THREE.Group();
  let x = 0;
  const meshes = [];
  [...TITLE].forEach((ch, i) => {
    if (ch === ' ') { x += 0.75; return; }
    const geo = new TextGeometry(ch, {
      font, size: 1.3, height: 0.6, curveSegments: 6,
      bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.07, bevelSegments: 4,
    });
    geo.computeBoundingBox();
    const bb = geo.boundingBox;
    const w = bb.max.x - bb.min.x;
    geo.translate(-bb.min.x - w / 2, -bb.min.y, -0.3);   // centre each letter on its own pivot
    const col = new THREE.Color(TITLE_COLORS[i]);
    const face = new THREE.MeshStandardMaterial({ color: col, roughness: 0.35 });
    const side = new THREE.MeshStandardMaterial({ color: col.clone().multiplyScalar(0.72), roughness: 0.45 });
    const m = new THREE.Mesh(geo, [face, side]);
    m.castShadow = true;
    m.position.x = x + w / 2;
    x += w + 0.14;
    meshes.push(m);
    group.add(m);
  });
  const total = x - 0.14;
  meshes.forEach((m, i) => {
    m.position.x -= total / 2;
    m.userData = { baseY: 0, delay: 0.15 + i * 0.09, phase: i * 0.6 };
    m.position.y = 8;              // starts above the screen and drops in
    titleLetters.push(m);
  });
  group.position.set(0, 9.85, -1.2);
  scene.add(group);
}

// ------------------------------------------------------------------ characters
const loader = new GLTFLoader();
const actors = [];               // everything with an AnimationMixer
const actorsById = {};          // leo, asha, beep, elephant ... (used by the home page)

function shrinkTextures(material) {
  const mats = Array.isArray(material) ? material : [material];
  for (const m of mats) {
    for (const key of ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap', 'aoMap']) {
      const tex = m[key];
      const img = tex && tex.image;
      if (!img || !img.width || img.width <= MAX_TEX) continue;
      const s = MAX_TEX / Math.max(img.width, img.height);
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * s);
      c.height = Math.round(img.height * s);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      if (img.close) img.close();
      tex.image = c;
      tex.needsUpdate = true;
    }
  }
}

function prepCharacter(gltf, height) {
  const root = gltf.scene;
  const blinkMeshes = [];
  root.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.frustumCulled = false;
      shrinkTextures(o.material);
      const d = o.morphTargetDictionary;
      if (d && d.eyeBlinkLeft !== undefined) blinkMeshes.push(o);
    }
  });
  root.scale.setScalar(height);       // every model is exported 1 unit tall
  const holder = new THREE.Group();
  holder.add(root);
  const mixer = new THREE.AnimationMixer(root);
  const clips = {};
  for (const c of gltf.animations) {
    // body animations must not drive the face (the namaste clip carried mouth keys that
    // overwrote Dai Leo's smile); the face is driven by blink + lip-sync code instead
    if (c.name !== 'face_demo') c.tracks = c.tracks.filter((t) => !t.name.endsWith('.morphTargetInfluences'));
    clips[c.name] = c;
  }
  const actor = {
    holder, mixer, clips, blinkMeshes,
    current: null,
    nextBlink: rand(1, 4), blinkT: -1,
    play(name, { loop = true, fade = 0.4 } = {}) {
      const clip = clips[name];
      if (!clip) return null;
      const action = mixer.clipAction(clip);
      action.reset();
      action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1);
      action.clampWhenFinished = !loop;
      if (this.current && this.current !== action) action.crossFadeFrom(this.current, fade, false);
      action.play();
      this.current = action;
      return action;
    },
  };
  actors.push(actor);
  return actor;
}

// blinking driven from code so every character (people and pets) blinks the same way
function updateBlink(actor, dt) {
  if (!actor.blinkMeshes.length) return;
  actor.nextBlink -= dt;
  if (actor.nextBlink <= 0 && actor.blinkT < 0) actor.blinkT = 0;
  let v = 0;
  if (actor.blinkT >= 0) {
    actor.blinkT += dt;
    const t = actor.blinkT / 0.18;            // 0.18 s blink
    v = t < 0.5 ? t * 2 : Math.max(0, 2 - t * 2);
    if (t >= 1) { actor.blinkT = -1; actor.nextBlink = rand(2.2, 5.5); v = 0; }
  }
  for (const m of actor.blinkMeshes) {
    const d = m.morphTargetDictionary;
    m.morphTargetInfluences[d.eyeBlinkLeft] = v;
    m.morphTargetInfluences[d.eyeBlinkRight] = v;
  }
}

// ---- teachers: namaste, rest, namaste again
function startNamasteLoop(actor) {
  const greet = () => {
    if (actor.loopOff) return;
    const a = actor.play('namaste', { loop: false, fade: 0.5 });
    if (!a) { actor.play('idle'); return; }
  };
  actor.mixer.addEventListener('finished', (e) => {
    if (e.action.getClip().name !== 'namaste' || actor.loopOff) return;
    setTimeout(() => {
      actor.play('idle', { fade: 0.6 });
      setTimeout(greet, rand(3500, 5000));
    }, 1600);
  });
  actor.play('idle', { fade: 0 });
  setTimeout(greet, actor.holder.position.x < 0 ? 600 : 900);
}

// ---- pets: each one stands in its window showing the top half of its body
const pets = [];
function addPet(actor, win) {
  const h = PET_HEIGHT;
  const y = win.sill - h * (1 - PET_SHOW) + (win.lift || 0);   // lift: per-pet nudge upwards
  actor.holder.position.set(win.x, y, PET_Z);
  actor.play('idle', { fade: 0 });
  actor.mixer.timeScale = rand(0.85, 1.1);
  popIn(actor.holder);
  // nothing below the windowsill is drawn, so legs never show through other windows
  const cut = [new THREE.Plane(new THREE.Vector3(0, 1, 0), -(win.sill - 0.05))];
  actor.holder.traverse((o) => {
    if (o.isMesh) for (const m of [].concat(o.material)) { m.clippingPlanes = cut; m.clipShadows = true; }
  });
  actor.mixer.addEventListener('finished', (e) => {
    if (e.action.getClip().name === 'wave') actor.play('idle', { fade: 0.4 });
  });
  pets.push({ actor, win, baseY: y, nextWave: rand(4, 14) });
}

function updatePet(p, dt, time) {
  const g = p.actor.holder;
  // tiny breathing sway only, no hopping
  g.rotation.z = Math.sin(time * 0.9 + p.win.x) * 0.025;
  g.rotation.y = Math.sin(time * 0.5 + p.win.x * 0.7) * 0.12;
  p.nextWave -= dt;
  if (p.nextWave <= 0) {
    p.actor.play('wave', { loop: false, fade: 0.35 });
    p.nextWave = rand(12, 22);
  }
}

// ---- monkey on the branch
let monkey = null;
function addMonkey(actor) {
  actor.holder.position.set(6.96, 8.0, -0.89);
  actor.holder.rotation.y = -0.35;           // turned a little towards the middle
  actor.play('idle', { fade: 0 });
  actor.mixer.addEventListener('finished', (e) => {
    if (e.action.getClip().name === 'wave') actor.play('idle', { fade: 0.4 });
  });
  monkey = { actor, nextWave: 2.5 };
}

// ------------------------------------------------------------------ loading
const fillEl = document.querySelector('#loader .fill');
const starEl = document.querySelector('#loader .star');
const loaderEl = document.getElementById('loader');
const playEl = document.getElementById('play');
const greetEl = playEl.querySelector('.greet');
const GREETINGS = [
  { text: 'Hello!',      color: '#ff5a5f' },   // English
  { text: 'こんにちは!',   color: '#00a6ed' },   // Japanese
  { text: '안녕하세요!',    color: '#7b61ff' },   // Korean
  { text: 'नमस्ते!',       color: '#2fbf4a' },   // Nepali
];
let greetIdx = 0;
function nextGreeting() {
  greetEl.classList.add('swap');
  setTimeout(() => {
    greetIdx = (greetIdx + 1) % GREETINGS.length;
    greetEl.textContent = GREETINGS[greetIdx].text;
    greetEl.style.color = GREETINGS[greetIdx].color;
    greetEl.classList.remove('swap');
  }, 220);
}
greetEl.textContent = GREETINGS[0].text;
greetEl.style.color = GREETINGS[0].color;
setInterval(nextGreeting, 1800);

// keep the button pinned beside Didi Asha (her left hand side) whatever the screen size
let ashaHolder = null;
const anchor = new THREE.Vector3();
function placePlayButton() {
  if (!ashaHolder) return;
  anchor.set(ashaHolder.position.x + 1.05, 1.25, ashaHolder.position.z + 0.3).project(camera);   // button's left edge sits just past her hand
  playEl.style.left = ((anchor.x + 1) / 2 * window.innerWidth) + 'px';
  playEl.style.top = ((1 - anchor.y) / 2 * window.innerHeight) + 'px';
}

const progress = new Map();       // file -> [loaded, total]
function setProgress(file, loaded, total) {
  progress.set(file, [loaded, total || loaded || 1]);
  let l = 0, t = 0;
  for (const [a, b] of progress.values()) { l += Math.min(a, b); t += b; }
  const known = progress.size;
  const expected = TEACHERS.length + WINDOWS.length + 2;   // + monkey + font
  const pct = Math.min(100, (l / Math.max(t, 1)) * 100 * (known / expected));
  fillEl.style.width = pct + '%';
  starEl.style.left = pct + '%';
}

function loadGLB(file) {
  return new Promise((resolve, reject) => {
    setProgress(file, 0, 1);
    loader.load(CHAR_DIR + file, (g) => { const p = progress.get(file); setProgress(file, p[1], p[1]); resolve(g); },
      (e) => setProgress(file, e.loaded, e.total), reject);
  });
}

function popIn(holder) {
  holder.scale.setScalar(0.001);
  holder.userData.pop = 0;
}

async function loadEverything() {
  const fontPromise = new Promise((resolve) => {
    setProgress('font', 0, 1);
    new FontLoader().load('assets/fonts/helvetiker_bold.typeface.json', (f) => { setProgress('font', 1, 1); resolve(f); });
  });
  buildTitle(await fontPromise);

  // teachers first, so the centre of the screen fills in early
  const teacherJobs = TEACHERS.map(async (t) => {
    const a = prepCharacter(await loadGLB(t.file), t.height);
    actorsById[t.id] = a;
    if (t.id === 'leo') {                                   // Dai Leo smiles with his mouth a little open
      a.restMouth = { viseme_E: 0.45, viseme_aa: 0.22 };
      a.holder.traverse((o) => {
        const d = o.morphTargetDictionary;
        if (!d) return;
        for (const [k, v] of Object.entries(a.restMouth)) if (d[k] !== undefined) o.morphTargetInfluences[d[k]] = v;
      });
    }
    a.holder.position.set(t.x, 0, 0.6);
    if (t.id === 'asha') ashaHolder = a.holder;
    scene.add(a.holder);
    popIn(a.holder);
    startNamasteLoop(a);
  });
  const petJobs = WINDOWS.map(async (w) => {
    const a = prepCharacter(await loadGLB(w.file), PET_HEIGHT);
    actorsById[w.pet] = a;
    scene.add(a.holder);
    addPet(a, w);
  });
  const monkeyJob = (async () => {
    const a = prepCharacter(await loadGLB(MONKEY.file), MONKEY.height);
    actorsById.monkey = a;
    scene.add(a.holder);
    popIn(a.holder);
    addMonkey(a);
  })();

  const results = await Promise.allSettled([...teacherJobs, ...petJobs, monkeyJob]);
  results.filter((r) => r.status === 'rejected').forEach((r) => console.error('Could not load a character:', r.reason));

  fillEl.style.width = '100%';
  starEl.style.left = '100%';
  setTimeout(() => {
    if (leaving) return;                     // already moved on to the home page
    loaderEl.classList.add('done');
    playEl.classList.remove('hidden');
    showIOSHint();
  }, 450);
}

let leaving = false;
// ------------------------------------------------------------------ loop
const clock = new THREE.Clock();
// whichever page is showing sets app.scene / app.camera / app.update
const app = { renderer, scene, camera, update: null, actorsById, updateBlink, switchTo: null, dispose: null };
// moves between pages (home, lesson, ...) with a soft white fade
const PAGES = {
  home: ['./home.js?v=18', 'startHome'], map: ['./map.js?v=8', 'startMap'], lesson: ['./lesson.js?v=15', 'startLesson'],
  pets: ['./pets.js?v=4', 'startPets'], stories: ['./stories.js?v=3', 'startStories'], lullaby: ['./lullaby.js?v=5', 'startLullaby'],
};
app.switchTo = async (page, opts = {}) => {
  const fade = document.getElementById('fade');
  fade.classList.add('on');
  const [path, fn] = PAGES[page];
  const mod = await import(path);
  await new Promise((r) => setTimeout(r, 450));
  if (app.dispose) app.dispose();
  app.dispose = mod[fn](app, opts);
  fade.classList.remove('on');
};
// ---------------- time in the app (for the parents' progress page; stays on this phone)
// Counted in 15-second steps, only while the app is open and on screen.
setInterval(() => {
  if (document.visibilityState !== 'visible') return;
  try {
    const d = new Date(), k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const u = JSON.parse(localStorage.getItem('funlingo.usage') || '{}');
    u[k] = (u[k] || 0) + 15;
    for (const old of Object.keys(u).sort().slice(0, -400)) delete u[old];      // keep about a year
    localStorage.setItem('funlingo.usage', JSON.stringify(u));
  } catch { /* storage full or blocked: skip */ }
}, 15000);

// ---------------- full screen on phones
// Android/desktop: go full screen and sideways when a big "go" button is tapped
// (browsers only allow it right after a tap). iPhone can't do this from a web page,
// so parents get a one-time hint to add the app to the home screen instead.
const standalone = navigator.standalone || window.matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches;
function goFullscreen() {
  const el = document.documentElement;
  if (standalone || document.fullscreenElement || !(el.requestFullscreen || el.webkitRequestFullscreen)) return;
  const p = el.requestFullscreen ? el.requestFullscreen({ navigationUI: 'hide' }) : el.webkitRequestFullscreen();
  Promise.resolve(p).then(() => screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape').catch(() => {})).catch(() => {});
}
document.addEventListener('click', (e) => {
  if (e.target.closest('#play, #btn-start, .stop, #btn-done-next, .lang-card')) goFullscreen();
}, true);
const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const iosHint = document.getElementById('ios-hint');
function showIOSHint() {
  let seen = false;
  try { seen = localStorage.getItem('funlingo.iosHintSeen') === '1'; } catch { /* fine */ }
  if (!isIOS || standalone || seen) return;
  iosHint.classList.remove('hidden');
  const close = () => { iosHint.classList.add('hidden'); try { localStorage.setItem('funlingo.iosHintSeen', '1'); } catch { /* fine */ } };
  iosHint.querySelector('.ios-close').addEventListener('click', close, { once: true });
  playEl.addEventListener('click', close, { once: true });
}

playEl.addEventListener('click', () => {
  if (leaving) return;
  leaving = true;
  titleLetters.forEach((m, i) => { m.userData.hop = -i * 0.06; });
  playEl.classList.add('hidden');
  loaderEl.classList.add('done');
  window.removeEventListener('resize', fitCamera);
  app.switchTo('home');
});

function updateLoading(dt, time) {

  for (const a of actors) {
    a.mixer.update(dt);
    updateBlink(a, dt);
    const h = a.holder;
    if (h.userData.pop !== undefined) {           // pop-in when a character appears
      h.userData.pop = Math.min(h.userData.pop + dt / 0.6, 1);
      h.scale.setScalar(Math.max(0.001, easeOutBack(h.userData.pop)));
      if (h.userData.pop >= 1) { h.scale.setScalar(1); delete h.userData.pop; }
    }
  }
  for (const p of pets) updatePet(p, dt, time);
  if (monkey) {
    monkey.nextWave -= dt;
    if (monkey.nextWave <= 0) { monkey.actor.play('wave', { loop: false, fade: 0.3 }); monkey.nextWave = rand(6, 9); }
    monkey.actor.holder.position.y = 8.0 + Math.max(0, Math.sin(time * 1.6)) * 0.04;
  }

  // title: drop in with a bounce, then a gentle wobble
  for (const m of titleLetters) {
    const u = m.userData;
    const k = THREE.MathUtils.clamp((time - u.delay) / 0.9, 0, 1);
    let y = THREE.MathUtils.lerp(8, 0, easeOutBounce(k));
    if (k >= 1) y = Math.sin(time * 2.0 + u.phase) * 0.08;
    if (u.hop !== undefined) {
      u.hop += dt;
      if (u.hop > 0) { y += Math.sin(Math.min(u.hop / 0.45, 1) * Math.PI) * 0.7; if (u.hop > 0.45) delete u.hop; }
    }
    m.position.y = y;
    m.rotation.z = k >= 1 ? Math.sin(time * 1.4 + u.phase) * 0.05 : 0;
  }

  for (const c of world.clouds) {
    c.position.x += c.userData.speed * dt;
    if (c.position.x > 18) c.position.x = -18;
  }
  if (world.sunHalo) world.sunHalo.scale.setScalar(1 + Math.sin(time * 1.5) * 0.06);

  placePlayButton();
}
app.update = updateLoading;

function tick() {
  const dt = Math.min(clock.getDelta(), 0.05);
  app.update(dt, clock.elapsedTime);
  renderer.render(app.scene, app.camera);
  requestAnimationFrame(tick);
}

window.__fl = { scene, actors, pets, THREE };   // debug handle
buildWorld();
tick();
loadEverything();
