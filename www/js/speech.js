// Fun Lingo — speech: plays a clip from a language pack and moves the speaker's mouth.
// Clips live in assets/packs/<lang>/audio/<id>.mp3 with Rhubarb timings in <id>.json.

const VIS = {               // Rhubarb mouth shapes -> our shape keys
  A: {}, X: {},
  B: { viseme_I: 0.35, viseme_E: 0.25 },
  C: { viseme_E: 0.75 },
  D: { viseme_aa: 1 },
  E: { viseme_O: 0.75 },
  F: { viseme_U: 0.85 },
  G: { viseme_I: 0.55 },
  H: { viseme_aa: 0.5, viseme_E: 0.3 },
};
const MOUTH_KEYS = ['viseme_aa', 'viseme_E', 'viseme_I', 'viseme_O', 'viseme_U', 'mouthClose'];
let current = null;                       // only one voice at a time

export function faceMeshes(actor) {
  if (!actor.faces) {
    actor.faces = [];
    actor.holder.traverse((o) => { if (o.isMesh && o.morphTargetDictionary) actor.faces.push(o); });
  }
  return actor.faces;
}

// Plays a clip. Every clip waits for the one before it to finish, plus a short gap, so
// voices never talk over each other. Resolves when this clip has finished (or straight
// away if the clip does not exist / speech was stopped).
let chain = Promise.resolve();
let lastEnd = 0;                          // when the last clip finished (ms)
let generation = 0;                       // bumped by stopSpeech(): queued clips are dropped
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

function play(actor, lang, id, { volume = 1, rate = 1 } = {}) {
  return new Promise(async (resolve) => {
    const base = `assets/packs/${lang}/audio/${id}`;
    const audio = new Audio(base + '.mp3');
    audio.volume = volume;
    audio.playbackRate = rate;
    let cues = null;
    try { const r = await fetch(base + '.json'); if (r.ok) cues = (await r.json()).mouthCues; } catch { /* no timing file */ }
    current = audio;
    const finish = () => {
      if (actor && actor.speech && actor.speech.audio === audio) actor.speech = null;
      if (current === audio) current = null;
      lastEnd = performance.now();
      resolve(true);
    };
    audio.addEventListener('ended', finish, { once: true });
    audio.addEventListener('error', () => { finish(); }, { once: true });
    try {
      await audio.play();
      if (actor) actor.speech = { audio, cues };
    } catch {
      finish();
    }
  });
}

export function say(actor, lang, id, opts = {}) {
  const gen = generation;
  const gap = opts.gap ?? 400;
  const job = chain.then(async () => {
    if (gen !== generation) return false;
    const w = lastEnd + gap - performance.now();
    if (w > 0) await pause(w);
    if (gen !== generation) return false;
    return play(actor, lang, id, opts);
  });
  chain = job.catch(() => {});
  return job;
}

// true while someone is talking or waiting to talk
export function isSpeaking() { return !!current || performance.now() - lastEnd < 300; }

export function stopSpeech() {
  generation++;
  chain = Promise.resolve();
  if (current) { current.pause(); current.dispatchEvent(new Event('ended')); }
}

export function updateMouth(actor, dt, time) {
  const faces = faceMeshes(actor);
  if (!faces.length) return;
  const target = { ...(actor.restMouth || {}) };      // a face's resting mouth (Dai Leo: a soft open smile)
  const sp = actor.speech;
  if (sp) {
    let shape = 'X';
    if (sp.cues) {
      const t = sp.audio.currentTime;
      const cue = sp.cues.find((c) => t >= c.start && t < c.end);
      if (cue) shape = cue.value;
    } else {
      shape = Math.sin(time * 22) > 0.1 ? 'C' : 'B';  // no timing file: simple flapping
    }
    if (shape !== 'X') { for (const k of MOUTH_KEYS) delete target[k]; Object.assign(target, VIS[shape] || {}); }
    if (actor.isPet && (shape === 'A' || shape === 'X')) target.mouthClose = 1;   // pets rest with the mouth open
  }
  const k = Math.min(1, dt * 18);
  for (const m of faces) {
    const d = m.morphTargetDictionary;
    for (const key of MOUTH_KEYS) {
      if (d[key] === undefined) continue;
      const cur = m.morphTargetInfluences[d[key]];
      m.morphTargetInfluences[d[key]] = cur + ((target[key] || 0) - cur) * k;
    }
  }
}
