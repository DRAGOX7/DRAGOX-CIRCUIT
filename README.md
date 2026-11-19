# Dragox Circuit

**A free circuit-trace display typeface.** Every letter is a single traced line with junction nodes, like a route on a circuit board.

**[Try it live: dragox-circuit.vercel.app](https://dragox-circuit.vercel.app)** · **[Download the ZIP](https://dragox-circuit.vercel.app/fonts/dragox-circuit/DragoxCircuit-2.000.zip)** · **[License: OFL 1.1](OFL.txt)**

![Dragox Circuit: a free circuit-trace display typeface](app/opengraph-image.png)

Designed by **[Abdullah AlJafari](https://www.abdullah-aljafari.me)**. The letters were first drawn by hand. Version 2.0 rebuilds every one of them with a Python pipeline, so they all share one line weight, clean junctions and consistent nodes.

## At a glance

| | |
| --- | --- |
| **Price** | Free, for personal and commercial work |
| **Families** | Dragox Circuit (display) and Dragox Circuit Clean (text) |
| **Glyphs** | 148: A–Z, small-capital a–z, 0–9, punctuation, 62 stub-free alternates and the AJ ligature |
| **OpenType** | `ss01` stub-free letters, `dlig` AJ monogram, 24 kerning pairs |
| **Formats** | TTF and WOFF2 |
| **Version** | 2.000 |

## The two families

| Family | Best for | Details |
| --- | --- | --- |
| **Dragox Circuit** | Headlines, logos and posters, 32 px and up | Circuit stubs and junction nodes |
| **Dragox Circuit Clean** | Short text at 12–24 px | Heavier line, no stubs or nodes, hinted for screens |

Lowercase letters are drawn as **small capitals**, so mixed-case text still reads as circuitry.

## OpenType features

| Feature | What it does | CSS |
| --- | --- | --- |
| `ss01` | Removes the decorative branches from every letter and figure | `font-feature-settings: "ss01" 1;` |
| `dlig` | Joins A followed by J into the AJ monogram | `font-feature-settings: "dlig" 1;` |

## Install

**On your computer:** download the [ZIP](https://dragox-circuit.vercel.app/fonts/dragox-circuit/DragoxCircuit-2.000.zip), unzip it, and open the `.ttf` files to install them (on Windows, right-click and choose **Install**). The font then appears in Figma, Photoshop, Word and other apps.

**On a website:** copy the `.woff2` files into your project and add:

```css
@font-face {
  font-family: "Dragox Circuit";
  src: url("/fonts/DragoxCircuit-Regular.woff2") format("woff2");
  font-display: swap;
}

@font-face {
  font-family: "Dragox Circuit Clean";
  src: url("/fonts/DragoxCircuitClean-Regular.woff2") format("woff2");
  font-display: swap;
}

h1 {
  font-family: "Dragox Circuit", sans-serif;
  font-feature-settings: "dlig" 1; /* A + J becomes the AJ monogram */
}
```

Single files are also in [`public/fonts/dragox-circuit/`](public/fonts/dragox-circuit/).

## The specimen site

[dragox-circuit.vercel.app](https://dragox-circuit.vercel.app) is the specimen site for the font:

- **Hero:** a wall of words whose line weight ripples through the letters.
- **Stage:** the word DRAGOX with its metric lines, skeleton and nodes. Drag across it to re-stroke the letters at any weight.
- **Glyph explorer:** every character, with its width, line count, node count and Unicode value.
- **Features:** sentences that show what `ss01`, `dlig` and the small caps change.
- **Type tester:** your own text, at any size and in any color.
- **Process:** one letter at each stage of the build pipeline.

## How it was made

The scripts in [`sources/scripts/`](sources/scripts/) rebuild both families from the original v1 outlines in [`sources/original/`](sources/original/):

1. Rasterize each letter and thin it to a one-pixel skeleton (scikit-image).
2. Prune stray branches and specks from the skeleton graph (skan).
3. Fit the lines to the cap height, re-stroke them at one even width, and keep nodes only on the outer edges (Shapely).
4. Write both fonts with kerning and OpenType features, hint the Clean family, and export WOFF2 (fontTools, ttfautohint).

```bash
pip install fonttools brotli shapely scikit-image skan numpy pillow ttfautohint-py

# build both fonts into ./build
python -P sources/scripts/build_font.py sources/original/DragoxCircuit-v1.ttf sources/original/logo.png build

# glyph data for the website, favicon and share image
python -P sources/scripts/export_specimen.py . build
python -P sources/scripts/make_site_images.py .
```

## Run the website locally

The site is built with Next.js, React and Tailwind CSS.

```bash
npm install
npm run dev     # http://localhost:3000
npm run build
```

## Repository layout

```
app/                 page, layout, styles, favicon and share image
components/          header, footer, buttons and the specimen sections
public/fonts/        the downloadable fonts, ZIP and license
public/dragox-specimen.json   glyph geometry used by the site
sources/original/    the hand-drawn v1 font and the AJ logo
sources/scripts/     the Python build pipeline
```

## License

The fonts are licensed under the **[SIL Open Font License 1.1](OFL.txt)**, with **Dragox Circuit** as a Reserved Font Name.

- You can use them for free in any project, including commercial ones.
- You can embed them in websites, apps and documents.
- You can't sell the font files on their own.
- Modified versions can't use the name "Dragox Circuit".

The website code and build scripts are © 2026 Abdullah AlJafari.
