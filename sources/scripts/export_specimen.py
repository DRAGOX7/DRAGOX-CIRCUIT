"""Export glyph data for the Dragox Circuit specimen site.

usage: python -P export_specimen.py <repo root> <scratch dir>

Rebuilds both fonts into <scratch dir> (the repo's font files are not touched) and
writes public/dragox-specimen.json with, for every glyph: its centre lines, its nodes,
its advance width, and its stub-free (.ss01) and Clean variants. Coordinates are font
units, y up, rounded to integers. Also exports the four tracing stages of one letter
for the "how it was made" strip.
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import build_font as bf  # noqa: E402
from glyphgeo import polys_of, to_geom  # noqa: E402
from fontTools.ttLib import TTFont  # noqa: E402

ROOT, SCRATCH = Path(sys.argv[1]), Path(sys.argv[2])
SCRATCH.mkdir(parents=True, exist_ok=True)
bf.SRC = ROOT / "sources" / "original" / "DragoxCircuit-v1.ttf"
bf.LOGO = ROOT / "sources" / "original" / "logo.png"
bf.OUT = SCRATCH
STAGE_LETTER = "R"


def flat(coords):
    """[(x, y), ...] -> [x0, y0, x1, y1, ...] as ints: compact and easy to turn into SVG."""
    return [round(v) for xy in coords for v in xy]


def shape(builder, name):
    lines, nodes = builder.store[name]
    return {
        "adv": builder.f["hmtx"][name][0],
        "lines": [flat(l.coords) for l in lines],
        "dots": flat(nodes),
    }


def group_of(name):
    if name == "A_J":
        return "ligature"
    if len(name) == 1 and name.isupper():
        return "capitals"
    if len(name) == 1 and name.islower():
        return "smallcaps"
    if name in bf.DIGITS:
        return "figures"
    return "punctuation"


def char_of(name):
    if name == "A_J":
        return "AJ"
    if len(name) == 1:
        return name
    return chr(bf.CODES[name])


def main():
    display = bf.Builder(clean=False).build()
    clean = bf.Builder(clean=True).build()

    glyphs = []
    for name in display.store:
        if name.endswith(".ss01"):
            continue
        entry = {
            "name": name,
            "char": char_of(name),
            "code": None if name == "A_J" else ord(char_of(name)),
            "group": group_of(name),
            **shape(display, name),
        }
        if name + ".ss01" in display.store:
            entry["ss01"] = shape(display, name + ".ss01")
        if name in clean.store:
            entry["clean"] = shape(clean, name)
        glyphs.append(entry)

    # Tracing stages for one letter, each in its own coordinate space (source font units).
    src = TTFont(bf.SRC)
    geom = to_geom(src, STAGE_LETTER)
    rings = []
    for p in polys_of(geom):
        rings.append(flat(p.exterior.coords))
        rings += [flat(r.coords) for r in p.interiors]
    raw_lines, raw_nodes = bf.trace_glyph(geom, 0, 0)
    pruned_lines, pruned_nodes = bf.trace_glyph(geom, 45, 60)
    stages = {
        "letter": STAGE_LETTER,
        "outline": rings,
        "skeleton": {"lines": [flat(l.coords) for l in raw_lines], "dots": flat(raw_nodes)},
        "pruned": {"lines": [flat(l.coords) for l in pruned_lines], "dots": flat(pruned_nodes)},
        "final": shape(display, STAGE_LETTER),
    }

    data = {
        "family": "Dragox Circuit",
        "version": "2.000",
        "metrics": {
            "unitsPerEm": display.f["head"].unitsPerEm,
            "ascent": round(bf.CAP * 1.15),
            "descent": -round(bf.CAP * 0.3),
            "capHeight": bf.CAP,
            "smallCapHeight": round(bf.CAP * bf.SC),
            "overshoot": bf.OVER,
            "space": round(bf.CAP * 0.36),
        },
        "stroke": {"display": bf.LINE, "clean": bf.CLEAN_LINE, "dot": bf.DOT},
        "kern": [[a, b, v] for (a, b), v in bf.KERN.items()],
        "glyphs": glyphs,
        "stages": stages,
    }
    out = ROOT / "public" / "dragox-specimen.json"
    out.write_text(json.dumps(data, separators=(",", ":")), encoding="utf-8")
    print("specimen", out, "glyphs", len(glyphs), "bytes", out.stat().st_size)


if __name__ == "__main__":
    main()
