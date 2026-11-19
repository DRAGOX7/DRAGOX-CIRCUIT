import { ArrowUpRight } from "lucide-react";
import { ChipButton } from "./ChipButton";
import { portfolioUrl, repoUrl } from "@/lib/site";
import { GitHubMark } from "./GitHubMark";

const sections = [
  { href: "#glyphs", label: "Glyphs" },
  { href: "#tester", label: "Tester" },
  { href: "#process", label: "Process" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#030505]/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <a
          href="#top"
          className="inline-flex min-h-10 items-center rounded-md font-mono text-xs uppercase tracking-[0.24em] text-white/85 transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Dragox<span className="text-accent"> Circuit</span>
        </a>

        <nav aria-label="Site" className="flex items-center gap-1 sm:gap-2">
          <ul className="hidden items-center gap-1 md:flex">
            {sections.map((s) => (
              <li key={s.href}>
                <a
                  href={s.href}
                  className="inline-flex min-h-10 items-center rounded-full px-3 text-sm text-white/60 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
          <a
            href={portfolioUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden min-h-10 items-center gap-1 rounded-full px-3 text-sm text-white/60 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:inline-flex"
          >
            By Abdullah AlJafari
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
          <a
            href={repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Source on GitHub"
            className="grid h-10 w-10 place-items-center rounded-full text-white/60 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <GitHubMark className="h-[18px] w-[18px]" />
          </a>
          <ChipButton href="#download" size="sm">
            Download
          </ChipButton>
        </nav>
      </div>
    </header>
  );
}
