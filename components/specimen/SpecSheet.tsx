type Tile = {
  value: string;
  features?: string;
  label: string;
  body: string;
  wide?: boolean;
};

// Counts come from the built font: 148 glyphs (82 characters, 62 stub-free alternates and
// 4 system glyphs such as .notdef and space) and 24 kerning pairs.
const TILES: Tile[] = [
  {
    value: "$0",
    label: "Price",
    body: "Free for personal and commercial work under the SIL Open Font License.",
    wide: true,
  },
  { value: "148", label: "Glyphs", body: "82 characters, plus 62 stub-free alternates." },
  { value: "2", label: "Families", body: "Circuit for display, Clean for text from 12 to 24 px." },
  { value: "24", label: "Kerning pairs", body: "Pairs like AV, LT and TO pulled together so capitals space evenly." },
  { value: "AJ", features: '"dlig" 1', label: "Ligature", body: "Type A then J and the monogram appears." },
  {
    value: "v2",
    label: "Rebuilt in Python",
    body: "Traced from the hand-drawn v1 with fontTools, scikit-image and Shapely.",
    wide: true,
  },
];

/** "At a glance": the font's key facts as large numbers set in the font itself. */
export function SpecSheet() {
  return (
    <section aria-labelledby="glance-title">
      <h2 id="glance-title" className="sr-only">
        At a glance
      </h2>
      <dl className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {TILES.map((tile) => (
          <div
            key={tile.label}
            className={`flex flex-col rounded-[1.4rem] border p-4 sm:p-5 ${
              tile.value === "$0"
                ? "col-span-2 border-accent/30 bg-[radial-gradient(circle_at_20%_0%,rgba(45,212,191,0.12),transparent_60%),#060a0c]"
                : `${tile.wide ? "col-span-2 " : ""}border-white/[0.08] bg-[#060a0c]`
            }`}
          >
            <dt className="order-2 mt-3 font-mono text-[11px] uppercase tracking-[0.18em] text-accent/80">{tile.label}</dt>
            <dd
              className={`order-1 leading-none text-accent ${tile.value === "$0" ? "text-[clamp(3.5rem,9vw,6rem)]" : "text-[clamp(2.6rem,6vw,4rem)]"}`}
              style={{ fontFamily: "var(--font-dragox-display)", fontFeatureSettings: tile.features }}
            >
              {tile.value}
            </dd>
            <dd className="order-3 mt-1.5 text-sm leading-relaxed text-white/55">{tile.body}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
