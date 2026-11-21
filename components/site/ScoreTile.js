"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatMatchDate, formatScore, shiftIsoDate, teamLogo } from "@/lib/matches";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { situationText } from "@/components/site/match/MatchCentre";

// Compact match card in the homepage stats bar:
//   a live match  -> live score, situation, batters and bowler (every 5 s)
//   otherwise     -> the last match's scores and result, plus the next fixture
//   nothing yet   -> the next fixture
// Data: GET /api/matches (yesterday / today / next match day) and, for a
// ball-by-ball scored match, GET /api/matches/[id]/live.
// Renders nothing until there is a match to show.

const LIVE_POLL_MS = 5000;
const LIST_POLL_LIVE_MS = 30000;
const LIST_POLL_IDLE_MS = 120000;

async function getJson(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// Runs `load` now (and whenever it changes), then every `ms` while the tab is
// visible, and on returning to the tab. ms = 0: once only.
function usePolling(load, ms) {
  useEffect(() => {
    load();
    if (!ms) return undefined;
    const tick = () => document.visibilityState === "visible" && load();
    const timer = setInterval(tick, ms);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [load, ms]);
}

// Which match leads the card, and which fixture comes next.
export function pickMatches(data) {
  if (!data) return { main: null, next: null };
  const today = data.today?.matches || [];
  const done = (m) => m.status === "completed" || m.status === "abandoned";
  const live = today.find((m) => m.status === "live");
  const last = [...today].reverse().find(done) || [...(data.recent?.matches || [])].reverse().find(done) || null;
  const next =
    today.find((m) => m.status === "upcoming" && m.id !== live?.id) || (data.upcoming?.matches || []).find((m) => m.status === "upcoming") || null;
  if (live) return { main: live, mode: "live", next };
  if (last) return { main: last, mode: "result", next };
  if (next) return { main: next, mode: "upcoming", next: null };
  return { main: null, next: null };
}

function when(match, todayDate, t) {
  const day =
    match.date === todayDate
      ? t("scorecard.today")
      : match.date === shiftIsoDate(todayDate, 1)
        ? t("scorecard.tomorrow")
        : formatMatchDate(match.date);
  return [day, match.time, match.venue].filter(Boolean).join(" · ");
}

function cleanOvers(overs) {
  return String(overs || "").replace(/\.0$/, "");
}

function Logo({ name }) {
  const src = teamLogo(name);
  if (!src) {
    return <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink/10 text-[0.6rem] font-black">{name.slice(0, 2).toUpperCase()}</span>;
  }
  return <Image src={src} alt="" width={28} height={28} className="h-7 w-7 shrink-0 object-contain" />;
}

function Badge({ mode, t }) {
  if (mode === "live") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-brand-red px-2.5 py-0.5 text-[0.68rem] font-black uppercase tracking-wider text-white">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
        {t("scorecard.statusLive")}
      </span>
    );
  }
  return (
    <span
      className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-[0.68rem] font-black uppercase tracking-wider ${
        mode === "result" ? "bg-gold/25 text-navy-dark" : "bg-ink/[0.07] text-ink"
      }`}
    >
      {mode === "result" ? t("scorecard.lastMatch") : t("scorecard.nextMatch")}
    </span>
  );
}

function TeamRow({ name, score, overs, strong, hideScore, t }) {
  return (
    <div className="flex items-center gap-3">
      <Logo name={name} />
      <span className={`min-w-0 flex-1 truncate text-[0.95rem] ${strong ? "font-black text-ink" : "font-semibold text-ink/75"}`}>{name}</span>
      {hideScore ? null : score ? (
        <span dir="ltr" className="whitespace-nowrap tabular-nums">
          <span className={`text-[1.05rem] ${strong ? "font-black text-ink" : "font-bold text-ink/75"}`}>{score}</span>
          {overs ? <span className="ml-1 text-[0.75rem] font-semibold text-muted">({overs})</span> : null}
        </span>
      ) : (
        <span className="text-[0.78rem] font-semibold text-muted">{t("scorecard.yetToBat")}</span>
      )}
    </div>
  );
}

export default function ScoreTile() {
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [live, setLive] = useState(null);

  const loadList = useCallback(async () => {
    try {
      setData(await getJson("/api/matches"));
    } catch {
      // Keep what is on screen; the next poll tries again.
    }
  }, []);

  const { main, mode, next } = pickMatches(data);
  const scored = Boolean(main && main.scoringStatus && main.scoringStatus !== "not_started");
  const mainId = main?.id || "";

  usePolling(loadList, mode === "live" ? LIST_POLL_LIVE_MS : LIST_POLL_IDLE_MS);

  const loadLive = useCallback(async () => {
    if (!mainId || !scored) return;
    try {
      setLive(await getJson(`/api/matches/${mainId}/live`));
    } catch {
      // Fall back to the fixture's own scores.
    }
  }, [mainId, scored]);
  usePolling(loadLive, mode === "live" && scored ? LIVE_POLL_MS : 0);

  if (!main) return null;

  const detail = live && live.match?.id === main.id ? live : null;
  const scoreOf = (team) => {
    const inn = detail?.innings?.find((i) => i.battingTeam === team);
    if (inn) return { score: formatScore(inn), overs: cleanOvers(inn.overs) };
    const own = team === main.teamA ? main.teamAInnings : main.teamBInnings;
    return { score: formatScore(own), overs: cleanOvers(own?.overs) };
  };
  // Bold: the side batting now, or the winner.
  const winner = detail?.situation?.type === "result" ? detail.situation.winner : main.result.startsWith(main.teamA) ? main.teamA : main.result.startsWith(main.teamB) ? main.teamB : "";
  const highlight = mode === "live" ? detail?.now?.battingTeam : mode === "result" ? winner : "";

  let status = "";
  if (mode === "upcoming") status = when(main, data.todayDate, t);
  else status = (detail && situationText(detail.situation, t)) || main.result || "";
  if (mode === "live" && !status && detail?.now) status = `${t("matchCentre.crr")} ${Number(detail.now.runRate || 0).toFixed(2)}`;
  const statusTone = mode === "live" ? "text-brand-red" : mode === "result" ? "text-green-dark" : "text-muted";

  const now = mode === "live" ? detail?.now : null;
  const ctaLabel = mode === "upcoming" ? t("hero.matchDetails") : t("scorecard.viewDetails");
  const title = [main.matchNumber ? t("scorecard.matchNumber", { n: main.matchNumber }) : t("scorecard.fixture"), mode !== "upcoming" ? main.venue : ""]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex min-w-0 flex-col" data-score-tile={mode} aria-label={t("hero.scoreAria")}>
      <div className="flex flex-1 flex-col gap-3 p-6 sm:p-7">
        <div className="flex items-center justify-between gap-3">
          <span className="truncate text-[0.8rem] font-semibold text-muted">{title}</span>
          <Badge mode={mode} t={t} />
        </div>
        <div className="grid gap-2.5">
          <TeamRow name={main.teamA} {...scoreOf(main.teamA)} strong={highlight === main.teamA} hideScore={mode === "upcoming"} t={t} />
          <TeamRow name={main.teamB} {...scoreOf(main.teamB)} strong={highlight === main.teamB} hideScore={mode === "upcoming"} t={t} />
        </div>
        {status ? <p className={`text-[0.9rem] font-bold ${statusTone}`}>{status}</p> : null}
        {now && (now.striker || now.bowler) ? (
          <p className="flex flex-wrap gap-x-3 text-[0.78rem] font-semibold text-muted">
            {[now.striker, now.nonStriker].filter(Boolean).map((p, i) => (
              <span key={p.id || i}>
                {p.name}
                {i === 0 ? "*" : ""} <strong className="text-ink">{p.runs}</strong> ({p.balls})
              </span>
            ))}
            {now.bowler ? (
              <span>
                {now.bowler.name}{" "}
                <strong className="text-ink">
                  {now.bowler.wickets}-{now.bowler.runs}
                </strong>{" "}
                ({now.bowler.overs})
              </span>
            ) : null}
          </p>
        ) : null}
      </div>
      {next ? (
        <Link
          href={`/match/${next.id}`}
          className="border-t border-dashed border-ink/10 px-6 py-2.5 text-[0.78rem] font-semibold text-muted hover:text-ink sm:px-7"
        >
          <span className="font-black uppercase text-ink/80">{t("scorecard.nextMatch")}:</span> {next.teamA} {t("hero.vs")} {next.teamB} · {when(next, data.todayDate, t)}
        </Link>
      ) : null}
      <div className="flex justify-end border-t border-ink/10 bg-[#fafbfa] px-6 py-2.5 sm:px-7">
        <Link href={`/match/${main.id}`} className="shrink-0 text-[0.8rem] font-black uppercase tracking-wide text-green-dark hover:text-green">
          {ctaLabel} →
        </Link>
      </div>
    </div>
  );
}
