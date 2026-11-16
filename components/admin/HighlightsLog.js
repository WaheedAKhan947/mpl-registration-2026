"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { INPUT_CLASSES } from "@/components/admin/formStyles";
import { RefreshIcon } from "@/components/admin/icons";
import { LEAGUE_TIME_ZONE } from "@/lib/matches";
import { safeJsonResponse } from "@/lib/http";
import { DEFAULT_LEAD_SECONDS, HIGHLIGHT_LABELS, highlightsCsv, videoTime } from "@/lib/overlay/highlights";

// Highlights log for whoever edits the recorded stream: every four, six,
// wicket, fifty, hundred and hat-trick with the clock time it was scored and,
// once the stream start is set, where it is in the recording.

const FILTERS = [
  { value: "all", label: "All" },
  { value: "WICKET", label: "Wickets" },
  { value: "SIX", label: "Sixes" },
  { value: "FOUR", label: "Fours" },
  { value: "MILESTONE", label: "Milestones" },
];

const TYPE_STYLES = {
  WICKET: "bg-brand-red text-white",
  SIX: "bg-[#6d28d9] text-white",
  FOUR: "bg-gold text-navy-dark",
  FIFTY: "bg-green text-white",
  HUNDRED: "bg-green text-white",
  HATTRICK: "bg-brand-red text-white",
};

function clockTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-GB", { timeZone: LEAGUE_TIME_ZONE, hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

// "HH:MM:SS" typed in league time (Pakistan, no daylight saving) -> ISO, today.
function leagueTimeToIso(value) {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: LEAGUE_TIME_ZONE }).format(new Date());
  const time = value.length === 5 ? `${value}:00` : value;
  return new Date(`${today}T${time}+05:00`).toISOString();
}

export default function HighlightsLog({ matchId, streamStartedAt, onStreamStart, busy }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [lead, setLead] = useState(String(DEFAULT_LEAD_SECONDS));
  const [startInput, setStartInput] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/overlay/highlights?matchId=${matchId}`, { cache: "no-store" });
      const data = await safeJsonResponse(res);
      if (!res.ok) throw new Error(data.error || "Could not load the highlights.");
      setRows(data.highlights || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, [load]);

  const leadSeconds = Math.max(0, Math.min(60, Number(lead) || 0));
  const shown = useMemo(
    () =>
      rows.filter((r) =>
        filter === "all" ? true : filter === "MILESTONE" ? ["FIFTY", "HUNDRED", "HATTRICK"].includes(r.type) : r.type === filter
      ),
    [rows, filter]
  );

  function download() {
    const csv = highlightsCsv(shown, { streamStartedAt, leadSeconds, formatTime: clockTime });
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `mpl-highlights-${matchId}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className="rounded-xl border border-ink/10 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-black uppercase tracking-wide text-ink">Highlights log</h3>
          <p className="mt-0.5 text-xs text-muted">
            Every four, six, wicket and milestone with the time it was scored, to find them in the stream recording.
          </p>
        </div>
        <button type="button" onClick={load} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-bold text-green-dark hover:bg-green/10">
          <RefreshIcon className="h-4 w-4" /> Refresh
        </button>
      </div>

      <div className="mt-3 grid gap-3 rounded-lg bg-[#fafbfa] p-3 text-sm sm:grid-cols-[1fr_auto]">
        <div>
          <div className="font-bold text-ink">
            Stream started: {streamStartedAt ? <span className="font-mono">{clockTime(streamStartedAt)}</span> : <span className="text-muted">not set</span>}
          </div>
          <p className="text-xs text-muted">Press &quot;Started now&quot; when you go live (or type the time) so each moment gets its place in the recording.</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => onStreamStart("now")}
              className="rounded-lg bg-green px-3 py-2 text-sm font-extrabold text-white hover:bg-green-dark disabled:opacity-50"
            >
              Started now
            </button>
            <input
              type="time"
              step="1"
              value={startInput}
              onChange={(e) => setStartInput(e.target.value)}
              aria-label="Stream start time"
              className={`${INPUT_CLASSES} w-36 py-1.5`}
            />
            <button
              type="button"
              disabled={busy || !startInput}
              onClick={() => onStreamStart(leagueTimeToIso(startInput))}
              className="rounded-lg border border-ink/15 px-3 py-2 text-sm font-bold text-ink hover:bg-ink/5 disabled:opacity-50"
            >
              Set time
            </button>
            {streamStartedAt ? (
              <button type="button" disabled={busy} onClick={() => onStreamStart(null)} className="rounded-lg px-2 py-2 text-sm font-bold text-brand-red hover:bg-brand-red/10 disabled:opacity-50">
                Clear
              </button>
            ) : null}
          </div>
        </div>
        <label className="text-sm font-bold text-ink">
          Clip lead
          <span className="mt-1 flex items-center gap-2">
            <input type="number" min="0" max="60" value={lead} onChange={(e) => setLead(e.target.value)} className={`${INPUT_CLASSES} w-20 py-1.5`} />
            <span className="text-xs font-semibold text-muted">sec before the tap</span>
          </span>
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            aria-pressed={filter === f.value}
            className={`rounded-full px-3 py-1 text-xs font-extrabold ${filter === f.value ? "bg-ink text-white" : "bg-ink/[0.06] text-ink hover:bg-ink/10"}`}
          >
            {f.label}
          </button>
        ))}
        <button
          type="button"
          onClick={download}
          disabled={!shown.length}
          className="ml-auto rounded-lg border border-ink/15 px-3 py-1.5 text-sm font-bold text-green-dark hover:bg-green/5 disabled:opacity-50"
        >
          Download CSV
        </button>
      </div>

      {error ? <p className="mt-3 text-sm font-semibold text-brand-red">{error}</p> : null}
      {!error && !shown.length ? (
        <p className="mt-3 text-sm text-muted">{loading ? "Loading..." : "No highlights yet."}</p>
      ) : null}
      {shown.length ? (
        <div className="mt-3 max-h-[420px] overflow-auto rounded-lg border border-ink/10">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-[#f3f5f2] text-xs font-black uppercase tracking-wide text-muted">
              <tr>
                <th className="px-3 py-2">Video</th>
                <th className="px-3 py-2">Clock</th>
                <th className="px-3 py-2">Over</th>
                <th className="px-3 py-2">Event</th>
                <th className="px-3 py-2">Details</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.id} className="border-t border-ink/10 align-top" data-highlight={r.type}>
                  <td className="whitespace-nowrap px-3 py-2 font-mono font-bold text-ink">{videoTime(r.at, streamStartedAt, leadSeconds) || "–"}</td>
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-muted">{clockTime(r.at)}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-muted">
                    {r.innings}: {r.overBall}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-[0.7rem] font-black uppercase ${TYPE_STYLES[r.type] || "bg-ink/10"}`}>
                      {HIGHLIGHT_LABELS[r.type] || r.type}
                    </span>
                  </td>
                  <td className="min-w-[220px] px-3 py-2 text-ink">{r.text}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
