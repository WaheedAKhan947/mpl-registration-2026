"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import { useLanguage } from "@/lib/i18n/LanguageContext";

function initials(name) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function PlayerRow({ player, captainTitle }) {
  return (
    <div
      className={`flex items-center gap-3.5 rounded-lg border p-3 ${
        player.isCaptain ? "border-gold/60 bg-gold/10" : "border-ink/10"
      }`}
    >
      {player.profilePicture ? (
        <img
          src={player.profilePicture}
          alt={player.playerName}
          className="h-12 w-12 shrink-0 rounded-full border border-ink/10 object-cover"
        />
      ) : (
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-green-dark text-sm font-black text-white">
          {initials(player.playerName)}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <strong className="flex items-center gap-2 text-ink">
          <span className="truncate">{player.playerName}</span>
          {player.isCaptain ? (
            <span
              title={captainTitle}
              className="shrink-0 rounded-full bg-gold px-2 py-0.5 text-[0.7rem] font-black uppercase tracking-wide text-navy-dark"
            >
              C
            </span>
          ) : null}
        </strong>
        <span className="block truncate text-sm text-muted">
          {[player.playingRole, player.battingStyle, player.bowlingStyle].filter(Boolean).join(" • ")}
        </span>
      </div>
    </div>
  );
}

export default function TeamRosterModal({ teamName, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { t } = useLanguage();

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

  return (
    <Modal onClose={onClose} title={teamName}>
      <div className="flex flex-col gap-4">
        {loading ? <p className="text-muted">{t("teamRoster.loading")}</p> : null}
        {error ? <p className="font-semibold text-brand-red">{error}</p> : null}

        {data ? (
          <>
            <div className="grid gap-2.5 sm:grid-cols-2">
              <div className="rounded-lg bg-paper px-3.5 py-3">
                <span className="text-sm font-bold text-muted">{t("teamRoster.owner")}</span>
                <p className="font-black text-green-dark">{data.ownerName || t("teamRoster.tba")}</p>
              </div>
              <div className="rounded-lg bg-paper px-3.5 py-3">
                <span className="text-sm font-bold text-muted">{t("teamRoster.captain")}</span>
                <p className="font-black text-green-dark">{data.captainName || t("teamRoster.tba")}</p>
              </div>
            </div>

            {data.players.length ? (
              <div className="grid gap-2.5">
                {data.players.map((player) => (
                  <PlayerRow key={player.id} player={player} captainTitle={t("teamRoster.captain")} />
                ))}
              </div>
            ) : (
              <p className="text-muted">{t("teamRoster.squadNotFinal")}</p>
            )}
          </>
        ) : null}
      </div>
    </Modal>
  );
}
