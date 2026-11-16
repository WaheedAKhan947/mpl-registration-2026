import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { buildScorecard, cacheHeaders, loadPublicMatch } from "@/lib/publicMatch";

export const dynamic = "force-dynamic";

// Full scorecard: batting and bowling tables, extras and fall of wickets for
// each innings, plus both playing XIs.
export async function GET(_request, { params }) {
  await connectToDatabase();
  const data = await loadPublicMatch(params.id);
  if (!data) return NextResponse.json({ error: "Match not found." }, { status: 404 });
  return NextResponse.json(buildScorecard(data), { headers: cacheHeaders(data.match) });
}
