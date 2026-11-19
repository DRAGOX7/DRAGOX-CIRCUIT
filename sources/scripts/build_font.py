"""Build Dragox Circuit 2.0 (display) and Dragox Circuit Clean 2.0 (small sizes).

usage: python build_font.py original.ttf logo.png out_dir [signature text]

Every glyph is rebuilt from centre lines: the hand-traced original letters are traced
to a line network, then redrawn with one even line width, with dots on the outer
silhouette (outside corners and stub ends) only. Digits, punctuation and the AJ monogram are drawn the same way.

Display font features:
  default  letters with their circuit stubs
  ss01     same letters without stubs        (font-feature-settings: "ss01")
  dlig     A + J -> AJ monogram from the logo (font-feature-settings: "dlig")
  smcp-style lowercase: a-z are small capitals
Clean font: stub-free lines, heavier weight, no dots, hinted for 12-24px text.
"""
import json
import math
import sys
from pathlib import Path
from statistics import median

import numpy as np
from fontTools.feaLib.builder import addOpenTypeFeaturesFromString
from fontTools.ttLib import TTFont
from shapely import affinity
from shapely.geometry import LineString, MultiLineString, Point, Polygon
from shapely.ops import unary_union
from skan import Skeleton, summarize
from skimage.draw import polygon as fill_poly
from skimage.io import imread
from skimage.morphology import skeletonize

sys.path.insert(0, str(Path(__file__).parent))
from glyphgeo import from_geom, polys_of, to_geom  # noqa: E402

if __name__ == "__main__":
    SRC, LOGO, OUT = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3])
    SIGNATURE = sys.argv[4] if len(sys.argv) > 4 else "ABDULLAH ALJAFARI"
UP = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
ROUND = set("CGOQS")
CAP = 739
OVER = 9
SC = 0.78                 # small-cap height / cap height
LINE, DOT = 13.0, 21.0    # display line width, dot radius
CLEAN_LINE = 24.0
T = 64.0                  # gap between paired outline lines in drawn glyphs
XS = {"W": 1.08, "M": 1.068}  # horizontal scale for letters that needed height correction
SIDES = {
    "A": (.1, .1), "B": (1, .6), "C": (.6, .35), "D": (1, .6), "E": (1, .4), "F": (1, .25),
    "G": (.6, .7), "H": (1, 1), "I": (1, 1), "J": (.35, 1), "K": (1, .25), "L": (1, .25),
    "M": (1, 1), "N": (1, 1), "O": (.6, .6), "P": (1, .5), "Q": (.6, .6), "R": (1, .2),
    "S": (.55, .55), "T": (.25, .25), "U": (.9, .9), "V": (.1, .1), "W": (.1, .1),
    "X": (.15, .15), "Y": (.1, .1), "Z": (.4, .4),
}
KERN = {
    ("A", "V"): -36, ("A", "W"): -30, ("A", "Y"): -36, ("A", "T"): -27, ("A", "J"): 6,
    ("V", "A"): -36, ("W", "A"): -30, ("Y", "A"): -36, ("T", "A"): -27,
    ("L", "T"): -42, ("L", "V"): -36, ("L", "W"): -30, ("L", "Y"): -42,
    ("T", "O"): -12, ("O", "T"): -12, ("V", "O"): -12, ("O", "V"): -12,
    ("Y", "O"): -15, ("O", "Y"): -15, ("F", "A"): -24, ("P", "A"): -24,
    ("R", "V"): -12, ("R", "Y"): -15, ("R", "T"): -9,
}


# =============================================================== centre-line tracing
def trace(img, to_units, stub_len, detached_len, rounds=6):
    """Skeletonise a binary image; prune dead ends shorter than stub_len and detached
    pieces shorter than detached_len (both in image pixels). Returns lines and nodes."""
    sk = skeletonize(img)
    for _ in range(rounds):
        if sk.sum() < 3:
            break
        s = Skeleton(sk)
        df = summarize(s, separator="_")
        drop = df[((df["branch_type"] == 1) & (df["branch_distance"] < stub_len))
                  | ((df["branch_type"] == 0) & (df["branch_distance"] < detached_len))].index
        if len(drop) == 0:
            break
        for i in drop:
            for nid in s.path(i):
                if s.degrees[nid] < 3:
                    r, c = s.coordinates[nid].astype(int)
                    sk[r, c] = False
        sk = skeletonize(sk)
    if sk.sum() < 3:
        return [], []
    s = Skeleton(sk)
    lines, nodes = [], []
    for i in range(s.n_paths):
        ids = s.path(i)
        pts = [to_units(*s.coordinates[n]) for n in ids]
        if len(pts) >= 2:
            ls = LineString(pts).simplify(3.0)
            if ls.length > 6:
                lines.append(ls)
        for n in (ids[0], ids[-1]):
            if s.degrees[n] != 2:
                nodes.append(to_units(*s.coordinates[n]))
    return lines, cluster(nodes, 26)


def cluster(pts, d):
    out = []
    for p in pts:
        for i, q in enumerate(out):
            if math.dist(p, q[0]) < d:
                q[1].append(p)
                break
        else:
            out.append((p, [p]))
    return [(sum(x for x, _ in g) / len(g), sum(y for _, y in g) / len(g)) for _, g in out]


R = 2.0  # raster pixels per font unit for glyph tracing


def trace_glyph(geom, stub_units, detached_units):
    minx, miny, maxx, maxy = geom.bounds
    pad = 10
    W, H = int((maxx - minx) * R) + 2 * pad, int((maxy - miny) * R) + 2 * pad
    img = np.zeros((H, W), bool)
    for p in polys_of(geom):
        for ring, val in [(p.exterior, True)] + [(r, False) for r in p.interiors]:
            xs, ys = np.array(ring.coords).T
            rr, cc = fill_poly(H - ((ys - miny) * R + pad), (xs - minx) * R + pad, img.shape)
            img[rr, cc] = val
    return trace(img, lambda r, c: ((c - pad) / R + minx, (H - r - pad) / R + miny), stub_units * R, detached_units * R)


def trace_logo(path):
    im = imread(path)
    mask = im[..., 3] > 128 if im.shape[-1] == 4 else im[..., :3].mean(-1) < 128
    H = mask.shape[0]
    return trace(mask, lambda r, c: (float(c), float(H - r)), 12, 30)


# =============================================================== drawing
def render(lines, nodes, width, dot):
    parts = [l.buffer(width / 2, cap_style="round", join_style="round", quad_segs=6) for l in lines]
    if dot:
        parts += [Point(n).buffer(dot, quad_segs=8) for n in nodes]
    return unary_union(parts)


def edge_nodes(lines, nodes, width, reach=20):
    """Keep only dots that sit on the letter's outer silhouette (outside corners and stub
    ends). Dots inside the shape crowd the counters and blur the letterform."""
    ink = unary_union([l.buffer(width / 2, quad_segs=4) for l in lines])
    outline = unary_union([Polygon(p.exterior) for p in polys_of(ink)]).boundary
    return [n for n in nodes if outline.distance(Point(n)) < reach]


def tf(lines, nodes, fn):
    """Apply an affine function (shapely-style kwargs) to lines and nodes."""
    L = [fn(l) for l in lines]
    N = [tuple(fn(Point(n)).coords[0]) for n in nodes]
    return L, N


def scale(lines, nodes, sx, sy, origin=(0, 0)):
    return tf(lines, nodes, lambda g: affinity.scale(g, sx, sy, origin=origin))


def shift(lines, nodes, dx, dy):
    return tf(lines, nodes, lambda g: affinity.translate(g, dx, dy))


def line_bounds(lines):
    return MultiLineString([list(l.coords) for l in lines]).bounds


# =============================================================== new characters (centre lines)
def ellipse(cx, cy, rx, ry, a0=0, a1=360, n=48):
    return [(cx + rx * math.cos(math.radians(a0 + (a1 - a0) * i / n)),
             cy + ry * math.sin(math.radians(a0 + (a1 - a0) * i / n))) for i in range(n + 1)]


def drawn_paths():
    mid = 369.5
    d = {
        "zero": [ellipse(250, mid, 218, 337.5)],
        "one": [[(120, 560), (260, 707), (260, 32)], [(120, 32), (400, 32)]],
        "two": [[(40, 560), (90, 670), (250, 707), (410, 670), (460, 560), (440, 450), (40, 32), (468, 32)]],
        "three": [[(40, 640), (150, 707), (360, 707), (450, 620), (440, 470), (330, 390), (190, 390)],
                  [(330, 390), (450, 300), (460, 150), (380, 40), (250, 32), (120, 40), (40, 110)]],
        "four": [[(370, 32), (370, 707), (40, 240), (468, 240)]],
        "five": [[(450, 707), (70, 707), (50, 420), (250, 450), (420, 400), (468, 240), (420, 80), (250, 32), (100, 50), (40, 120)]],
        "six": [[(420, 680), (300, 707), (150, 680), (60, 540), (40, 300), (60, 120), (160, 35), (280, 32), (400, 70),
                 (460, 180), (450, 300), (370, 400), (250, 420), (130, 390), (50, 300)]],
        "seven": [[(32, 707), (468, 707), (190, 32)]],
        "eight": [ellipse(250, 555, 180, 152), ellipse(250, 200, 215, 168)],
        "period": [[(70, 32), (70, 96)]],
        "comma": [[(70, 96), (70, 32), (40, -80)]],
        "colon": [[(70, 32), (70, 96)], [(70, 420), (70, 484)]],
        "semicolon": [[(70, 96), (70, 32), (40, -80)], [(70, 420), (70, 484)]],
        "hyphen": [[(40, 330), (300, 330)]],
        "endash": [[(40, 330), (480, 330)]],
        "emdash": [[(40, 330), (920, 330)]],
        "periodcentered": [[(70, 340), (70, 404)]],
        "slash": [[(40, -20), (380, 740)]],
        "exclam": [[(70, 230), (70, 707)], [(70, 32), (70, 96)]],
        "question": [[(50, 560), (100, 670), (250, 707), (400, 670), (450, 560), (430, 460), (250, 380), (250, 230)],
                     [(250, 32), (250, 96)]],
        "quotesingle": [[(70, 540), (70, 707)]],
        "quotedbl": [[(70, 540), (70, 707)], [(210, 540), (210, 707)]],
        "parenleft": [ellipse(330, mid, 260, 420, 118, 242, 24)],
        "parenright": [ellipse(-30, mid, 260, 420, -62, 62, 24)],
        "numbersign": [[(150, 40), (220, 690)], [(340, 40), (410, 690)], [(40, 250), (500, 250)], [(70, 480), (530, 480)]],
        "plus": [[(40, 330), (440, 330)], [(240, 130), (240, 530)]],
        "ampersand": [[(470, 32), (130, 470), (110, 600), (180, 700), (290, 700), (350, 610), (320, 500), (90, 300),
                       (50, 160), (110, 60), (230, 32), (350, 70), (470, 260)]],
        "at": [ellipse(320, mid, 300, 300, 20, 345), ellipse(300, mid, 110, 110), [(410, 260), (420, 470)]],
    }
    d["nine"] = [[(500 - x, 739 - y) for x, y in line] for line in d["six"]]
    return d


CODES = {"zero": 0x30, "one": 0x31, "two": 0x32, "three": 0x33, "four": 0x34, "five": 0x35, "six": 0x36,
         "seven": 0x37, "eight": 0x38, "nine": 0x39, "period": 0x2E, "comma": 0x2C, "colon": 0x3A,
         "semicolon": 0x3B, "hyphen": 0x2D, "endash": 0x2013, "emdash": 0x2014, "periodcentered": 0xB7,
         "slash": 0x2F, "exclam": 0x21, "question": 0x3F, "quotesingle": 0x27, "quotedbl": 0x22,
         "parenleft": 0x28, "parenright": 0x29, "numbersign": 0x23, "plus": 0x2B, "ampersand": 0x26, "at": 0x40}
DIGITS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"]
SMALL_MARKS = {"period", "comma", "colon", "semicolon", "periodcentered", "quotesingle", "quotedbl", "exclam"}


def circuit_lines(paths):
    """Paired outline lines + a zig-zag web between them; nodes at corners and web joints."""
    fat = unary_union([LineString(p).buffer(T / 2, cap_style="flat", join_style="mitre", mitre_limit=2.5) for p in paths])
    lines, nodes = [], []
    for p in polys_of(fat):
        rings = [p.exterior, *p.interiors]
        lines += [LineString(r.coords) for r in rings]
        ring = list(p.exterior.coords)[:-1]
        for i, c in enumerate(ring):
            a, b = ring[i - 1], ring[(i + 1) % len(ring)]
            v1, v2 = (c[0] - a[0], c[1] - a[1]), (b[0] - c[0], b[1] - c[1])
            ang = abs(math.degrees(math.atan2(v1[0] * v2[1] - v1[1] * v2[0], v1[0] * v2[0] + v1[1] * v2[1])))
            if ang > 35:
                nodes.append(c)
    for p in paths:
        cl = LineString(p)
        n = max(2, int(cl.length / 120))
        zig = []
        for i in range(n + 1):
            pt = cl.interpolate(cl.length * i / n)
            a = cl.interpolate(max(0, cl.length * i / n - 1))
            b = cl.interpolate(min(cl.length, cl.length * i / n + 1))
            dx, dy = b.x - a.x, b.y - a.y
            ln = math.hypot(dx, dy) or 1
            side = (T / 2) * (1 if i % 2 else -1)
            zig.append((pt.x - dy / ln * side, pt.y + dx / ln * side))
        lines.append(LineString(zig))
        nodes += zig[1:-1]
    return lines, cluster(nodes, 26), fat


def stub_for(lines, nodes, fat):
    """One decorative circuit stub from the top-right-most node, angled out, ending in a node."""
    cx, cy = max(nodes, key=lambda c: c[0] + c[1])
    ox, oy = fat.centroid.x, fat.centroid.y
    ln = math.hypot(cx - ox, cy - oy) or 1
    ux, uy = (cx - ox) / ln, (cy - oy) / ln
    p1 = (cx + ux * 45, cy + uy * 45)
    p2 = (p1[0] + 38, p1[1])
    return lines + [LineString([(cx, cy), p1, p2])], nodes + [p2]


# =============================================================== font plumbing
def add_glyph(f, name, codepoint=None):
    order = list(f.getGlyphOrder())
    if name not in order:
        f.setGlyphOrder(order + [name])
        f["glyf"].glyphOrder = order + [name]
        g = f["glyf"][".notdef"].__class__()
        g.numberOfContours = 0
        f["glyf"].glyphs[name] = g
        f["hmtx"][name] = (0, 0)
    if codepoint is not None:
        for t in f["cmap"].tables:
            if t.isUnicode() and (codepoint < 0x10000 or t.format == 12):
                t.cmap[codepoint] = name


class Builder:
    def __init__(self, clean):
        self.clean = clean
        self.f = TTFont(SRC)
        self.width = CLEAN_LINE if clean else LINE
        self.dot = 0 if clean else DOT
        self.S = 170 if clean else 150
        self.store = {}  # glyph name -> (lines, nodes) in final coordinates

    def put(self, name, lines, nodes, lsb, rsb, code=None, dot=None, edge_only=True):
        dot = self.dot if dot is None else dot
        if dot and edge_only:
            nodes = edge_nodes(lines, nodes, self.width)
        geom = render(lines, nodes, self.width, dot)
        dx = lsb - geom.bounds[0]
        geom = affinity.translate(geom, dx, 0)
        lines, nodes = shift(lines, nodes, dx, 0)
        add_glyph(self.f, name, code)
        from_geom(self.f, name, geom)
        self.f["hmtx"][name] = (round(geom.bounds[2] + rsb), round(lsb))
        self.store[name] = (lines, nodes)

    def fit(self, body, others, bottom, height):
        """Scale body lines vertically so the *rendered* body spans [bottom, bottom+height];
        apply the identical transform to the other line sets."""
        g = render(*body, self.width, self.dot)
        lx0, ly0, lx1, ly1 = line_bounds(body[0])
        pad_b, pad_t = ly0 - g.bounds[1], g.bounds[3] - ly1
        sy = (height - pad_b - pad_t) / (ly1 - ly0)
        dy = bottom + pad_b
        fn = lambda L, N: shift(*scale(L, N, 1, sy, origin=(0, ly0)), 0, dy - ly0)  # noqa: E731
        return fn(*body), [fn(*o) for o in others]

    def letters(self, src):
        hs = {}
        for c in UP:
            full_geom = to_geom(src, c)
            body = trace_glyph(full_geom, 210, 230)
            full = trace_glyph(full_geom, 45, 60)
            sx = XS.get(c, 1.0)
            body, full = scale(*body, sx, 1), scale(*full, sx, 1)
            bottom, height = (-OVER, CAP + 2 * OVER) if c in ROUND else (0, CAP)
            body, (full,) = self.fit(body, [full], bottom, height)
            l, r = SIDES[c]
            if self.clean:
                self.put(c, *body, self.S * l, self.S * r)
            else:
                self.put(c, *full, self.S * l, self.S * r)
                self.put(c + ".ss01", *body, self.S * l, self.S * r)
                hs[c] = (body, full)
            # small caps from the same centre lines, redrawn at the same line width
            lc = c.lower()
            bottom, height = (-OVER * SC, (CAP + 2 * OVER) * SC) if c in ROUND else (0, CAP * SC)
            l2, r2 = self.S * l * SC * 1.1, self.S * r * SC * 1.1
            sbody = scale(*(body if self.clean else body), SC, SC)
            if self.clean:
                sbody, _ = self.fit(sbody, [], bottom, height)
                self.put(lc, *sbody, l2, r2)
            else:
                sfull = scale(*full, SC, SC)
                sbody, (sfull,) = self.fit(sbody, [sfull], bottom, height)
                self.put(lc, *sfull, l2, r2, dot=DOT * 0.85)
                self.put(lc + ".ss01", *sbody, l2, r2, dot=DOT * 0.85)

    def marks(self):
        for name, paths in drawn_paths().items():
            lines, nodes, fat = circuit_lines(paths)
            side = self.S * (.35 if name in SMALL_MARKS else .8)
            code = CODES[name]
            if name in DIGITS:
                body = (lines, nodes)
                full = stub_for(lines, nodes, fat) if not self.clean else body
                body, (full,) = self.fit(body, [full], 0, CAP)
            else:
                body = full = (lines, nodes)
            if self.clean:
                self.put(name, *body, side, side, code)
            else:
                self.put(name, *full, side, side, code)
                if name in DIGITS:
                    self.put(name + ".ss01", *body, side, side)

    def monogram(self):
        body = trace_logo(LOGO)
        x0, y0, x1, y1 = line_bounds(body[0])
        body = scale(*body, CAP / (y1 - y0), CAP / (y1 - y0), origin=(x0, y0))  # keep the logo's proportions
        body, _ = self.fit(body, [], 0, CAP)
        self.put("A_J", *body, self.S * .1, self.S * .3, edge_only=False)  # the logo keeps all its dots

    def features(self):
        names = set(self.f.getGlyphOrder())

        def grp(c):
            return "[" + " ".join(n for n in (c, c + ".ss01") if n in names) + "]"
        fea = "languagesystem DFLT dflt;\nlanguagesystem latn dflt;\n"
        if not self.clean:
            alts = [n for n in sorted(names) if n.endswith(".ss01")]
            fea += "feature ss01 {\n  featureNames { name \"Without circuit stubs\"; };\n"
            fea += "".join(f"  sub {a[:-5]} by {a};\n" for a in alts) + "} ss01;\n"
            fea += "feature dlig {\n  sub A J by A_J;\n  sub A.ss01 J.ss01 by A_J;\n} dlig;\n"
        fea += "feature kern {\n"
        for (a, b), v in KERN.items():
            for x, y, k in ((a, b, 1), (a, b.lower(), (1 + SC) / 2), (a.lower(), b.lower(), SC), (a.lower(), b, (1 + SC) / 2)):
                fea += f"  pos {grp(x)} {grp(y)} {round(v * k)};\n"
        fea += "} kern;\n"
        addOpenTypeFeaturesFromString(self.f, fea)

    def finish(self):
        f = self.f
        f["hmtx"]["space"] = (round(CAP * 0.36), 0)
        f["hmtx"]["nonmarkingreturn"] = (0, 0)
        o, hh = f["OS/2"], f["hhea"]
        hh.ascent, hh.descent, hh.lineGap = round(CAP * 1.15), -round(CAP * 0.3), 0
        o.sTypoAscender, o.sTypoDescender, o.sTypoLineGap = hh.ascent, hh.descent, 0
        glyf = f["glyf"]
        ys = [(glyf[n].yMin, glyf[n].yMax) for n in f.getGlyphOrder() if glyf[n].numberOfContours]
        o.usWinAscent = max(hh.ascent, max(y for _, y in ys))
        o.usWinDescent = max(-hh.descent, -min(y for y, _ in ys))
        o.sCapHeight, o.sxHeight = CAP, round(CAP * SC)
        o.fsSelection |= 1 << 7
        o.xAvgCharWidth = round(sum(f["hmtx"][c][0] for c in UP) / len(UP))
        o.usFirstCharIndex, o.usLastCharIndex = 0x20, 0x2014
        if o.version < 2:
            o.version = 4
        f["head"].fontRevision = 2.0
        f["head"].macStyle = 0
        fam = "Dragox Circuit Clean" if self.clean else "Dragox Circuit"
        ps = fam.replace(" ", "")
        names = {1: fam, 2: "Regular", 3: f"2.000;DRAGOX;{ps}-Regular", 4: f"{fam} Regular", 5: "Version 2.000", 6: f"{ps}-Regular"}
        nt = f["name"]
        nt.names = [r for r in nt.names if r.nameID not in names]
        for nid, s in names.items():
            nt.setName(s, nid, 3, 1, 0x409)
            nt.setName(s, nid, 1, 0, 0)
        out = OUT / f"{ps}-Regular.ttf"
        f.save(out)
        if self.clean:
            import ttfautohint
            tmp = OUT / f"{ps}-Regular.hinted.ttf"
            ttfautohint.ttfautohint(in_file=str(out), out_file=str(tmp), hinting_range_max=48, no_info=True)
            tmp.replace(out)
            f = TTFont(out)
        f.flavor = "woff2"
        f.save(OUT / f"{ps}-Regular.woff2")
        print(fam, "glyphs", len(f.getGlyphOrder()))

    def build(self):
        src = TTFont(SRC)
        self.letters(src)
        self.marks()
        if not self.clean:
            self.monogram()
        self.features()
        self.finish()
        return self


# =============================================================== signature data for the draw-in animation
def signature(b, text, out):
    cmap = TTFont(SRC).getBestCmap()
    hm = b.f["hmtx"]
    glyphs, x = [], 0
    prev = None
    for ch in text:
        if ch == " ":
            x += hm["space"][0]
            prev = None
            continue
        name = ch if ch.isalpha() else {v: k for k, v in CODES.items()}.get(ord(ch))
        if name is None or name not in b.store:
            continue
        if prev:
            for (a, c), v in KERN.items():
                if a.lower() == prev.lower() and c.lower() == name.lower():
                    k = 1 if (prev.isupper() and name.isupper()) else SC if (prev.islower() and name.islower()) else (1 + SC) / 2
                    x += round(v * k)
        lines, nodes = b.store[name]
        paths = [" ".join(("M" if i == 0 else "L") + f"{px + x:.0f} {ascent(py):.0f}" for i, (px, py) in enumerate(l.coords))
                 for l in lines]
        glyphs.append({"char": ch, "paths": paths, "dots": [[round(nx + x), round(ascent(ny))] for nx, ny in nodes]})
        x += hm[name][0]
        prev = name
    data = {"text": text, "width": x, "height": round(CAP * 1.3), "line": LINE, "dot": DOT, "glyphs": glyphs}
    out.write_text(
        "// Generated by scripts/dragox-font/build_font.py - do not edit by hand.\n"
        "// Centre lines of the Dragox Circuit glyphs, laid out with the font's spacing and kerning.\n"
        "export type SignatureGlyph = { char: string; paths: string[]; dots: [number, number][] };\n"
        "export type SignatureData = { text: string; width: number; height: number; line: number; dot: number; glyphs: SignatureGlyph[] };\n"
        f"export const dragoxSignature: SignatureData = {json.dumps(data, separators=(',', ':'))};\n",
        encoding="utf-8")
    print("signature", out, "glyphs", len(glyphs), "bytes", out.stat().st_size)


def ascent(y):
    return CAP * 1.15 - y


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    display = Builder(clean=False).build()
    Builder(clean=True).build()
    signature(display, SIGNATURE, OUT / "dragox-signature.ts")
