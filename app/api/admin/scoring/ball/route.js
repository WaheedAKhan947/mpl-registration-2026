import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Ball from "@/models/Ball";
import { describeBall, validateBall } from "@/lib/scoring";
import {
  ballPlayersProblem,
  getScoringSession,
  inningsBalls,
  afterWrite,
  jsonError,
  loadScoringState,
  loadWriteContext,
  playerNames,
  rebuildInnings,
  replayFor,
} from "@/lib/scoringServer";

export const dynamic = "force-dynamic";

const BALL_FIELDS = [
  "striker",
  "nonStriker",
  "bowler",
  "runsOffBat",
  "extrasType",
  "extraRuns",
  "boundary",
  "wicket",
  "bowlerChange",
];

function pickBall(input = {}) {
  const ball = {};
  for (const field of BALL_FIELDS) {
    if (input[field] !== undefined) ball[field] = input[field];
  }
  return ball;
}

// Records one ball.
//   { matchId, innings, expectedSeq, clientId, ball: { striker, nonStriker, bowler, runsOffBat, ... } }
// `clientId` makes retries safe: the same id never creates a second ball.
// `expectedSeq` must be the next ball number, so two scorers (or a stale
// screen) cannot both write "ball 14"; the loser gets 409 and reloads.
export async function POST(request) {
  const session = getScoringSession();
  if (!session) return jsonError("Not authenticated.", 401);

  const body = await request.json().catch(() => ({}));
  const clientId = String(body.clientId || "").trim();
  if (clientId.length < 8 || clientId.length > 80) return jsonError("Missing ball id.");

  await connectToDatabase();

  // A retry of a ball that already landed: report success, change nothing.
  const existing = await Ball.findOne({ clientId }).select("match").lean();
  if (existing) {
    if (String(existing.match) !== String(body.matchId)) return jsonError("Ball id already used.", 409);
    return NextResponse.json({ ok: true, duplicate: true, ...(await loadScoringState(body.matchId)) });
  }

  const ctx = await loadWriteContext(session, body.matchId, body.innings);
  if (ctx.error) return jsonError(ctx.error, ctx.status);
  const { match, inningsDoc } = ctx;
  if (inningsDoc.status === "completed") return jsonError("This innings is over.", 409);

  const balls = await inningsBalls(match, inningsDoc.number);
  const state = replayFor(match, inningsDoc, balls);
  const seq = Number(body.expectedSeq);
  if (seq !== state.lastSeq + 1) {
    return jsonError("The score changed on another device. Reloaded the latest score.", 409);
  }

  const raw = { ...pickBall(body.ball), seq };
  const problem = ballPlayersProblem(match, inningsDoc, raw) || validateBall(raw, state);
  if (problem) return jsonError(problem);

  const after = replayFor(match, inningsDoc, [...balls, raw]);
  const placed = after.balls[after.balls.length - 1];
  const nameOf = await playerNames(match);

  try {
    await Ball.create({
      match: match._id,
      innings: inningsDoc.number,
      seq,
      over: placed.over,
      ballInOver: placed.ballInOver,
      legal: placed.legal,
      freeHit: placed.freeHit,
      striker: placed.striker,
      nonStriker: placed.nonStriker,
      bowler: placed.bowler,
      bowlerChange: placed.bowlerChange,
      runsOffBat: placed.runsOffBat,
      extrasType: placed.extrasType,
      extraRuns: placed.extraRuns,
      boundary: placed.boundary,
      wicket: placed.wicket,
      commentary: describeBall(placed, nameOf, after.config),
      clientId,
      createdBy: session.sub,
    });
  } catch (err) {
    if (err?.code === 11000) {
      // Same clientId raced in from a retry: that is a success.
      if (err.keyPattern?.clientId) {
        return NextResponse.json({ ok: true, duplicate: true, ...(await loadScoringState(match._id)) });
      }
      return jsonError("Another scorer recorded this ball first. Reloaded the latest score.", 409);
    }
    throw err;
  }

  await rebuildInnings(match, inningsDoc, {
    crease: { striker: after.striker, nonStriker: after.nonStriker, bowler: after.currentBowler },
  });

  return NextResponse.json({ ok: true, ...(await afterWrite(match._id)) });
}
