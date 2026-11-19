import type { Metadata, Viewport } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans", display: "swap" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono", display: "swap" });

const title = "Dragox Circuit: a free circuit-trace typeface";
const description =
  "Dragox Circuit 2.0 is a free display typeface where every letter is a single traced line with junction nodes. Explore all 82 characters, test it live and download it under the SIL Open Font License.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  authors: [{ name: "Abdullah AlJafari", url: "https://www.abdullah-aljafari.me" }],
  creator: "Abdullah AlJafari",
  keywords: ["Dragox Circuit", "free font", "display typeface", "circuit font", "OFL", "open source font"],
  alternates: { canonical: "/" },
  openGraph: { title, description, type: "website", url: "/", siteName: "Dragox Circuit" },
  twitter: { card: "summary_large_image", title, description },
};

export const viewport: Viewport = {
  themeColor: "#030505",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-background font-sans text-foreground antialiased selection:bg-accent/30 selection:text-accent">
        {children}
      </body>
    </html>
  );
}
