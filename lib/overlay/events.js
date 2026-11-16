// Turns the latest balls of an innings into broadcast-overlay events: FOUR,
// SIX, WICKET, FIFTY / HUNDRED, FREE_HIT, OVER / MAIDEN and HATTRICK. Pure,
// so it is unit tested; lib/publicMatch.js feeds it from the database.
//
// Each event id is derived from the ball (innings-seq plus a suffix), so an
// event is the same object on every poll and animates exactly once.

import { BOWLER_WICKETS, dismissalText } from "../scoring.js";

const BALLS_PER_OVER = 6;

function figures(bowler) {
  return bowler ? `${bowler.overs}-${bowler.maidens}-${bowler.runs}-${bowler.wickets}` : "";
}

function batterInfo(state, id, nameOf, photoOf) {
  const b = state.batters.find((x) => x.id === id) || { runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: 0 };
  return {
    id,
    name: nameOf(id),
    runs: b.runs,
    balls: b.balls,
    fours: b.fours,
    sixes: b.sixes,
    strikeRate: b.strikeRate,
    photo: id ? photoOf(id) : null,
  };
}

// Three wickets credited to the same bowler on his last three legal
// deliveries (wides and no-balls in between do not break it).
export function isHatTrick(balls, index) {
  const ball = balls[index];
  if (!ball?.legal || !ball.wicket || !BOWLER_WICKETS.has(ball.wicket.type)) return false;
  const his = balls.slice(0, index + 1).filter((b) => b.bowler === ball.bowler && b.legal);
  if (his.length < 3) return false;
  return his.slice(-3).every((b) => b.wicket && BOWLER_WICKETS.has(b.wicket.type));
}

// balls:       the innings' annotated balls (replayInnings(...).balls)
// replayUpTo:  (count) => replay state after the first `count` balls
// number, battingTeam, bowlingTeam: innings facts
// nameOf(id), photoOf(id), timeOf(seq): lookups
// limit:       how many recent balls to look at
// crease / creaseAt / roleOf (optional): who is at the crease now, when that
// was last updated, and player roles. Used for the NEW_BATTER card: a batter
// who walked in after a wicket and has not faced a ball yet. Openers and
// batters returning from retired hurt do not count.
export function newBatterEvents({ balls, replayUpTo, number, battingTeam, crease = [], creaseAt = null, nameOf, photoOf, roleOf = () => "" }) {
  const state = replayUpTo(balls.length);
  if (!state.wickets) return [];
  const events = [];
  for (const id of crease.filter(Boolean).map(String)) {
    const batter = state.batters.find((b) => b.id === id);
    if (batter && (batter.balls > 0 || batter.out || batter.order <= 2)) continue;
    const returning = balls.some((b) => b.wicket?.type === "retired_hurt" && b.wicket.playerOut === id);
    if (returning) continue;
    events.push({
      id: `${number}-in-${id}`,
      type: "NEW_BATTER",
      at: creaseAt,
      innings: number,
      team: battingTeam,
      score: `${state.runs}/${state.wickets}`,
      batter: { id, name: nameOf(id), role: roleOf(id), photo: photoOf(id) },
    });
  }
  return events;
}

export function overlayEvents({ balls, replayUpTo, number, battingTeam, bowlingTeam, nameOf, photoOf, timeOf, limit = 3 }) {
  const events = [];
  for (let i = Math.max(0, balls.length - limit); i < balls.length; i += 1) {
    const ball = balls[i];
    const after = replayUpTo(i + 1);
    const id = `${number}-${ball.seq}`;
    const base = {
      at: timeOf(ball.seq),
      innings: number,
      overBall: `${ball.over}.${ball.ballInOver}`,
      team: battingTeam,
      score: `${ball.scoreAfter.runs}/${ball.scoreAfter.wickets}`,
    };
    const bowlerAfter = after.bowlers.find((b) => b.id === ball.bowler);
    const bowler = ball.bowler ? { id: ball.bowler, name: nameOf(ball.bowler), figures: figures(bowlerAfter), photo: photoOf(ball.bowler) } : null;

    // Main moment: wicket, six or four.
    const isWicket = ball.wicket && ball.wicket.type !== "retired_hurt";
    const main = isWicket ? "WICKET" : ball.boundary === 6 ? "SIX" : ball.boundary === 4 ? "FOUR" : null;
    let milestone = null;
    if (main) {
      const batterId = isWicket ? ball.wicket.playerOut : ball.striker;
      const batter = batterInfo(after, batterId, nameOf, photoOf);
      const before = batter.runs - (isWicket ? 0 : ball.runsOffBat);
      milestone = !isWicket && batter.runs >= 100 && before < 100 ? "HUNDRED" : !isWicket && batter.runs >= 50 && before < 50 ? "FIFTY" : null;
      const dismissal = isWicket ? after.batters.find((x) => x.id === batterId)?.dismissal : null;
      events.push({
        ...base,
        id,
        type: main,
        milestone,
        batter,
        bowler,
        wicket: isWicket ? { type: ball.wicket.type, text: dismissalText(dismissal, nameOf) } : null,
      });
    }

    // Fifty / hundred reached (also off a boundary, after its effect).
    if (!isWicket && ball.striker && ball.runsOffBat > 0) {
      const batter = batterInfo(after, ball.striker, nameOf, photoOf);
      const before = batter.runs - ball.runsOffBat;
      const reached = batter.runs >= 100 && before < 100 ? "HUNDRED" : batter.runs >= 50 && before < 50 ? "FIFTY" : null;
      if (reached) events.push({ ...base, id: `${id}-ms`, type: reached, batter, bowler });
    }

    if (isHatTrick(balls, i)) {
      events.push({ ...base, id: `${id}-hat`, type: "HATTRICK", team: bowlingTeam, bowler });
    }

    // A no-ball means the next ball is a free hit.
    if (ball.extrasType === "noball" && !after.complete) {
      events.push({ ...base, id: `${id}-fh`, type: "FREE_HIT", batter: after.striker ? batterInfo(after, after.striker, nameOf, photoOf) : null, bowler });
    }

    // End of an over (not the last ball of the innings: that gets its own screen).
    if (ball.legal && after.legalBalls % BALLS_PER_OVER === 0 && after.legalBalls > 0 && !after.complete) {
      const before = replayUpTo(i);
      const maidensBefore = before.bowlers.find((b) => b.id === ball.bowler)?.maidens || 0;
      const summary = after.overSummaries[ball.over] || { runs: 0, wickets: 0, balls: [] };
      events.push({
        ...base,
        id: `${id}-over`,
        type: (bowlerAfter?.maidens || 0) > maidensBefore ? "MAIDEN" : "OVER",
        over: ball.over + 1,
        runs: summary.runs,
        wickets: summary.wickets,
        balls: summary.balls,
        runRate: after.runRate,
        bowler,
      });
    }
  }
  return events;
}
