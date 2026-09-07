#!/usr/bin/env python3
"""목업 미리보기 서버.

  python3 docs/mockup/_serve.py          # http://localhost:8099
  python3 docs/mockup/_serve.py 9000     # 포트 지정

python -m http.server 로 띄우면 브라우저가 CSS·JS 를 캐시해, 파일을 고쳐도
예전 화면이 그대로 보인다. no-cache 헤더만으로는 이미 들고 있는 메모리
캐시를 못 비운다. 그래서 HTML 을 내보낼 때 assets/ 링크에 파일 수정시각을
붙여 준다 — 파일이 바뀌면 주소가 바뀌어 브라우저가 새로 받는다.
HTML 원본은 건드리지 않는다.
"""
import http.server, socketserver, os, re, sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8099
ROOT = os.path.dirname(os.path.abspath(__file__))
os.chdir(ROOT)

ASSET = re.compile(r'(href|src)="((?:\.\./)*assets/[^"?]+)"')

class Handler(http.server.SimpleHTTPRequestHandler):
    def _stamp(self, html, page_dir):
        def sub(m):
            attr, rel = m.group(1), m.group(2)
            target = os.path.normpath(os.path.join(page_dir, rel))
            if not os.path.isfile(target):
                return m.group(0)
            return '%s="%s?v=%d"' % (attr, rel, int(os.path.getmtime(target)))
        return ASSET.sub(sub, html)

    def do_GET(self):
        path = self.translate_path(self.path)
        if os.path.isdir(path):
            path = os.path.join(path, "index.html")
        if path.endswith(".html") and os.path.isfile(path):
            html = open(path, encoding="utf-8").read()
            data = self._stamp(html, os.path.dirname(path)).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            return
        super().do_GET()

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        super().end_headers()

    def log_message(self, *a):
        pass

socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print("목업 → http://localhost:%d  (Ctrl+C 로 종료)" % PORT)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print()
