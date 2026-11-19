#!/bin/bash
# Double-click to make the Fun Lingo audio clips.
cd "$(dirname "$0")"
echo "Which language?  en / ja / ko / ne / all"
read -r LANG_CHOICE
python3 generate_audio.py build "${LANG_CHOICE:-all}"
echo
echo "Done. You can close this window."
read -r -p ""
