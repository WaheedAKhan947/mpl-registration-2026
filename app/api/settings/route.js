import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Settings from "@/models/Settings";

export const dynamic = "force-dynamic";

export async function GET() {
  await connectToDatabase();
  const settings = await Settings.findOne({ key: "site" }).lean();
  return NextResponse.json(
    {
      highlightVideoUrl: settings?.highlightVideoUrl || "",
      announcementText: settings?.announcementText || "",
      announcementEnabled: settings?.announcementEnabled ?? true,
      mplRegistrationOpen: settings?.mplRegistrationOpen ?? true,
      mfcRegistrationOpen: settings?.mfcRegistrationOpen ?? true,
      mplRegistrationFee: settings?.mplRegistrationFee ?? 1000,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
