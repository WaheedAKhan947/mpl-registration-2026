"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Modal from "@/components/ui/Modal";
import { TEAM_CARDS } from "@/lib/siteData";
import { useLanguage } from "@/lib/i18n/LanguageContext";

function initials(name) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function LeaderAvatar({
  player,
  label,
  size = "h-36 w-36 sm:h-44 sm:w-44",
  ringClass = "border-gold",
  labelTextClass = "text-gold",
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`relative ${size}`}>
        {player.profilePicture ? (
          <img
            src={player.profilePicture}
            alt={player.playerName}
            className={`h-full w-full rounded-full border-4 ${ringClass} object-cover shadow-panel-navy`}
          />
        ) : (
          <span
            className={`grid h-full w-full place-items-center rounded-full border-4 ${ringClass} bg-green text-3xl font-black text-white`}
          >
            {initials(player.playerName)}
          </span>
        )}
        <span
          className={`absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-navy-dark px-3 py-1 text-[0.62rem] font-black uppercase tracking-wide ${labelTextClass} shadow`}
        >
          {label}
        </span>
      </div>
      <p className="mt-1 max-w-[10rem] truncate text-center text-sm font-extrabold uppercase text-white">
        {player.playerName}
      </p>
    </div>
  );
}

function PlayerLine({ player, captainLabel, viceCaptainLabel, wkLabel }) {
  return (
    <li className="flex items-center gap-2 border-b border-white/10 py-2 last:border-0">
      <span className="min-w-0 flex-1 truncate text-[0.92rem] font-extrabold uppercase tracking-wide text-white">
        {player.playerName}
      </span>
      {player.isCaptain ? (
        <span
          title={captainLabel}
          className="shrink-0 rounded bg-gold px-1.5 py-[1px] text-[0.62rem] font-black uppercase tracking-wide text-navy-dark"
        >
          C
        </span>
      ) : player.isViceCaptain ? (
        <span
          title={viceCaptainLabel}
          className="shrink-0 rounded bg-lime px-1.5 py-[1px] text-[0.62rem] font-black uppercase tracking-wide text-navy-dark"
        >
          VC
        </span>
      ) : null}
      {!player.isCaptain && !player.isViceCaptain && player.playingRole === "Wicket Keeper" ? (
        <span
          title={wkLabel}
          className="shrink-0 rounded bg-white/15 px-1.5 py-[1px] text-[0.62rem] font-black uppercase tracking-wide text-white/85"
        >
          WK
        </span>
      ) : null}
    </li>
  );
}

export default function TeamRosterModal({ teamName, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { t } = useLanguage();

  const crest = useMemo(
    () => TEAM_CARDS.find((team) => team.name === teamName)?.code || null,
    [teamName]
  );

  useEffect(() => {
    if (!teamName) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    setData(null);

    fetch(`/api/teams?name=${encodeURIComponent(teamName)}`, { cache: "no-store" })
      .then((res) => res.json().then((body) => ({ ok: res.ok, body })))
      .then(({ ok, body }) => {
        if (cancelled) return;
        if (!ok) throw new Error(body.error || t("teamRoster.couldNotLoad"));
        setData(body);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [teamName]);

  if (!teamName) return null;

  const captain = data?.players.find((player) => player.isCaptain) || null;
  const viceCaptain = data?.players.find((player) => player.isViceCaptain) || null;

  return (
    <Modal
      onClose={onClose}
      hideHeader
      maxWidthClassName="max-w-2xl"
      panelClassName="relative p-0 text-white ring-1 ring-lime/25"
    >
      <div
        className="relative"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at top left, rgba(184,229,74,0.2), transparent 55%), radial-gradient(ellipse at bottom right, rgba(244,182,61,0.14), transparent 50%), linear-gradient(180deg, #06301c 0%, #041c10 100%)",
        }}
      >
        {crest ? (
          <Image
            src={crest}
            alt=""
            width={280}
            height={280}
            aria-hidden="true"
            className="pointer-events-none absolute -right-10 -top-10 opacity-[0.08]"
          />
        ) : null}

        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-20 grid h-9 w-9 place-items-center rounded-full bg-black/25 text-lg text-white/90 transition hover:bg-black/45"
        >
          ✕
        </button>

        <div className="relative z-10 flex flex-col gap-6 p-6 sm:p-8">
          <div className="text-center">
            <span className="inline-block rounded-full bg-gold px-4 py-1 text-[0.68rem] font-black uppercase tracking-[0.2em] text-navy-dark">
              {t("teamRoster.badge")}
            </span>
            <h2 className="mt-3 text-[clamp(1.9rem,6vw,3rem)] font-black uppercase italic leading-[0.95] text-white [text-shadow:0_4px_0_rgba(0,0,0,0.3)]">
              {teamName}
            </h2>
            {data ? (
              <p className="mt-1.5 text-sm font-bold uppercase tracking-wide text-lime">
                {t("teamRoster.ownedBy", { owner: data.ownerName || t("teamRoster.tba") })}
              </p>
            ) : null}
          </div>

          {loading ? <p className="text-center text-white/80">{t("teamRoster.loading")}</p> : null}
          {error ? <p className="text-center font-semibold text-brand-red">{error}</p> : null}

          {data ? (
            <div className="flex flex-col gap-6 sm:grid sm:grid-cols-[1fr_auto] sm:items-start">
              {captain || viceCaptain ? (
                <div className="mx-auto flex shrink-0 flex-row flex-wrap items-start justify-center gap-4 sm:order-2 sm:mx-0 sm:flex-col sm:items-center">
                  {captain ? <LeaderAvatar player={captain} label={t("teamRoster.captain")} /> : null}
                  {viceCaptain ? (
                    <LeaderAvatar
                      player={viceCaptain}
                      label={t("teamRoster.viceCaptain")}
                      size="h-28 w-28 sm:h-32 sm:w-32"
                      ringClass="border-lime"
                      labelTextClass="text-lime"
                    />
                  ) : null}
                </div>
              ) : null}

              <div className="min-w-0 sm:order-1">
                <h3 className="mb-1 text-[0.7rem] font-black uppercase tracking-[0.2em] text-white/60">
                  {t("teamRoster.squad")}
                </h3>
                {data.players.length ? (
                  <ul className="flex flex-col">
                    {data.players.map((player) => (
                      <PlayerLine
                        key={player.id}
                        player={player}
                        captainLabel={t("teamRoster.captain")}
                        viceCaptainLabel={t("teamRoster.viceCaptain")}
                        wkLabel={t("teamRoster.wicketKeeper")}
                      />
                    ))}
                  </ul>
                ) : (
                  <p className="text-white/70">{t("teamRoster.squadNotFinal")}</p>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
