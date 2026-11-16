import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { pointsTable } from "@/lib/pointsTable";

export const dynamic = "force-dynamic";

// Automatic standings from scored matches, with manual rows as overrides.
export async function GET() {
  await connectToDatabase();
  const { rows } = await pointsTable();
  return NextResponse.json({ rows }, { headers: { "Cache-Control": "no-store" } });
}
