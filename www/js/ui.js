// Fun Lingo — the few words grown-ups see, in the language spoken at home.
// (Children don't need to read anything; the pictures and voices carry the app.)

const STRINGS = {
  en: { tabLanguages: 'Languages', tabProgress: 'Progress', weSpeak: 'We speak at home', childLearns: 'My child learns', done: 'Done', timeInApp: 'Time in the app', today: 'today', thisWeek: 'this week', total: 'in total', min: 'min', hr: 'h', lessons: 'Lessons (Unit 1)', wordsLearned: 'words learned (tap to see)', noLessonsYet: 'No lessons finished yet.', petsEarned: 'pets earned', storiesWatched: 'stories watched', lullabiesPlayed: 'lullabies played', privacyNote: 'All of this stays on this phone. Nothing is sent anywhere.',
        play: 'Play', pets: 'Pets', stories: 'Stories', lullaby: 'Lullabies', parentTip: 'Grown-ups: hold 3 seconds to change languages',
        friends: 'friends', locked: 'Finish lessons to unlock', theEnd: 'The End', tapToStart: 'Tap a book', tapSong: 'Tap a song', comingSoon: 'Coming soon' },
  ja: { tabLanguages: '言語', tabProgress: 'がんばり', weSpeak: '家庭で話す言語', childLearns: 'お子さまが学ぶ言語', done: '完了', timeInApp: '利用時間', today: '今日', thisWeek: '今週', total: '合計', min: '分', hr: '時間', lessons: 'レッスン（ユニット1）', wordsLearned: '語 覚えました（タップで表示）', noLessonsYet: 'まだ終わったレッスンはありません。', petsEarned: 'なかま', storiesWatched: 'おはなし', lullabiesPlayed: 'こもりうた', privacyNote: 'この情報はこの端末の中だけに保存され、どこにも送信されません。',
        play: 'あそぶ', pets: 'ペット', stories: 'おはなし', lullaby: 'こもりうた', parentTip: 'おうちの方へ：3秒長押しで言語を変更できます',
        friends: 'なかま', locked: 'レッスンを すすめると なかまに なるよ', theEnd: 'おしまい', tapToStart: 'えほんを タッチ', tapSong: 'うたを タッチ', comingSoon: 'じゅんびちゅう' },
  ko: { tabLanguages: '언어', tabProgress: '학습 기록', weSpeak: '집에서 쓰는 언어', childLearns: '아이가 배우는 언어', done: '완료', timeInApp: '사용 시간', today: '오늘', thisWeek: '이번 주', total: '전체', min: '분', hr: '시간', lessons: '수업 (1단원)', wordsLearned: '개 단어를 배웠어요 (눌러서 보기)', noLessonsYet: '아직 마친 수업이 없어요.', petsEarned: '친구', storiesWatched: '본 이야기', lullabiesPlayed: '들은 자장가', privacyNote: '모든 기록은 이 기기에만 저장되며 어디에도 보내지지 않아요.',
        play: '시작', pets: '친구들', stories: '이야기', lullaby: '자장가', parentTip: '보호자님: 3초 동안 누르면 언어를 바꿀 수 있어요',
        friends: '친구', locked: '수업을 마치면 만날 수 있어요', theEnd: '끝', tapToStart: '책을 눌러요', tapSong: '노래를 눌러요', comingSoon: '준비 중' },
  ne: { tabLanguages: 'भाषा', tabProgress: 'प्रगति', weSpeak: 'घरमा बोलिने भाषा', childLearns: 'बच्चाले सिक्ने भाषा', done: 'सकियो', timeInApp: 'एप चलाएको समय', today: 'आज', thisWeek: 'यो हप्ता', total: 'जम्मा', min: 'मिनेट', hr: 'घण्टा', lessons: 'पाठ (एकाइ १)', wordsLearned: 'शब्द सिकेको (हेर्न छुनुहोस्)', noLessonsYet: 'अहिलेसम्म कुनै पाठ सकिएको छैन।', petsEarned: 'साथी', storiesWatched: 'हेरेका कथा', lullabiesPlayed: 'सुनेका लोरी', privacyNote: 'यो सबै जानकारी यही फोनमा मात्र रहन्छ, कतै पठाइँदैन।',
        play: 'खेलौं', pets: 'साथीहरू', stories: 'कथा', lullaby: 'लोरी', parentTip: 'अभिभावकलाई: भाषा बदल्न ३ सेकेन्ड थिचिराख्नुहोस्',
        friends: 'साथी', locked: 'पाठ सकेपछि साथी बन्छ', theEnd: 'समाप्त', tapToStart: 'किताब छुनुहोस्', tapSong: 'गीत छुनुहोस्', comingSoon: 'छिट्टै आउँदैछ' },
};
export const PET_NAMES = {
  beep: { en: 'Beep', ja: 'ビープ', ko: '비프', ne: 'बिप' },
  gaju: { en: 'Gaju', ja: 'ガジュ', ko: '가주', ne: 'गजु' },
  sparky: { en: 'Sparky', ja: 'スパーキー', ko: '스파키', ne: 'स्पार्की' },
  bobo: { en: 'Bobo', ja: 'ボボ', ko: '보보', ne: 'बोबो' },
  himu: { en: 'Himu', ja: 'ヒム', ko: '히무', ne: 'हिमु' },
  mimi: { en: 'Mimi', ja: 'ミミ', ko: '미미', ne: 'मिमी' },
  pandu: { en: 'Pandu', ja: 'パンドゥ', ko: '판두', ne: 'पण्डु' },
  stardust: { en: 'Stardust', ja: 'スターダスト', ko: '스타더스트', ne: 'स्टारडस्ट' },
  roary: { en: 'Roary', ja: 'ローリー', ko: '로리', ne: 'रोरी' },
};
export const ALL_PETS = ['beep', 'gaju', 'sparky', 'bobo', 'himu', 'mimi', 'pandu', 'stardust', 'roary'];

const get = (k) => { try { return localStorage.getItem('funlingo.' + k) || ''; } catch { return ''; } };
export const homeLanguage = () => get('homeLang') || get('targetLang') || 'en';
export const learnLanguage = () => get('targetLang') || 'en';
export function t(key, lang = homeLanguage()) { return (STRINGS[lang] || STRINGS.en)[key] || STRINGS.en[key] || key; }
export function ownedPets() {
  let list = [];
  try { list = JSON.parse(get('pets') || '[]'); } catch { /* none yet */ }
  return ['beep', ...list.filter((p) => p !== 'beep' && ALL_PETS.includes(p))];
}
