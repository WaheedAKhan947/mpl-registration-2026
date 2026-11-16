import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { buildLive, cacheHeaders, loadPublicMatch } from "@/lib/publicMatch";

export const dynamic = "force-dynamic";

// Current score, batters, bowler, recent balls, run rates and partnership.
export async function GET(_request, { params }) {
  await connectToDatabase();
  const data = await loadPublicMatch(params.id);
  if (!data) return NextResponse.json({ error: "Match not found." }, { status: 404 });
  return NextResponse.json(buildLive(data), { headers: cacheHeaders(data.match) });
}
