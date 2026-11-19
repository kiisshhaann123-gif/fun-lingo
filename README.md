# FUN LINGO

A language-learning app for toddlers. Didi Asha and Dai Leo teach in a 3D classroom,
and pets cheer the child on. Languages: English, Japanese, Korean and Nepali.

- No text needed for the child: pictures, voices and taps.
- The parent area (hold the lock button for 3 seconds) sets the language spoken at
  home and the language the child learns. Teachers say each line in both.
- Works offline once loaded, no ads, no data collection.

## Try it

Online: published automatically to GitHub Pages from the `www` folder.

On your computer: double-click `start.command` (Mac), or run

```
cd www
python3 -m http.server 8080
```

and open http://localhost:8080

## Folders

| Folder | What's inside |
|---|---|
| `www/` | the app itself (HTML, CSS, JavaScript, 3D characters, voice clips) |
| `content/` | lesson scripts per language, and review sheets for native speakers |
| `tools/` | scripts that write the lesson script and make the voices (ElevenLabs + Rhubarb) |

The ElevenLabs key lives only in `tools/audio/elevenlabs_key.txt` on your own computer
and is never uploaded.
