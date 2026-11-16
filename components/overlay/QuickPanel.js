"use client";

import { teamStyle } from "@/lib/overlay/teams";
import { fromBarEdge, stackOffsets } from "@/lib/overlay/layout";

// Small panels above the score bar, switched on by the stream operator
// (Admin > Stream Overlay): the current partnership, or the run rates.
// They sit at the right, clear of the lower-third cards on the left.

function ballsOf(overs) {
  const [o, b] = String(overs || "0.0").split(".").map(Number);
  return (o || 0) * 6 + (b || 0);
}

function Shell({ params, title, accent, children }) {
  return (
    <div
      className="ovl-lite-anim ovl-screen-in absolute w-[620px] overflow-hidden rounded-2xl bg-[#060f22]/95 text-white shadow-[0_18px_50px_rgba(0,0,0,0.5)]"
      style={{
        right: params.width * 0.05,
        ...fromBarEdge(params, stackOffsets(params).panel),
        borderTop: `6px solid ${accent}`,
      }}
      data-panel={title}
    >
      <div className="px-6 pb-4 pt-3">{children}</div>
    </div>
  );
}

function Label({ children, color }) {
  return (
    <div className="text-[20px] font-black uppercase tracking-[0.22em]" style={{ color }}>
      {children}
    </div>
  );
}

export function PartnershipPanel({ data, params }) {
  const now = data.now;
  if (!now) return null;
  const team = teamStyle(now.battingTeam);
  const p = now.partnership || { runs: 0, balls: 0 };
  const batters = [now.striker, now.nonStriker].filter(Boolean);
  return (
    <Shell params={params} title="partnership" accent={team.accent}>
      <div className="flex items-end justify-between">
        <Label color={team.accent}>Partnership · {team.label}</Label>
        <div className="font-display leading-none">
          <span className="text-[64px]">{p.runs}</span>
          <span className="ml-2 text-[30px] text-white/70">({p.balls})</span>
        </div>
      </div>
      <div className="mt-2 grid gap-1">
        {batters.map((b) => (
          <div key={b.id || b.name} className="flex items-center justify-between text-[26px] font-extrabold uppercase">
            <span className="truncate pr-4">{b.name}</span>
            <span className="font-display text-[30px] text-[#f4b63d]">
              {b.runs} <span className="text-white/60">({b.balls})</span>
            </span>
          </div>
        ))}
      </div>
      {now.lastWicket ? (
        <div className="mt-2 truncate border-t border-white/10 pt-2 text-[20px] font-bold uppercase tracking-wide text-white/65">
          Last wicket: {now.lastWicket.name} {now.lastWicket.runs} ({now.lastWicket.balls}) at {now.lastWicket.score}
        </div>
      ) : null}
    </Shell>
  );
}

export function RunRatePanel({ data, params }) {
  const now = data.now;
  if (!now) return null;
  const team = teamStyle(now.battingTeam);
  const current = (data.innings || []).find((i) => i.number === now.inningsNumber);
  const chasing = now.runsNeeded !== null && now.runsNeeded !== undefined;
  const quota = current?.quotaOvers;
  let projected = null;
  if (!chasing && current && quota) {
    const bowled = ballsOf(current.overs);
    const left = Math.max(0, quota * 6 - bowled);
    projected = Math.round(current.runs + (Number(now.runRate) || 0) * (left / 6));
  }
  const cell = (label, value, highlight) => (
    <div className="rounded-xl bg-white/[0.07] px-4 py-2 text-center">
      <div className="text-[18px] font-black uppercase tracking-[0.18em] text-white/60">{label}</div>
      <div className={`font-display text-[52px] leading-none ${highlight ? "text-[#f4b63d]" : ""}`}>{value}</div>
    </div>
  );
  return (
    <Shell params={params} title="runrate" accent={team.accent}>
      <Label color={team.accent}>Run rate · {team.label}</Label>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {cell("Current", Number(now.runRate || 0).toFixed(2))}
        {chasing
          ? cell("Required", now.requiredRate !== null && now.requiredRate !== undefined ? Number(now.requiredRate).toFixed(2) : "-", true)
          : cell("Projected", projected ?? "-", true)}
      </div>
      {chasing ? (
        <div className="mt-3 text-center font-display text-[34px] tracking-[0.04em]">
          NEED <span className="text-[#f4b63d]">{now.runsNeeded}</span> OFF {now.ballsRemaining} {now.ballsRemaining === 1 ? "BALL" : "BALLS"}
        </div>
      ) : quota ? (
        <div className="mt-3 text-center text-[20px] font-bold uppercase tracking-wide text-white/65">At this rate after {quota} overs</div>
      ) : null}
    </Shell>
  );
}

export default function QuickPanel({ panel, data, params }) {
  if (panel === "partnership") return <PartnershipPanel data={data} params={params} />;
  if (panel === "runrate") return <RunRatePanel data={data} params={params} />;
  return null;
}
