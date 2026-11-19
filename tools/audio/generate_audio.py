#!/usr/bin/env python3
"""
Fun Lingo - audio generator (ElevenLabs -> MP3 files inside the app).

Runs on your Mac with plain Python 3; nothing to install.

  python3 generate_audio.py voices                 # list the voices in your ElevenLabs account
  python3 generate_audio.py preview ne             # one test line per Nepali voice in voices.json
  python3 generate_audio.py build ne               # make every missing/changed Nepali clip
  python3 generate_audio.py build all              # all four languages
  python3 generate_audio.py build ne --only kukur  # just one line
  python3 generate_audio.py build ne --force       # remake everything for Nepali
  python3 generate_audio.py lips all               # add lip-sync timings to clips you already have (free)
  python3 generate_audio.py import-review ne       # copy a reviewer's fixes from content/review/unit1_ne.csv

Where things live
  content/packs/<lang>/lines.json           what each teacher says (you edit this)
  tools/audio/voices.json                   which ElevenLabs voice speaks for each teacher, per language
  tools/audio/elevenlabs_key.txt            your API key (one line, never shared, never put in the app)
  www/assets/packs/<lang>/audio/<id>.mp3    the finished clips the app plays
  www/assets/packs/<lang>/audio/<id>.json   mouth-shape timings for lip sync (if Rhubarb is installed)
  www/assets/packs/<lang>/audio/manifest.json   list of clips + what text/voice made them
"""
import hashlib, json, os, shutil, subprocess, sys, time, urllib.error, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
CONTENT = os.path.join(ROOT, 'content', 'packs')
OUT = os.path.join(ROOT, 'www', 'assets', 'packs')
LANGS = ['en', 'ja', 'ko', 'ne']
API = 'https://api.elevenlabs.io/v1'


# ---------------------------------------------------------------- setup
def api_key():
    key = os.environ.get('ELEVENLABS_API_KEY', '').strip()
    path = os.path.join(HERE, 'elevenlabs_key.txt')
    if not key and os.path.exists(path):
        key = open(path, encoding='utf-8').read().strip()
    if not key:
        sys.exit('No API key. Paste your ElevenLabs key into tools/audio/elevenlabs_key.txt (one line).')
    return key


def load_json(path):
    with open(path, encoding='utf-8') as f:
        return json.load(f)


def save_json(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def voices_cfg():
    return load_json(os.path.join(HERE, 'voices.json'))


# ---------------------------------------------------------------- ElevenLabs calls
def request(method, url, key, body=None, accept='application/json'):
    data = json.dumps(body).encode('utf-8') if body is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers={
        'xi-api-key': key, 'Content-Type': 'application/json', 'Accept': accept})
    for attempt in range(5):
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            msg = e.read().decode('utf-8', 'replace')[:300]
            if e.code in (429, 500, 502, 503) and attempt < 4:      # busy: wait and try again
                wait = 3 * (attempt + 1)
                print(f'    server busy ({e.code}), retrying in {wait}s')
                time.sleep(wait)
                continue
            raise SystemExit(f'ElevenLabs error {e.code}: {msg}')
        except urllib.error.URLError as e:
            if attempt < 4:
                time.sleep(3)
                continue
            raise SystemExit(f'Network problem: {e.reason}')


def speak(key, text, voice, lang, cfg):
    model = voice.get('model', cfg.get('model', 'eleven_v3'))
    body = {
        'text': text,
        'model_id': model,
        'language_code': lang,        # forces the right language and number/date reading
        'voice_settings': {**cfg.get('voice_settings', {}), **voice.get('voice_settings', {})},
    }
    if 'seed' in cfg:
        body['seed'] = cfg['seed']    # same seed -> same take each time you rebuild
    fmt = cfg.get('output_format', 'mp3_44100_128')
    url = f"{API}/text-to-speech/{voice['voice_id']}?output_format={fmt}"
    return request('POST', url, key, body, accept='audio/mpeg'), model


# ---------------------------------------------------------------- lip sync (optional)
def find_rhubarb():
    local = os.path.join(HERE, 'rhubarb', 'rhubarb')
    if os.path.exists(local):
        return local
    return shutil.which('rhubarb')


def lipsync(mp3_path, json_path, text, lang):
    rhubarb = find_rhubarb()
    if not rhubarb or not shutil.which('afconvert'):
        return False
    wav = mp3_path[:-4] + '.tmp.wav'
    txt = mp3_path[:-4] + '.tmp.txt'
    try:
        # Rhubarb reads WAV, so convert with afconvert (built into macOS)
        subprocess.run(['afconvert', '-f', 'WAVE', '-d', 'LEI16@16000', '-c', '1', mp3_path, wav],
                       check=True, capture_output=True)
        with open(txt, 'w', encoding='utf-8') as f:
            f.write(text)
        # English can use the word recogniser; every other language uses the sound-based one
        recognizer = 'pocketSphinx' if lang == 'en' else 'phonetic'
        cmd = [rhubarb, '-q', '-f', 'json', '-r', recognizer, '-o', json_path, wav]
        if lang == 'en':
            cmd[1:1] = ['-d', txt]
        subprocess.run(cmd, check=True, capture_output=True)
        return True
    except subprocess.CalledProcessError as e:
        print('    lip sync failed:', (e.stderr or b'').decode('utf-8', 'replace')[:200])
        return False
    finally:
        for p in (wav, txt):
            if os.path.exists(p):
                os.remove(p)


# ---------------------------------------------------------------- commands
def cmd_voices():
    key = api_key()
    data = json.loads(request('GET', f'{API}/voices', key))
    print(f"{'NAME':28} {'VOICE ID':24} DETAILS")
    for v in sorted(data.get('voices', []), key=lambda v: v.get('name', '')):
        labels = ', '.join(f'{k}: {val}' for k, val in (v.get('labels') or {}).items())
        print(f"{v.get('name', '')[:28]:28} {v.get('voice_id', ''):24} {labels}")


def cmd_preview(lang):
    key, cfg = api_key(), voices_cfg()
    lines = cfg.get('preview_lines', {})
    out = os.path.join(HERE, 'previews')
    os.makedirs(out, exist_ok=True)
    for speaker, voice in {**cfg['languages'][lang], **cfg.get('pets', {})}.items():
        if not voice.get('voice_id') or voice['voice_id'].startswith('PASTE'):
            print(f'  {speaker}: no voice id yet, skipped')
            continue
        audio, _ = speak(key, lines.get(lang, 'Hello!'), voice, lang, cfg)
        path = os.path.join(out, f'{lang}_{speaker}.mp3')
        open(path, 'wb').write(audio)
        print(f'  {speaker}: {path}')
    if sys.platform == 'darwin':
        subprocess.run(['open', out])


def fingerprint(text, voice, model, cfg):
    s = json.dumps([text, voice['voice_id'], model, cfg.get('voice_settings'), voice.get('voice_settings')],
                   ensure_ascii=False, sort_keys=True)
    return hashlib.sha1(s.encode('utf-8')).hexdigest()[:12]


def cmd_build(lang, only=None, force=False):
    import threading
    from concurrent.futures import ThreadPoolExecutor, as_completed
    key, cfg = api_key(), voices_cfg()
    pack = load_json(os.path.join(CONTENT, lang, 'lines.json'))
    out_dir = os.path.join(OUT, lang, 'audio')
    os.makedirs(out_dir, exist_ok=True)
    man_path = os.path.join(out_dir, 'manifest.json')
    manifest = load_json(man_path) if os.path.exists(man_path) else {}
    lock = threading.Lock()
    jobs, skipped = [], 0
    for line in pack['lines']:
        lid, speaker, text = line['id'], line['speaker'], line['text']
        if only and lid != only:
            continue
        voice = cfg['languages'][lang].get(speaker) or cfg.get('pets', {}).get(speaker)
        if not voice or voice.get('voice_id', '').startswith('PASTE'):
            print(f'  {lid}: no voice set for "{speaker}" in voices.json, skipped')
            continue
        model = voice.get('model', cfg.get('model', 'eleven_v3'))
        fp = fingerprint(text, voice, model, cfg)
        mp3 = os.path.join(out_dir, f'{lid}.mp3')
        if not force and os.path.exists(mp3) and manifest.get(lid, {}).get('fp') == fp:
            skipped += 1
            continue
        jobs.append((lid, speaker, text, voice, fp, mp3))

    workers = int(os.environ.get('FUNLINGO_PARALLEL', cfg.get('parallel', 3)))
    total = len(jobs)
    print(f'{lang}: {total} clips to make, {skipped} already up to date, {workers} at a time')

    def make(job):
        lid, speaker, text, voice, fp, mp3 = job
        audio, model = speak(key, text, voice, lang, cfg)
        with open(mp3, 'wb') as f:
            f.write(audio)
        has_lips = lipsync(mp3, os.path.join(out_dir, f'{lid}.json'), text, lang)
        return lid, speaker, text, voice, fp, model, has_lips

    done = chars = 0
    with ThreadPoolExecutor(max_workers=max(1, workers)) as pool:
        futures = [pool.submit(make, j) for j in jobs]
        for fut in as_completed(futures):
            lid, speaker, text, voice, fp, model, has_lips = fut.result()
            with lock:
                old = manifest.get(lid, {})
                manifest[lid] = {'file': f'{lid}.mp3', 'lips': f'{lid}.json' if has_lips else None,
                                 'speaker': speaker, 'text': text, 'voice_id': voice['voice_id'],
                                 'model': model, 'fp': fp,
                                 'reviewed': old.get('reviewed', False) if old.get('fp') == fp else False}
                save_json(man_path, manifest)      # saved as we go, so a stop halfway loses nothing
                done += 1
                chars += len(text)
                print(f'  [{done}/{total}] {lid}  ({speaker})  {text}')
    print(f'{lang}: {done} new, {skipped} already up to date, about {chars} characters used.')
    if not find_rhubarb():
        print('  (Rhubarb not found, so no lip-sync files were made. See tools/audio/README.md.)')


def cmd_lips(lang):
    if not find_rhubarb():
        sys.exit('Rhubarb not found. Put it in tools/audio/rhubarb/ (see README.md).')
    out_dir = os.path.join(OUT, lang, 'audio')
    man_path = os.path.join(out_dir, 'manifest.json')
    if not os.path.exists(man_path):
        print(f'{lang}: no clips yet')
        return
    manifest = load_json(man_path)
    done = 0
    for lid, item in manifest.items():
        mp3 = os.path.join(out_dir, item['file'])
        if not os.path.exists(mp3):
            continue
        if lipsync(mp3, os.path.join(out_dir, f'{lid}.json'), item['text'], lang):
            item['lips'] = f'{lid}.json'
            done += 1
    save_json(man_path, manifest)
    print(f'{lang}: lip sync made for {done} clips')


def cmd_import_review(lang, unit='1'):
    import csv
    path = os.path.join(ROOT, 'content', 'review', f'unit{unit}_{lang}.csv')
    pack_path = os.path.join(CONTENT, lang, 'lines.json')
    pack = load_json(pack_path)
    by_id = {l['id']: l for l in pack['lines']}
    fixed = 0
    with open(path, encoding='utf-8-sig') as f:
        for row in csv.DictReader(f):
            new = (row.get('Correct line (if fix)') or '').strip()
            if new and row['id'] in by_id and by_id[row['id']]['text'] != new:
                by_id[row['id']]['text'] = new
                fixed += 1
    save_json(pack_path, pack)
    print(f'{lang}: {fixed} lines updated from the review sheet. Run build again to remake just those clips.')


def main():
    a = sys.argv[1:]
    if not a or a[0] in ('-h', '--help', 'help'):
        print(__doc__)
        return
    if a[0] == 'voices':
        cmd_voices()
    elif a[0] == 'preview' and len(a) > 1:
        cmd_preview(a[1])
    elif a[0] == 'build' and len(a) > 1:
        only = a[a.index('--only') + 1] if '--only' in a else None
        langs = LANGS if a[1] == 'all' else [a[1]]
        for lang in langs:
            cmd_build(lang, only=only, force='--force' in a)
    elif a[0] == 'import-review' and len(a) > 1:
        cmd_import_review(a[1])
    elif a[0] == 'lips' and len(a) > 1:
        for lang in (LANGS if a[1] == 'all' else [a[1]]):
            cmd_lips(lang)
    else:
        print(__doc__)


if __name__ == '__main__':
    main()
