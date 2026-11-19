"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { DownloadPanel } from "./DownloadPanel";
import { GlyphExplorer } from "./GlyphExplorer";
import { HeroWall } from "./HeroWall";
import { PipelineStrip } from "./PipelineStrip";
import { SpecSheet } from "./SpecSheet";
import { SpecimenStage } from "./SpecimenStage";
import { FeaturesRow, StylesRow, TypeTester } from "./StylesAndFeatures";
import { SPECIMEN_URL, type SpecimenData } from "./data";
import { dragoxClean, dragoxDisplay } from "./fonts";
import { portfolioUrl } from "@/lib/site";

type LoadState = { status: "loading" } | { status: "ready"; data: SpecimenData } | { status: "error" };

/**
 * Client root of the specimen site. Glyph geometry (~210 KB JSON, ~67 KB gzipped) is
 * fetched here so it never ships with the page's JS or with any other route.
 */
export function DragoxSpecimen() {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    fetch(SPECIMEN_URL, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<SpecimenData>;
      })
      .then((data) => setState({ status: "ready", data }))
      .catch((error: unknown) => {
        if ((error as Error).name !== "AbortError") setState({ status: "error" });
      });
    return () => controller.abort();
  }, []);

  return (
    <div className={`${dragoxDisplay.variable} ${dragoxClean.variable}`}>
      {/* Intro */}
      <header className="mx-auto max-w-6xl px-4 pb-14 pt-10 sm:px-6 sm:pt-14">
        <HeroWall />
        <p className="mt-12 font-mono text-xs uppercase tracking-[0.22em] text-accent/80">Typeface · Version 2.000 · OFL 1.1</p>
        <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-white sm:text-5xl">
          Dragox Circuit is a free circuit-trace typeface.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/70">
          A display typeface where every letter is a single traced line with junction nodes, like a route on a circuit
          board. Designed by{" "}
          <a
            href={portfolioUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white underline decoration-accent/50 underline-offset-4 transition-colors hover:text-accent hover:decoration-accent"
          >
            Abdullah AlJafari
          </a>
          : drawn by hand years ago, then rebuilt in Python as version 2.0. Free for any project.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="#download"
            className="liquid-control liquid-control-pill liquid-control-primary inline-flex min-h-11 items-center gap-2 px-6 py-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Download free
          </a>
          <a
            href="#glyphs"
            className="inline-flex min-h-11 items-center rounded-full border border-white/[0.12] px-5 py-3 text-sm text-white/70 transition-colors hover:border-white/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Browse glyphs
          </a>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-20 px-4 pb-24 sm:px-6">
        <SpecSheet />
        {state.status === "ready" ? (
          <>
            <SpecimenStage data={state.data} />
            <StylesRow />
            <GlyphExplorer data={state.data} />
            <FeaturesRow />
            <TypeTester />
            <PipelineStrip data={state.data} />
          </>
        ) : state.status === "loading" ? (
          <div
            role="status"
            className="grid min-h-[320px] place-items-center rounded-[1.6rem] border border-white/[0.08] bg-[#060a0c] font-mono text-xs uppercase tracking-[0.2em] text-white/40"
          >
            Loading glyph data…
          </div>
        ) : (
          <div
            role="alert"
            className="rounded-[1.6rem] border border-red-400/25 bg-red-500/[0.06] p-6 text-sm text-red-200"
          >
            The glyph data didn&apos;t load. Refresh to try again; the downloads below still work.
          </div>
        )}
        <DownloadPanel />
      </div>
    </div>
  );
}
