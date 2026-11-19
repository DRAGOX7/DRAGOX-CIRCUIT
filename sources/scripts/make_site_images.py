"""Generate the specimen site's favicon and link-preview image.

usage: python -P make_site_images.py <repo root>

Writes:
  app/icon.svg               favicon: the letter D drawn from its circuit traces
  app/apple-icon.png         180x180 home-screen icon
  app/opengraph-image.png    1200x630 link preview (also copied to twitter-image.png)
"""
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(sys.argv[1])
APP = ROOT / "app"
DATA = json.loads((ROOT / "public" / "dragox-specimen.json").read_text(encoding="utf-8"))
FONTS = ROOT / "public" / "fonts" / "dragox-circuit"
TEAL, BG, MUTED = "#2dd4bf", "#030505", "#8a9a9a"
glyph = next(g for g in DATA["glyphs"] if g["name"] == "D")
STROKE, DOT = DATA["stroke"]["display"] * 3, DATA["stroke"]["dot"] * 2.2


def bounds():
    xs = [v for line in glyph["lines"] for v in line[0::2]]
    ys = [v for line in glyph["lines"] for v in line[1::2]]
    return min(xs), min(ys), max(xs), max(ys)


def icon_svg(path):
    x0, y0, x1, y1 = bounds()
    size = max(x1 - x0, y1 - y0) * 1.5
    ox, oy = (size - (x1 - x0)) / 2 - x0, (size - (y1 - y0)) / 2 + y1
    paths = []
    for line in glyph["lines"]:
        pts = [f"{line[i] + ox:.0f} {oy - line[i + 1]:.0f}" for i in range(0, len(line), 2)]
        paths.append("M" + " L".join(pts))
    dots = "".join(
        f'<circle cx="{glyph["dots"][i] + ox:.0f}" cy="{oy - glyph["dots"][i + 1]:.0f}" r="{DOT:.0f}"/>'
        for i in range(0, len(glyph["dots"]), 2)
    )
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size:.0f} {size:.0f}">'
        f'<rect width="100%" height="100%" rx="{size * 0.22:.0f}" fill="{BG}"/>'
        f'<path d="{" ".join(paths)}" fill="none" stroke="{TEAL}" stroke-width="{STROKE:.0f}" '
        f'stroke-linecap="round" stroke-linejoin="round"/><g fill="{TEAL}">{dots}</g></svg>'
    )
    path.write_text(svg, encoding="utf-8")


def icon_png(px, path):
    ss = 4
    img = Image.new("RGB", (px * ss, px * ss), BG)
    d = ImageDraw.Draw(img)
    x0, y0, x1, y1 = bounds()
    k = px * ss * 0.62 / max(x1 - x0, y1 - y0)
    ox = (px * ss - (x1 - x0) * k) / 2 - x0 * k
    oy = (px * ss + (y1 - y0) * k) / 2 + y0 * k
    to = lambda x, y: (x * k + ox, oy - y * k)  # noqa: E731
    w = max(2, round(STROKE * k))
    for line in glyph["lines"]:
        pts = [to(line[i], line[i + 1]) for i in range(0, len(line), 2)]
        d.line(pts, fill=TEAL, width=w, joint="curve")
        for p in (pts[0], pts[-1]):
            d.ellipse([p[0] - w / 2, p[1] - w / 2, p[0] + w / 2, p[1] + w / 2], fill=TEAL)
    r = DOT * k
    for i in range(0, len(glyph["dots"]), 2):
        cx, cy = to(glyph["dots"][i], glyph["dots"][i + 1])
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=TEAL)
    img.resize((px, px), Image.LANCZOS).save(path, optimize=True)


def og_image(path):
    W, H, ss = 1200, 630, 2
    img = Image.new("RGB", (W * ss, H * ss), BG)
    d = ImageDraw.Draw(img)
    display = ImageFont.truetype(str(FONTS / "DragoxCircuit-Regular.ttf"), 150 * ss)
    clean = ImageFont.truetype(str(FONTS / "DragoxCircuitClean-Regular.ttf"), 34 * ss)
    mono = ImageFont.truetype(str(FONTS / "DragoxCircuitClean-Regular.ttf"), 24 * ss)
    # faint circuit grid
    for gx in range(0, W * ss, 60 * ss):
        d.line([(gx, 0), (gx, H * ss)], fill="#0a1212", width=ss)
    for gy in range(0, H * ss, 60 * ss):
        d.line([(0, gy), (W * ss, gy)], fill="#0a1212", width=ss)
    x = 80 * ss
    d.text((x, 92 * ss), "TYPEFACE  ·  V2.000  ·  OFL 1.1", font=mono, fill=TEAL)
    d.text((x, 150 * ss), "DRAGOX", font=display, fill=TEAL)
    d.text((x, 300 * ss), "CIRCUIT", font=display, fill=TEAL)
    d.text((x, 478 * ss), "free circuit-trace display typeface", font=clean, fill="#d7e2e0")
    d.text((x, 530 * ss), "by abdullah aljafari", font=clean, fill=MUTED)
    img.resize((W, H), Image.LANCZOS).save(path, optimize=True)


icon_svg(APP / "icon.svg")
icon_png(180, APP / "apple-icon.png")
og_image(APP / "opengraph-image.png")
alt = "Dragox Circuit: a free circuit-trace display typeface by Abdullah AlJafari"
(APP / "opengraph-image.alt.txt").write_text(alt, encoding="utf-8")
for ext in ("png", "alt.txt"):
    (APP / f"twitter-image.{ext}").write_bytes((APP / f"opengraph-image.{ext}").read_bytes())
print("site images written to", APP)
