"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Wraps `.dragox-line` / `.dragox-dot` children and starts the shared draw-in animation
 * (globals.css) once the group is on screen. Re-mount it with a new `key` to replay.
 */
export function DrawnTraces({
  children,
  strokeWidth,
}: {
  children: ReactNode;
  strokeWidth: number;
}) {
  const ref = useRef<SVGGElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const start = () => node.classList.add("is-drawing");
    if (typeof IntersectionObserver === "undefined") {
      start();
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          start();
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <g ref={ref} className="dragox-signature" strokeWidth={strokeWidth}>
      {children}
    </g>
  );
}
