"""German Trainer Platform - one FastAPI app hosting four modules: B2 and C1 vocabulary, grammar and essay tutor.

Routes:
    GET  /       -> hub page linking all four tools
    /b2/         -> "Bist du sicher?" B2 vocabulary trainer (Sicher! B2)
    /c1/         -> Deutsch C1 Vokabeltrainer (vokabelliste + Aspekte Neu C1)
    /schreiben/      -> Essay Tutor (upload -> OCR -> grammar/CEFR grading; needs
                    GLM_API_KEY / GEMINI_API_KEY to be set, everything else
                    here works without keys)

The trainers are fully client-side; FastAPI only serves the static files
(including the shared sesler/ audio banks) so fetch('...') paths resolve
unchanged relative to each app's mount point. The essay tutor is a second
FastAPI app mounted under /schreiben (its own /api/* routes and /ui frontend),
so its fetch('/api/...') calls are rewritten once here, relative to /schreiben.
Run with:
    uvicorn germanhub.app:app --host 0.0.0.0 --port $PORT
"""
from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from fastapi import FastAPI
from fastapi.responses import FileResponse, RedirectResponse, Response
from fastapi.staticfiles import StaticFiles

_ROOT = Path(__file__).resolve().parents[2]
_STATIC_DIR = Path(__file__).resolve().parent / "static"

app = FastAPI(title="German Trainer Platform", description="B2 and C1 German vocabulary trainers under one roof.")

_MODULE_PREFIXES = ("/b2", "/c1", "/grammatik", "/schreiben")
_NAV_TAG = b'<script src="/hub-static/nav.js" defer></script></body>'


@app.middleware("http")
async def _inject_nav(request, call_next):
    """Adds the shared module switcher (hub-static/nav.js) to every HTML page of the four
    modules, so the vendored module sources stay untouched and can be re-synced freely."""
    response = await call_next(request)
    path = request.url.path
    if (not path.startswith(_MODULE_PREFIXES) or response.status_code != 200
            or "text/html" not in response.headers.get("content-type", "")):
        return response
    body = b"".join([chunk async for chunk in response.body_iterator])
    if path.startswith("/grammatik"):  # inside the platform the writing module is the local one, not the standalone site
        body = body.replace(b"https://my-essay-tutor.onrender.com/ui/", b"/schreiben/").replace(
            b">Essay Tutor</a>", b">Schreibwerkstatt</a>")
    if b"</body>" in body and b"/hub-static/nav.js" not in body:
        body = body.replace(b"</body>", _NAV_TAG, 1)
    headers = {k: v for k, v in response.headers.items() if k.lower() not in ("content-length", "content-encoding")}
    return Response(content=body, status_code=200, headers=headers, media_type="text/html")


@app.get("/", include_in_schema=False)
def index() -> FileResponse:
    return FileResponse(_STATIC_DIR / "index.html")


@app.get("/essay", include_in_schema=False)
@app.get("/essay/{rest:path}", include_in_schema=False)
def old_essay_path(rest: str = "") -> RedirectResponse:
    """The module used to live at /essay (and was called Essay Tutor)."""
    return RedirectResponse("/schreiben/" + rest, status_code=308)


@app.get("/health", include_in_schema=False)
def health() -> dict:
    return {"status": "ok"}


_b2_dir = _ROOT / "apps" / "b2"
_c1_dir = _ROOT / "apps" / "c1"

if (_b2_dir / "index.html").exists():
    app.mount("/b2", StaticFiles(directory=str(_b2_dir), html=True), name="b2")

if (_c1_dir / "index.html").exists():
    app.mount("/c1", StaticFiles(directory=str(_c1_dir), html=True), name="c1")

_grammatik_dir = _ROOT / "apps" / "grammatik"

if (_grammatik_dir / "index.html").exists():
    app.mount("/grammatik", StaticFiles(directory=str(_grammatik_dir), html=True), name="grammatik")

app.mount("/hub-static", StaticFiles(directory=str(_STATIC_DIR)), name="hub-static")

# ---------------------------------------------------------------- essay tutor
# The standalone Essay Tutor app (my-essay-tutor repo), mounted in-process:
# one Render service serves all three tools. Its frontend calls fetch('/api/..')
# absolutely; served under /schreiben those would hit this hub instead, so it is
# mounted together with a tiny rewriting shim: /schreiben/api/* -> its /api/*.
def _mount_essay_tutor() -> None:
    # German-only module with its own German name; the standalone My Essay Tutor keeps de/en/fr.
    os.environ.setdefault("ALLOWED_LANGUAGES", "de")
    os.environ.setdefault("APP_TITLE", "Schreibwerkstatt")
    os.environ.setdefault("APP_KICKER", "A1 → C1 · telc · Goethe · Deutsch")
    os.environ.setdefault("GRAMMAR_SITE_URL", "/grammatik/")  # rule links stay inside the platform
    try:
        # Vendored copy first (src/essay_tutor, mirrored from my-essay-tutor),
        # installed package as fallback.
        try:
            from essay_tutor.api.app import app as essay_app
        except ImportError:
            from my_essay_tutor.api.app import app as essay_app  # type: ignore[import-not-found]
    except ImportError:
        return  # neither vendored nor installed -> hub runs without the essay tool

    from starlette.applications import ASGIApp
    from starlette.requests import Request
    from starlette.routing import Mount
    from starlette.types import Receive, Scope, Send

    class _PathRewrite:
        """Strips the /schreiben prefix so the inner app sees its own root paths.

        root_path is deliberately cleared: Starlette's Mount already sets
        root_path=/schreiben on the child scope, and with root_path=/schreiben,
        StaticFiles (html=True) 404s on its own redirects. The inner app's
        absolute redirects (e.g. / -> /ui/) are prefixed back with /essay in
        the send wrapper so the browser stays under the mount.
        """

        def __init__(self, inner: ASGIApp) -> None:
            self._inner = inner

        async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
            if scope["type"] != "http":
                await self._inner(scope, receive, send)
                return
            path = scope.get("path", "")
            if path == "/schreiben":
                scope = dict(scope, path="/", root_path="")
            elif path.startswith("/schreiben/"):
                scope = dict(scope, path=path.removeprefix("/schreiben"), root_path="")

            async def send_wrapper(message: Any) -> None:
                if message["type"] == "http.response.start":
                    headers = [
                        (key, b"/schreiben" + value if key == b"location" and value.startswith(b"/") else value)
                        for key, value in message["headers"]
                    ]
                    message = dict(message, headers=headers)
                await send(message)

            await self._inner(scope, receive, send_wrapper)

    app.mount("/schreiben", _PathRewrite(essay_app), name="schreiben")


_mount_essay_tutor()
