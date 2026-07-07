import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Registration from "@/models/Registration";

function requireAuth() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

export async function GET() {
  if (!requireAuth()) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  await connectToDatabase();
  const registrations = await Registration.find().sort({ createdAt: -1 }).lean();

  const data = registrations.map((r) => ({
    id: r._id.toString(),
    createdAt: r.createdAt,
    playerName: r.playerName,
    fatherName: r.fatherName,
    age: r.age,
    phone: r.phone,
    cnicNumber: r.cnicNumber,
    area: r.area,
    preferredTeam: r.preferredTeam,
    playingRole: r.playingRole,
    battingStyle: r.battingStyle,
    bowlingStyle: r.bowlingStyle,
    experience: r.experience,
    notes: r.notes,
    profilePicture: r.profilePicture?.data || null,
    cnicImage: r.cnicImage?.data || null,
    feeReceipt: r.feeReceipt?.data || null,
  }));

  return NextResponse.json({ registrations: data });
}

export async function DELETE(request) {
  if (!requireAuth()) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "Missing id." }, { status: 400 });
  }

  await connectToDatabase();
  await Registration.findByIdAndDelete(id);

  return NextResponse.json({ ok: true });
}
