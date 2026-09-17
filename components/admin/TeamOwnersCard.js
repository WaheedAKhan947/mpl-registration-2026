"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Panel from "@/components/admin/Panel";
import Notice from "@/components/admin/Notice";
import { RefreshIcon } from "@/components/admin/icons";
import { INPUT_CLASSES } from "@/components/admin/formStyles";
import { teamLogo } from "@/lib/matches";

function draftFor(team) {
  return {
    ownerName: team.ownerName || "",
    captainId: team.captainId || "",
    viceCaptainId: team.viceCaptainId || "",
  };
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
    const draft = drafts[name] || { ownerName: "", captainId: "", viceCaptainId: "" };
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
          viceCaptainId: draft.viceCaptainId || "",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save the team.");
      setTeams((prev) =>
        prev.map((team) =>
          team.name === name
            ? {
                ...team,
                ownerName: (draft.ownerName || "").trim(),
                captainId: draft.captainId || "",
                viceCaptainId: draft.viceCaptainId || "",
              }
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
    <Panel
      title="Team Owners & Captains"
      description="Set each franchise's owner and pick a captain and vice-captain from its allocated players. All are shown to visitors when they open a team's roster."
      actions={
        <Button type="button" size="sm" variant="secondary" disabled={loading} onClick={loadTeams}>
          <RefreshIcon className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      }
    >
      {error ? (
        <Notice tone="error" className="mb-4">
          {error}
        </Notice>
      ) : null}
      {loading ? <p className="text-sm text-muted">Loading teams...</p> : null}

      {!loading ? (
        <ul className="grid gap-3">
          {teams.map((team) => {
            const draft = drafts[team.name] || { ownerName: "", captainId: "", viceCaptainId: "" };
            const isDirty =
              draft.ownerName !== (team.ownerName || "") ||
              draft.captainId !== (team.captainId || "") ||
              draft.viceCaptainId !== (team.viceCaptainId || "");
            const logo = teamLogo(team.name);
            return (
              <li
                key={team.name}
                className="grid gap-3 rounded-xl border border-ink/10 p-4 transition hover:border-ink/20 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_auto] lg:items-center"
              >
                <div className="flex min-w-0 items-center gap-3">
                  {logo ? (
                    <img
                      src={logo}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-full border border-ink/10 bg-white object-contain p-0.5"
                    />
                  ) : (
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-green/10 text-xs font-black text-green-dark">
                      {team.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-bold text-ink">{team.name}</p>
                    <p className="text-xs text-muted">
                      {team.playerCount} player{team.playerCount === 1 ? "" : "s"} allocated
                    </p>
                  </div>
                </div>
                <label className="block">
                  <span className="mb-1 block text-[0.68rem] font-black uppercase tracking-[0.12em] text-muted lg:sr-only">
                    Owner
                  </span>
                  <input
                    value={draft.ownerName}
                    onChange={(event) => updateDraft(team.name, { ownerName: event.target.value })}
                    placeholder="Owner name"
                    aria-label={`${team.name} owner`}
                    className={INPUT_CLASSES}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[0.68rem] font-black uppercase tracking-[0.12em] text-muted lg:sr-only">
                    Captain
                  </span>
                  <select
                    value={draft.captainId}
                    onChange={(event) => updateDraft(team.name, { captainId: event.target.value })}
                    aria-label={`${team.name} captain`}
                    disabled={team.players.length === 0}
                    className={INPUT_CLASSES}
                  >
                    <option value="">
                      {team.players.length ? "No captain" : "No players allocated yet"}
                    </option>
                    {team.players.map((player) => (
                      <option key={player.id} value={player.id} disabled={player.id === draft.viceCaptainId}>
                        {player.playerName}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-[0.68rem] font-black uppercase tracking-[0.12em] text-muted lg:sr-only">
                    Vice Captain
                  </span>
                  <select
                    value={draft.viceCaptainId}
                    onChange={(event) => updateDraft(team.name, { viceCaptainId: event.target.value })}
                    aria-label={`${team.name} vice captain`}
                    disabled={team.players.length === 0}
                    className={INPUT_CLASSES}
                  >
                    <option value="">
                      {team.players.length ? "No vice-captain" : "No players allocated yet"}
                    </option>
                    {team.players.map((player) => (
                      <option key={player.id} value={player.id} disabled={player.id === draft.captainId}>
                        {player.playerName}
                      </option>
                    ))}
                  </select>
                </label>
                <Button
                  type="button"
                  size="sm"
                  disabled={!isDirty || savingName === team.name}
                  onClick={() => handleSave(team.name)}
                  className="w-full lg:w-auto"
                >
                  {savingName === team.name ? "Saving..." : "Save"}
                </Button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </Panel>
  );
}
