// Highlights log (Admin > Stream Overlay): every four, six, wicket, fifty,
// hundred and hat-trick of a match with the time it was scored, so whoever
// edits the recorded stream can find each moment. Pure, no imports, so it is
// unit tested directly.

export const HIGHLIGHT_TYPES = ["WICKET", "SIX", "FOUR", "FIFTY", "HUNDRED", "HATTRICK"];

// Scorers tap a ball a few seconds after it happens; clips start this many
// seconds before the tap by default.
export const DEFAULT_LEAD_SECONDS = 10;

export const HIGHLIGHT_LABELS = {
  WICKET: "Wicket",
  SIX: "Six",
  FOUR: "Four",
  FIFTY: "Fifty",
  HUNDRED: "Hundred",
  HATTRICK: "Hat-trick",
};

// One line describing the moment.
export function highlightText(event) {
  const batter = event.batter?.name || "";
  const bowler = event.bowler?.name || "";
  const score = event.batter ? `${event.batter.runs} (${event.batter.balls})` : "";
  if (event.type === "WICKET") return [batter, event.wicket?.text, score].filter(Boolean).join(" · ");
  if (event.type === "FOUR" || event.type === "SIX") {
    return [batter, bowler ? `off ${bowler}` : "", event.milestone ? `brings up ${event.milestone === "HUNDRED" ? "100" : "50"}` : ""].filter(Boolean).join(" · ");
  }
  if (event.type === "FIFTY" || event.type === "HUNDRED") return [batter, score].filter(Boolean).join(" · ");
  if (event.type === "HATTRICK") return [bowler, event.bowler?.figures].filter(Boolean).join(" · ");
  return batter || bowler;
}

// Overlay events (oldest first) -> log rows.
export function toHighlightRows(events = []) {
  return events
    .filter((e) => HIGHLIGHT_TYPES.includes(e.type))
    .map((e) => ({
      id: e.id,
      type: e.type,
      innings: e.innings,
      overBall: e.overBall,
      team: e.team || "",
      score: e.score || "",
      text: highlightText(e),
      at: e.at || null,
    }));
}

function pad(n) {
  return String(n).padStart(2, "0");
}

// "H:MM:SS" of a moment in the stream recording: its time minus the stream
// start, minus the lead. Null without a start time, or for moments before it.
export function videoTime(at, streamStartedAt, leadSeconds = DEFAULT_LEAD_SECONDS) {
  if (!at || !streamStartedAt) return null;
  const since = Date.parse(at) - Date.parse(streamStartedAt);
  if (!Number.isFinite(since) || since < 0) return null;
  const total = Math.max(0, Math.floor((since - leadSeconds * 1000) / 1000));
  return `${Math.floor(total / 3600)}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

// CSV for the editor. `formatTime` turns an ISO time into a wall-clock string.
export function highlightsCsv(rows, { streamStartedAt = null, leadSeconds = DEFAULT_LEAD_SECONDS, formatTime = (iso) => iso || "" } = {}) {
  const header = ["Video time", "Clock time", "Innings", "Over", "Event", "Details", "Score"];
  const lines = rows.map((r) =>
    [videoTime(r.at, streamStartedAt, leadSeconds) || "", formatTime(r.at), r.innings, r.overBall, HIGHLIGHT_LABELS[r.type] || r.type, r.text, r.score]
      .map(csvCell)
      .join(",")
  );
  return [header.join(","), ...lines].join("\n");
}
