"""GEO/SEO helpers: robots.txt, sitemap.xml, llms.txt and per-page head tags.

Most AI crawlers do not run JavaScript, so title, description, canonical and JSON-LD are
injected into the served HTML (the vendored module sources stay untouched).
Set SITE_URL on Render to pin the public origin; otherwise it is derived from the request.
"""
from __future__ import annotations

import html
import json
import os

from fastapi import FastAPI, Request
from fastapi.responses import PlainTextResponse, Response

# path -> (title, description, schema.org type, language)
PAGES: dict[str, tuple[str, str, str, str]] = {
    "/": ("German Trainer Platform: B2, C1, Schreiben & Grammatik",
          "Four free exam-focused German tools: B2 and C1 vocabulary trainers, a grammar reference from A1 to C1 and an AI-assisted writing tutor.",
          "WebSite", "de"),
    "/b2/": ("Sicher! B2 Wortschatztrainer: Karteikarten und Quiz",
             "Free flashcard and quiz trainer for about 1,000 B2 German words from the Sicher! B2 course book, with example sentences and audio.",
             "LearningResource", "de"),
    "/c1/": ("Deutsch C1 Vokabeltrainer",
             "Interactive C1 German vocabulary trainer with 1,505 words in two modules (vocabulary list and Aspekte Neu), with pronunciation and grammar.",
             "LearningResource", "de"),
    "/c1/vokabelliste.html": ("C1 Vokabelliste mit Aussprache und Grammatik",
                              "Interactive list of 626 C1 German words with a focus on pronunciation and grammar.",
                              "LearningResource", "de"),
    "/c1/aspekt-neu.html": ("Aspekt Neu C1: mehrsprachiger Vokabeltrainer",
                            "Multilingual C1 German vocabulary trainer based on Aspekte Neu.", "LearningResource", "de"),
    "/grammatik/": ("DeutschGrammatikMeister: Deutsche Grammatik von A1 bis C1",
                    "Visual German grammar reference: 58 rules from A1 to C1 with explanations, examples, tables and exercises.",
                    "LearningResource", "de"),
    "/schreiben/ui/": ("Schreibwerkstatt: Deutsch-Aufsatz hochladen und bewerten lassen",
                       "Upload or write a German composition, pick an exam (telc, Goethe) and get grammar feedback and a CEFR level estimate.",
                       "WebApplication", "de"),
}
for _lvl in ("a1", "a2", "b1", "b2", "c1"):
    PAGES[f"/grammatik/{_lvl}.html"] = (
        f"Deutsche Grammatik {_lvl.upper()}: Regeln, Beispiele und Übungen",
        f"German grammar rules for level {_lvl.upper()} with explanations, examples and exercises with revealable solutions.",
        "LearningResource", "de")

_LOCAL = ("localhost", "127.0.0.1", "testserver")


def site_url(request: Request) -> str:
    env = os.environ.get("SITE_URL")
    if env:
        return env.rstrip("/")
    host = request.headers.get("x-forwarded-host") or request.url.netloc
    proto = request.headers.get("x-forwarded-proto") or request.url.scheme
    if not host.split(":")[0] in _LOCAL:
        proto = "https"
    return f"{proto}://{host}"


def head_tags(site: str, path: str, existing: str) -> str:
    title, desc, typ, lang = PAGES[path]
    url = site + path
    e = html.escape
    tags = []
    if 'name="description"' not in existing:
        tags.append(f'<meta name="description" content="{e(desc)}">')
    if 'rel="canonical"' not in existing:
        tags.append(f'<link rel="canonical" href="{url}">')
    if 'property="og:title"' not in existing:
        tags += [f'<meta property="og:title" content="{e(title)}">',
                 f'<meta property="og:description" content="{e(desc)}">',
                 '<meta property="og:type" content="website">', f'<meta property="og:url" content="{url}">']
    if "application/ld+json" not in existing:
        data = {"@context": "https://schema.org", "@type": typ, "name": title, "description": desc, "url": url,
                "inLanguage": lang, "isAccessibleForFree": True}
        tags.append('<script type="application/ld+json">' + json.dumps(data, ensure_ascii=False) + "</script>")
    return "\n".join(tags)


def install(app: FastAPI, disallow: tuple[str, ...] = ("/docs", "/openapi.json")) -> None:
    allow = ("OAI-SearchBot", "ChatGPT-User", "PerplexityBot", "Claude-SearchBot", "Claude-User")
    block = ("GPTBot", "ClaudeBot", "Google-Extended", "CCBot")

    @app.middleware("http")
    async def _seo_head(request: Request, call_next):
        response = await call_next(request)
        path = request.url.path
        if (request.method != "GET" or path not in PAGES or response.status_code != 200
                or "text/html" not in response.headers.get("content-type", "")):
            return response
        body = b"".join([chunk async for chunk in response.body_iterator]).decode("utf-8")
        head_end = body.find("</head>")
        if head_end != -1:
            body = body[:head_end] + head_tags(site_url(request), path, body[:head_end]) + "\n" + body[head_end:]
        headers = {k: v for k, v in response.headers.items() if k.lower() not in ("content-length", "content-encoding")}
        return Response(content=body, status_code=200, headers=headers, media_type="text/html")

    @app.get("/robots.txt", include_in_schema=False)
    def robots(request: Request) -> PlainTextResponse:
        lines = ["User-agent: *", "Allow: /", *[f"Disallow: {d}" for d in disallow], ""]
        for bot in allow:
            lines += [f"User-agent: {bot}", "Allow: /", ""]
        for bot in block:
            lines += [f"User-agent: {bot}", "Disallow: /", ""]
        lines.append(f"Sitemap: {site_url(request)}/sitemap.xml")
        return PlainTextResponse("\n".join(lines) + "\n")

    @app.get("/sitemap.xml", include_in_schema=False)
    def sitemap(request: Request) -> Response:
        site = site_url(request)
        urls = "".join(f"<url><loc>{site}{p}</loc></url>" for p in PAGES)
        return Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
                        + urls + "</urlset>", media_type="application/xml")

    @app.get("/llms.txt", include_in_schema=False)
    def llms(request: Request) -> PlainTextResponse:
        site = site_url(request)
        lines = ["# German Trainer Platform", "",
                 "> Free German exam-prep tools: B2 and C1 vocabulary trainers, a grammar reference (A1-C1) and a writing tutor.", ""]
        lines += [f"- [{t}]({site}{p}): {d}" for p, (t, d, _, _) in PAGES.items()]
        return PlainTextResponse("\n".join(lines) + "\n")
