import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import PointsTableRow from "@/models/PointsTableRow";

export const dynamic = "force-dynamic";

export async function GET() {
  await connectToDatabase();
  const rows = await PointsTableRow.find().sort({ points: -1, netRunRate: -1 }).lean();

  const data = rows.map((row) => ({
    id: row._id.toString(),
    team: row.team,
    played: row.played,
    won: row.won,
    lost: row.lost,
    tied: row.tied,
    noResult: row.noResult,
    points: row.points,
    netRunRate: row.netRunRate,
  }));

  return NextResponse.json({ rows: data }, { headers: { "Cache-Control": "no-store" } });
}
