#!/usr/bin/env python3
"""Refresh local asset URLs after editing runtime code; no build or dependencies."""
from pathlib import Path
import hashlib,re
root=Path(__file__).resolve().parent.parent
p=root/'index.html'
s=p.read_text()
s=re.sub(r'(?:js/[a-z-]+\.js|css/style\.css)(?:\?v=[^\"]+)?',lambda m: (name:=m[0].split('?')[0])+'?v='+hashlib.sha256((root/name).read_bytes()).hexdigest()[:12],s)
p.write_text(s)
