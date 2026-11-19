# Fun Lingo audio

Every word and sentence the teachers say is made once with ElevenLabs and saved
as an MP3 inside the app (`www/assets/packs/<lang>/audio/`). The app only plays
those files: it works offline and never sends anything to ElevenLabs.

## One-time setup
1. ElevenLabs website -> your profile -> API Keys -> create a key.
   Paste it into `tools/audio/elevenlabs_key.txt` (one line, nothing else).
2. Choose the voices (see below) and put their IDs in `voices.json`.
3. Optional, for lip sync: download Rhubarb Lip Sync for macOS
   (github.com/DanielSWolf/rhubarb-lip-sync, Releases) and unzip it so the program sits at
   `tools/audio/rhubarb/rhubarb`. Without it you still get audio, just no mouth timings.

## Choosing voices
- English (neutral): suggested Sarah for Didi Asha and Will for Dai Leo.
- Japanese, Korean, Nepali: in ElevenLabs -> Voices -> Voice Library, filter by the
  language and pick native speakers with a warm, friendly, young-adult sound.
  Add them to "My Voices", then run `python3 generate_audio.py voices` to see their IDs.
- Best for Nepali: record a native speaker friend (with their permission) and make an
  Instant Voice Clone; it carries the real accent.
- Listen before committing: `python3 generate_audio.py preview ne`

## Making clips
- Double-click `Make Audio.command` and type a language (en, ja, ko, ne or all), or
- `python3 generate_audio.py build ne`
Only new or changed lines are made, so re-running is cheap.
`--force` remakes everything; `--only kukur` makes one line.

## What to edit
- `content/packs/<lang>/lines.json`: the lines (id, speaker, text).
- `voices.json`: the voices and settings.
