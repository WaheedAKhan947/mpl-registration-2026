"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { formatMatchDate, formatScore, shiftIsoDate, teamLogo } from "@/lib/matches";
import { useLanguage } from "@/lib/i18n/LanguageContext";

// Live scores change quickly, so refresh while the page stays open and visible.
const REFRESH_MS = 60 * 1000;

function getStatusBadges(t) {
  return {
    upcoming: { label: t("scorecard.statusUpcoming"), className: "bg-white/15 text-white" },
    live: { label: t("scorecard.statusLive"), className: "bg-brand-red text-white" },
    completed: { label: t("scorecard.statusCompleted"), className: "bg-gold text-navy-dark" },
    abandoned: { label: t("scorecard.statusAbandoned"), className: "bg-white/15 text-white/80" },
  };
}

function initials(name) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function StatusBadge({ status }) {
  const { t } = useLanguage();
  const badges = getStatusBadges(t);
  const badge = badges[status] || badges.upcoming;
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.68rem] font-black uppercase tracking-wider ${badge.className}`}
    >
      {status === "live" ? (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
        </span>
      ) : null}
      {badge.label}
    </span>
  );
}

function TeamLogo({ name }) {
  const src = teamLogo(name);
  if (!src) {
    return (
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/10 text-sm font-black">
        {initials(name)}
      </span>
    );
  }
  return (
    <Image
      src={src}
      alt={`${name} logo`}
      width={44}
      height={44}
      className="h-11 w-11 shrink-0 object-contain drop-shadow-[0_6px_14px_rgba(0,0,0,0.35)]"
    />
  );
}

function PerformerRow({ label, performer }) {
  if (!performer?.name) return null;
  return (
    <div className="flex items-center justify-between gap-3 rounded-md bg-white/[0.07] px-3 py-1.5 text-[0.8rem]">
      <span className="flex min-w-0 items-baseline gap-1.5">
        <span className="shrink-0 text-[0.62rem] font-black uppercase tracking-wider text-white/45">{label}</span>
        <span className="truncate font-bold uppercase">{performer.name}</span>
      </span>
      {performer.figures ? (
        <span className="shrink-0 font-black tabular-nums text-gold">{performer.figures}</span>
      ) : null}
    </div>
  );
}

function ScorePill({ innings }) {
  const { t } = useLanguage();
  const score = formatScore(innings);
  if (!score) {
    return (
      <span className="shrink-0 rounded-md bg-white/10 px-3 py-1.5 text-[0.7rem] font-black uppercase tracking-wider text-white/70">
        {t("scorecard.yetToBat")}
      </span>
    );
  }
  return (
    <span className="flex shrink-0 items-baseline gap-1.5 rounded-md bg-gradient-to-r from-ember to-gold px-3 py-1 text-navy-dark">
      <span className="font-display text-[1.45rem] leading-none tabular-nums">{score}</span>
      {innings.overs ? <span className="text-[0.72rem] font-black">({innings.overs})</span> : null}
    </span>
  );
}

function InningsBlock({ team, innings, showScore }) {
  const { t } = useLanguage();
  return (
    <div className="grid gap-2 py-3.5">
      <div className="flex items-center gap-3">
        <TeamLogo name={team} />
        <span className="min-w-0 flex-1 font-display text-[1.05rem] uppercase leading-tight">{team}</span>
        {showScore ? <ScorePill innings={innings} /> : null}
      </div>
      {showScore ? (
        <>
          <PerformerRow label={t("scorecard.bat")} performer={innings.topBatter} />
          <PerformerRow label={t("scorecard.bowl")} performer={innings.topBowler} />
        </>
      ) : null}
    </div>
  );
}

function MatchCard({ match }) {
  const { t } = useLanguage();
  const showScore = match.status !== "upcoming";
  const motm = match.manOfTheMatch;
  const meta = [formatMatchDate(match.date), match.time, match.venue].filter(Boolean).join(" · ");
  const kickoff = match.time ? t("scorecard.startsAt", { time: match.time }) : t("scorecard.startTimeTba");
  const hasFooter = Boolean(match.result || motm.name || !showScore);

  return (
    <article className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.06] shadow-[0_18px_44px_rgba(0,0,0,0.28)]">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
        <div className="min-w-0">
          <p className="text-[0.72rem] font-black uppercase tracking-[0.16em] text-gold">
            {match.matchNumber ? t("scorecard.matchNumber", { n: match.matchNumber }) : t("scorecard.fixture")}
          </p>
          <p className="text-[0.78rem] text-white/60">{meta}</p>
        </div>
        <StatusBadge status={match.status} />
      </header>

      <div className="divide-y divide-white/10 px-4">
        <InningsBlock team={match.teamA} innings={match.teamAInnings} showScore={showScore} />
        <InningsBlock team={match.teamB} innings={match.teamBInnings} showScore={showScore} />
      </div>

      {hasFooter ? (
        <footer className="border-t border-white/10 bg-black/25 px-4 py-3">
          {match.result ? (
            <p className="font-display text-[1rem] uppercase leading-snug text-gold">{match.result}</p>
          ) : !showScore ? (
            <p className="text-sm text-white/65">{kickoff}</p>
          ) : null}
          {motm.name ? (
            <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2 text-sm">
              <span className="text-[0.66rem] font-black uppercase tracking-wider text-white/50">
                {t("scorecard.manOfTheMatch")}
              </span>
              <span className="font-black uppercase">{motm.name}</span>
              {motm.team ? <span className="text-white/60">{motm.team}</span> : null}
              {motm.performance ? <span className="font-bold text-gold">{motm.performance}</span> : null}
            </p>
          ) : null}
        </footer>
      ) : null}
    </article>
  );
}

function Bucket({ title, subtitle, bucket, emptyText, className = "" }) {
  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="flex items-baseline justify-between gap-3 border-b-2 border-gold/60 pb-2">
        <h3 className="text-[1.35rem] uppercase text-white">{title}</h3>
        {subtitle ? (
          <span className="text-[0.74rem] font-bold uppercase tracking-wider text-white/50">{subtitle}</span>
        ) : null}
      </div>
      {bucket?.matches?.length ? (
        bucket.matches.map((match) => <MatchCard key={match.id} match={match} />)
      ) : (
        <div className="grid min-h-[150px] place-items-center rounded-xl border border-dashed border-white/15 px-4 text-center text-sm text-white/55">
          {emptyText}
        </div>
      )}
    </div>
  );
}

export default function ScorecardSection() {
  const [data, setData] = useState(null);
  const { t } = useLanguage();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/matches", { cache: "no-store" });
        const body = await res.json();
        if (!cancelled && res.ok) setData(body);
      } catch {
        // Keep showing whatever loaded last.
      }
    }

    load();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, REFRESH_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  if (!data || (!data.recent && !data.today && !data.upcoming)) return null;

  const { todayDate, recent, today, upcoming } = data;
  const recentTitle = recent?.date === shiftIsoDate(todayDate, -1) ? t("scorecard.yesterday") : t("scorecard.lastMatch");
  const upcomingTitle = upcoming?.date === shiftIsoDate(todayDate, 1) ? t("scorecard.tomorrow") : t("scorecard.nextMatch");

  return (
    <section
      id="scores"
      className="relative overflow-hidden py-16 text-white sm:py-[84px]"
      style={{
        backgroundImage:
          "radial-gradient(ellipse at top left, rgba(11,107,58,0.55), transparent 55%), linear-gradient(180deg, #06301c 0%, #041c10 100%)",
      }}
    >
      <div className="mx-auto w-[min(1180px,calc(100%-32px))]">
        <div className="mb-8 flex flex-col gap-6 sm:mb-[34px] sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2.5 inline-flex items-center gap-2.5 text-[0.76rem] font-black uppercase tracking-[0.18em] text-gold before:h-[3px] before:w-7 before:rounded-full before:bg-gold before:content-['']">
              {t("scorecard.eyebrow")}
            </p>
            <h2 className="max-w-[680px] text-[clamp(2rem,5vw,4.2rem)] uppercase leading-[0.98]">{t("scorecard.heading")}</h2>
          </div>
          <p className="max-w-[440px] font-semibold text-white/70">{t("scorecard.subtitle")}</p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <Bucket
            title={recentTitle}
            subtitle={recent ? formatMatchDate(recent.date) : ""}
            bucket={recent}
            emptyText={t("scorecard.noResults")}
          />
          <Bucket
            title={t("scorecard.today")}
            subtitle={formatMatchDate(todayDate)}
            bucket={today}
            emptyText={t("scorecard.noMatchToday")}
            className="order-first lg:order-none"
          />
          <Bucket
            title={upcomingTitle}
            subtitle={upcoming ? formatMatchDate(upcoming.date) : ""}
            bucket={upcoming}
            emptyText={t("scorecard.nextFixtureTba")}
          />
        </div>
      </div>
    </section>
  );
}
