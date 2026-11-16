import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { aggregateCareer, buildLeaders, careersByPlayer } from "../lib/playerStats.js";

const row = (player, match, { bat, bowl, field, team = "T" } = {}) => ({
  player,
  match,
  team,
  batting: bat ? { didBat: true, fours: 0, sixes: 0, out: true, ...bat } : { didBat: false, runs: 0, balls: 0, out: false },
  bowling: { legalBalls: 0, runs: 0, wickets: 0, maidens: 0, dots: 0, wides: 0, noballs: 0, ...bowl },
  fielding: { catches: 0, runOuts: 0, stumpings: 0, ...field },
});

describe("career", () => {
  test("batting totals, average over dismissals, highest with not-out star", () => {
    const c = aggregateCareer([
      row("p", "m1", { bat: { runs: 45, balls: 30, fours: 5, sixes: 1, out: false } }),
      row("p", "m2", { bat: { runs: 0, balls: 2, out: true } }),
      row("p", "m3", { bat: { runs: 52, balls: 40, out: true } }),
      row("p", "m4"),
    ]);
    assert.equal(c.matches, 4);
    assert.equal(c.batting.innings, 3);
    assert.equal(c.batting.runs, 97);
    assert.equal(c.batting.notOuts, 1);
    assert.equal(c.batting.average, 48.5);
    assert.equal(c.batting.strikeRate, 134.72);
    assert.equal(c.batting.highestText, "52");
    assert.deepEqual([c.batting.thirties, c.batting.fifties, c.batting.ducks], [1, 1, 1]);
  });

  test("never dismissed: no average; a not-out wins a tie for highest", () => {
    const c = aggregateCareer([
      row("p", "m1", { bat: { runs: 30, balls: 20, out: true } }),
      row("p", "m2", { bat: { runs: 30, balls: 25, out: false } }),
    ]);
    assert.equal(c.batting.highestText, "30*");
    const unbeaten = aggregateCareer([row("p", "m1", { bat: { runs: 12, balls: 9, out: false } })]);
    assert.equal(unbeaten.batting.average, null);
  });

  test("bowling totals and best figures", () => {
    const c = aggregateCareer([
      row("p", "m1", { bowl: { legalBalls: 24, runs: 30, wickets: 3, maidens: 1, dots: 10 } }),
      row("p", "m2", { bowl: { legalBalls: 18, runs: 12, wickets: 3, dots: 9 } }),
      row("p", "m3", { bowl: { legalBalls: 6, runs: 20, wickets: 0 } }),
    ]);
    assert.equal(c.bowling.innings, 3);
    assert.equal(c.bowling.overs, "8.0");
    assert.equal(c.bowling.wickets, 6);
    assert.equal(c.bowling.economy, 7.75);
    assert.equal(c.bowling.average, 10.33);
    assert.equal(c.bowling.strikeRate, 8);
    assert.equal(c.bowling.bestText, "3-12");
    assert.equal(c.bowling.threeWickets, 2);
  });

  test("fielding", () => {
    const c = aggregateCareer([row("p", "m1", { field: { catches: 2, stumpings: 1 } }), row("p", "m2", { field: { runOuts: 1 } })]);
    assert.deepEqual(c.fielding, { catches: 2, runOuts: 1, stumpings: 1, dismissals: 4 });
  });
});

describe("leaders", () => {
  const rows = [
    row("a", "m1", { bat: { runs: 60, balls: 40, sixes: 3, out: false }, team: "Lions" }),
    row("a", "m2", { bat: { runs: 10, balls: 12, out: true }, team: "Lions" }),
    row("b", "m1", { bat: { runs: 70, balls: 30, sixes: 5, out: true }, team: "Tigers" }),
    row("c", "m1", { bowl: { legalBalls: 24, runs: 20, wickets: 3 }, team: "Tigers" }),
    row("d", "m1", { bowl: { legalBalls: 24, runs: 35, wickets: 3 }, field: { catches: 2 }, team: "Lions" }),
    row("d", "m2", { bowl: { legalBalls: 6, runs: 2, wickets: 0 }, team: "Lions" }),
    row("e", "m2", { bowl: { legalBalls: 6, runs: 1, wickets: 1 }, team: "Tigers" }),
  ];
  const leaders = buildLeaders(careersByPlayer(rows), rows);

  test("orange cap is most runs, purple cap most wickets with economy as tiebreak", () => {
    assert.equal(leaders.orangeCap.player, "b");
    assert.equal(leaders.orangeCap.value, 70);
    assert.deepEqual(leaders.batting.mostRuns.map((e) => [e.player, e.value]), [["b", 70], ["a", 70]]);
    assert.equal(leaders.purpleCap.player, "c");
    assert.deepEqual(leaders.bowling.mostWickets.map((e) => e.player), ["c", "d", "e"]);
  });

  test("single-innings lists", () => {
    assert.deepEqual(leaders.batting.highestScores.map((e) => e.value), ["70", "60*", "10"]);
    assert.deepEqual(leaders.bowling.bestFigures.map((e) => e.value), ["3-20", "3-35", "1-1"]);
  });

  test("qualifiers keep tiny samples off rate lists", () => {
    // e bowled only 1 over: below the 2-over economy qualifier.
    assert.deepEqual(leaders.bowling.bestEconomy.map((e) => e.player), ["c", "d"]);
    // a has 2 innings and a dismissal; b has only 1 innings.
    assert.deepEqual(leaders.batting.bestAverage.map((e) => e.player), ["a"]);
    assert.deepEqual(leaders.batting.mostSixes.map((e) => [e.player, e.value]), [["b", 5], ["a", 3]]);
    assert.deepEqual(leaders.fielding.mostCatches.map((e) => e.player), ["d"]);
  });

  test("empty input", () => {
    const empty = buildLeaders([], []);
    assert.equal(empty.orangeCap, null);
    assert.deepEqual(empty.batting.mostRuns, []);
  });
});
