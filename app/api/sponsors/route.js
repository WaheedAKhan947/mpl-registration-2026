import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Sponsor from "@/models/Sponsor";
import { getSignedFileUrl } from "@/lib/r2";

export const dynamic = "force-dynamic";

export async function GET() {
  await connectToDatabase();
  const sponsors = await Sponsor.find().sort({ createdAt: 1 }).lean();

  const data = await Promise.all(
    sponsors.map(async (sponsor) => ({
      id: sponsor._id.toString(),
      name: sponsor.name,
      url: sponsor.url,
      logo: await getSignedFileUrl(sponsor.logo),
    }))
  );

  return NextResponse.json({ sponsors: data }, { headers: { "Cache-Control": "no-store" } });
}
