"use client";

import { Photo } from "@/components/overlay/Effects";
import { teamStyle } from "@/lib/overlay/teams";
import { fromBarEdge, stackOffsets } from "@/lib/overlay/layout";

// Lower-third player cards. They sit above the score bar and over-summary
// panel and slide in from the left (kept in lite mode: .ovl-lite-anim).
//   NEW_BATTER   a batter walking in after a wicket (automatic)
//   PLAYER_CARD  any playing-XI player, on the stream operator's request
// Numbers are tournament totals from finished, ball-by-ball scored matches.

function Chip({ label, value }) {
  return (
    <span className="rounded-lg bg-white/[0.08] px-3 py-1.5 text-[22px] font-bold uppercase tracking-wide">
      <span className="text-white/60">{label}</span> <span className="font-display text-[26px] text-[#f4b63d]">{value}</span>
    </span>
  );
}

function Note({ children }) {
  return <span className="rounded-lg bg-white/[0.08] px-3 py-1.5 text-[22px] font-bold uppercase tracking-wide text-[#f4b63d]">{children}</span>;
}

function battingChips(c) {
  if (!c?.innings) return [];
  return [
    ["Matches", c.matches],
    ["Runs", c.runs],
    ["Avg", c.average ?? "–"],
    ["SR", c.strikeRate ? Number(c.strikeRate).toFixed(1) : "–"],
    ["Best", c.highest || "–"],
  ];
}

function bowlingChips(c) {
  if (!c?.bowlingInnings) return [];
  return [
    ["Wkts", c.wickets],
    ["Econ", c.economy ?? "–"],
    ["BBI", c.bestBowling || "–"],
  ];
}

function Card({ event, params, duration, heading, detail, children }) {
  const team = teamStyle(event.team);
  const b = event.batter || {};
  return (
    <div
      className="ovl-lite-anim absolute flex items-stretch overflow-hidden rounded-2xl shadow-[0_18px_50px_rgba(0,0,0,0.55)]"
      style={{
        left: params.width * 0.05,
        ...fromBarEdge(params, stackOffsets(params).card),
        animation: `ovl-card-slide ${duration}ms cubic-bezier(0.2, 0.85, 0.25, 1) both`,
      }}
    >
      <div className="flex items-center px-5 py-4" style={{ background: team.color }}>
        <Photo batter={b} size={130} ring={team.accent} />
      </div>
      <div className={`min-w-[620px] ${params.layout === "portrait" ? "max-w-[780px]" : "max-w-[880px]"} bg-[#060f22]/95 px-7 py-4 text-white`}>
        <div className="text-[20px] font-black uppercase tracking-[0.22em]" style={{ color: team.accent }}>
          {heading} · {team.label}
        </div>
        <div className="mt-1 truncate font-display text-[56px] leading-none tracking-[0.04em]">{(b.name || "").toUpperCase()}</div>
        <div className="mt-1 text-[22px] font-extrabold uppercase tracking-wider text-white/70">{detail}</div>
        <div className="mt-3 flex flex-wrap gap-2">{children}</div>
      </div>
    </div>
  );
}

export function NewBatterCard({ event, params, duration }) {
  const chips = battingChips(event.career);
  return (
    <Card
      event={event}
      params={params}
      duration={duration}
      heading="New batter"
      detail={`${event.batter?.role || "Batter"}${event.score ? ` · comes in at ${event.score}` : ""}`}
    >
      {chips.length ? chips.map(([label, value]) => <Chip key={label} label={label} value={value} />) : <Note>First MPL innings</Note>}
    </Card>
  );
}

// "Today: 34* (21) · 2-18 (3.0)" from this match's figures.
function todayText(today) {
  const parts = [];
  if (today?.batting) parts.push(`${today.batting.runs}${today.batting.out ? "" : "*"} (${today.batting.balls})`);
  if (today?.bowling) parts.push(`${today.bowling.wickets}-${today.bowling.runs} (${today.bowling.overs})`);
  return parts.length ? `Today ${parts.join(" · ")}` : "";
}

export function PlayerCard({ event, params, duration }) {
  const bat = battingChips(event.career);
  const bowl = bowlingChips(event.career);
  const today = todayText(event.today);
  return (
    <Card
      event={event}
      params={params}
      duration={duration}
      heading="Player"
      detail={[event.batter?.role || "Player", today].filter(Boolean).join(" · ")}
    >
      {bat.map(([label, value]) => (
        <Chip key={`bat-${label}`} label={label} value={value} />
      ))}
      {bowl.map(([label, value]) => (
        <Chip key={`bowl-${label}`} label={label} value={value} />
      ))}
      {!bat.length && !bowl.length ? <Note>First MPL match</Note> : null}
    </Card>
  );
}

export const CARD_COMPONENTS = { NEW_BATTER: NewBatterCard, PLAYER_CARD: PlayerCard };
