import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Match from "@/models/Match";
import { getScoringSession, canScoreMatch, isObjectId, loadScoringState } from "@/lib/scoringServer";

export const dynamic = "force-dynamic";

// Full scoring state for one match: squads, playing XI, innings and balls.
export async function GET(_request, { params }) {
  const session = await getScoringSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  if (!isObjectId(params.id)) {
    return NextResponse.json({ error: "Match not found." }, { status: 404 });
  }

  await connectToDatabase();
  const match = await Match.findById(params.id).select("scorers").lean();
  if (!match) {
    return NextResponse.json({ error: "Match not found." }, { status: 404 });
  }
  if (!canScoreMatch(session, match)) {
    return NextResponse.json({ error: "You are not a scorer for this match." }, { status: 403 });
  }

  const state = await loadScoringState(params.id);
  return NextResponse.json(state, { headers: { "Cache-Control": "no-store" } });
}
