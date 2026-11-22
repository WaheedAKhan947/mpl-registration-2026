import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { EFFECT_KEYS, fitCanvas, parseOverlayParams } from "../lib/overlay/params.js";
import { nextPollDelay, pickSnapshot, pushSnapshot, snapshotKey } from "../lib/overlay/feed.js";
import { enqueue, eventsToPlay, isFresh, markSeen } from "../lib/overlay/effects.js";
import { isHatTrick, newBatterEvents, overlayEvents } from "../lib/overlay/events.js";

describe("new batter card", () => {
  const opts = { config: { overs: 5, playersPerSide: 11 } };
  const run = (raw, crease) => {
    const withSeq = raw.map((b, i) => ({ seq: i + 1, bowler: "b1", runsOffBat: 0, ...b }));
    const state = replayInnings(withSeq, opts);
    return newBatterEvents({
      balls: state.balls,
      replayUpTo: (n) => replayInnings(withSeq.slice(0, n), opts),
      number: 1,
      battingTeam: "Kings",
      crease,
      creaseAt: "2026-11-16T10:00:00.000Z",
      nameOf: (id) => id.toUpperCase(),
      photoOf: (id) => `/p/${id}`,
      roleOf: () => "Batsman",
    });
  };

  test("openers before the first wicket get no card", () => {
    assert.deepEqual(run([{ striker: "s1", nonStriker: "s2" }], ["s1", "s2"]), []);
  });

  test("the batter who walks in after a wicket gets one card until he faces", () => {
    const wicket = [{ striker: "s1", nonStriker: "s2", wicket: { type: "bowled", playerOut: "s1" } }];
    const events = run(wicket, ["s3", "s2"]);
    assert.deepEqual(events.map((e) => [e.id, e.type, e.batter.name, e.batter.role, e.score]), [["1-in-s3", "NEW_BATTER", "S3", "Batsman", "0/1"]]);
    // Still on 0 balls as the non-striker: same id, so it plays only once.
    assert.equal(run([...wicket, { striker: "s2", nonStriker: "s3", runsOffBat: 0 }], ["s2", "s3"])[0].id, "1-in-s3");
    // Once he has faced a ball, no card.
    assert.deepEqual(run([...wicket, { striker: "s3", nonStriker: "s2", runsOffBat: 1 }], ["s2", "s3"]), []);
  });

  test("a batter coming back from retired hurt gets no card", () => {
    const raw = [
      { striker: "s1", nonStriker: "s2", wicket: { type: "retired_hurt", playerOut: "s1" } },
      { striker: "s3", nonStriker: "s2", wicket: { type: "bowled", playerOut: "s3" } },
    ];
    assert.deepEqual(run(raw, ["s1", "s2"]), []);
  });
});
import { replayInnings } from "../lib/scoring.js";
import { autoScreen } from "../lib/overlay/screens.js";

describe("which full-screen screen to show", () => {
  const inn = (runs, overs) => ({ runs, overs });
  test("by match state", () => {
    assert.equal(autoScreen(null), null);
    assert.equal(autoScreen({ match: { scored: false, scoringStatus: "not_started", status: "upcoming" } }), "comingUp");
    assert.equal(autoScreen({ match: { scored: true, scoringStatus: "in_progress" }, situation: { type: "toss" }, innings: [inn(0, "0.0")], now: { recentBalls: [] } }), "preMatch");
    assert.equal(autoScreen({ match: { scored: true, scoringStatus: "in_progress" }, situation: { type: "toss" }, innings: [inn(4, "0.1")], now: { recentBalls: [{ label: "4" }] } }), null);
    assert.equal(autoScreen({ match: { scored: true, scoringStatus: "in_progress" }, situation: { type: "break" }, innings: [inn(120, "20.0")] }), "break");
    assert.equal(autoScreen({ match: { scored: true, scoringStatus: "in_progress" }, situation: { type: "chase" }, innings: [inn(120, "20.0"), inn(3, "0.2")] }), null);
    assert.equal(autoScreen({ match: { scored: true, scoringStatus: "completed" }, situation: { type: "result" } }), "result");
    assert.equal(autoScreen({ match: { scored: false, scoringStatus: "not_started", status: "completed" } }), "result", "hand-scored finished match");
  });

  test("a wide first ball (no runs off legal balls yet) still counts as started", () => {
    assert.equal(autoScreen({ match: { scored: true, scoringStatus: "in_progress" }, situation: { type: "toss" }, innings: [inn(1, "0.0")], now: { recentBalls: [{ label: "Wd" }] } }), null);
  });

  test("screens can be turned off by URL", () => {
    assert.equal(parseOverlayParams({}).screens, true);
    assert.equal(parseOverlayParams({ screens: "off" }).screens, false);
  });
});

describe("overlay events from balls", () => {
  const opts = { config: { overs: 5, playersPerSide: 11 } };
  const build = (raw, limit = 3) => {
    const withSeq = raw.map((b, i) => ({ seq: i + 1, bowler: "b1", nonStriker: "ns", runsOffBat: 0, ...b }));
    const state = replayInnings(withSeq, opts);
    return {
      balls: state.balls,
      events: overlayEvents({
        balls: state.balls,
        replayUpTo: (n) => replayInnings(withSeq.slice(0, n), opts),
        number: 1,
        battingTeam: "Kings",
        bowlingTeam: "Strikers",
        nameOf: (id) => (id ? id.toUpperCase() : ""),
        photoOf: (id) => `/p/${id}`,
        timeOf: () => "2026-11-16T10:00:00.000Z",
        limit,
      }),
    };
  };
  const types = (events) => events.map((e) => e.type);

  test("a FOUR, and the over summary on the sixth ball", () => {
    const { events } = build(Array.from({ length: 6 }, () => ({ striker: "s1", runsOffBat: 4, boundary: 4 })), 1);
    assert.deepEqual(types(events), ["FOUR", "OVER"]);
    const over = events[1];
    assert.deepEqual([over.over, over.runs, over.wickets, over.balls.join(" "), over.bowler.figures], [1, 24, 0, "4 4 4 4 4 4", "1.0-0-24-0"]);
    assert.equal(events[0].id, "1-6");
    assert.equal(over.id, "1-6-over");
  });

  test("a maiden over", () => {
    const { events } = build(Array.from({ length: 6 }, () => ({ striker: "s1" })), 1);
    assert.deepEqual(types(events), ["MAIDEN"]);
  });

  test("fifty reached with a two: a badge only; with a six: MAXIMUM then the badge", () => {
    const eight = Array.from({ length: 8 }, () => ({ striker: "s1", runsOffBat: 6, boundary: 6 }));
    let { events } = build([...eight, { striker: "s1", runsOffBat: 2 }], 1);
    assert.deepEqual(types(events), ["FIFTY"]);
    assert.equal(events[0].batter.runs, 50);
    assert.equal(events[0].batter.photo, "/p/s1");
    ({ events } = build([...eight.slice(0, 7), { striker: "s1", runsOffBat: 6, boundary: 6 }, { striker: "s1", runsOffBat: 6, boundary: 6 }], 1));
    assert.deepEqual(types(events), ["SIX", "FIFTY"]);
    assert.equal(events[0].milestone, "FIFTY", "the SIX shows its MAXIMUM variant");
  });

  test("hat-trick: three bowler wickets on his consecutive legal balls, a wide in between is fine", () => {
    const { balls, events } = build([
      { striker: "s1", wicket: { type: "bowled", playerOut: "s1" } },
      { striker: "s3", extrasType: "wide", extraRuns: 1 },
      { striker: "s3", wicket: { type: "caught", playerOut: "s3", fielders: ["f1"] } },
      { striker: "s4", wicket: { type: "lbw", playerOut: "s4" } },
    ]);
    assert.equal(isHatTrick(balls, 3), true);
    assert.deepEqual(types(events), ["WICKET", "WICKET", "HATTRICK"]);
    const hat = events[2];
    assert.equal(hat.team, "Strikers");
    assert.equal(hat.bowler.figures, "0.3-0-1-3");
  });

  test("a run out does not count towards a hat-trick", () => {
    const { balls } = build([
      { striker: "s1", wicket: { type: "bowled", playerOut: "s1" } },
      { striker: "s3", wicket: { type: "run_out", playerOut: "s3" } },
      { striker: "s4", wicket: { type: "bowled", playerOut: "s4" } },
    ]);
    assert.equal(isHatTrick(balls, 2), false);
  });

  test("a no-ball brings a FREE_HIT banner", () => {
    const { events } = build([{ striker: "s1", extrasType: "noball", extraRuns: 1, runsOffBat: 1 }]);
    assert.deepEqual(types(events), ["FREE_HIT"]);
    assert.equal(events[0].id, "1-1-fh");
  });

  test("the last ball of an innings gets no over summary", () => {
    const opts1 = { config: { overs: 1, playersPerSide: 11 } };
    const raw = Array.from({ length: 6 }, (_, i) => ({ seq: i + 1, striker: "s1", nonStriker: "ns", bowler: "b1", runsOffBat: 0 }));
    const state = replayInnings(raw, opts1);
    const events = overlayEvents({
      balls: state.balls,
      replayUpTo: (n) => replayInnings(raw.slice(0, n), opts1),
      number: 1, battingTeam: "K", bowlingTeam: "S", nameOf: (x) => x, photoOf: () => null, timeOf: () => null, limit: 1,
    });
    assert.deepEqual(events, []);
  });
});

describe("overlay effects queue", () => {
  const at = (s) => new Date(Date.UTC(2026, 10, 16, 10, 0, s)).toISOString();
  const ev = (id, type, s) => ({ id, type, at: at(s) });
  const snapshot = (events, s) => ({ events, serverTime: at(s) });

  test("each event plays once", () => {
    const seen = new Set();
    const snap = snapshot([ev("1-4", "FOUR", 0)], 2);
    const first = eventsToPlay(snap, seen);
    assert.deepEqual(first.map((e) => e.id), ["1-4"]);
    first.forEach((e) => seen.add(e.id));
    assert.deepEqual(eventsToPlay(snap, seen), []);
  });

  test("stale events (over 10 s old on the server clock) are skipped", () => {
    assert.equal(isFresh(ev("a", "SIX", 0), at(9)), true);
    assert.equal(isFresh(ev("a", "SIX", 0), at(11)), false);
    assert.deepEqual(eventsToPlay(snapshot([ev("a", "SIX", 0), ev("b", "FOUR", 5)], 12), new Set()).map((e) => e.id), ["b"]);
  });

  test("URL switches: effects=off, fx list, unknown types", () => {
    const snap = snapshot([ev("a", "FOUR", 0), ev("b", "SIX", 0), ev("c", "WICKET", 0), ev("d", "PARTY", 0)], 1);
    assert.deepEqual(eventsToPlay(snap, new Set(), { effects: false }), []);
    assert.deepEqual(eventsToPlay(snap, new Set(), { fx: ["wicket"] }).map((e) => e.id), ["c"]);
    assert.deepEqual(eventsToPlay(snap, new Set()).map((e) => e.id), ["a", "b", "c"]);
  });

  test("the waiting line keeps only the newest three", () => {
    assert.deepEqual(enqueue(["a", "b"], ["c", "d"]), ["b", "c", "d"]);
    assert.deepEqual(enqueue([], ["a"]), ["a"]);
  });

  test("after a reload, events already on screen are marked seen, not replayed", () => {
    const seen = markSeen(new Set(), snapshot([ev("1-9", "WICKET", 0)], 1));
    assert.deepEqual(eventsToPlay(snapshot([ev("1-9", "WICKET", 0), ev("1-10", "FOUR", 2)], 3), seen).map((e) => e.id), ["1-10"]);
    const big = new Set(Array.from({ length: 250 }, (_, i) => `x-${i}`));
    markSeen(big, snapshot([], 0), 200);
    assert.equal(big.size, 200);
    assert.ok(big.has("x-249") && !big.has("x-0"), "keeps the most recent ids");
  });
});

describe("overlay delay buffer", () => {
  const snap = (runs, serverTime = "t") => ({ score: runs, serverTime });

  test("no delay: always the latest snapshot", () => {
    let buffer = pushSnapshot([], snap(1), 0);
    buffer = pushSnapshot(buffer, snap(2), 1000);
    const { shown, buffer: rest } = pickSnapshot(buffer, 1000, 0);
    assert.equal(shown.data.score, 2);
    assert.equal(rest.length, 1, "older snapshots are dropped");
  });

  test("with a delay, new data appears only after the delay; the first snapshot shows at once", () => {
    let buffer = pushSnapshot([], snap(10), 0);
    let r = pickSnapshot(buffer, 0, 5000);
    assert.equal(r.shown.data.score, 10, "never blank on start-up");
    buffer = pushSnapshot(r.buffer, snap(14), 1000);
    r = pickSnapshot(buffer, 3000, 5000);
    assert.equal(r.shown.data.score, 10, "new score held back");
    r = pickSnapshot(r.buffer, 6000, 5000);
    assert.equal(r.shown.data.score, 14, "new score shown 5 s after it arrived");
    assert.equal(r.buffer.length, 1);
  });

  test("several updates inside the delay play back in order", () => {
    let buffer = [];
    for (const [runs, at] of [[1, 0], [2, 1000], [6, 2000], [7, 3000]]) buffer = pushSnapshot(buffer, snap(runs), at);
    const shownAt = (now) => pickSnapshot(buffer, now, 4000).shown.data.score;
    assert.deepEqual([shownAt(4000), shownAt(5000), shownAt(6500), shownAt(7000)], [1, 2, 6, 7]);
  });

  test("unchanged data (only serverTime differs) is not buffered twice", () => {
    let buffer = pushSnapshot([], snap(5, "a"), 0);
    buffer = pushSnapshot(buffer, snap(5, "b"), 1000);
    assert.equal(buffer.length, 1);
    assert.equal(snapshotKey(snap(5, "a")), snapshotKey(snap(5, "z")));
    assert.equal(pickSnapshot([], 0, 0).shown, null);
  });

  test("poll back-off after failures", () => {
    assert.deepEqual([0, 1, 2, 3, 9].map((f) => nextPollDelay(2000, f)), [2000, 4000, 8000, 10000, 10000]);
  });
});

describe("overlay URL parameters", () => {
  test("defaults", () => {
    const p = parseOverlayParams({});
    assert.deepEqual(
      [p.theme, p.position, p.layout, p.width, p.height, p.scale, p.bg, p.delay, p.pollMs, p.sponsors, p.effects, p.lite, p.lang, p.debug, p.demo, p.sound],
      ["mpl", "bottom", "landscape", 1920, 1080, 1, "transparent", 0, 2000, true, true, false, "en", false, false, false]
    );
    assert.deepEqual(p.fx, EFFECT_KEYS);
  });

  test("valid values are read, case-insensitive, arrays take the first value", () => {
    const p = parseOverlayParams({
      theme: "Dark", position: "TOP", scale: "0.75", delay: "6", bg: "chroma", sponsors: "off",
      effects: "off", lite: "1", lang: "ur", debug: "true", w: ["1280", "999"], h: "720", fx: "four, six,bogus",
    });
    assert.deepEqual(
      [p.theme, p.position, p.scale, p.delay, p.bg, p.sponsors, p.effects, p.lite, p.lang, p.debug, p.width, p.height],
      ["dark", "top", 0.75, 6, "chroma", false, false, true, "ur", true, 1280, 720]
    );
    assert.deepEqual(p.fx, ["four", "six"]);
    assert.equal(p.pollMs, 3500, "lite mode polls less often");
  });

  test("garbage and out-of-range values fall back or clamp", () => {
    const p = parseOverlayParams({ theme: "neon", scale: "99", delay: "-5", bg: "pink", w: "abc", poll: "0.1", position: "left" });
    assert.deepEqual([p.theme, p.scale, p.delay, p.bg, p.width, p.pollMs, p.position], ["mpl", 3, 0, "transparent", 1920, 1000, "bottom"]);
  });

  test("portrait layout defaults to a 1080x1920 canvas unless sized explicitly", () => {
    assert.deepEqual([parseOverlayParams({ layout: "portrait" }).width, parseOverlayParams({ layout: "portrait" }).height], [1080, 1920]);
    const sized = parseOverlayParams({ layout: "portrait", w: "720", h: "1280" });
    assert.deepEqual([sized.width, sized.height], [720, 1280]);
  });
});

describe("fitting the canvas to the web source", () => {
  test("same aspect ratio fills exactly", () => {
    assert.deepEqual(fitCanvas({ viewportWidth: 1280, viewportHeight: 720, width: 1920, height: 1080 }), { scale: 1280 / 1920, left: 0, top: 0 });
  });

  test("a portrait phone source letterboxes a landscape canvas", () => {
    const fit = fitCanvas({ viewportWidth: 1080, viewportHeight: 1920, width: 1920, height: 1080 });
    assert.equal(fit.scale, 1080 / 1920);
    assert.equal(fit.left, 0);
    assert.equal(fit.top, Math.round((1920 - 1080 * (1080 / 1920)) / 2));
  });

  test("the operator scale multiplies the fit and stays centred", () => {
    const fit = fitCanvas({ viewportWidth: 1920, viewportHeight: 1080, width: 1920, height: 1080, scale: 0.5 });
    assert.deepEqual(fit, { scale: 0.5, left: 480, top: 270 });
  });
});

describe("operator control", async () => {
  const { controlEvents, lastHighlight, publicControl, replayEvent, resolveScreen } = await import("../lib/overlay/control.js");
  const { canShowScreen } = await import("../lib/overlay/screens.js");

  test("publicControl falls back to automatic", () => {
    assert.deepEqual(publicControl(null), { screen: "auto", panel: "none", sponsors: true });
    assert.deepEqual(publicControl({ screen: "bogus", panel: "partnership", sponsors: false }), { screen: "auto", panel: "partnership", sponsors: false });
  });

  test("resolveScreen: auto follows the match, none hides, others force", () => {
    assert.equal(resolveScreen({ screen: "auto" }, "break"), "break");
    assert.equal(resolveScreen({ screen: "auto" }, null), null);
    assert.equal(resolveScreen({ screen: "none" }, "result"), null);
    assert.equal(resolveScreen({ screen: "scorecard" }, null), "scorecard");
    assert.equal(resolveScreen(undefined, "comingUp"), "comingUp");
  });

  test("lastHighlight picks the newest four, six or wicket", () => {
    const events = [{ type: "SIX", id: "1" }, { type: "WICKET", id: "2" }, { type: "OVER", id: "3" }, { type: "FIFTY", id: "4" }];
    assert.equal(lastHighlight(events).id, "2");
    assert.equal(lastHighlight([{ type: "OVER" }]), null);
  });

  test("replayEvent copies the moment with a new id, REPLAY flag and request time", () => {
    const r = replayEvent({ type: "SIX", id: "1-5", at: "2026-11-16T10:00:00.000Z", batter: { name: "A" } }, { id: "abc", at: "2026-11-16T10:05:00.000Z" });
    assert.equal(r.id, "replay-abc");
    assert.equal(r.replay, true);
    assert.equal(r.at, "2026-11-16T10:05:00.000Z");
    assert.equal(r.batter.name, "A");
    assert.equal(replayEvent(null, { id: "x", at: "y" }), null);
  });

  test("controlEvents: recent one-shots only", () => {
    const now = Date.parse("2026-11-16T10:00:30.000Z");
    const doc = {
      replay: { id: "r1", at: new Date("2026-11-16T10:00:25.000Z") },
      card: { id: "c1", player: "p1", at: new Date("2026-11-16T10:00:28.000Z") },
    };
    const events = controlEvents({ doc, now, highlight: { type: "FOUR", id: "1-2" }, playerCard: (id) => ({ batter: { id, name: "P" }, team: "Kings" }) });
    assert.deepEqual(events.map((e) => [e.type, e.id]), [["FOUR", "replay-r1"], ["PLAYER_CARD", "card-c1"]]);
    const later = controlEvents({ doc, now: now + 60000, highlight: { type: "FOUR" }, playerCard: () => ({}) });
    assert.equal(later.length, 0);
    assert.deepEqual(controlEvents({ doc: null, highlight: null, playerCard: () => null }), []);
    // A player outside the XIs gives no card; no highlight gives no replay.
    assert.equal(controlEvents({ doc, now, highlight: null, playerCard: () => null }).length, 0);
  });

  test("canShowScreen skips screens without their data", () => {
    const base = { match: { id: "m" } };
    assert.equal(canShowScreen("break", { ...base, performers: [] }), false);
    assert.equal(canShowScreen("break", { ...base, performers: [{ number: 1 }], innings: [{ number: 1, complete: false }] }), false);
    assert.equal(canShowScreen("break", { ...base, performers: [{ number: 1 }], innings: [{ number: 1, complete: true }] }), true);
    assert.equal(canShowScreen("scorecard", { ...base, scorecard: null }), false);
    assert.equal(canShowScreen("preMatch", { ...base, squads: [{ players: [] }, { players: [] }] }), false);
    assert.equal(canShowScreen("result", base), true);
    assert.equal(canShowScreen("pointsTable", { ...base, pointsTable: null }), false);
    assert.equal(canShowScreen("pointsTable", { ...base, pointsTable: [{ team: "A" }] }), true);
    assert.equal(canShowScreen(null, base), false);
  });
});

describe("layout offsets", async () => {
  const { fromBarEdge, stackOffsets } = await import("../lib/overlay/layout.js");
  test("landscape keeps the phase 5-8 positions", () => {
    assert.deepEqual(stackOffsets({ height: 1080, layout: "landscape" }), { over: 274, panel: 264, card: 454 });
  });
  test("portrait clears the taller stacked bar, card above the panel", () => {
    const o = stackOffsets({ height: 1920, layout: "portrait" });
    assert.ok(o.panel >= 96 + 412, "panel above the bar");
    assert.ok(o.card - o.panel >= 260, "card above the panel");
  });
  test("fromBarEdge follows the bar position", () => {
    assert.deepEqual(fromBarEdge({ position: "top" }, 10), { top: 10 });
    assert.deepEqual(fromBarEdge({}, 10), { bottom: 10 });
  });
});

describe("highlights log", async () => {
  const { highlightText, highlightsCsv, toHighlightRows, videoTime } = await import("../lib/overlay/highlights.js");
  const events = [
    { id: "1-1", type: "FOUR", innings: 1, overBall: "0.1", score: "4/0", at: "2026-11-16T10:00:20.000Z", batter: { name: "Sudais", runs: 4, balls: 1 }, bowler: { name: "Hamza" } },
    { id: "1-2-over", type: "OVER", innings: 1, overBall: "0.6" },
    { id: "1-3", type: "WICKET", innings: 1, overBall: "1.1", score: "9/1", at: "2026-11-16T10:05:00.000Z", batter: { name: "Sudais", runs: 6, balls: 3 }, wicket: { text: "c Imran, b Hamza" } },
    { id: "1-4-ms", type: "FIFTY", innings: 1, overBall: "5.2", at: null, batter: { name: "Babar", runs: 52, balls: 30 } },
  ];
  test("keeps only highlight types, with a readable line", () => {
    const rows = toHighlightRows(events);
    assert.deepEqual(rows.map((r) => r.type), ["FOUR", "WICKET", "FIFTY"]);
    assert.equal(rows[0].text, "Sudais · off Hamza");
    assert.equal(rows[1].text, "Sudais · c Imran, b Hamza · 6 (3)");
    assert.equal(rows[2].text, "Babar · 52 (30)");
    assert.equal(highlightText({ type: "SIX", batter: { name: "A" }, milestone: "FIFTY" }), "A · brings up 50");
  });
  test("videoTime: offset from the stream start minus the lead", () => {
    assert.equal(videoTime("2026-11-16T10:05:00.000Z", "2026-11-16T10:00:00.000Z", 10), "0:04:50");
    assert.equal(videoTime("2026-11-16T11:30:05.000Z", "2026-11-16T10:00:00.000Z", 0), "1:30:05");
    assert.equal(videoTime("2026-11-16T10:00:04.000Z", "2026-11-16T10:00:00.000Z", 10), "0:00:00");
    assert.equal(videoTime("2026-11-16T09:59:00.000Z", "2026-11-16T10:00:00.000Z"), null);
    assert.equal(videoTime(null, "2026-11-16T10:00:00.000Z"), null);
    assert.equal(videoTime("2026-11-16T10:05:00.000Z", null), null);
  });
  test("CSV with quoting", () => {
    const csv = highlightsCsv(toHighlightRows(events), { streamStartedAt: "2026-11-16T10:00:00.000Z", leadSeconds: 10, formatTime: (iso) => (iso ? iso.slice(11, 19) : "") });
    const lines = csv.split("\n");
    assert.equal(lines[0], "Video time,Clock time,Innings,Over,Event,Details,Score");
    assert.equal(lines[1], "0:00:10,10:00:20,1,0.1,Four,Sudais · off Hamza,4/0");
    assert.equal(lines[2], '0:04:50,10:05:00,1,1.1,Wicket,"Sudais · c Imran, b Hamza · 6 (3)",9/1');
    assert.equal(lines[3], ",,1,5.2,Fifty,Babar · 52 (30),");
  });
});
