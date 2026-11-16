// Career totals and leaderboards from PlayerMatchStats rows. Pure, so it is
// unit tested without a database; rows are what lib/scoring.js
// buildPlayerMatchStats produced for each finished match.

const BALLS_PER_OVER = 6;

// Leaderboard qualifiers, sized for short-format local cricket.
export const QUALIFIERS = {
  strikeRateMinBalls: 20,
  averageMinInnings: 2,
  economyMinBalls: 12,
};

function round(value, places = 2) {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

function formatOvers(balls) {
  return `${Math.floor(balls / BALLS_PER_OVER)}.${balls % BALLS_PER_OVER}`;
}

// Did the player come out to bat in this match?
function batted(row) {
  return Boolean(row.batting?.didBat);
}

function bowled(row) {
  const b = row.bowling || {};
  return (b.legalBalls || 0) > 0 || (b.runs || 0) > 0 || (b.wickets || 0) > 0;
}

// Better bowling figures: more wickets, then fewer runs.
function betterFigures(a, b) {
  if (!b) return true;
  return a.wickets > b.wickets || (a.wickets === b.wickets && a.runs < b.runs);
}

// Better innings: more runs, then not out over out.
function betterInnings(a, b) {
  if (!b) return true;
  return a.runs > b.runs || (a.runs === b.runs && !a.out && b.out);
}

export function aggregateCareer(rows = []) {
  const bat = { innings: 0, runs: 0, balls: 0, notOuts: 0, fours: 0, sixes: 0, thirties: 0, fifties: 0, hundreds: 0, ducks: 0, highest: null };
  const bowl = { innings: 0, balls: 0, runs: 0, wickets: 0, maidens: 0, dots: 0, wides: 0, noballs: 0, threeWickets: 0, fiveWickets: 0, best: null };
  const field = { catches: 0, runOuts: 0, stumpings: 0 };

  for (const row of rows) {
    if (batted(row)) {
      const b = row.batting;
      bat.innings += 1;
      bat.runs += b.runs || 0;
      bat.balls += b.balls || 0;
      bat.fours += b.fours || 0;
      bat.sixes += b.sixes || 0;
      if (!b.out) bat.notOuts += 1;
      if (b.runs >= 100) bat.hundreds += 1;
      else if (b.runs >= 50) bat.fifties += 1;
      else if (b.runs >= 30) bat.thirties += 1;
      if (b.out && b.runs === 0) bat.ducks += 1;
      const innings = { runs: b.runs || 0, balls: b.balls || 0, out: Boolean(b.out), match: row.match ? String(row.match) : null };
      if (betterInnings(innings, bat.highest)) bat.highest = innings;
    }
    if (bowled(row)) {
      const b = row.bowling;
      bowl.innings += 1;
      bowl.balls += b.legalBalls || 0;
      bowl.runs += b.runs || 0;
      bowl.wickets += b.wickets || 0;
      bowl.maidens += b.maidens || 0;
      bowl.dots += b.dots || 0;
      bowl.wides += b.wides || 0;
      bowl.noballs += b.noballs || 0;
      if (b.wickets >= 5) bowl.fiveWickets += 1;
      else if (b.wickets >= 3) bowl.threeWickets += 1;
      const figures = { wickets: b.wickets || 0, runs: b.runs || 0, balls: b.legalBalls || 0, match: row.match ? String(row.match) : null };
      if (betterFigures(figures, bowl.best)) bowl.best = figures;
    }
    field.catches += row.fielding?.catches || 0;
    field.runOuts += row.fielding?.runOuts || 0;
    field.stumpings += row.fielding?.stumpings || 0;
  }

  const outs = bat.innings - bat.notOuts;
  return {
    matches: rows.length,
    batting: {
      ...bat,
      average: outs > 0 ? round(bat.runs / outs) : null,
      strikeRate: bat.balls > 0 ? round((bat.runs * 100) / bat.balls) : 0,
      highestText: bat.highest ? `${bat.highest.runs}${bat.highest.out ? "" : "*"}` : "",
    },
    bowling: {
      ...bowl,
      overs: formatOvers(bowl.balls),
      average: bowl.wickets > 0 ? round(bowl.runs / bowl.wickets) : null,
      economy: bowl.balls > 0 ? round((bowl.runs * BALLS_PER_OVER) / bowl.balls) : null,
      strikeRate: bowl.wickets > 0 ? round(bowl.balls / bowl.wickets, 1) : null,
      bestText: bowl.best ? `${bowl.best.wickets}-${bowl.best.runs}` : "",
    },
    fielding: { ...field, dismissals: field.catches + field.runOuts + field.stumpings },
  };
}

// Groups rows by player and aggregates each.
export function careersByPlayer(rows = []) {
  const groups = new Map();
  for (const row of rows) {
    const id = String(row.player);
    if (!groups.has(id)) groups.set(id, []);
    groups.get(id).push(row);
  }
  return [...groups.entries()].map(([player, playerRows]) => ({
    player,
    team: playerRows[playerRows.length - 1]?.team || "",
    career: aggregateCareer(playerRows),
  }));
}

function top(list, limit) {
  return list.slice(0, limit);
}

// Leaderboards. `careers` from careersByPlayer; `rows` are the raw per-match
// rows (for best single innings and figures). Each entry carries `value`
// (what the list ranks by) and `detail` (supporting numbers).
export function buildLeaders(careers = [], rows = [], { limit = 10, qualifiers = QUALIFIERS } = {}) {
  const bat = careers.filter((c) => c.career.batting.innings > 0);
  const bowl = careers.filter((c) => c.career.bowling.innings > 0);
  const entry = (c, value, detail) => ({ player: c.player, team: c.team, value, detail });

  const mostRuns = [...bat]
    .sort(
      (a, b) =>
        b.career.batting.runs - a.career.batting.runs ||
        b.career.batting.strikeRate - a.career.batting.strikeRate ||
        a.career.batting.balls - b.career.batting.balls
    )
    .filter((c) => c.career.batting.runs > 0)
    .map((c) =>
      entry(c, c.career.batting.runs, {
        innings: c.career.batting.innings,
        balls: c.career.batting.balls,
        strikeRate: c.career.batting.strikeRate,
        average: c.career.batting.average,
        highest: c.career.batting.highestText,
      })
    );

  const highestScores = rows
    .filter((r) => r.batting?.didBat && r.batting.runs > 0)
    .sort((a, b) => b.batting.runs - a.batting.runs || Number(a.batting.out) - Number(b.batting.out) || a.batting.balls - b.batting.balls)
    .map((r) => ({
      player: String(r.player),
      team: r.team || "",
      match: String(r.match),
      value: `${r.batting.runs}${r.batting.out ? "" : "*"}`,
      detail: { balls: r.batting.balls, fours: r.batting.fours, sixes: r.batting.sixes },
    }));

  const bestStrikeRate = bat
    .filter((c) => c.career.batting.balls >= qualifiers.strikeRateMinBalls)
    .sort((a, b) => b.career.batting.strikeRate - a.career.batting.strikeRate || b.career.batting.runs - a.career.batting.runs)
    .map((c) => entry(c, c.career.batting.strikeRate, { runs: c.career.batting.runs, balls: c.career.batting.balls }));

  const bestAverage = bat
    .filter((c) => c.career.batting.innings >= qualifiers.averageMinInnings && c.career.batting.average !== null)
    .sort((a, b) => b.career.batting.average - a.career.batting.average || b.career.batting.runs - a.career.batting.runs)
    .map((c) => entry(c, c.career.batting.average, { runs: c.career.batting.runs, innings: c.career.batting.innings }));

  const by = (key) =>
    bat
      .filter((c) => c.career.batting[key] > 0)
      .sort((a, b) => b.career.batting[key] - a.career.batting[key] || b.career.batting.runs - a.career.batting.runs)
      .map((c) => entry(c, c.career.batting[key], { innings: c.career.batting.innings }));

  const mostWickets = [...bowl]
    .filter((c) => c.career.bowling.wickets > 0)
    .sort(
      (a, b) =>
        b.career.bowling.wickets - a.career.bowling.wickets ||
        (a.career.bowling.economy ?? 99) - (b.career.bowling.economy ?? 99) ||
        a.career.bowling.runs - b.career.bowling.runs
    )
    .map((c) =>
      entry(c, c.career.bowling.wickets, {
        overs: c.career.bowling.overs,
        runs: c.career.bowling.runs,
        economy: c.career.bowling.economy,
        best: c.career.bowling.bestText,
      })
    );

  const bestFigures = rows
    .filter((r) => (r.bowling?.wickets || 0) > 0)
    .sort((a, b) => b.bowling.wickets - a.bowling.wickets || a.bowling.runs - b.bowling.runs || a.bowling.legalBalls - b.bowling.legalBalls)
    .map((r) => ({
      player: String(r.player),
      team: r.team || "",
      match: String(r.match),
      value: `${r.bowling.wickets}-${r.bowling.runs}`,
      detail: { overs: r.bowling.overs },
    }));

  const bestEconomy = bowl
    .filter((c) => c.career.bowling.balls >= qualifiers.economyMinBalls)
    .sort((a, b) => a.career.bowling.economy - b.career.bowling.economy || b.career.bowling.wickets - a.career.bowling.wickets)
    .map((c) => entry(c, c.career.bowling.economy, { overs: c.career.bowling.overs, runs: c.career.bowling.runs }));

  const mostDots = bowl
    .filter((c) => c.career.bowling.dots > 0)
    .sort((a, b) => b.career.bowling.dots - a.career.bowling.dots)
    .map((c) => entry(c, c.career.bowling.dots, { overs: c.career.bowling.overs }));

  const mostCatches = careers
    .filter((c) => c.career.fielding.catches > 0)
    .sort((a, b) => b.career.fielding.catches - a.career.fielding.catches || b.career.fielding.dismissals - a.career.fielding.dismissals)
    .map((c) => entry(c, c.career.fielding.catches, { runOuts: c.career.fielding.runOuts, stumpings: c.career.fielding.stumpings }));

  const mostDismissals = careers
    .filter((c) => c.career.fielding.dismissals > 0)
    .sort((a, b) => b.career.fielding.dismissals - a.career.fielding.dismissals)
    .map((c) => entry(c, c.career.fielding.dismissals, { ...c.career.fielding }));

  return {
    orangeCap: mostRuns[0] || null,
    purpleCap: mostWickets[0] || null,
    batting: {
      mostRuns: top(mostRuns, limit),
      highestScores: top(highestScores, limit),
      bestStrikeRate: top(bestStrikeRate, limit),
      bestAverage: top(bestAverage, limit),
      mostSixes: top(by("sixes"), limit),
      mostFours: top(by("fours"), limit),
    },
    bowling: {
      mostWickets: top(mostWickets, limit),
      bestFigures: top(bestFigures, limit),
      bestEconomy: top(bestEconomy, limit),
      mostDots: top(mostDots, limit),
    },
    fielding: {
      mostCatches: top(mostCatches, limit),
      mostDismissals: top(mostDismissals, limit),
    },
    qualifiers,
  };
}
