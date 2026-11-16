// Public, read-only views of a match for /match/[id]: live score, full
// scorecard and ball-by-ball commentary. Everything is replayed from the
// Ball documents; only player names and roles leave the server (never phone,
// CNIC or other registration details).

import mongoose from "mongoose";
import Match from "@/models/Match";
import Innings from "@/models/Innings";
import Ball from "@/models/Ball";
import Registration from "@/models/Registration";
import Team from "@/models/Team";
import { serializeMatch } from "@/lib/matches";
import { computeResult, dismissalText } from "@/lib/scoring";
import { replayFor } from "@/lib/scoringServer";
import { newBatterEvents, overlayEvents } from "@/lib/overlay/events";

export const COMMENTARY_PAGE_SIZE = 30;

// Short CDN cache: many viewers polling a live match share one database read.
export function cacheHeaders(match) {
  const live = match?.scoringStatus === "in_progress" || match?.status === "live";
  return {
    "Cache-Control": live
      ? "public, max-age=0, s-maxage=3, stale-while-revalidate=10"
      : "public, max-age=0, s-maxage=10, stale-while-revalidate=20",
  };
}

function idOf(value) {
  return value ? String(value) : null;
}

// Loads the match and replays every innings. Returns null if not found.
export async function loadPublicMatch(matchId, { withBalls = true } = {}) {
  if (!mongoose.isValidObjectId(String(matchId || ""))) return null;
  const match = await Match.findById(matchId).lean();
  if (!match) return null;

  const scored = match.scoringStatus && match.scoringStatus !== "not_started";
  const [inningsDocs, balls, players, teams] = await Promise.all([
    scored ? Innings.find({ match: match._id }).sort({ number: 1 }).lean() : [],
    scored && withBalls ? Ball.find({ match: match._id }).sort({ innings: 1, seq: 1 }).lean() : [],
    scored
      ? Registration.find({ _id: { $in: [...(match.playingXI?.teamA || []), ...(match.playingXI?.teamB || [])] } })
          .select("playerName playingRole")
          .lean()
      : [],
    Team.find({ name: { $in: [match.teamA, match.teamB] } }).select("name captain viceCaptain").lean(),
  ]);

  const names = new Map(players.map((p) => [String(p._id), p.playerName]));
  const roles = new Map(players.map((p) => [String(p._id), p.playingRole || ""]));
  const nameOf = (id) => (id ? names.get(String(id)) || "Unknown" : "");

  const innings = inningsDocs.map((doc) => {
    const docBalls = balls.filter((b) => b.innings === doc.number);
    return { doc, balls: docBalls, state: replayFor(match, doc, docBalls) };
  });

  return { match, innings, nameOf, roles, teams, scored };
}

function inningsHeader({ doc, state }, match) {
  const quota = doc.maxOvers || match.overs || null;
  return {
    number: doc.number,
    battingTeam: doc.battingTeam,
    bowlingTeam: doc.bowlingTeam,
    runs: state.runs,
    wickets: state.wickets,
    overs: state.overs,
    quotaOvers: quota,
    target: doc.target ?? null,
    targetRevised: Boolean(doc.targetRevised),
    complete: doc.status === "completed" || state.complete,
    endReason: doc.endReason || state.endReason || "",
  };
}

// Structured result / situation so the page can translate it.
function situationOf(data) {
  const { match, innings } = data;
  if (match.scoringStatus === "completed") {
    const second = innings.find((i) => i.doc.number === 2);
    const first = innings.find((i) => i.doc.number === 1);
    // Use the stored result when present, otherwise work it out from the balls.
    let info = match.resultInfo || {};
    if (!info.outcome) {
      info =
        computeResult({
          abandoned: match.status === "abandoned",
          first: first && { ...first.state, team: first.doc.battingTeam },
          second: second && { ...second.state, team: second.doc.battingTeam, complete: true },
          revisedTarget: Boolean(second?.doc.targetRevised),
        }) || {};
    }
    const ballsLeft =
      info.marginType === "wickets" && second ? Math.max(0, second.state.quotaBalls - second.state.legalBalls) : null;
    return {
      type: "result",
      outcome: info.outcome || "",
      winner: info.winner || "",
      margin: info.margin ?? null,
      marginType: info.marginType || "",
      ballsLeft,
      revised: Boolean(second?.doc.targetRevised),
      text: match.result || "",
    };
  }
  const current = innings.find((i) => i.doc.number === match.currentInnings);
  if (!current) return { type: "toss", winner: match.toss?.winner || "", decision: match.toss?.decision || "" };
  if (current.doc.number === 2 && !current.state.complete) {
    return {
      type: "chase",
      team: current.doc.battingTeam,
      runs: current.state.runsNeeded,
      balls: current.state.ballsRemaining,
    };
  }
  if (current.doc.number === 1 && (current.state.complete || current.doc.status === "completed")) {
    return { type: "break", team: current.doc.bowlingTeam, target: current.state.runs + 1 };
  }
  return { type: "toss", winner: match.toss?.winner || "", decision: match.toss?.decision || "" };
}

function batterLine(state, id, nameOf) {
  if (!id) return null;
  const b = state.batters.find((x) => x.id === String(id)) || { runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: 0 };
  return { id: String(id), name: nameOf(id), runs: b.runs, balls: b.balls, fours: b.fours, sixes: b.sixes, strikeRate: b.strikeRate };
}

function bowlerLine(state, id, nameOf) {
  if (!id) return null;
  const b = state.bowlers.find((x) => x.id === String(id));
  return {
    id: String(id),
    name: nameOf(id),
    overs: b ? b.overs : "0.0",
    maidens: b ? b.maidens : 0,
    runs: b ? b.runs : 0,
    wickets: b ? b.wickets : 0,
    economy: b ? b.economy : 0,
  };
}

function matchInfo(data) {
  const { match, scored } = data;
  return {
    ...serializeMatch(match),
    scored,
    scoringStatus: match.scoringStatus || "not_started",
    currentInnings: match.currentInnings || 0,
    toss: { winner: match.toss?.winner || "", decision: match.toss?.decision || "" },
    overs: match.overs ?? null,
  };
}

// GET /api/matches/[id]/live
export function buildLive(data) {
  const { match, innings, nameOf } = data;
  const current = innings.find((i) => i.doc.number === match.currentInnings) || innings[innings.length - 1] || null;

  let now = null;
  if (current) {
    const { doc, state } = current;
    const thisOverStart = state.balls.length
      ? state.balls.findIndex((b) => b.over === state.balls[state.balls.length - 1].over)
      : 0;
    now = {
      inningsNumber: doc.number,
      battingTeam: doc.battingTeam,
      bowlingTeam: doc.bowlingTeam,
      striker: batterLine(state, doc.striker, nameOf),
      nonStriker: batterLine(state, doc.nonStriker, nameOf),
      bowler: bowlerLine(state, doc.bowler || state.lastOverBowler, nameOf),
      recentBalls: state.balls.slice(-6).map((b) => ({ id: `${doc.number}-${b.seq}`, label: b.label, over: b.over, legal: b.legal })),
      thisOver: state.balls.slice(Math.max(0, thisOverStart)).map((b) => b.label),
      runRate: state.runRate,
      requiredRate: state.requiredRate,
      runsNeeded: state.runsNeeded,
      ballsRemaining: state.ballsRemaining,
      partnership: { runs: state.currentPartnership.runs, balls: state.currentPartnership.balls },
      freeHit: state.freeHit && !state.complete,
      lastWicket: state.fallOfWickets.length
        ? (() => {
            const fow = state.fallOfWickets[state.fallOfWickets.length - 1];
            const b = state.batters.find((x) => x.id === fow.player);
            return { name: nameOf(fow.player), runs: b?.runs ?? 0, balls: b?.balls ?? 0, score: `${fow.runs}/${fow.wicket}`, overs: fow.overs };
          })()
        : null,
    };
  }

  return {
    match: matchInfo(data),
    innings: innings.filter((i) => i.doc.number <= 2).map((i) => inningsHeader(i, match)),
    situation: situationOf(data),
    now,
    updatedAt: match.updatedAt,
  };
}

// GET /api/matches/[id]/scorecard
export function buildScorecard(data) {
  const { match, innings, nameOf } = data;
  const xiOf = (team) => (team === match.teamA ? match.playingXI?.teamA : match.playingXI?.teamB) || [];

  const cards = innings
    .filter((i) => i.doc.number <= 2)
    .map((inn) => {
      const { doc, state } = inn;
      const batted = new Set(state.batters.map((b) => b.id));
      // "batting" only while the innings is still going; afterwards they are "not out".
      const inningsOver = doc.status === "completed" || state.complete || match.scoringStatus === "completed";
      const atCrease = new Set(inningsOver ? [] : [idOf(doc.striker), idOf(doc.nonStriker)].filter(Boolean));
      return {
        ...inningsHeader(inn, match),
        batting: state.batters.map((b) => ({
          id: b.id,
          name: nameOf(b.id),
          dismissal: b.out || b.retiredHurt ? dismissalText(b.dismissal, nameOf) : "",
          out: b.out,
          atCrease: atCrease.has(b.id) && !b.out,
          runs: b.runs,
          balls: b.balls,
          fours: b.fours,
          sixes: b.sixes,
          strikeRate: b.strikeRate,
        })),
        didNotBat: xiOf(doc.battingTeam)
          .map(String)
          .filter((id) => !batted.has(id))
          .map((id) => ({ id, name: nameOf(id) })),
        extras: state.extras,
        runRate: state.runRate,
        fallOfWickets: state.fallOfWickets.map((f) => ({ ...f, name: nameOf(f.player) })),
        bowling: state.bowlers.map((b) => ({
          id: b.id,
          name: nameOf(b.id),
          overs: b.overs,
          maidens: b.maidens,
          runs: b.runs,
          wickets: b.wickets,
          wides: b.wides,
          noballs: b.noballs,
          dots: b.dots,
          economy: b.economy,
        })),
      };
    });

  return { match: matchInfo(data), situation: situationOf(data), innings: cards, squads: buildSquads(data) };
}

export function buildSquads(data) {
  const { match, nameOf, roles, teams } = data;
  const teamDoc = (name) => teams.find((t) => t.name === name) || {};
  const side = (name, ids) => {
    const t = teamDoc(name);
    return {
      team: name,
      players: (ids || []).map(String).map((id) => ({
        id,
        name: nameOf(id),
        role: roles.get(id) || "",
        captain: String(t.captain || "") === id,
        viceCaptain: String(t.viceCaptain || "") === id,
      })),
    };
  };
  return [side(match.teamA, match.playingXI?.teamA), side(match.teamB, match.playingXI?.teamB)];
}

// GET /api/matches/[id]/commentary?cursor=<innings>-<seq>
// Newest first. `cursor` is the last item of the previous page; the next
// page continues before it. Also marks the ball that ended each over.
export function buildCommentary(data, cursor) {
  const { match, innings } = data;
  const [cursorInnings, cursorSeq] = String(cursor || "")
    .split("-")
    .map((part) => Number(part));
  const hasCursor = Number.isFinite(cursorInnings) && Number.isFinite(cursorSeq) && cursorInnings > 0;

  const items = [];
  for (const inn of innings) {
    const docBySeq = new Map(inn.balls.map((b) => [b.seq, b]));
    inn.state.balls.forEach((ball) => {
      const doc = docBySeq.get(ball.seq);
      const overEnded = ball.legal && ball.scoreAfter.legalBalls % 6 === 0;
      items.push({
        id: `${inn.doc.number}-${ball.seq}`,
        innings: inn.doc.number,
        seq: ball.seq,
        battingTeam: inn.doc.battingTeam,
        overBall: `${ball.over}.${ball.ballInOver}`,
        label: ball.label,
        runs: ball.totalRuns,
        wicket: Boolean(ball.wicket && ball.wicket.type !== "retired_hurt"),
        boundary: ball.boundary || null,
        freeHit: ball.freeHit,
        text: doc?.commentary || "",
        score: `${ball.scoreAfter.runs}/${ball.scoreAfter.wickets}`,
        overEnd: overEnded
          ? {
              over: ball.scoreAfter.legalBalls / 6,
              runs: inn.state.overSummaries[ball.over]?.runs ?? 0,
              score: `${ball.scoreAfter.runs}/${ball.scoreAfter.wickets}`,
            }
          : null,
      });
    });
  }

  items.sort((a, b) => b.innings - a.innings || b.seq - a.seq);
  const start = hasCursor
    ? items.findIndex((i) => i.innings < cursorInnings || (i.innings === cursorInnings && i.seq < cursorSeq))
    : 0;
  const page = start < 0 ? [] : items.slice(start, start + COMMENTARY_PAGE_SIZE);
  const last = page[page.length - 1];
  const more = start >= 0 && start + COMMENTARY_PAGE_SIZE < items.length;

  return {
    match: { id: String(match._id), scoringStatus: match.scoringStatus || "not_started" },
    items: page,
    nextCursor: more && last ? `${last.innings}-${last.seq}` : null,
    total: items.length,
  };
}

// ---------------------------------------------------------------- overlay events

// Recent broadcast moments (FOUR, SIX, WICKET, FIFTY / HUNDRED, FREE_HIT,
// OVER / MAIDEN, HATTRICK) for the overlay's effects. Figures are as they
// stood right after each ball; see lib/overlay/events.js.
export function buildOverlayEvents(data, { limit = 3 } = {}) {
  const { match, innings, nameOf } = data;
  const current = innings.find((i) => i.doc.number === match.currentInnings) || innings[innings.length - 1];
  if (!current) return [];
  const times = new Map(current.balls.map((b) => [b.seq, b.createdAt ? new Date(b.createdAt).toISOString() : null]));
  const common = {
    balls: current.state.balls,
    replayUpTo: (count) => replayFor(match, current.doc, current.balls.slice(0, count)),
    number: current.doc.number,
    battingTeam: current.doc.battingTeam,
    nameOf,
    photoOf: (id) => `/api/players/${id}/photo`,
  };
  const live = match.scoringStatus === "in_progress" && current.doc.status !== "completed";
  return [
    ...overlayEvents({ ...common, bowlingTeam: current.doc.bowlingTeam, timeOf: (seq) => times.get(seq) || null, limit }),
    ...(live
      ? newBatterEvents({
          ...common,
          crease: [current.doc.striker, current.doc.nonStriker],
          creaseAt: current.doc.updatedAt ? new Date(current.doc.updatedAt).toISOString() : null,
          roleOf: (id) => data.roles.get(String(id)) || "",
        })
      : []),
  ];
}

// Extra data for the overlay's full-screen screens: both playing XIs (with
// photo addresses), each innings' top two batters and bowlers, and the
// player of the match. That is entered by name in the admin form, so it is
// matched to a playing-XI player to find a photo.
export function buildOverlayExtras(data) {
  const { match, innings, nameOf } = data;
  const photo = (id) => (id ? `/api/players/${id}/photo` : null);

  const squads = buildSquads(data).map((side) => ({
    ...side,
    players: side.players.map((p) => ({ ...p, photo: photo(p.id) })),
  }));

  const performers = innings
    .filter((inn) => inn.doc.number <= 2)
    .map(({ doc, state }) => ({
      number: doc.number,
      battingTeam: doc.battingTeam,
      bowlingTeam: doc.bowlingTeam,
      runs: state.runs,
      wickets: state.wickets,
      overs: state.overs,
      batters: [...state.batters]
        .filter((b) => b.balls > 0 || b.runs > 0)
        .sort((a, b) => b.runs - a.runs || a.balls - b.balls)
        .slice(0, 2)
        .map((b) => ({ id: b.id, name: nameOf(b.id), runs: b.runs, balls: b.balls, out: b.out, photo: photo(b.id) })),
      bowlers: [...state.bowlers]
        .filter((b) => b.legalBalls > 0)
        .sort((a, b) => b.wickets - a.wickets || a.runs - b.runs)
        .slice(0, 2)
        .map((b) => ({ id: b.id, name: nameOf(b.id), wickets: b.wickets, runs: b.runs, overs: b.overs, photo: photo(b.id) })),
    }));

  const motmName = (match.manOfTheMatch?.name || "").trim();
  let motm = null;
  if (motmName) {
    const everyone = squads.flatMap((s) => s.players);
    const found = everyone.find((p) => p.name.trim().toLowerCase() === motmName.toLowerCase());
    motm = {
      name: motmName,
      team: match.manOfTheMatch?.team || "",
      performance: match.manOfTheMatch?.performance || "",
      photo: found ? found.photo : null,
    };
  }

  return { squads, performers, motm };
}
