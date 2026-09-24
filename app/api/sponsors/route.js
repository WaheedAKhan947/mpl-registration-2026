import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Sponsor from "@/models/Sponsor";
import { getSignedFileUrl } from "@/lib/r2";
import { ensureSponsorCategories, sortSponsorsByTier } from "@/lib/sponsors";

export const dynamic = "force-dynamic";

export async function GET() {
  await connectToDatabase();
  await ensureSponsorCategories();
  const sponsors = await Sponsor.find().sort({ createdAt: 1 }).lean();

  const data = await Promise.all(
    sortSponsorsByTier(sponsors).map(async (sponsor) => ({
      id: sponsor._id.toString(),
      name: sponsor.name,
      url: sponsor.url,
      category: sponsor.category,
      logo: await getSignedFileUrl(sponsor.logo),
    }))
  );

  return NextResponse.json({ sponsors: data }, { headers: { "Cache-Control": "no-store" } });
}
