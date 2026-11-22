import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Innings from "@/models/Innings";
import { bowlerProblem } from "@/lib/scoring";
import {
  currentState,
  getScoringSession,
  jsonError,
  afterWrite,
  loadWriteContext,
  xiFor,
} from "@/lib/scoringServer";

export const dynamic = "force-dynamic";

function idOrNull(value) {
  return value === null || value === undefined || value === "" ? null : String(value);
}

// Sets who is at the crease: a new batter after a wicket, a new bowler after
// an over, or a manual strike change.
//   { matchId, innings, striker?, nonStriker?, bowler? }  -- only the fields sent change
export async function POST(request) {
  const session = await getScoringSession();
  if (!session) return jsonError("Not authenticated.", 401);

  const body = await request.json().catch(() => ({}));
  await connectToDatabase();

  const ctx = await loadWriteContext(session, body.matchId, body.innings);
  if (ctx.error) return jsonError(ctx.error, ctx.status);
  const { match, inningsDoc } = ctx;
  if (inningsDoc.status === "completed") return jsonError("This innings is over.", 409);

  const state = await currentState(match, inningsDoc);
  const update = {};
  for (const field of ["striker", "nonStriker", "bowler"]) {
    if (field in body) update[field] = idOrNull(body[field]);
  }
  const striker = "striker" in update ? update.striker : idOrNull(inningsDoc.striker);
  const nonStriker = "nonStriker" in update ? update.nonStriker : idOrNull(inningsDoc.nonStriker);

  const battingXI = xiFor(match, inningsDoc.battingTeam);
  const out = new Set(state.batters.filter((b) => b.out).map((b) => b.id));
  for (const id of [striker, nonStriker]) {
    if (!id) continue;
    if (!battingXI.includes(id)) return jsonError(`Batters must be in the ${inningsDoc.battingTeam} playing XI.`);
    if (out.has(id)) return jsonError("That batter is already out.");
  }
  if (striker && striker === nonStriker) return jsonError("The striker and non-striker must be different players.");

  if ("bowler" in update && update.bowler) {
    if (!xiFor(match, inningsDoc.bowlingTeam).includes(update.bowler)) {
      return jsonError(`The bowler must be in the ${inningsDoc.bowlingTeam} playing XI.`);
    }
    if ([striker, nonStriker].includes(update.bowler)) return jsonError("The bowler cannot also be batting.");
    // A change mid-over is an injury replacement; the next ball carries the flag.
    const problem = bowlerProblem(state, update.bowler, { midOverChange: true });
    if (problem) return jsonError(problem);
  }

  await Innings.updateOne({ _id: inningsDoc._id }, { $set: update });
  return NextResponse.json({ ok: true, ...(await afterWrite(match._id)) });
}
