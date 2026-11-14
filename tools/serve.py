#!/usr/bin/env python3
"""Servidor local de Cromanenos (Linux). Serve os ficheiros estáticos deste
cartafol a este mesmo ordenador e encárgase das actualizacións.

Uso: python3 tools/serve.py [porto] [--no-csp]

A páxina non pode conectarse a internet (ver a Content-Security-Policy de
index.html). O único que sae á rede é este programa, e só para preguntar cal é
a última versión publicada e descargala: peticións GET sen ningún dato da
persoa nin dos seus vídeos.

--no-csp quita a Content-Security-Policy de index.html. Só para probas
automáticas, que precisan cargar vídeos de exemplo con fetch().
"""
import http.server
import io
import json
import os
import pathlib
import re
import shutil
import stat
import sys
import tempfile
import threading
import time
import urllib.request
import zipfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
args = [a for a in sys.argv[1:] if not a.startswith("--")]
PORT = int(args[0]) if args else 8765
NO_CSP = "--no-csp" in sys.argv

UPDATE_BASE = os.environ.get("CROMANENOS_UPDATE_BASE", "https://github.com/abel-eiras/cromanenos").rstrip("/")
CHECK_TIMEOUT = 5
DOWNLOAD_TIMEOUT = 60
MAX_ZIP = 50 * 1024 * 1024
MAX_UNPACKED = 200 * 1024 * 1024
PREFIX = "cromanenos/"
VERSION_RE = re.compile(r"^\d+\.\d+\.\d+$")
update_lock = threading.Lock()


# ------------------------------------------------------------- actualizacións
def current_version():
    try:
        v = (ROOT / "VERSION").read_text(encoding="utf-8").strip()
        return v if VERSION_RE.match(v) else "0.0.0"
    except OSError:
        return "0.0.0"


def as_tuple(v):
    return tuple(int(x) for x in v.split("."))


def can_update():
    # Nunha copia de desenvolvemento (con .git) non se toca nada.
    return not (ROOT / ".git").exists() and os.access(ROOT, os.W_OK)


def fetch(url, timeout):
    req = urllib.request.Request(url, headers={"User-Agent": "Cromanenos"})
    return urllib.request.urlopen(req, timeout=timeout)


def latest_version():
    """Última versión publicada: séguese a redirección de /releases/latest."""
    with fetch(UPDATE_BASE + "/releases/latest", CHECK_TIMEOUT) as r:
        final = r.geturl()
    m = re.search(r"/releases/tag/v(\d+\.\d+\.\d+)/?$", final.split("?")[0])
    return m.group(1) if m else None


def check_update():
    current = current_version()
    latest = latest_version()
    if not latest:
        return {"ok": False}
    return {"ok": True, "current": current, "latest": latest,
            "available": as_tuple(latest) > as_tuple(current)}


def download(url):
    deadline = time.monotonic() + DOWNLOAD_TIMEOUT
    buf = io.BytesIO()
    with fetch(url, 15) as r:
        while True:
            chunk = r.read(256 * 1024)
            if not chunk:
                break
            buf.write(chunk)
            if buf.tell() > MAX_ZIP or time.monotonic() > deadline:
                raise ValueError("descarga demasiado grande ou lenta")
    return buf.getvalue()


def safe_entries(z, version):
    """Valida o ZIP enteiro antes de tocar nada. Devolve [(info, ruta relativa)]."""
    out = []
    total = 0
    for info in z.infolist():
        name = info.filename
        parts = pathlib.PurePosixPath(name).parts
        if (not name.startswith(PREFIX) or name.startswith("/") or "\\" in name
                or ":" in name or ".." in parts):
            raise ValueError("entrada non permitida")
        if stat.S_ISLNK(info.external_attr >> 16):
            raise ValueError("ligazón simbólica non permitida")
        total += info.file_size
        if total > MAX_UNPACKED:
            raise ValueError("contido demasiado grande")
        rel = name[len(PREFIX):]
        if rel and not name.endswith("/"):
            out.append((info, rel))
    names = {rel for _, rel in out}
    if "index.html" not in names or "VERSION" not in names:
        raise ValueError("non parece Cromanenos")
    if z.read(PREFIX + "VERSION").decode("utf-8").strip() != version:
        raise ValueError("a versión non coincide")
    return out


def apply_update():
    if not can_update() or not update_lock.acquire(blocking=False):
        return {"ok": False}
    tmp = None
    try:
        info = check_update()
        if not info.get("ok") or not info["available"]:
            return {"ok": False}
        version = info["latest"]
        data = download(f"{UPDATE_BASE}/releases/download/v{version}/cromanenos-v{version}.zip")
        with zipfile.ZipFile(io.BytesIO(data)) as z:
            entries = safe_entries(z, version)
            tmp = pathlib.Path(tempfile.mkdtemp(prefix=".actualizacion-", dir=ROOT))
            for zi, rel in entries:
                dest = tmp / rel
                dest.parent.mkdir(parents=True, exist_ok=True)
                with z.open(zi) as src, open(dest, "wb") as dst:
                    shutil.copyfileobj(src, dst)
        # Só se substitúen os ficheiros que veñen no ZIP; o resto non se toca.
        # VERSION vai ao final: se algo falla a medias, vólvese intentar.
        ordered = sorted((rel for _, rel in entries), key=lambda rel: rel == "VERSION")
        for rel in ordered:
            dest = ROOT / rel
            dest.parent.mkdir(parents=True, exist_ok=True)
            os.replace(tmp / rel, dest)
        try:
            os.chmod(ROOT / "iniciar.sh", 0o755)
        except OSError:
            pass
        return {"ok": True, "version": version}
    except Exception:  # rede, proxy, TLS, ZIP estragado… nunca é motivo de alarma
        return {"ok": False}
    finally:
        if tmp is not None:
            shutil.rmtree(tmp, ignore_errors=True)
        update_lock.release()


# ------------------------------------------------------------------- servidor
class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=str(ROOT), **kw)

    def log_message(self, *a):
        pass  # xanela tranquila: sen unha liña por cada ficheiro

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Cromanenos", "launcher")  # a páxina sabe así que hai lanzador
        super().end_headers()

    def same_origin(self):
        """A API só responde á propia páxina de Cromanenos."""
        host = self.headers.get("Host", "")
        if host not in (f"localhost:{PORT}", f"127.0.0.1:{PORT}"):
            return False
        origin = self.headers.get("Origin")
        if origin is not None and origin != f"http://{host}":
            return False
        return self.headers.get("Sec-Fetch-Site", "same-origin") in ("same-origin", "none")

    def send_json(self, obj, status=200):
        body = json.dumps(obj).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def api(self, method):
        path = self.path.split("?")[0]
        if not path.startswith("/api/"):
            return False
        if not self.same_origin():
            self.send_json({"ok": False}, 403)
        elif method == "GET" and path == "/api/version":
            self.send_json({"version": current_version(), "canUpdate": can_update()})
        elif method == "POST" and path == "/api/update/check":
            try:
                self.send_json(check_update())
            except Exception:
                self.send_json({"ok": False})
        elif method == "POST" and path == "/api/update/apply":
            self.send_json(apply_update())
        else:
            self.send_json({"ok": False}, 404)
        return True

    def do_GET(self):
        if self.api("GET"):
            return
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

    def do_POST(self):
        if not self.api("POST"):
            self.send_error(404)

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


if __name__ == "__main__":
    Handler.extensions_map[".mjs"] = "text/javascript"
    Handler.extensions_map[""] = "text/plain"  # VERSION, LICENSE
    try:
        http.server.ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
    except KeyboardInterrupt:
        pass
