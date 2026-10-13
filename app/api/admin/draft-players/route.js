import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Registration from "@/models/Registration";
import { getSignedFileUrl } from "@/lib/r2";

export const dynamic = "force-dynamic";

function requireAuth() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

// Only the fields the draft card needs. CNIC, phone, receipt and the CNIC
// images are deliberately never selected, so they can't leak from here.
const DRAFT_FIELDS =
  "registrationId playerName fatherName age area playingRole battingStyle bowlingStyle cricProId verified preferredTeam allocatedTeam profilePicture";

export async function GET(request) {
  if (!requireAuth()) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const verifiedOnly = new URL(request.url).searchParams.get("verified") === "true";

  await connectToDatabase();
  const registrations = await Registration.find(verifiedOnly ? { verified: true } : {})
    .select(DRAFT_FIELDS)
    .collation({ locale: "en", strength: 2 })
    .sort({ playerName: 1 })
    .lean();

  const players = await Promise.all(
    registrations.map(async (r) => ({
      id: r._id.toString(),
      registrationId: r.registrationId || "",
      playerName: r.playerName,
      fatherName: r.fatherName || "",
      age: r.age || "",
      area: r.area || "",
      playingRole: r.playingRole || "",
      battingStyle: r.battingStyle || "",
      bowlingStyle: r.bowlingStyle || "",
      cricProId: r.cricProId || "",
      verified: Boolean(r.verified),
      preferredTeam: r.preferredTeam || "",
      allocatedTeam: r.allocatedTeam || "",
      // Signed for 1 hour; null when the player never uploaded a photo.
      photo: r.profilePicture ? await getSignedFileUrl(r.profilePicture) : null,
    }))
  );

  return NextResponse.json({ players }, { headers: { "Cache-Control": "no-store" } });
}
