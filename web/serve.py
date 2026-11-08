#!/usr/bin/env python3
"""
serve.py - Start a local HTTP server for ReviewTime.
Usage:
    cd web/
    python serve.py          # default port 8765
    python serve.py 8080     # custom port

Recommended public data mode: serve aggregated JSON snapshots from web/data/.
Local XLSX fallback is for development only.
"""
import sys
import os
import threading
import webbrowser
from http.server import HTTPServer, SimpleHTTPRequestHandler

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8765

class NoCacheHandler(SimpleHTTPRequestHandler):
    """Serve files from the web/ directory with no-cache headers for easy development."""

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

    def log_message(self, fmt, *args):
        # Suppress routine successful GET noise
        if args and len(args) >= 2:
            status = str(args[1])
            if status.startswith('2') or status.startswith('3'):
                return  # suppress successful GET noise
        super().log_message(fmt, *args)


def open_browser():
    url = f'http://localhost:{PORT}'
    print(f'\n  ✅  ReviewTime started at {url}\n')
    webbrowser.open(url)


if __name__ == '__main__':
    # Change cwd to web/ directory (where this script lives)
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    if not os.path.exists('data/global-summary.json') and not os.path.exists('data.xlsx'):
        print('⚠️  No public snapshots or local data.xlsx were found.')
        print('   Generate snapshots first or place data.xlsx locally for development.')

    server = HTTPServer(('localhost', PORT), NoCacheHandler)
    threading.Timer(0.8, open_browser).start()
    print(f'  📡  Serving http://localhost:{PORT}  (Ctrl+C to stop)')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\n  🛑  Server stopped.')
