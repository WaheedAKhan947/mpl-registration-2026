// Broadcast wording shared by the score bar and the full-screen screens.

import { teamStyle } from "@/lib/overlay/teams";

// "STRIKERS WON BY 3 WICKETS", "MATCH TIED", "NO RESULT".
export function resultText(situation, match) {
  if (!situation) return (match?.result || "").toUpperCase();
  if (situation.outcome === "tie") return "MATCH TIED";
  if (situation.outcome === "no_result") return "NO RESULT";
  if (situation.outcome === "win" && situation.winner) {
    const unit = situation.marginType === "runs" ? (situation.margin === 1 ? "RUN" : "RUNS") : situation.margin === 1 ? "WICKET" : "WICKETS";
    return `${teamStyle(situation.winner).label} WON BY ${situation.margin} ${unit}`;
  }
  return (situation.text || match?.result || "").toUpperCase();
}

// "KINGS won the toss and chose to bat", or "" before the toss.
export function tossText(toss) {
  if (!toss?.winner || !toss?.decision) return "";
  return `${teamStyle(toss.winner).label} won the toss and chose to ${toss.decision === "bowl" ? "bowl" : "bat"}`;
}

export function scoreText(runs, wickets) {
  return wickets >= 10 ? String(runs) : `${runs}/${wickets}`;
}
