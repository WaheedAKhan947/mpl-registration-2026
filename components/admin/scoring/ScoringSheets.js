"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Notice from "@/components/admin/Notice";
import { INPUT_CLASSES } from "@/components/admin/formStyles";
import { WICKET_LABELS } from "@/lib/scoring";

// ---------------------------------------------------------------- shared bits

export function Sheet({ title, onClose, children }) {
  return (
    <Modal title={title} onClose={onClose} maxWidthClassName="max-w-md" panelClassName="bg-white p-5">
      {children}
    </Modal>
  );
}

export function BigButton({ children, onClick, tone = "default", disabled = false, className = "", ...props }) {
  const tones = {
    default: "border-ink/10 bg-white text-ink hover:border-green/50 active:bg-green/10",
    active: "border-green bg-green text-white",
    boundary: "border-gold/50 bg-gold/15 text-navy-dark hover:border-gold active:bg-gold/30",
    extra: "border-navy/15 bg-navy/[0.05] text-navy hover:border-navy/40 active:bg-navy/10",
    danger: "border-brand-red/30 bg-brand-red text-white hover:bg-[#c2332a]",
    quiet: "border-ink/10 bg-[#fafbfa] text-muted hover:text-ink",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`min-h-[52px] select-none rounded-xl border-2 px-2 text-base font-black transition disabled:cursor-not-allowed disabled:opacity-40 ${tones[tone]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

function Label({ children }) {
  return <p className="mb-1.5 mt-4 text-[0.68rem] font-black uppercase tracking-[0.12em] text-muted first:mt-0">{children}</p>;
}

// ---------------------------------------------------------------- extras

// Builds the ball for a wide / no-ball / bye / leg bye from the runs picked.
export function ExtrasSheet({ type, config, onPick, onClose }) {
  const wide = config.widePenalty;
  const nb = config.noBallPenalty;

  if (type === "wide") {
    return (
      <Sheet title="Wide" onClose={onClose}>
        <Label>Runs taken as well</Label>
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2, 3].map((n) => (
            <BigButton key={n} tone="extra" onClick={() => onPick({ extrasType: "wide", extraRuns: wide + n })}>
              {n === 0 ? "Wd" : `Wd +${n}`}
            </BigButton>
          ))}
          <BigButton tone="boundary" onClick={() => onPick({ extrasType: "wide", extraRuns: wide + 4, boundary: 4 })}>
            Wd + 4 (boundary)
          </BigButton>
        </div>
      </Sheet>
    );
  }

  if (type === "noball") {
    return (
      <Sheet title="No ball" onClose={onClose}>
        <Label>Runs off the bat</Label>
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2, 3].map((n) => (
            <BigButton key={n} tone="extra" onClick={() => onPick({ extrasType: "noball", extraRuns: nb, runsOffBat: n })}>
              {n === 0 ? "Nb" : `Nb +${n}`}
            </BigButton>
          ))}
          <BigButton
            tone="boundary"
            onClick={() => onPick({ extrasType: "noball", extraRuns: nb, runsOffBat: 4, boundary: 4 })}
          >
            Nb + 4
          </BigButton>
          <BigButton
            tone="boundary"
            onClick={() => onPick({ extrasType: "noball", extraRuns: nb, runsOffBat: 6, boundary: 6 })}
          >
            Nb + 6
          </BigButton>
        </div>
        <Label>Byes off the no ball (not off the bat)</Label>
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3].map((n) => (
            <BigButton key={n} tone="quiet" onClick={() => onPick({ extrasType: "noball", extraRuns: nb + n })}>
              +{n}b
            </BigButton>
          ))}
          <BigButton tone="quiet" onClick={() => onPick({ extrasType: "noball", extraRuns: nb + 4, boundary: 4 })}>
            +4b
          </BigButton>
        </div>
        <p className="mt-3 text-xs text-muted">The next ball will be a free hit.</p>
      </Sheet>
    );
  }

  const label = type === "bye" ? "Byes" : "Leg byes";
  return (
    <Sheet title={label} onClose={onClose}>
      <Label>Runs</Label>
      <div className="grid grid-cols-4 gap-2">
        {[1, 2, 3].map((n) => (
          <BigButton key={n} tone="extra" onClick={() => onPick({ extrasType: type, extraRuns: n })}>
            {n}
          </BigButton>
        ))}
        <BigButton tone="boundary" onClick={() => onPick({ extrasType: type, extraRuns: 4, boundary: 4 })}>
          4
        </BigButton>
      </div>
    </Sheet>
  );
}

// ---------------------------------------------------------------- wicket

const DISMISSALS = ["bowled", "caught", "lbw", "run_out", "stumped", "hit_wicket", "obstructing_field"];
const EITHER_END = new Set(["run_out", "obstructing_field"]);
const NEEDS_FIELDER = new Set(["caught", "stumped", "run_out"]);
const DELIVERIES = [
  { value: "normal", label: "Normal" },
  { value: "wide", label: "Wide" },
  { value: "noball", label: "No ball" },
  { value: "bye", label: "Bye" },
  { value: "legbye", label: "Leg bye" },
];

export function WicketSheet({ crease, freeHit, config, players, fielders, onSubmit, onClose }) {
  const [type, setType] = useState("");
  const [playerOut, setPlayerOut] = useState(crease.striker);
  const [fielder, setFielder] = useState("");
  const [runs, setRuns] = useState(0);
  const [delivery, setDelivery] = useState("normal");
  const [error, setError] = useState("");

  const name = (id) => players[id]?.name || "Unknown";
  const allowedOnFreeHit = (t) => !freeHit || EITHER_END.has(t);

  function pickType(next) {
    setType(next);
    setError("");
    if (!EITHER_END.has(next)) setPlayerOut(crease.striker);
    if (next !== "run_out" && next !== "stumped") setDelivery("normal");
    if (next !== "run_out") setRuns(0);
  }

  function buildBall() {
    const wicket = { type, playerOut, fielders: fielder ? [fielder] : [] };
    const ball = { runsOffBat: 0, extrasType: null, extraRuns: 0, wicket };
    switch (delivery) {
      case "wide":
        return { ...ball, extrasType: "wide", extraRuns: config.widePenalty + runs };
      case "noball":
        return { ...ball, extrasType: "noball", extraRuns: config.noBallPenalty, runsOffBat: runs };
      case "bye":
      case "legbye":
        return { ...ball, extrasType: delivery, extraRuns: runs };
      default:
        return { ...ball, runsOffBat: runs };
    }
  }

  function submit() {
    if (!type) return setError("Choose how the batter got out.");
    const problem = onSubmit(buildBall());
    if (problem) setError(problem);
  }

  const deliveryOptions = type === "stumped" ? DELIVERIES.slice(0, 2) : DELIVERIES;

  return (
    <Sheet title={freeHit ? "Wicket (free hit)" : "Wicket"} onClose={onClose}>
      <Label>How out</Label>
      <div className="grid grid-cols-2 gap-2">
        {DISMISSALS.map((t) => (
          <BigButton
            key={t}
            tone={type === t ? "active" : "default"}
            disabled={!allowedOnFreeHit(t)}
            onClick={() => pickType(t)}
            className="text-sm"
          >
            {WICKET_LABELS[t]}
          </BigButton>
        ))}
      </div>
      {freeHit ? <p className="mt-2 text-xs font-semibold text-brand-red">Free hit: only a run out is possible.</p> : null}

      {EITHER_END.has(type) ? (
        <>
          <Label>Who is out</Label>
          <div className="grid grid-cols-2 gap-2">
            {[crease.striker, crease.nonStriker].filter(Boolean).map((id) => (
              <BigButton key={id} tone={playerOut === id ? "active" : "default"} onClick={() => setPlayerOut(id)} className="text-sm">
                {name(id)}
                {id === crease.striker ? " *" : ""}
              </BigButton>
            ))}
          </div>
        </>
      ) : null}

      {NEEDS_FIELDER.has(type) ? (
        <>
          <Label>{type === "caught" ? "Caught by" : type === "stumped" ? "Wicket keeper" : "Fielder"}</Label>
          <select value={fielder} onChange={(event) => setFielder(event.target.value)} className={`${INPUT_CLASSES} min-h-[48px]`}>
            <option value="">{type === "run_out" ? "Not recorded" : "Select fielder"}</option>
            {fielders.map((id) => (
              <option key={id} value={id}>
                {name(id)}
                {id === crease.bowler ? " (bowler)" : ""}
              </option>
            ))}
          </select>
        </>
      ) : null}

      {type === "run_out" || type === "stumped" ? (
        <>
          <Label>Delivery</Label>
          <div className="flex flex-wrap gap-2">
            {deliveryOptions.map((d) => (
              <BigButton
                key={d.value}
                tone={delivery === d.value ? "active" : "quiet"}
                onClick={() => setDelivery(d.value)}
                className="min-h-[44px] px-3 text-sm"
              >
                {d.label}
              </BigButton>
            ))}
          </div>
        </>
      ) : null}

      {type === "run_out" ? (
        <>
          <Label>Runs completed before the run out</Label>
          <div className="grid grid-cols-4 gap-2">
            {[0, 1, 2, 3].map((n) => (
              <BigButton key={n} tone={runs === n ? "active" : "quiet"} onClick={() => setRuns(n)}>
                {n}
              </BigButton>
            ))}
          </div>
        </>
      ) : null}

      {error ? <Notice tone="error" className="mt-4">{error}</Notice> : null}
      <BigButton tone="danger" onClick={submit} className="mt-5 w-full">
        Out!
      </BigButton>
    </Sheet>
  );
}

// ---------------------------------------------------------------- pickers

// options: [{ id, name, detail, disabledReason }]
export function PickPlayerSheet({ title, hint, options, onPick, onClose }) {
  return (
    <Sheet title={title} onClose={onClose}>
      {hint ? <p className="-mt-2 mb-3 text-sm text-muted">{hint}</p> : null}
      {options.length === 0 ? <Notice>No players available.</Notice> : null}
      <ul className="grid gap-1.5">
        {options.map((option) => (
          <li key={option.id}>
            <button
              type="button"
              disabled={Boolean(option.disabledReason)}
              onClick={() => onPick(option.id)}
              className="flex min-h-[52px] w-full items-center gap-3 rounded-xl border-2 border-ink/10 bg-white px-3.5 text-left transition hover:border-green/50 active:bg-green/10 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate font-bold text-ink">{option.name}</span>
                {option.disabledReason || option.detail ? (
                  <span className="block truncate text-xs text-muted">{option.disabledReason || option.detail}</span>
                ) : null}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}

export function RetireSheet({ crease, players, onSubmit, onClose }) {
  const [playerOut, setPlayerOut] = useState(crease.striker);
  const [type, setType] = useState("retired_hurt");
  const [error, setError] = useState("");
  const name = (id) => players[id]?.name || "Unknown";

  function submit() {
    const problem = onSubmit({ wicket: { type, playerOut, fielders: [] } });
    if (problem) setError(problem);
  }

  return (
    <Sheet title="Retire batter" onClose={onClose}>
      <Label>Batter</Label>
      <div className="grid grid-cols-2 gap-2">
        {[crease.striker, crease.nonStriker].filter(Boolean).map((id) => (
          <BigButton key={id} tone={playerOut === id ? "active" : "default"} onClick={() => setPlayerOut(id)} className="text-sm">
            {name(id)}
          </BigButton>
        ))}
      </div>
      <Label>Type</Label>
      <div className="grid grid-cols-2 gap-2">
        <BigButton tone={type === "retired_hurt" ? "active" : "default"} onClick={() => setType("retired_hurt")} className="text-sm">
          Retired hurt
          <span className="block text-[0.7rem] font-semibold opacity-80">Not out, can return</span>
        </BigButton>
        <BigButton tone={type === "retired_out" ? "active" : "default"} onClick={() => setType("retired_out")} className="text-sm">
          Retired out
          <span className="block text-[0.7rem] font-semibold opacity-80">Counts as a wicket</span>
        </BigButton>
      </div>
      {error ? <Notice tone="error" className="mt-4">{error}</Notice> : null}
      <Button type="button" onClick={submit} className="mt-5 w-full">
        Retire
      </Button>
    </Sheet>
  );
}

export function MoreSheet({ actions, onClose }) {
  return (
    <Sheet title="More" onClose={onClose}>
      <div className="grid gap-2">
        {actions
          .filter((a) => !a.hidden)
          .map((action) => (
            <BigButton
              key={action.label}
              tone={action.tone || "default"}
              disabled={action.disabled}
              onClick={action.onClick}
              className="text-left text-sm"
            >
              <span className="block px-1">{action.label}</span>
              {action.hint ? <span className="block px-1 text-xs font-semibold opacity-70">{action.hint}</span> : null}
            </BigButton>
          ))}
      </div>
    </Sheet>
  );
}

export function NumberSheet({ title, label, options, onPick, onClose }) {
  return (
    <Sheet title={title} onClose={onClose}>
      <Label>{label}</Label>
      <div className="grid grid-cols-4 gap-2">
        {options.map((option) => (
          <BigButton key={option.label} tone="extra" onClick={() => onPick(option.value)}>
            {option.label}
          </BigButton>
        ))}
      </div>
    </Sheet>
  );
}
