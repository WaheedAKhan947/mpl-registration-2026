"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const COUNT_DURATION_MS = 1400;

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function TeamsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true">
      <path d="M12 3l7 3v5c0 5-3.5 8.6-7 10-3.5-1.4-7-5-7-10V6l7-3z" />
      <path d="M9.5 12l1.8 1.8L15 10" />
    </svg>
  );
}

function PlayersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M19 8v6M22 11h-6" />
    </svg>
  );
}

function FairPlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true">
      <path d="M12 3v18M5 7h14" />
      <path d="M5 7l-3 7a3 3 0 0 0 6 0L5 7zM19 7l-3 7a3 3 0 0 0 6 0l-3-7z" />
    </svg>
  );
}

function getBaseStats(t) {
  return [
    {
      key: "teams",
      target: 6,
      suffix: "",
      label: t("stats.teamsLabel"),
      blurb: t("stats.teamsBlurb"),
      Icon: TeamsIcon,
      chip: "bg-navy-dark/10 text-navy-dark group-hover:bg-navy-dark group-hover:text-gold",
      bar: "bg-navy-dark",
    },
    {
      key: "players",
      target: 0,
      suffix: "",
      label: t("stats.playersLabel"),
      blurb: t("stats.playersBlurb"),
      live: true,
      Icon: PlayersIcon,
      chip: "bg-brand-red/10 text-brand-red group-hover:bg-brand-red group-hover:text-white",
      bar: "bg-brand-red",
    },
    {
      key: "fairplay",
      target: 100,
      suffix: "%",
      label: t("stats.fairplayLabel"),
      blurb: t("stats.fairplayBlurb"),
      Icon: FairPlayIcon,
      chip: "bg-ember/10 text-ember group-hover:bg-ember group-hover:text-white",
      bar: "bg-ember",
    },
  ];
}

// Counts from whatever is currently shown to the new target, so a late-arriving
// live number glides up instead of snapping back to zero.
function useCountUp(target, active) {
  const [value, setValue] = useState(0);
  const valueRef = useRef(0);

  useEffect(() => {
    if (!active) return;
    const from = valueRef.current;
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion || from === target) {
      valueRef.current = target;
      setValue(target);
      return;
    }

    let start;
    let frame;
    function step(timestamp) {
      if (start === undefined) start = timestamp;
      const progress = Math.min((timestamp - start) / COUNT_DURATION_MS, 1);
      const next = Math.round(from + (target - from) * easeOutCubic(progress));
      valueRef.current = next;
      setValue(next);
      if (progress < 1) frame = requestAnimationFrame(step);
    }
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [active, target]);

  return value;
}

function StatTile({ stat, active, index, liveLabel }) {
  const value = useCountUp(stat.target, active);
  const { Icon } = stat;

  return (
    <div
      className={`group relative flex items-center gap-4 p-6 transition-all duration-700 ease-out sm:flex-col sm:items-start sm:gap-5 sm:p-7 lg:p-8 ${
        active ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
      style={{ transitionDelay: `${index * 120}ms` }}
    >
      <span
        className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl transition-colors duration-300 ${stat.chip}`}
      >
        <Icon />
      </span>

      <div className="min-w-0">
        <div className="flex flex-wrap items-end gap-x-2.5 gap-y-1">
          <strong className="font-display text-[clamp(2.4rem,4.5vw,3.4rem)] leading-none text-navy-dark tabular-nums">
            {value.toLocaleString("en-US")}
            {stat.suffix ? <span className="text-navy-dark">{stat.suffix}</span> : null}
          </strong>
          {stat.live ? (
            <span className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-green/10 px-2 py-0.5 text-[0.65rem] font-black uppercase tracking-wider text-green">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green" />
              </span>
              {liveLabel}
            </span>
          ) : null}
        </div>
        <span className="mt-1.5 block text-[0.8rem] font-black uppercase tracking-[0.14em] text-ink">
          {stat.label}
        </span>
        <span className="block text-sm text-muted">{stat.blurb}</span>
      </div>

      <span
        aria-hidden="true"
        className={`absolute bottom-0 left-0 h-[3px] w-0 transition-all duration-500 ease-out group-hover:w-full ${stat.bar}`}
      />
    </div>
  );
}

export default function StatsBar() {
  const panelRef = useRef(null);
  const [active, setActive] = useState(false);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const { t } = useLanguage();

  useEffect(() => {
    const node = panelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    fetch("/api/stats", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setTotalPlayers(data.totalPlayers || 0))
      .catch(() => {});
  }, []);

  const stats = getBaseStats(t).map((stat) =>
    stat.key === "players" ? { ...stat, target: totalPlayers } : stat
  );

  return (
    <section aria-label={t("stats.ariaLabel")} className="relative z-10 mt-6 sm:mt-9">
      <div
        ref={panelRef}
        className="mx-auto flex w-[min(1180px,calc(100%-32px))] flex-col overflow-hidden rounded-2xl bg-white shadow-panel-navy ring-1 ring-ink/10 lg:flex-row"
      >
        {/* Intro cell: colours lifted from the MPL crest (navy shield, gold rim,
            red/orange/gold lettering). The gold line on the tile edge echoes the rim. */}
        <div className="relative flex shrink-0 flex-col justify-center overflow-hidden bg-navy-dark p-6 text-white after:absolute after:inset-x-0 after:bottom-0 after:h-1 after:bg-gradient-to-r after:from-[#b8811a] after:via-gold after:to-[#b8811a] after:content-[''] sm:p-7 lg:w-[360px] lg:p-8 lg:after:inset-y-0 lg:after:left-auto lg:after:right-0 lg:after:h-auto lg:after:w-1 lg:after:bg-gradient-to-b">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-navy-light/70 via-navy-dark to-navy-dark"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -right-14 -top-14 h-48 w-48 rounded-full bg-gold/25 blur-3xl"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-16 -left-12 h-44 w-44 rounded-full bg-brand-red/35 blur-3xl"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 right-16 h-28 w-28 rounded-full bg-ember/30 blur-2xl"
          />

          <div className="relative flex items-center gap-5">
            <div className="min-w-0 flex-1">
              <p className="mb-2.5 inline-flex items-center gap-2.5 text-[0.76rem] font-black uppercase tracking-[0.18em] text-gold before:h-[3px] before:w-7 before:rounded-full before:bg-gold before:content-['']">
                {t("stats.eyebrow")}
              </p>
              <h2 className="text-[clamp(1.7rem,2.6vw,2.3rem)] uppercase leading-[0.95] text-white">
                <span className="bg-gradient-to-r from-brand-red via-ember to-gold bg-clip-text text-transparent">
                  MPL
                </span>{" "}
                {t("stats.headingSuffix")}
              </h2>
              <p className="mt-2.5 text-sm text-white/65">{t("stats.subtitle")}</p>
            </div>
            <Image
              src="/logo.png"
              alt={t("stats.crestAlt")}
              width={112}
              height={112}
              className="h-[72px] w-[72px] shrink-0 drop-shadow-[0_12px_28px_rgba(244,182,61,0.45)] sm:h-24 sm:w-24 lg:h-[96px] lg:w-[96px]"
            />
          </div>
        </div>

        <div className="grid flex-1 grid-cols-1 divide-y divide-ink/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {stats.map((stat, index) => (
            <StatTile key={stat.key} stat={stat} active={active} index={index} liveLabel={t("stats.live")} />
          ))}
        </div>
      </div>
    </section>
  );
}
