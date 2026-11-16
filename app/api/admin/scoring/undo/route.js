import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Ball from "@/models/Ball";
import Innings from "@/models/Innings";
import Match from "@/models/Match";
import {
  getScoringSession,
  jsonError,
  afterWrite,
  loadWriteContext,
  rebuildInnings,
} from "@/lib/scoringServer";

export const dynamic = "force-dynamic";

// Undoes the last ball of the current innings.
//   { matchId, innings, expectedSeq }  -- expectedSeq is the seq of the ball to remove
// With expectedSeq 0 on a second innings that has no balls yet, it undoes
// the start of that innings instead and re-opens the first.
// Safe to retry: a ball that is already gone is reported as undone.
export async function POST(request) {
  const session = getScoringSession();
  if (!session) return jsonError("Not authenticated.", 401);

  const body = await request.json().catch(() => ({}));
  const inningsNumber = Number(body.innings);
  const expectedSeq = Number(body.expectedSeq);

  await connectToDatabase();

  const ctx = await loadWriteContext(session, body.matchId);
  if (ctx.error) return jsonError(ctx.error, ctx.status);
  const { match } = ctx;

  // Retry of an "undo innings start" that already went through.
  if (expectedSeq === 0 && inningsNumber > match.currentInnings) {
    return NextResponse.json({ ok: true, ...(await afterWrite(match._id)) });
  }
  if (inningsNumber !== match.currentInnings) {
    return jsonError("The match has moved on since this screen loaded.", 409);
  }

  const inningsDoc = await Innings.findOne({ match: match._id, number: inningsNumber }).lean();
  if (!inningsDoc) return jsonError("This innings has not started.", 409);

  const last = await Ball.findOne({ match: match._id, innings: inningsNumber }).sort({ seq: -1 }).lean();

  if (!last) {
    if (expectedSeq !== 0 || inningsNumber === 1) return jsonError("Nothing to undo yet.", 409);
    // Undo the start of this innings: back to the end of the previous one.
    const moved = await Match.updateOne(
      { _id: match._id, currentInnings: inningsNumber, scoringStatus: "in_progress" },
      { $set: { currentInnings: inningsNumber - 1 } }
    );
    if (!moved.modifiedCount) return jsonError("The match has moved on since this screen loaded.", 409);
    await Innings.deleteOne({ _id: inningsDoc._id });
    const previous = await Innings.findOne({ match: match._id, number: inningsNumber - 1 }).lean();
    if (previous) await rebuildInnings({ ...match, currentInnings: inningsNumber - 1 }, previous, { reopen: true });
    return NextResponse.json({ ok: true, ...(await afterWrite(match._id)) });
  }

  if (last.seq < expectedSeq) {
    // Already undone by an earlier attempt.
    return NextResponse.json({ ok: true, ...(await afterWrite(match._id)) });
  }
  if (last.seq !== expectedSeq) {
    return jsonError("The score changed on another device. Reloaded the latest score.", 409);
  }

  await Ball.deleteOne({ _id: last._id });
  // Whoever faced and bowled the undone ball is back at the crease.
  await rebuildInnings(match, inningsDoc, {
    reopen: true,
    crease: { striker: last.striker, nonStriker: last.nonStriker, bowler: last.bowler },
  });

  return NextResponse.json({ ok: true, ...(await afterWrite(match._id)) });
}
