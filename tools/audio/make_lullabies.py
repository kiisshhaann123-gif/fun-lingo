#!/usr/bin/env python3
"""Fun Lingo — make the lullabies with ElevenLabs Music.

Each of the 4 lullabies in content/lullabies.json is sung in each language
(16 songs). Every song: soft intro, verse 1, little break, verse 2, humming outro.

  python3 make_lullabies.py test              # makes ONE song (Little Star, English) to check it works
  python3 make_lullabies.py build all         # makes every song that isn't made yet
  python3 make_lullabies.py build ja          # only Japanese
  python3 make_lullabies.py build all --force # remake everything

Songs go to www/assets/lullabies/<lang>/<song>.mp3, with <song>.json holding
when each line is sung (the app lights the words up in time).
Uses the key in tools/audio/elevenlabs_key.txt. Music costs more credits than speech.
"""
import hashlib, json, os, sys, time, urllib.error, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
SONGS = os.path.join(ROOT, 'content', 'lullabies.json')
OUT = os.path.join(ROOT, 'www', 'assets', 'lullabies')
LANGS = ['en', 'ja', 'ko', 'ne']
LANG_NAME = {'en': 'English', 'ja': 'Japanese', 'ko': 'Korean', 'ne': 'Nepali'}
MODEL = 'music_v2_5'
SEED = 2024
# song shape (milliseconds)
INTRO, VERSE, BREAK, OUTRO = 7000, 26000, 6000, 11000
AVOID = ['drums', 'percussion', 'loud', 'fast tempo', 'rap', 'electric guitar', 'bass drop', 'shouting', 'male vocals']


def api_key():
    key = os.environ.get('ELEVENLABS_API_KEY', '').strip()
    path = os.path.join(HERE, 'elevenlabs_key.txt')
    if not key and os.path.exists(path):
        key = open(path, encoding='utf-8').read().strip()
    if not key:
        sys.exit('No API key. Paste your ElevenLabs key into tools/audio/elevenlabs_key.txt (one line).')
    return key


def plan_for(song, lang):
    styles = song['styles'] + [f'sung in {LANG_NAME[lang]}', 'clear gentle pronunciation']
    v1, v2 = song['lyrics'][lang]
    chunk = lambda text, ms, extra=(), avoid=(): {
        'text': text, 'duration_ms': ms,
        'positive_styles': styles + list(extra), 'negative_styles': AVOID + list(avoid),
    }
    return {'chunks': [
        chunk('[Intro]', INTRO, ['instrumental'], ['vocals']),
        chunk('[Verse 1]\n' + '\n'.join(v1), VERSE),
        chunk('[Interlude]', BREAK, ['instrumental'], ['vocals']),
        chunk('[Verse 2]\n' + '\n'.join(v2), VERSE),
        chunk('[Outro]\n(mmm, mmm)\n(la la la)', OUTRO, ['humming', 'fading out']),
    ]}


def timings(song, lang):
    """When each line is sung, spread evenly through its verse (good enough to light up the words)."""
    v1, v2 = song['lyrics'][lang]
    lines, t = [], INTRO
    for verse in (v1, v2):
        step = VERSE / len(verse)
        for i, text in enumerate(verse):
            lines.append({'text': text, 'start': round((t + i * step) / 1000, 2), 'end': round((t + (i + 1) * step) / 1000, 2)})
        t += VERSE + BREAK
    return {'title': song['title'][lang], 'length': (INTRO + 2 * VERSE + BREAK + OUTRO) / 1000, 'lines': lines}


def compose(key, plan):
    url = f'https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128'
    body = json.dumps({'composition_plan': plan, 'model_id': MODEL, 'seed': SEED}).encode('utf-8')
    req = urllib.request.Request(url, data=body, method='POST', headers={
        'xi-api-key': key, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg'})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=420) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            msg = e.read().decode('utf-8', 'replace')[:500]
            if e.code in (429, 500, 502, 503) and attempt < 3:
                wait = 10 * (attempt + 1)
                print(f'    server busy ({e.code}), retrying in {wait}s')
                time.sleep(wait)
                continue
            if 'quota_exceeded' in msg:
                write_index(json.load(open(SONGS, encoding='utf-8'))['songs'])   # keep the app's list right
                sys.exit('Not enough ElevenLabs credits left for this song (each song uses about 950).\n'
                         'Songs already made are kept. Run this again after your credits refill or after topping up;\n'
                         'it will pick up where it stopped.\n' + msg)
            if e.code in (401, 403):
                sys.exit(f'ElevenLabs said no ({e.code}): {msg}\n'
                         'Your plan or key may not include Music. In ElevenLabs: Developers → API Keys → edit the key '
                         'and allow "Music"; also check that your subscription includes Eleven Music.')
            sys.exit(f'ElevenLabs error {e.code}: {msg}')
        except urllib.error.URLError as e:
            if attempt < 3:
                time.sleep(5)
                continue
            sys.exit(f'Could not reach ElevenLabs: {e}')


def make(key, song, lang, force=False):
    d = os.path.join(OUT, lang)
    os.makedirs(d, exist_ok=True)
    mp3 = os.path.join(d, song['id'] + '.mp3')
    meta = os.path.join(d, song['id'] + '.json')
    plan = plan_for(song, lang)
    fp = hashlib.sha1(json.dumps([plan, MODEL, SEED], ensure_ascii=False).encode('utf-8')).hexdigest()[:12]
    if not force and os.path.exists(mp3) and os.path.exists(meta):
        try:
            if json.load(open(meta, encoding='utf-8')).get('fp') == fp:
                return False
        except Exception:
            pass
    print(f'  {lang} · {song["title"]["en"]} … (about a minute)')
    audio = compose(key, plan)
    with open(mp3, 'wb') as f:
        f.write(audio)
    info = timings(song, lang)
    info['fp'] = fp
    with open(meta, 'w', encoding='utf-8') as f:
        json.dump(info, f, ensure_ascii=False, indent=1)
    print(f'    saved {os.path.relpath(mp3, ROOT)} ({len(audio) // 1024} KB)')
    return True


def write_index(songs):
    """A small list the app reads: which songs exist for which language."""
    index = []
    for s in songs:
        index.append({'id': s['id'], 'icon': s.get('icon', 'star'), 'title': s['title'],
                      'langs': [l for l in LANGS if os.path.exists(os.path.join(OUT, l, s['id'] + '.mp3'))]})
    os.makedirs(OUT, exist_ok=True)
    with open(os.path.join(OUT, 'index.json'), 'w', encoding='utf-8') as f:
        json.dump(index, f, ensure_ascii=False, indent=1)


def main():
    a = sys.argv[1:]
    if not a or a[0] not in ('test', 'build'):
        print(__doc__)
        return
    songs = json.load(open(SONGS, encoding='utf-8'))['songs']
    key = api_key()
    if a[0] == 'test':
        make(key, songs[0], 'en', force='--force' in a)
        write_index(songs)
        print('\nTest song made: www/assets/lullabies/en/little_star.mp3 — have a listen!')
        return
    which = a[1] if len(a) > 1 and not a[1].startswith('--') else 'all'
    langs = LANGS if which == 'all' else [which]
    made = 0
    for lang in langs:
        for s in songs:
            if make(key, s, lang, force='--force' in a):
                made += 1
    write_index(songs)
    print(f'\nDone: {made} new song(s).')


if __name__ == '__main__':
    main()
