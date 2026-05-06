#!/usr/bin/env python3
"""
serve.py — 一键启动 ReviewTime 可视化网站的本地 HTTP 服务器
用法：
    cd web/
    python serve.py          # 默认端口 8765
    python serve.py 8080     # 自定义端口

注意：data.xlsx 必须位于 web/ 目录下。
浏览器访问 http://localhost:8765 即可。
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
        # Only log errors and 2xx for xlsx/api
        if args and len(args) >= 2:
            status = str(args[1])
            if status.startswith('2') or status.startswith('3'):
                return  # suppress successful GET noise
        super().log_message(fmt, *args)


def open_browser():
    url = f'http://localhost:{PORT}'
    print(f'\n  ✅  ReviewTime 已启动 → {url}\n')
    webbrowser.open(url)


if __name__ == '__main__':
    # Change cwd to web/ directory (where this script lives)
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    if not os.path.exists('data.xlsx'):
        print('⚠️  未找到 data.xlsx，请将数据文件放在 web/ 目录下再运行。')
        print('   或参考 README.md 用 Python 脚本生成。')

    server = HTTPServer(('localhost', PORT), NoCacheHandler)
    threading.Timer(0.8, open_browser).start()
    print(f'  📡  服务器监听 http://localhost:{PORT}  (Ctrl+C 停止)')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\n  🛑  服务器已停止。')
