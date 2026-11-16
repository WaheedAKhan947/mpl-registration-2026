"use client";

/* eslint-disable @next/next/no-img-element -- plain <img> renders identically
   inside OBS / PRISM web sources. */

import { useMemo, useState } from "react";
import { teamStyle } from "@/lib/overlay/teams";
import { fromBarEdge, stackOffsets } from "@/lib/overlay/layout";

// Full-canvas broadcast effects. Each one runs once for `duration` ms and is
// then removed by EffectsLayer. Only transform and opacity animate.

const DISMISSAL_TAGS = {
  bowled: "BOWLED",
  caught: "CAUGHT",
  lbw: "LBW",
  run_out: "RUN OUT",
  stumped: "STUMPED",
  hit_wicket: "HIT WICKET",
  obstructing_field: "OBSTRUCTING",
  retired_out: "RETIRED OUT",
};
// Dismissals drawn as the stumps being broken.
const STUMPS_BROKEN = new Set(["bowled", "lbw", "hit_wicket", "stumped", "run_out"]);

function anim(name, duration, extra = "") {
  return `${name} ${duration}ms ${extra || "cubic-bezier(0.2, 0.85, 0.25, 1)"} both`;
}

function initials(name = "") {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Photo({ batter, size, ring }) {
  const [failed, setFailed] = useState(false);
  if (!batter?.photo || failed) {
    return (
      <span
        className="grid shrink-0 place-items-center rounded-full bg-[#0b1c3d] font-display text-white"
        style={{ width: size, height: size, fontSize: size * 0.36, border: `5px solid ${ring}` }}
      >
        {initials(batter?.name)}
      </span>
    );
  }
  return (
    <img
      src={batter.photo}
      alt=""
      onError={() => setFailed(true)}
      className="shrink-0 rounded-full object-cover"
      style={{ width: size, height: size, border: `5px solid ${ring}` }}
    />
  );
}

function ReplayTag({ show }) {
  if (!show) return null;
  return (
    <span className="absolute left-[6%] top-[14%] rounded-md bg-[#d83b31] px-4 py-1.5 font-display text-[30px] tracking-[0.2em] text-white shadow-lg">
      REPLAY
    </span>
  );
}

// A full-width skewed colour band across the middle of the screen.
function Band({ color, duration, top, height, delay = 0, opacity = 1 }) {
  return (
    <div
      className="absolute"
      style={{
        left: "-12%",
        width: "124%",
        top,
        height,
        background: color,
        opacity,
        animation: anim("ovl-fx-band", duration, "cubic-bezier(0.7, 0, 0.2, 1)"),
        animationDelay: `${delay}ms`,
      }}
    />
  );
}

function batterLine(batter) {
  return batter ? `${batter.name}  ${batter.runs} (${batter.balls})` : "";
}

// ---------------------------------------------------------------- FOUR

export function FourEffect({ event, params, duration }) {
  const team = teamStyle(event.team);
  const H = params.height;
  const top = H * 0.33;
  const height = H * 0.27;
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* glowing screen edge */}
      <div
        className="absolute inset-0"
        style={{ boxShadow: `inset 0 0 0 10px ${team.accent}, inset 0 0 140px ${team.accent}`, animation: anim("ovl-fx-frame", duration, "linear") }}
      />
      <Band color={`linear-gradient(90deg, ${team.accent} 0%, ${team.accent} 100%)`} duration={duration} top={top - 18} height={height + 36} delay={60} opacity={0.9} />
      <Band color={`linear-gradient(90deg, ${team.color} 0%, #060f22 50%, ${team.color} 100%)`} duration={duration} top={top} height={height} />
      <div className="absolute inset-x-0 flex flex-col items-center justify-center" style={{ top, height }}>
        <div
          className="font-display leading-none tracking-[0.08em] text-white"
          style={{ fontSize: height * 0.72, textShadow: `0 0 40px ${team.accent}`, animation: anim("ovl-fx-word", duration) }}
        >
          FOUR
        </div>
      </div>
      <div className="absolute inset-x-0 flex justify-center" style={{ top: top + height + 34 }}>
        <span
          className="rounded-xl bg-[#060f22]/90 px-8 py-3 font-display text-[46px] tracking-[0.06em] text-white"
          style={{ animation: anim("ovl-fx-card", duration) }}
        >
          {batterLine(event.batter)}
          {event.milestone ? <span className="ml-5 text-[#f4b63d]">{event.milestone === "HUNDRED" ? "HUNDRED UP" : "FIFTY UP"}</span> : null}
        </span>
      </div>
      <ReplayTag show={event.replay} />
    </div>
  );
}

// ---------------------------------------------------------------- SIX

// Deterministic "random" numbers from the event id, so confetti is stable.
function seeded(seed) {
  let x = 0;
  for (const ch of String(seed)) x = (x * 31 + ch.charCodeAt(0)) >>> 0;
  return () => {
    x = (x * 1664525 + 1013904223) >>> 0;
    return x / 4294967296;
  };
}

export function SixEffect({ event, params, duration }) {
  const team = teamStyle(event.team);
  const W = params.width;
  const H = params.height;
  const top = H * 0.3;
  const height = H * 0.32;
  const word = event.milestone ? "MAXIMUM" : "SIX";

  const particles = useMemo(() => {
    const rand = seeded(event.id);
    const colors = ["#f4b63d", "#ffffff", team.accent, "#8a3fd1", "#d83b31"];
    return Array.from({ length: 60 }, (_, i) => {
      const angle = rand() * Math.PI * 2;
      const dist = 260 + rand() * (W * 0.42);
      return {
        key: i,
        size: 10 + Math.round(rand() * 14),
        color: colors[i % colors.length],
        dx: `${Math.round(Math.cos(angle) * dist)}px`,
        dy: `${Math.round(Math.sin(angle) * dist * 0.62)}px`,
        rot: `${Math.round(rand() * 720 - 360)}deg`,
        delay: Math.round(rand() * 160),
        round: rand() > 0.5,
      };
    });
  }, [event.id, team.accent, W]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0" style={{ animation: anim("ovl-fx-shake", duration, "linear") }}>
        <Band color="linear-gradient(90deg, #f4b63d, #f4b63d)" duration={duration} top={top - 20} height={height + 40} delay={60} opacity={0.95} />
        <Band color={`linear-gradient(90deg, #4b1d8f 0%, ${team.color} 50%, #4b1d8f 100%)`} duration={duration} top={top} height={height} />
        <div className="absolute inset-x-0 flex items-center justify-center" style={{ top, height }}>
          <div
            className="font-display leading-none tracking-[0.06em] text-white"
            style={{
              fontSize: event.milestone ? height * 0.52 : height * 0.82,
              textShadow: "0 0 30px #f4b63d, 0 0 70px #8a3fd1",
              animation: anim("ovl-fx-pop", duration),
            }}
          >
            {word}
          </div>
        </div>

        {/* confetti burst from the centre */}
        <div className="absolute" style={{ left: W / 2, top: top + height / 2 }}>
          {particles.map((p) => (
            <span
              key={p.key}
              className="absolute"
              style={{
                width: p.size,
                height: p.round ? p.size : p.size * 0.45,
                borderRadius: p.round ? "50%" : 2,
                background: p.color,
                "--dx": p.dx,
                "--dy": p.dy,
                "--rot": p.rot,
                animation: anim("ovl-fx-particle", duration * 0.7, "cubic-bezier(0.15, 0.7, 0.3, 1)"),
                animationDelay: `${p.delay}ms`,
              }}
            />
          ))}
        </div>

        {/* the ball flying over the top of the screen */}
        <div className="absolute left-0" style={{ top: H * 0.04, "--arc-w": `${W + 120}px`, animation: anim("ovl-fx-arc-x", duration, "linear") }}>
          <div style={{ "--arc-h": `${H * 0.2}px`, animation: `ovl-fx-arc-y ${duration}ms both` }}>
            <div className="relative h-[34px] w-[34px] rounded-full bg-[#d83b31] shadow-[0_0_24px_#f4b63d]">
              <span className="absolute right-[26px] top-[10px] h-[14px] w-[220px] rounded-full bg-gradient-to-l from-[#f4b63d] to-transparent opacity-80" />
            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 flex justify-center" style={{ top: top + height + 40 }}>
          <span
            className="rounded-xl bg-[#060f22]/90 px-8 py-3 font-display text-[46px] tracking-[0.06em] text-white"
            style={{ animation: anim("ovl-fx-card", duration) }}
          >
            {batterLine(event.batter)}
            {event.milestone ? <span className="ml-5 text-[#f4b63d]">{event.milestone === "HUNDRED" ? "HUNDRED UP" : "FIFTY UP"}</span> : null}
          </span>
        </div>
      </div>
      {/* white flash on top */}
      <div className="absolute inset-0 bg-white" style={{ animation: anim("ovl-fx-flash", duration, "ease-out") }} />
      <ReplayTag show={event.replay} />
    </div>
  );
}

// ---------------------------------------------------------------- WICKET

function Stumps({ broken, duration }) {
  const bail = (side) => ({
    animation: broken ? anim(side === "left" ? "ovl-fx-bail-left" : "ovl-fx-bail-right", duration, "cubic-bezier(0.25, 0.8, 0.35, 1)") : undefined,
    transformBox: "fill-box",
    transformOrigin: "center",
  });
  const stump = (x, tilt) => (
    <rect
      x={x}
      y="40"
      width="22"
      height="220"
      rx="6"
      fill="#f6e7c8"
      stroke="#b78a3e"
      strokeWidth="3"
      style={{ "--tilt": tilt, transformBox: "fill-box", transformOrigin: "50% 100%", animation: broken ? anim("ovl-fx-stump-tilt", duration) : undefined }}
    />
  );
  return (
    <svg viewBox="0 0 200 270" width="190" height="257" aria-hidden="true">
      {stump(30, "-12deg")}
      {stump(89, "4deg")}
      {stump(148, "14deg")}
      <rect x="26" y="28" width="80" height="14" rx="7" fill="#f4b63d" style={bail("left")} />
      <rect x="96" y="28" width="80" height="14" rx="7" fill="#f4b63d" style={bail("right")} />
    </svg>
  );
}

export function WicketEffect({ event, params, duration }) {
  const H = params.height;
  const top = H * 0.24;
  const height = H * 0.42;
  const type = event.wicket?.type || "";
  const tag = DISMISSAL_TAGS[type] || "OUT";
  const b = event.batter || {};
  return (
    <div className="absolute inset-0 overflow-hidden">
      <Band color="linear-gradient(90deg, #ffffff, #ffffff)" duration={duration} top={top - 16} height={height + 32} delay={60} opacity={0.9} />
      <Band color="linear-gradient(90deg, #5c0d0d 0%, #d83b31 50%, #5c0d0d 100%)" duration={duration} top={top} height={height} />

      <div className="absolute inset-x-[7%] flex items-center gap-10" style={{ top, height }}>
        <div className="shrink-0" style={{ animation: anim("ovl-fx-card", duration) }}>
          <Stumps broken={STUMPS_BROKEN.has(type)} duration={duration} />
        </div>
        <div className="min-w-0 flex-1">
          <div
            className="font-display leading-none tracking-[0.04em] text-white"
            style={{ fontSize: height * 0.36, textShadow: "0 0 34px rgba(255,255,255,0.65)", animation: anim("ovl-fx-pop", duration) }}
          >
            WICKET!
          </div>
          <span
            className="mt-3 inline-block rounded-md bg-white px-4 py-1.5 font-display text-[34px] tracking-[0.18em] text-[#b3122a]"
            style={{ animation: anim("ovl-fx-card", duration) }}
          >
            {tag}
          </span>
        </div>
        {/* dismissed batter card */}
        <div
          className="flex w-[700px] shrink-0 items-center gap-6 rounded-2xl bg-[#060f22]/95 p-6"
          style={{ animation: anim("ovl-fx-card", duration) }}
        >
          <Photo batter={b} size={150} ring="#f4b63d" />
          <div className="min-w-0">
            <div className="truncate font-display text-[46px] leading-none tracking-[0.04em] text-white">{(b.name || "").toUpperCase()}</div>
            <div className="mt-2 truncate text-[26px] font-bold text-white/80">{event.wicket?.text || ""}</div>
            <div className="mt-3 font-display text-[60px] leading-none text-[#f4b63d]">
              {b.runs ?? 0}
              <span className="ml-2 text-[34px] text-white/80">({b.balls ?? 0})</span>
            </div>
            <div className="mt-2 whitespace-nowrap text-[24px] font-extrabold uppercase tracking-wider text-white/70">
              4s {b.fours ?? 0} · 6s {b.sixes ?? 0} · SR {(b.strikeRate ?? 0).toFixed(1)}
            </div>
          </div>
        </div>
      </div>

      {event.bowler ? (
        <div className="absolute inset-x-0 flex justify-center" style={{ top: top + height + 34 }}>
          <span
            className="rounded-xl bg-[#060f22]/90 px-8 py-3 font-display text-[40px] tracking-[0.06em] text-white"
            style={{ animation: anim("ovl-fx-card", duration) }}
          >
            {event.bowler.name.toUpperCase()} <span className="ml-3 text-[#f4b63d]">{event.bowler.figures}</span>
          </span>
        </div>
      ) : null}

      <div className="absolute inset-0 bg-[#d83b31]" style={{ animation: anim("ovl-fx-flash", duration, "ease-out") }} />
      <ReplayTag show={event.replay} />
    </div>
  );
}

// ---------------------------------------------------------------- milestones

// FIFTY / HUNDRED: a badge with the batter's photo.
export function MilestoneEffect({ event, params, duration }) {
  const team = teamStyle(event.team);
  const hundred = event.type === "HUNDRED";
  const b = event.batter || {};
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0" style={{ boxShadow: `inset 0 0 0 10px #f4b63d, inset 0 0 160px #f4b63d`, animation: anim("ovl-fx-frame", duration, "linear") }} />
      <div className="absolute inset-x-0 flex justify-center" style={{ top: params.height * 0.2 }}>
        <div
          className="flex items-center gap-10 rounded-[28px] px-14 py-10 shadow-[0_24px_70px_rgba(0,0,0,0.55)]"
          style={{
            background: `linear-gradient(120deg, ${team.color} 0%, #060f22 60%, ${hundred ? "#8a6a12" : team.color} 120%)`,
            border: "4px solid #f4b63d",
            animation: anim("ovl-fx-pop", duration),
          }}
        >
          <Photo batter={b} size={220} ring="#f4b63d" />
          <div className="text-white">
            <div className="font-display text-[44px] leading-none tracking-[0.2em] text-[#f4b63d]">{hundred ? "HUNDRED" : "FIFTY"}</div>
            <div className="font-display leading-[0.9] text-white" style={{ fontSize: 230, textShadow: "0 0 40px rgba(244,182,61,0.6)" }}>
              {hundred ? "100" : "50"}
            </div>
            <div className="mt-2 max-w-[760px] truncate font-display text-[52px] leading-none tracking-[0.04em]">{(b.name || "").toUpperCase()}</div>
            <div className="mt-3 text-[28px] font-extrabold uppercase tracking-wider text-white/80">
              {b.runs} off {b.balls} balls · 4s {b.fours} · 6s {b.sixes} · SR {(b.strikeRate ?? 0).toFixed(1)}
            </div>
          </div>
        </div>
      </div>
      <ReplayTag show={event.replay} />
    </div>
  );
}

// HAT-TRICK: three in three for the bowler.
export function HatTrickEffect({ event, params, duration }) {
  const team = teamStyle(event.team);
  const H = params.height;
  const top = H * 0.26;
  const height = H * 0.38;
  const bowler = event.bowler || {};
  return (
    <div className="absolute inset-0 overflow-hidden">
      <Band color="linear-gradient(90deg, #ffffff, #ffffff)" duration={duration} top={top - 16} height={height + 32} delay={60} opacity={0.9} />
      <Band color={`linear-gradient(90deg, #8a6a12 0%, #f4b63d 50%, ${team.color} 100%)`} duration={duration} top={top} height={height} />
      <div className="absolute inset-x-[8%] flex items-center justify-center gap-12" style={{ top, height }}>
        <div style={{ animation: anim("ovl-fx-card", duration) }}>
          <Photo batter={bowler} size={240} ring="#060f22" />
        </div>
        <div>
          <div
            className="font-display leading-none tracking-[0.04em] text-[#060f22]"
            style={{ fontSize: height * 0.4, animation: anim("ovl-fx-pop", duration) }}
          >
            HAT-TRICK!
          </div>
          <div className="mt-3 font-display text-[54px] leading-none tracking-[0.05em] text-white" style={{ animation: anim("ovl-fx-card", duration) }}>
            {(bowler.name || "").toUpperCase()} <span className="ml-3 text-[#060f22]">{bowler.figures}</span>
          </div>
        </div>
      </div>
      <div className="absolute inset-0 bg-[#f4b63d]" style={{ animation: anim("ovl-fx-flash", duration, "ease-out") }} />
      <ReplayTag show={event.replay} />
    </div>
  );
}

// ---------------------------------------------------------------- small banners

// FREE HIT: a banner across the top while the next ball is a free hit.
export function FreeHitEffect({ event, params, duration }) {
  return (
    <div className="absolute inset-x-0 flex justify-center" style={{ top: params.height * 0.14 }}>
      <div
        className="flex items-center gap-6 overflow-hidden rounded-2xl px-12 py-5 shadow-[0_18px_50px_rgba(0,0,0,0.5)]"
        style={{
          background: "repeating-linear-gradient(-45deg, #f4b63d 0 34px, #ffd36b 34px 68px)",
          animation: anim("ovl-fx-pop", duration),
        }}
      >
        <span className="font-display text-[120px] leading-none tracking-[0.08em] text-[#060f22]">FREE HIT</span>
        {event.batter ? (
          <span className="rounded-xl bg-[#060f22] px-5 py-3 font-display text-[36px] tracking-[0.05em] text-white">
            {event.batter.name.toUpperCase()} ON STRIKE
          </span>
        ) : null}
      </div>
    </div>
  );
}

function overChipStyle(label) {
  if (label === "W" || label === "RO") return { background: "#d83b31", color: "#fff" };
  if (label === "6") return { background: "linear-gradient(135deg,#8a3fd1,#4b1d8f)", color: "#fff" };
  if (label === "4") return { background: "#f4b63d", color: "#060f22" };
  if (/Wd|Nb|B|Lb|P|RH/.test(label)) return { background: "#16305c", color: "#fff" };
  return { background: "rgba(255,255,255,0.92)", color: "#060f22" };
}

// End of an over: runs and wickets in it, the balls, the bowler's figures.
export function OverEffect({ event, params, duration }) {
  const maiden = event.type === "MAIDEN";
  const W = params.width;
  return (
    <div
      className="absolute flex items-center gap-8 rounded-2xl bg-[#060f22]/95 px-8 py-5 shadow-[0_18px_50px_rgba(0,0,0,0.55)] ring-2"
      style={{
        left: W * 0.05,
        right: W * 0.05,
        ...fromBarEdge(params, stackOffsets(params).over),
        "--tw-ring-color": maiden ? "#f4b63d" : "rgba(255,255,255,0.15)",
        animation: anim("ovl-fx-card", duration),
      }}
    >
      <div className="shrink-0">
        <div className="text-[20px] font-black uppercase tracking-[0.22em] text-[#f4b63d]">{maiden ? "Maiden over" : `End of over ${event.over}`}</div>
        <div className="mt-1 font-display text-[54px] leading-none text-white">
          {event.runs} {event.runs === 1 ? "RUN" : "RUNS"}
          {event.wickets ? <span className="ml-4 text-[#ff8a80]">{event.wickets} {event.wickets === 1 ? "WKT" : "WKTS"}</span> : null}
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2.5">
        {(event.balls || []).map((label, i) => (
          <span key={i} className="grid h-[54px] min-w-[54px] place-items-center rounded-full px-2 font-display text-[26px] leading-none" style={overChipStyle(label)}>
            {label}
          </span>
        ))}
      </div>
      <div className="shrink-0 text-right">
        <div className="font-display text-[34px] leading-none tracking-[0.04em] text-white">{(event.bowler?.name || "").toUpperCase()}</div>
        <div className="mt-1 font-display text-[40px] leading-none text-[#f4b63d]">{event.bowler?.figures}</div>
        <div className="mt-1 text-[20px] font-extrabold uppercase tracking-wider text-white/70">
          {event.score} · CRR {(event.runRate ?? 0).toFixed(2)}
        </div>
      </div>
      <ReplayTag show={event.replay} />
    </div>
  );
}

// ---------------------------------------------------------------- light mode

const LITE_WORDS = {
  FOUR: "FOUR",
  SIX: "SIX",
  WICKET: "WICKET!",
  FIFTY: "FIFTY",
  HUNDRED: "HUNDRED",
  HATTRICK: "HAT-TRICK!",
  FREE_HIT: "FREE HIT",
  OVER: "END OF OVER",
  MAIDEN: "MAIDEN OVER",
};

const LITE_COLORS = { WICKET: "#b3122a", SIX: "#4b1d8f", HATTRICK: "#8a6a12", FREE_HIT: "#b07d10", FIFTY: "#8a6a12", HUNDRED: "#8a6a12" };

// ?lite=1: one simple card that fades in and out. No flash, shake or particles.
export function LiteEffect({ event, params, duration }) {
  const team = teamStyle(event.team);
  const word = event.type === "SIX" && event.milestone ? "MAXIMUM" : LITE_WORDS[event.type] || event.type;
  const color = LITE_COLORS[event.type] || team.color;
  let line = batterLine(event.batter);
  if (event.type === "HATTRICK") line = `${event.bowler?.name || ""}  ${event.bowler?.figures || ""}`;
  if (event.type === "OVER" || event.type === "MAIDEN") line = `${event.runs} runs · ${event.bowler?.name || ""} ${event.bowler?.figures || ""}`;
  return (
    <div className="absolute inset-x-0 flex justify-center" style={{ top: params.height * 0.3 }}>
      <div
        className="ovl-lite-anim flex flex-col items-center rounded-2xl px-16 py-8 text-white"
        style={{ background: color, animation: `ovl-fx-fade ${duration}ms ease-out both` }}
      >
        {event.replay ? <span className="mb-2 font-display text-[28px] tracking-[0.2em] text-[#f4b63d]">REPLAY</span> : null}
        <span className="font-display text-[150px] leading-none tracking-[0.06em]">{word}</span>
        {line ? <span className="mt-3 font-display text-[40px] tracking-[0.05em]">{line}</span> : null}
        {event.type === "WICKET" && event.wicket?.text ? <span className="mt-1 text-[26px] font-bold opacity-85">{event.wicket.text}</span> : null}
      </div>
    </div>
  );
}
