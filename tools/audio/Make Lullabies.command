#!/bin/bash
# Double-click to make the Fun Lingo lullabies (ElevenLabs Music).
cd "$(dirname "$0")"
echo "Type: test   (one song to check)   or   all / en / ja / ko / ne"
read -r CHOICE
if [ "$CHOICE" = "test" ]; then python3 make_lullabies.py test; else python3 make_lullabies.py build "${CHOICE:-all}"; fi
echo
echo "Done. You can close this window."
read -r -p ""
