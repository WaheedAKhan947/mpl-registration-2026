// Points table = automatic standings from ball-by-ball scored matches, with
// manually entered rows as overrides.
//
// Manual rows are how the table worked before live scoring. A manual row
// with at least one match played stays in charge for its team, so a season
// that mixes hand-scored and live-scored matches keeps working. A manual row
// with nothing played is just a placeholder: it shows until the first scored
// match is finished, then steps aside.

import Match from "@/models/Match";
import Innings from "@/models/Innings";
import PointsTableRow from "@/models/PointsTableRow";
import { computeStandings, outcomeFromInnings } from "@/lib/standings";
import { ROSTER_TEAMS } from "@/lib/siteData";

const STAT_KEYS = ["played", "won", "lost", "tied", "noResult", "points", "netRunRate"];

function pickStats(row) {
  return Object.fromEntries(STAT_KEYS.map((key) => [key, row[key] ?? 0]));
}

function byStanding(a, b) {
  return b.points - a.points || b.netRunRate - a.netRunRate || b.won - a.won || a.team.localeCompare(b.team);
}

// Standings computed from finished, ball-by-ball scored matches only. The
// winner is worked out from the innings themselves (not a stored result
// field), so every finished match counts the moment it is finished.
export async function autoStandings() {
  const matches = await Match.find({ scoringStatus: "completed" }).select("teamA teamB overs status resultInfo").lean();
  if (!matches.length) return { rows: [], matchCount: 0 };

  const innings = await Innings.find({ match: { $in: matches.map((m) => m._id) }, number: { $lte: 2 } })
    .select("match number battingTeam runs legalBalls endReason maxOvers target")
    .lean();

  const entries = [];
  for (const m of matches) {
    const own = innings.filter((i) => String(i.match) === String(m._id));
    const decided = outcomeFromInnings({
      first: own.find((i) => i.number === 1),
      second: own.find((i) => i.number === 2),
      abandoned: m.status === "abandoned" || m.resultInfo?.outcome === "no_result",
    });
    if (!decided) continue;
    entries.push({
      teamA: m.teamA,
      teamB: m.teamB,
      outcome: decided.outcome,
      winner: decided.winner,
      innings: own.map((i) => ({
        battingTeam: i.battingTeam,
        runs: i.runs,
        legalBalls: i.legalBalls,
        allOut: i.endReason === "all_out",
        quotaBalls: (i.maxOvers || m.overs || 0) * 6,
      })),
    });
  }
  if (!entries.length) return { rows: [], matchCount: 0 };

  return { rows: computeStandings(ROSTER_TEAMS, entries), matchCount: entries.length };
}

// The table shown on the site. Each row says where it came from.
export async function pointsTable() {
  const [manualRows, auto] = await Promise.all([PointsTableRow.find().lean(), autoStandings()]);
  const overridden = new Set(manualRows.filter((r) => (r.played || 0) > 0).map((r) => r.team));
  // Placeholders disappear as soon as there are automatic standings, even if
  // their team name is spelled differently from the league's team list.
  const shownManual = auto.rows.length ? manualRows.filter((r) => overridden.has(r.team)) : manualRows;

  const rows = [
    ...auto.rows
      .filter((row) => !overridden.has(row.team))
      .map((row) => ({ id: `auto-${row.team}`, team: row.team, source: "auto", ...pickStats(row) })),
    ...shownManual.map((row) => ({ id: String(row._id), team: row.team, source: "manual", ...pickStats(row) })),
  ].sort(byStanding);

  return {
    rows,
    auto: auto.rows.map((row) => ({ ...row, overridden: overridden.has(row.team) })),
    autoMatchCount: auto.matchCount,
  };
}
