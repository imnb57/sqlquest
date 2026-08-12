import localFont from "next/font/local";

/**
 * Typefaces, self-hosted.
 *
 * Both are downloaded into `src/fonts/` and served from our own origin — the
 * CSP blocks external hosts outright, and it keeps the Docker build hermetic
 * (no network fetch at build time, no CDN at runtime).
 *
 * Both are *variable* fonts, so one file covers the whole weight range instead
 * of shipping five static cuts. Total: ~102 KB for the entire type system.
 */

/**
 * Rethink Sans — the UI and display face.
 *
 * A geometric sans with a tall x-height and unusually open apertures, which is
 * what makes it hold up at the small label sizes a dense app like this needs.
 * Latin subset only; every string in the product is ASCII plus typographic
 * punctuation (em dash, curly quotes, ellipsis), all of which live in latin.
 */
export const fontSans = localFont({
  src: [
    {
      path: "../fonts/rethink-sans-latin.woff2",
      weight: "400 800",
      style: "normal",
    },
    {
      path: "../fonts/rethink-sans-italic-latin.woff2",
      weight: "400 800",
      style: "italic",
    },
  ],
  variable: "--font-rethink",
  display: "swap",
  preload: true,
  // Metric-matched fallback so the swap from system font to Rethink Sans
  // doesn't shift the layout.
  fallback: [
    "ui-sans-serif",
    "system-ui",
    "-apple-system",
    "Segoe UI",
    "Roboto",
    "Helvetica Neue",
    "Arial",
    "sans-serif",
  ],
});

/**
 * JetBrains Mono — the code face.
 *
 * Worth the extra 31 KB in a product where people stare at SQL: the system
 * mono stack varies wildly (Consolas on Windows, DejaVu on many Linux boxes),
 * and its disambiguated `1 l I` / `0 O` matter when you're hunting a typo in a
 * query. Drop this and the `--font-code` line below to fall back to system mono.
 */
export const fontMono = localFont({
  src: "../fonts/jetbrains-mono-latin.woff2",
  weight: "400 700",
  style: "normal",
  variable: "--font-jetbrains",
  display: "swap",
  preload: true,
  fallback: [
    "ui-monospace",
    "SFMono-Regular",
    "Menlo",
    "Consolas",
    "Liberation Mono",
    "monospace",
  ],
});

/** Applied to <html> so the CSS variables are available everywhere. */
export const fontVariables = `${fontSans.variable} ${fontMono.variable}`;
