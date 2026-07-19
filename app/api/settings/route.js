import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Settings from "@/models/Settings";

export async function GET() {
  await connectToDatabase();
  const settings = await Settings.findOne({ key: "site" }).lean();
  return NextResponse.json(
    { highlightVideoUrl: settings?.highlightVideoUrl || "" },
    { headers: { "Cache-Control": "no-store" } }
  );
}
