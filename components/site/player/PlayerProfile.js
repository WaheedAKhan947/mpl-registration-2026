"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatMatchDate, teamLogo } from "@/lib/matches";
import { useLanguage } from "@/lib/i18n/LanguageContext";

function initials(name = "") {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function Badge({ children, className }) {
  return <span className={`rounded-full px-3 py-1 text-[0.68rem] font-black uppercase tracking-wider ${className}`}>{children}</span>;
}

function StatGrid({ title, items }) {
  return (
    <section className="overflow-hidden rounded-xl border border-ink/10 bg-white shadow-[0_8px_24px_rgba(6,66,39,0.06)]">
      <h2 className="border-b border-ink/[0.06] px-4 py-3 text-[0.82rem] font-black uppercase tracking-[0.12em] text-green-dark">{title}</h2>
      <dl className="grid grid-cols-3 gap-px bg-ink/[0.06] sm:grid-cols-4">
        {items.map(([label, value]) => (
          <div key={label} className="bg-white px-3 py-3 text-center">
            <dd dir="ltr" className="font-display text-[1.6rem] leading-none tabular-nums text-navy-dark">{value ?? "–"}</dd>
            <dt className="mt-1 text-[0.68rem] font-bold uppercase tracking-wide text-muted">{label}</dt>
          </div>
        ))}
      </dl>
    </section>
  );
}

function MatchRow({ row, t }) {
  const bat = row.batting;
  const bowl = row.bowling;
  const field = row.fielding || {};
  const fielding = [
    field.catches ? t("player.catchesShort", { n: field.catches }) : "",
    field.runOuts ? t("player.runOutsShort", { n: field.runOuts }) : "",
    field.stumpings ? t("player.stumpingsShort", { n: field.stumpings }) : "",
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <li>
      <Link href={`/match/${row.matchId}`} className="grid gap-2 px-4 py-3 transition hover:bg-green/[0.04] sm:grid-cols-[1.2fr_1fr_1fr] sm:items-center">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 font-bold text-ink">
            {t("player.vs", { team: row.opponent })}
            {row.won === true ? <Badge className="bg-green/15 text-green-dark">{t("player.won")}</Badge> : null}
            {row.won === false ? <Badge className="bg-brand-red/10 text-brand-red">{t("player.lost")}</Badge> : null}
          </p>
          <p className="text-xs text-muted">
            {formatMatchDate(row.date, { withYear: true })}
            {row.matchNumber ? ` · ${t("scorecard.matchNumber", { n: row.matchNumber })}` : ""}
          </p>
        </div>
        <div className="text-sm">
          <span className="text-[0.66rem] font-black uppercase tracking-wider text-muted">{t("player.batting")} </span>
          {bat ? (
            <>
              <span dir="ltr" className="inline-block font-black tabular-nums text-ink">
                {bat.runs}
                {bat.out ? "" : "*"} ({bat.balls})
              </span>
              {bat.dismissal ? (
                <span className="block text-xs text-muted" dir="ltr">
                  {bat.dismissal}
                </span>
              ) : null}
            </>
          ) : (
            <span className="text-muted">{t("player.didNotBat")}</span>
          )}
        </div>
        <div className="text-sm">
          <span className="text-[0.66rem] font-black uppercase tracking-wider text-muted">{t("player.bowling")} </span>
          {bowl ? (
            <span dir="ltr" className="inline-block font-black tabular-nums text-ink">
              {bowl.wickets}-{bowl.runs} ({bowl.overs})
            </span>
          ) : (
            <span className="text-muted">{t("player.didNotBowl")}</span>
          )}
          {fielding ? <span className="block text-xs text-muted">{fielding}</span> : null}
        </div>
      </Link>
    </li>
  );
}

export default function PlayerProfile({ playerId }) {
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/players/${encodeURIComponent(playerId)}/stats`, { cache: "no-store" })
      .then(async (res) => {
        if (res.status === 404) throw new Error("notFound");
        if (!res.ok) throw new Error("failed");
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message));
  }, [playerId]);

  if (error) {
    return (
      <div className="mx-auto grid min-h-[50vh] w-[min(1000px,calc(100%-32px))] place-items-center text-center">
        <div>
          <p className="text-lg font-black text-ink">{error === "notFound" ? t("player.notFound") : t("leaders.loadError")}</p>
          <Link href="/stats" className="mt-3 inline-block font-extrabold text-green-dark">
            {t("player.back")}
          </Link>
        </div>
      </div>
    );
  }
  if (!data) return <p className="py-16 text-center font-semibold text-muted">{t("player.loading")}</p>;

  const { player, career, matches } = data;
  const bat = career.batting;
  const bowl = career.bowling;
  const logo = teamLogo(player.team);

  return (
    <>
      <section
        className="text-white"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at top left, rgba(11,107,58,0.55), transparent 55%), linear-gradient(180deg, #06301c 0%, #041c10 100%)",
        }}
      >
        <div className="mx-auto w-[min(1000px,calc(100%-32px))] py-8 sm:py-12">
          <Link href="/stats" className="text-sm font-extrabold text-gold hover:text-white">
            {t("player.back")}
          </Link>
          <div className="mt-5 flex flex-col items-center gap-5 text-center sm:flex-row sm:text-start">
            {player.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={player.photo} alt={player.name} className="h-36 w-36 shrink-0 rounded-full border-4 border-gold object-cover shadow-panel-navy" />
            ) : (
              <span className="grid h-36 w-36 shrink-0 place-items-center rounded-full border-4 border-gold bg-green text-4xl font-black">
                {initials(player.name)}
              </span>
            )}
            <div className="min-w-0">
              <h1 className="text-[clamp(2rem,6vw,3.4rem)] uppercase leading-[0.98]">{player.name}</h1>
              {player.team ? (
                <p className="mt-2 inline-flex items-center gap-2 font-bold text-white/85">
                  {logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logo} alt="" className="h-7 w-7 object-contain" />
                  ) : null}
                  {player.team}
                </p>
              ) : null}
              <p className="mt-1 text-sm text-white/70">
                {[player.role, player.battingStyle && `${t("player.battingStyle")}: ${player.battingStyle}`, player.bowlingStyle && `${t("player.bowlingStyle")}: ${player.bowlingStyle}`]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                {player.captain ? <Badge className="bg-gold text-navy-dark">{t("player.captain")}</Badge> : null}
                {player.viceCaptain ? <Badge className="bg-lime text-navy-dark">{t("player.viceCaptain")}</Badge> : null}
                {player.orangeCap ? <Badge className="bg-ember text-white">{t("player.orangeCap")}</Badge> : null}
                {player.purpleCap ? <Badge className="bg-[#6b2fb3] text-white">{t("player.purpleCap")}</Badge> : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid w-[min(1000px,calc(100%-32px))] gap-5 py-8">
        {career.matches === 0 ? (
          <p className="rounded-xl border border-dashed border-ink/20 bg-white px-4 py-10 text-center font-semibold text-muted">{t("player.noStats")}</p>
        ) : (
          <>
            <StatGrid
              title={t("player.batting")}
              items={[
                [t("player.matches"), career.matches],
                [t("player.innings"), bat.innings],
                [t("player.runs"), bat.runs],
                [t("player.highest"), bat.highestText || "–"],
                [t("player.average"), bat.average ?? "–"],
                [t("player.strikeRate"), bat.strikeRate],
                [t("player.notOuts"), bat.notOuts],
                [t("player.thirties"), bat.thirties],
                [t("player.fifties"), bat.fifties + bat.hundreds],
                [t("player.fours"), bat.fours],
                [t("player.sixes"), bat.sixes],
                [t("player.ducks"), bat.ducks],
              ]}
            />
            <StatGrid
              title={t("player.bowling")}
              items={[
                [t("player.innings"), bowl.innings],
                [t("player.overs"), bowl.overs],
                [t("player.wickets"), bowl.wickets],
                [t("player.best"), bowl.bestText || "–"],
                [t("player.runsConceded"), bowl.runs],
                [t("player.economy"), bowl.economy ?? "–"],
                [t("player.average"), bowl.average ?? "–"],
                [t("player.threeWickets"), bowl.threeWickets + bowl.fiveWickets],
                [t("player.maidens"), bowl.maidens],
                [t("player.dots"), bowl.dots],
              ]}
            />
            <StatGrid
              title={t("player.fielding")}
              items={[
                [t("player.catches"), career.fielding.catches],
                [t("player.runOuts"), career.fielding.runOuts],
                [t("player.stumpings"), career.fielding.stumpings],
              ]}
            />
            <section className="overflow-hidden rounded-xl border border-ink/10 bg-white shadow-[0_8px_24px_rgba(6,66,39,0.06)]">
              <h2 className="border-b border-ink/[0.06] px-4 py-3 text-[0.82rem] font-black uppercase tracking-[0.12em] text-green-dark">
                {t("player.matchLog")}
              </h2>
              <ol className="divide-y divide-ink/[0.06]">
                {matches.map((row) => (
                  <MatchRow key={row.matchId} row={row} t={t} />
                ))}
              </ol>
            </section>
          </>
        )}
      </div>
    </>
  );
}
