// Types and geometry helpers for public/dragox-specimen.json
// (written by scripts/dragox-font/export_specimen.py). Coordinates are font units, y up.

export type GlyphShape = {
  adv: number;
  /** Each line is a flat [x0, y0, x1, y1, ...] list. */
  lines: number[][];
  /** Flat [x0, y0, x1, y1, ...] list of node centres. */
  dots: number[];
};

export type GlyphGroup = "capitals" | "smallcaps" | "figures" | "punctuation" | "ligature";

export type SpecimenGlyph = GlyphShape & {
  name: string;
  char: string;
  code: number | null;
  group: GlyphGroup;
  ss01?: GlyphShape;
  clean?: GlyphShape;
};

export type SpecimenData = {
  family: string;
  version: string;
  metrics: {
    unitsPerEm: number;
    ascent: number;
    descent: number;
    capHeight: number;
    smallCapHeight: number;
    overshoot: number;
    space: number;
  };
  stroke: { display: number; clean: number; dot: number };
  kern: [string, string, number][];
  glyphs: SpecimenGlyph[];
  stages: {
    letter: string;
    outline: number[][];
    skeleton: { lines: number[][]; dots: number[] };
    pruned: { lines: number[][]; dots: number[] };
    final: GlyphShape;
  };
};

export type GlyphStyle = "default" | "ss01" | "clean";

export const STYLE_LABELS: Record<GlyphStyle, string> = {
  default: "Circuit",
  ss01: "Stub-free",
  clean: "Clean",
};

export const GROUP_LABELS: Record<GlyphGroup, string> = {
  capitals: "Capitals",
  smallcaps: "Small caps",
  figures: "Figures",
  punctuation: "Punctuation",
  ligature: "Ligature",
};

const PUNCTUATION_NAMES: Record<string, string> = {
  period: "full stop",
  comma: "comma",
  colon: "colon",
  semicolon: "semicolon",
  hyphen: "hyphen",
  endash: "en dash",
  emdash: "em dash",
  periodcentered: "middle dot",
  slash: "slash",
  exclam: "exclamation mark",
  question: "question mark",
  quotesingle: "apostrophe",
  quotedbl: "quotation mark",
  parenleft: "left parenthesis",
  parenright: "right parenthesis",
  numbersign: "number sign",
  plus: "plus sign",
  ampersand: "ampersand",
  at: "at sign",
};

/** Readable name for screen readers and the inspector. */
export function describeGlyph(glyph: SpecimenGlyph): string {
  switch (glyph.group) {
    case "capitals":
      return `Capital ${glyph.char}`;
    case "smallcaps":
      return `Small capital ${glyph.char.toUpperCase()}`;
    case "figures":
      return `Figure ${glyph.char}`;
    case "ligature":
      return "AJ monogram ligature";
    default:
      return PUNCTUATION_NAMES[glyph.name] ?? glyph.name;
  }
}

export function unicodeLabel(glyph: SpecimenGlyph): string {
  if (glyph.code === null) return "A + J (dlig)";
  return `U+${glyph.code.toString(16).toUpperCase().padStart(4, "0")}`;
}

/** The shape to draw for a style; falls back to the default drawing when a variant does not exist. */
export function shapeFor(glyph: SpecimenGlyph, style: GlyphStyle): GlyphShape {
  if (style === "ss01") return glyph.ss01 ?? glyph;
  if (style === "clean") return glyph.clean ?? glyph.ss01 ?? glyph;
  return glyph;
}

/** SVG path for flat line lists, flipped to y-down around `top` and shifted by `dx`. */
export function linesToPath(lines: number[][], top: number, dx = 0): string[] {
  return lines.map((flat) => {
    let d = "";
    for (let i = 0; i < flat.length; i += 2) {
      d += `${i === 0 ? "M" : "L"}${flat[i] + dx} ${top - flat[i + 1]}`;
    }
    return d;
  });
}

export function dotsToPoints(dots: number[], top: number, dx = 0): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < dots.length; i += 2) out.push([dots[i] + dx, top - dots[i + 1]]);
  return out;
}

/** Bounds of a set of flat coordinate lists. */
export function boundsOf(lists: number[][]): { x0: number; y0: number; x1: number; y1: number } {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const flat of lists) {
    for (let i = 0; i < flat.length; i += 2) {
      x0 = Math.min(x0, flat[i]);
      x1 = Math.max(x1, flat[i]);
      y0 = Math.min(y0, flat[i + 1]);
      y1 = Math.max(y1, flat[i + 1]);
    }
  }
  return { x0, y0, x1, y1 };
}

/** Lay out a word from glyph names with the font's advances and kerning. */
export function layoutWord(
  data: SpecimenData,
  names: string[],
  style: GlyphStyle,
): { glyph: SpecimenGlyph; shape: GlyphShape; x: number }[] {
  const byName = new Map(data.glyphs.map((g) => [g.name, g]));
  const kern = new Map(data.kern.map(([a, b, v]) => [`${a}|${b}`, v]));
  const placed: { glyph: SpecimenGlyph; shape: GlyphShape; x: number }[] = [];
  let x = 0;
  let prev: string | null = null;
  for (const name of names) {
    const glyph = byName.get(name);
    if (!glyph) continue;
    // Clean has no kerning differences worth showing; the display pairs apply to both.
    if (prev) x += kern.get(`${prev}|${name}`) ?? 0;
    const shape = shapeFor(glyph, style);
    placed.push({ glyph, shape, x });
    x += shape.adv;
    prev = name;
  }
  return placed;
}

export const SPECIMEN_URL = "/dragox-specimen.json";
export const DOWNLOAD_BASE = "/fonts/dragox-circuit";
