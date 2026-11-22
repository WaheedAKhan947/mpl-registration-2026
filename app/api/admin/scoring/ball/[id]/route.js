import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Ball from "@/models/Ball";
import Innings from "@/models/Innings";
import { describeBall, replayInnings, validateInnings } from "@/lib/scoring";
import {
  afterWrite,
  ballPlayersProblem,
  getScoringSession,
  inningsBalls,
  isObjectId,
  jsonError,
  loadWriteContext,
  playerNames,
  reannotateInnings,
  rebuildInnings,
  replayOptionsFor,
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
  const ball = {
    striker: null,
    nonStriker: null,
    bowler: null,
    runsOffBat: 0,
    extrasType: null,
    extraRuns: 0,
    boundary: null,
    wicket: null,
    bowlerChange: false,
  };
  for (const field of BALL_FIELDS) {
    if (input[field] !== undefined) ball[field] = input[field];
  }
  return ball;
}

// Shared checks for correcting or deleting an earlier ball:
// the match must be open for scoring and the screen must have seen the
// innings as it is now (`expectedSeq` = the innings' last ball seq).
async function loadTarget(request, params) {
  const session = await getScoringSession();
  if (!session) return { error: jsonError("Not authenticated.", 401) };
  if (!isObjectId(String(params.id || ""))) return { error: jsonError("Ball not found.", 404) };

  const body = await request.json().catch(() => ({}));
  await connectToDatabase();

  const ctx = await loadWriteContext(session, body.matchId);
  if (ctx.error) return { error: jsonError(ctx.error, ctx.status) };
  const { match } = ctx;

  const target = await Ball.findOne({ _id: params.id, match: match._id }).lean();
  if (!target) return { error: jsonError("Ball not found.", 404) };

  const inningsDoc = await Innings.findOne({ match: match._id, number: target.innings }).lean();
  if (!inningsDoc) return { error: jsonError("Innings not found.", 404) };

  const balls = await inningsBalls(match, inningsDoc.number);
  const lastSeq = balls.length ? balls[balls.length - 1].seq : 0;
  if (Number(body.expectedSeq) !== lastSeq) {
    return { error: jsonError("The score changed on another device. Reloaded the latest score.", 409) };
  }

  return { session, body, match, target, inningsDoc, balls, lastSeq };
}

function problemText(problem, targetSeq) {
  if (!problem) return null;
  if (problem.seq === targetSeq) return problem.error;
  return `That change makes ball ${problem.overBall} invalid: ${problem.error}`;
}

// After any correction: fix ball numbering, the innings totals, and the
// chase target if the first innings changed.
async function settle(match, inningsDoc, crease) {
  await reannotateInnings(match, inningsDoc);
  const isCurrent = inningsDoc.number === match.currentInnings;
  const state = await rebuildInnings(match, inningsDoc, { crease, keepClosed: !isCurrent });

  if (inningsDoc.number === 1) {
    const second = await Innings.findOne({ match: match._id, number: 2 }).lean();
    if (second && !second.targetRevised && second.target !== state.runs + 1) {
      await Innings.updateOne({ _id: second._id }, { $set: { target: state.runs + 1 } });
      await rebuildInnings(match, { ...second, target: state.runs + 1 }, {});
    }
  }
}

// Corrects an earlier ball.
//   { matchId, expectedSeq, ball: { striker, nonStriker, bowler, runsOffBat, extrasType, extraRuns, boundary, wicket } }
// The whole innings is re-checked so the fix cannot leave a later ball impossible.
export async function PUT(request, { params }) {
  const loaded = await loadTarget(request, params);
  if (loaded.error) return loaded.error;
  const { body, match, target, inningsDoc, balls, lastSeq } = loaded;

  const raw = { ...pickBall(body.ball), seq: target.seq };
  const playersProblem = ballPlayersProblem(match, inningsDoc, raw);
  if (playersProblem) return jsonError(playersProblem);

  const candidate = balls.map((b) => (String(b._id) === String(target._id) ? raw : b));
  const options = replayOptionsFor(match, inningsDoc);
  const problem = problemText(validateInnings(candidate, options), target.seq);
  if (problem) return jsonError(problem);

  const after = replayInnings(candidate, options);
  const placed = after.balls.find((b) => b.seq === target.seq);
  const nameOf = await playerNames(match);

  await Ball.updateOne(
    { _id: target._id },
    {
      $set: {
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
      },
    },
    { runValidators: true }
  );

  // Editing the latest ball of the live innings also moves the crease.
  const isLatest = inningsDoc.number === match.currentInnings && target.seq === lastSeq;
  await settle(
    match,
    inningsDoc,
    isLatest ? { striker: after.striker, nonStriker: after.nonStriker, bowler: after.currentBowler } : undefined
  );

  return NextResponse.json({ ok: true, ...(await afterWrite(match._id)) });
}

// Deletes an earlier ball (for example one recorded twice by mistake).
//   { matchId, expectedSeq }
export async function DELETE(request, { params }) {
  const loaded = await loadTarget(request, params);
  if (loaded.error) return loaded.error;
  const { match, target, inningsDoc, balls, lastSeq } = loaded;

  const candidate = balls.filter((b) => String(b._id) !== String(target._id));
  const problem = problemText(validateInnings(candidate, replayOptionsFor(match, inningsDoc)), target.seq);
  if (problem) return jsonError(problem);

  await Ball.deleteOne({ _id: target._id });

  // Deleting the latest ball of the live innings works like undo.
  const isLatest = inningsDoc.number === match.currentInnings && target.seq === lastSeq;
  await settle(
    match,
    inningsDoc,
    isLatest ? { striker: target.striker, nonStriker: target.nonStriker, bowler: target.bowler } : undefined
  );

  return NextResponse.json({ ok: true, ...(await afterWrite(match._id)) });
}
