/* eslint-disable @next/next/no-img-element -- plain <img> renders identically
   inside OBS / PRISM web sources. */

// The broadcast "bug": MPL logo and a LIVE tag in a corner of the screen.
// Top-left by default; bottom-left when the score bar is at the top, so the
// two never collide. Sizes are canvas pixels.
export default function CornerBug({ match, params, live = true }) {
  const marginX = params.width * 0.05;
  const marginY = params.height * 0.05;
  const atBottom = params.position === "top";

  return (
    <div
      className={`absolute flex items-center gap-4 ${atBottom ? "ovl-enter-bottom" : "ovl-enter-top"}`}
      style={{ left: marginX, ...(atBottom ? { bottom: marginY } : { top: marginY }) }}
    >
      <div className="flex items-center gap-3 rounded-xl bg-[#060f22]/90 py-2 pl-2 pr-4 shadow-[0_10px_26px_rgba(0,0,0,0.5)] ring-1 ring-[#f4b63d]/40">
        <img src="/logo.png" alt="" width={64} height={64} className="h-[64px] w-[64px] object-contain drop-shadow-[0_4px_10px_rgba(244,182,61,0.35)]" />
        <div className="leading-none">
          <div className="font-display text-[34px] tracking-[0.1em] text-white">MPL</div>
          <div className="mt-1.5 font-display text-[16px] tracking-[0.14em] text-[#f4b63d]">
            SEASON 2026{match?.matchNumber ? ` · MATCH ${match.matchNumber}` : ""}
          </div>
        </div>
      </div>
      {live ? (
        <span className="flex items-center gap-2 self-start rounded-lg bg-[#d83b31] px-3.5 py-2 font-display text-[24px] leading-none tracking-[0.12em] text-white shadow-[0_10px_26px_rgba(0,0,0,0.5)]">
          <span className="ovl-live-dot h-[11px] w-[11px] rounded-full bg-white" />
          LIVE
        </span>
      ) : null}
    </div>
  );
}
