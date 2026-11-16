import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Match from "@/models/Match";
import { getScoringSession, canScoreMatch, serializeScoringMatch } from "@/lib/scoringServer";

export const dynamic = "force-dynamic";

// Matches the signed-in account can score, newest first.
export async function GET() {
  const session = getScoringSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  await connectToDatabase();
  const matches = await Match.find().sort({ date: -1, matchNumber: -1, createdAt: -1 }).lean();

  return NextResponse.json(
    { matches: matches.filter((m) => canScoreMatch(session, m)).map(serializeScoringMatch) },
    { headers: { "Cache-Control": "no-store" } }
  );
}
