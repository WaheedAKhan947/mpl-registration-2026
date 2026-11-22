// Chooses the overlay's full-screen screen from the match state. No imports,
// so it is unit tested directly.

// Which full-screen screen the match state calls for, or null for none.
//   "comingUp"  before the toss
//   "preMatch"  toss done, first ball not bowled yet (toss + lineups rotate)
//   "break"     between innings
//   "result"    finished
export function autoScreen(data) {
  const match = data?.match;
  if (!match) return null;
  if (match.scoringStatus === "completed" || (!match.scored && (match.status === "completed" || match.status === "abandoned"))) {
    return "result";
  }
  if (!match.scored || match.scoringStatus === "not_started") return "comingUp";
  const situation = data.situation;
  if (situation?.type === "break") return "break";
  const innings = data.innings || [];
  const noBallsYet = innings.length === 1 && innings[0].runs === 0 && innings[0].overs === "0.0" && !(data.now?.recentBalls || []).length;
  if (noBallsYet) return "preMatch";
  return null;
}

// Whether `screen` has what it needs to draw. A screen the operator forces
// before its data exists (an innings break before the first innings) is
// skipped, so the score bar stays up instead of an empty frame.
export function canShowScreen(screen, data) {
  if (!screen || !data?.match) return false;
  // The target only exists once the first innings is over.
  if (screen === "break") {
    return (data.performers || []).some((p) => p.number === 1) && (data.innings || []).some((i) => i.number === 1 && i.complete);
  }
  if (screen === "preMatch") return (data.squads || []).some((s) => (s.players || []).length > 0);
  if (screen === "scorecard") return Boolean(data.scorecard);
  if (screen === "pointsTable") return Boolean(data.pointsTable?.length);
  return ["comingUp", "result"].includes(screen);
}
