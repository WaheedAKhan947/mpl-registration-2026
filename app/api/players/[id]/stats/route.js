import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { STATS_CACHE_HEADERS, playerProfile } from "@/lib/statsServer";

export const dynamic = "force-dynamic";

// A player's public profile, tournament totals and match-by-match log.
export async function GET(_request, { params }) {
  await connectToDatabase();
  const profile = await playerProfile(params.id);
  if (!profile) return NextResponse.json({ error: "Player not found." }, { status: 404 });
  return NextResponse.json(profile, { headers: STATS_CACHE_HEADERS });
}
