# German Trainer Platform

Four exam-focused German tools under one FastAPI application:

| Tool | Path | Content |
|------|------|---------|
| Bist du sicher? — B2 | `/b2/` | 662 words from *Sicher! B2* — flashcards, multiple choice, audio (`sesler/`), progress tracking |
| Deutsch C1 Vokabeltrainer | `/c1/` | 1,505 C1 words in two modules (Vokabelliste 626 + Aspekte Neu C1 879) — flashcards, multiple choice, typing quiz, spaced repetition, daily goals, audio |
| Essay Tutor | `/essay/` | Upload a handwritten or typed German essay → OCR → corrected text, grammar notes, CEFR score (needs `GLM_API_KEY` / `GEMINI_API_KEY`; the rest of the platform runs without keys) |
| DeutschGrammatikMeister | `/grammatik/` | Compact A1–C1 grammar reference: nouns, verbs, adjectives in German, exercises, glossary |

The hub at `/` links all four. With JavaScript and WebGL it renders as a
full-screen slider stage (one procedural shader per tool); without them it
falls back to the classic hero + card grid. The interface is available in
eight languages (EN, DE, TR, ZH, FA, HY, KU, UK), with RTL for Persian.

The three static trainers run entirely client-side — FastAPI only serves their
files (HTML/CSS/JS/JSON/CSV and the shared `sesler/` opus audio bank), so each
trainer's relative `fetch()` paths resolve unchanged under its mount prefix.
The Essay Tutor is a second FastAPI app mounted in-process under `/essay`; its
absolute `fetch('/api/...')` calls are rewritten once by a shim relative to
`/essay`.

## Local development

```bash
pip install -e .
uvicorn germanhub.app:app --reload
```

Optional (only for `/essay`): `GLM_API_KEY` (grading + OCR) and
`GEMINI_API_KEY` (handwriting OCR).

## Deployment (Render)

Single web service defined in `render.yaml`:

- build: `pip install -e .`
- start: `uvicorn germanhub.app:app --host 0.0.0.0 --port $PORT`

## Repository layout

```
apps/b2/          vendored B2 trainer (index.html, script.js, style.css, modul1*.json, sicher.csv, sesler/)
apps/c1/          vendored C1 trainer (index.html, vokabelliste.html, app.js, aspekt-neu.html, aspekt-neu.js, JSON data, sesler/)
apps/grammatik/   grammar reference site (index.html, style.css)
src/germanhub/    hub FastAPI app + static hub page (static/index.html, stage.js, stage-art.js, stage.css, style.css)
src/essay_tutor/  Essay Tutor, vendored from the my-essay-tutor repo (hub prefers it, falls back to the installed package)
```

The C1 module's audio bank (`sesler/`, 662 opus files) is shared from the B2
lineage; both apps reference `sesler/<id>.opus` relative to their own root.

`?classic` on the hub URL skips the WebGL stage and shows the classic page;
the `<link rel="canonical">` keeps that variant from being indexed twice.
