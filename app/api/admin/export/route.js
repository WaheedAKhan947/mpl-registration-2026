import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import * as XLSX from "xlsx";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Registration from "@/models/Registration";

export async function GET() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (!verifySessionToken(token)) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  await connectToDatabase();
  const registrations = await Registration.find().sort({ createdAt: -1 }).lean();

  const rows = registrations.map((r) => ({
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
    "Has Profile Picture": r.profilePicture ? "Yes" : "No",
    "Has CNIC Image": r.cnicImage ? "Yes" : "No",
    "Has Fee Receipt": r.feeReceipt ? "Yes" : "No",
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet["!cols"] = Object.keys(rows[0] || {}).map(() => ({ wch: 18 }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Registrations");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="mpl-registrations-${Date.now()}.xlsx"`,
    },
  });
}
