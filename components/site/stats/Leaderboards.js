"use client";

import { useEffect, useState } from "react";
import PlayerLink from "@/components/site/PlayerLink";
import { teamLogo } from "@/lib/matches";
import { useLanguage } from "@/lib/i18n/LanguageContext";

function initials(name = "") {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function TeamTag({ team, light = false }) {
  if (!team) return null;
  const logo = teamLogo(team);
  return (
    <span className={`inline-flex min-w-0 items-center gap-1.5 text-xs font-bold ${light ? "text-white/80" : "text-muted"}`}>
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt="" className="h-4 w-4 shrink-0 object-contain" />
      ) : null}
      <span className="truncate">{team}</span>
    </span>
  );
}

function CapCard({ entry, kind, t }) {
  const orange = kind === "orange";
  const gradient = orange
    ? "linear-gradient(135deg, #e8720c 0%, #f4b63d 100%)"
    : "linear-gradient(135deg, #4b1d8f 0%, #8a3fd1 100%)";
  return (
    <article className="relative overflow-hidden rounded-2xl p-5 text-white shadow-panel" style={{ backgroundImage: gradient }}>
      <p className="text-[0.72rem] font-black uppercase tracking-[0.18em] text-white/85">
        {t(orange ? "leaders.orangeCap" : "leaders.purpleCap")} · {t(orange ? "leaders.orangeCapHint" : "leaders.purpleCapHint")}
      </p>
      {entry ? (
        <div className="mt-3 flex items-center gap-4">
          {entry.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={entry.photo} alt="" className="h-20 w-20 shrink-0 rounded-full border-4 border-white/80 object-cover shadow-lg" />
          ) : (
            <span className="grid h-20 w-20 shrink-0 place-items-center rounded-full border-4 border-white/80 bg-black/20 text-2xl font-black">
              {initials(entry.name)}
            </span>
          )}
          <div className="min-w-0">
            <PlayerLink id={entry.player} className="block truncate font-display text-[1.6rem] uppercase leading-tight">
              {entry.name}
            </PlayerLink>
            <TeamTag team={entry.team} light />
            <p className="mt-1 font-display text-[2rem] leading-none tabular-nums">
              {orange
                ? entry.value === 1
                  ? t("leaders.run")
                  : t("leaders.runs", { n: entry.value })
                : entry.value === 1
                  ? t("leaders.wicket")
                  : t("leaders.wickets", { n: entry.value })}
            </p>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm font-semibold text-white/85">{t("leaders.nothingYet")}</p>
      )}
    </article>
  );
}

function detailText(listKey, entry, t) {
  const d = entry.detail || {};
  const vs = entry.opponent ? t("leaders.vs", { team: entry.opponent }) : "";
  switch (listKey) {
    case "mostRuns":
      return [t("leaders.innings", { n: d.innings }), t("leaders.sr", { n: d.strikeRate })].join(" · ");
    case "highestScores":
      return [vs, t("leaders.balls", { n: d.balls })].filter(Boolean).join(" · ");
    case "bestStrikeRate":
      return `${t("leaders.runs", { n: d.runs })} · ${t("leaders.balls", { n: d.balls })}`;
    case "bestAverage":
      return `${t("leaders.runs", { n: d.runs })} · ${t("leaders.innings", { n: d.innings })}`;
    case "mostSixes":
    case "mostFours":
      return t("leaders.innings", { n: d.innings });
    case "mostWickets":
      return [t("leaders.overs", { n: d.overs }), d.economy !== null ? t("leaders.econ", { n: d.economy }) : ""].filter(Boolean).join(" · ");
    case "bestFigures":
      return [vs, t("leaders.overs", { n: d.overs })].filter(Boolean).join(" · ");
    case "bestEconomy":
    case "mostDots":
      return t("leaders.overs", { n: d.overs });
    case "mostCatches":
      return "";
    default:
      return "";
  }
}

function LeaderList({ listKey, entries, note, t }) {
  return (
    <section className="overflow-hidden rounded-xl border border-ink/10 bg-white shadow-[0_8px_24px_rgba(6,66,39,0.06)]">
      <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-ink/[0.06] px-4 py-3">
        <h3 className="text-[0.82rem] font-black uppercase tracking-[0.12em] text-green-dark">{t(`leaders.${listKey}`)}</h3>
        {note ? <span className="text-[0.7rem] font-bold text-muted">{note}</span> : null}
      </header>
      {entries.length ? (
        <ol className="divide-y divide-ink/[0.06]">
          {entries.map((entry, index) => (
            <li key={`${entry.player}-${entry.match || index}`} className={`flex items-center gap-3 px-4 py-2.5 ${index === 0 ? "bg-gold/10" : ""}`}>
              <span className={`w-5 shrink-0 text-sm font-black tabular-nums ${index === 0 ? "text-ember" : "text-muted"}`}>{index + 1}</span>
              <span className="min-w-0 flex-1">
                <PlayerLink id={entry.player} className="block truncate font-bold text-ink">
                  {entry.name}
                </PlayerLink>
                <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <TeamTag team={entry.team} />
                  {detailText(listKey, entry, t) ? <span className="text-xs text-muted">{detailText(listKey, entry, t)}</span> : null}
                </span>
              </span>
              <span dir="ltr" className="shrink-0 font-display text-[1.35rem] tabular-nums text-navy-dark">{entry.value}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="px-4 py-5 text-sm text-muted">{t("leaders.nothingYet")}</p>
      )}
    </section>
  );
}

export default function Leaderboards() {
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState("batting");

  useEffect(() => {
    fetch("/api/stats/leaders", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("failed"))))
      .then(setData)
      .catch(() => setError(true));
  }, []);

  const q = data?.qualifiers || {};
  const notes = {
    bestStrikeRate: t("leaders.minBalls", { n: q.strikeRateMinBalls }),
    bestAverage: t("leaders.minInnings", { n: q.averageMinInnings }),
    bestEconomy: t("leaders.minOvers", { n: (q.economyMinBalls || 0) / 6 }),
  };
  const lists = {
    batting: ["mostRuns", "highestScores", "bestStrikeRate", "bestAverage", "mostSixes", "mostFours"],
    bowling: ["mostWickets", "bestFigures", "bestEconomy", "mostDots"],
    fielding: ["mostCatches", "mostDismissals"],
  };

  return (
    <>
      <section
        className="text-white"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at top left, rgba(11,107,58,0.55), transparent 55%), linear-gradient(180deg, #06301c 0%, #041c10 100%)",
        }}
      >
        <div className="mx-auto w-[min(1100px,calc(100%-32px))] py-10 sm:py-14">
          <p className="mb-2.5 inline-flex items-center gap-2.5 text-[0.76rem] font-black uppercase tracking-[0.18em] text-gold before:h-[3px] before:w-7 before:rounded-full before:bg-gold before:content-['']">
            {t("leaders.eyebrow")}
          </p>
          <h1 className="text-[clamp(2.2rem,6vw,4.2rem)] uppercase leading-[0.98]">{t("leaders.heading")}</h1>
          <p className="mt-3 max-w-[560px] font-semibold text-white/70">{t("leaders.subtitle")}</p>
          {data?.matchCount ? (
            <p className="mt-2 text-sm font-bold text-gold">
              {data.matchCount === 1 ? t("leaders.matchCounted") : t("leaders.matchesCounted", { n: data.matchCount })}
            </p>
          ) : null}
        </div>
      </section>

      <div className="mx-auto w-[min(1100px,calc(100%-32px))] py-8">
        {error ? <p className="text-center font-semibold text-brand-red">{t("leaders.loadError")}</p> : null}
        {!data && !error ? <p className="text-center font-semibold text-muted">{t("leaders.loading")}</p> : null}
        {data && !data.matchCount ? (
          <p className="rounded-xl border border-dashed border-ink/20 bg-white px-4 py-10 text-center font-semibold text-muted">
            {t("leaders.empty")}
          </p>
        ) : null}

        {data?.matchCount ? (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <CapCard entry={data.orangeCap} kind="orange" t={t} />
              <CapCard entry={data.purpleCap} kind="purple" t={t} />
            </div>

            <div className="mt-8 flex gap-2" role="tablist">
              {Object.keys(lists).map((key) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={tab === key}
                  onClick={() => setTab(key)}
                  className={`rounded-full px-5 py-2 text-sm font-extrabold transition ${
                    tab === key ? "bg-green text-white" : "bg-white text-green-dark ring-1 ring-ink/10 hover:bg-green/10"
                  }`}
                >
                  {t(`leaders.tabs.${key}`)}
                </button>
              ))}
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {lists[tab].map((key) => (
                <LeaderList key={key} listKey={key} entries={data[tab][key] || []} note={notes[key]} t={t} />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
