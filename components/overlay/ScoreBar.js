/* eslint-disable @next/next/no-img-element -- overlay badges are plain <img>
   so they render identically inside OBS / PRISM web sources. */

import { teamStyle } from "@/lib/overlay/teams";
import { resultText } from "@/lib/overlay/format";

// The always-on score bar. `data` is the GET /api/matches/[id]/live shape.
// All sizes are canvas pixels (the canvas is scaled to fit the web source).

function scoreText(inn) {
  if (!inn) return "0/0";
  return inn.wickets >= 10 ? String(inn.runs) : `${inn.runs}/${inn.wickets}`;
}

// Long names shrink before they truncate.
function nameSize(name = "", base) {
  if (name.length > 19) return base - 6;
  if (name.length > 14) return base - 3;
  return base;
}

// Team colour with transparency (#rrggbb -> #rrggbbaa), so the camera shows
// through the bar a little.
function seeThrough(hex, alpha = "D9") {
  return /^#[0-9a-f]{6}$/i.test(hex) ? `${hex}${alpha}` : hex;
}

// The bar's panels: slightly see-through, with a light blur behind them so
// the text stays readable over a busy picture (no blur in lite mode).
const GLASS = "backdrop-blur-[6px]";

function chipStyle(label) {
  if (label === "W" || label === "RO") return { background: "#d83b31", color: "#fff" };
  if (label === "6") return { background: "linear-gradient(135deg,#8a3fd1,#4b1d8f)", color: "#fff" };
  if (label === "4") return { background: "#f4b63d", color: "#060f22" };
  if (/Wd|Nb|B|Lb|P|RH/.test(label)) return { background: "#16305c", color: "#fff" };
  return { background: "rgba(255,255,255,0.92)", color: "#060f22" };
}

function Badge({ team, size }) {
  return team.logo ? (
    <img src={team.logo} alt="" width={size} height={size} style={{ width: size, height: size }} className="shrink-0 object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.45)]" />
  ) : (
    <span
      className="grid shrink-0 place-items-center rounded-full font-display text-white"
      style={{ width: size, height: size, background: team.color, fontSize: size * 0.34 }}
    >
      {team.short}
    </span>
  );
}

// A value that rolls into place whenever it changes: the key changes with the
// value, so React mounts a fresh element and the CSS animation replays.
function Roll({ value, className = "" }) {
  return (
    <span key={String(value)} className={`ovl-roll ${className}`}>
      {value}
    </span>
  );
}

function BatterLine({ batter, onStrike }) {
  if (!batter) {
    // After a wicket, until the scorer picks the next batter.
    return (
      <div className="flex h-[38px] items-center gap-3">
        <span className="w-[16px] shrink-0 font-display text-[22px] leading-none text-[#f4b63d]">{onStrike ? "▸" : ""}</span>
        <span className="text-[20px] font-extrabold uppercase tracking-[0.18em] text-white/45">New batter</span>
      </div>
    );
  }
  return (
    <div className="flex h-[38px] min-w-0 items-center gap-3">
      <span className="w-[16px] shrink-0 font-display text-[22px] leading-none text-[#f4b63d]">{onStrike ? "▸" : ""}</span>
      <span
        className="min-w-0 flex-1 truncate font-extrabold uppercase tracking-wide"
        style={{ fontSize: nameSize(batter.name, 23), color: onStrike ? "#fff" : "rgba(255,255,255,0.78)" }}
      >
        {batter.name}
        {onStrike ? "*" : ""}
      </span>
      <Roll value={batter.runs} className="shrink-0 font-display text-[30px] leading-none tabular-nums text-white" />
      <span className="w-[54px] shrink-0 text-[20px] font-bold tabular-nums text-white/60">({batter.balls})</span>
    </div>
  );
}

// Before the first ball (or for a match that is not scored ball by ball):
// the two teams, plus the toss, start time or result.
function MatchUpBar({ data, params }) {
  const { match, situation } = data;
  const a = teamStyle(match.teamA);
  const b = teamStyle(match.teamB);
  let line;
  if (situation?.type === "toss" && situation.winner) {
    line = `${teamStyle(situation.winner).label} won the toss and chose to ${situation.decision === "bowl" ? "bowl" : "bat"}`;
  } else if (match.result) {
    line = match.result;
  } else {
    line = match.time ? `Starts ${match.time}${match.venue ? ` · ${match.venue}` : ""}` : "Starting soon";
  }
  const top = params.position === "top";
  const side = (team, align) => (
    <div
      className={`flex min-w-0 flex-1 items-center gap-4 px-6 ${align === "right" ? "flex-row-reverse text-right" : ""}`}
      style={{
        height: 92,
        background: `linear-gradient(${align === "right" ? 255 : 105}deg, ${seeThrough(team.color)} 0%, ${seeThrough(team.color)} 60%, rgba(6,15,34,0.8) 140%)`,
      }}
    >
      <Badge team={team} size={70} />
      <span className="truncate font-display text-[38px] leading-none tracking-[0.06em] text-white">{team.label}</span>
    </div>
  );
  return (
    <div
      className={`absolute ${top ? "ovl-enter-top" : "ovl-enter-bottom"}`}
      style={{ left: params.width * 0.05, right: params.width * 0.05, ...(top ? { top: params.height * 0.05 } : { bottom: params.height * 0.05 }) }}
    >
      <div className={`flex overflow-hidden rounded-2xl shadow-[0_14px_40px_rgba(0,0,0,0.45)] ring-1 ring-white/10 ${GLASS}`}>
        {side(a, "left")}
        <div className="grid w-[120px] shrink-0 place-items-center bg-[#060f22]/80 font-display text-[36px] text-[#f4b63d]" style={{ height: 92 }}>
          VS
        </div>
        {side(b, "right")}
      </div>
      <div className="mt-3 flex justify-center">
        <span className="rounded-full bg-[#060f22]/85 px-6 py-2 text-[22px] font-extrabold uppercase tracking-wider text-white shadow-lg">{line}</span>
      </div>
    </div>
  );
}

export default function ScoreBar({ data, params }) {
  const { match, innings = [], now, situation } = data || {};
  if (!match) return null;
  if (!now) return <MatchUpBar data={data} params={params} />;

  const current = innings.find((i) => i.number === now?.inningsNumber) || innings[innings.length - 1] || null;
  const batting = teamStyle(now?.battingTeam || current?.battingTeam || match.teamA);
  const bowling = teamStyle(now?.bowlingTeam || current?.bowlingTeam || match.teamB);
  const chasing = situation?.type === "chase" && current?.target;
  const portrait = params.layout === "portrait";
  const top = params.position === "top";

  const marginX = params.width * 0.05;
  const marginY = params.height * 0.05;

  const chips = (
    <div className={`flex items-center gap-2 rounded-full bg-[#060f22]/80 py-1.5 pl-5 pr-2 shadow-lg ${GLASS}`}>
      <span className="mr-2 font-display text-[18px] tracking-[0.18em] text-white/70">RECENT</span>
      {(now?.recentBalls || []).map((ball, i) => (
        // Keyed by ball id, so only a newly bowled ball mounts (and pops in).
        <span
          key={ball.id || `${i}-${ball.label}`}
          className="ovl-chip-in grid h-[36px] min-w-[36px] place-items-center rounded-full px-2 font-display text-[18px] leading-none tabular-nums"
          style={chipStyle(ball.label)}
        >
          {ball.label}
        </span>
      ))}
      {now?.freeHit ? (
        <span className="ml-2 rounded-full bg-[#f4b63d] px-4 py-2 font-display text-[18px] leading-none tracking-wider text-[#060f22]">
          FREE HIT
        </span>
      ) : null}
    </div>
  );

  const teamBlock = (
    <div
      className="relative flex shrink-0 items-center gap-4 overflow-hidden px-6"
      style={{
        width: portrait ? "100%" : 470,
        height: 104,
        background: `linear-gradient(105deg, ${seeThrough(batting.color)} 0%, ${seeThrough(batting.color)} 55%, rgba(6,15,34,0.8) 130%)`,
      }}
    >
      <Badge team={batting} size={82} />
      <div className="min-w-0">
        <div className="font-display text-[22px] leading-none tracking-[0.12em]" style={{ color: batting.accent }}>
          {batting.label}
        </div>
        <div className="mt-1 flex items-baseline gap-3">
          <Roll value={scoreText(current)} className="font-display text-[62px] leading-none tabular-nums text-white" />
          <span className="font-display text-[26px] leading-none tabular-nums text-white/80">({current?.overs || "0.0"})</span>
        </div>
      </div>
    </div>
  );

  const playersBlock = (
    <div className="flex min-w-0 flex-1 items-center gap-6 bg-[#060f22]/[0.8] px-7" style={{ height: 104 }}>
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <BatterLine batter={now?.striker} onStrike />
        <BatterLine batter={now?.nonStriker} />
      </div>
      <div className="h-[70px] w-[2px] shrink-0 bg-white/15" />
      <div className="flex w-[300px] shrink-0 flex-col justify-center">
        <span className="text-[14px] font-black uppercase tracking-[0.2em] text-[#f4b63d]">Bowler</span>
        {now?.bowler ? (
          <>
            <span className="truncate font-extrabold uppercase tracking-wide text-white" style={{ fontSize: nameSize(now.bowler.name, 22) }}>
              {now.bowler.name}
            </span>
            <Roll
              value={`${now.bowler.overs}-${now.bowler.maidens}-${now.bowler.runs}-${now.bowler.wickets}`}
              className="font-display text-[28px] leading-none tabular-nums text-white"
            />
          </>
        ) : (
          <span className="text-[20px] font-extrabold uppercase tracking-[0.18em] text-white/45">New bowler</span>
        )}
      </div>
    </div>
  );

  const infoBlock = (
    <div
      className="flex shrink-0 items-center gap-4 px-6"
      style={{
        width: portrait ? "100%" : 400,
        height: 104,
        background: "linear-gradient(105deg, rgba(6,15,34,0.85) -20%, rgba(11,28,61,0.82) 40%, rgba(22,48,92,0.82) 100%)",
      }}
    >
      <div className="min-w-0 flex-1">
        {situation?.type === "result" ? (
          <>
            <div className="text-[16px] font-black uppercase tracking-[0.2em] text-[#f4b63d]">Result</div>
            <div className="mt-1 font-display text-[26px] leading-[1.05] text-white">{resultText(situation, match)}</div>
          </>
        ) : situation?.type === "break" ? (
          <>
            <div className="font-display text-[34px] leading-none text-white">INNINGS BREAK</div>
            {/* The badge beside this is the chasing side. */}
            <div className="mt-1.5 text-[19px] font-extrabold uppercase tracking-wider text-white/75">
              Target <span className="text-[#f4b63d]">{situation.target}</span>
            </div>
          </>
        ) : chasing ? (
          <>
            <div className="font-display text-[38px] leading-none text-white">
              NEED <Roll value={now.runsNeeded} className="text-[#f4b63d]" /> OFF <Roll value={now.ballsRemaining} />
            </div>
            <div className="mt-1.5 text-[18px] font-extrabold uppercase tracking-wider text-white/75">
              Target {current.target} · RRR {now.requiredRate !== null ? now.requiredRate.toFixed(2) : "-"}
            </div>
          </>
        ) : (
          <>
            <div className="font-display text-[38px] leading-none text-white">
              CRR <span className="text-[#f4b63d]">{(now?.runRate ?? 0).toFixed(2)}</span>
            </div>
            <div className="mt-1.5 text-[18px] font-extrabold uppercase tracking-wider text-white/75">
              Inn {current?.number || 1}
              {now?.partnership ? ` · P'ship ${now.partnership.runs} (${now.partnership.balls})` : ""}
            </div>
          </>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-center gap-1">
        <Badge team={bowling} size={54} />
        <span className="font-display text-[14px] tracking-[0.14em] text-white/70">{bowling.short}</span>
      </div>
    </div>
  );

  return (
    <div
      className={`absolute flex flex-col gap-3 ${top ? "ovl-enter-top" : "ovl-enter-bottom"}`}
      style={{
        left: marginX,
        right: marginX,
        ...(top ? { top: marginY } : { bottom: marginY }),
      }}
    >
      <div
        className={`flex overflow-hidden rounded-2xl shadow-[0_14px_40px_rgba(0,0,0,0.45)] ring-1 ring-white/10 ${GLASS} ${portrait ? "flex-col" : "flex-row"}`}
      >
        {teamBlock}
        {playersBlock}
        {infoBlock}
      </div>
      {/* Recent balls under the bar. The logo and LIVE tag are a separate
          corner graphic (CornerBug). */}
      {now.recentBalls?.length ? (
        <div className={`flex items-center gap-3 ${portrait ? "justify-center" : "justify-end"}`}>{chips}</div>
      ) : null}
    </div>
  );
}
