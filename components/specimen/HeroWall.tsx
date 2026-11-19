import type { CSSProperties } from "react";

type Word = {
  text: string;
  family: "display" | "clean";
  /** OpenType features, e.g. '"ss01" 1'. */
  features?: string;
  color: string;
  /** Font size as a fraction of the base row size. */
  scale: number;
  /** What the word shows off, for the hover label. */
  note: string;
};

// Each row fills the width; words mix the two families, the stub-free set, the AJ ligature
// and the lowercase small caps, in the tester's trace colors.
const ROWS: Word[][] = [
  [
    { text: "DRAGOX", family: "display", color: "var(--color-accent)", scale: 1, note: "Circuit" },
    { text: "AJ", family: "display", features: '"dlig" 1', color: "#fb7185", scale: 0.8, note: "dlig" },
  ],
  [
    { text: "CIRCUIT", family: "clean", color: "#f4f7f8", scale: 0.86, note: "Clean" },
    { text: "404", family: "display", color: "#a78bfa", scale: 0.86, note: "Figures" },
  ],
  [
    { text: "SIGNAL", family: "display", features: '"ss01" 1', color: "#fbbf24", scale: 0.8, note: "ss01" },
    { text: "NODE", family: "display", color: "#38bdf8", scale: 0.8, note: "Circuit" },
  ],
  [
    { text: "Route", family: "display", color: "#a3e635", scale: 0.86, note: "Small caps" },
    { text: "LIVE", family: "clean", color: "#f4f7f8", scale: 0.62, note: "Clean" },
    { text: "2.0", family: "display", color: "var(--color-accent)", scale: 0.86, note: "Circuit" },
  ],
];

/**
 * Opening wall of words set in the font. Each word wipes in like a trace being routed
 * (`.hero-word` in globals.css); reduced motion shows the finished wall.
 * Decorative: the page's h1 follows it.
 */
export function HeroWall() {
  let order = 0;
  return (
    <div aria-hidden="true" className="select-none">
      {ROWS.map((row, r) => (
        <div
          key={r}
          className="flex flex-wrap items-baseline justify-between gap-x-[0.18em] text-[clamp(2.6rem,12vw,9.5rem)] leading-[1.02]"
        >
          {row.map((word) => {
            const delay = 0.08 + order++ * 0.09;
            return (
              <span
                key={word.text}
                title={word.note}
                className="hero-word inline-block whitespace-nowrap"
                style={
                  {
                    fontFamily: word.family === "display" ? "var(--font-dragox-display)" : "var(--font-dragox-clean)",
                    fontFeatureSettings: word.features,
                    fontSize: `${word.scale}em`,
                    color: word.color,
                    "--wipe-delay": `${delay.toFixed(2)}s`,
                  } as CSSProperties
                }
              >
                {word.text}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}
