import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Innings from "@/models/Innings";
import Match from "@/models/Match";
import {
  currentState,
  getScoringSession,
  jsonError,
  afterWrite,
  loadWriteContext,
  xiFor,
} from "@/lib/scoringServer";

export const dynamic = "force-dynamic";

function wholeNumber(value, min, max) {
  if (value === null || value === undefined || value === "") return undefined;
  const num = Number(value);
  return Number.isInteger(num) && num >= min && num <= max ? num : null;
}

// Closes the current innings. After the first innings it also opens the
// second, so the openers and opening bowler come with the request:
//   { matchId, innings, striker, nonStriker, bowler, target?, maxOvers? }
// `target` / `maxOvers` are a manual rain (DLS) revision; leave them out for
// the normal target of first-innings runs + 1.
export async function POST(request) {
  const session = getScoringSession();
  if (!session) return jsonError("Not authenticated.", 401);

  const body = await request.json().catch(() => ({}));
  await connectToDatabase();

  const ctx = await loadWriteContext(session, body.matchId, body.innings);
  if (ctx.error) return jsonError(ctx.error, ctx.status);
  const { match, inningsDoc } = ctx;
  if (inningsDoc.number > 2) return jsonError("Super overs are not supported yet.");

  const state = await currentState(match, inningsDoc);
  const endReason = state.complete ? state.endReason : "declared";

  if (inningsDoc.number === 2) {
    await Innings.updateOne({ _id: inningsDoc._id }, { $set: { status: "completed", endReason } });
    return NextResponse.json({ ok: true, ...(await afterWrite(match._id)) });
  }

  // Second innings: the sides swap.
  const battingTeam = inningsDoc.bowlingTeam;
  const bowlingTeam = inningsDoc.battingTeam;
  const battingXI = xiFor(match, battingTeam);
  const bowlingXI = xiFor(match, bowlingTeam);
  const striker = String(body.striker || "");
  const nonStriker = String(body.nonStriker || "");
  const bowler = String(body.bowler || "");
  if (!battingXI.includes(striker) || !battingXI.includes(nonStriker)) {
    return jsonError(`Choose two opening batters from the ${battingTeam} XI.`);
  }
  if (striker === nonStriker) return jsonError("The two openers must be different players.");
  if (!bowlingXI.includes(bowler)) return jsonError(`Choose the opening bowler from the ${bowlingTeam} XI.`);

  const target = wholeNumber(body.target, 1, 1000);
  if (target === null) return jsonError("The revised target must be a whole number of runs.");
  const maxOvers = wholeNumber(body.maxOvers, 1, match.overs || 50);
  if (maxOvers === null) return jsonError(`Revised overs must be between 1 and ${match.overs}.`);

  const moved = await Match.updateOne(
    { _id: match._id, currentInnings: 1, scoringStatus: "in_progress" },
    { $set: { currentInnings: 2 } }
  );
  if (!moved.modifiedCount) return jsonError("The match has moved on since this screen loaded.", 409);

  await Innings.updateOne({ _id: inningsDoc._id }, { $set: { status: "completed", endReason } });
  try {
    await Innings.create({
      match: match._id,
      number: 2,
      battingTeam,
      bowlingTeam,
      target: target ?? state.runs + 1,
      targetRevised: target !== undefined || maxOvers !== undefined,
      maxOvers: maxOvers ?? null,
      striker,
      nonStriker,
      bowler,
    });
  } catch (err) {
    if (err?.code !== 11000) throw err;
  }

  return NextResponse.json({ ok: true, ...(await afterWrite(match._id)) });
}
