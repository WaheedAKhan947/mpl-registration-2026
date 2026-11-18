import localFont from "next/font/local";

// Self-hosted fonts shared by both root layouts (app/(site) and app/(overlay)).
//
// These used to come from next/font/google, which downloads the files from
// Google Fonts during `next build`. Google intermittently serves extensionless
// `/l/font?kit=...` URLs and the Next 14 loader crashes on them
// ("Cannot read properties of null (reading '1')"), so builds failed at random.
// The .woff2 files here are the exact subset files Google serves, so the output
// is identical, but the build no longer needs network access.
//
// Subsets: Anton and Inter are the `latin` subset, Noto Nastaliq Urdu is the
// `arabic` subset. All three are variable or single-weight files, so the
// weight ranges below cover every weight the app uses.

export const displayFont = localFont({
  src: "./Anton-latin-400.woff2",
  weight: "400",
  style: "normal",
  variable: "--font-display",
  display: "swap",
});

export const bodyFont = localFont({
  src: "./Inter-latin-variable.woff2",
  weight: "100 900",
  style: "normal",
  variable: "--font-body",
  display: "swap",
});

export const urduFont = localFont({
  src: "./NotoNastaliqUrdu-arabic-variable.woff2",
  weight: "400 700",
  style: "normal",
  variable: "--font-urdu",
  display: "swap",
});
