import { displayFont, bodyFont } from "@/app/fonts";
import "./overlay.css";

// Root layout for the broadcast overlay. It is deliberately bare: no navbar,
// footer, announcement bar, registration popup, language provider or AdSense
// (ads must never appear on a live stream). The site's own root layout lives
// in app/(site)/layout.js. Fonts are self-hosted; see app/fonts/index.js.

export const metadata = {
  title: "MPL Broadcast Overlay",
  robots: { index: false, follow: false },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function OverlayLayout({ children }) {
  return (
    <html lang="en" className={`${displayFont.variable} ${bodyFont.variable}`} style={{ background: "transparent" }}>
      <body style={{ background: "transparent" }}>{children}</body>
    </html>
  );
}
