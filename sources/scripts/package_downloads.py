"""Package the Dragox Circuit fonts for download on the specimen page.

usage: python -P package_downloads.py <repo root>

Copies the built fonts from app/fonts into public/fonts/dragox-circuit/, writes the
copyright, license and URL into each copy's name table (the site's own copies in
app/fonts are left as they are), and bundles everything with OFL.txt into a zip.
"""
import shutil
import sys
import zipfile
from pathlib import Path

from fontTools.ttLib import TTFont

ROOT = Path(sys.argv[1])
SRC = ROOT / "app" / "fonts"
DST = ROOT / "public" / "fonts" / "dragox-circuit"
FONTS = ["DragoxCircuit-Regular", "DragoxCircuitClean-Regular"]
SITE = "https://www.abdullah-aljafari.me/lab/dragox-circuit"
NAMES = {
    0: 'Copyright (c) 2026, Abdullah AlJafari, with Reserved Font Name "Dragox Circuit".',
    13: "This Font Software is licensed under the SIL Open Font License, Version 1.1. "
        "This license is available with a FAQ at: https://openfontlicense.org",
    14: "https://openfontlicense.org",
    11: SITE,
}

DST.mkdir(parents=True, exist_ok=True)
files = []
for base in FONTS:
    for ext in ("ttf", "woff2"):
        src, out = SRC / f"{base}.{ext}", DST / f"{base}.{ext}"
        shutil.copyfile(src, out)
        f = TTFont(out)
        for nid, text in NAMES.items():
            f["name"].setName(text, nid, 3, 1, 0x409)
            f["name"].setName(text, nid, 1, 0, 0)
        f.save(out)
        files.append(out)
        print("wrote", out.name, out.stat().st_size)

zip_path = DST / "DragoxCircuit-2.000.zip"
with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as z:
    for p in files:
        z.write(p, f"DragoxCircuit-2.000/{p.name}")
    z.write(DST / "OFL.txt", "DragoxCircuit-2.000/OFL.txt")
print("wrote", zip_path.name, zip_path.stat().st_size)
