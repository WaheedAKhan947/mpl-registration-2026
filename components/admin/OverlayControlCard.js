"use client";

import { useCallback, useEffect, useState } from "react";
import Panel from "@/components/admin/Panel";
import Notice from "@/components/admin/Notice";
import OverlayLinkBox from "@/components/admin/scoring/OverlayLinkBox";
import HighlightsLog from "@/components/admin/HighlightsLog";
import { INPUT_CLASSES } from "@/components/admin/formStyles";
import { RefreshIcon } from "@/components/admin/icons";
import { formatMatchDate } from "@/lib/matches";
import { safeJsonResponse } from "@/lib/http";

// Admin > Stream Overlay: drive the broadcast overlay of one match without
// touching OBS / PRISM. Every overlay showing that match picks a change up on
// its next poll (about 2 seconds, plus any ?delay).

const SELECTED_KEY = "mpl-overlay-match";

const SCREENS = [
  { value: "auto", label: "Automatic", hint: "Follows the match" },
  { value: "none", label: "Score bar only", hint: "No full screens" },
  { value: "comingUp", label: "Coming up", hint: "Teams, date, venue" },
  { value: "preMatch", label: "Toss & XIs", hint: "Toss, then lineups" },
  { value: "scorecard", label: "Scorecard", hint: "Current innings" },
  { value: "break", label: "Target", hint: "Innings break" },
  { value: "result", label: "Result", hint: "Winner, top players" },
  { value: "pointsTable", label: "Points table", hint: "League standings" },
];

const PANELS = [
  { value: "none", label: "Off" },
  { value: "partnership", label: "Partnership" },
  { value: "runrate", label: "Run rate" },
];

const EFFECT_LABELS = { FOUR: "FOUR", SIX: "SIX", WICKET: "WICKET" };

function readStored() {
  try {
    return localStorage.getItem(SELECTED_KEY) || "";
  } catch {
    return "";
  }
}

function writeStored(id) {
  try {
    localStorage.setItem(SELECTED_KEY, id);
  } catch {
    // Storage blocked: the operator picks the match again next time.
  }
}

function Choice({ active, onClick, disabled, label, hint }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`min-h-[64px] rounded-xl border px-3 py-2 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
        active ? "border-green bg-green text-white shadow-[0_10px_24px_rgba(11,107,58,0.25)]" : "border-ink/15 bg-white text-ink hover:border-green/60 hover:bg-green/5"
      }`}
    >
      <span className="block text-[0.95rem] font-extrabold">{label}</span>
      {hint ? <span className={`block text-xs font-semibold ${active ? "text-white/80" : "text-muted"}`}>{hint}</span> : null}
    </button>
  );
}

function Section({ title, children, note }) {
  return (
    <div className="rounded-xl border border-ink/10 bg-white p-4">
      <h3 className="text-sm font-black uppercase tracking-wide text-ink">{title}</h3>
      {note ? <p className="mt-0.5 text-xs text-muted">{note}</p> : null}
      <div className="mt-3">{children}</div>
    </div>
  );
}

export default function OverlayControlCard() {
  const [matches, setMatches] = useState([]);
  const [matchId, setMatchId] = useState("");
  const [state, setState] = useState(null);
  const [player, setPlayer] = useState("");
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  // Matches, newest first; open the remembered one, else a live one.
  useEffect(() => {
    let stopped = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/scoring/matches", { cache: "no-store" });
        const data = await safeJsonResponse(res);
        if (!res.ok) throw new Error(data.error || "Could not load matches.");
        if (stopped) return;
        const list = data.matches || [];
        setMatches(list);
        const stored = readStored();
        const pick = list.find((m) => m.id === stored) || list.find((m) => m.scoringStatus === "in_progress") || list[0];
        if (pick) setMatchId(pick.id);
      } catch (err) {
        if (!stopped) setMessage({ tone: "error", text: err.message });
      } finally {
        if (!stopped) setLoading(false);
      }
    })();
    return () => {
      stopped = true;
    };
  }, []);

  const load = useCallback(async (id) => {
    if (!id) return;
    try {
      const res = await fetch(`/api/admin/overlay?matchId=${id}`, { cache: "no-store" });
      const data = await safeJsonResponse(res);
      if (!res.ok) throw new Error(data.error || "Could not load the overlay state.");
      setState(data);
    } catch (err) {
      setMessage({ tone: "error", text: err.message });
    }
  }, []);

  // Refresh now and then so "last highlight" follows the scoring.
  useEffect(() => {
    if (!matchId) return undefined;
    setState(null);
    setPlayer("");
    load(matchId);
    const timer = setInterval(() => load(matchId), 10000);
    return () => clearInterval(timer);
  }, [matchId, load]);

  async function send(action, value, done) {
    setBusy(`${action}:${value ?? ""}`);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/overlay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, action, value }),
      });
      const data = await safeJsonResponse(res);
      if (!res.ok) throw new Error(data.error || "Could not update the overlay.");
      setState(data);
      if (done) setMessage({ tone: "success", text: done });
    } catch (err) {
      setMessage({ tone: "error", text: err.message });
    } finally {
      setBusy("");
    }
  }

  function chooseMatch(id) {
    setMatchId(id);
    writeStored(id);
  }

  const control = state?.control;
  const highlight = state?.lastHighlight;
  const players = (state?.squads || []).filter((s) => s.players.length);

  return (
    <div className="grid gap-5">
      <Panel
        title="Stream overlay"
        description="Control the graphics on the live stream. Changes reach every overlay of the match within about 2 seconds (plus any delay set in its link)."
        actions={
          <button
            type="button"
            onClick={() => load(matchId)}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-bold text-green-dark hover:bg-green/10"
          >
            <RefreshIcon className="h-4 w-4" /> Refresh
          </button>
        }
      >
        <label className="block text-sm font-bold text-ink">
          Match
          <select value={matchId} onChange={(e) => chooseMatch(e.target.value)} className={`${INPUT_CLASSES} mt-1`} disabled={loading || !matches.length}>
            {!matches.length ? <option value="">{loading ? "Loading..." : "No matches"}</option> : null}
            {matches.map((m) => (
              <option key={m.id} value={m.id}>
                {m.matchNumber ? `Match ${m.matchNumber}: ` : ""}
                {m.teamA} vs {m.teamB} · {formatMatchDate(m.date)}
                {m.scoringStatus === "in_progress" ? " · LIVE" : m.scoringStatus === "completed" ? " · finished" : ""}
              </option>
            ))}
          </select>
        </label>
        {message ? (
          <Notice tone={message.tone} className="mt-3">
            {message.text}
          </Notice>
        ) : null}
      </Panel>

      {matchId && state ? (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.15fr_1fr]">
          <div className="grid content-start gap-4">
            <Section title="Replay effect" note="Plays the last four, six or wicket again with a REPLAY tag.">
              <button
                type="button"
                onClick={() => send("replay", null, "Replay sent.")}
                disabled={!highlight || Boolean(busy)}
                className="flex min-h-[72px] w-full items-center justify-center gap-3 rounded-xl bg-brand-red px-4 text-lg font-black uppercase tracking-wide text-white shadow-[0_12px_28px_rgba(200,30,40,0.25)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Replay {highlight ? `${EFFECT_LABELS[highlight.type] || highlight.type} · ${highlight.overBall}` : ""}
              </button>
              <p className="mt-2 text-xs text-muted">
                {highlight ? `Last highlight: ${highlight.type.toLowerCase()} in over ${highlight.overBall}${highlight.player ? ` (${highlight.player})` : ""}.` : "Nothing to replay yet: no four, six or wicket in this match."}
              </p>
            </Section>

            <Section title="Screen" note="Automatic shows coming up, toss, innings break and result at the right times.">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {SCREENS.map((s) => (
                  <Choice
                    key={s.value}
                    label={s.label}
                    hint={s.hint}
                    active={control?.screen === s.value}
                    disabled={Boolean(busy)}
                    onClick={() => send("screen", s.value)}
                  />
                ))}
              </div>
            </Section>

            <Section title="Quick panel" note="A small panel above the score bar.">
              <div className="grid grid-cols-3 gap-2">
                {PANELS.map((p) => (
                  <Choice key={p.value} label={p.label} active={control?.panel === p.value} disabled={Boolean(busy)} onClick={() => send("panel", p.value)} />
                ))}
              </div>
            </Section>

            <Section title="Player card" note="Photo, role, today's figures and tournament numbers, for 8 seconds.">
              {players.length ? (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <select value={player} onChange={(e) => setPlayer(e.target.value)} className={INPUT_CLASSES}>
                    <option value="">Choose a player</option>
                    {players.map((side) => (
                      <optgroup key={side.team} label={side.team}>
                        {side.players.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                            {p.role ? ` (${p.role})` : ""}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={!player || Boolean(busy)}
                    onClick={() => send("card", player, "Player card sent.")}
                    className="min-h-[46px] shrink-0 rounded-lg bg-green px-5 text-sm font-extrabold text-white transition hover:bg-green-dark disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Show card
                  </button>
                </div>
              ) : (
                <p className="text-sm text-muted">Available once the playing XIs are set in Live Scoring.</p>
              )}
            </Section>

            <Section title="Sponsors">
              <div className="grid grid-cols-2 gap-2">
                <Choice label="Show sponsors" active={control?.sponsors !== false} disabled={Boolean(busy)} onClick={() => send("sponsors", true)} />
                <Choice label="Hide sponsors" active={control?.sponsors === false} disabled={Boolean(busy)} onClick={() => send("sponsors", false)} />
              </div>
            </Section>

            <button
              type="button"
              onClick={() => send("reset", null, "Back to automatic.")}
              disabled={Boolean(busy)}
              className="justify-self-start rounded-lg border border-ink/15 bg-white px-4 py-2 text-sm font-bold text-ink hover:bg-ink/5 disabled:opacity-50"
            >
              Reset everything to automatic
            </button>
          </div>

          <div className="grid content-start gap-4">
            <Section title="Preview" note="What the overlay shows now. The checkerboard stands for the camera picture (see-through).">
              <div
                className="relative aspect-video w-full overflow-hidden rounded-lg border border-ink/15"
                style={{
                  backgroundColor: "#fff",
                  backgroundImage:
                    "linear-gradient(45deg, #d9dde3 25%, transparent 25%), linear-gradient(-45deg, #d9dde3 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #d9dde3 75%), linear-gradient(-45deg, transparent 75%, #d9dde3 75%)",
                  backgroundSize: "24px 24px",
                  backgroundPosition: "0 0, 0 12px, 12px -12px, -12px 0",
                }}
              >
                <iframe key={matchId} src={`/overlay/${matchId}`} title="Overlay preview" className="absolute inset-0 h-full w-full border-0" style={{ background: "transparent" }} />
              </div>
            </Section>
            <OverlayLinkBox key={matchId} matchId={matchId} defaultOpen />
          </div>
          <div className="min-w-0 xl:col-span-2">
            <HighlightsLog
              key={matchId}
              matchId={matchId}
              streamStartedAt={state.streamStartedAt}
              busy={Boolean(busy)}
              onStreamStart={(value) => send("streamStart", value, value === null ? "Stream start cleared." : "Stream start saved.")}
            />
          </div>
        </div>
      ) : matchId ? (
        <p className="text-sm text-muted">Loading...</p>
      ) : null}
    </div>
  );
}
