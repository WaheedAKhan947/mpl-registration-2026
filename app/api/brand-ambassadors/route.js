import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import BrandAmbassador from "@/models/BrandAmbassador";
import { getSignedFileUrl } from "@/lib/r2";

export const dynamic = "force-dynamic";

export async function GET() {
  await connectToDatabase();
  const ambassadors = await BrandAmbassador.find({ "images.0": { $exists: true } })
    .sort({ order: 1, createdAt: 1 })
    .lean();

  const data = await Promise.all(
    ambassadors.map(async (ambassador) => ({
      id: ambassador._id.toString(),
      name: ambassador.name,
      details: ambassador.details,
      detailsUr: ambassador.detailsUr || "",
      images: await Promise.all(ambassador.images.map((key) => getSignedFileUrl(key))),
    }))
  );

  return NextResponse.json({ ambassadors: data }, { headers: { "Cache-Control": "no-store" } });
}
