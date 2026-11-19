import { ArrowUpRight } from "lucide-react";
import { CircuitSignature } from "@/components/CircuitSignature";
import { portfolioUrl, repoUrl } from "@/lib/site";

const links = [
  { href: portfolioUrl, label: "Portfolio" },
  { href: repoUrl, label: "Source on GitHub" },
  { href: "https://openfontlicense.org", label: "SIL Open Font License" },
];

/** Sign-off: the designer's name drawn in the typeface itself, linking to the portfolio. */
export function SiteFooter() {
  return (
    <footer className="border-t border-white/[0.06]">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 px-4 py-16 text-center sm:px-6">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-white/40">Designed by</p>
        <a
          href={portfolioUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Abdullah AlJafari: open the portfolio"
          className="block w-full max-w-[26rem] rounded-lg text-accent/85 transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-8 focus-visible:ring-offset-[#030505]"
        >
          <CircuitSignature className="h-auto w-full" />
        </a>
        <p className="max-w-md text-sm leading-relaxed text-white/55">
          AI &amp; ML engineer building deployable systems in computer vision, Arabic NLP and MLOps. Dragox Circuit is one
          of the experiments in his Lab.
        </p>
        <ul className="flex flex-wrap justify-center gap-x-2 gap-y-1">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-10 items-center gap-1 rounded-full px-3 text-sm text-white/60 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {l.label}
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
        <p className="font-mono text-[11px] text-white/35">© 2026 Abdullah AlJafari · Font licensed under OFL 1.1</p>
      </div>
    </footer>
  );
}
