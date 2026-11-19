"use client";

import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Copy } from "lucide-react";
import { DrawnTraces } from "./DrawnTraces";
import {
  GROUP_LABELS,
  STYLE_LABELS,
  boundsOf,
  describeGlyph,
  dotsToPoints,
  linesToPath,
  shapeFor,
  unicodeLabel,
  type GlyphGroup,
  type GlyphStyle,
  type SpecimenData,
  type SpecimenGlyph,
} from "./data";

type Filter = "all" | GlyphGroup;
const FILTERS: Filter[] = ["all", "capitals", "smallcaps", "figures", "punctuation", "ligature"];
const STYLES: GlyphStyle[] = ["default", "ss01", "clean"];

function fontStyleFor(style: GlyphStyle, glyph?: SpecimenGlyph) {
  const ligature = glyph?.group === "ligature";
  if (style === "clean") {
    return { fontFamily: "var(--font-dragox-clean)", fontFeatureSettings: ligature ? '"dlig" 1' : undefined };
  }
  return {
    fontFamily: "var(--font-dragox-display)",
    fontFeatureSettings: [style === "ss01" ? '"ss01" 1' : null, ligature ? '"dlig" 1' : null]
      .filter(Boolean)
      .join(", ") || undefined,
  };
}

/**
 * Every glyph in the display font, rendered with the font itself, plus an inspector that
 * draws the selected glyph from its centre lines with metric guides and node positions.
 * The grid uses a roving tabindex: one Tab stop, arrow keys move between glyphs.
 */
export function GlyphExplorer({ data }: { data: SpecimenData }) {
  const reduceMotion = useReducedMotion();
  const [filter, setFilter] = useState<Filter>("all");
  const [style, setStyle] = useState<GlyphStyle>("default");
  const [selectedName, setSelectedName] = useState("R");
  const [copied, setCopied] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  // The builder emits A, a, B, b...; show whole groups in order instead.
  const ordered = useMemo(() => {
    const rank = (g: SpecimenGlyph) => FILTERS.indexOf(g.group);
    return [...data.glyphs].sort((a, b) => rank(a) - rank(b));
  }, [data.glyphs]);
  const glyphs = useMemo(
    () => (filter === "all" ? ordered : ordered.filter((g) => g.group === filter)),
    [ordered, filter],
  );
  const selected = data.glyphs.find((g) => g.name === selectedName) ?? data.glyphs[0];
  const focusIndex = Math.max(0, glyphs.findIndex((g) => g.name === selectedName));

  const moveFocus = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const buttons = Array.from(gridRef.current?.querySelectorAll<HTMLButtonElement>("button[data-glyph]") ?? []);
    if (!buttons.length) return;
    let next = index;
    if (event.key === "ArrowRight") next = Math.min(buttons.length - 1, index + 1);
    else if (event.key === "ArrowLeft") next = Math.max(0, index - 1);
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = buttons.length - 1;
    else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      // Same column in the next/previous row: compare horizontal positions.
      const here = buttons[index].getBoundingClientRect();
      const dir = event.key === "ArrowDown" ? 1 : -1;
      for (let i = index + dir; i >= 0 && i < buttons.length; i += dir) {
        const r = buttons[i].getBoundingClientRect();
        if (Math.abs(r.left - here.left) < 4 && r.top !== here.top) {
          next = i;
          break;
        }
      }
    } else return;
    event.preventDefault();
    buttons[next].focus();
    setSelectedName(buttons[next].dataset.glyph ?? selectedName);
  };

  const copyChar = async () => {
    try {
      await navigator.clipboard.writeText(selected.char);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      // Clipboard can be blocked (permissions, insecure context); the character stays visible to copy by hand.
    }
  };

  return (
    <section aria-labelledby="glyphs-title" className="scroll-mt-24" id="glyphs">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 font-mono text-xs uppercase tracking-[0.22em] text-accent/75">Glyphs</p>
          <h2 id="glyphs-title" className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {data.glyphs.length} characters, one line each
          </h2>
        </div>
        <div role="radiogroup" aria-label="Glyph style" className="flex flex-wrap gap-2">
          {STYLES.map((s) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={style === s}
              onClick={() => setStyle(s)}
              className={`min-h-11 rounded-full border px-4 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                style === s
                  ? "border-accent/50 bg-accent/[0.12] text-accent"
                  : "border-white/[0.12] text-white/60 hover:border-white/30 hover:text-white"
              }`}
            >
              {STYLE_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        {/* Grid */}
        <div className="min-w-0 rounded-[1.4rem] border border-white/[0.08] bg-[#060a0c] p-3 sm:p-4">
          <div role="group" aria-label="Glyph groups" className="mb-3 flex gap-1 overflow-x-auto pb-1">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
                className={`min-h-10 shrink-0 rounded-full px-3.5 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  filter === f ? "bg-white/[0.09] text-white" : "text-white/50 hover:text-white"
                }`}
              >
                {f === "all" ? `All ${data.glyphs.length}` : GROUP_LABELS[f]}
              </button>
            ))}
          </div>

          <div
            ref={gridRef}
            role="group"
            aria-label="Glyph grid"
            className="grid grid-cols-[repeat(auto-fill,minmax(3.5rem,1fr))] gap-1.5"
          >
            {glyphs.map((glyph, index) => {
              const isSelected = glyph.name === selected.name;
              return (
                <button
                  key={glyph.name}
                  type="button"
                  data-glyph={glyph.name}
                  tabIndex={index === focusIndex ? 0 : -1}
                  aria-pressed={isSelected}
                  aria-label={describeGlyph(glyph)}
                  onClick={() => setSelectedName(glyph.name)}
                  onKeyDown={(event) => moveFocus(event, index)}
                  className={`grid aspect-square place-items-center rounded-lg border text-[1.6rem] leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    isSelected
                      ? "border-accent/60 bg-accent/[0.1] text-accent"
                      : "border-white/[0.06] bg-white/[0.02] text-white/80 hover:border-white/20 hover:text-white"
                  }`}
                  style={fontStyleFor(style, glyph)}
                >
                  {glyph.char}
                </button>
              );
            })}
          </div>
        </div>

        {/* Inspector */}
        <aside
          aria-label="Selected glyph"
          className="rounded-[1.4rem] border border-white/[0.08] bg-[#060a0c] p-4 sm:p-5 lg:sticky lg:top-24 lg:self-start"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`${selected.name}-${style}`}
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              <GlyphInspector data={data} glyph={selected} style={style} />
            </motion.div>
          </AnimatePresence>

          <div className="mt-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-lg font-semibold text-white">{describeGlyph(selected)}</p>
              <p className="font-mono text-xs text-white/50">{unicodeLabel(selected)}</p>
            </div>
            <button
              type="button"
              onClick={copyChar}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/[0.12] px-4 text-sm text-white/70 transition-colors hover:border-accent/40 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="sr-only" aria-live="polite">
            {copied ? `${describeGlyph(selected)} copied` : ""}
          </p>
        </aside>
      </div>
    </section>
  );
}

function GlyphInspector({ data, glyph, style }: { data: SpecimenData; glyph: SpecimenGlyph; style: GlyphStyle }) {
  const shape = shapeFor(glyph, style);
  const { ascent, descent, capHeight, smallCapHeight } = data.metrics;
  const top = ascent;
  const strokeWidth = style === "clean" ? data.stroke.clean : data.stroke.display;
  const showDots = style !== "clean";
  // Centre the glyph's ink in a square-ish frame wide enough for the widest glyphs.
  const ink = boundsOf(shape.lines);
  const frameW = Math.max(shape.adv, ascent - descent) + 120;
  const dx = (frameW - (ink.x1 + ink.x0)) / 2;
  const vbH = ascent - descent;
  const rows: [string, string | number][] = [
    ["Width", shape.adv],
    ["Lines", shape.lines.length],
    ["Nodes", showDots ? shape.dots.length / 2 : "none"],
    ["Style", STYLE_LABELS[style]],
  ];

  return (
    <>
      <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-black/40">
        <svg
          viewBox={`0 0 ${frameW} ${vbH}`}
          className="block h-auto w-full text-accent"
          role="img"
          aria-label={`${describeGlyph(glyph)}, ${STYLE_LABELS[style]} drawing`}
        >
          <g aria-hidden="true" stroke="white" strokeOpacity={0.18} strokeWidth={1} vectorEffect="non-scaling-stroke">
            {[ascent, capHeight, smallCapHeight, 0, descent].map((v) => (
              <line
                key={v}
                x1={0}
                x2={frameW}
                y1={top - v}
                y2={top - v}
                vectorEffect="non-scaling-stroke"
                strokeOpacity={v === 0 || v === capHeight ? 0.35 : 0.18}
              />
            ))}
            <line x1={dx} x2={dx} y1={0} y2={vbH} strokeDasharray="3 5" vectorEffect="non-scaling-stroke" />
            <line
              x1={dx + shape.adv}
              x2={dx + shape.adv}
              y1={0}
              y2={vbH}
              strokeDasharray="3 5"
              vectorEffect="non-scaling-stroke"
            />
          </g>
          <DrawnTraces strokeWidth={strokeWidth}>
            {linesToPath(shape.lines, top, dx).map((d, i) => (
              <path
                key={i}
                d={d}
                pathLength={1}
                className="dragox-line"
                style={{ animationDelay: `${(i * 0.04).toFixed(2)}s` }}
              />
            ))}
            {showDots &&
              dotsToPoints(shape.dots, top, dx).map(([cx, cy], i) => (
                <circle
                  key={`d-${i}`}
                  cx={cx}
                  cy={cy}
                  r={data.stroke.dot}
                  className="dragox-dot"
                  style={{ animationDelay: `${(0.5 + i * 0.03).toFixed(2)}s` }}
                />
              ))}
          </DrawnTraces>
          <g aria-hidden="true" fill="none" stroke="white" strokeOpacity={0.8}>
            {linesToPath(shape.lines, top, dx).map((d, i) => (
              <path key={`s-${i}`} d={d} strokeWidth={1} vectorEffect="non-scaling-stroke" />
            ))}
          </g>
        </svg>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 font-mono text-xs">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-3 border-b border-white/[0.06] py-1.5 pr-3">
            <dt className="text-white/45">{label}</dt>
            <dd className="tabular-nums text-white/85">{value}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}
