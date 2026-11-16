import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import OverlayState from "@/models/OverlayState";
import { getScoringSession, canScoreMatch } from "@/lib/scoringServer";
import { loadPublicMatch } from "@/lib/publicMatch";
import { allHighlights } from "@/lib/overlayServer";

export const dynamic = "force-dynamic";

// GET ?matchId= : the match's highlights log (fours, sixes, wickets,
// milestones, hat-tricks with the time each was scored) and the stream start
// time set in Admin > Stream Overlay. Owners, admins and the match's scorers.
export async function GET(request) {
  const session = getScoringSession();
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const matchId = new URL(request.url).searchParams.get("matchId");
  if (!mongoose.isValidObjectId(String(matchId || ""))) return NextResponse.json({ error: "Choose a match." }, { status: 400 });

  await connectToDatabase();
  const data = await loadPublicMatch(matchId);
  if (!data) return NextResponse.json({ error: "Match not found." }, { status: 404 });
  if (!canScoreMatch(session, data.match)) return NextResponse.json({ error: "You are not a scorer for this match." }, { status: 403 });

  const doc = await OverlayState.findOne({ match: data.match._id }).select("streamStartedAt").lean();
  return NextResponse.json(
    { highlights: allHighlights(data), streamStartedAt: doc?.streamStartedAt || null },
    { headers: { "Cache-Control": "no-store" } }
  );
}
