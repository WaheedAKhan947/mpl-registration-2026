import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { buildExportZipResponse } from "@/lib/exportZip";
import FootballRegistration from "@/models/FootballRegistration";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Downloads a ZIP with the MFC registrations spreadsheet plus each player's
// photo and CNIC / B-Form image.
export async function GET() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (!verifySessionToken(token)) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  await connectToDatabase();
  const registrations = await FootballRegistration.find().sort({ createdAt: -1 }).lean();

  const players = registrations.map((r) => ({
    folder: `${r.registrationId || r._id}_${r.fullName}`,
    row: {
      "Registration ID": r.registrationId,
      "Submitted At": r.createdAt ? new Date(r.createdAt).toLocaleString() : "",
      "Full Name": r.fullName,
      "Father's Name": r.fatherName,
      "Date of Birth": r.dob,
      "CNIC / B-Form Number": r.cnicNumber,
      Phone: r.phone,
      Email: r.email,
      "Village / Area": r.village,
      Tehsil: r.tehsil,
      District: r.district,
      "Preferred Position": r.position,
      "Preferred Foot": r.preferredFoot,
      "Previous Club / Team": r.previousClub,
      "Football Experience": r.experience,
      "Previous Tournaments": r.previousTournaments,
      Height: r.height,
      "Jersey Size": r.jerseySize,
      "Jersey Number": r.jerseyNumber,
      Photo: "",
      "CNIC Image": "",
    },
    files: [
      { column: "Photo", label: "photo", key: r.photo },
      { column: "CNIC Image", label: "cnic", key: r.cnicImage },
    ],
  }));

  return buildExportZipResponse({
    players,
    sheetName: "MFC Registrations",
    filePrefix: "mfc-registrations",
  });
}
