"use client";

import { useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import Notice from "@/components/admin/Notice";
import { INPUT_CLASSES } from "@/components/admin/formStyles";
import { teamLogo } from "@/lib/matches";
import { safeJsonResponse } from "@/lib/http";

const OVER_PRESETS = [5, 6, 8, 10, 12, 15, 20];
const MAX_XI = 15;

function Step({ number, title, hint, children }) {
  return (
    <section className="rounded-2xl border border-ink/10 bg-white p-4 sm:p-5">
      <header className="mb-3 flex items-start gap-3">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-green text-sm font-black text-white">
          {number}
        </span>
        <div className="min-w-0">
          <h3 className="font-sans text-base font-bold text-ink">{title}</h3>
          {hint ? <p className="text-sm text-muted">{hint}</p> : null}
        </div>
      </header>
      {children}
    </section>
  );
}

function Choice({ active, onClick, children, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-[48px] rounded-xl border-2 px-3 text-sm font-extrabold transition ${
        active ? "border-green bg-green text-white shadow-md" : "border-ink/10 bg-white text-ink hover:border-green/40"
      } ${className}`}
    >
      {children}
    </button>
  );
}

function TeamName({ team }) {
  const logo = teamLogo(team);
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt="" className="h-6 w-6 shrink-0 object-contain" />
      ) : null}
      <span className="truncate">{team}</span>
    </span>
  );
}

function XIPicker({ team, squad, players, selected, onChange }) {
  const chosen = new Set(selected);
  function toggle(id) {
    const next = new Set(chosen);
    if (next.has(id)) next.delete(id);
    else if (next.size < MAX_XI) next.add(id);
    onChange([...next]);
  }

  return (
    <div className="rounded-xl border border-ink/10 bg-[#fafbfa] p-3">
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
        <p className="font-bold text-ink">
          <TeamName team={team} />
        </p>
        <div className="flex items-center gap-2 text-sm">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-black tabular-nums ${
              selected.length === 11 ? "bg-green/15 text-green-dark" : "bg-ink/[0.06] text-muted"
            }`}
          >
            {selected.length} selected
          </span>
          <button
            type="button"
            onClick={() => onChange(squad.slice(0, MAX_XI))}
            className="font-bold text-green-dark hover:underline"
          >
            All
          </button>
          <button type="button" onClick={() => onChange([])} className="font-bold text-muted hover:underline">
            Clear
          </button>
        </div>
      </div>
      {squad.length === 0 ? (
        <Notice tone="error">No players are allocated to {team} yet. Allocate them on the Draft Board first.</Notice>
      ) : (
        <ul className="grid gap-1.5 sm:grid-cols-2">
          {squad.map((id) => {
            const on = chosen.has(id);
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => toggle(id)}
                  aria-pressed={on}
                  className={`flex min-h-[46px] w-full items-center gap-3 rounded-lg border px-3 text-left text-sm transition ${
                    on ? "border-green bg-green/10" : "border-ink/10 bg-white hover:border-green/40"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`grid h-5 w-5 shrink-0 place-items-center rounded border-2 text-[0.7rem] font-black ${
                      on ? "border-green bg-green text-white" : "border-ink/25"
                    }`}
                  >
                    {on ? "✓" : ""}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold text-ink">{players[id]?.name || "Unknown player"}</span>
                    <span className="block truncate text-xs text-muted">{players[id]?.role || ""}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function PlayerSelect({ label, value, onChange, options, players, exclude = [] }) {
  return (
    <label className="text-sm">
      <span className="mb-1 block text-[0.68rem] font-black uppercase tracking-[0.12em] text-muted">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className={`${INPUT_CLASSES} min-h-[46px]`}>
        <option value="">Select player</option>
        {options
          .filter((id) => id === value || !exclude.includes(id))
          .map((id) => (
            <option key={id} value={id}>
              {players[id]?.name || id}
            </option>
          ))}
      </select>
    </label>
  );
}

function initialForm(data) {
  const { match, innings } = data;
  const first = innings.find((i) => i.number === 1);
  const presetOvers = match.overs && OVER_PRESETS.includes(match.overs);
  return {
    tossWinner: match.toss.winner || "",
    decision: match.toss.decision || "",
    overs: match.overs ? String(match.overs) : "",
    customOvers: Boolean(match.overs && !presetOvers),
    xiA: match.playingXI.teamA,
    xiB: match.playingXI.teamB,
    striker: first?.striker || "",
    nonStriker: first?.nonStriker || "",
    bowler: first?.bowler || "",
    widePenalty: String(match.scoringConfig.widePenalty ?? 1),
    noBallPenalty: String(match.scoringConfig.noBallPenalty ?? 1),
    maxOversPerBowler: match.scoringConfig.maxOversPerBowler ? String(match.scoringConfig.maxOversPerBowler) : "",
    lastManStands: Boolean(match.scoringConfig.lastManStands),
  };
}

export default function MatchSetup({ data, onStarted, onCancel }) {
  const { match, players, squads } = data;
  const [form, setForm] = useState(() => initialForm(data));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function update(patch) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  // The squad list also shows anyone already in a saved XI who has since moved team.
  const squadA = useMemo(() => [...new Set([...squads.teamA, ...form.xiA])], [squads.teamA, form.xiA]);
  const squadB = useMemo(() => [...new Set([...squads.teamB, ...form.xiB])], [squads.teamB, form.xiB]);

  const battingTeam =
    form.tossWinner && form.decision
      ? form.decision === "bat"
        ? form.tossWinner
        : form.tossWinner === match.teamA
          ? match.teamB
          : match.teamA
      : "";
  const bowlingTeam = battingTeam ? (battingTeam === match.teamA ? match.teamB : match.teamA) : "";
  const battingXI = battingTeam === match.teamA ? form.xiA : battingTeam === match.teamB ? form.xiB : [];
  const bowlingXI = bowlingTeam === match.teamA ? form.xiA : bowlingTeam === match.teamB ? form.xiB : [];

  const overs = Number(form.overs);
  const autoMaxOvers = overs >= 1 ? Math.max(1, Math.ceil(overs / 5)) : null;

  const problems = [];
  if (!form.tossWinner || !form.decision) problems.push("Set the toss result.");
  if (!(Number.isInteger(overs) && overs >= 1 && overs <= 50)) problems.push("Choose the overs per innings.");
  if (form.xiA.length < 2 || form.xiB.length < 2) problems.push("Pick at least 2 players for each XI.");
  if (!form.striker || !form.nonStriker || form.striker === form.nonStriker) problems.push("Pick two opening batters.");
  if (!form.bowler) problems.push("Pick the opening bowler.");

  // Dropping a player from the XI also clears them as an opener.
  function setXI(side, ids) {
    const patch = { [side]: ids };
    const previous = side === "xiA" ? form.xiA : form.xiB;
    const dropped = (id) => Boolean(id) && previous.includes(id) && !ids.includes(id);
    if (dropped(form.striker)) patch.striker = "";
    if (dropped(form.nonStriker)) patch.nonStriker = "";
    if (dropped(form.bowler)) patch.bowler = "";
    update(patch);
  }

  function setToss(patch) {
    // A different batting side invalidates the openers.
    update({ ...patch, striker: "", nonStriker: "", bowler: "" });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (problems.length) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/scoring/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: match.id,
          toss: { winner: form.tossWinner, decision: form.decision },
          overs,
          playingXI: { teamA: form.xiA, teamB: form.xiB },
          striker: form.striker,
          nonStriker: form.nonStriker,
          bowler: form.bowler,
          scoringConfig: {
            widePenalty: Number(form.widePenalty),
            noBallPenalty: Number(form.noBallPenalty),
            maxOversPerBowler: form.maxOversPerBowler === "" ? null : Number(form.maxOversPerBowler),
            lastManStands: form.lastManStands,
          },
        }),
      });
      const result = await safeJsonResponse(res);
      if (!res.ok) throw new Error(result.error || "Could not start the match.");
      onStarted(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <Step number={1} title="Toss" hint="Who won the toss, and what did they choose?">
        <div className="grid grid-cols-2 gap-2">
          {[match.teamA, match.teamB].map((team) => (
            <Choice key={team} active={form.tossWinner === team} onClick={() => setToss({ tossWinner: team })}>
              <TeamName team={team} />
            </Choice>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Choice active={form.decision === "bat"} onClick={() => setToss({ decision: "bat" })}>
            Chose to bat
          </Choice>
          <Choice active={form.decision === "bowl"} onClick={() => setToss({ decision: "bowl" })}>
            Chose to bowl
          </Choice>
        </div>
        {battingTeam ? (
          <p className="mt-3 text-sm font-semibold text-green-dark">{battingTeam} will bat first.</p>
        ) : null}
      </Step>

      <Step number={2} title="Overs per innings">
        <div className="flex flex-wrap gap-2">
          {OVER_PRESETS.map((preset) => (
            <Choice
              key={preset}
              active={!form.customOvers && form.overs === String(preset)}
              onClick={() => update({ overs: String(preset), customOvers: false })}
              className="w-14"
            >
              {preset}
            </Choice>
          ))}
          <Choice active={form.customOvers} onClick={() => update({ customOvers: true, overs: "" })}>
            Other
          </Choice>
        </div>
        {form.customOvers ? (
          <input
            type="number"
            min="1"
            max="50"
            inputMode="numeric"
            value={form.overs}
            onChange={(event) => update({ overs: event.target.value })}
            placeholder="Overs"
            className={`${INPUT_CLASSES} mt-2 max-w-[140px]`}
          />
        ) : null}

        <details className="mt-3 rounded-xl border border-ink/10 bg-[#fafbfa] p-3 text-sm">
          <summary className="cursor-pointer font-bold text-ink">Match rules</summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <label>
              <span className="mb-1 block text-[0.68rem] font-black uppercase tracking-[0.12em] text-muted">Runs for a wide</span>
              <input
                type="number"
                min="0"
                max="5"
                value={form.widePenalty}
                onChange={(event) => update({ widePenalty: event.target.value })}
                className={INPUT_CLASSES}
              />
            </label>
            <label>
              <span className="mb-1 block text-[0.68rem] font-black uppercase tracking-[0.12em] text-muted">Runs for a no-ball</span>
              <input
                type="number"
                min="0"
                max="5"
                value={form.noBallPenalty}
                onChange={(event) => update({ noBallPenalty: event.target.value })}
                className={INPUT_CLASSES}
              />
            </label>
            <label>
              <span className="mb-1 block text-[0.68rem] font-black uppercase tracking-[0.12em] text-muted">Max overs per bowler</span>
              <input
                type="number"
                min="1"
                max={overs || 50}
                value={form.maxOversPerBowler}
                onChange={(event) => update({ maxOversPerBowler: event.target.value })}
                placeholder={autoMaxOvers ? `${autoMaxOvers} (auto)` : "Auto"}
                className={INPUT_CLASSES}
              />
            </label>
          </div>
          <label className="mt-3 flex items-center gap-2 font-semibold text-ink">
            <input
              type="checkbox"
              checked={form.lastManStands}
              onChange={(event) => update({ lastManStands: event.target.checked })}
              className="h-4 w-4 accent-green"
            />
            Last man stands (the final batter can bat alone)
          </label>
        </details>
      </Step>

      <Step number={3} title="Playing XI" hint="Tap players to add them. Usually 11 a side; up to 15 allowed.">
        <div className="grid gap-3 lg:grid-cols-2">
          <XIPicker
            team={match.teamA}
            squad={squadA}
            players={players}
            selected={form.xiA}
            onChange={(ids) => setXI("xiA", ids)}
          />
          <XIPicker
            team={match.teamB}
            squad={squadB}
            players={players}
            selected={form.xiB}
            onChange={(ids) => setXI("xiB", ids)}
          />
        </div>
      </Step>

      <Step
        number={4}
        title="Openers"
        hint={battingTeam ? `${battingTeam} bat first, ${bowlingTeam} bowl.` : "Set the toss first."}
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <PlayerSelect
            label="Striker"
            value={form.striker}
            onChange={(striker) => update({ striker })}
            options={battingXI}
            players={players}
            exclude={[form.nonStriker]}
          />
          <PlayerSelect
            label="Non-striker"
            value={form.nonStriker}
            onChange={(nonStriker) => update({ nonStriker })}
            options={battingXI}
            players={players}
            exclude={[form.striker]}
          />
          <PlayerSelect
            label="Opening bowler"
            value={form.bowler}
            onChange={(bowler) => update({ bowler })}
            options={bowlingXI}
            players={players}
          />
        </div>
      </Step>

      {error ? <Notice tone="error">{error}</Notice> : null}
      {problems.length ? <Notice>{problems[0]}</Notice> : null}

      <div className="sticky bottom-0 z-10 -mx-1 flex gap-2 bg-[#f3f5f4]/95 px-1 py-3 backdrop-blur">
        {onCancel ? (
          <Button type="button" variant="secondary" onClick={onCancel} className="flex-1 sm:flex-none">
            Cancel
          </Button>
        ) : null}
        <Button type="submit" disabled={saving || problems.length > 0} className="flex-1">
          {saving ? "Starting..." : "Start match"}
        </Button>
      </div>
    </form>
  );
}
