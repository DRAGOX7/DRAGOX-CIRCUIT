"""Generate animated SVG text in Dragox Circuit for a GitHub profile README.

usage: python -P make_readme_svgs.py <repo root> <out dir>

GitHub READMEs can't load web fonts, so the text is drawn from the font's own centre lines
(public/dragox-specimen.json) and re-stroked at a weight that reads at README size. Every
file comes in a -dark and a -light variant, for a <picture> element with
prefers-color-scheme. All animation is CSS or SMIL inside the SVG and stops for reduced
motion.

Writes:
  name-{dark,light}.svg       "ABDULLAH ALJAFARI" drawing itself in, looped
  tagline-{dark,light}.svg    a role line with a weight wave travelling through it
  h-<slug>-{dark,light}.svg   section headings with a trace and a pulse running along it
  signoff-{dark,light}.svg    "SET IN DRAGOX CIRCUIT"
"""
import json
import sys
from pathlib import Path

ROOT, OUT = Path(sys.argv[1]), Path(sys.argv[2])
OUT.mkdir(parents=True, exist_ok=True)
DATA = json.loads((ROOT / "public" / "dragox-specimen.json").read_text(encoding="utf-8"))
GLYPHS = {g["name"]: g for g in DATA["glyphs"]}
KERN = {(a, b): v for a, b, v in DATA["kern"]}
ASC = DATA["metrics"]["ascent"]
CAP = DATA["metrics"]["capHeight"]
SPACE = DATA["metrics"]["space"]
NAMES = {
    " ": None, "·": "periodcentered", "&": "ampersand", ".": "period", "-": "hyphen", "/": "slash",
    "0": "zero", "1": "one", "2": "two", "3": "three", "4": "four",
    "5": "five", "6": "six", "7": "seven", "8": "eight", "9": "nine",
}
THEMES = {"dark": "#2dd4bf", "light": "#0f766e"}
MUTED = {"dark": "#2dd4bf", "light": "#0f766e"}
PAD = 60  # font units around the drawing so heavy strokes and nodes aren't clipped


def layout(text, stub_free=False, space=1.0):
    """[(glyph or None for space, x)], total advance. `space` scales the word space."""
    out, x, prev = [], 0, None
    for ch in text:
        name = NAMES.get(ch, ch)
        if name is None:
            out.append((None, x))
            x += round(SPACE * space)
            prev = None
            continue
        g = GLYPHS[name]
        if prev:
            x += KERN.get((prev, name), 0)
        shape = g.get("ss01", g) if stub_free else g
        out.append((shape, x))
        x += shape["adv"]
        prev = name
    return out, x


def path_d(lines, dx, top):
    """One compact path: absolute move per line, then relative steps."""
    d = []
    for flat in lines:
        px, py = flat[0] + dx, top - flat[1]
        seg = [f"M{px} {py}l"]
        for i in range(2, len(flat), 2):
            x, y = flat[i] + dx, top - flat[i + 1]
            sx, sy = x - px, y - py
            seg.append(f"{' ' if i > 2 and sx >= 0 else ''}{sx}{' ' if sy >= 0 else ''}{sy}")
            px, py = x, y
        d.append("".join(seg))
    return "".join(d)


def dots(shape, dx, top, r):
    pts = shape["dots"]
    return "".join(f'<circle cx="{pts[i] + dx}" cy="{top - pts[i + 1]}" r="{r}"/>' for i in range(0, len(pts), 2))


def svg(width_units, height_units, px_width, title, body, style):
    px_height = round(px_width * height_units / width_units)
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{-PAD} {-PAD} {width_units + 2 * PAD} {height_units + 2 * PAD}" '
        f'width="{px_width}" height="{px_height}" role="img" aria-label="{title}">'
        f"<title>{title}</title><style>{style}</style>{body}</svg>"
    )


def write(name, theme, content):
    (OUT / f"{name}-{theme}.svg").write_text(content, encoding="utf-8")


# 1. Name: traces draw in letter by letter, nodes pop, hold, fade, repeat (9 s loop).
def make_name(theme, text="ABDULLAH ALJAFARI", stroke=17, dot=25, px=720):
    color = THEMES[theme]
    placed, width = layout(text, space=1.8)
    top = CAP
    groups = []
    n = 0
    for shape, x in placed:
        if shape is None:
            continue
        delay = n * 0.11
        n += 1
        groups.append(
            f'<g style="--d:{delay:.2f}s"><path pathLength="1" d="{path_d(shape["lines"], x, top)}"/>'
            f'<g class="n">{dots(shape, x, top, dot)}</g></g>'
        )
    style = (
        f"path{{fill:none;stroke:{color};stroke-width:{stroke};stroke-linecap:round;stroke-linejoin:round;"
        "stroke-dasharray:1;stroke-dashoffset:1;animation:draw 9s cubic-bezier(.65,0,.35,1) var(--d) infinite}"
        f".n circle{{fill:{color};transform-box:fill-box;transform-origin:center;transform:scale(0);"
        "animation:pop 9s ease var(--d) infinite}"
        "@keyframes draw{0%{stroke-dashoffset:1;opacity:1}16%{stroke-dashoffset:0}86%{stroke-dashoffset:0;opacity:1}"
        "94%,100%{stroke-dashoffset:0;opacity:0}}"
        "@keyframes pop{0%,12%{transform:scale(0);opacity:1}17%{transform:scale(1.25)}20%,86%{transform:scale(1);opacity:1}"
        "94%,100%{transform:scale(1);opacity:0}}"
        "@media (prefers-reduced-motion:reduce){path{animation:none;stroke-dashoffset:0}.n circle{animation:none;transform:none}}"
    )
    write("name", theme, svg(width, CAP, px, "Abdullah AlJafari", "".join(groups), style))


# 2. Tagline: every letter's line weight rises and falls on a wave travelling left to right.
def make_tagline(theme, text="AI ENGINEER · COMPUTER VISION · MLOPS · ARABIC NLP", base=19, px=840):
    color = THEMES[theme]
    placed, width = layout(text, stub_free=True, space=2.2)
    top = CAP
    groups = []
    i = 0
    for shape, x in placed:
        if shape is None:
            continue
        groups.append(
            f'<g style="animation-delay:{-2.6 + i * 0.09:.2f}s"><path d="{path_d(shape["lines"], x, top)}"/>'
            f"{dots(shape, x, top, 24)}</g>"
        )
        i += 1
    style = (
        f"g{{fill:none;stroke:{color};stroke-width:{base};stroke-linecap:round;stroke-linejoin:round;"
        "animation:wave 2.6s ease-in-out infinite}"
        f"circle{{fill:{color};stroke:none}}"
        f"@keyframes wave{{0%,100%{{stroke-width:{round(base * 0.6)}}}50%{{stroke-width:{round(base * 1.7)}}}}}"
        "@media (prefers-reduced-motion:reduce){g{animation:none}}"
    )
    write("tagline", theme, svg(width, CAP, px, text.title(), "".join(groups), style))


# 3. Section heading: the word, then a trace to a node, with a pulse running along it.
def make_heading(theme, text, stroke=24, dot=30, cap_px=26, trace_units=6000):
    color = THEMES[theme]
    placed, width = layout(text, space=1.8)
    top = CAP
    letters = "".join(
        f'<path d="{path_d(s["lines"], x, top)}"/>{dots(s, x, top, dot)}' for s, x in placed if s is not None
    )
    y = round(CAP * 0.5)
    x0 = width + 160
    x1 = x0 + trace_units
    total = x1 + dot
    trace = (
        f'<line class="t" x1="{x0}" y1="{y}" x2="{x1}" y2="{y}"/>'
        f'<circle cx="{x1}" cy="{y}" r="{dot}"/><circle class="ring" cx="{x1}" cy="{y}" r="{dot * 2.2:.0f}"/>'
        f'<circle class="pulse" cx="{x0}" cy="{y}" r="{dot * 0.8:.0f}">'
        f'<animate attributeName="cx" values="{x0};{x1}" dur="3.2s" repeatCount="indefinite" '
        'calcMode="spline" keySplines=".65 0 .35 1"/>'
        '<animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.1;.85;1" dur="3.2s" repeatCount="indefinite"/>'
        "</circle>"
    )
    style = (
        f"path{{fill:none;stroke:{color};stroke-width:{stroke};stroke-linecap:round;stroke-linejoin:round}}"
        f"circle{{fill:{color}}}.t{{stroke:{color};stroke-width:{round(stroke * 0.5)};opacity:.45}}"
        f".ring{{fill:none;stroke:{color};stroke-width:{round(stroke * 0.4)};opacity:.4}}"
        "@media (prefers-reduced-motion:reduce){.pulse{display:none}}"
    )
    px = round(total / CAP * cap_px)
    slug = text.lower().replace(" ", "-")
    write(f"h-{slug}", theme, svg(total, CAP, px, text.title(), letters + trace, style))


# 4. Sign-off line, stub-free so it stays calm at small size.
def make_signoff(theme, text="SET IN DRAGOX CIRCUIT", stroke=40, cap_px=18):
    color = MUTED[theme]
    placed, width = layout(text, stub_free=True, space=2)
    top = CAP
    body = "".join(f'<path d="{path_d(s["lines"], x, top)}"/>{dots(s, x, top, 44)}' for s, x in placed if s is not None)
    style = (
        f"path{{fill:none;stroke:{color};stroke-width:{stroke};stroke-linecap:round;stroke-linejoin:round}}"
        f"circle{{fill:{color}}}"
    )
    write("signoff", theme, svg(width, CAP, round(width / CAP * cap_px), "Set in Dragox Circuit", body, style))


for theme in THEMES:
    make_name(theme)
    make_tagline(theme)
    for heading in ("ABOUT", "FEATURED PROJECTS", "SKILLS", "GITHUB STATS", "CONTACT"):
        make_heading(theme, heading)
    make_signoff(theme)

for f in sorted(OUT.glob("*.svg")):
    print(f"{f.name:32} {f.stat().st_size / 1024:6.1f} KB")
