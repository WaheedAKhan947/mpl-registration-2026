"use client";

import { useEffect, useState } from "react";
import { BACKGROUNDS, fitCanvas } from "@/lib/overlay/params";

// A fixed-size design canvas (1920x1080 by default) scaled to fit whatever
// size the streaming app gives the web source, letterboxed and centred.
// Everything inside is laid out in canvas pixels, so graphics look the same
// in OBS at 1080p, PRISM PC at 720p or a portrait phone source.
export default function OverlayCanvas({ params, children }) {
  const { width, height, scale, bg, debug, lite } = params;
  const [fit, setFit] = useState(null);
  const [viewport, setViewport] = useState({ w: 0, h: 0 });

  useEffect(() => {
    function measure() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setViewport({ w, h });
      setFit(fitCanvas({ viewportWidth: w, viewportHeight: h, width, height, scale }));
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [width, height, scale]);

  // Paint the page itself for bg=solid / bg=chroma (transparent by default).
  useEffect(() => {
    const color = BACKGROUNDS[bg] || "transparent";
    document.documentElement.style.background = color;
    document.body.style.setProperty("background", color, "important");
    return () => {
      document.documentElement.style.background = "transparent";
      document.body.style.setProperty("background", "transparent", "important");
    };
  }, [bg]);

  return (
    <div
      className={`fixed inset-0 overflow-hidden ${lite ? "ovl-lite" : ""}`}
      style={{ background: BACKGROUNDS[bg] || "transparent" }}
    >
      <div
        className="absolute left-0 top-0"
        style={{
          width,
          height,
          transformOrigin: "0 0",
          transform: fit ? `translate(${fit.left}px, ${fit.top}px) scale(${fit.scale})` : undefined,
          // Hidden until measured, so the first frame is never the wrong size.
          visibility: fit ? "visible" : "hidden",
          outline: debug ? "4px dashed rgba(255,0,255,0.7)" : undefined,
        }}
      >
        {debug ? (
          <>
            {/* 5% safe area */}
            <div
              className="pointer-events-none absolute border-2 border-dashed border-cyan-300/70"
              style={{ left: width * 0.05, right: width * 0.05, top: height * 0.05, bottom: height * 0.05 }}
            />
            <div className="absolute left-3 top-3 rounded bg-black/70 px-3 py-2 font-mono text-[22px] leading-snug text-cyan-200">
              canvas {width}x{height} · viewport {viewport.w}x{viewport.h} · fit {fit ? fit.scale.toFixed(3) : "-"} · bg {bg}
              {lite ? " · lite" : ""}
            </div>
          </>
        ) : null}
        {children}
      </div>
    </div>
  );
}
