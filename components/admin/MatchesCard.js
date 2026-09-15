"use client";

import { useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import Panel from "@/components/admin/Panel";
import Notice from "@/components/admin/Notice";
import { EditIcon, PlusIcon, TrashIcon } from "@/components/admin/icons";
import {
  DELETE_BUTTON_CLASSES,
  EDIT_BUTTON_CLASSES,
  EDITING_BOX_CLASSES,
  INPUT_CLASSES,
} from "@/components/admin/formStyles";
import { ROSTER_TEAMS } from "@/lib/siteData";
import {
  MATCH_STATUSES,
  STATUS_LABELS,
  formatMatchDate,
  formatScore,
  teamLogo,
  todayInLeagueTimeZone,
} from "@/lib/matches";

const STATUS_PILL_CLASSES = {
  upcoming: "bg-navy/10 text-navy",
  live: "bg-brand-red text-white",
  completed: "bg-green/10 text-green-dark",
  abandoned: "bg-ink/10 text-muted",
};

const PLAYER_LIST_ID = "match-player-suggestions";

const EMPTY_INNINGS = {
  runs: "",
  wickets: "",
  overs: "",
  batterName: "",
  batterFigures: "",
  bowlerName: "",
  bowlerFigures: "",
};

function emptyForm() {
  return {
    matchNumber: "",
    date: todayInLeagueTimeZone(),
    time: "",
    venue: "",
    teamA: "",
    teamB: "",
    status: "upcoming",
    teamAInnings: { ...EMPTY_INNINGS },
    teamBInnings: { ...EMPTY_INNINGS },
    result: "",
    motmName: "",
    motmTeam: "",
    motmPerformance: "",
  };
}

function numberField(value) {
  return value === null || value === undefined ? "" : String(value);
}

function inningsToForm(innings) {
  return {
    runs: numberField(innings.runs),
    wickets: numberField(innings.wickets),
    overs: innings.overs,
    batterName: innings.topBatter.name,
    batterFigures: innings.topBatter.figures,
    bowlerName: innings.topBowler.name,
    bowlerFigures: innings.topBowler.figures,
  };
}

function matchToForm(match) {
  return {
    matchNumber: numberField(match.matchNumber),
    date: match.date,
    time: match.time,
    venue: match.venue,
    teamA: match.teamA,
    teamB: match.teamB,
    status: match.status,
    teamAInnings: inningsToForm(match.teamAInnings),
    teamBInnings: inningsToForm(match.teamBInnings),
    result: match.result,
    motmName: match.manOfTheMatch.name,
    motmTeam: match.manOfTheMatch.team,
    motmPerformance: match.manOfTheMatch.performance,
  };
}

function inningsToPayload(innings) {
  return {
    runs: innings.runs,
    wickets: innings.wickets,
    overs: innings.overs,
    topBatter: { name: innings.batterName, figures: innings.batterFigures },
    topBowler: { name: innings.bowlerName, figures: innings.bowlerFigures },
  };
}

function formToPayload(form) {
  return {
    matchNumber: form.matchNumber,
    date: form.date,
    time: form.time,
    venue: form.venue,
    teamA: form.teamA,
    teamB: form.teamB,
    status: form.status,
    teamAInnings: inningsToPayload(form.teamAInnings),
    teamBInnings: inningsToPayload(form.teamBInnings),
    result: form.result,
    manOfTheMatch: { name: form.motmName, team: form.motmTeam, performance: form.motmPerformance },
  };
}

function scoreline(match) {
  return [
    [match.teamA, match.teamAInnings],
    [match.teamB, match.teamBInnings],
  ]
    .map(([team, innings]) => {
      const score = formatScore(innings);
      if (!score) return "";
      return `${team} ${score}${innings.overs ? ` (${innings.overs})` : ""}`;
    })
    .filter(Boolean)
    .join(" · ");
}

function Field({ label, children, className = "" }) {
  return (
    <label className={`text-sm ${className}`}>
      <span className="mb-1 block text-[0.68rem] font-black uppercase tracking-[0.12em] text-muted">{label}</span>
      {children}
    </label>
  );
}

function InningsFields({ team, opponent, value, onChange }) {
  function update(patch) {
    onChange({ ...value, ...patch });
  }

  return (
    <fieldset className="rounded-xl border border-ink/10 bg-white p-3.5">
      <legend className="px-1.5 text-xs font-black uppercase tracking-[0.12em] text-green-dark">
        {team || "Team"} batting
      </legend>
      <div className="grid grid-cols-3 gap-2.5">
        <Field label="Runs">
          <input
            type="number"
            min="0"
            value={value.runs}
            onChange={(event) => update({ runs: event.target.value })}
            placeholder="—"
            className={INPUT_CLASSES}
          />
        </Field>
        <Field label="Wickets">
          <input
            type="number"
            min="0"
            max="10"
            value={value.wickets}
            onChange={(event) => update({ wickets: event.target.value })}
            placeholder="0"
            className={INPUT_CLASSES}
          />
        </Field>
        <Field label="Overs">
          <input
            value={value.overs}
            onChange={(event) => update({ overs: event.target.value })}
            placeholder="18.4"
            className={INPUT_CLASSES}
          />
        </Field>
      </div>
      <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
        <Field label="Top scorer">
          <input
            list={PLAYER_LIST_ID}
            value={value.batterName}
            onChange={(event) => update({ batterName: event.target.value })}
            placeholder="Player name"
            className={INPUT_CLASSES}
          />
        </Field>
        <Field label="Runs (balls)">
          <input
            value={value.batterFigures}
            onChange={(event) => update({ batterFigures: event.target.value })}
            placeholder="76* (52)"
            className={INPUT_CLASSES}
          />
        </Field>
        <Field label={`Best bowler${opponent ? ` (${opponent})` : ""}`}>
          <input
            list={PLAYER_LIST_ID}
            value={value.bowlerName}
            onChange={(event) => update({ bowlerName: event.target.value })}
            placeholder="Player name"
            className={INPUT_CLASSES}
          />
        </Field>
        <Field label="Wickets-runs">
          <input
            value={value.bowlerFigures}
            onChange={(event) => update({ bowlerFigures: event.target.value })}
            placeholder="3-24"
            className={INPUT_CLASSES}
          />
        </Field>
      </div>
    </fieldset>
  );
}

function MatchForm({ initial, playersByTeam, saving, onSubmit, onCancel }) {
  const [form, setForm] = useState(initial);

  function update(patch) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  const sameTeam = Boolean(form.teamA && form.teamB && form.teamA === form.teamB);
  const canSave = Boolean(form.date && form.teamA && form.teamB) && !sameTeam;

  // Player names from both squads, offered as typing suggestions.
  const suggestions = useMemo(() => {
    const names = [...(playersByTeam[form.teamA] || []), ...(playersByTeam[form.teamB] || [])];
    return Array.from(new Set(names));
  }, [playersByTeam, form.teamA, form.teamB]);

  function handleSubmit(event) {
    event.preventDefault();
    if (canSave) onSubmit(formToPayload(form));
  }

  return (
    <form onSubmit={handleSubmit} className={`${EDITING_BOX_CLASSES} grid gap-3.5 p-4`}>
      <datalist id={PLAYER_LIST_ID}>
        {suggestions.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Field label="Match no.">
          <input
            type="number"
            min="1"
            value={form.matchNumber}
            onChange={(event) => update({ matchNumber: event.target.value })}
            placeholder="1"
            className={INPUT_CLASSES}
          />
        </Field>
        <Field label="Date">
          <input
            type="date"
            required
            value={form.date}
            onChange={(event) => update({ date: event.target.value })}
            className={INPUT_CLASSES}
          />
        </Field>
        <Field label="Time">
          <input
            value={form.time}
            onChange={(event) => update({ time: event.target.value })}
            placeholder="3:00 PM"
            className={INPUT_CLASSES}
          />
        </Field>
        <Field label="Venue">
          <input
            value={form.venue}
            onChange={(event) => update({ venue: event.target.value })}
            placeholder="Maneri Ground"
            className={INPUT_CLASSES}
          />
        </Field>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-3">
        <Field label="Team A">
          <select value={form.teamA} onChange={(event) => update({ teamA: event.target.value })} className={INPUT_CLASSES}>
            <option value="">Select team</option>
            {ROSTER_TEAMS.map((team) => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Team B">
          <select value={form.teamB} onChange={(event) => update({ teamB: event.target.value })} className={INPUT_CLASSES}>
            <option value="">Select team</option>
            {ROSTER_TEAMS.map((team) => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Status">
          <select value={form.status} onChange={(event) => update({ status: event.target.value })} className={INPUT_CLASSES}>
            {MATCH_STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </Field>
      </div>
      {sameTeam ? <p className="text-sm font-semibold text-brand-red">Pick two different teams.</p> : null}

      <div className="grid gap-3.5 lg:grid-cols-2">
        <InningsFields
          team={form.teamA}
          opponent={form.teamB}
          value={form.teamAInnings}
          onChange={(teamAInnings) => update({ teamAInnings })}
        />
        <InningsFields
          team={form.teamB}
          opponent={form.teamA}
          value={form.teamBInnings}
          onChange={(teamBInnings) => update({ teamBInnings })}
        />
      </div>
      <p className="-mt-1.5 text-xs text-muted">
        Leave runs blank until a side has batted. &quot;Best bowler&quot; is the opposition player who bowled
        against that side.
      </p>

      <Field label="Result / match situation">
        <input
          value={form.result}
          onChange={(event) => update({ result: event.target.value })}
          placeholder="Maneri Kings won by 24 runs"
          className={INPUT_CLASSES}
        />
      </Field>

      <div className="grid gap-2.5 sm:grid-cols-3">
        <Field label="Man of the Match">
          <input
            list={PLAYER_LIST_ID}
            value={form.motmName}
            onChange={(event) => update({ motmName: event.target.value })}
            placeholder="Player name"
            className={INPUT_CLASSES}
          />
        </Field>
        <Field label="Player's team">
          <select value={form.motmTeam} onChange={(event) => update({ motmTeam: event.target.value })} className={INPUT_CLASSES}>
            <option value="">Select team</option>
            {[form.teamA, form.teamB].filter(Boolean).map((team) => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Performance">
          <input
            value={form.motmPerformance}
            onChange={(event) => update({ motmPerformance: event.target.value })}
            placeholder="76* (52) & 2-18"
            className={INPUT_CLASSES}
          />
        </Field>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="sm" disabled={saving || !canSave}>
          {saving ? "Saving..." : "Save match"}
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export default function MatchesCard() {
  const [matches, setMatches] = useState([]);
  const [playersByTeam, setPlayersByTeam] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  // null, "new", or the id of the match being edited.
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    loadMatches();
    loadPlayers();
  }, []);

  async function loadMatches() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/matches", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load matches.");
      setMatches(data.matches);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadPlayers() {
    try {
      const res = await fetch("/api/admin/teams", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) return;
      setPlayersByTeam(
        Object.fromEntries(data.teams.map((team) => [team.name, team.players.map((player) => player.playerName)]))
      );
    } catch {
      // Suggestions are a convenience; the form works without them.
    }
  }

  async function handleSave(payload) {
    setSaving(true);
    setError("");
    try {
      const isNew = editingId === "new";
      const res = await fetch("/api/admin/matches", {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isNew ? payload : { id: editingId, ...payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save the match.");
      setEditingId(null);
      await loadMatches();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this match? This cannot be undone.")) return;
    try {
      const res = await fetch("/api/admin/matches", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not delete the match.");
      setMatches((prev) => prev.filter((match) => match.id !== id));
      setEditingId((current) => (current === id ? null : current));
    } catch (err) {
      alert(err.message);
    }
  }

  function startEdit(id) {
    setEditingId(id);
    setError("");
  }

  return (
    <Panel
      title="Scorecard & Fixtures"
      description="Add fixtures and update scores as play happens. The homepage picks yesterday's result, today's match, and the next fixture from the match date (Pakistan time)."
      actions={
        <Button type="button" size="sm" disabled={editingId === "new"} onClick={() => startEdit("new")}>
          <PlusIcon className="h-4 w-4" />
          Add match
        </Button>
      }
    >
      {error ? (
        <Notice tone="error" className="mb-4">
          {error}
        </Notice>
      ) : null}

      {editingId === "new" ? (
        <div className="mb-4">
          <MatchForm
            key="new"
            initial={emptyForm()}
            playersByTeam={playersByTeam}
            saving={saving}
            onSubmit={handleSave}
            onCancel={() => setEditingId(null)}
          />
        </div>
      ) : null}

      {loading ? <p className="text-sm text-muted">Loading matches...</p> : null}

      {!loading && matches.length ? (
        <ul className="grid gap-3">
          {matches.map((match) => {
            if (editingId === match.id) {
              return (
                <li key={match.id}>
                  <MatchForm
                    key={match.id}
                    initial={matchToForm(match)}
                    playersByTeam={playersByTeam}
                    saving={saving}
                    onSubmit={handleSave}
                    onCancel={() => setEditingId(null)}
                  />
                </li>
              );
            }

            const details = [
              match.matchNumber ? `Match ${match.matchNumber}` : "",
              formatMatchDate(match.date, { withYear: true }),
              match.time,
              match.venue,
            ]
              .filter(Boolean)
              .join(" · ");
            const scores = scoreline(match);
            const motm = match.manOfTheMatch;

            return (
              <li
                key={match.id}
                className="flex flex-wrap items-center gap-3.5 rounded-xl border border-ink/10 p-4 transition hover:border-ink/20"
              >
                <div className="flex shrink-0 -space-x-2.5">
                  {[match.teamA, match.teamB].map((team, index) =>
                    teamLogo(team) ? (
                      <img
                        key={`${team}-${index}`}
                        src={teamLogo(team)}
                        alt=""
                        className="h-10 w-10 rounded-full border-2 border-white bg-white object-contain p-0.5 shadow-sm"
                      />
                    ) : (
                      <span
                        key={`${team}-${index}`}
                        className="grid h-10 w-10 place-items-center rounded-full border-2 border-white bg-green/10 text-[0.65rem] font-black text-green-dark"
                      >
                        {String(team || "?").slice(0, 2).toUpperCase()}
                      </span>
                    )
                  )}
                </div>
                <div className="min-w-[200px] flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-bold text-ink">
                    <span>
                      {match.teamA} vs {match.teamB}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[0.68rem] font-black uppercase tracking-wide ${
                        STATUS_PILL_CLASSES[match.status] || STATUS_PILL_CLASSES.upcoming
                      }`}
                    >
                      {STATUS_LABELS[match.status] || match.status}
                    </span>
                  </p>
                  <p className="text-sm text-muted">{details}</p>
                  {scores ? <p className="text-sm font-semibold text-ink">{scores}</p> : null}
                  {match.result ? <p className="text-sm font-semibold text-green-dark">{match.result}</p> : null}
                  {motm.name ? (
                    <p className="text-sm text-muted">
                      Man of the Match: <span className="font-bold text-ink">{motm.name}</span>
                      {motm.team ? ` (${motm.team})` : ""}
                      {motm.performance ? ` · ${motm.performance}` : ""}
                    </p>
                  ) : null}
                </div>
                <div className="flex gap-1.5">
                  <button type="button" onClick={() => startEdit(match.id)} className={EDIT_BUTTON_CLASSES}>
                    <EditIcon className="h-4 w-4" />
                    Edit
                  </button>
                  <button type="button" onClick={() => handleDelete(match.id)} className={DELETE_BUTTON_CLASSES}>
                    <TrashIcon className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      {!loading && !matches.length ? <p className="text-sm text-muted">No matches added yet.</p> : null}
    </Panel>
  );
}
