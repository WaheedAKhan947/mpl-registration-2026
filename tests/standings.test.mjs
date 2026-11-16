import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { computeStandings, netRunRate, nrrBalls, outcomeFromInnings } from "../lib/standings.js";

describe("outcome from innings", () => {
  const first = { battingTeam: "Eleven", runs: 61 };
  test("chase reached, defended, tied, revised target, abandoned, incomplete", () => {
    assert.deepEqual(outcomeFromInnings({ first, second: { battingTeam: "Kings", runs: 63, target: 62 } }), { outcome: "win", winner: "Kings" });
    assert.deepEqual(outcomeFromInnings({ first, second: { battingTeam: "Kings", runs: 40, target: 62 } }), { outcome: "win", winner: "Eleven" });
    assert.deepEqual(outcomeFromInnings({ first, second: { battingTeam: "Kings", runs: 61, target: 62 } }), { outcome: "tie", winner: null });
    assert.deepEqual(outcomeFromInnings({ first, second: { battingTeam: "Kings", runs: 50, target: 50 } }), { outcome: "win", winner: "Kings" });
    assert.deepEqual(outcomeFromInnings({ first, second: { battingTeam: "Kings", runs: 62 } }), { outcome: "win", winner: "Kings" });
    assert.deepEqual(outcomeFromInnings({ abandoned: true }), { outcome: "no_result", winner: null });
    assert.equal(outcomeFromInnings({ first }), null);
  });
});

describe("net run rate", () => {
  test("an all-out side is charged its full quota of overs", () => {
    assert.equal(nrrBalls({ legalBalls: 90, allOut: true, quotaBalls: 120 }), 120);
    assert.equal(nrrBalls({ legalBalls: 90, allOut: false, quotaBalls: 120 }), 90);
  });

  test("NRR is run rate for minus run rate against", () => {
    // 150 in 20 overs (7.5) vs 120 in 20 overs (6.0)
    assert.equal(netRunRate({ runsFor: 150, ballsFor: 120, runsAgainst: 120, ballsAgainst: 120 }), 1.5);
    assert.equal(netRunRate({ runsFor: 0, ballsFor: 0, runsAgainst: 0, ballsAgainst: 0 }), 0);
  });
});

describe("standings", () => {
  const teams = ["Lions", "Tigers", "Eagles"];

  test("win, loss and NRR with an all-out side", () => {
    const rows = computeStandings(teams, [
      {
        teamA: "Lions",
        teamB: "Tigers",
        outcome: "win",
        winner: "Lions",
        innings: [
          { battingTeam: "Lions", runs: 120, legalBalls: 60, allOut: false, quotaBalls: 60 },
          // Tigers bowled out in 7 overs: counted as the full 10.
          { battingTeam: "Tigers", runs: 70, legalBalls: 42, allOut: true, quotaBalls: 60 },
        ],
      },
    ]);
    const lions = rows.find((r) => r.team === "Lions");
    const tigers = rows.find((r) => r.team === "Tigers");
    const eagles = rows.find((r) => r.team === "Eagles");
    assert.equal(rows[0].team, "Lions");
    assert.deepEqual([lions.played, lions.won, lions.lost, lions.points], [1, 1, 0, 2]);
    assert.deepEqual([tigers.played, tigers.won, tigers.lost, tigers.points], [1, 0, 1, 0]);
    assert.equal(lions.netRunRate, 5); // 12.0 - 7.0
    assert.equal(tigers.netRunRate, -5);
    assert.equal(eagles.played, 0);
  });

  test("a successful chase uses the overs actually faced", () => {
    const rows = computeStandings(teams, [
      {
        teamA: "Lions",
        teamB: "Tigers",
        outcome: "win",
        winner: "Tigers",
        innings: [
          { battingTeam: "Lions", runs: 60, legalBalls: 60, allOut: false, quotaBalls: 60 },
          { battingTeam: "Tigers", runs: 61, legalBalls: 30, allOut: false, quotaBalls: 60 },
        ],
      },
    ]);
    const tigers = rows.find((r) => r.team === "Tigers");
    assert.equal(tigers.netRunRate, 6.2); // 12.2 - 6.0
  });

  test("tie and no result each give a point; no-result runs stay out of NRR", () => {
    const rows = computeStandings(teams, [
      {
        teamA: "Lions",
        teamB: "Eagles",
        outcome: "tie",
        winner: null,
        innings: [
          { battingTeam: "Lions", runs: 80, legalBalls: 60, allOut: false, quotaBalls: 60 },
          { battingTeam: "Eagles", runs: 80, legalBalls: 60, allOut: false, quotaBalls: 60 },
        ],
      },
      {
        teamA: "Tigers",
        teamB: "Eagles",
        outcome: "no_result",
        winner: null,
        innings: [{ battingTeam: "Tigers", runs: 200, legalBalls: 30, allOut: false, quotaBalls: 60 }],
      },
    ]);
    const eagles = rows.find((r) => r.team === "Eagles");
    assert.deepEqual([eagles.played, eagles.tied, eagles.noResult, eagles.points], [2, 1, 1, 2]);
    assert.equal(eagles.netRunRate, 0);
    assert.equal(rows.find((r) => r.team === "Tigers").runsFor, 0);
  });

  test("ordering: points, then NRR", () => {
    const rows = computeStandings(teams, [
      {
        teamA: "Lions",
        teamB: "Tigers",
        outcome: "win",
        winner: "Lions",
        innings: [
          { battingTeam: "Lions", runs: 100, legalBalls: 60, allOut: false, quotaBalls: 60 },
          { battingTeam: "Tigers", runs: 99, legalBalls: 60, allOut: false, quotaBalls: 60 },
        ],
      },
      {
        teamA: "Eagles",
        teamB: "Tigers",
        outcome: "win",
        winner: "Eagles",
        innings: [
          { battingTeam: "Eagles", runs: 150, legalBalls: 60, allOut: false, quotaBalls: 60 },
          { battingTeam: "Tigers", runs: 50, legalBalls: 60, allOut: true, quotaBalls: 60 },
        ],
      },
    ]);
    assert.deepEqual(
      rows.map((r) => r.team),
      ["Eagles", "Lions", "Tigers"]
    );
  });
});
