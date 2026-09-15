"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";

const CONTROL_CLASSES =
  "min-w-[160px] flex-1 rounded-lg border border-ink/15 bg-white px-3 py-2 font-medium outline-none focus:border-green";

function draftFor(team) {
  return { ownerName: team.ownerName || "", captainId: team.captainId || "" };
}

export default function TeamOwnersCard() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [drafts, setDrafts] = useState({});
  const [savingName, setSavingName] = useState("");

  useEffect(() => {
    loadTeams();
  }, []);

  async function loadTeams() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/teams", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load teams.");
      setTeams(data.teams);
      setDrafts(Object.fromEntries(data.teams.map((team) => [team.name, draftFor(team)])));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function updateDraft(name, patch) {
    setDrafts((prev) => ({ ...prev, [name]: { ...prev[name], ...patch } }));
  }

  async function handleSave(name) {
    const draft = drafts[name] || { ownerName: "", captainId: "" };
    setSavingName(name);
    setError("");
    try {
      const res = await fetch("/api/admin/teams", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          ownerName: draft.ownerName || "",
          captainId: draft.captainId || "",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save the team.");
      setTeams((prev) =>
        prev.map((team) =>
          team.name === name
            ? { ...team, ownerName: (draft.ownerName || "").trim(), captainId: draft.captainId || "" }
            : team
        )
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingName("");
    }
  }

  return (
    <section className="mb-6 rounded-2xl border border-ink/10 bg-white p-5 shadow-panel">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="mb-1 text-lg font-bold text-ink">Team Owners &amp; Captains</h2>
          <p className="text-muted">
            Set each franchise&apos;s owner and pick a captain from its allocated players. Both are
            shown to visitors when they open a team&apos;s roster.
          </p>
        </div>
        <Button type="button" variant="secondary" disabled={loading} onClick={loadTeams}>
          Refresh
        </Button>
      </div>

      {error ? <p className="mb-3 font-semibold text-brand-red">{error}</p> : null}
      {loading ? <p className="text-muted">Loading teams...</p> : null}

      {!loading ? (
        <ul className="grid gap-3">
          {teams.map((team) => {
            const draft = drafts[team.name] || { ownerName: "", captainId: "" };
            const isDirty =
              draft.ownerName !== (team.ownerName || "") || draft.captainId !== (team.captainId || "");
            return (
              <li
                key={team.name}
                className="flex flex-wrap items-center gap-3.5 rounded-lg border border-ink/10 p-3.5"
              >
                <div className="min-w-[160px] flex-1">
                  <p className="font-bold text-ink">{team.name}</p>
                  <p className="text-sm text-muted">
                    {team.playerCount} player{team.playerCount === 1 ? "" : "s"} allocated
                  </p>
                </div>
                <input
                  value={draft.ownerName}
                  onChange={(event) => updateDraft(team.name, { ownerName: event.target.value })}
                  placeholder="Owner name"
                  aria-label={`${team.name} owner`}
                  className={CONTROL_CLASSES}
                />
                <select
                  value={draft.captainId}
                  onChange={(event) => updateDraft(team.name, { captainId: event.target.value })}
                  aria-label={`${team.name} captain`}
                  disabled={team.players.length === 0}
                  className={`${CONTROL_CLASSES} disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  <option value="">
                    {team.players.length ? "No captain" : "No players allocated yet"}
                  </option>
                  {team.players.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.playerName}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  disabled={!isDirty || savingName === team.name}
                  onClick={() => handleSave(team.name)}
                >
                  {savingName === team.name ? "Saving..." : "Save"}
                </Button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
