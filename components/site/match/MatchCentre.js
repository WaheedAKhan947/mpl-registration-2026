"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatMatchDate, formatScore, teamLogo } from "@/lib/matches";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import PlayerLink from "@/components/site/PlayerLink";

const LIVE_POLL_MS = 5000;
const IDLE_POLL_MS = 30000;

// ---------------------------------------------------------------- helpers

function useVisiblePolling(callback, intervalMs) {
  const saved = useRef(callback);
  saved.current = callback;
  useEffect(() => {
    if (!intervalMs) return undefined;
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") saved.current();
    }, intervalMs);
    function onVisible() {
      if (document.visibilityState === "visible") saved.current();
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [intervalMs]);
}

async function getJson(url) {
  const res = await fetch(url, { cache: "no-store" });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(body.error || "Request failed");
    error.status = res.status;
    throw error;
  }
  return body;
}

export function situationText(situation, t) {
  if (!situation) return "";
  const dls = situation.revised ? ` ${t("matchCentre.dls")}` : "";
  switch (situation.type) {
    case "result": {
      if (situation.outcome === "tie") return `${t("matchCentre.tied")}${dls}`;
      if (situation.outcome === "no_result") return t("matchCentre.noResult");
      if (situation.outcome !== "win") return situation.text || "";
      const n = situation.margin;
      const team = situation.winner;
      let text;
      if (situation.marginType === "runs") {
        text = n === 1 ? t("matchCentre.wonByRun", { team }) : t("matchCentre.wonByRuns", { team, n });
      } else {
        text = n === 1 ? t("matchCentre.wonByWicket", { team }) : t("matchCentre.wonByWickets", { team, n });
        if (situation.ballsLeft > 0) {
          text += ` ${situation.ballsLeft === 1 ? t("matchCentre.ballLeft") : t("matchCentre.ballsLeft", { n: situation.ballsLeft })}`;
        }
      }
      return `${text}${dls}`;
    }
    case "chase":
      return t("matchCentre.need", { team: situation.team, runs: situation.runs, balls: situation.balls });
    case "break":
      return t("matchCentre.inningsBreak", { team: situation.team, target: situation.target });
    case "toss":
      if (!situation.winner || !situation.decision) return "";
      return t("matchCentre.toss", {
        team: situation.winner,
        decision: t(situation.decision === "bat" ? "matchCentre.decisionBat" : "matchCentre.decisionBowl"),
      });
    default:
      return "";
  }
}

function TeamLogo({ name, size = 44 }) {
  const src = teamLogo(name);
  if (!src) {
    return (
      <span
        className="grid shrink-0 place-items-center rounded-full bg-white/10 text-sm font-black"
        style={{ width: size, height: size }}
      >
        {name.slice(0, 2).toUpperCase()}
      </span>
    );
  }
  return <Image src={src} alt="" width={size} height={size} className="shrink-0 object-contain" style={{ width: size, height: size }} />;
}

function chipClass(label) {
  if (label === "W" || label === "RO") return "bg-brand-red text-white";
  if (label === "4" || label === "6") return "bg-gold text-navy-dark";
  if (/Wd|Nb|B|Lb|P|RH/.test(label)) return "bg-navy/10 text-navy";
  return "bg-white text-ink ring-1 ring-ink/10";
}

function Chip({ label }) {
  return (
    <span className={`grid h-8 min-w-[2rem] place-items-center rounded-full px-1.5 text-xs font-black tabular-nums ${chipClass(label)}`}>
      {label}
    </span>
  );
}

function LiveDot() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
    </span>
  );
}

function StatusBadge({ match, t }) {
  const live = match.scoringStatus === "in_progress" || match.status === "live";
  const labels = {
    upcoming: [t("scorecard.statusUpcoming"), "bg-white/15 text-white"],
    live: [t("scorecard.statusLive"), "bg-brand-red text-white"],
    completed: [t("scorecard.statusCompleted"), "bg-gold text-navy-dark"],
    abandoned: [t("scorecard.statusAbandoned"), "bg-white/15 text-white/80"],
  };
  const [label, className] = labels[live ? "live" : match.status] || labels.upcoming;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.7rem] font-black uppercase tracking-wider ${className}`}>
      {live ? <LiveDot /> : null}
      {label}
    </span>
  );
}

// ---------------------------------------------------------------- header

function ScoreHeader({ live, t }) {
  const { match, innings, now } = live;
  const scoreFor = (team) => {
    const inn = innings.find((i) => i.battingTeam === team);
    if (inn) {
      const score = inn.wickets >= 10 ? String(inn.runs) : `${inn.runs}/${inn.wickets}`;
      return { score, overs: inn.quotaOvers ? t("matchCentre.oversOf", { overs: inn.overs, total: inn.quotaOvers }) : inn.overs };
    }
    const summary = team === match.teamA ? match.teamAInnings : match.teamBInnings;
    const score = formatScore(summary);
    return score ? { score, overs: summary.overs } : null;
  };
  const batting = now && match.scoringStatus === "in_progress" ? now.battingTeam : null;
  const text = match.scored ? situationText(live.situation, t) : match.result;
  const meta = [formatMatchDate(match.date, { withYear: true }), match.time, match.venue].filter(Boolean).join(" · ");

  return (
    <section
      className="text-white"
      style={{
        backgroundImage:
          "radial-gradient(ellipse at top left, rgba(11,107,58,0.55), transparent 55%), linear-gradient(180deg, #06301c 0%, #041c10 100%)",
      }}
    >
      <div className="mx-auto w-[min(1100px,calc(100%-32px))] py-6 sm:py-9">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/#scores" className="text-sm font-extrabold text-gold hover:text-white">
            {t("matchCentre.back")}
          </Link>
          <StatusBadge match={match} t={t} />
        </div>
        <p className="mt-4 text-[0.74rem] font-black uppercase tracking-[0.16em] text-gold">
          {match.matchNumber ? t("scorecard.matchNumber", { n: match.matchNumber }) : t("scorecard.fixture")}
        </p>
        <p className="text-sm text-white/65">{meta}</p>

        <div className="mt-5 grid gap-3">
          {[match.teamA, match.teamB].map((team) => {
            const s = scoreFor(team);
            return (
              <div
                key={team}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${batting === team ? "bg-white/[0.12] ring-1 ring-gold/40" : "bg-white/[0.05]"}`}
              >
                <TeamLogo name={team} />
                <span className="min-w-0 flex-1 font-display text-[1.25rem] uppercase leading-tight sm:text-[1.5rem]">{team}</span>
                {s ? (
                  <span className="flex shrink-0 items-baseline gap-2">
                    <span className="font-display text-[1.9rem] leading-none tabular-nums sm:text-[2.3rem]">{s.score}</span>
                    {s.overs ? <span className="text-xs font-bold text-white/70">({s.overs})</span> : null}
                  </span>
                ) : (
                  <span className="text-[0.7rem] font-black uppercase tracking-wider text-white/55">{t("scorecard.yetToBat")}</span>
                )}
              </div>
            );
          })}
        </div>

        {text ? <p className="mt-4 font-display text-[1.15rem] uppercase leading-snug text-gold sm:text-[1.3rem]">{text}</p> : null}
        {now && match.scoringStatus === "in_progress" ? (
          <p className="mt-1 text-sm font-bold tabular-nums text-white/75">
            {t("matchCentre.crr")} {now.runRate.toFixed(2)}
            {now.requiredRate !== null && now.requiredRate !== undefined
              ? ` · ${t("matchCentre.rrr")} ${now.requiredRate.toFixed(2)}`
              : ""}
          </p>
        ) : null}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- tabs

function Card({ title, children, className = "" }) {
  return (
    <section className={`overflow-hidden rounded-xl border border-ink/10 bg-white shadow-[0_8px_24px_rgba(6,66,39,0.06)] ${className}`}>
      {title ? <h3 className="border-b border-ink/[0.06] px-4 py-3 text-[0.8rem] font-black uppercase tracking-[0.12em] text-green-dark">{title}</h3> : null}
      {children}
    </section>
  );
}

function StatTable({ head, rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[320px] text-sm tabular-nums">
        <thead>
          <tr className="text-[0.68rem] font-black uppercase tracking-[0.08em] text-muted">
            {head.map((h, i) => (
              <th key={i} className={`px-3 py-2 ${i === 0 ? "text-start" : "text-end"} first:ps-4 last:pe-4`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
    </div>
  );
}

function LiveTab({ live, commentary, t }) {
  const { now } = live;
  if (!now) return <Card><p className="p-4 text-sm text-muted">{t("matchCentre.yetToStart")}</p></Card>;
  const batters = [now.striker, now.nonStriker].filter(Boolean);
  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
      <div className="grid content-start gap-4">
        <Card>
          <StatTable
            head={[t("matchCentre.batter"), t("matchCentre.r"), t("matchCentre.b"), t("matchCentre.fours"), t("matchCentre.sixes"), t("matchCentre.sr")]}
            rows={batters.map((b, i) => (
              <tr key={b.id} className={`border-t border-ink/[0.06] ${i === 0 ? "font-black text-ink" : "font-semibold text-ink/80"}`}>
                <td className="px-3 py-2.5 ps-4 text-start">
                  <PlayerLink id={b.id}>{b.name}</PlayerLink>
                  {i === 0 ? " *" : ""}
                </td>
                <td className="px-3 text-end">{b.runs}</td>
                <td className="px-3 text-end">{b.balls}</td>
                <td className="px-3 text-end">{b.fours}</td>
                <td className="px-3 text-end">{b.sixes}</td>
                <td className="px-3 pe-4 text-end">{b.strikeRate.toFixed(1)}</td>
              </tr>
            ))}
          />
          {now.bowler ? (
            <StatTable
              head={[t("matchCentre.bowler"), t("matchCentre.o"), t("matchCentre.m"), t("matchCentre.r"), t("matchCentre.w"), t("matchCentre.econ")]}
              rows={
                <tr className="border-t border-ink/[0.06] font-bold text-ink">
                  <td className="px-3 py-2.5 ps-4 text-start">
                    <PlayerLink id={now.bowler.id}>{now.bowler.name}</PlayerLink>
                  </td>
                  <td className="px-3 text-end">{now.bowler.overs}</td>
                  <td className="px-3 text-end">{now.bowler.maidens}</td>
                  <td className="px-3 text-end">{now.bowler.runs}</td>
                  <td className="px-3 text-end">{now.bowler.wickets}</td>
                  <td className="px-3 pe-4 text-end">{now.bowler.economy.toFixed(2)}</td>
                </tr>
              }
            />
          ) : null}
          <div className="grid gap-1 border-t border-ink/[0.06] px-4 py-3 text-sm text-muted">
            <p>
              <span className="font-bold text-ink">{t("matchCentre.partnership")}:</span> {now.partnership.runs} ({now.partnership.balls})
            </p>
            {now.lastWicket ? (
              <p>
                <span className="font-bold text-ink">{t("matchCentre.lastWicket")}:</span> {now.lastWicket.name} {now.lastWicket.runs} (
                {now.lastWicket.balls}) · {now.lastWicket.score} ({now.lastWicket.overs})
              </p>
            ) : null}
          </div>
        </Card>

        <Card title={t("matchCentre.recent")}>
          <div className="flex flex-wrap items-center gap-1.5 px-4 py-3">
            {now.recentBalls.length ? now.recentBalls.map((b, i) => <Chip key={i} label={b.label} />) : <span className="text-sm text-muted">—</span>}
            {now.freeHit ? (
              <span className="ms-2 animate-pulse rounded-full bg-gold px-2.5 py-1 text-[0.68rem] font-black uppercase text-navy-dark">
                {t("matchCentre.freeHit")}
              </span>
            ) : null}
          </div>
        </Card>
      </div>

      <Card title={t("matchCentre.tabs.commentary")}>
        <CommentaryList items={(commentary?.items || []).slice(0, 8)} t={t} />
      </Card>
    </div>
  );
}

function CommentaryList({ items, t }) {
  if (!items.length) return <p className="p-4 text-sm text-muted">{t("matchCentre.noCommentary")}</p>;
  return (
    <ol className="divide-y divide-ink/[0.06]">
      {items.map((item) => (
        <li key={item.id}>
          {item.overEnd ? (
            <div className="flex flex-wrap items-center justify-between gap-2 bg-navy/[0.04] px-4 py-2 text-xs font-black uppercase tracking-wide text-navy">
              <span>{t("matchCentre.endOfOver", { n: item.overEnd.over })}</span>
              <span className="tabular-nums">
                {item.overEnd.runs === 1 ? t("matchCentre.runInOver") : t("matchCentre.runsInOver", { runs: item.overEnd.runs })} ·{" "}
                {item.battingTeam} {item.overEnd.score}
              </span>
            </div>
          ) : null}
          <div className="flex gap-3 px-4 py-3">
            <div className="flex w-12 shrink-0 flex-col items-center gap-1">
              <span className="text-xs font-bold tabular-nums text-muted">{item.overBall}</span>
              <Chip label={item.label} />
            </div>
            <p className={`min-w-0 flex-1 text-sm leading-relaxed ${item.wicket ? "font-bold text-brand-red" : item.boundary ? "font-bold text-ink" : "text-ink/85"}`} dir="ltr">
              {item.text}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function CommentaryTab({ commentary, loadingMore, onMore, t }) {
  return (
    <Card>
      <CommentaryList items={commentary?.items || []} t={t} />
      {commentary?.nextCursor ? (
        <div className="border-t border-ink/[0.06] p-3 text-center">
          <button
            type="button"
            onClick={onMore}
            disabled={loadingMore}
            className="rounded-lg border border-ink/10 bg-white px-4 py-2 text-sm font-extrabold text-green-dark transition hover:-translate-y-0.5 disabled:opacity-60"
          >
            {loadingMore ? "..." : t("matchCentre.loadMore")}
          </button>
        </div>
      ) : null}
    </Card>
  );
}

function InningsCard({ inn, t }) {
  const ex = inn.extras;
  return (
    <div className="grid gap-4">
      <Card title={t("matchCentre.innings", { team: inn.battingTeam })}>
        <StatTable
          head={[t("matchCentre.batter"), t("matchCentre.r"), t("matchCentre.b"), t("matchCentre.fours"), t("matchCentre.sixes"), t("matchCentre.sr")]}
          rows={inn.batting.map((b) => (
            <tr key={b.id} className="border-t border-ink/[0.06] align-top">
              <td className="px-3 py-2.5 ps-4 text-start">
                <PlayerLink id={b.id} className="font-bold text-ink">
                  {b.name}
                </PlayerLink>
                <span className={`block text-xs ${b.out ? "text-muted" : "font-semibold text-green-dark"}`} dir="ltr">
                  {b.dismissal || (b.atCrease ? t("matchCentre.batting") : t("matchCentre.notOut"))}
                </span>
              </td>
              <td className="px-3 py-2.5 text-end font-black text-ink">{b.runs}</td>
              <td className="px-3 py-2.5 text-end">{b.balls}</td>
              <td className="px-3 py-2.5 text-end">{b.fours}</td>
              <td className="px-3 py-2.5 text-end">{b.sixes}</td>
              <td className="px-3 py-2.5 pe-4 text-end">{b.strikeRate.toFixed(1)}</td>
            </tr>
          ))}
        />
        <div className="grid gap-1.5 border-t border-ink/[0.06] px-4 py-3 text-sm">
          <p className="flex justify-between gap-3">
            <span>
              <span className="font-bold text-ink">{t("matchCentre.extras")}</span>{" "}
              <span className="text-muted" dir="ltr">
                ({t("matchCentre.extrasDetail", { b: ex.byes, lb: ex.legbyes, w: ex.wides, nb: ex.noballs, p: ex.penalty })})
              </span>
            </span>
            <span className="font-black tabular-nums">{ex.total}</span>
          </p>
          <p className="flex justify-between gap-3 border-t border-ink/[0.06] pt-1.5">
            <span>
              <span className="font-black uppercase text-ink">{t("matchCentre.total")}</span>{" "}
              <span className="text-muted">
                ({inn.endReason === "all_out"
                  ? t("matchCentre.allOut")
                  : t("matchCentre.totalDetail", { wickets: inn.wickets, overs: inn.overs, rr: inn.runRate.toFixed(2) })})
              </span>
            </span>
            <span className="font-display text-xl tabular-nums text-ink">
              {inn.runs}/{inn.wickets}
            </span>
          </p>
          {inn.didNotBat.length ? (
            <p className="text-muted">
              <span className="font-bold text-ink">{t("matchCentre.didNotBat")}:</span> {inn.didNotBat.map((p, i) => (
                <span key={p.id}>
                  {i ? ", " : ""}
                  <PlayerLink id={p.id}>{p.name}</PlayerLink>
                </span>
              ))}
            </p>
          ) : null}
          {inn.fallOfWickets.length ? (
            <p className="text-muted">
              <span className="font-bold text-ink">{t("matchCentre.fallOfWickets")}:</span>{" "}
              <span dir="ltr">
                {inn.fallOfWickets.map((f) => `${f.runs}-${f.wicket} (${f.name}, ${f.overs})`).join(", ")}
              </span>
            </p>
          ) : null}
        </div>
      </Card>

      <Card>
        <StatTable
          head={[
            t("matchCentre.bowler"),
            t("matchCentre.o"),
            t("matchCentre.m"),
            t("matchCentre.r"),
            t("matchCentre.w"),
            t("matchCentre.nb"),
            t("matchCentre.wd"),
            t("matchCentre.econ"),
          ]}
          rows={inn.bowling.map((b) => (
            <tr key={b.id} className="border-t border-ink/[0.06]">
              <td className="px-3 py-2.5 ps-4 text-start font-bold text-ink">
                <PlayerLink id={b.id}>{b.name}</PlayerLink>
              </td>
              <td className="px-3 text-end">{b.overs}</td>
              <td className="px-3 text-end">{b.maidens}</td>
              <td className="px-3 text-end">{b.runs}</td>
              <td className="px-3 text-end font-black text-ink">{b.wickets}</td>
              <td className="px-3 text-end">{b.noballs}</td>
              <td className="px-3 text-end">{b.wides}</td>
              <td className="px-3 pe-4 text-end">{b.economy.toFixed(2)}</td>
            </tr>
          ))}
        />
      </Card>
    </div>
  );
}

function ScorecardTab({ scorecard, t }) {
  const [selected, setSelected] = useState(null);
  const innings = scorecard?.innings || [];
  if (!innings.length) return <Card><p className="p-4 text-sm text-muted">{t("matchCentre.yetToStart")}</p></Card>;
  const active = innings.find((i) => i.number === selected) || innings[innings.length - 1];
  return (
    <div className="grid gap-4">
      {innings.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {innings.map((inn) => (
            <button
              key={inn.number}
              type="button"
              onClick={() => setSelected(inn.number)}
              className={`rounded-full px-4 py-2 text-sm font-extrabold transition ${
                inn.number === active.number ? "bg-green text-white" : "bg-white text-green-dark ring-1 ring-ink/10"
              }`}
            >
              {inn.battingTeam} {inn.runs}/{inn.wickets}
            </button>
          ))}
        </div>
      ) : null}
      <InningsCard inn={active} t={t} />
    </div>
  );
}

function SquadsTab({ squads, t }) {
  const hasXI = squads?.some((s) => s.players.length);
  if (!hasXI) return <Card><p className="p-4 text-sm text-muted">{t("matchCentre.squadsTba")}</p></Card>;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {squads.map((side) => (
        <Card key={side.team} title={`${side.team} · ${t("matchCentre.playingXI")}`}>
          <ol className="divide-y divide-ink/[0.06]">
            {side.players.map((p, i) => (
              <li key={p.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <span className="w-5 shrink-0 text-xs font-bold tabular-nums text-muted">{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <PlayerLink id={p.id} className="font-bold text-ink">
                    {p.name}
                  </PlayerLink>
                  {p.role ? <span className="block text-xs text-muted">{p.role}</span> : null}
                </span>
                {p.captain ? (
                  <span className="rounded-full bg-gold/25 px-2 py-0.5 text-[0.68rem] font-black text-navy-dark">{t("matchCentre.captain")}</span>
                ) : null}
                {p.viceCaptain ? (
                  <span className="rounded-full bg-ink/[0.06] px-2 py-0.5 text-[0.68rem] font-black text-muted">{t("matchCentre.viceCaptain")}</span>
                ) : null}
              </li>
            ))}
          </ol>
        </Card>
      ))}
    </div>
  );
}

function InfoTab({ live, t }) {
  const { match } = live;
  const toss = situationText({ type: "toss", ...match.toss }, t);
  const result = match.scoringStatus === "completed" ? situationText(live.situation, t) : match.status === "completed" || match.status === "abandoned" ? match.result : "";
  const rows = [
    [t("matchCentre.infoMatch"), `${match.teamA} vs ${match.teamB}${match.matchNumber ? ` · ${t("scorecard.matchNumber", { n: match.matchNumber })}` : ""}`],
    [t("matchCentre.infoDate"), formatMatchDate(match.date, { withYear: true })],
    [t("matchCentre.infoTime"), match.time || t("matchCentre.tbd")],
    [t("matchCentre.infoVenue"), match.venue || t("matchCentre.tbd")],
    [t("matchCentre.infoToss"), toss || t("matchCentre.tbd")],
    [t("matchCentre.infoOvers"), match.overs || t("matchCentre.tbd")],
    result ? [t("matchCentre.infoResult"), result] : null,
  ].filter(Boolean);
  return (
    <Card>
      <dl className="divide-y divide-ink/[0.06]">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[minmax(110px,30%)_1fr] gap-3 px-4 py-3 text-sm">
            <dt className="font-bold text-muted">{label}</dt>
            <dd className="font-semibold text-ink">{value}</dd>
          </div>
        ))}
      </dl>
      {!match.scored ? <p className="border-t border-ink/[0.06] px-4 py-3 text-sm text-muted">{t("matchCentre.notScored")}</p> : null}
    </Card>
  );
}

// ---------------------------------------------------------------- main

export default function MatchCentre({ matchId }) {
  const { t } = useLanguage();
  const [live, setLive] = useState(null);
  const [scorecard, setScorecard] = useState(null);
  const [commentary, setCommentary] = useState(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const base = `/api/matches/${encodeURIComponent(matchId)}`;

  const loadLive = useCallback(async () => {
    try {
      setLive(await getJson(`${base}/live`));
      setError("");
    } catch (err) {
      if (err.status === 404) setError("notFound");
    }
  }, [base]);

  const loadScorecard = useCallback(async () => {
    try {
      setScorecard(await getJson(`${base}/scorecard`));
    } catch {
      // Keep the last copy.
    }
  }, [base]);

  // Newest page; older pages already loaded are kept underneath.
  const loadLatestCommentary = useCallback(async () => {
    try {
      const page = await getJson(`${base}/commentary`);
      setCommentary((prev) => {
        if (!prev || !prev.olderLoaded) return page;
        const last = page.items[page.items.length - 1];
        const older = prev.items.filter(
          (i) => last && (i.innings < last.innings || (i.innings === last.innings && i.seq < last.seq))
        );
        return { ...page, items: [...page.items, ...older], nextCursor: prev.nextCursor, olderLoaded: true };
      });
    } catch {
      // Keep the last copy.
    }
  }, [base]);

  async function loadMore() {
    if (!commentary?.nextCursor) return;
    setLoadingMore(true);
    try {
      const page = await getJson(`${base}/commentary?cursor=${encodeURIComponent(commentary.nextCursor)}`);
      setCommentary((prev) => ({
        ...prev,
        items: [...prev.items, ...page.items.filter((i) => !prev.items.some((p) => p.id === i.id))],
        nextCursor: page.nextCursor,
        olderLoaded: true,
      }));
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    loadLive();
    loadScorecard();
    loadLatestCommentary();
  }, [loadLive, loadScorecard, loadLatestCommentary]);

  const match = live?.match;
  const isLive = match?.scoringStatus === "in_progress";
  const finished = match && (match.scoringStatus === "completed" || match.status === "completed" || match.status === "abandoned");
  // Poll fast while live, slowly before the toss, not at all once it is over.
  const pollMs = !match ? 0 : isLive ? LIVE_POLL_MS : finished ? 0 : IDLE_POLL_MS;

  const tabs = match?.scored ? ["live", "scorecard", "commentary", "squads", "info"] : ["info"];
  const activeTab = tabs.includes(tab) ? tab : match?.scored ? (finished ? "scorecard" : "live") : "info";

  useVisiblePolling(() => {
    loadLive();
    if (activeTab === "scorecard" || activeTab === "squads") loadScorecard();
    if (activeTab === "live" || activeTab === "commentary") loadLatestCommentary();
  }, pollMs);

  // When a match finishes while open, fetch the final scorecard once.
  const wasLive = useRef(false);
  useEffect(() => {
    if (isLive) wasLive.current = true;
    else if (wasLive.current && finished) {
      wasLive.current = false;
      loadScorecard();
      loadLatestCommentary();
    }
  }, [isLive, finished, loadScorecard, loadLatestCommentary]);

  if (error === "notFound") {
    return (
      <div className="mx-auto grid min-h-[50vh] w-[min(1100px,calc(100%-32px))] place-items-center text-center">
        <div>
          <p className="text-lg font-black text-ink">{t("matchCentre.notFound")}</p>
          <Link href="/#scores" className="mt-3 inline-block font-extrabold text-green-dark">
            {t("matchCentre.back")}
          </Link>
        </div>
      </div>
    );
  }
  if (!live) {
    return <p className="mx-auto w-[min(1100px,calc(100%-32px))] py-16 text-center font-semibold text-muted">{t("matchCentre.loading")}</p>;
  }

  return (
    <>
      <ScoreHeader live={live} t={t} />
      <div className="sticky top-0 z-20 border-b border-ink/10 bg-white/95 backdrop-blur">
        <nav className="mx-auto flex w-[min(1100px,calc(100%-32px))] gap-1 overflow-x-auto py-2" aria-label="Match sections">
          {tabs.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              aria-current={key === activeTab ? "page" : undefined}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-extrabold transition ${
                key === activeTab ? "bg-green text-white" : "text-green-dark hover:bg-green/10"
              }`}
            >
              {t(`matchCentre.tabs.${key}`)}
            </button>
          ))}
          {isLive ? (
            <span className="ms-auto hidden shrink-0 items-center gap-2 self-center text-xs font-bold text-muted sm:flex">
              <span className="h-2 w-2 animate-pulse rounded-full bg-brand-red" />
              {t("matchCentre.autoRefresh")}
            </span>
          ) : null}
        </nav>
      </div>
      <div className="mx-auto w-[min(1100px,calc(100%-32px))] py-6 sm:py-8">
        {activeTab === "live" ? <LiveTab live={live} commentary={commentary} t={t} /> : null}
        {activeTab === "scorecard" ? <ScorecardTab scorecard={scorecard} t={t} /> : null}
        {activeTab === "commentary" ? <CommentaryTab commentary={commentary} loadingMore={loadingMore} onMore={loadMore} t={t} /> : null}
        {activeTab === "squads" ? <SquadsTab squads={scorecard?.squads} t={t} /> : null}
        {activeTab === "info" ? <InfoTab live={live} t={t} /> : null}
      </div>
    </>
  );
}
