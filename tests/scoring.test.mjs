import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  replayInnings,
  validateBall,
  resolveConfig,
  computeResult,
  describeBall,
  dismissalText,
  ballLabel,
  buildPlayerMatchStats,
  formatOvers,
  bowlerProblem,
  availableBatters,
  inningsSummary,
  liveSituation,
  validateInnings,
} from "../lib/scoring.js";

// Drives an innings the way the scoring screen will: each ball takes the
// current striker / non-striker / bowler from the replayed state, gets
// validated, and is appended. `incoming` fills the empty slot after a wicket.
function innings(options = {}) {
  const opts = { striker: "s1", nonStriker: "s2", bowler: "b1", ...options };
  const balls = [];
  let bowler = opts.bowler;
  let pendingBatter = null;

  const api = {
    balls,
    state: () => replayInnings(balls, opts),
    bowl(id) {
      bowler = id;
      return api;
    },
    incoming(id) {
      pendingBatter = id;
      return api;
    },
    tryAdd(partial = {}) {
      const s = api.state();
      let striker = s.striker;
      let nonStriker = s.nonStriker;
      if (pendingBatter) {
        if (!striker) striker = pendingBatter;
        else if (!nonStriker) nonStriker = pendingBatter;
      }
      const ball = { seq: balls.length + 1, striker, nonStriker, bowler, ...partial };
      const error = validateBall(ball, s);
      if (!error) {
        balls.push(ball);
        pendingBatter = null;
      }
      return error;
    },
    add(partial = {}) {
      const error = api.tryAdd(partial);
      if (error) throw new Error(error);
      return api.state();
    },
    dots(count) {
      let s;
      for (let i = 0; i < count; i += 1) s = api.add({});
      return s;
    },
  };
  return api;
}

describe("config", () => {
  test("max overs per bowler defaults to a fifth of the innings, rounded up", () => {
    assert.equal(resolveConfig({ overs: 20 }).maxOversPerBowler, 4);
    assert.equal(resolveConfig({ overs: 10 }).maxOversPerBowler, 2);
    assert.equal(resolveConfig({ overs: 8 }).maxOversPerBowler, 2);
    assert.equal(resolveConfig({ overs: 6 }).maxOversPerBowler, 2);
    assert.equal(resolveConfig({ overs: 6, maxOversPerBowler: 3 }).maxOversPerBowler, 3);
  });

  test("formatOvers", () => {
    assert.equal(formatOvers(0), "0.0");
    assert.equal(formatOvers(27), "4.3");
    assert.equal(formatOvers(30), "5.0");
  });
});

describe("runs and strike rotation", () => {
  test("odd runs swap strike, even runs do not", () => {
    const inn = innings({ config: { overs: 5 } });
    let s = inn.add({ runsOffBat: 1 });
    assert.equal(s.striker, "s2");
    assert.equal(s.nonStriker, "s1");
    s = inn.add({ runsOffBat: 2 });
    assert.equal(s.striker, "s2");
    s = inn.add({ runsOffBat: 3 });
    assert.equal(s.striker, "s1");
    assert.equal(s.runs, 6);
    assert.equal(s.legalBalls, 3);
  });

  test("boundaries are not run, so strike stays", () => {
    const inn = innings({ config: { overs: 5 } });
    const s = inn.add({ runsOffBat: 4, boundary: 4 });
    assert.equal(s.striker, "s1");
    const batter = s.batters.find((b) => b.id === "s1");
    assert.equal(batter.fours, 1);
    assert.equal(batter.runs, 4);
  });

  test("strike changes at the end of the over and a new bowler is needed", () => {
    const inn = innings({ config: { overs: 5 } });
    let s = inn.dots(5);
    assert.equal(s.needs.bowler, false);
    s = inn.add({ runsOffBat: 1 });
    // The single swapped them, then the over end swapped back.
    assert.equal(s.striker, "s1");
    assert.equal(s.overs, "1.0");
    assert.equal(s.needs.bowler, true);
    assert.equal(s.currentBowler, null);
    assert.equal(s.lastOverBowler, "b1");
  });

  test("a maiden over is credited", () => {
    const inn = innings({ config: { overs: 5 } });
    const s = inn.dots(6);
    assert.equal(s.bowlers[0].maidens, 1);
    assert.equal(s.bowlers[0].overs, "1.0");
    assert.equal(s.bowlers[0].dots, 6);
  });

  test("leg byes in an over still allow a maiden; a wide does not", () => {
    const inn = innings({ config: { overs: 5 } });
    inn.dots(5);
    let s = inn.add({ extrasType: "legbye", extraRuns: 2 });
    assert.equal(s.bowlers[0].maidens, 1);
    inn.bowl("b2");
    inn.add({ extrasType: "wide", extraRuns: 1 });
    s = inn.dots(6);
    assert.equal(s.bowlers.find((b) => b.id === "b2").maidens, 0);
  });
});

describe("extras", () => {
  test("a wide is not a legal ball, is charged to the bowler and not faced by the batter", () => {
    const inn = innings({ config: { overs: 5 } });
    const s = inn.add({ extrasType: "wide", extraRuns: 1 });
    assert.equal(s.runs, 1);
    assert.equal(s.legalBalls, 0);
    assert.equal(s.extras.wides, 1);
    assert.equal(s.bowlers[0].runs, 1);
    assert.equal(s.bowlers[0].wides, 1);
    assert.equal(s.batters[0].balls, 0);
    assert.equal(s.striker, "s1");
  });

  test("a wide with a run taken swaps strike; all of it is wides", () => {
    const inn = innings({ config: { overs: 5 } });
    const s = inn.add({ extrasType: "wide", extraRuns: 2 });
    assert.equal(s.runs, 2);
    assert.equal(s.extras.wides, 2);
    assert.equal(s.striker, "s2");
  });

  test("a wide that runs to the boundary is five wides and no change of ends", () => {
    const inn = innings({ config: { overs: 5 } });
    const s = inn.add({ extrasType: "wide", extraRuns: 5, boundary: 4 });
    assert.equal(s.runs, 5);
    assert.equal(s.striker, "s1");
  });

  test("a no-ball hit for four: batter gets four and the ball faced, bowler is charged five", () => {
    const inn = innings({ config: { overs: 5 } });
    const s = inn.add({ extrasType: "noball", extraRuns: 1, runsOffBat: 4, boundary: 4 });
    assert.equal(s.runs, 5);
    assert.equal(s.legalBalls, 0);
    assert.equal(s.extras.noballs, 1);
    assert.equal(s.bowlers[0].runs, 5);
    assert.equal(s.bowlers[0].noballs, 1);
    assert.equal(s.batters[0].runs, 4);
    assert.equal(s.batters[0].balls, 1);
    assert.equal(s.freeHit, true);
  });

  test("byes off a no-ball go to byes and are not charged to the bowler", () => {
    const inn = innings({ config: { overs: 5 } });
    const s = inn.add({ extrasType: "noball", extraRuns: 2 });
    assert.equal(s.extras.noballs, 1);
    assert.equal(s.extras.byes, 1);
    assert.equal(s.bowlers[0].runs, 1);
    assert.equal(s.striker, "s2");
  });

  test("byes and leg byes are legal balls, faced by the batter, not charged to the bowler", () => {
    const inn = innings({ config: { overs: 5 } });
    let s = inn.add({ extrasType: "bye", extraRuns: 1 });
    assert.equal(s.legalBalls, 1);
    assert.equal(s.extras.byes, 1);
    assert.equal(s.bowlers[0].runs, 0);
    assert.equal(s.batters.find((b) => b.id === "s1").balls, 1);
    assert.equal(s.batters.find((b) => b.id === "s1").runs, 0);
    assert.equal(s.striker, "s2");
    s = inn.add({ extrasType: "legbye", extraRuns: 4, boundary: 4 });
    assert.equal(s.extras.legbyes, 4);
    assert.equal(s.striker, "s2");
    assert.equal(s.extras.total, 5);
  });

  test("custom wide penalty", () => {
    const inn = innings({ config: { overs: 5, widePenalty: 2 } });
    assert.match(inn.tryAdd({ extrasType: "wide", extraRuns: 1 }), /at least 2 runs/);
    const s = inn.add({ extrasType: "wide", extraRuns: 3 });
    // 2 penalty + 1 run: odd number run, so they changed ends.
    assert.equal(s.striker, "s2");
  });

  test("penalty runs are not a delivery", () => {
    const inn = innings({ config: { overs: 5 } });
    const s = inn.add({ extrasType: "penalty", extraRuns: 5, striker: null, nonStriker: null });
    assert.equal(s.runs, 5);
    assert.equal(s.legalBalls, 0);
    assert.equal(s.extras.penalty, 5);
    assert.equal(s.striker, "s1");
    assert.equal(s.bowlers.length, 0);
  });
});

describe("free hit", () => {
  test("only a run out is possible on a free hit, and the free hit survives a wide", () => {
    const inn = innings({ config: { overs: 5 } });
    inn.add({ extrasType: "noball", extraRuns: 1 });
    assert.match(inn.tryAdd({ wicket: { type: "bowled", playerOut: "s1" } }), /Free hit/);
    let s = inn.add({ extrasType: "wide", extraRuns: 1 });
    assert.equal(s.freeHit, true);
    assert.match(inn.tryAdd({ wicket: { type: "caught", playerOut: "s1", fielders: ["f1"] } }), /Free hit/);
    s = inn.add({ runsOffBat: 1, wicket: { type: "run_out", playerOut: "s2", fielders: ["f1"] } });
    assert.equal(s.wickets, 1);
    assert.equal(s.freeHit, false);
    assert.equal(s.balls[2].freeHit, true);
  });

  test("a legal ball ends the free hit", () => {
    const inn = innings({ config: { overs: 5 } });
    inn.add({ extrasType: "noball", extraRuns: 1 });
    const s = inn.add({ runsOffBat: 2 });
    assert.equal(s.freeHit, false);
    assert.equal(inn.tryAdd({ wicket: { type: "bowled", playerOut: "s1" } }), null);
  });
});

describe("wickets", () => {
  test("bowler-dependent dismissals credit the bowler; run outs do not", () => {
    const inn = innings({ config: { overs: 5 } });
    let s = inn.add({ wicket: { type: "caught", playerOut: "s1", fielders: ["f1"] } });
    assert.equal(s.wickets, 1);
    assert.equal(s.bowlers[0].wickets, 1);
    assert.equal(s.striker, null);
    assert.equal(s.needs.batter, true);
    assert.deepEqual(s.fallOfWickets[0], { wicket: 1, runs: 0, legalBalls: 1, overs: "0.1", player: "s1" });

    inn.incoming("s3");
    s = inn.add({ runsOffBat: 1, wicket: { type: "run_out", playerOut: "s2", fielders: ["f2"] } });
    assert.equal(s.wickets, 2);
    assert.equal(s.bowlers[0].wickets, 1);
    assert.equal(s.runs, 1);
    assert.equal(s.batters.find((b) => b.id === "s3").runs, 1);
    assert.equal(s.batters.find((b) => b.id === "s2").dismissal.bowler, null);
  });

  test("run out of the non-striker mid-run: completed runs count and the slot is emptied", () => {
    const inn = innings({ config: { overs: 5 } });
    const s = inn.add({ runsOffBat: 1, wicket: { type: "run_out", playerOut: "s2", fielders: ["f1"] } });
    assert.equal(s.runs, 1);
    // s1 crossed for the completed run, so the incoming batter takes strike.
    assert.equal(s.striker, null);
    assert.equal(s.nonStriker, "s1");
  });

  test("wicket on the last ball of the over: new batter goes to the non-striker's end", () => {
    const inn = innings({ config: { overs: 5 } });
    inn.dots(5);
    const s = inn.add({ wicket: { type: "bowled", playerOut: "s1" } });
    assert.equal(s.striker, "s2");
    assert.equal(s.nonStriker, null);
    assert.equal(s.needs.batter, true);
    assert.equal(s.needs.bowler, true);
  });

  test("only the striker can be bowled; either batter can be run out", () => {
    const inn = innings({ config: { overs: 5 } });
    assert.match(inn.tryAdd({ wicket: { type: "bowled", playerOut: "s2" } }), /Only the striker/);
    assert.equal(inn.tryAdd({ wicket: { type: "run_out", playerOut: "s2" } }), null);
  });

  test("dismissal rules on extras", () => {
    const inn = innings({ config: { overs: 5 } });
    assert.match(
      inn.tryAdd({ extrasType: "wide", extraRuns: 1, wicket: { type: "caught", playerOut: "s1" } }),
      /Off a wide/
    );
    assert.match(
      inn.tryAdd({ extrasType: "noball", extraRuns: 1, wicket: { type: "lbw", playerOut: "s1" } }),
      /Off a no-ball/
    );
    assert.equal(
      inn.tryAdd({ extrasType: "wide", extraRuns: 1, wicket: { type: "stumped", playerOut: "s1", fielders: ["wk"] } }),
      null
    );
    const s = inn.state();
    assert.equal(s.wickets, 1);
    assert.equal(s.bowlers[0].wickets, 1);
    assert.equal(s.runs, 1);
  });

  test("an out batter cannot bat again", () => {
    const inn = innings({ config: { overs: 5 } });
    inn.add({ wicket: { type: "bowled", playerOut: "s1" } });
    assert.match(inn.tryAdd({ striker: "s1", nonStriker: "s2" }), /already out/);
  });

  test("retired hurt is not a wicket and the batter can come back", () => {
    const inn = innings({ config: { overs: 5, playersPerSide: 4 } });
    let s = inn.add({ wicket: { type: "retired_hurt", playerOut: "s1" } });
    assert.equal(s.wickets, 0);
    assert.equal(s.legalBalls, 0);
    assert.equal(s.striker, null);
    inn.incoming("s3");
    s = inn.add({ wicket: { type: "bowled", playerOut: "s3" } });
    assert.equal(s.wickets, 1);
    inn.incoming("s1");
    s = inn.add({ runsOffBat: 2 });
    const s1 = s.batters.find((b) => b.id === "s1");
    assert.equal(s1.retiredHurt, false);
    assert.equal(s1.runs, 2);
  });

  test("retired out counts as a wicket but not for the bowler", () => {
    const inn = innings({ config: { overs: 5 } });
    const s = inn.add({ wicket: { type: "retired_out", playerOut: "s2" } });
    assert.equal(s.wickets, 1);
    assert.equal(s.bowlers.length, 0);
  });
});

describe("bowling restrictions", () => {
  test("no bowler bowls consecutive overs", () => {
    const inn = innings({ config: { overs: 5 } });
    inn.dots(6);
    assert.match(inn.tryAdd({}), /two overs in a row/);
    inn.bowl("b2");
    assert.equal(inn.tryAdd({}), null);
  });

  test("a different bowler cannot take over mid-over unless flagged as a change", () => {
    const inn = innings({ config: { overs: 5 } });
    inn.dots(2);
    inn.bowl("b2");
    assert.match(inn.tryAdd({}), /another bowler/);
    const s = inn.add({ bowlerChange: true });
    assert.equal(s.currentBowler, "b2");
  });

  test("max overs per bowler is enforced", () => {
    const inn = innings({ config: { overs: 6 } }); // 2 overs each
    inn.dots(6);
    inn.bowl("b2").dots(6);
    inn.bowl("b1").dots(6);
    inn.bowl("b2").dots(6);
    inn.bowl("b1");
    assert.match(inn.tryAdd({}), /maximum of 2 overs/);
  });
});

describe("innings end", () => {
  test("all out ends the innings", () => {
    const inn = innings({ config: { overs: 5, playersPerSide: 3 } });
    inn.add({ wicket: { type: "bowled", playerOut: "s1" } });
    inn.incoming("s3");
    const s = inn.add({ wicket: { type: "lbw", playerOut: "s3" } });
    assert.equal(s.complete, true);
    assert.equal(s.endReason, "all_out");
    assert.equal(s.needs.batter, false);
    assert.match(inn.tryAdd({}), /already complete/);
  });

  test("last man stands: the survivor bats alone and always faces", () => {
    const inn = innings({ config: { overs: 5, playersPerSide: 3, lastManStands: true } });
    inn.add({ wicket: { type: "bowled", playerOut: "s1" } });
    inn.incoming("s3");
    let s = inn.add({ wicket: { type: "bowled", playerOut: "s3" } });
    assert.equal(s.complete, false);
    assert.equal(s.striker, "s2");
    assert.equal(s.nonStriker, null);
    assert.equal(s.needs.batter, false);
    s = inn.add({ runsOffBat: 1 });
    assert.equal(s.striker, "s2");
    s = inn.add({ wicket: { type: "bowled", playerOut: "s2" } });
    assert.equal(s.endReason, "all_out");
  });

  test("overs complete ends the innings", () => {
    const inn = innings({ config: { overs: 1 } });
    const s = inn.dots(6);
    assert.equal(s.complete, true);
    assert.equal(s.endReason, "overs");
  });

  test("reduced overs override", () => {
    const inn = innings({ config: { overs: 5 }, maxOvers: 1 });
    const s = inn.dots(6);
    assert.equal(s.endReason, "overs");
  });

  test("reaching the target ends the chase, with run rates along the way", () => {
    const inn = innings({ config: { overs: 2 }, target: 10 });
    let s = inn.add({ runsOffBat: 4, boundary: 4 });
    assert.equal(s.runsNeeded, 6);
    assert.equal(s.ballsRemaining, 11);
    assert.equal(s.requiredRate, Math.round((6 * 6 * 100) / 11) / 100);
    assert.equal(s.runRate, 24);
    s = inn.add({ runsOffBat: 6, boundary: 6 });
    assert.equal(s.complete, true);
    assert.equal(s.endReason, "target");
    assert.equal(s.runsNeeded, 0);
  });
});

describe("validation", () => {
  test("rejects impossible balls", () => {
    const inn = innings({ config: { overs: 5 } });
    assert.match(inn.tryAdd({ runsOffBat: 5, boundary: 6 }), /six/);
    assert.match(inn.tryAdd({ runsOffBat: 3, boundary: 4 }), /four/);
    assert.match(inn.tryAdd({ extrasType: "wide", extraRuns: 1, runsOffBat: 1 }), /off the bat on a wide/);
    assert.match(inn.tryAdd({ extraRuns: 2 }), /extra type/);
    assert.match(inn.tryAdd({ runsOffBat: -1 }), /whole number/);
    assert.match(inn.tryAdd({ runsOffBat: 1.5 }), /whole number/);
    assert.match(inn.tryAdd({ runsOffBat: 9 }), /more than 7/);
    assert.match(inn.tryAdd({ bowler: "s1" }), /bowler cannot also be/);
    assert.match(inn.tryAdd({ runsOffBat: 2, wicket: { type: "caught", playerOut: "s1" } }), /No runs off the bat/);
    assert.match(inn.tryAdd({ nonStriker: "s1" }), /must be different/);
    assert.match(inn.tryAdd({ wicket: { type: "teleported", playerOut: "s1" } }), /Unknown dismissal/);
    assert.equal(inn.balls.length, 0);
  });
});

describe("corrections", () => {
  test("undo is a replay without the last ball", () => {
    const inn = innings({ config: { overs: 5 } });
    inn.add({ runsOffBat: 1 });
    inn.add({ runsOffBat: 4, boundary: 4 });
    const before = inn.state();
    inn.add({ wicket: { type: "bowled", playerOut: before.striker } });
    inn.balls.pop();
    const after = inn.state();
    assert.deepEqual(after.batters, before.batters);
    assert.equal(after.wickets, 0);
    assert.equal(after.striker, before.striker);
  });

  test("editing an earlier ball recomputes totals, strike and figures", () => {
    const inn = innings({ config: { overs: 5 } });
    inn.add({ runsOffBat: 1 }); // s2 on strike
    inn.add({ runsOffBat: 2 }); // still s2
    inn.balls[0] = { ...inn.balls[0], runsOffBat: 4, boundary: 4 }; // the single was really a four
    // Ball 2 recorded s2 as striker; replay trusts each ball's own batters.
    const s = inn.state();
    assert.equal(s.runs, 6);
    assert.equal(s.batters.find((b) => b.id === "s1").runs, 4);
    assert.equal(s.batters.find((b) => b.id === "s2").runs, 2);
    assert.equal(s.bowlers[0].runs, 6);
  });

  test("balls are replayed in seq order regardless of array order", () => {
    const opts = { config: { overs: 5 }, striker: "s1", nonStriker: "s2" };
    const a = { seq: 1, striker: "s1", nonStriker: "s2", bowler: "b1", runsOffBat: 1 };
    const b = { seq: 2, striker: "s2", nonStriker: "s1", bowler: "b1", runsOffBat: 4, boundary: 4 };
    assert.deepEqual(replayInnings([b, a], opts).batters, replayInnings([a, b], opts).batters);
  });
});

describe("partnerships", () => {
  test("partnerships break on wickets and include extras", () => {
    const inn = innings({ config: { overs: 5 } });
    inn.add({ runsOffBat: 2 });
    inn.add({ extrasType: "wide", extraRuns: 1 });
    let s = inn.add({ wicket: { type: "bowled", playerOut: "s1" } });
    assert.equal(s.partnerships.length, 1);
    assert.equal(s.partnerships[0].runs, 3);
    assert.equal(s.partnerships[0].balls, 2);
    inn.incoming("s3");
    s = inn.add({ runsOffBat: 3 });
    assert.equal(s.currentPartnership.runs, 3);
    assert.deepEqual([...s.currentPartnership.batters].sort(), ["s2", "s3"]);
    assert.equal(s.currentPartnership.forWicket, 2);
  });
});

describe("result", () => {
  const first = { team: "Lions", runs: 120, wickets: 6 };

  test("chasing side wins by wickets with balls left", () => {
    const second = { team: "Tigers", runs: 121, wickets: 3, legalBalls: 110, quotaBalls: 120, maxWickets: 10, complete: true, target: 121 };
    const result = computeResult({ first, second });
    assert.equal(result.winner, "Tigers");
    assert.equal(result.text, "Tigers won by 7 wickets (10 balls left)");
  });

  test("winning off the last ball has no balls-left note; singular wicket", () => {
    const second = { team: "Tigers", runs: 124, wickets: 9, legalBalls: 120, quotaBalls: 120, maxWickets: 10, complete: true, target: 121 };
    assert.equal(computeResult({ first, second }).text, "Tigers won by 1 wicket");
  });

  test("defending side wins by runs", () => {
    const second = { team: "Tigers", runs: 100, wickets: 10, legalBalls: 90, quotaBalls: 120, maxWickets: 10, complete: true, target: 121 };
    const result = computeResult({ first, second });
    assert.equal(result.winner, "Lions");
    assert.equal(result.text, "Lions won by 20 runs");
    const close = computeResult({ first, second: { ...second, runs: 119 } });
    assert.equal(close.text, "Lions won by 1 run");
  });

  test("tie and no result", () => {
    const second = { team: "Tigers", runs: 120, wickets: 8, legalBalls: 120, quotaBalls: 120, maxWickets: 10, complete: true, target: 121 };
    assert.equal(computeResult({ first, second }).outcome, "tie");
    assert.equal(computeResult({ first, second }).text, "Match tied");
    assert.equal(computeResult({ abandoned: true }).text, "No result");
  });

  test("revised target is marked DLS; no result while chase is on", () => {
    const second = { team: "Tigers", runs: 90, wickets: 8, legalBalls: 60, quotaBalls: 60, maxWickets: 10, complete: true, target: 95 };
    assert.equal(computeResult({ first, second, revisedTarget: true }).text, "Lions won by 4 runs (DLS)");
    assert.equal(computeResult({ first, second: { ...second, complete: false } }), null);
  });

  test("result from a replayed chase", () => {
    const inn = innings({ config: { overs: 1, playersPerSide: 11 }, target: 5 });
    inn.add({ runsOffBat: 4, boundary: 4 });
    const s = inn.add({ runsOffBat: 1 });
    const result = computeResult({ first: { team: "A", runs: 4 }, second: { ...s, team: "B" } });
    assert.equal(result.text, "B won by 10 wickets (4 balls left)");
  });
});

describe("text", () => {
  const names = { s1: "Ali", s2: "Bilal", b1: "Khan", f1: "Zaid" };
  const nameOf = (id) => names[id] || id;

  test("commentary lines", () => {
    const base = { striker: "s1", nonStriker: "s2", bowler: "b1" };
    assert.equal(describeBall({ ...base, runsOffBat: 4, boundary: 4 }, nameOf), "Khan to Ali, FOUR!");
    assert.equal(describeBall({ ...base, runsOffBat: 0 }, nameOf), "Khan to Ali, no run.");
    assert.equal(describeBall({ ...base, runsOffBat: 1 }, nameOf), "Khan to Ali, 1 run.");
    assert.equal(describeBall({ ...base, extrasType: "wide", extraRuns: 1 }, nameOf), "Khan to Ali, wide.");
    assert.equal(
      describeBall({ ...base, wicket: { type: "caught", playerOut: "s1", fielders: ["f1"] } }, nameOf),
      "Khan to Ali, no run. OUT! Ali c Zaid b Khan."
    );
    assert.match(describeBall({ ...base, extrasType: "noball", extraRuns: 1 }, nameOf), /Free hit next\.$/);
  });

  test("dismissal text", () => {
    assert.equal(dismissalText({ type: "caught", bowler: "b1", fielders: ["b1"] }, nameOf), "c & b Khan");
    assert.equal(dismissalText({ type: "run_out", bowler: null, fielders: ["f1"] }, nameOf), "run out (Zaid)");
    assert.equal(dismissalText({ type: "stumped", bowler: "b1", fielders: ["f1"] }, nameOf), "st Zaid b Khan");
    assert.equal(dismissalText(null, nameOf), "not out");
  });

  test("ball chips", () => {
    assert.equal(ballLabel({ runsOffBat: 0 }), "•");
    assert.equal(ballLabel({ runsOffBat: 6, boundary: 6 }), "6");
    assert.equal(ballLabel({ extrasType: "wide", extraRuns: 1 }), "Wd");
    assert.equal(ballLabel({ extrasType: "wide", extraRuns: 3 }), "2Wd");
    assert.equal(ballLabel({ extrasType: "noball", extraRuns: 1, runsOffBat: 4 }), "4Nb");
    assert.equal(ballLabel({ extrasType: "legbye", extraRuns: 1 }), "1Lb");
    assert.equal(ballLabel({ wicket: { type: "bowled", playerOut: "x" } }), "W");
  });
});

describe("player match stats", () => {
  test("batting, bowling and fielding figures per player", () => {
    const inn1 = innings({ config: { overs: 5 }, striker: "a1", nonStriker: "a2", bowler: "b1" });
    inn1.add({ runsOffBat: 6, boundary: 6 });
    inn1.add({ wicket: { type: "caught", playerOut: "a1", fielders: ["b2"] } });
    inn1.incoming("a3").add({ runsOffBat: 1, wicket: { type: "run_out", playerOut: "a2", fielders: ["b3"] } });

    const stats = buildPlayerMatchStats(
      [{ state: inn1.state(), battingTeam: "A", bowlingTeam: "B" }],
      { A: ["a1", "a2", "a3", "a4"], B: ["b1", "b2", "b3"] }
    );
    const by = Object.fromEntries(stats.map((s) => [s.player, s]));

    assert.equal(by.a1.batting.runs, 6);
    assert.equal(by.a1.batting.sixes, 1);
    assert.equal(by.a1.batting.out, true);
    assert.equal(by.a1.batting.strikeRate, 300);
    assert.equal(by.a4.batting.didBat, false);
    assert.equal(by.a4.team, "A");
    assert.equal(by.b1.bowling.wickets, 1);
    assert.equal(by.b1.bowling.runs, 7);
    assert.equal(by.b1.bowling.overs, "0.3");
    assert.equal(by.b1.bowling.economy, 14);
    assert.equal(by.b2.fielding.catches, 1);
    assert.equal(by.b3.fielding.runOuts, 1);
    assert.equal(by.b3.team, "B");
  });
});

describe("selection helpers", () => {
  test("bowlerProblem mirrors the ball rules", () => {
    const inn = innings({ config: { overs: 6 } });
    assert.equal(bowlerProblem(inn.state(), "b1"), null);
    inn.dots(2);
    assert.match(bowlerProblem(inn.state(), "b2"), /another bowler/);
    assert.equal(bowlerProblem(inn.state(), "b2", { midOverChange: true }), null);
    inn.dots(4);
    assert.match(bowlerProblem(inn.state(), "b1"), /two overs in a row/);
    assert.equal(bowlerProblem(inn.state(), "b2"), null);
    inn.bowl("b2").dots(6);
    inn.bowl("b1").dots(6);
    assert.equal(bowlerProblem(inn.state(), "b3"), null);
    inn.bowl("b2").dots(6);
    assert.match(bowlerProblem(inn.state(), "b1"), /maximum/);
    assert.match(bowlerProblem(inn.state(), ""), /Select the bowler/);
  });

  test("availableBatters skips the out and those at the crease, keeps retired hurt", () => {
    const inn = innings({ config: { overs: 5, playersPerSide: 5 } });
    inn.add({ wicket: { type: "bowled", playerOut: "s1" } });
    inn.incoming("s3").add({ wicket: { type: "retired_hurt", playerOut: "s3" } });
    const s = inn.state();
    assert.deepEqual(availableBatters(s, ["s1", "s2", "s3", "s4", "s5"]), ["s3", "s4", "s5"]);
  });
});

describe("match summary", () => {
  const nameOf = (id) => id.toUpperCase();

  test("inningsSummary picks the top batter and best bowler", () => {
    const inn = innings({ config: { overs: 2 } });
    inn.add({ runsOffBat: 4, boundary: 4 });
    inn.add({ wicket: { type: "bowled", playerOut: "s1" } });
    inn.incoming("s3").add({ runsOffBat: 1 });
    inn.dots(3);
    inn.bowl("b2").add({ runsOffBat: 6, boundary: 6 });
    const summary = inningsSummary(inn.state(), nameOf);
    assert.equal(summary.runs, 11);
    assert.equal(summary.wickets, 1);
    assert.equal(summary.overs, "1.1");
    assert.deepEqual(summary.topBatter, { name: "S3", figures: "7* (2)" });
    assert.deepEqual(summary.topBowler, { name: "B1", figures: "1-5" });
  });

  test("whole overs drop the .0 and an empty innings has no performers", () => {
    const inn = innings({ config: { overs: 1 } });
    inn.dots(6);
    assert.equal(inningsSummary(inn.state(), nameOf).overs, "1");
    const empty = inningsSummary(innings({ config: { overs: 1 } }).state(), nameOf);
    assert.deepEqual(empty.topBatter, { name: "", figures: "" });
  });

  test("liveSituation lines", () => {
    const toss = { winner: "Lions", decision: "bowl" };
    assert.equal(liveSituation({ toss }), "Lions won the toss and chose to bowl");
    const done = innings({ config: { overs: 1 } });
    done.add({ runsOffBat: 6, boundary: 6 });
    done.dots(5);
    assert.equal(
      liveSituation({ toss, first: { state: done.state(), chasingTeam: "Lions" } }),
      "Innings break: Lions need 7 to win"
    );
    const chase = innings({ config: { overs: 1 }, target: 7 });
    chase.add({ runsOffBat: 1 });
    assert.equal(
      liveSituation({ toss, first: { state: done.state() }, second: { state: chase.state(), team: "Lions" } }),
      "Lions need 6 runs from 5 balls"
    );
  });
});

describe("batting order", () => {
  test("passing the current crease as options does not reorder the batters", () => {
    const balls = [
      { seq: 1, striker: "s1", nonStriker: "s2", bowler: "b1", runsOffBat: 0, wicket: { type: "bowled", playerOut: "s1" } },
      { seq: 2, striker: "s3", nonStriker: "s2", bowler: "b1", runsOffBat: 1 },
    ];
    const s = replayInnings(balls, { config: { overs: 5 }, striker: "s2", nonStriker: "s3" });
    assert.deepEqual(s.batters.map((b) => b.id), ["s1", "s2", "s3"]);
  });

  test("before the first ball the openers are listed", () => {
    const s = replayInnings([], { config: { overs: 5 }, striker: "s1", nonStriker: "s2" });
    assert.deepEqual(s.batters.map((b) => b.id), ["s1", "s2"]);
  });
});

describe("validateInnings (corrections)", () => {
  const opts = { config: { overs: 5, playersPerSide: 4 } };

  test("a valid innings passes", () => {
    const inn = innings(opts);
    inn.add({ runsOffBat: 1 });
    inn.add({ wicket: { type: "bowled", playerOut: "s2" } });
    inn.incoming("s3").add({ runsOffBat: 2 });
    assert.equal(validateInnings(inn.balls, opts), null);
  });

  test("turning an early dot into a wicket makes a later ball by that batter invalid", () => {
    const inn = innings(opts);
    inn.add({ runsOffBat: 0 });
    inn.add({ runsOffBat: 4, boundary: 4 });
    const edited = inn.balls.map((b, i) => (i === 0 ? { ...b, wicket: { type: "bowled", playerOut: "s1" } } : b));
    const problem = validateInnings(edited, opts);
    assert.equal(problem.seq, 2);
    assert.equal(problem.overBall, "0.2");
    assert.match(problem.error, /already out/);
  });

  test("a wide made legal can push a later ball past the end of the innings", () => {
    const short = { config: { overs: 1 } };
    const inn = innings(short);
    inn.add({ extrasType: "wide", extraRuns: 1 });
    inn.dots(6);
    const edited = inn.balls.map((b, i) => (i === 0 ? { ...b, extrasType: null, extraRuns: 0 } : b));
    assert.match(validateInnings(edited, short).error, /already complete/);
  });
});
