"""Convert TrueType glyphs <-> shapely geometry so outlines can be offset, filled and redrawn."""
from functools import reduce
from fontTools.pens.basePen import BasePen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from shapely.geometry import Polygon, MultiPolygon, GeometryCollection
from shapely.geometry.polygon import orient
from shapely import affinity
from shapely.validation import make_valid


class PolyPen(BasePen):
    """Flattens a glyph into closed point rings."""

    def __init__(self, glyphSet, step=4.0):
        super().__init__(glyphSet)
        self.rings, self.cur, self.step = [], [], step

    def _moveTo(self, p):
        self.cur = [p]

    def _lineTo(self, p):
        self.cur.append(p)

    def _qCurveToOne(self, p1, p2):
        p0 = self.cur[-1]
        n = max(2, int((abs(p2[0] - p0[0]) + abs(p2[1] - p0[1])) / self.step))
        for i in range(1, n + 1):
            t = i / n
            a, b, c = (1 - t) ** 2, 2 * (1 - t) * t, t * t
            self.cur.append((a * p0[0] + b * p1[0] + c * p2[0], a * p0[1] + b * p1[1] + c * p2[1]))

    def _curveToOne(self, p1, p2, p3):
        p0 = self.cur[-1]
        n = max(2, int((abs(p3[0] - p0[0]) + abs(p3[1] - p0[1])) / self.step))
        for i in range(1, n + 1):
            t = i / n
            a, b, c, d = (1 - t) ** 3, 3 * (1 - t) ** 2 * t, 3 * (1 - t) * t * t, t ** 3
            self.cur.append(tuple(a * p0[k] + b * p1[k] + c * p2[k] + d * p3[k] for k in (0, 1)))

    def _closePath(self):
        if len(self.cur) >= 3:
            self.rings.append(self.cur)
        self.cur = []

    _endPath = _closePath


def to_geom(font, name):
    gs = font.getGlyphSet()
    pen = PolyPen(gs)
    gs[name].draw(pen)
    polys = [make_valid(Polygon(r)) for r in pen.rings]
    if not polys:
        return Polygon()
    # contours don't overlap, so even-odd (symmetric difference) reproduces the fill exactly
    return make_valid(reduce(lambda a, b: a.symmetric_difference(b), polys))


def polys_of(geom):
    if isinstance(geom, Polygon):
        return [geom] if not geom.is_empty else []
    if isinstance(geom, (MultiPolygon, GeometryCollection)):
        out = []
        for g in geom.geoms:
            out += polys_of(g)
        return out
    return []


def from_geom(font, name, geom, simplify=0.6):
    pen = TTGlyphPen(None)
    for p in polys_of(geom.simplify(simplify, preserve_topology=True)):
        if p.area < 4:
            continue
        p = orient(p, sign=-1.0)  # TrueType: outer clockwise, holes counter-clockwise
        for ring in [p.exterior, *p.interiors]:
            pts = [(round(x), round(y)) for x, y in list(ring.coords)[:-1]]
            dedup = [pt for i, pt in enumerate(pts) if pt != pts[i - 1]]
            if len(dedup) < 3:
                continue
            pen.moveTo(dedup[0])
            for pt in dedup[1:]:
                pen.lineTo(pt)
            pen.closePath()
    g = pen.glyph()
    font["glyf"][name] = g
    g.recalcBounds(font["glyf"])
    return g


def line_width(geom):
    """Average stroke width of thin line art: area / half the perimeter."""
    return 2 * geom.area / geom.length if geom.length else 0


def offset(geom, d):
    return make_valid(geom.buffer(d, join_style="mitre", mitre_limit=3.0, quad_segs=6))


def scale(geom, sx, sy, origin=(0, 0)):
    return affinity.scale(geom, sx, sy, origin=origin)
