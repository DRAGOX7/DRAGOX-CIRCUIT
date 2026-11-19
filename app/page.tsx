import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { DragoxSpecimen } from "@/components/specimen/DragoxSpecimen";

export default function Home() {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:text-accent-foreground"
      >
        Skip to content
      </a>
      <div id="top" />
      <SiteHeader />
      <main id="main">
        <DragoxSpecimen />
      </main>
      <SiteFooter />
    </>
  );
}
