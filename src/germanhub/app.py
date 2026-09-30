"""German Trainer Platform - one FastAPI app hosting the B2 and C1 trainers.

Routes:
    GET  /       -> hub page linking both levels
    /b2/         -> "Bist du sicher?" B2 vocabulary trainer (Sicher! B2)
    /c1/         -> Deutsch C1 Vokabeltrainer (vokabelliste + Aspekte Neu C1)

Both trainers are fully client-side; FastAPI only serves the static files
(including the shared sesler/ audio banks) so fetch('...') paths resolve
unchanged relative to each app's mount point.
Run with:
    uvicorn site.app:app --host 0.0.0.0 --port $PORT
"""
from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse
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
