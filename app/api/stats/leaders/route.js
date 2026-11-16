import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { STATS_CACHE_HEADERS, leaderboards } from "@/lib/statsServer";

export const dynamic = "force-dynamic";

// Tournament leaderboards: orange / purple cap, batting, bowling and fielding lists.
export async function GET() {
  await connectToDatabase();
  return NextResponse.json(await leaderboards(), { headers: STATS_CACHE_HEADERS });
}
