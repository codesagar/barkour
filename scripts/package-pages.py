#!/usr/bin/env python3
"""Package the static game without source art, experiments, or review recordings."""
import re
import shutil
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "build" / "pages"


class Dependencies(HTMLParser):
    def __init__(self):
        super().__init__()
        self.paths = {"index.html"}

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        value = attrs.get("src") if tag == "script" else (
            attrs.get("href") if tag == "link" and attrs.get("rel") == "stylesheet" else None
        )
        if value:
            self.paths.add(urlsplit(value).path)


dependencies = Dependencies()
dependencies.feed((ROOT / "index.html").read_text())
dependencies.paths.update(re.findall(
    r'"sheet"\s*:\s*"([^"]+)"',
    (ROOT / "js" / "character-assets.js").read_text(),
))
for name in dependencies.paths:
    source = (ROOT / name).resolve()
    if not source.is_relative_to(ROOT) or not source.is_file():
        raise ValueError(f"Missing or invalid game dependency: {name}")

if OUTPUT.exists():
    shutil.rmtree(OUTPUT)
for name in sorted(dependencies.paths):
    destination = OUTPUT / name
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(ROOT / name, destination)
(OUTPUT / ".nojekyll").touch()
size = sum(path.stat().st_size for path in OUTPUT.rglob("*") if path.is_file())
print(f"Packaged {len(dependencies.paths) + 1} files ({size / 1024 / 1024:.2f} MiB) into {OUTPUT}")
