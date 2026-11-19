"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Play } from "lucide-react";
import { DrawnTraces } from "./DrawnTraces";
import {
  STYLE_LABELS,
  dotsToPoints,
  layoutWord,
  linesToPath,
  type GlyphStyle,
  type SpecimenData,
} from "./data";

const WORD = ["D", "R", "A", "G", "O", "X"];
const STYLES: GlyphStyle[] = ["default", "ss01", "clean"];
const LABEL_SPACE = 150; // font units above the ascender for the width labels

type Layer = "guides" | "skeleton" | "nodes";

/**
 * Hero of the specimen: DRAGOX drawn from the font's own centre lines, with switchable
 * construction layers (metric guides, the 1-unit skeleton, highlighted nodes) and a style
 * switch between the circuit, stub-free and Clean drawings.
 */
export function SpecimenStage({ data }: { data: SpecimenData }) {
  const reduceMotion = useReducedMotion();
  const [style, setStyle] = useState<GlyphStyle>("default");
  const [layers, setLayers] = useState<Record<Layer, boolean>>({
    guides: true,
    skeleton: false,
    nodes: true,
  });
  const [run, setRun] = useState(0);

  const { ascent, descent, capHeight, smallCapHeight } = data.metrics;
  const placed = useMemo(() => layoutWord(data, WORD, style), [data, style]);
  const totalWidth = placed.length ? placed[placed.length - 1].x + placed[placed.length - 1].shape.adv : 0;
  const top = ascent; // y-up font units -> y-down SVG units
  const vbY = -LABEL_SPACE;
  const vbH = ascent - descent + LABEL_SPACE;
  const strokeWidth = style === "clean" ? data.stroke.clean : data.stroke.display;
  const showDots = style !== "clean";
  const nodeCount = placed.reduce((sum, p) => sum + p.shape.dots.length / 2, 0);

  const guides = [
    { label: "Ascender", value: ascent },
    { label: "Cap height", value: capHeight },
    { label: "Small caps", value: smallCapHeight },
    { label: "Baseline", value: 0 },
    { label: "Descender", value: descent },
  ];
  const pct = (svgY: number) => `${((svgY - vbY) / vbH) * 100}%`;

  const toggle = (layer: Layer) => setLayers((current) => ({ ...current, [layer]: !current[layer] }));

  return (
    <section aria-labelledby="specimen-stage-title" className="relative">
      <h2 id="specimen-stage-title" className="sr-only">
        Glyph construction stage
      </h2>

      <div className="relative overflow-hidden rounded-[1.6rem] border border-white/[0.08] bg-[#060a0c] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        {/* Drawing area: guide labels are HTML so they stay readable at any scale. */}
        <div className="relative px-4 pb-4 pt-6 sm:px-10 sm:pb-8 sm:pt-10 lg:pl-40">
          <div className="relative" style={{ aspectRatio: `${totalWidth} / ${vbH}` }}>
            <svg
              viewBox={`0 ${vbY} ${totalWidth} ${vbH}`}
              className="absolute inset-0 h-full w-full overflow-visible text-accent"
              role="img"
              aria-label={`DRAGOX in Dragox Circuit, ${STYLE_LABELS[style]} style`}
            >
              {layers.guides && (
                <g aria-hidden="true" className="text-white/25">
                  {guides.map((g) => (
                    <line
                      key={g.label}
                      x1={-totalWidth}
                      x2={totalWidth * 2}
                      y1={top - g.value}
                      y2={top - g.value}
                      stroke="currentColor"
                      strokeWidth={1}
                      vectorEffect="non-scaling-stroke"
                      className={g.value === 0 || g.value === capHeight ? "text-accent/45" : undefined}
                    />
                  ))}
                  {[...placed.map((p) => p.x), totalWidth].map((x, i) => (
                    <line
                      key={`v-${i}`}
                      x1={x}
                      x2={x}
                      y1={vbY + 40}
                      y2={top - descent}
                      stroke="currentColor"
                      strokeWidth={1}
                      strokeDasharray="3 5"
                      vectorEffect="non-scaling-stroke"
                    />
                  ))}
                </g>
              )}

              <DrawnTraces key={`${style}-${run}`} strokeWidth={strokeWidth}>
                {placed.map(({ glyph, shape, x }, gi) => {
                  const start = 0.1 + gi * 0.12;
                  return (
                    <g key={`${glyph.name}-${gi}`}>
                      {linesToPath(shape.lines, top, x).map((d, i) => (
                        <path
                          key={i}
                          d={d}
                          pathLength={1}
                          className="dragox-line"
                          style={{ animationDelay: `${(start + i * 0.015).toFixed(3)}s` }}
                        />
                      ))}
                      {showDots &&
                        dotsToPoints(shape.dots, top, x).map(([cx, cy], i) => (
                          <circle
                            key={`d-${i}`}
                            cx={cx}
                            cy={cy}
                            r={data.stroke.dot}
                            className="dragox-dot"
                            style={{ animationDelay: `${(start + 0.65 + i * 0.015).toFixed(3)}s` }}
                          />
                        ))}
                    </g>
                  );
                })}
              </DrawnTraces>

              {layers.skeleton && (
                <g aria-hidden="true" fill="none" stroke="white" strokeOpacity={0.75}>
                  {placed.map(({ shape, x }, gi) =>
                    linesToPath(shape.lines, top, x).map((d, i) => (
                      <path key={`s-${gi}-${i}`} d={d} strokeWidth={1} vectorEffect="non-scaling-stroke" />
                    )),
                  )}
                </g>
              )}

              {layers.nodes && (
                <g aria-hidden="true" fill="none" stroke="white" strokeOpacity={0.7}>
                  {placed.map(({ shape, x }, gi) =>
                    dotsToPoints(shape.dots, top, x).map(([cx, cy], i) => (
                      <circle
                        key={`n-${gi}-${i}`}
                        cx={cx}
                        cy={cy}
                        r={data.stroke.dot + 16}
                        strokeWidth={1}
                        vectorEffect="non-scaling-stroke"
                      />
                    )),
                  )}
                </g>
              )}
            </svg>

            {/* Width of each glyph, above its box */}
            {layers.guides &&
              placed.map(({ glyph, shape, x }) => (
                <span
                  key={`w-${glyph.name}`}
                  aria-hidden="true"
                  className="absolute top-0 hidden -translate-x-1/2 font-mono text-[10px] tabular-nums text-white/45 sm:block"
                  style={{ left: `${((x + shape.adv / 2) / totalWidth) * 100}%` }}
                >
                  {shape.adv}
                </span>
              ))}

            {/* Metric labels, left of the drawing on large screens */}
            {layers.guides && (
              <div aria-hidden="true" className="absolute inset-y-0 -left-36 hidden w-32 lg:block">
                {guides.map((g) => (
                  <span
                    key={g.label}
                    className="absolute left-0 flex w-full -translate-y-1/2 items-baseline justify-between gap-2 font-mono text-[10px] text-white/45"
                    style={{ top: pct(top - g.value) }}
                  >
                    <span className="tabular-nums text-accent/70">{g.value}</span>
                    <span>{g.label}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-4 border-t border-white/[0.07] px-4 py-4 sm:px-10 lg:flex-row lg:items-center lg:justify-between">
          <div role="radiogroup" aria-label="Glyph style" className="relative grid grid-cols-3 rounded-full border border-white/[0.1] bg-white/[0.03] p-1">
            {STYLES.map((s) => {
              const selected = style === s;
              return (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setStyle(s)}
                  className={`relative min-h-10 rounded-full px-4 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    selected ? "text-accent-foreground" : "text-white/60 hover:text-white"
                  }`}
                >
                  {selected && (
                    <motion.span
                      layoutId="specimen-style-pill"
                      className="absolute inset-0 rounded-full bg-accent"
                      transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                  <span className="relative">{STYLE_LABELS[s]}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Construction layers">
            {(["guides", "skeleton", "nodes"] as Layer[]).map((layer) => (
              <button
                key={layer}
                type="button"
                aria-pressed={layers[layer]}
                onClick={() => toggle(layer)}
                className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  layers[layer]
                    ? "border-accent/50 bg-accent/[0.12] text-accent"
                    : "border-white/[0.12] text-white/60 hover:border-white/30 hover:text-white"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`h-2 w-2 rounded-[2px] ${layers[layer] ? "bg-accent" : "bg-white/30"}`}
                />
                {layer}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setRun((r) => r + 1)}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/[0.12] px-4 text-sm text-white/70 transition-colors hover:border-accent/40 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <Play className="h-3.5 w-3.5" aria-hidden="true" />
              Play
            </button>
          </div>
        </div>

        <p className="border-t border-white/[0.07] px-4 py-3 font-mono text-[11px] text-white/45 sm:px-10">
          {placed.length} glyphs · {nodeCount} nodes · {totalWidth} units wide · line {strokeWidth} units
          {showDots ? ` · node radius ${data.stroke.dot}` : " · no nodes"}
        </p>
      </div>
    </section>
  );
}
