import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Innings from "@/models/Innings";
import Match from "@/models/Match";
import { computeResult } from "@/lib/scoring";
import {
  currentState,
  getScoringSession,
  jsonError,
  afterWrite,
  loadWriteContext,
  rebuildPlayerStats,
} from "@/lib/scoringServer";

export const dynamic = "force-dynamic";

// Finishes the match and writes the result to the Match.
//   { matchId }                    -- after the second innings
//   { matchId, abandoned: true }   -- no result (rain, bad light...) at any point
export async function POST(request) {
  const session = await getScoringSession();
  if (!session) return jsonError("Not authenticated.", 401);

  const body = await request.json().catch(() => ({}));
  await connectToDatabase();

  const ctx = await loadWriteContext(session, body.matchId);
  if (ctx.error) return jsonError(ctx.error, ctx.status);
  const { match } = ctx;

  const inningsDocs = await Innings.find({ match: match._id }).sort({ number: 1 }).lean();
  let result;

  if (body.abandoned === true) {
    result = computeResult({ abandoned: true });
  } else {
    const first = inningsDocs.find((i) => i.number === 1);
    const second = inningsDocs.find((i) => i.number === 2);
    if (!first || !second) return jsonError("Both innings must be played to finish with a result.");
    const secondState = await currentState(match, second);
    if (!secondState.complete && second.status !== "completed") {
      return jsonError("The second innings is still going. End it first.");
    }
    const firstState = await currentState(match, first);
    result = computeResult({
      first: { ...firstState, team: first.battingTeam },
      second: { ...secondState, team: second.battingTeam, complete: true },
      revisedTarget: Boolean(second.targetRevised),
    });
    await Innings.updateOne(
      { _id: second._id },
      { $set: { status: "completed", endReason: secondState.endReason || second.endReason || "declared" } }
    );
  }

  const finished = await Match.updateOne(
    { _id: match._id, scoringStatus: "in_progress" },
    {
      $set: {
        scoringStatus: "completed",
        status: result.outcome === "no_result" ? "abandoned" : "completed",
        result: result.text,
        resultInfo: {
          outcome: result.outcome,
          winner: result.winner || "",
          margin: result.margin ?? null,
          marginType: result.marginType || "",
        },
      },
    }
  );
  if (!finished.modifiedCount) return jsonError("This match was already finished.", 409);

  // Player figures for stats pages and leaderboards, rebuilt from the balls.
  await rebuildPlayerStats(match._id);

  return NextResponse.json({ ok: true, result, ...(await afterWrite(match._id)) });
}
