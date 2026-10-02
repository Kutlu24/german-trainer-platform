"""German Trainer Platform - one FastAPI app hosting the B2, C1 and essay tutors.

Routes:
    GET  /       -> hub page linking all three tools
    /b2/         -> "Bist du sicher?" B2 vocabulary trainer (Sicher! B2)
    /c1/         -> Deutsch C1 Vokabeltrainer (vokabelliste + Aspekte Neu C1)
    /essay/      -> Essay Tutor (upload -> OCR -> grammar/CEFR grading; needs
                    GLM_API_KEY / GEMINI_API_KEY to be set, everything else
                    here works without keys)

The trainers are fully client-side; FastAPI only serves the static files
(including the shared sesler/ audio banks) so fetch('...') paths resolve
unchanged relative to each app's mount point. The essay tutor is a second
FastAPI app mounted under /essay (its own /api/* routes and /ui frontend),
so its fetch('/api/...') calls are rewritten once here, relative to /essay.
Run with:
    uvicorn germanhub.app:app --host 0.0.0.0 --port $PORT
"""
from __future__ import annotations

from pathlib import Path
from typing import Any

from fastapi import FastAPI
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles

_ROOT = Path(__file__).resolve().parents[2]
_STATIC_DIR = Path(__file__).resolve().parent / "static"

app = FastAPI(title="German Trainer Platform", description="B2 and C1 German vocabulary trainers under one roof.")


@app.get("/", include_in_schema=False)
def index() -> FileResponse:
    return FileResponse(_STATIC_DIR / "index.html")


@app.get("/health", include_in_schema=False)
def health() -> dict:
    return {"status": "ok"}


_b2_dir = _ROOT / "apps" / "b2"
_c1_dir = _ROOT / "apps" / "c1"

if (_b2_dir / "index.html").exists():
    app.mount("/b2", StaticFiles(directory=str(_b2_dir), html=True), name="b2")

if (_c1_dir / "index.html").exists():
    app.mount("/c1", StaticFiles(directory=str(_c1_dir), html=True), name="c1")

app.mount("/hub-static", StaticFiles(directory=str(_STATIC_DIR)), name="hub-static")

# ---------------------------------------------------------------- essay tutor
# The standalone Essay Tutor app (my-essay-tutor repo), mounted in-process:
# one Render service serves all three tools. Its frontend calls fetch('/api/..')
# absolutely; served under /essay those would hit this hub instead, so it is
# mounted together with a tiny rewriting shim: /essay/api/* -> its /api/*.
def _mount_essay_tutor() -> None:
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
        """Strips the /essay prefix so the inner app sees its own root paths.

        root_path is deliberately cleared: Starlette's Mount already sets
        root_path=/essay on the child scope, and with root_path=/essay,
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
            if path == "/essay":
                scope = dict(scope, path="/", root_path="")
            elif path.startswith("/essay/"):
                scope = dict(scope, path=path.removeprefix("/essay"), root_path="")

            async def send_wrapper(message: Any) -> None:
                if message["type"] == "http.response.start":
                    headers = [
                        (key, b"/essay" + value if key == b"location" and value.startswith(b"/") else value)
                        for key, value in message["headers"]
                    ]
                    message = dict(message, headers=headers)
                await send(message)

            await self._inner(scope, receive, send_wrapper)

    app.mount("/essay", _PathRewrite(essay_app), name="essay")


_mount_essay_tutor()
