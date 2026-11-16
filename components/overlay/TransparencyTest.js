"use client";

import { useEffect, useRef, useState } from "react";
import { BACKGROUNDS } from "@/lib/overlay/params";

// /overlay/test: load this as a web source in PRISM / OBS over a live camera
// view first. It answers the questions the overlay design depends on:
//   - Is the background transparent? (you see the camera behind the boxes)
//   - Is semi-transparency blended? (the 50% panel shows the camera through it)
//   - What size is the web source? Is anything cropped? (corner boxes, safe area)
//   - Does it animate smoothly, and does the app reload it? (fps, uptime)
const CORNERS = [
  { key: "tl", label: "TOP LEFT", style: { left: 0, top: 0 }, color: "#d83b31" },
  { key: "tr", label: "TOP RIGHT", style: { right: 0, top: 0 }, color: "#0b6b3a" },
  { key: "bl", label: "BOTTOM LEFT", style: { left: 0, bottom: 0 }, color: "#1c3f86" },
  { key: "br", label: "BOTTOM RIGHT", style: { right: 0, bottom: 0 }, color: "#e0720f" },
];

export default function TransparencyTest({ bg }) {
  const [info, setInfo] = useState(null);
  const [fps, setFps] = useState(0);
  const [clock, setClock] = useState("");
  const [uptime, setUptime] = useState(0);
  const startedAt = useRef(Date.now());

  // Viewport / device facts, refreshed on resize.
  useEffect(() => {
    function measure() {
      setInfo({
        w: window.innerWidth,
        h: window.innerHeight,
        dpr: window.devicePixelRatio || 1,
        screen: `${window.screen.width}x${window.screen.height}`,
        ua: navigator.userAgent,
      });
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Frames per second, measured with requestAnimationFrame.
  useEffect(() => {
    let frames = 0;
    let last = performance.now();
    let raf = 0;
    function tick(now) {
      frames += 1;
      if (now - last >= 1000) {
        setFps(Math.round((frames * 1000) / (now - last)));
        frames = 0;
        last = now;
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Wall clock and time since this page loaded (resets if the app reloads it).
  useEffect(() => {
    function update() {
      setClock(new Date().toLocaleTimeString());
      setUptime(Math.floor((Date.now() - startedAt.current) / 1000));
    }
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  // Page background for bg=solid / bg=chroma.
  useEffect(() => {
    const color = BACKGROUNDS[bg] || "transparent";
    document.documentElement.style.background = color;
    document.body.style.setProperty("background", color, "important");
  }, [bg]);

  return (
    <div className="fixed inset-0 overflow-hidden font-sans" style={{ background: BACKGROUNDS[bg] || "transparent" }}>
      {/* 5% safe area */}
      <div className="pointer-events-none absolute border-4 border-dashed border-cyan-300" style={{ inset: "5%" }} />

      {CORNERS.map((corner) => (
        <div
          key={corner.key}
          className="absolute grid h-[18vh] w-[22vw] place-items-center text-center font-display text-[3.2vh] leading-tight text-white"
          style={{ ...corner.style, background: corner.color }}
        >
          {corner.label}
        </div>
      ))}

      <div className="absolute left-1/2 top-1/2 w-[min(56vw,900px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-[#060f22] p-[2.2vh] text-white shadow-2xl">
        <p className="font-display text-[4.2vh] leading-none text-[#f4b63d]">MPL OVERLAY TEST</p>
        <p className="mt-[1vh] text-[2.1vh] font-bold leading-snug">
          If you can see your camera behind the coloured boxes and around this panel, transparency works.
        </p>
        <dl className="mt-[1.4vh] grid grid-cols-2 gap-x-[2vw] gap-y-[0.6vh] font-mono text-[2vh]">
          <dt className="text-white/60">Source size</dt>
          <dd>{info ? `${info.w} x ${info.h}` : "..."}</dd>
          <dt className="text-white/60">Pixel ratio</dt>
          <dd>{info ? info.dpr : "..."}</dd>
          <dt className="text-white/60">Screen</dt>
          <dd>{info ? info.screen : "..."}</dd>
          <dt className="text-white/60">Frames / sec</dt>
          <dd className={fps && fps < 24 ? "text-[#ff7a70]" : "text-[#8df0a8]"}>{fps || "..."}</dd>
          <dt className="text-white/60">Clock</dt>
          <dd>{clock}</dd>
          <dt className="text-white/60">Up for (s)</dt>
          <dd>{uptime}</dd>
          <dt className="text-white/60">Background</dt>
          <dd>{bg}</dd>
        </dl>
        <p className="mt-[1.2vh] break-all font-mono text-[1.4vh] text-white/50">{info?.ua}</p>
      </div>

      {/* Half-transparent strip: the camera should show through it. */}
      <div className="absolute left-[24vw] right-[24vw] top-[6vh] grid h-[9vh] place-items-center rounded-xl bg-[#0b6b3a]/50 font-display text-[3vh] text-white">
        50% SEE-THROUGH PANEL
      </div>

      {/* Moving elements: smooth motion = the source renders animations. */}
      <div className="absolute bottom-[21vh] left-0 h-[48px] w-[48px] rounded-full bg-[#f4b63d] shadow-lg" style={{ animation: "ovl-test-run 3s linear infinite alternate" }} />
      <div
        className="absolute bottom-[21vh] right-[4vw] h-[7vh] w-[7vh] rounded-full border-[0.8vh] border-white/30 border-t-[#d83b31]"
        style={{ animation: "ovl-test-spin 1s linear infinite" }}
      />
    </div>
  );
}
