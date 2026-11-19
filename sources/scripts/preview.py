"""preview.py font.ttf CHARS out.html [cols] -- big per-glyph SVG previews with baseline/cap guides."""
import sys; sys.path.insert(0, '.')
from fontTools.ttLib import TTFont
from glyphgeo import to_geom, polys_of
font, chars, out = sys.argv[1:4]
cols = int(sys.argv[4]) if len(sys.argv) > 4 else 4
f = TTFont(font); cm = f.getBestCmap(); hm = f['hmtx']
cap = getattr(f['OS/2'], 'sCapHeight', 700) or 700
cells = []
for ch in chars:
    n = cm.get(ord(ch))
    if not n: cells.append(f'<div class=c><b>{ch} missing</b></div>'); continue
    g = to_geom(f, n); adv = hm[n][0]; d = ""
    for p in polys_of(g):
        for r in [p.exterior, *p.interiors]:
            d += "M" + " L".join(f"{x:.0f},{-y:.0f}" for x, y in r.coords) + "Z "
    cells.append(f'<div class=c><svg viewBox="-60 -900 {adv+120} 1100"><rect x="0" y="-900" width="{adv}" height="1100" fill="none" stroke="#2a3638" stroke-dasharray="8 8" stroke-width="3"/>'
                 f'<line x1="-60" x2="{adv+60}" y1="0" y2="0" stroke="#e2a03f" stroke-width="3"/><line x1="-60" x2="{adv+60}" y1="{-cap}" y2="{-cap}" stroke="#5aa9e6" stroke-width="3"/>'
                 f'<path d="{d}" fill="#19b39a" fill-rule="evenodd"/></svg><b>{ch} · {n} · adv {adv}</b></div>')
open(out, 'w', encoding='utf-8').write(f'<!doctype html><meta charset=utf-8><title>preview</title><style>body{{background:#07090a;color:#7d8f8c;font:12px Consolas;margin:12px}}.g{{display:grid;grid-template-columns:repeat({cols},1fr);gap:10px}}.c{{background:#0e1213;border:1px solid #1d2729;border-radius:8px;padding:6px}}svg{{width:100%;height:auto;display:block}}</style><div class=g>{"".join(cells)}</div>')
