"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";

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
      setDrafts(Object.fromEntries(data.teams.map((team) => [team.name, team.ownerName])));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(name) {
    setSavingName(name);
    setError("");
    try {
      const res = await fetch("/api/admin/teams", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, ownerName: drafts[name] || "" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save the owner.");
      setTeams((prev) =>
        prev.map((team) => (team.name === name ? { ...team, ownerName: (drafts[name] || "").trim() } : team))
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingName("");
    }
  }

  return (
    <section className="mb-6 rounded-2xl border border-ink/10 bg-white p-5 shadow-panel">
      <h2 className="mb-1 text-lg font-bold text-ink">Team Owners</h2>
      <p className="mb-4 text-muted">
        Set each franchise's owner. Shown to visitors when they open a team's roster.
      </p>

      {error ? <p className="mb-3 font-semibold text-brand-red">{error}</p> : null}
      {loading ? <p className="text-muted">Loading teams...</p> : null}

      {!loading ? (
        <ul className="grid gap-3">
          {teams.map((team) => {
            const isDirty = (drafts[team.name] || "") !== (team.ownerName || "");
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
                  value={drafts[team.name] || ""}
                  onChange={(event) =>
                    setDrafts((prev) => ({ ...prev, [team.name]: event.target.value }))
                  }
                  placeholder="Owner name"
                  className="min-w-[160px] flex-1 rounded-lg border border-ink/15 px-3 py-2 font-medium outline-none focus:border-green"
                />
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
