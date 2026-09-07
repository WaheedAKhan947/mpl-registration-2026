import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import * as XLSX from "xlsx";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import FootballRegistration from "@/models/FootballRegistration";

export async function GET() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (!verifySessionToken(token)) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  await connectToDatabase();
  const registrations = await FootballRegistration.find().sort({ createdAt: -1 }).lean();

  const rows = registrations.map((r) => ({
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
    "Has Photo": r.photo ? "Yes" : "No",
    "Has CNIC Image": r.cnicImage ? "Yes" : "No",
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet["!cols"] = Object.keys(rows[0] || {}).map(() => ({ wch: 18 }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "MFC Registrations");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="mfc-registrations-${Date.now()}.xlsx"`,
    },
  });
}
