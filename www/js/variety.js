// Fun Lingo — variety
// Picks a line from a pool without repeating recent ones. What was said lately is
// remembered (also between visits), so the same line only comes back after most of
// the others have been heard.

const get = (k) => { try { return JSON.parse(localStorage.getItem('funlingo.recent.' + k)) || []; } catch { return []; } };
const put = (k, v) => { try { localStorage.setItem('funlingo.recent.' + k, JSON.stringify(v)); } catch { /* fine */ } };

export function fresh(key, pool) {
  if (!pool.length) return null;
  const recent = get(key);
  const keep = Math.max(1, Math.ceil(pool.length * 0.6));     // how many recent lines to avoid
  let choices = pool.filter((p) => !recent.slice(-keep).includes(p));
  if (!choices.length) choices = pool.filter((p) => p !== recent[recent.length - 1]);
  if (!choices.length) choices = pool;
  const pick = choices[Math.floor(Math.random() * choices.length)];
  put(key, [...recent.filter((r) => r !== pick), pick].slice(-12));
  return pick;
}

// teacher greetings: one that fits the time of day, plus the everyday ones
export function teacherGreetings() {
  const h = new Date().getHours();
  const time = h >= 5 && h < 12 ? 'good_morning' : h >= 12 && h < 17 ? 'good_afternoon' : 'good_evening';
  return [time, 'hello_friend', 'welcome_back', 'nice_to_see', 'hi_there', 'fun_today', 'yay_youre_here', 'missed_you', 'so_happy'];
}
// pet greetings: shared lines plus the pet's own
export const PET_GREETINGS = ['hi_friend', 'yay_here', 'learn_together', 'lets_play', 'happy_meet', 'high_five', 'love_you', 'own1', 'own2', 'own3', 'own4'];

export function shuffle(a) { return a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((x) => x[1]); }
