# German Trainer Platform

Two exam-focused German vocabulary trainers under one FastAPI application:

| Trainer | Path | Content |
|---------|------|---------|
| Bist du sicher? — B2 | `/b2/` | ~1,000 words from *Sicher! B2* — flashcards, quizzes, audio (`sesler/`), progress tracking |
| Deutsch C1 Vokabeltrainer | `/c1/` | 1,505 C1 words in two modules (Vokabelliste 626 + Aspekte Neu C1 879) — flashcards, multiple choice, typing quiz, spaced repetition, audio |

A hub page at `/` links both levels. Both trainers run entirely client-side;
the FastAPI app only serves static files (HTML/CSS/JS/JSON/CSV and the shared
`sesler/` opus audio bank), so each trainer's relative `fetch()` paths resolve
unchanged under its mount prefix.

## Local development

```bash
pip install -e .
uvicorn germanhub.app:app --reload
```

## Deployment (Render)

Single web service defined in `render.yaml`:

- build: `pip install -e .`
- start: `uvicorn germanhub.app:app --host 0.0.0.0 --port $PORT`

## Repository layout

```
apps/b2/          vendored B2 trainer (index.html, script.js, style.css, modul1*.json, sicher.csv, sesler/)
apps/c1/          vendored C1 trainer (index.html, vokabelliste.html, app.js, aspekt-neu.html, aspekt-neu.js, JSON data, sesler/)
src/site/         hub FastAPI app + static hub page
```

The C1 module's audio bank (`sesler/`, 662 opus files) is shared from the B2
lineage; both apps reference `sesler/<id>.opus` relative to their own root.
