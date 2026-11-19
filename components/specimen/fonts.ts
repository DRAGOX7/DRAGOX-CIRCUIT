import localFont from "next/font/local";

// Imported only by the specimen page, so these faces load nowhere else.
export const dragoxDisplay = localFont({
  src: "../../app/fonts/DragoxCircuit-Regular.woff2",
  display: "swap",
  variable: "--font-dragox-display",
});

export const dragoxClean = localFont({
  src: "../../app/fonts/DragoxCircuitClean-Regular.woff2",
  display: "swap",
  variable: "--font-dragox-clean",
});
