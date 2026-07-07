import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Registration from "@/models/Registration";

const REQUIRED_FIELDS = [
  "playerName",
  "fatherName",
  "age",
  "phone",
  "cnicNumber",
  "area",
  "preferredTeam",
  "playingRole",
  "battingStyle",
  "bowlingStyle",
];

export async function POST(request) {
  try {
    const body = await request.json();

    const missing = REQUIRED_FIELDS.filter((field) => !String(body[field] || "").trim());
    if (missing.length) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const registration = await Registration.create({
      playerName: body.playerName,
      fatherName: body.fatherName,
      age: body.age,
      phone: body.phone,
      cnicNumber: body.cnicNumber,
      area: body.area,
      preferredTeam: body.preferredTeam,
      playingRole: body.playingRole,
      battingStyle: body.battingStyle,
      bowlingStyle: body.bowlingStyle,
      experience: body.experience || "",
      notes: body.notes || "",
      profilePicture: body.profilePicture || undefined,
      cnicImage: body.cnicImage || undefined,
      feeReceipt: body.feeReceipt || undefined,
    });

    return NextResponse.json({ ok: true, id: registration._id.toString() }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: error.message || "Could not save registration." },
      { status: 500 }
    );
  }
}
