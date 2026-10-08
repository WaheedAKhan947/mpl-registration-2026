import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { buildExportZipResponse } from "@/lib/exportZip";
import Registration from "@/models/Registration";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Downloads a ZIP with the registrations spreadsheet plus each player's
// profile picture and CNIC front/back images.
export async function GET() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (!verifySessionToken(token)) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  await connectToDatabase();
  const registrations = await Registration.find().sort({ createdAt: -1 }).lean();

  const players = registrations.map((r) => ({
    folder: `${r.registrationId || r._id}_${r.playerName}`,
    row: {
      "Registration ID": r.registrationId,
      "Submitted At": r.createdAt ? new Date(r.createdAt).toLocaleString() : "",
      "Player Name": r.playerName,
      "Father Name": r.fatherName,
      Age: r.age,
      Phone: r.phone,
      "CNIC Number": r.cnicNumber,
      "Village / Area": r.area,
      "Preferred Team": r.preferredTeam,
      "Playing Role": r.playingRole,
      "Batting Style": r.battingStyle,
      "Bowling Style": r.bowlingStyle,
      "CricPro ID": r.cricProId,
      Notes: r.notes,
      "Profile Picture": "",
      "CNIC Front": "",
      "CNIC Back": "",
      "Has Fee Receipt": r.feeReceipt ? "Yes" : "No",
    },
    files: [
      { column: "Profile Picture", label: "profile_picture", key: r.profilePicture },
      { column: "CNIC Front", label: "cnic_front", key: r.cnicFront },
      { column: "CNIC Back", label: "cnic_back", key: r.cnicBack },
    ],
  }));

  return buildExportZipResponse({
    players,
    sheetName: "Registrations",
    filePrefix: "mpl-registrations",
  });
}
