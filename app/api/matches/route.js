import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Match from "@/models/Match";
import { serializeMatch, todayInLeagueTimeZone } from "@/lib/matches";

export const dynamic = "force-dynamic";

const MATCH_ORDER = { matchNumber: 1, createdAt: 1 };

async function matchesOn(date) {
  if (!date) return null;
  const matches = await Match.find({ date }).sort(MATCH_ORDER).lean();
  return { date, matches: matches.map(serializeMatch) };
}

export async function GET() {
  await connectToDatabase();
  const todayDate = todayInLeagueTimeZone();

  // The nearest match day on either side of today, so a rest day still shows
  // the last result and the next fixture.
  const [previous, next] = await Promise.all([
    Match.findOne({ date: { $lt: todayDate } }).sort({ date: -1 }).select("date").lean(),
    Match.findOne({ date: { $gt: todayDate } }).sort({ date: 1 }).select("date").lean(),
  ]);

  const [recent, today, upcoming] = await Promise.all([
    matchesOn(previous?.date),
    matchesOn(todayDate),
    matchesOn(next?.date),
  ]);

  return NextResponse.json(
    { todayDate, recent, today: today.matches.length ? today : null, upcoming },
    { headers: { "Cache-Control": "no-store" } }
  );
}
