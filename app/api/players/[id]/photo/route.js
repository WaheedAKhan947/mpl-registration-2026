import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import Registration from "@/models/Registration";
import PlayerMatchStats from "@/models/PlayerMatchStats";
import { getSignedFileUrl } from "@/lib/r2";

export const dynamic = "force-dynamic";

// A stable address for a player's photo (used by the stream overlay). It
// redirects to a short-lived signed R2 link, so the overlay feed itself never
// changes just because a signature did. Same privacy rule as player
// profiles: only players on a team or with recorded stats.
export async function GET(_request, { params }) {
  if (!mongoose.isValidObjectId(String(params.id || ""))) {
    return new NextResponse(null, { status: 404 });
  }
  await connectToDatabase();
  const player = await Registration.findById(params.id).select("allocatedTeam profilePicture").lean();
  const visible = player && (player.allocatedTeam || (await PlayerMatchStats.exists({ player: player._id })));
  if (!visible || !player.profilePicture) {
    return new NextResponse(null, { status: 404, headers: { "Cache-Control": "public, s-maxage=300" } });
  }
  const url = await getSignedFileUrl(player.profilePicture);
  // Signed links last an hour; cache the redirect well inside that.
  return NextResponse.redirect(url, { status: 302, headers: { "Cache-Control": "public, max-age=600, s-maxage=600" } });
}
