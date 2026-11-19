import type { CSSProperties } from "react";
import specimen from "@/public/dragox-specimen.json";
import { HeroWave } from "./HeroWave";
import { dotsToPoints, layoutWord, type GlyphStyle, type SpecimenData } from "./data";

type Word = {
  /** Glyph names, laid out with the font's advances and kerning. */
  glyphs: string[];
  style: GlyphStyle;
  color: string;
  /** Size relative to the row's base size. */
  scale: number;
};

const g = (text: string) => text.split("");
const DIGITS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];

// Rows mix the circuit drawing, the stub-free set, the Clean family, the AJ ligature, figures
// and the lowercase small caps, in the tester's trace colors.
const ROWS: Word[][] = [
  [
    { glyphs: g("DRAGOX"), style: "default", color: "var(--color-accent)", scale: 1 },
    { glyphs: ["A_J"], style: "default", color: "#fb7185", scale: 0.8 },
  ],
  [
    { glyphs: g("CIRCUIT"), style: "clean", color: "#f4f7f8", scale: 0.86 },
    { glyphs: [DIGITS[4], DIGITS[0], DIGITS[4]], style: "default", color: "#a78bfa", scale: 0.86 },
  ],
  [
    { glyphs: g("SIGNAL"), style: "ss01", color: "#fbbf24", scale: 0.8 },
    { glyphs: g("NODE"), style: "default", color: "#38bdf8", scale: 0.8 },
  ],
  [
    { glyphs: ["R", "o", "u", "t", "e"], style: "default", color: "#a3e635", scale: 0.86 },
    { glyphs: g("LIVE"), style: "clean", color: "#f4f7f8", scale: 0.62 },
    { glyphs: [DIGITS[2], "period", DIGITS[0]], style: "default", color: "var(--color-accent)", scale: 0.86 },
  ],
];

const data = specimen as unknown as SpecimenData;
const { ascent } = data.metrics;
const FOOT = 60; // font units kept below the baseline for nodes and heavy strokes

/** One compact path per letter: absolute move to each line's start, then relative steps. */
function compactPath(lines: number[][], dx: number): string {
  let d = "";
  for (const flat of lines) {
    let px = flat[0] + dx;
    let py = ascent - flat[1];
    d += `M${px} ${py}l`;
    for (let i = 2; i < flat.length; i += 2) {
      const x = flat[i] + dx;
      const y = ascent - flat[i + 1];
      const sx = x - px;
      const sy = y - py;
      d += `${i > 2 && sx >= 0 ? " " : ""}${sx}${sy >= 0 ? " " : ""}${sy}`;
      px = x;
      py = y;
    }
  }
  return d;
}

/**
 * Opening wall of words, drawn on the server from the font's own centre lines so each
 * letter can be re-stroked live. Words wipe in like routed traces (`.hero-word`), then
 * HeroWave runs a weight wave through the letters. Decorative: the page's h1 follows.
 */
export function HeroWall() {
  let order = 0;
  let letterIndex = 0;
  return (
    <HeroWave>
      {ROWS.map((row, r) => (
        <div
          key={r}
          className="flex flex-wrap items-end justify-between gap-x-[0.18em] text-[clamp(2.6rem,12vw,9.5rem)] leading-none"
        >
          {row.map((word) => {
            const placed = layoutWord(data, word.glyphs, word.style);
            const last = placed[placed.length - 1];
            const width = last.x + last.shape.adv;
            const height = ascent + FOOT;
            const base = word.style === "clean" ? data.stroke.clean : data.stroke.display;
            const dots = word.style !== "clean";
            const delay = 0.08 + order++ * 0.09;
            return (
              <span
                key={word.glyphs.join("")}
                className="hero-word inline-block"
                style={
                  {
                    fontSize: `${word.scale}em`,
                    color: word.color,
                    marginBottom: `-${FOOT / 1000}em`,
                    "--wipe-delay": `${delay.toFixed(2)}s`,
                  } as CSSProperties
                }
              >
                <svg
                  viewBox={`0 0 ${width} ${height}`}
                  width={`${width / 1000}em`}
                  height={`${height / 1000}em`}
                  overflow="visible"
                  className="block"
                >
                  {placed.map(({ shape, x }) => (
                    <g
                      key={letterIndex}
                      className="hero-letter"
                      data-i={letterIndex++}
                      data-base={base}
                      data-dot={dots ? data.stroke.dot : 0}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={base}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d={compactPath(shape.lines, x)} />
                      {dots &&
                        dotsToPoints(shape.dots, ascent, x).map(([cx, cy], i) => (
                          <circle key={`d${i}`} cx={cx} cy={cy} r={data.stroke.dot} fill="currentColor" stroke="none" />
                        ))}
                    </g>
                  ))}
                </svg>
              </span>
            );
          })}
        </div>
      ))}
    </HeroWave>
  );
}
