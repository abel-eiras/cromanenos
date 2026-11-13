#!/usr/bin/env python3
"""Servidor local para desenvolver Cromanenos. Só serve ficheiros estáticos.

Uso: python3 tools/serve.py [porto] [--no-csp]

--no-csp quita a Content-Security-Policy de index.html. Só para probas
automáticas, que precisan cargar vídeos de exemplo con fetch().
"""
import http.server
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
args = [a for a in sys.argv[1:] if not a.startswith("--")]
PORT = int(args[0]) if args else 8765
NO_CSP = "--no-csp" in sys.argv


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=str(ROOT), **kw)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_GET(self):
        if NO_CSP and self.path.split("?")[0] in ("/", "/index.html"):
            html = (ROOT / "index.html").read_text(encoding="utf-8")
            html = re.sub(r"<meta http-equiv=\"Content-Security-Policy\".*?>", "", html, flags=re.S)
            body = html.encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        super().do_GET()

    def do_PUT(self):
        # Só en modo de probas: gardar un vídeo exportado para inspeccionalo.
        name = pathlib.PurePosixPath(self.path).name
        if not NO_CSP or not self.path.startswith("/__out/") or not name:
            self.send_error(403)
            return
        out = ROOT / "test-media" / "out"
        out.mkdir(parents=True, exist_ok=True)
        (out / name).write_bytes(self.rfile.read(int(self.headers["Content-Length"])))
        self.send_response(204)
        self.end_headers()


Handler.extensions_map[".mjs"] = "text/javascript"
http.server.ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
