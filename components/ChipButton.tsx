import type { ReactNode } from "react";
import { ArrowDown, ArrowUpRight, FileText } from "lucide-react";

type Icon = "download" | "external" | "license";

const ICONS: Record<Icon, ReactNode> = {
  download: <ArrowDown className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />,
  external: <ArrowUpRight className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />,
  license: <FileText className="h-4 w-4" strokeWidth={2} aria-hidden="true" />,
};

/**
 * The site's call-to-action: a chamfered chip with a pin-style icon cell and a short trace
 * leading to the label. Hover sends a light sweep across it and drops the arrow through its
 * cell. Styles live in globals.css (`.chip-btn`).
 */
export function ChipButton({
  href,
  children,
  meta,
  icon = "download",
  variant = "solid",
  size = "md",
  download = false,
  external = false,
}: {
  href: string;
  children: ReactNode;
  /** Muted detail after the label, e.g. "ZIP · 185 KB". */
  meta?: string;
  icon?: Icon | null;
  variant?: "solid" | "ghost";
  size?: "sm" | "md";
  download?: boolean;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      download={download || undefined}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={`chip-btn chip-btn--${variant} chip-btn--${size}`}
    >
      {icon && <span className="chip-btn__icon">{ICONS[icon]}</span>}
      <span className="chip-btn__label">
        <span className="chip-btn__trace" aria-hidden="true" />
        {children}
        {meta && <span className="chip-btn__meta">{meta}</span>}
      </span>
    </a>
  );
}
