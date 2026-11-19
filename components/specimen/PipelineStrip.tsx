import type { ReactNode } from "react";
import { boundsOf, dotsToPoints, linesToPath, type SpecimenData } from "./data";

type Frame = {
  step: string;
  title: string;
  body: string;
  stat: string;
  lists: number[][];
  render: (top: number, dx: number) => ReactNode;
};

/**
 * "How it was made": one letter through the four tracing stages of the build pipeline,
 * each drawn from the real intermediate data the export script saved.
 */
export function PipelineStrip({ data }: { data: SpecimenData }) {
  const { stages, stroke } = data;
  const ringPath = (top: number, dx: number) =>
    stages.outline
      .map((flat) => {
        let d = "";
        for (let i = 0; i < flat.length; i += 2) d += `${i === 0 ? "M" : "L"}${flat[i] + dx} ${top - flat[i + 1]}`;
        return `${d}Z`;
      })
      .join(" ");

  const frames: Frame[] = [
    {
      step: "01",
      title: "Original outline",
      body: "The hand-drawn letter from the first version: filled shapes with uneven stroke widths.",
      stat: `${stages.outline.length} contours`,
      lists: stages.outline,
      render: (top, dx) => <path d={ringPath(top, dx)} fillRule="evenodd" className="fill-white/75" />,
    },
    {
      step: "02",
      title: "Skeleton",
      body: "Rasterised and thinned to a one-pixel centre line with scikit-image. Every bump leaves a stray branch.",
      stat: `${stages.skeleton.lines.length} branches · ${stages.skeleton.dots.length / 2} ends`,
      lists: stages.skeleton.lines,
      render: (top, dx) => (
        <>
          {linesToPath(stages.skeleton.lines, top, dx).map((d, i) => (
            <path key={i} d={d} fill="none" className="stroke-white/80" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
          ))}
          {dotsToPoints(stages.skeleton.dots, top, dx).map(([cx, cy], i) => (
            <circle key={`d-${i}`} cx={cx} cy={cy} r={9} className="fill-amber-300/90" />
          ))}
        </>
      ),
    },
    {
      step: "03",
      title: "Pruned graph",
      body: "Short dead ends and detached specks are removed with skan, leaving the intended strokes and their junctions.",
      stat: `${stages.pruned.lines.length} strokes · ${stages.pruned.dots.length / 2} nodes`,
      lists: stages.pruned.lines,
      render: (top, dx) => (
        <>
          {linesToPath(stages.pruned.lines, top, dx).map((d, i) => (
            <path key={i} d={d} fill="none" className="stroke-white/80" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
          ))}
          {dotsToPoints(stages.pruned.dots, top, dx).map(([cx, cy], i) => (
            <circle key={`d-${i}`} cx={cx} cy={cy} r={9} className="fill-accent" />
          ))}
        </>
      ),
    },
    {
      step: "04",
      title: "Re-stroked",
      body: "Fitted to the cap height, redrawn at one even width with Shapely, and nodes kept only on the outer edge.",
      stat: `line ${stroke.display} · ${stages.final.dots.length / 2} edge nodes`,
      lists: stages.final.lines,
      render: (top, dx) => (
        <g className="text-accent">
          {linesToPath(stages.final.lines, top, dx).map((d, i) => (
            <path
              key={i}
              d={d}
              fill="none"
              stroke="currentColor"
              strokeWidth={stroke.display}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          {dotsToPoints(stages.final.dots, top, dx).map(([cx, cy], i) => (
            <circle key={`d-${i}`} cx={cx} cy={cy} r={stroke.dot} fill="currentColor" />
          ))}
        </g>
      ),
    },
  ];

  return (
    <section id="process" aria-labelledby="pipeline-title" className="scroll-mt-24">
      <p className="mb-2 font-mono text-xs uppercase tracking-[0.22em] text-accent/75">Process</p>
      <h2 id="pipeline-title" className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
        From outline to circuit
      </h2>
      <p className="mt-3 max-w-2xl text-white/60">
        Version 2.0 was rebuilt by code, not redrawn by hand. Here is the letter {stages.letter} at each stage of the
        Python pipeline.
      </p>

      <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {frames.map((frame) => {
          const b = boundsOf(frame.lists);
          const pad = Math.max(b.x1 - b.x0, b.y1 - b.y0) * 0.12;
          const w = b.x1 - b.x0 + pad * 2;
          const h = b.y1 - b.y0 + pad * 2;
          const top = b.y1 + pad;
          const dx = pad - b.x0;
          return (
            <li key={frame.step} className="flex flex-col rounded-[1.4rem] border border-white/[0.08] bg-[#060a0c] p-4">
              <div className="grid aspect-square place-items-center rounded-xl border border-white/[0.06] bg-black/40 p-4">
                <svg viewBox={`0 0 ${w} ${h}`} className="h-full max-h-56 w-full" aria-hidden="true">
                  {frame.render(top, dx)}
                </svg>
              </div>
              <p className="mt-4 font-mono text-[11px] text-accent/80">{frame.step}</p>
              <h3 className="mt-1 text-base font-semibold text-white">{frame.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/55">{frame.body}</p>
              <p className="mt-auto pt-3 font-mono text-[11px] text-white/40">{frame.stat}</p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
