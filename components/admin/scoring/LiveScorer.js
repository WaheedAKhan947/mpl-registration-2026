"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import Notice from "@/components/admin/Notice";
import Panel from "@/components/admin/Panel";
import { INPUT_CLASSES } from "@/components/admin/formStyles";
import { bowlerProblem, computeResult, formatOvers, replayInnings, validateBall } from "@/lib/scoring";
import { safeJsonResponse } from "@/lib/http";
import {
  BigButton,
  ExtrasSheet,
  MoreSheet,
  NumberSheet,
  PickPlayerSheet,
  RetireSheet,
  WicketSheet,
} from "@/components/admin/scoring/ScoringSheets";
import { BallEditSheet, BallHistorySheet } from "@/components/admin/scoring/BallEditor";

const ENDPOINTS = {
  ball: "/api/admin/scoring/ball",
  undo: "/api/admin/scoring/undo",
  select: "/api/admin/scoring/select-players",
};

const MAX_RETRY_MS = 15000;

function newId() {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch {
    // Not a secure context (e.g. a phone on http://192.168...): fall through.
  }
  const part = () => Math.random().toString(36).slice(2, 12);
  return `${Date.now().toString(36)}-${part()}-${part()}`;
}

function buzz() {
  try {
    navigator.vibrate?.(12);
  } catch {
    // Vibration is a nicety only.
  }
}

function replayOptions(inn) {
  return { config: inn.state.config, target: inn.target, maxOvers: inn.maxOvers || undefined };
}

// Confirmed server balls plus everything still waiting in the queue, so the
// screen reacts instantly while writes happen in the background.
function deriveView(server, queue) {
  const { match } = server;
  const inn = server.innings.find((i) => i.number === match.currentInnings) || null;
  if (!inn) return { match, inn: null };

  const options = replayOptions(inn);
  let balls = inn.balls;
  let crease = { striker: inn.striker, nonStriker: inn.nonStriker, bowler: inn.bowler };
  let status = inn.status;

  for (const op of queue) {
    if (op.innings !== inn.number) continue;
    if (op.type === "ball") {
      balls = [...balls, { ...op.ball, seq: op.expectedSeq, clientId: op.clientId, pending: true }];
      const s = replayInnings(balls, options);
      crease = { striker: s.striker, nonStriker: s.nonStriker, bowler: s.currentBowler };
    } else if (op.type === "undo") {
      const last = balls[balls.length - 1];
      if (last) {
        balls = balls.slice(0, -1);
        crease = { striker: last.striker, nonStriker: last.nonStriker, bowler: last.bowler };
        status = "in_progress";
      }
    } else if (op.type === "select") {
      crease = { ...crease, ...op.fields };
    }
  }

  const state = replayInnings(balls, options);
  const pendingIds = new Set(balls.filter((b) => b.pending).map((b) => b.clientId));
  return {
    match,
    inn,
    balls,
    crease,
    state,
    pendingIds,
    inningsOver: status === "completed" || state.complete,
  };
}

// ---------------------------------------------------------------- display bits

function chipTone(label) {
  if (label === "W" || label === "RO") return "bg-brand-red text-white";
  if (label === "4" || label === "6") return "bg-gold text-navy-dark";
  if (/Wd|Nb|B|Lb|P|RH/.test(label)) return "bg-white/20 text-white ring-1 ring-white/30";
  return "bg-white text-ink border border-ink/10";
}

function BallChips({ state, pendingIds }) {
  const recent = state.balls.slice(-6);
  if (!recent.length) return <p className="text-sm text-white/60">No balls yet</p>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {recent.map((ball) => (
        <span
          key={ball.clientId || ball.seq}
          title={pendingIds.has(ball.clientId) ? "Saving..." : undefined}
          className={`grid h-8 min-w-[2rem] place-items-center rounded-full px-1.5 text-xs font-black tabular-nums ${chipTone(
            ball.label
          )} ${pendingIds.has(ball.clientId) ? "opacity-60 ring-2 ring-white/40" : ""}`}
        >
          {ball.label}
        </span>
      ))}
    </div>
  );
}

function ScoreHeader({ view }) {
  const { inn, state, match } = view;
  const quota = inn.maxOvers || match.overs;
  return (
    <section className="rounded-2xl bg-navy-dark p-4 text-white shadow-panel-navy">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold uppercase tracking-[0.12em] text-white/70">
        <span>
          {inn.battingTeam} · Innings {inn.number}
        </span>
        {state.freeHit && !view.inningsOver ? (
          <span className="animate-pulse rounded-full bg-gold px-2.5 py-1 text-[0.68rem] font-black text-navy-dark">
            Free hit
          </span>
        ) : null}
      </div>
      <div className="mt-1 flex flex-wrap items-end gap-x-3">
        <p className="font-sans text-5xl font-black tabular-nums leading-none">
          {state.runs}/{state.wickets}
        </p>
        <p className="pb-1 text-lg font-bold tabular-nums text-white/80">
          ({state.overs}/{quota} ov)
        </p>
      </div>
      <p className="mt-2 text-sm font-semibold tabular-nums text-white/80">
        CRR {state.runRate.toFixed(2)}
        {inn.target ? (
          <>
            {" · "}Target {inn.target}
            {inn.targetRevised ? " (revised)" : ""}
          </>
        ) : null}
      </p>
      {inn.target && !view.inningsOver ? (
        <p className="mt-0.5 text-sm font-bold text-lime">
          Need {state.runsNeeded} from {state.ballsRemaining} ball{state.ballsRemaining === 1 ? "" : "s"}
          {state.requiredRate !== null ? ` · RRR ${state.requiredRate.toFixed(2)}` : ""}
        </p>
      ) : null}
      <div className="mt-3">
        <BallChips state={state} pendingIds={view.pendingIds} />
      </div>
    </section>
  );
}

function CreaseCard({ view, players }) {
  const { state, crease } = view;
  const name = (id) => players[id]?.name || "Select batter";
  const batter = (id) => state.batters.find((b) => b.id === id) || { runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: 0 };
  const bowler = state.bowlers.find((b) => b.id === crease.bowler);

  return (
    <section className="rounded-2xl border border-ink/10 bg-white p-3.5">
      <table className="w-full text-sm tabular-nums">
        <thead>
          <tr className="text-[0.68rem] font-black uppercase tracking-[0.1em] text-muted">
            <th className="pb-1 text-left">Batter</th>
            <th className="pb-1 text-right">R</th>
            <th className="pb-1 text-right">B</th>
            <th className="pb-1 text-right">4s</th>
            <th className="pb-1 text-right">6s</th>
            <th className="pb-1 text-right">SR</th>
          </tr>
        </thead>
        <tbody>
          {[crease.striker, crease.nonStriker].map((id, index) => {
            if (!id && index === 1 && !crease.striker) return null;
            const b = batter(id);
            return (
              <tr key={index} className={index === 0 ? "font-black text-ink" : "font-semibold text-ink/80"}>
                <td className="max-w-[9rem] truncate py-1 text-left">
                  {id ? name(id) : <span className="text-brand-red">{index === 0 ? "Striker needed" : "Batter needed"}</span>}
                  {index === 0 && id ? " *" : ""}
                </td>
                <td className="text-right">{id ? b.runs : ""}</td>
                <td className="text-right">{id ? b.balls : ""}</td>
                <td className="text-right">{id ? b.fours : ""}</td>
                <td className="text-right">{id ? b.sixes : ""}</td>
                <td className="text-right">{id ? b.strikeRate.toFixed(1) : ""}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-1 text-xs font-semibold text-muted">
        Partnership {state.currentPartnership.runs} ({state.currentPartnership.balls})
      </p>
      <div className="mt-2.5 flex items-center justify-between gap-3 border-t border-ink/[0.06] pt-2.5 text-sm">
        <span className="min-w-0 truncate font-bold text-ink">
          {crease.bowler ? players[crease.bowler]?.name : <span className="text-brand-red">Bowler needed</span>}
        </span>
        <span className="shrink-0 font-bold tabular-nums text-ink">
          {bowler ? `${bowler.overs}-${bowler.maidens}-${bowler.runs}-${bowler.wickets}` : "0.0-0-0-0"}
          <span className="ml-1 text-xs font-semibold text-muted">O-M-R-W</span>
        </span>
      </div>
    </section>
  );
}

function SyncStatus({ queue, paused, onRetry }) {
  const failed = queue.some((op) => op.attempts);
  let text = "All balls saved";
  let dot = "bg-green";
  if (paused) {
    text = `Session expired · ${queue.length} waiting`;
    dot = "bg-brand-red";
  } else if (failed) {
    text = `No connection · ${queue.length} waiting · retrying`;
    dot = "bg-brand-red animate-pulse";
  } else if (queue.length) {
    text = `Saving ${queue.length}...`;
    dot = "bg-gold animate-pulse";
  }
  return (
    <p className="flex items-center gap-2 text-xs font-bold text-muted" role="status">
      <span aria-hidden="true" className={`h-2 w-2 rounded-full ${dot}`} />
      {text}
      {paused || failed ? (
        <button type="button" onClick={onRetry} className="text-green-dark underline">
          Retry now
        </button>
      ) : null}
    </p>
  );
}

// ---------------------------------------------------------------- break / finish panels

function InningsBreak({ view, players, busy, onStart, onUndo, onEdit }) {
  const { match, inn, state } = view;
  const [striker, setStriker] = useState("");
  const [nonStriker, setNonStriker] = useState("");
  const [bowler, setBowler] = useState("");
  const [target, setTarget] = useState("");
  const [maxOvers, setMaxOvers] = useState("");
  const nextBatting = inn.bowlingTeam;
  const sideOf = (team) => (team === match.teamA ? match.playingXI.teamA : match.playingXI.teamB);
  const battingXI = sideOf(nextBatting);
  const bowlingXI = sideOf(inn.battingTeam);
  const name = (id) => players[id]?.name || id;
  const ready = striker && nonStriker && bowler && striker !== nonStriker;

  const select = (value, onChange, options, label, exclude) => (
    <label className="text-sm">
      <span className="mb-1 block text-[0.68rem] font-black uppercase tracking-[0.12em] text-muted">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={`${INPUT_CLASSES} min-h-[48px]`}>
        <option value="">Select player</option>
        {options
          .filter((id) => id !== exclude)
          .map((id) => (
            <option key={id} value={id}>
              {name(id)}
            </option>
          ))}
      </select>
    </label>
  );

  return (
    <Panel
      title="Innings break"
      description={`${inn.battingTeam} made ${state.runs}/${state.wickets} in ${state.overs} overs. ${nextBatting} need ${
        target || state.runs + 1
      } to win.`}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        {select(striker, setStriker, battingXI, `${nextBatting} striker`, nonStriker)}
        {select(nonStriker, setNonStriker, battingXI, "Non-striker", striker)}
        {select(bowler, setBowler, bowlingXI, `${inn.battingTeam} opening bowler`)}
      </div>
      <details className="mt-3 rounded-xl border border-ink/10 bg-[#fafbfa] p-3 text-sm">
        <summary className="cursor-pointer font-bold text-ink">Rain: revised target or overs (DLS)</summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label>
            <span className="mb-1 block text-[0.68rem] font-black uppercase tracking-[0.12em] text-muted">Target</span>
            <input
              type="number"
              min="1"
              inputMode="numeric"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder={String(state.runs + 1)}
              className={INPUT_CLASSES}
            />
          </label>
          <label>
            <span className="mb-1 block text-[0.68rem] font-black uppercase tracking-[0.12em] text-muted">Overs</span>
            <input
              type="number"
              min="1"
              max={match.overs}
              inputMode="numeric"
              value={maxOvers}
              onChange={(e) => setMaxOvers(e.target.value)}
              placeholder={String(match.overs)}
              className={INPUT_CLASSES}
            />
          </label>
        </div>
      </details>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={onUndo} disabled={busy}>
          Undo last ball
        </Button>
        <Button type="button" variant="secondary" onClick={onEdit} disabled={busy}>
          Edit a ball
        </Button>
        <Button
          type="button"
          className="flex-1"
          disabled={!ready || busy}
          onClick={() => onStart({ striker, nonStriker, bowler, target, maxOvers })}
        >
          {busy ? "Starting..." : "Start 2nd innings"}
        </Button>
      </div>
    </Panel>
  );
}

function ResultPanel({ server, busy, onFinish, onUndo, onEdit }) {
  const first = server.innings.find((i) => i.number === 1);
  const second = server.innings.find((i) => i.number === 2);
  const secondState = replayInnings(second.balls, replayOptions(second));
  const result = computeResult({
    first: { ...first.state, team: first.battingTeam },
    second: { ...secondState, team: second.battingTeam, complete: true },
    revisedTarget: second.targetRevised,
  });

  return (
    <Panel title="Innings complete" description="Check the score, then finish the match to save the result.">
      <p className="rounded-xl bg-green/10 px-4 py-3 font-sans text-lg font-black text-green-dark">{result?.text}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={onUndo} disabled={busy}>
          Undo last ball
        </Button>
        <Button type="button" variant="secondary" onClick={onEdit} disabled={busy}>
          Edit a ball
        </Button>
        <Button type="button" className="flex-1" onClick={onFinish} disabled={busy}>
          {busy ? "Saving..." : "Finish match"}
        </Button>
      </div>
    </Panel>
  );
}

function FinishedPanel({ server, canReopen, busy, onReopen }) {
  const { match, innings } = server;
  return (
    <Panel title="Match finished" description={match.result || "No result recorded."}>
      <ul className="grid gap-2 text-sm">
        {innings
          .filter((i) => i.number <= 2)
          .map((i) => (
            <li key={i.number} className="flex justify-between rounded-xl border border-ink/10 bg-[#fafbfa] px-3.5 py-2.5">
              <span className="font-bold text-ink">{i.battingTeam}</span>
              <span className="font-black tabular-nums text-ink">
                {i.state.runs}/{i.state.wickets} ({i.state.overs})
              </span>
            </li>
          ))}
      </ul>
      {canReopen ? (
        <div className="mt-4">
          <Button type="button" variant="secondary" onClick={onReopen} disabled={busy}>
            Re-open for corrections
          </Button>
          <p className="mt-1.5 text-xs text-muted">The result is cleared until the match is finished again.</p>
        </div>
      ) : null}
    </Panel>
  );
}

// ---------------------------------------------------------------- main

export default function LiveScorer({ data, setData, user, onEditSetup, onChanged }) {
  const [queue, setQueue] = useState([]);
  const [sheet, setSheet] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);
  const [paused, setPaused] = useState(false);
  const [declaring, setDeclaring] = useState(false);
  const [hiddenPrompt, setHiddenPrompt] = useState("");
  const [tick, setTick] = useState(0);
  const sendingRef = useRef(false);

  const matchId = data.match.id;
  const view = useMemo(() => deriveView(data, queue), [data, queue]);
  const { inn, state, crease } = view;
  const players = data.players;

  const reload = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/scoring/matches/${matchId}`, { cache: "no-store" });
      const result = await safeJsonResponse(res);
      if (res.ok) setData(result);
    } catch {
      // The next action will try again.
    }
  }, [matchId, setData]);

  // ---- waiting actions survive a refresh, a closed tab or a flat battery:
  // they are kept on this device until the server confirms them. Retries are
  // safe because every ball carries its own clientId.
  const storageKey = `mpl-scoring-queue-${matchId}`;
  const queueLoaded = useRef(false);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
      if (Array.isArray(saved) && saved.length) {
        setQueue(saved.map((op) => ({ ...op, retryAt: 0 })));
        setNotice({
          tone: "info",
          text: `Restored ${saved.length} unsaved action${saved.length === 1 ? "" : "s"} from this device. Sending now.`,
        });
      }
    } catch {
      // Storage blocked or corrupt: start with an empty queue.
    }
    queueLoaded.current = true;
  }, [storageKey]);

  useEffect(() => {
    if (!queueLoaded.current) return;
    try {
      if (queue.length) localStorage.setItem(storageKey, JSON.stringify(queue));
      else localStorage.removeItem(storageKey);
    } catch {
      // Storage full or blocked: the queue still lives in memory.
    }
  }, [queue, storageKey]);

  // ---- background queue: one request at a time, in order, retried with backoff.
  useEffect(() => {
    if (sendingRef.current || paused) return undefined;
    const op = queue[0];
    if (!op) return undefined;
    const wait = (op.retryAt || 0) - Date.now();
    if (wait > 0) {
      const timer = setTimeout(() => setTick((n) => n + 1), wait);
      return () => clearTimeout(timer);
    }

    sendingRef.current = true;
    const body =
      op.type === "ball"
        ? { matchId, innings: op.innings, expectedSeq: op.expectedSeq, clientId: op.clientId, ball: op.ball }
        : op.type === "undo"
          ? { matchId, innings: op.innings, expectedSeq: op.expectedSeq }
          : { matchId, innings: op.innings, ...op.fields };

    (async () => {
      try {
        const res = await fetch(ENDPOINTS[op.type], {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const result = await safeJsonResponse(res);
        if (res.ok) {
          // eslint-disable-next-line no-unused-vars
          const { ok, duplicate, ...fresh } = result;
          setData(fresh);
          setQueue((q) => q.filter((o) => o.id !== op.id));
        } else if (res.status === 401) {
          setPaused(true);
          setNotice({ tone: "error", text: "Your session expired. Log in again in another tab, then tap Retry now." });
        } else if (res.status >= 500) {
          throw new Error(result.error || "Server error");
        } else {
          // Rejected for good (another scorer, invalid ball): resync from the server.
          setQueue([]);
          setNotice({ tone: "error", text: result.error || "That was not saved." });
          await reload();
        }
      } catch {
        setQueue((q) =>
          q.map((o) =>
            o.id === op.id
              ? { ...o, attempts: (o.attempts || 0) + 1, retryAt: Date.now() + Math.min(MAX_RETRY_MS, 1500 * 2 ** (o.attempts || 0)) }
              : o
          )
        );
      } finally {
        sendingRef.current = false;
        setTick((n) => n + 1);
      }
    })();
    return undefined;
  }, [queue, tick, paused, matchId, reload, setData]);

  function retryNow() {
    setPaused(false);
    setNotice(null);
    setQueue((q) => q.map((o) => ({ ...o, retryAt: 0 })));
  }

  useEffect(() => {
    window.addEventListener("online", retryNow);
    return () => window.removeEventListener("online", retryNow);
  }, []);

  useEffect(() => {
    if (!queue.length) return undefined;
    function warn(event) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [queue.length]);

  // ---- actions

  function enqueue(op) {
    setQueue((q) => [...q, { id: newId(), innings: inn.number, ...op }]);
  }

  // Returns an error message (shown by the caller) or null once queued.
  function recordBall(partial) {
    const ball = {
      striker: crease.striker,
      nonStriker: crease.nonStriker,
      bowler: crease.bowler,
      runsOffBat: 0,
      extrasType: null,
      extraRuns: 0,
      boundary: null,
      wicket: null,
      ...partial,
    };
    if (state.currentBowler && ball.bowler && ball.bowler !== state.currentBowler) ball.bowlerChange = true;
    const expectedSeq = state.lastSeq + 1;
    const problem = validateBall({ ...ball, seq: expectedSeq }, state);
    if (problem) return problem;
    enqueue({ type: "ball", clientId: newId(), expectedSeq, ball });
    setSheet(null);
    setNotice(null);
    buzz();
    return null;
  }

  function quick(partial) {
    const problem = recordBall(partial);
    if (problem) setNotice({ tone: "error", text: problem });
  }

  function select(fields) {
    enqueue({ type: "select", fields });
    setSheet(null);
  }

  async function blocking(path, payload) {
    if (queue.length) {
      setNotice({ tone: "info", text: "Still saving the last balls. Try again in a moment." });
      return null;
    }
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, ...payload }),
      });
      const result = await safeJsonResponse(res);
      if (!res.ok) {
        setNotice({ tone: "error", text: result.error || "That did not work." });
        if (res.status === 409) await reload();
        return null;
      }
      // eslint-disable-next-line no-unused-vars
      const { ok, result: matchResult, ...fresh } = result;
      setData(fresh);
      onChanged?.();
      return fresh;
    } catch {
      setNotice({ tone: "error", text: "No connection. Check the signal and try again." });
      return null;
    } finally {
      setBusy(false);
    }
  }

  // Correct (PUT) or delete (DELETE) an earlier ball. Returns an error
  // message for the edit sheet, or null on success.
  async function correctBall(method, ball, innings, fields) {
    if (queue.length) return "Still saving the last balls. Try again in a moment.";
    setBusy(true);
    try {
      const expectedSeq = innings.balls.length ? innings.balls[innings.balls.length - 1].seq : 0;
      const res = await fetch(`/api/admin/scoring/ball/${ball.id}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, expectedSeq, ...(fields ? { ball: fields } : {}) }),
      });
      const result = await safeJsonResponse(res);
      if (!res.ok) {
        if (res.status === 409) await reload();
        return result.error || "That correction was not saved.";
      }
      // eslint-disable-next-line no-unused-vars
      const { ok, ...fresh } = result;
      setData(fresh);
      onChanged?.();
      setSheet(null);
      setNotice({ tone: "success", text: method === "DELETE" ? "Ball deleted." : "Ball corrected." });
      return null;
    } catch {
      return "No connection. Check the signal and try again.";
    } finally {
      setBusy(false);
    }
  }

  function undo() {
    setSheet(null);
    setNotice(null);
    const last = view.balls[view.balls.length - 1];
    if (!last) {
      if (inn.number > 1) blocking("/api/admin/scoring/undo", { innings: inn.number, expectedSeq: 0 });
      return;
    }
    const lastOp = queue[queue.length - 1];
    const inFlight = sendingRef.current && queue.length === 1;
    if (lastOp && lastOp.type === "ball" && lastOp.clientId === last.clientId && !inFlight && !lastOp.attempts) {
      // Never sent: just drop it.
      setQueue((q) => q.slice(0, -1));
    } else {
      enqueue({ type: "undo", expectedSeq: last.seq });
    }
    setDeclaring(false);
    buzz();
  }

  if (!inn) return <Notice>This match has not started yet.</Notice>;

  const { match } = data;
  const battingXI = inn.battingTeam === match.teamA ? match.playingXI.teamA : match.playingXI.teamB;
  const bowlingXI = inn.battingTeam === match.teamA ? match.playingXI.teamB : match.playingXI.teamA;
  const name = (id) => players[id]?.name || "Unknown";
  const config = inn.state.config;
  const lone = config.lastManStands && state.wickets === config.playersPerSide - 1;

  const needBatter = !view.inningsOver && (!crease.striker || (!crease.nonStriker && !lone));
  const needBowler = !view.inningsOver && !needBatter && !crease.bowler;
  const promptKey = needBatter ? `batter-${state.lastSeq}` : needBowler ? `bowler-${state.lastSeq}` : "";

  const outIds = new Set(state.batters.filter((b) => b.out).map((b) => b.id));
  const batterOptions = battingXI
    .filter((id) => !outIds.has(id) && id !== crease.striker && id !== crease.nonStriker)
    .map((id) => {
      const b = state.batters.find((x) => x.id === id);
      return { id, name: name(id), detail: b?.retiredHurt ? `Retired hurt on ${b.runs} (${b.balls}), can resume` : "Yet to bat" };
    });

  const bowlerOptions = (midOver) =>
    bowlingXI.map((id) => {
      const b = state.bowlers.find((x) => x.id === id);
      return {
        id,
        name: name(id),
        detail: b ? `${b.overs}-${b.maidens}-${b.runs}-${b.wickets}` : "Yet to bowl",
        disabledReason: bowlerProblem(state, id, { midOverChange: midOver }) || (midOver && id === crease.bowler ? "Bowling now" : ""),
      };
    });

  function pickBatter(id) {
    if (!crease.striker) select({ striker: id });
    else select({ nonStriker: id });
  }

  const scoringLocked = view.inningsOver || needBatter || needBowler || busy;
  const noBallsAtAll = data.innings.every((i) => i.balls.length === 0) && queue.length === 0;

  // ---- finished / break states

  if (match.scoringStatus === "completed") {
    return (
      <FinishedPanel
        server={data}
        canReopen={user?.role === "owner" || user?.role === "admin"}
        busy={busy}
        onReopen={() => {
          if (confirm("Re-open this match? The result will be cleared until it is finished again.")) {
            blocking("/api/admin/scoring/reopen", {});
          }
        }}
      />
    );
  }

  const showBreak = inn.number === 1 && (view.inningsOver || declaring);
  const showResult = inn.number === 2 && view.inningsOver && queue.length === 0;

  return (
    <div className="grid gap-3 pb-6">
      <ScoreHeader view={view} />

      {notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}

      {showBreak ? (
        <InningsBreak
          view={view}
          players={players}
          busy={busy || queue.length > 0}
          onUndo={undo}
          onEdit={() => setSheet({ kind: "history" })}
          onStart={async (form) => {
            const ok = await blocking("/api/admin/scoring/end-innings", { innings: 1, ...form });
            if (ok) setDeclaring(false);
          }}
        />
      ) : null}

      {showResult ? (
        <ResultPanel
          server={data}
          busy={busy}
          onUndo={undo}
          onEdit={() => setSheet({ kind: "history" })}
          onFinish={() => blocking("/api/admin/scoring/finish", {})}
        />
      ) : null}

      {!showBreak && !showResult ? (
        <>
          <CreaseCard view={view} players={players} />

          {needBatter || needBowler ? (
            <Button type="button" variant="gold" onClick={() => setHiddenPrompt("")}>
              {needBatter ? "Select next batter" : "Select bowler for the next over"}
            </Button>
          ) : null}

          <div className="grid grid-cols-4 gap-2">
            {[0, 1, 2, 3].map((n) => (
              <BigButton key={n} disabled={scoringLocked} onClick={() => quick({ runsOffBat: n })} className="text-xl">
                {n === 0 ? "0" : n}
              </BigButton>
            ))}
            <BigButton tone="boundary" disabled={scoringLocked} onClick={() => quick({ runsOffBat: 4, boundary: 4 })} className="text-xl">
              4
            </BigButton>
            <BigButton tone="boundary" disabled={scoringLocked} onClick={() => quick({ runsOffBat: 6, boundary: 6 })} className="text-xl">
              6
            </BigButton>
            <BigButton tone="extra" disabled={scoringLocked} onClick={() => setSheet({ kind: "extras", type: "wide" })}>
              Wd
            </BigButton>
            <BigButton tone="extra" disabled={scoringLocked} onClick={() => setSheet({ kind: "extras", type: "noball" })}>
              Nb
            </BigButton>
            <BigButton tone="extra" disabled={scoringLocked} onClick={() => setSheet({ kind: "extras", type: "bye" })}>
              Bye
            </BigButton>
            <BigButton tone="extra" disabled={scoringLocked} onClick={() => setSheet({ kind: "extras", type: "legbye" })}>
              LB
            </BigButton>
            <BigButton tone="danger" disabled={scoringLocked} onClick={() => setSheet({ kind: "wicket" })}>
              Out
            </BigButton>
            <BigButton tone="quiet" disabled={busy || (view.balls.length === 0 && inn.number === 1)} onClick={undo}>
              Undo
            </BigButton>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <BigButton
              tone="quiet"
              disabled={busy || view.inningsOver || !crease.striker || !crease.nonStriker}
              onClick={() => select({ striker: crease.nonStriker, nonStriker: crease.striker })}
              className="text-sm"
            >
              Swap strike
            </BigButton>
            <BigButton
              tone="quiet"
              disabled={busy || view.inningsOver || !crease.striker}
              onClick={() => setSheet({ kind: "retire" })}
              className="text-sm"
            >
              Retire
            </BigButton>
            <BigButton tone="quiet" disabled={busy} onClick={() => setSheet({ kind: "more" })} className="text-sm">
              More
            </BigButton>
          </div>
        </>
      ) : null}

      <SyncStatus queue={queue} paused={paused} onRetry={retryNow} />

      {/* ---- sheets */}
      {sheet?.kind === "extras" ? (
        <ExtrasSheet type={sheet.type} config={config} onPick={quick} onClose={() => setSheet(null)} />
      ) : null}
      {sheet?.kind === "wicket" ? (
        <WicketSheet
          crease={crease}
          freeHit={state.freeHit}
          config={config}
          players={players}
          fielders={bowlingXI}
          onSubmit={recordBall}
          onClose={() => setSheet(null)}
        />
      ) : null}
      {sheet?.kind === "retire" ? (
        <RetireSheet crease={crease} players={players} onSubmit={recordBall} onClose={() => setSheet(null)} />
      ) : null}
      {sheet?.kind === "runs" ? (
        <NumberSheet
          title="Other runs"
          label="Runs off the bat (overthrows, all run)"
          options={[4, 5, 7].map((n) => ({ label: n === 4 ? "4 run" : String(n), value: n }))}
          onPick={(n) => quick({ runsOffBat: n })}
          onClose={() => setSheet(null)}
        />
      ) : null}
      {sheet?.kind === "penalty" ? (
        <NumberSheet
          title="Penalty runs"
          label="Awarded to the batting side"
          options={[1, 2, 5].map((n) => ({ label: String(n), value: n }))}
          onPick={(n) => quick({ extrasType: "penalty", extraRuns: n })}
          onClose={() => setSheet(null)}
        />
      ) : null}
      {sheet?.kind === "changeBowler" ? (
        <PickPlayerSheet
          title="Change bowler"
          hint={state.currentBowler ? "Mid-over change (for example an injury). The new bowler finishes this over." : undefined}
          options={bowlerOptions(Boolean(state.currentBowler))}
          onPick={(id) => select({ bowler: id })}
          onClose={() => setSheet(null)}
        />
      ) : null}
      {sheet?.kind === "history" ? (
        <BallHistorySheet
          data={data}
          onPick={(ball, innings) => setSheet({ kind: "editBall", ball, innings })}
          onClose={() => setSheet(null)}
        />
      ) : null}
      {sheet?.kind === "editBall" ? (
        <BallEditSheet
          ball={sheet.ball}
          innings={sheet.innings}
          match={data.match}
          players={players}
          config={sheet.innings.state.config}
          busy={busy}
          onSave={(fields) => correctBall("PUT", sheet.ball, sheet.innings, fields)}
          onDelete={() => correctBall("DELETE", sheet.ball, sheet.innings)}
          onClose={() => setSheet(null)}
        />
      ) : null}
      {sheet?.kind === "more" ? (
        <MoreSheet
          onClose={() => setSheet(null)}
          actions={[
            { label: "Other runs (4 run, 5, 7)", disabled: scoringLocked, onClick: () => setSheet({ kind: "runs" }) },
            { label: "Penalty runs", disabled: scoringLocked, onClick: () => setSheet({ kind: "penalty" }) },
            {
              label: "Edit an earlier ball",
              hint: "Correct or delete any ball; later balls are re-checked",
              disabled: busy,
              onClick: () => setSheet({ kind: "history" }),
            },
            { label: "Change bowler", disabled: view.inningsOver, onClick: () => setSheet({ kind: "changeBowler" }) },
            {
              label: "End innings now",
              hint: inn.number === 1 ? "Declare or stop early, then start the chase" : "Stop the chase early (rain, bad light)",
              disabled: view.inningsOver,
              onClick: () => {
                setSheet(null);
                if (!confirm("End this innings now?")) return;
                if (inn.number === 1) setDeclaring(true);
                else blocking("/api/admin/scoring/end-innings", { innings: 2 });
              },
            },
            {
              label: "Change match setup",
              hint: "Toss, overs, playing XI, openers",
              hidden: !noBallsAtAll || inn.number !== 1,
              onClick: () => {
                setSheet(null);
                onEditSetup?.();
              },
            },
            {
              label: "Abandon match (no result)",
              tone: "danger",
              onClick: () => {
                setSheet(null);
                if (confirm("Abandon this match with no result?")) blocking("/api/admin/scoring/finish", { abandoned: true });
              },
            },
          ]}
        />
      ) : null}

      {!sheet && promptKey && hiddenPrompt !== promptKey ? (
        needBatter ? (
          <PickPlayerSheet
            title="Next batter"
            hint={!crease.striker ? "Comes in on strike." : "Comes in at the non-striker's end."}
            options={batterOptions}
            onPick={pickBatter}
            onClose={() => setHiddenPrompt(promptKey)}
          />
        ) : (
          <PickPlayerSheet
            title={state.legalBalls ? `Over ${Math.floor(state.legalBalls / 6) + 1}: bowler` : "Opening bowler"}
            options={bowlerOptions(false)}
            onPick={(id) => select({ bowler: id })}
            onClose={() => setHiddenPrompt(promptKey)}
          />
        )
      ) : null}

      <p className="text-center text-xs text-muted">
        Overs {formatOvers(state.legalBalls)} · Extras {state.extras.total} (wd {state.extras.wides}, nb {state.extras.noballs}, b{" "}
        {state.extras.byes}, lb {state.extras.legbyes})
      </p>
    </div>
  );
}
