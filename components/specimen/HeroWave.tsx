"use client";

import { useEffect, useRef, type ReactNode } from "react";

const START_AFTER = 1.4; // seconds: let the wipe-in finish first
const RAMP = 1.2; // seconds to grow from the font's own weight to the full wave
const SPEED = 1.5; // radians per second
const SPREAD = 0.38; // phase step between neighbouring letters
const MIN = 0.45; // stroke as a multiple of the letter's normal weight
const MAX = 2.4;
const CAP = 42; // font units: keeps the heavier Clean words from closing up at the crest

type Letter = { g: SVGGElement; dots: SVGCircleElement[]; base: number; dot: number; i: number; set: string };

/**
 * A weight wave through the hero letters: each letter's line thickness rises and falls on a
 * sine that travels along the words, re-stroking the same centre lines the font is built
 * from. Writes SVG attributes directly (no React state), runs only while the wall is on
 * screen and the tab is visible, and stays still for reduced motion.
 */
export function HeroWave({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const letters: Letter[] = Array.from(root.querySelectorAll<SVGGElement>(".hero-letter")).map((g) => ({
      g,
      dots: Array.from(g.querySelectorAll("circle")),
      base: Number(g.dataset.base),
      dot: Number(g.dataset.dot),
      i: Number(g.dataset.i),
      set: "",
    }));

    let frame = 0;
    let visible = true;
    let t0 = performance.now();

    const reset = () => {
      for (const l of letters) {
        l.g.setAttribute("stroke-width", String(l.base));
        for (const c of l.dots) c.setAttribute("r", String(l.dot));
        l.set = "";
      }
    };

    const tick = (now: number) => {
      const t = (now - t0) / 1000 - START_AFTER;
      if (t > 0) {
        const amp = Math.min(1, t / RAMP);
        for (const l of letters) {
          const wave = 0.5 + 0.5 * Math.sin(t * SPEED - l.i * SPREAD);
          const k = 1 + amp * (MIN + (MAX - MIN) * wave - 1);
          const w = Math.min(CAP, Math.round(l.base * k));
          const key = String(w);
          if (key === l.set) continue; // only touch the DOM when the rounded value changes
          l.set = key;
          l.g.setAttribute("stroke-width", key);
          if (l.dot) {
            const r = String(Math.round(l.dot * Math.sqrt(k)));
            for (const c of l.dots) c.setAttribute("r", r);
          }
        }
      }
      frame = requestAnimationFrame(tick);
    };

    const sync = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      if (motion.matches) {
        reset();
        return;
      }
      if (visible && !document.hidden) frame = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting);
      sync();
    });
    observer.observe(root);
    const onMotion = () => {
      t0 = performance.now();
      sync();
    };
    motion.addEventListener("change", onMotion);
    document.addEventListener("visibilitychange", sync);
    sync();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      motion.removeEventListener("change", onMotion);
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  return (
    <div ref={ref} aria-hidden="true" className="select-none">
      {children}
    </div>
  );
}
