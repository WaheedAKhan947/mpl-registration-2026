"use client";

/* eslint-disable @next/next/no-img-element -- plain <img> renders identically
   inside OBS / PRISM web sources. */

import { useEffect, useState } from "react";
import { Photo } from "@/components/overlay/Effects";
import { teamStyle } from "@/lib/overlay/teams";
import { resultText, scoreText, tossText } from "@/lib/overlay/format";
import { formatMatchDate } from "@/lib/matches";
import { BUG_HEIGHT } from "@/components/overlay/CornerBug";

// Full-screen broadcast screens: coming up, toss, playing XIs, innings break
// and result. They sit inside the 5% safe area over a dark panel; the score
// bar is hidden while one is up. Sizes are canvas pixels.

const ROTATE_MS = 10000;

function Badge({ team, size }) {
  return team.logo ? (
    <img src={team.logo} alt="" width={size} height={size} style={{ width: size, height: size }} className="shrink-0 object-contain drop-shadow-[0_10px_24px_rgba(0,0,0,0.5)]" />
  ) : (
    <span className="grid shrink-0 place-items-center rounded-full font-display text-white" style={{ width: size, height: size, background: team.color, fontSize: size * 0.32 }}>
      {team.short}
    </span>
  );
}

// `fit`: only as tall as its content (capped at the full space).
function Panel({ params, children, accent = "#f4b63d", fit = false }) {
  const top = params.height * 0.05 + BUG_HEIGHT + 8;
  return (
    <div
      className="ovl-screen-in absolute flex flex-col overflow-hidden rounded-[32px] text-white shadow-[0_30px_90px_rgba(0,0,0,0.6)]"
      style={{
        left: params.width * 0.05,
        right: params.width * 0.05,
        top,
        ...(fit ? { maxHeight: params.height * 0.95 - top } : { bottom: params.height * 0.05 }),
        background: "linear-gradient(160deg, rgba(11,28,61,0.96) 0%, rgba(6,15,34,0.97) 55%, rgba(6,48,28,0.96) 100%)",
        border: `3px solid ${accent}`,
      }}
    >
      {children}
    </div>
  );
}

function Heading({ children, sub }) {
  return (
    <div className="px-12 pt-6 text-center">
      <div className="font-display text-[64px] leading-none tracking-[0.12em] text-[#f4b63d]">{children}</div>
      {sub ? <div className="mt-2 text-[26px] font-extrabold uppercase tracking-[0.2em] text-white/70">{sub}</div> : null}
    </div>
  );
}

// ---------------------------------------------------------------- before the toss

export function ComingUpScreen({ data, params }) {
  const { match } = data;
  const a = teamStyle(match.teamA);
  const b = teamStyle(match.teamB);
  const when = [formatMatchDate(match.date, { withYear: true }), match.time, match.venue].filter(Boolean).join("  ·  ");
  return (
    <Panel params={params}>
      <Heading sub={match.matchNumber ? `Match ${match.matchNumber}` : "Maneri Premier League"}>COMING UP</Heading>
      <div className="flex flex-1 items-center justify-center gap-24 px-12">
        {[a, "vs", b].map((team) =>
          team === "vs" ? (
            <span key="vs" className="font-display text-[120px] leading-none text-[#f4b63d]">
              VS
            </span>
          ) : (
            <div key={team.name} className="flex flex-col items-center gap-5">
              <Badge team={team} size={300} />
              <span className="font-display text-[64px] leading-none tracking-[0.06em]">{team.label}</span>
            </div>
          )
        )}
      </div>
      {when ? <div className="pb-10 text-center text-[32px] font-extrabold uppercase tracking-[0.12em] text-white/80">{when}</div> : null}
    </Panel>
  );
}

// ---------------------------------------------------------------- toss + lineups

export function TossScreen({ data, params }) {
  const { match } = data;
  const winner = teamStyle(match.toss?.winner || match.teamA);
  return (
    <Panel params={params}>
      <Heading sub={match.matchNumber ? `Match ${match.matchNumber}` : ""}>THE TOSS</Heading>
      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-12">
        <Badge team={winner} size={300} />
        <div className="max-w-[1400px] text-center font-display text-[76px] uppercase leading-[1.05] tracking-[0.04em]">{tossText(match.toss)}</div>
      </div>
    </Panel>
  );
}

export function LineupScreen({ side, params }) {
  const team = teamStyle(side.team);
  const players = side.players || [];
  const cols = players.length > 12 ? 4 : 3;
  return (
    <Panel params={params} accent={team.accent}>
      <div className="flex items-center gap-6 px-12 py-6" style={{ background: `linear-gradient(90deg, ${team.color} 0%, rgba(6,15,34,0) 85%)` }}>
        <Badge team={team} size={110} />
        <div>
          <div className="font-display text-[64px] leading-none tracking-[0.06em]">{team.label}</div>
          <div className="mt-1 text-[24px] font-extrabold uppercase tracking-[0.24em] text-[#f4b63d]">Playing XI</div>
        </div>
      </div>
      <ol className="grid flex-1 content-center gap-x-8 gap-y-5 px-12 pb-8" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {players.map((p, i) => (
          <li key={p.id} className="flex min-w-0 items-center gap-4 rounded-2xl bg-white/[0.06] px-4 py-3">
            <span className="w-8 shrink-0 text-right font-display text-[28px] text-white/50">{i + 1}</span>
            <Photo batter={p} size={74} ring={p.captain ? "#f4b63d" : "rgba(255,255,255,0.25)"} />
            <div className="min-w-0 flex-1">
              <div className="truncate font-display text-[30px] leading-tight tracking-[0.03em]">
                {(p.name || "").toUpperCase()}
                {p.captain ? <span className="ml-2 text-[#f4b63d]">(C)</span> : null}
                {p.viceCaptain ? <span className="ml-2 text-[#b8e54a]">(VC)</span> : null}
              </div>
              {p.role ? <div className="truncate text-[20px] font-bold uppercase tracking-wider text-white/60">{p.role}</div> : null}
            </div>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

// Before the first ball: toss, then each team's XI, every 10 seconds.
export function PreMatchScreens({ data, params }) {
  const sides = (data.squads || []).filter((s) => s.players?.length);
  const slides = ["toss", ...sides.map((_, i) => i)];
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (slides.length < 2) return undefined;
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), ROTATE_MS);
    return () => clearInterval(timer);
  }, [slides.length]);
  const slide = slides[index % slides.length];
  if (slide === "toss") return <TossScreen key="toss" data={data} params={params} />;
  return <LineupScreen key={`xi-${slide}`} side={sides[slide]} params={params} />;
}

// ---------------------------------------------------------------- innings break

function PerformerList({ title, rows, render }) {
  if (!rows?.length) return null;
  return (
    <div>
      <div className="mb-3 text-[22px] font-black uppercase tracking-[0.2em] text-[#f4b63d]">{title}</div>
      <ul className="grid gap-3">
        {rows.map((row) => (
          <li key={row.id} className="flex items-center gap-4">
            <Photo batter={row} size={64} ring="rgba(255,255,255,0.25)" />
            <span className="min-w-0 flex-1 truncate font-display text-[32px] tracking-[0.03em]">{(row.name || "").toUpperCase()}</span>
            <span className="shrink-0 font-display text-[38px] text-[#f4b63d]">{render(row)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function InningsBreakScreen({ data, params }) {
  const first = (data.performers || []).find((p) => p.number === 1);
  const header = (data.innings || []).find((i) => i.number === 1);
  if (!first) return null;
  const batting = teamStyle(first.battingTeam);
  const chasing = teamStyle(first.bowlingTeam);
  const target = data.situation?.target || first.runs + 1;
  const quota = header?.quotaOvers || data.match.overs;
  const perOver = quota ? (target / quota).toFixed(2) : null;
  return (
    <Panel params={params}>
      <Heading sub={`End of the ${batting.label} innings`}>INNINGS BREAK</Heading>
      <div className="grid min-h-0 flex-1 grid-cols-[1.25fr_1fr] gap-12 px-14 pb-7 pt-4">
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-6">
            <Badge team={batting} size={130} />
            <div>
              <div className="font-display text-[44px] leading-none tracking-[0.06em]" style={{ color: batting.accent }}>{batting.label}</div>
              <div className="font-display text-[110px] leading-none">
                {scoreText(first.runs, first.wickets)} <span className="text-[44px] text-white/70">({first.overs})</span>
              </div>
            </div>
          </div>
          <PerformerList title="Top batters" rows={first.batters} render={(b) => `${b.runs}${b.out ? "" : "*"} (${b.balls})`} />
          <PerformerList title={`${chasing.label} bowling`} rows={first.bowlers} render={(b) => `${b.wickets}-${b.runs}`} />
        </div>
        <div className="flex flex-col items-center justify-center gap-4 rounded-3xl bg-white/[0.06] p-8 text-center">
          <Badge team={chasing} size={130} />
          <div className="font-display text-[44px] leading-none tracking-[0.08em] text-white/80">{chasing.label} NEED</div>
          <div className="font-display text-[170px] leading-[0.85] text-[#f4b63d]">{target}</div>
          <div className="font-display text-[40px] tracking-[0.08em]">TO WIN{quota ? ` IN ${quota} ${quota === 1 ? "OVER" : "OVERS"}` : ""}</div>
          {perOver ? <div className="text-[26px] font-extrabold uppercase tracking-wider text-white/70">{perOver} runs an over</div> : null}
        </div>
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------------- result

export function ResultScreen({ data, params }) {
  const { match, situation } = data;
  const winnerName = situation?.outcome === "win" ? situation.winner : null;
  const winner = winnerName ? teamStyle(winnerName) : null;
  const innings = data.performers || [];
  const best = (inn) => [inn.batters?.[0], inn.bowlers?.[0]].filter(Boolean);
  return (
    <Panel params={params}>
      <Heading sub={match.matchNumber ? `Match ${match.matchNumber}` : ""}>RESULT</Heading>
      <div className="flex items-center justify-center gap-8 px-12 pt-4">
        {winner ? <Badge team={winner} size={150} /> : null}
        <div className="max-w-[1250px] text-center font-display text-[74px] uppercase leading-[1.02] tracking-[0.03em]">{resultText(situation, match)}</div>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-[1.4fr_1fr] gap-10 px-14 pb-8 pt-6">
        <div className="grid content-center gap-6">
          {innings.map((inn) => {
            const team = teamStyle(inn.battingTeam);
            return (
              <div key={inn.number} className="rounded-2xl bg-white/[0.06] px-6 py-4">
                <div className="flex items-center gap-5">
                  <Badge team={team} size={72} />
                  <span className="flex-1 font-display text-[44px] tracking-[0.05em]">{team.label}</span>
                  <span className="font-display text-[60px] leading-none">{scoreText(inn.runs, inn.wickets)}</span>
                  <span className="font-display text-[30px] text-white/70">({inn.overs})</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-8 gap-y-1 pl-[92px] text-[24px] font-bold uppercase tracking-wide text-white/75">
                  {best(inn).map((p) => (
                    <span key={p.id}>
                      {p.name} <span className="text-[#f4b63d]">{"balls" in p ? `${p.runs}${p.out ? "" : "*"} (${p.balls})` : `${p.wickets}-${p.runs}`}</span>
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
          {!innings.length && match.result ? <div className="text-center text-[32px] font-bold text-white/80">{match.result}</div> : null}
        </div>
        {data.motm ? (
          <div className="flex min-h-0 flex-col items-center justify-center gap-3 rounded-3xl px-8 py-6 text-center" style={{ background: "linear-gradient(160deg, rgba(244,182,61,0.25), rgba(244,182,61,0.05))", border: "2px solid #f4b63d" }}>
            <div className="text-[24px] font-black uppercase tracking-[0.24em] text-[#f4b63d]">Player of the match</div>
            <Photo batter={data.motm} size={150} ring="#f4b63d" />
            <div className="font-display text-[42px] leading-[1.05] tracking-[0.04em]">{data.motm.name.toUpperCase()}</div>
            {data.motm.performance ? <div className="font-display text-[36px] leading-none text-[#f4b63d]">{data.motm.performance}</div> : null}
            {data.motm.team ? <div className="text-[22px] font-extrabold uppercase tracking-wider text-white/70">{data.motm.team}</div> : null}
          </div>
        ) : null}
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------------- scorecard (operator)

// The current innings' batting and bowling card. Only shown when the stream
// operator asks for it (Admin > Stream Overlay).
export function ScorecardScreen({ data, params }) {
  const card = data.scorecard;
  if (!card) return null;
  const team = teamStyle(card.battingTeam);
  const bowling = teamStyle(card.bowlingTeam);
  const batters = card.batting || [];
  const bowlers = (card.bowling || []).filter((b) => b.overs !== "0.0" || b.runs > 0);
  const extras = card.extras?.total ?? 0;
  // Once the match is finished, the result goes under the card.
  const result = data.situation?.type === "result" ? resultText(data.situation, data.match) : "";
  return (
    <Panel params={params} accent={team.accent} fit>
      <div className="flex items-center gap-5 px-12 pt-5">
        <Badge team={team} size={72} />
        <div className="flex-1">
          <div className="font-display text-[46px] leading-none tracking-[0.08em]" style={{ color: team.accent }}>{team.label} BATTING</div>
          <div className="mt-1 text-[20px] font-extrabold uppercase tracking-[0.2em] text-white/70">
            Innings {card.number}
            {card.target ? ` · target ${card.target}` : ""}
          </div>
        </div>
        <div className="text-right font-display leading-none">
          <span className="text-[76px]">{scoreText(card.runs, card.wickets)}</span>
          <span className="ml-3 text-[34px] text-white/70">({card.overs})</span>
        </div>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-[1.45fr_1fr] gap-10 px-12 pb-6 pt-3">
        <table className="w-full table-fixed self-start text-[23px]">
          <thead>
            <tr className="text-[19px] font-black uppercase tracking-[0.16em] text-white/55">
              <th className="w-[46%] pb-2 text-left">Batter</th>
              <th className="pb-2 text-right">R</th>
              <th className="pb-2 text-right">B</th>
              <th className="pb-2 text-right">4s</th>
              <th className="pb-2 text-right">6s</th>
              <th className="pb-2 text-right">SR</th>
            </tr>
          </thead>
          <tbody>
            {batters.map((b) => (
              <tr key={b.id} className="border-t border-white/10">
                <td className="py-[5px] pr-3">
                  <div className="truncate">
                    <span className={`font-extrabold uppercase ${b.atCrease ? "text-[#f4b63d]" : ""}`}>
                      {b.name}
                      {b.atCrease ? "*" : ""}
                    </span>
                    <span className="ml-2 text-[16px] font-semibold text-white/50">{b.dismissal || (b.atCrease ? "batting" : "not out")}</span>
                  </div>
                </td>
                <td className="text-right font-display text-[28px]">{b.runs}</td>
                <td className="text-right text-white/75">{b.balls}</td>
                <td className="text-right text-white/75">{b.fours}</td>
                <td className="text-right text-white/75">{b.sixes}</td>
                <td className="text-right text-white/75">{b.balls ? Number(b.strikeRate).toFixed(1) : "-"}</td>
              </tr>
            ))}
            <tr className="border-t border-white/10 text-[20px] font-bold uppercase tracking-wide text-white/70">
              <td className="py-1.5">Extras</td>
              <td className="text-right font-display text-[26px] text-white">{extras}</td>
              <td colSpan={4} />
            </tr>
          </tbody>
        </table>
        <div className="self-start">
          <div className="mb-2 flex items-center gap-3 text-[19px] font-black uppercase tracking-[0.16em] text-white/55">
            <span className="h-3 w-3 rounded-full" style={{ background: bowling.accent }} />
            {bowling.label} bowling
          </div>
          <table className="w-full table-fixed text-[23px]">
            <thead>
              <tr className="text-[19px] font-black uppercase tracking-[0.16em] text-white/55">
                <th className="w-[44%] pb-2 text-left">Bowler</th>
                <th className="pb-2 text-right">O</th>
                <th className="pb-2 text-right">R</th>
                <th className="pb-2 text-right">W</th>
                <th className="pb-2 text-right">Econ</th>
              </tr>
            </thead>
            <tbody>
              {bowlers.map((b) => (
                <tr key={b.id} className="border-t border-white/10">
                  <td className="truncate py-[5px] pr-3 font-extrabold uppercase">{b.name}</td>
                  <td className="text-right text-white/75">{b.overs}</td>
                  <td className="text-right text-white/75">{b.runs}</td>
                  <td className="text-right font-display text-[28px] text-[#f4b63d]">{b.wickets}</td>
                  <td className="text-right text-white/75">{b.economy ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {result ? (
        <div className="flex items-center justify-center gap-4 border-t-2 border-[#f4b63d]/50 bg-[#f4b63d]/[0.12] px-12 py-3" data-scorecard-result>
          <span className="text-[20px] font-black uppercase tracking-[0.22em] text-[#f4b63d]">Result</span>
          <span className="font-display text-[38px] uppercase leading-none tracking-[0.03em]">{result}</span>
        </div>
      ) : null}
    </Panel>
  );
}

// ---------------------------------------------------------------- points table (operator)

function nrrText(value) {
  const v = Number(value) || 0;
  const n = (Math.sign(v) * Math.round(Math.abs(v) * 1000)) / 1000 || 0;
  return `${n > 0 ? "+" : ""}${n.toFixed(3)}`;
}

const TABLE_COLS = "70px minmax(0,1fr) repeat(5, 78px) 96px 150px";

// League standings, as on the website. Shown when the stream operator asks
// for it (Admin > Stream Overlay > Points table).
export function PointsTableScreen({ data, params }) {
  const rows = data.pointsTable || [];
  if (!rows.length) return null;
  const compact = rows.length > 6;
  return (
    <Panel params={params}>
      <Heading sub="Season 2026">POINTS TABLE</Heading>
      <div className="flex min-h-0 flex-1 flex-col px-14 pb-8 pt-5">
        <div
          className="grid items-center px-6 pb-3 text-[22px] font-black uppercase tracking-[0.14em] text-white/55"
          style={{ gridTemplateColumns: TABLE_COLS }}
        >
          <span>#</span>
          <span>Team</span>
          {["M", "W", "L", "T", "NR", "P", "NRR"].map((c) => (
            <span key={c} className="text-right">
              {c}
            </span>
          ))}
        </div>
        <div className={`grid ${compact ? "gap-2" : "gap-3"}`}>
          {rows.map((row, i) => {
            const team = teamStyle(row.team);
            return (
              <div
                key={row.team}
                className={`grid items-center rounded-2xl px-6 font-extrabold ${compact ? "py-2 text-[28px]" : "py-3 text-[32px]"} ${
                  i < 4 ? "bg-[#f4b63d]/[0.13] ring-2 ring-[#f4b63d]/40" : "bg-white/[0.06] ring-2 ring-white/10"
                }`}
                style={{ gridTemplateColumns: TABLE_COLS }}
              >
                <span className="font-black text-[#f4b63d]">{i + 1}</span>
                <span className="flex min-w-0 items-center gap-4">
                  <Badge team={team} size={compact ? 48 : 60} />
                  <span className="truncate">{row.team}</span>
                </span>
                {[row.played, row.won, row.lost, row.tied, row.noResult].map((v, k) => (
                  <span key={k} className="text-right text-white/85">
                    {v}
                  </span>
                ))}
                <span className="text-right font-black text-[#f4b63d]">{row.points}</span>
                <span className={`text-right ${Number(row.netRunRate) >= 0 ? "text-[#8df0a8]" : "text-[#ff8a80]"}`}>{nrrText(row.netRunRate)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </Panel>
  );
}

// Picks the component for a screen name (see lib/overlay/screens.js).
export default function OverlayScreen({ screen, data, params }) {
  if (screen === "comingUp") return <ComingUpScreen data={data} params={params} />;
  if (screen === "preMatch") return <PreMatchScreens data={data} params={params} />;
  if (screen === "break") return <InningsBreakScreen data={data} params={params} />;
  if (screen === "result") return <ResultScreen data={data} params={params} />;
  if (screen === "scorecard") return <ScorecardScreen data={data} params={params} />;
  if (screen === "pointsTable") return <PointsTableScreen data={data} params={params} />;
  return null;
}
