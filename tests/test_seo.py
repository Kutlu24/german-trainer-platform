from fastapi.testclient import TestClient

from germanhub.app import app

client = TestClient(app)


def test_robots_and_sitemap():
    assert "Sitemap: http://testserver/sitemap.xml" in client.get("/robots.txt").text
    assert "<loc>http://testserver/grammatik/a1.html</loc>" in client.get("/sitemap.xml").text
    assert "Grammatik" in client.get("/llms.txt").text


def test_pages_get_head_tags_once_and_https_behind_proxy():
    for path in ("/", "/b2/", "/c1/", "/grammatik/", "/grammatik/b2.html", "/schreiben/ui/"):
        r = client.get(path, headers={"x-forwarded-host": "demo.onrender.com", "x-forwarded-proto": "http"})
        if r.status_code == 404 and path.startswith("/schreiben"):
            continue  # essay tutor is optional: not mounted when its dependencies are missing
        t = r.text
        assert t.count('rel="canonical"') == 1 and t.count("application/ld+json") == 1
        if path != "/":  # the hub page ships its own fixed canonical
            assert f'href="https://demo.onrender.com{path}"' in t
