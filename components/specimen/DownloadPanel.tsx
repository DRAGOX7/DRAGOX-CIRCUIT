"use client";

import { useState } from "react";
import { Check, Copy, Download, FileText } from "lucide-react";
import { DOWNLOAD_BASE } from "./data";

const FILES = [
  { label: "Dragox Circuit", format: "TTF", file: "DragoxCircuit-Regular.ttf", size: "118 KB" },
  { label: "Dragox Circuit", format: "WOFF2", file: "DragoxCircuit-Regular.woff2", size: "50 KB" },
  { label: "Dragox Circuit Clean", format: "TTF", file: "DragoxCircuitClean-Regular.ttf", size: "51 KB" },
  { label: "Dragox Circuit Clean", format: "WOFF2", file: "DragoxCircuitClean-Regular.woff2", size: "30 KB" },
];

const CSS_SNIPPET = `@font-face {
  font-family: "Dragox Circuit";
  src: url("DragoxCircuit-Regular.woff2") format("woff2");
  font-display: swap;
}

h1 {
  font-family: "Dragox Circuit", sans-serif;
  font-feature-settings: "dlig" 1; /* AJ monogram */
}`;

/** Downloads (zip and single files), the license, and a CSS snippet. */
export function DownloadPanel() {
  const [copied, setCopied] = useState(false);

  const copyCss = async () => {
    try {
      await navigator.clipboard.writeText(CSS_SNIPPET);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      // Clipboard blocked: the snippet is visible to select by hand.
    }
  };

  return (
    <section
      id="download"
      aria-labelledby="download-title"
      className="scroll-mt-24 overflow-hidden rounded-[1.6rem] border border-accent/20 bg-[#0A0F13]"
    >
      <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex flex-col">
          <p className="mb-2 font-mono text-xs uppercase tracking-[0.22em] text-accent/75">Download</p>
          <h2 id="download-title" className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Free and open source
          </h2>
          <p className="mt-3 max-w-md text-white/60">
            Both fonts are released under the SIL Open Font License 1.1. Use them in any project, personal or commercial,
            and embed them on the web. The only thing you can&apos;t do is sell the font files on their own.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={`${DOWNLOAD_BASE}/DragoxCircuit-2.000.zip`}
              download
              className="liquid-control liquid-control-pill liquid-control-primary inline-flex min-h-11 items-center gap-2 px-6 py-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0F13]"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Download all (ZIP, 185 KB)
            </a>
            <a
              href={`${DOWNLOAD_BASE}/OFL.txt`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/[0.12] px-5 py-3 text-sm text-white/70 transition-colors hover:border-white/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
              License (OFL 1.1)
            </a>
          </div>

          <ul className="mt-6 divide-y divide-white/[0.06] rounded-xl border border-white/[0.08]">
            {FILES.map((f) => (
              <li key={f.file}>
                <a
                  href={`${DOWNLOAD_BASE}/${f.file}`}
                  download
                  className="flex min-h-12 items-center justify-between gap-3 px-4 py-2 text-sm text-white/75 transition-colors hover:bg-white/[0.03] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
                >
                  <span>
                    {f.label} <span className="font-mono text-xs text-accent/80">{f.format}</span>
                  </span>
                  <span className="flex items-center gap-2 font-mono text-xs text-white/45">
                    {f.size}
                    <Download className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex min-w-0 flex-col">
          <div className="flex items-center justify-between gap-3">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-white/50">Use it on the web</p>
            <button
              type="button"
              onClick={copyCss}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/[0.12] px-4 text-sm text-white/70 transition-colors hover:border-accent/40 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
              {copied ? "Copied" : "Copy CSS"}
            </button>
          </div>
          <pre className="mt-3 flex-1 overflow-x-auto rounded-xl border border-white/[0.08] bg-black/50 p-4 font-mono text-[12.5px] leading-relaxed text-white/75">
            <code>{CSS_SNIPPET}</code>
          </pre>
          <p className="sr-only" aria-live="polite">
            {copied ? "CSS copied" : ""}
          </p>
        </div>
      </div>
    </section>
  );
}
