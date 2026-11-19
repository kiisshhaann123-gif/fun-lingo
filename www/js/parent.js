// Fun Lingo — the grown-ups' progress page (inside the parent lock).
// Everything here is read from this phone only; nothing is ever sent anywhere.

import { ART } from './art.js?v=3';
import { t, homeLanguage, ownedPets, PET_NAMES, ALL_PETS } from './ui.js?v=2';

const LANG_NAMES = { en: 'English', ja: '日本語', ko: '한국어', ne: 'नेपाली' };
// short weekday names, Sunday first (written out, since phones don't all know Nepali dates)
const WEEKDAYS = {
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  ja: ['日', '月', '火', '水', '木', '金', '土'],
  ko: ['일', '월', '화', '수', '목', '금', '토'],
  ne: ['आइत', 'सोम', 'मङ्गल', 'बुध', 'बिही', 'शुक्र', 'शनि'],
};
const get = (k) => { try { return localStorage.getItem('funlingo.' + k); } catch { return null; } };
const json = (k, d) => { try { return JSON.parse(get(k)) ?? d; } catch { return d; } };
const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// time in the app: counted in main.js while the app is open and on screen
export function usage() { return json('usage', {}); }
function fmt(sec, lang) {
  const m = Math.round(sec / 60);
  if (m < 60) return `${m} ${t('min', lang)}`;
  return `${Math.floor(m / 60)} ${t('hr', lang)} ${m % 60} ${t('min', lang)}`;
}

export async function renderProgress(box) {
  const lang = homeLanguage();
  const u = usage();
  const now = new Date();
  const days = [];
  for (let i = 6; i >= 0; i--) { const d = new Date(now); d.setDate(now.getDate() - i); days.push({ d, sec: u[dayKey(d)] || 0 }); }
  const today = days[6].sec, week = days.reduce((s, x) => s + x.sec, 0), total = Object.values(u).reduce((s, x) => s + x, 0);
  const max = Math.max(60, ...days.map((x) => x.sec));
  const weekday = (d) => (WEEKDAYS[lang] || WEEKDAYS.en)[d.getDay()];

  // lessons and words, per language the child has started
  let course = { lessons: [] }, words = {};
  try { course = await (await fetch('assets/course/unit1.json')).json(); } catch { /* offline */ }
  try { words = await (await fetch('assets/course/words.json')).json(); } catch { /* offline */ }
  const langs = ['en', 'ja', 'ko', 'ne'].map((l) => ({ l, p: json('progress.' + l, null) })).filter((x) => x.p && x.p.done && x.p.done.length);
  const learned = (done) => course.lessons.filter((L) => done.includes(L.n) && L.type === 'teach').flatMap((L) => L.words);
  const stats = json('stats', {});
  const pets = ownedPets();

  box.innerHTML = `
    <div class="pg-card">
      <h4>${t('timeInApp', lang)}</h4>
      <div class="pg-time">
        <div><b>${fmt(today, lang)}</b><span>${t('today', lang)}</span></div>
        <div><b>${fmt(week, lang)}</b><span>${t('thisWeek', lang)}</span></div>
        <div><b>${fmt(total, lang)}</b><span>${t('total', lang)}</span></div>
      </div>
      <div class="pg-bars">${days.map((x) => `<div class="pg-bar"><i style="height:${Math.max(3, x.sec / max * 100)}%"></i><span>${weekday(x.d)}</span></div>`).join('')}</div>
    </div>
    <div class="pg-card">
      <h4>${t('lessons', lang)}</h4>
      ${langs.length ? langs.map(({ l, p }) => {
        const n = p.done.filter((x) => x <= 20).length;
        const ws = learned(p.done);
        return `<div class="pg-lang">
          <div class="pg-row"><span>${LANG_NAMES[l]}</span><b>${n} / 20</b></div>
          <div class="pg-prog"><i style="width:${n / 20 * 100}%"></i></div>
          <details class="pg-words"><summary>${ws.length} ${t('wordsLearned', lang)}</summary>
            <div class="pg-wgrid">${ws.map((w) => `<div class="pg-w">${ART[w] || ''}<span>${(words[w] && words[w][l]) || w}</span></div>`).join('')}</div>
          </details>
        </div>`;
      }).join('') : `<p class="pg-none">${t('noLessonsYet', lang)}</p>`}
    </div>
    <div class="pg-card pg-small">
      <div><b>${pets.length} / ${ALL_PETS.length}</b><span>${t('petsEarned', lang)}</span><em>${pets.map((p) => (PET_NAMES[p] || {})[lang] || p).join(', ')}</em></div>
      <div><b>${stats.stories || 0}</b><span>${t('storiesWatched', lang)}</span></div>
      <div><b>${stats.lullabies || 0}</b><span>${t('lullabiesPlayed', lang)}</span></div>
    </div>
    <p class="pg-note">${t('privacyNote', lang)}</p>`;
}

// add one to a counter (stories watched, lullabies played)
export function countUp(key) {
  const s = json('stats', {});
  s[key] = (s[key] || 0) + 1;
  try { localStorage.setItem('funlingo.stats', JSON.stringify(s)); } catch { /* fine */ }
}
