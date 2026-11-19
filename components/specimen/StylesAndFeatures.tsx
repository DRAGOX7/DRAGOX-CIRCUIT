"use client";

import { useId, useState } from "react";
import { traceSwatches } from "./palette";

const STYLE_CARDS = [
  {
    name: "Dragox Circuit",
    tag: "Display",
    family: "var(--font-dragox-display)",
    features: undefined,
    sample: "SIGNAL PATH 2.0",
    note: "Circuit stubs and nodes. For headlines at 40 px and up.",
  },
  {
    name: "Dragox Circuit",
    tag: "Stub-free · ss01",
    family: "var(--font-dragox-display)",
    features: '"ss01" 1',
    sample: "QUIET TRACES",
    note: "Same lines without the decorative stubs. Calmer in longer words.",
  },
  {
    name: "Dragox Circuit Clean",
    tag: "Text · hinted",
    family: "var(--font-dragox-clean)",
    features: undefined,
    sample: "Clean at small sizes: 12 to 24 px",
    note: "Heavier line, no nodes, hinted with ttfautohint for screens.",
  },
];

/** Three style cards with editable samples. */
export function StylesRow() {
  const [samples, setSamples] = useState(STYLE_CARDS.map((c) => c.sample));
  const baseId = useId();

  return (
    <section aria-labelledby="styles-title">
      <p className="mb-2 font-mono text-xs uppercase tracking-[0.22em] text-accent/75">Styles</p>
      <h2 id="styles-title" className="mb-6 text-3xl font-bold tracking-tight text-white sm:text-4xl">
        Two fonts, three voices
      </h2>
      <div className="grid gap-4 md:grid-cols-3">
        {STYLE_CARDS.map((card, i) => {
          const inputId = `${baseId}-${i}`;
          return (
            <article
              key={card.tag}
              className="flex flex-col rounded-[1.4rem] border border-white/[0.08] bg-[#060a0c] p-5"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-base font-semibold text-white">{card.name}</h3>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent/80">{card.tag}</span>
              </div>
              <label htmlFor={inputId} className="sr-only">
                Sample text for {card.name} {card.tag}
              </label>
              <textarea
                id={inputId}
                value={samples[i]}
                rows={2}
                maxLength={60}
                spellCheck={false}
                onChange={(e) => setSamples((s) => s.map((v, j) => (j === i ? e.target.value : v)))}
                className="mt-4 min-h-[5.5rem] w-full resize-none rounded-lg border border-transparent bg-transparent text-[1.9rem] leading-tight text-accent outline-none transition-colors hover:border-white/[0.08] focus-visible:border-accent/40"
                style={{ fontFamily: card.family, fontFeatureSettings: card.features }}
              />
              <p className="mt-auto pt-4 text-sm leading-relaxed text-white/55">{card.note}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

type FeatureRow = {
  tag: string;
  title: string;
  body: string;
  /** Sentence split into plain and highlighted parts: [text, highlighted]. */
  parts: [string, boolean][];
  /** Feature settings when switched on; undefined = built into the letters (no off state). */
  on?: string;
  off?: string;
  color: string;
};

// Highlighted letters are the ones the feature changes most: for ss01, the letters that lose
// half or more of their stub lines (V, Y, I, K, S, T, D, C, H...).
const FEATURE_ROWS: FeatureRow[] = [
  {
    tag: "ss01",
    title: "Stub-free letters",
    body: "Stylistic set 1 removes the decorative branches from every letter and figure.",
    parts: [
      ["SKY", true],
      [" ", false],
      ["HIGH", true],
      [" ", false],
      ["V", true],
      ["OL", false],
      ["T", true],
      ["AGE", false],
    ],
    on: '"ss01" 1',
    off: '"ss01" 0',
    color: "#fbbf24",
  },
  {
    tag: "dlig",
    title: "AJ monogram",
    body: "A discretionary ligature: A followed by J joins into one logo mark.",
    parts: [
      ["AJ", true],
      [" CIRCUIT LAB", false],
    ],
    on: '"dlig" 1',
    off: '"dlig" 0',
    color: "#fb7185",
  },
  {
    tag: "a–z",
    title: "Small caps built in",
    body: "Lowercase letters are drawn as small capitals, so mixed case still reads as circuitry.",
    parts: [
      ["S", false],
      ["ignal ", true],
      ["P", false],
      ["ath", true],
    ],
    color: "#38bdf8",
  },
];

/**
 * OpenType features shown in use: a sentence per feature with the letters it changes in
 * color, and a switch to see the same sentence without it.
 */
export function FeaturesRow() {
  const [off, setOff] = useState<Record<string, boolean>>({});

  return (
    <section aria-labelledby="features-title">
      <p className="mb-2 font-mono text-xs uppercase tracking-[0.22em] text-accent/75">OpenType</p>
      <h2 id="features-title" className="mb-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
        Features
      </h2>
      <p className="mb-6 max-w-2xl text-white/60">The colored letters are the ones each feature changes.</p>
      <ul className="divide-y divide-white/[0.08] border-y border-white/[0.08]">
        {FEATURE_ROWS.map((row) => {
          const isOff = Boolean(off[row.tag]);
          const label = row.parts.map(([t]) => t).join("");
          return (
            <li key={row.tag} className="grid gap-4 py-6 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] md:items-center md:gap-8">
              <div>
                <div className="flex items-center gap-2">
                  <code className="rounded-full border border-white/[0.14] bg-white/[0.04] px-2.5 py-0.5 font-mono text-[11px] uppercase text-white/80">
                    {row.tag}
                  </code>
                  <h3 className="text-sm font-semibold text-white">{row.title}</h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-white/55">{row.body}</p>
                {row.on && (
                  <button
                    type="button"
                    aria-pressed={isOff}
                    onClick={() => setOff((s) => ({ ...s, [row.tag]: !s[row.tag] }))}
                    className={`mt-3 inline-flex min-h-10 items-center rounded-full border px-4 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                      isOff
                        ? "border-accent/50 bg-accent/[0.12] text-accent"
                        : "border-white/[0.12] text-white/60 hover:border-white/30 hover:text-white"
                    }`}
                  >
                    Show without {row.tag}
                  </button>
                )}
              </div>
              <p
                aria-label={`${label}${isOff ? `, ${row.tag} off` : ""}`}
                className="break-words text-[clamp(2.2rem,7vw,4.75rem)] leading-[1.05] text-white/90"
                style={{ fontFamily: "var(--font-dragox-display)", fontFeatureSettings: isOff ? row.off : row.on }}
              >
                {row.parts.map(([text, hot], i) => (
                  <span
                    key={i}
                    aria-hidden="true"
                    className="transition-colors duration-300"
                    style={hot && !isOff ? { color: row.color } : undefined}
                  >
                    {text}
                  </span>
                ))}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Free tester: text, size, features and color. */
export function TypeTester() {
  const textId = useId();
  const sizeId = useId();
  const colorId = useId();
  const [text, setText] = useState("TYPE ANYTHING: AJ 0123456789 ?!");
  const [size, setSize] = useState(64);
  const [ss01, setSs01] = useState(false);
  const [dlig, setDlig] = useState(true);
  const [clean, setClean] = useState(false);
  const [color, setColor] = useState<string | null>(null);

  const toggles = [
    { label: "AJ ligature", tag: "dlig", on: dlig, set: setDlig },
    { label: "Stub-free", tag: "ss01", on: ss01, set: setSs01 },
    { label: "Clean font", tag: "clean", on: clean, set: setClean },
  ];

  return (
    <section id="tester" aria-labelledby="tester-title" className="scroll-mt-24 rounded-[1.6rem] border border-white/[0.08] bg-[#060a0c] p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 font-mono text-xs uppercase tracking-[0.22em] text-accent/75">Tester</p>
          <h2 id="tester-title" className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Try it
          </h2>
        </div>
        <div className="flex min-w-[12rem] flex-1 items-center gap-3 sm:max-w-xs">
          <label htmlFor={sizeId} className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/50">
            Size
          </label>
          <input
            id={sizeId}
            type="range"
            min={16}
            max={160}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="h-11 flex-1 accent-[var(--color-accent)]"
          />
          <span className="w-12 text-right font-mono text-xs tabular-nums text-white/60">{size}px</span>
        </div>
      </div>

      <label htmlFor={textId} className="sr-only">
        Text to preview
      </label>
      <textarea
        id={textId}
        value={text}
        maxLength={120}
        rows={2}
        spellCheck={false}
        onChange={(e) => setText(e.target.value)}
        className="mt-6 w-full resize-y break-words rounded-xl border border-white/[0.08] bg-black/40 p-4 leading-[1.15] outline-none transition-[color] duration-300 focus-visible:border-accent/40"
        style={{
          fontSize: `clamp(16px, ${size / 16}rem, 18vw)`,
          fontFamily: clean ? "var(--font-dragox-clean)" : "var(--font-dragox-display)",
          fontFeatureSettings: [`"ss01" ${ss01 ? 1 : 0}`, `"dlig" ${dlig ? 1 : 0}`].join(", "),
          color: color ?? "var(--color-accent)",
        }}
      />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Font options">
          {toggles.map((t) => (
            <button
              key={t.tag}
              type="button"
              aria-pressed={t.on}
              onClick={() => t.set((v) => !v)}
              className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                t.on
                  ? "border-accent/50 bg-accent/[0.12] text-accent"
                  : "border-white/[0.12] text-white/60 hover:border-white/30 hover:text-white"
              }`}
            >
              {t.label}
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] opacity-70">{t.tag}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Trace color">
          {traceSwatches.map((s) => (
            <button
              key={s.name}
              type="button"
              aria-label={s.name}
              aria-pressed={color === s.value}
              title={s.name}
              onClick={() => setColor(s.value)}
              className={`grid h-11 w-11 place-items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                color === s.value ? "border-white/70" : "border-white/[0.12] hover:border-white/35"
              }`}
            >
              <span aria-hidden="true" className="h-6 w-6 rounded-full" style={{ background: s.preview }} />
            </button>
          ))}
          <label
            htmlFor={colorId}
            title="Pick any color"
            className={`relative grid h-11 w-11 cursor-pointer place-items-center rounded-full border transition-colors focus-within:ring-2 focus-within:ring-accent ${
              color && !traceSwatches.some((s) => s.value === color) ? "border-white/70" : "border-white/[0.12] hover:border-white/35"
            }`}
          >
            <span className="sr-only">Pick any color</span>
            <span
              aria-hidden="true"
              className="h-6 w-6 rounded-full bg-[conic-gradient(#f87171,#fbbf24,#a3e635,#2dd4bf,#38bdf8,#a78bfa,#f472b6,#f87171)]"
            />
            <input
              id={colorId}
              type="color"
              value={color ?? "#2dd4bf"}
              onChange={(e) => setColor(e.target.value)}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </label>
        </div>
      </div>
    </section>
  );
}
