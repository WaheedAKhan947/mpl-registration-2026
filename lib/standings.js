// Points table and net run rate from completed matches. Pure, like
// lib/scoring.js, so it can be unit tested without a database.

export const DEFAULT_POINTS = { win: 2, tie: 1, noResult: 1, loss: 0 };

// A finished match's outcome, worked out from its two innings so it never
// depends on a stored result field.
//   first / second: { battingTeam, runs, target? } (second may be missing)
//   abandoned: the match was finished with no result
// Returns { outcome: "win" | "tie" | "no_result", winner } or null if the
// innings are not there to decide it.
export function outcomeFromInnings({ first, second, abandoned = false }) {
  if (abandoned) return { outcome: "no_result", winner: null };
  if (!first || !second) return null;
  const target = second.target ?? (first.runs || 0) + 1;
  if ((second.runs || 0) >= target) return { outcome: "win", winner: second.battingTeam };
  if ((second.runs || 0) === target - 1) return { outcome: "tie", winner: null };
  return { outcome: "win", winner: first.battingTeam };
}

const BALLS_PER_OVER = 6;

function emptyRow(team) {
  return {
    team,
    played: 0,
    won: 0,
    lost: 0,
    tied: 0,
    noResult: 0,
    points: 0,
    netRunRate: 0,
    runsFor: 0,
    ballsFor: 0,
    runsAgainst: 0,
    ballsAgainst: 0,
  };
}

// Overs that count toward NRR. A side bowled out is charged its full quota,
// whatever it actually faced (standard NRR rule).
export function nrrBalls({ legalBalls = 0, allOut = false, quotaBalls = 0 }) {
  return allOut && quotaBalls ? quotaBalls : legalBalls;
}

export function netRunRate({ runsFor, ballsFor, runsAgainst, ballsAgainst }) {
  const forRate = ballsFor > 0 ? (runsFor * BALLS_PER_OVER) / ballsFor : 0;
  const againstRate = ballsAgainst > 0 ? (runsAgainst * BALLS_PER_OVER) / ballsAgainst : 0;
  return Math.round((forRate - againstRate) * 1000) / 1000;
}

// teams:   every team name that should appear, even with nothing played.
// matches: [{ teamA, teamB, outcome: "win" | "tie" | "no_result", winner,
//             innings: [{ battingTeam, runs, legalBalls, allOut, quotaBalls }] }]
//          -- the two regular innings only; super overs never count for NRR.
export function computeStandings(teams = [], matches = [], points = DEFAULT_POINTS) {
  const rows = new Map(teams.map((team) => [team, emptyRow(team)]));
  const row = (team) => {
    if (!rows.has(team)) rows.set(team, emptyRow(team));
    return rows.get(team);
  };

  for (const match of matches) {
    if (!match || !["win", "tie", "no_result"].includes(match.outcome)) continue;
    const a = row(match.teamA);
    const b = row(match.teamB);
    a.played += 1;
    b.played += 1;

    if (match.outcome === "no_result") {
      a.noResult += 1;
      b.noResult += 1;
      a.points += points.noResult;
      b.points += points.noResult;
      // An abandoned game's runs and overs are left out of NRR.
      continue;
    }

    if (match.outcome === "tie") {
      a.tied += 1;
      b.tied += 1;
      a.points += points.tie;
      b.points += points.tie;
    } else {
      const winner = match.winner === match.teamA ? a : b;
      const loser = winner === a ? b : a;
      winner.won += 1;
      winner.points += points.win;
      loser.lost += 1;
      loser.points += points.loss;
    }

    for (const inn of match.innings || []) {
      const batting = row(inn.battingTeam);
      const bowling = inn.battingTeam === match.teamA ? b : a;
      const balls = nrrBalls(inn);
      batting.runsFor += inn.runs || 0;
      batting.ballsFor += balls;
      bowling.runsAgainst += inn.runs || 0;
      bowling.ballsAgainst += balls;
    }
  }

  return [...rows.values()]
    .map((r) => ({ ...r, netRunRate: netRunRate(r) }))
    .sort(
      (x, y) =>
        y.points - x.points || y.netRunRate - x.netRunRate || y.won - x.won || x.team.localeCompare(y.team)
    );
}
