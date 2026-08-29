"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";

function initials(name) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function PlayerRow({ player }) {
  return (
    <div className="flex items-center gap-3.5 rounded-lg border border-ink/10 p-3">
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
        <strong className="block truncate text-ink">{player.playerName}</strong>
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
        if (!ok) throw new Error(body.error || "Could not load this team.");
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
        {loading ? <p className="text-muted">Loading squad...</p> : null}
        {error ? <p className="font-semibold text-brand-red">{error}</p> : null}

        {data ? (
          <>
            <div className="rounded-lg bg-paper px-3.5 py-3">
              <span className="text-sm font-bold text-muted">Owner</span>
              <p className="font-black text-green-dark">{data.ownerName || "To be announced"}</p>
            </div>

            {data.players.length ? (
              <div className="grid gap-2.5">
                {data.players.map((player) => (
                  <PlayerRow key={player.id} player={player} />
                ))}
              </div>
            ) : (
              <p className="text-muted">Squad not finalized yet.</p>
            )}
          </>
        ) : null}
      </div>
    </Modal>
  );
}
