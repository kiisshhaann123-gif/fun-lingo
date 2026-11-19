#!/bin/bash
# Double-click to preview Fun Lingo in your browser.
cd "$(dirname "$0")/www"
PORT=8080
(sleep 1; open "http://localhost:$PORT") &
echo "Fun Lingo is running at http://localhost:$PORT  (close this window to stop)"
python3 - "$PORT" <<'PY'
import sys, http.server
class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')   # always serve the newest files
        super().end_headers()
http.server.ThreadingHTTPServer(('', int(sys.argv[1])), NoCache).serve_forever()
PY
