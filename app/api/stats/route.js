import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Registration from "@/models/Registration";

export async function GET() {
  await connectToDatabase();
  const totalPlayers = await Registration.countDocuments();
  return NextResponse.json(
    { totalPlayers },
    { headers: { "Cache-Control": "no-store" } }
  );
}
