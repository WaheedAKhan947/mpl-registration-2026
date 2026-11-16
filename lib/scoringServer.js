// Server-side glue between the scoring engine (lib/scoring.js) and MongoDB.
// API routes stay thin: they authenticate, call into here, and return JSON.

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { verifyScoringSessionToken, canManageScoring, SESSION_COOKIE_NAME } from "@/lib/auth";
import {
  buildPlayerMatchStats,
  inningsSummary,
  liveSituation,
  normalizeBall,
  replayInnings,
  resolveConfig,
} from "@/lib/scoring";
import Match from "@/models/Match";
import Innings from "@/models/Innings";
import Ball from "@/models/Ball";
import Registration from "@/models/Registration";
import PlayerMatchStats from "@/models/PlayerMatchStats";

export const MIN_XI = 2;
export const MAX_XI = 15;
export const OVER_PRESETS = [5, 6, 8, 10, 12, 15, 20];

// Session for scoring routes: owners, admins and scorers.
export function getScoringSession() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  return verifyScoringSessionToken(token);
}

// A match can name its scorers; when it does, scorer accounts outside that
// list are turned away. Owners and admins can always score.
export function canScoreMatch(session, match) {
  if (!session) return false;
  if (canManageScoring(session)) return true;
  const allowed = (match?.scorers || []).map(String);
  return allowed.length === 0 || allowed.includes(String(session.sub));
}

export function isObjectId(value) {
  return typeof value === "string" && mongoose.isValidObjectId(value);
}

// "teamA" | "teamB" for a team name in this match.
export function sideOf(match, team) {
  if (team === match.teamA) return "teamA";
  if (team === match.teamB) return "teamB";
  return null;
}

export function otherTeam(match, team) {
  return team === match.teamA ? match.teamB : match.teamA;
}

export function xiFor(match, team) {
  const side = sideOf(match, team);
  return side ? (match.playingXI?.[side] || []).map(String) : [];
}

// Engine config for an innings: the batting side's XI size decides when it is all out.
export function scoringConfigFor(match, battingTeam) {
  const saved = match.scoringConfig || {};
  return resolveConfig({
    overs: match.overs,
    playersPerSide: xiFor(match, battingTeam).length || 11,
    widePenalty: saved.widePenalty ?? 1,
    noBallPenalty: saved.noBallPenalty ?? 1,
    maxOversPerBowler: saved.maxOversPerBowler || undefined,
    lastManStands: Boolean(saved.lastManStands),
  });
}

export function replayFor(match, inningsDoc, balls) {
  return replayInnings(balls, {
    config: scoringConfigFor(match, inningsDoc.battingTeam),
    target: inningsDoc.target,
    maxOvers: inningsDoc.maxOvers || undefined,
    striker: inningsDoc.striker,
    nonStriker: inningsDoc.nonStriker,
    bowler: inningsDoc.bowler,
  });
}

function idOrNull(value) {
  return value ? String(value) : null;
}

function serializeBall(ball) {
  return {
    id: String(ball._id),
    clientId: ball.clientId,
    innings: ball.innings,
    seq: ball.seq,
    over: ball.over,
    ballInOver: ball.ballInOver,
    legal: ball.legal,
    freeHit: ball.freeHit,
    striker: idOrNull(ball.striker),
    nonStriker: idOrNull(ball.nonStriker),
    bowler: idOrNull(ball.bowler),
    bowlerChange: Boolean(ball.bowlerChange),
    runsOffBat: ball.runsOffBat,
    extrasType: ball.extrasType || null,
    extraRuns: ball.extraRuns,
    boundary: ball.boundary || null,
    wicket: ball.wicket
      ? {
          type: ball.wicket.type,
          playerOut: idOrNull(ball.wicket.playerOut),
          fielders: (ball.wicket.fielders || []).map(String),
        }
      : null,
    commentary: ball.commentary || "",
  };
}

export function serializeScoringMatch(match) {
  const saved = match.scoringConfig || {};
  return {
    id: String(match._id),
    matchNumber: match.matchNumber ?? null,
    date: match.date,
    time: match.time || "",
    venue: match.venue || "",
    teamA: match.teamA,
    teamB: match.teamB,
    status: match.status || "upcoming",
    result: match.result || "",
    scoringStatus: match.scoringStatus || "not_started",
    currentInnings: match.currentInnings || 0,
    overs: match.overs ?? null,
    toss: { winner: match.toss?.winner || "", decision: match.toss?.decision || "" },
    playingXI: {
      teamA: (match.playingXI?.teamA || []).map(String),
      teamB: (match.playingXI?.teamB || []).map(String),
    },
    scoringConfig: {
      widePenalty: saved.widePenalty ?? 1,
      noBallPenalty: saved.noBallPenalty ?? 1,
      maxOversPerBowler: saved.maxOversPerBowler ?? null,
      lastManStands: Boolean(saved.lastManStands),
    },
  };
}

// Everything the scoring screens need for one match, in one response:
// the match, every player who could appear (both squads), and each innings
// replayed from its balls.
export async function loadScoringState(matchId) {
  const match = await Match.findById(matchId).lean();
  if (!match) return null;

  const [inningsDocs, balls, squadPlayers] = await Promise.all([
    Innings.find({ match: match._id }).sort({ number: 1 }).lean(),
    Ball.find({ match: match._id }).sort({ innings: 1, seq: 1 }).lean(),
    Registration.find({ allocatedTeam: { $in: [match.teamA, match.teamB] } })
      .select("playerName playingRole allocatedTeam")
      .collation({ locale: "en", strength: 2 })
      .sort({ playerName: 1 })
      .lean(),
  ]);

  // Players in a saved XI who have since moved team still need their names.
  const known = new Set(squadPlayers.map((p) => String(p._id)));
  const missingIds = [...(match.playingXI?.teamA || []), ...(match.playingXI?.teamB || [])]
    .map(String)
    .filter((id) => !known.has(id));
  const extraPlayers = missingIds.length
    ? await Registration.find({ _id: { $in: missingIds } }).select("playerName playingRole allocatedTeam").lean()
    : [];

  const players = {};
  for (const p of [...squadPlayers, ...extraPlayers]) {
    const id = String(p._id);
    const xiTeam = (match.playingXI?.teamA || []).map(String).includes(id)
      ? match.teamA
      : (match.playingXI?.teamB || []).map(String).includes(id)
        ? match.teamB
        : "";
    players[id] = { id, name: p.playerName, role: p.playingRole || "", team: xiTeam || p.allocatedTeam || "" };
  }

  const squads = {
    teamA: squadPlayers.filter((p) => p.allocatedTeam === match.teamA).map((p) => String(p._id)),
    teamB: squadPlayers.filter((p) => p.allocatedTeam === match.teamB).map((p) => String(p._id)),
  };

  const innings = inningsDocs.map((doc) => {
    const inningsBalls = balls.filter((b) => b.innings === doc.number);
    const state = replayFor(match, doc, inningsBalls);
    return {
      id: String(doc._id),
      number: doc.number,
      battingTeam: doc.battingTeam,
      bowlingTeam: doc.bowlingTeam,
      target: doc.target ?? null,
      targetRevised: Boolean(doc.targetRevised),
      maxOvers: doc.maxOvers ?? null,
      status: doc.status,
      endReason: doc.endReason || "",
      striker: idOrNull(doc.striker),
      nonStriker: idOrNull(doc.nonStriker),
      bowler: idOrNull(doc.bowler),
      lastSeq: doc.lastSeq || 0,
      balls: inningsBalls.map(serializeBall),
      state: { ...state, balls: undefined },
    };
  });

  return { match: serializeScoringMatch(match), players, squads, innings };
}

// ---------------------------------------------------------------- writes

export function jsonError(message, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

// Loads and checks everything a scoring write needs. Returns
// { match, inningsDoc } or { error, status }. `inningsNumber` must be the
// innings the scorer's screen is on, so a stale screen cannot write into the
// wrong innings.
export async function loadWriteContext(session, matchId, inningsNumber) {
  if (!session) return { error: "Not authenticated.", status: 401 };
  if (!isObjectId(String(matchId || ""))) return { error: "Match not found.", status: 404 };

  const match = await Match.findById(matchId).lean();
  if (!match) return { error: "Match not found.", status: 404 };
  if (!canScoreMatch(session, match)) return { error: "You are not a scorer for this match.", status: 403 };
  if (match.scoringStatus === "completed") {
    return { error: "This match is finished. An admin can re-open it for corrections.", status: 409 };
  }
  if (match.scoringStatus !== "in_progress") return { error: "Set up the match first.", status: 409 };

  if (inningsNumber === undefined) return { match };
  if (Number(inningsNumber) !== match.currentInnings) {
    return { error: "The match has moved on since this screen loaded.", status: 409 };
  }
  const inningsDoc = await Innings.findOne({ match: match._id, number: match.currentInnings }).lean();
  if (!inningsDoc) return { error: "This innings has not started.", status: 409 };
  return { match, inningsDoc };
}

export function inningsBalls(match, number) {
  return Ball.find({ match: match._id, innings: number }).sort({ seq: 1 }).lean();
}

export async function playerNames(match) {
  const ids = [...(match.playingXI?.teamA || []), ...(match.playingXI?.teamB || [])];
  const players = await Registration.find({ _id: { $in: ids } }).select("playerName").lean();
  const names = new Map(players.map((p) => [String(p._id), p.playerName]));
  return (id) => (id ? names.get(String(id)) || "Unknown" : "");
}

// Checks every player named on a ball is in the right playing XI.
export function ballPlayersProblem(match, inningsDoc, rawBall) {
  const ball = normalizeBall(rawBall);
  const battingXI = xiFor(match, inningsDoc.battingTeam);
  const bowlingXI = xiFor(match, inningsDoc.bowlingTeam);
  for (const id of [ball.striker, ball.nonStriker]) {
    if (id && !battingXI.includes(id)) return `Batters must be in the ${inningsDoc.battingTeam} playing XI.`;
  }
  if (ball.bowler && !bowlingXI.includes(ball.bowler)) {
    return `The bowler must be in the ${inningsDoc.bowlingTeam} playing XI.`;
  }
  if (ball.wicket) {
    if (ball.wicket.fielders.some((id) => !bowlingXI.includes(id))) {
      return `Fielders must be in the ${inningsDoc.bowlingTeam} playing XI.`;
    }
  }
  return null;
}

// Re-reads an innings' balls, replays them and rewrites the cached totals.
//   crease: who is in now ({ striker, nonStriker, bowler }); omitted = unchanged
//   reopen: clear a manual "declared" end (used by undo)
//   keepClosed: an innings the match has moved past stays closed even if a
//               correction means it no longer ends on its own (it becomes "declared")
export async function rebuildInnings(match, inningsDoc, { crease, reopen = false, keepClosed = false } = {}) {
  const balls = await inningsBalls(match, inningsDoc.number);
  const state = replayFor(match, inningsDoc, balls);

  let status = "in_progress";
  let endReason = "";
  if (state.complete) {
    status = "completed";
    endReason = state.endReason;
  } else if ((inningsDoc.endReason === "declared" && !reopen) || keepClosed) {
    status = "completed";
    endReason = "declared";
  }

  const update = {
    runs: state.runs,
    wickets: state.wickets,
    legalBalls: state.legalBalls,
    extras: {
      wides: state.extras.wides,
      noballs: state.extras.noballs,
      byes: state.extras.byes,
      legbyes: state.extras.legbyes,
      penalty: state.extras.penalty,
    },
    lastSeq: state.lastSeq,
    status,
    endReason,
  };
  if (crease) {
    update.striker = crease.striker || null;
    update.nonStriker = crease.nonStriker || null;
    update.bowler = crease.bowler || null;
  }
  await Innings.updateOne({ _id: inningsDoc._id }, { $set: update });
  return state;
}

// After a correction, later balls can move (a wide made legal shifts every
// ball after it). Rewrites the stored over / ball numbers and free-hit flags
// that differ from a fresh replay.
export async function reannotateInnings(match, inningsDoc) {
  const balls = await inningsBalls(match, inningsDoc.number);
  const state = replayFor(match, inningsDoc, balls);
  const bySeq = new Map(balls.map((b) => [b.seq, b]));
  const ops = [];
  for (const a of state.balls) {
    const doc = bySeq.get(a.seq);
    if (!doc) continue;
    if (doc.over !== a.over || doc.ballInOver !== a.ballInOver || doc.legal !== a.legal || doc.freeHit !== a.freeHit) {
      ops.push({
        updateOne: {
          filter: { _id: doc._id },
          update: { $set: { over: a.over, ballInOver: a.ballInOver, legal: a.legal, freeHit: a.freeHit } },
        },
      });
    }
  }
  if (ops.length) await Ball.bulkWrite(ops);
  return ops.length;
}

// Engine options for replaying an innings (what replayFor passes).
export function replayOptionsFor(match, inningsDoc) {
  return {
    config: scoringConfigFor(match, inningsDoc.battingTeam),
    target: inningsDoc.target,
    maxOvers: inningsDoc.maxOvers || undefined,
    striker: inningsDoc.striker,
    nonStriker: inningsDoc.nonStriker,
    bowler: inningsDoc.bowler,
  };
}

// Replays an innings from the database as it stands now.
export async function currentState(match, inningsDoc) {
  return replayFor(match, inningsDoc, await inningsBalls(match, inningsDoc.number));
}

// ---------------------------------------------------------------- derived data

const EMPTY_SIDE = {
  runs: null,
  wickets: null,
  overs: "",
  topBatter: { name: "", figures: "" },
  topBowler: { name: "", figures: "" },
};

// Replays the two regular innings of a match. Returns [{ doc, state }].
async function replayMatch(match) {
  const docs = await Innings.find({ match: match._id, number: { $lte: 2 } }).sort({ number: 1 }).lean();
  const balls = await Ball.find({ match: match._id, innings: { $lte: 2 } }).sort({ innings: 1, seq: 1 }).lean();
  return docs.map((doc) => ({ doc, state: replayFor(match, doc, balls.filter((b) => b.innings === doc.number)) }));
}

// Copies the scored innings into the Match summary fields the homepage
// Scorecard already reads (teamAInnings / teamBInnings and, while live, the
// result line), so the existing site shows ball-by-ball matches too.
export async function syncMatchSummary(matchId) {
  const match = await Match.findById(matchId).lean();
  if (!match || match.scoringStatus === "not_started") return;

  const innings = await replayMatch(match);
  const nameOf = await playerNames(match);
  const sideFor = (team) => {
    const found = innings.find((i) => i.doc.battingTeam === team);
    return found ? inningsSummary(found.state, nameOf) : EMPTY_SIDE;
  };

  const update = { teamAInnings: sideFor(match.teamA), teamBInnings: sideFor(match.teamB) };
  if (match.scoringStatus === "in_progress") {
    const first = innings.find((i) => i.doc.number === 1);
    const second = innings.find((i) => i.doc.number === 2);
    update.result = liveSituation({
      toss: match.toss,
      first: first && { state: first.state, chasingTeam: first.doc.bowlingTeam },
      second: second && { state: second.state, team: second.doc.battingTeam },
    });
  }
  await Match.updateOne({ _id: match._id }, { $set: update });
}

// Rebuilds the PlayerMatchStats rows for a finished match from its balls.
export async function rebuildPlayerStats(matchId) {
  const match = await Match.findById(matchId).lean();
  if (!match) return 0;
  const innings = await replayMatch(match);
  const rows = buildPlayerMatchStats(
    innings.map(({ doc, state }) => ({ state, battingTeam: doc.battingTeam, bowlingTeam: doc.bowlingTeam })),
    { [match.teamA]: xiFor(match, match.teamA), [match.teamB]: xiFor(match, match.teamB) }
  );

  await PlayerMatchStats.deleteMany({ match: match._id });
  if (!rows.length) return 0;
  await PlayerMatchStats.insertMany(
    rows.map((row) => ({
      ...row,
      match: match._id,
      date: match.date,
      batting: {
        ...row.batting,
        dismissal: row.batting.dismissal
          ? {
              type: row.batting.dismissal.type,
              bowler: row.batting.dismissal.bowler || null,
              fielders: row.batting.dismissal.fielders || [],
            }
          : { type: "", bowler: null, fielders: [] },
      },
    }))
  );
  return rows.length;
}

export function clearPlayerStats(matchId) {
  return PlayerMatchStats.deleteMany({ match: matchId });
}

// Every scoring write ends here: refresh the homepage summary, then hand
// back the full scoring state for the scorer's screen.
export async function afterWrite(matchId) {
  await syncMatchSummary(matchId);
  return loadScoringState(matchId);
}
