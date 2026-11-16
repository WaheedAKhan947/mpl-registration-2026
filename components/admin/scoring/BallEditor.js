"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Notice from "@/components/admin/Notice";
import { INPUT_CLASSES } from "@/components/admin/formStyles";
import { WICKET_LABELS, WICKET_TYPES } from "@/lib/scoring";
import { Sheet } from "@/components/admin/scoring/ScoringSheets";

const EXTRA_OPTIONS = [
  { value: "", label: "None" },
  { value: "wide", label: "Wide" },
  { value: "noball", label: "No ball" },
  { value: "bye", label: "Bye" },
  { value: "legbye", label: "Leg bye" },
  { value: "penalty", label: "Penalty runs" },
];

function Label({ children }) {
  return <span className="mb-1 block text-[0.68rem] font-black uppercase tracking-[0.12em] text-muted">{children}</span>;
}

function chipTone(label) {
  if (label === "W" || label === "RO") return "bg-brand-red text-white";
  if (label === "4" || label === "6") return "bg-gold text-navy-dark";
  if (/Wd|Nb|B|Lb|P|RH/.test(label)) return "bg-navy/10 text-navy";
  return "bg-white text-ink ring-1 ring-ink/10";
}

// Every ball of every innings, newest first; tap one to correct it.
export function BallHistorySheet({ data, onPick, onClose }) {
  const innings = data.innings.filter((i) => i.balls.length);
  const [number, setNumber] = useState(innings.length ? innings[innings.length - 1].number : 1);
  const current = data.innings.find((i) => i.number === number);

  return (
    <Sheet title="Edit an earlier ball" onClose={onClose}>
      {innings.length > 1 ? (
        <div className="-mt-1 mb-3 flex gap-2">
          {innings.map((i) => (
            <button
              key={i.number}
              type="button"
              onClick={() => setNumber(i.number)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-extrabold ${
                i.number === number ? "bg-green text-white" : "bg-ink/[0.05] text-green-dark"
              }`}
            >
              {i.battingTeam}
            </button>
          ))}
        </div>
      ) : null}
      {!current || !current.balls.length ? <Notice>No balls yet.</Notice> : null}
      <ol className="grid gap-1.5">
        {[...(current?.balls || [])].reverse().map((ball) => (
          <li key={ball.id}>
            <button
              type="button"
              onClick={() => onPick(ball, current)}
              className="flex min-h-[52px] w-full items-center gap-3 rounded-xl border-2 border-ink/10 bg-white px-3 text-left transition hover:border-green/50"
            >
              <span className="w-9 shrink-0 text-xs font-bold tabular-nums text-muted">
                {ball.over}.{ball.ballInOver}
              </span>
              <span className={`grid h-7 min-w-[1.75rem] shrink-0 place-items-center rounded-full px-1 text-[0.7rem] font-black ${chipTone(labelOf(ball))}`}>
                {labelOf(ball)}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-ink">{ball.commentary}</span>
            </button>
          </li>
        ))}
      </ol>
    </Sheet>
  );
}

function labelOf(ball) {
  if (ball.wicket) return ball.wicket.type === "retired_hurt" ? "RH" : ball.wicket.type === "retired_out" ? "RO" : "W";
  switch (ball.extrasType) {
    case "wide":
      return "Wd";
    case "noball":
      return "Nb";
    case "bye":
      return `${ball.extraRuns}B`;
    case "legbye":
      return `${ball.extraRuns}Lb`;
    case "penalty":
      return `${ball.extraRuns}P`;
    default:
      return ball.runsOffBat === 0 ? "•" : String(ball.runsOffBat);
  }
}

// Full form for one ball. Save / delete go to the server, which re-checks
// the whole innings and explains any later ball the change would break.
export function BallEditSheet({ ball, innings, match, players, config, busy, onSave, onDelete, onClose }) {
  const [form, setForm] = useState({
    striker: ball.striker || "",
    nonStriker: ball.nonStriker || "",
    bowler: ball.bowler || "",
    runsOffBat: ball.runsOffBat,
    extrasType: ball.extrasType || "",
    extraRuns: String(ball.extraRuns),
    boundary: ball.boundary ? String(ball.boundary) : "",
    wicketType: ball.wicket?.type || "",
    playerOut: ball.wicket?.playerOut || ball.striker || "",
    fielder: ball.wicket?.fielders?.[0] || "",
  });
  const [error, setError] = useState("");
  const update = (patch) => setForm((f) => ({ ...f, ...patch }));

  const battingXI = innings.battingTeam === match.teamA ? match.playingXI.teamA : match.playingXI.teamB;
  const bowlingXI = innings.battingTeam === match.teamA ? match.playingXI.teamB : match.playingXI.teamA;
  const name = (id) => players[id]?.name || id;

  function select(label, value, onChange, options, { allowEmpty = false } = {}) {
    return (
      <label className="text-sm">
        <Label>{label}</Label>
        <select value={value} onChange={(e) => onChange(e.target.value)} className={`${INPUT_CLASSES} min-h-[44px]`}>
          {allowEmpty ? <option value="">None</option> : null}
          {options.map((id) => (
            <option key={id} value={id}>
              {name(id)}
            </option>
          ))}
        </select>
      </label>
    );
  }

  function payload() {
    return {
      striker: form.striker || null,
      nonStriker: form.nonStriker || null,
      bowler: form.bowler || null,
      runsOffBat: Number(form.runsOffBat) || 0,
      extrasType: form.extrasType || null,
      extraRuns: Number(form.extraRuns) || 0,
      boundary: form.boundary ? Number(form.boundary) : null,
      wicket: form.wicketType
        ? { type: form.wicketType, playerOut: form.playerOut || form.striker, fielders: form.fielder ? [form.fielder] : [] }
        : null,
    };
  }

  async function save() {
    setError("");
    const problem = await onSave(payload());
    if (problem) setError(problem);
  }

  async function remove() {
    if (!confirm("Delete this ball? Every later ball is re-checked.")) return;
    setError("");
    const problem = await onDelete();
    if (problem) setError(problem);
  }

  return (
    <Sheet title={`Edit ball ${ball.over}.${ball.ballInOver}`} onClose={onClose}>
      <p className="-mt-2 mb-3 text-xs text-muted">{ball.commentary}</p>
      <div className="grid gap-3">
        <div className="grid grid-cols-2 gap-2">
          {select("Striker", form.striker, (v) => update({ striker: v }), battingXI)}
          {select("Non-striker", form.nonStriker, (v) => update({ nonStriker: v }), battingXI, { allowEmpty: true })}
        </div>
        {select("Bowler", form.bowler, (v) => update({ bowler: v }), bowlingXI, { allowEmpty: true })}

        <div>
          <Label>Runs off the bat</Label>
          <div className="grid grid-cols-8 gap-1">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => update({ runsOffBat: n })}
                className={`min-h-[40px] rounded-lg border-2 text-sm font-black ${
                  Number(form.runsOffBat) === n ? "border-green bg-green text-white" : "border-ink/10 bg-white text-ink"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="text-sm">
            <Label>Extra</Label>
            <select value={form.extrasType} onChange={(e) => update({ extrasType: e.target.value })} className={`${INPUT_CLASSES} min-h-[44px]`}>
              {EXTRA_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <Label>Extra runs</Label>
            <input
              type="number"
              min="0"
              max="10"
              inputMode="numeric"
              value={form.extraRuns}
              onChange={(e) => update({ extraRuns: e.target.value })}
              className={`${INPUT_CLASSES} min-h-[44px]`}
            />
          </label>
        </div>
        {form.extrasType === "wide" || form.extrasType === "noball" ? (
          <p className="-mt-1 text-xs text-muted">
            Extra runs include the {form.extrasType === "wide" ? config.widePenalty : config.noBallPenalty}-run{" "}
            {form.extrasType === "wide" ? "wide" : "no-ball"} penalty.
          </p>
        ) : null}

        <div>
          <Label>Boundary</Label>
          <div className="flex gap-2">
            {[
              ["", "None"],
              ["4", "Four"],
              ["6", "Six"],
            ].map(([value, label]) => (
              <button
                key={label}
                type="button"
                onClick={() => update({ boundary: value })}
                className={`min-h-[40px] flex-1 rounded-lg border-2 text-sm font-black ${
                  form.boundary === value ? "border-green bg-green text-white" : "border-ink/10 bg-white text-ink"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <label className="text-sm">
          <Label>Wicket</Label>
          <select value={form.wicketType} onChange={(e) => update({ wicketType: e.target.value })} className={`${INPUT_CLASSES} min-h-[44px]`}>
            <option value="">No wicket</option>
            {WICKET_TYPES.map((type) => (
              <option key={type} value={type}>
                {WICKET_LABELS[type]}
              </option>
            ))}
          </select>
        </label>
        {form.wicketType ? (
          <div className="grid grid-cols-2 gap-2">
            {select("Player out", form.playerOut, (v) => update({ playerOut: v }), [form.striker, form.nonStriker].filter(Boolean))}
            {select("Fielder", form.fielder, (v) => update({ fielder: v }), bowlingXI, { allowEmpty: true })}
          </div>
        ) : null}
      </div>

      {error ? (
        <Notice tone="error" className="mt-4">
          {error}
        </Notice>
      ) : null}
      <div className="mt-5 flex gap-2">
        <Button type="button" variant="secondary" onClick={remove} disabled={busy} className="text-brand-red">
          Delete
        </Button>
        <Button type="button" onClick={save} disabled={busy} className="flex-1">
          {busy ? "Saving..." : "Save correction"}
        </Button>
      </div>
    </Sheet>
  );
}
