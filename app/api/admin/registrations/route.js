import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Registration from "@/models/Registration";
import { getSignedFileUrl, deleteFileFromR2 } from "@/lib/r2";

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

  const data = await Promise.all(
    registrations.map(async (r) => ({
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
      profilePicture: await getSignedFileUrl(r.profilePicture),
      cnicImage: await getSignedFileUrl(r.cnicImage),
      feeReceipt: await getSignedFileUrl(r.feeReceipt),
    }))
  );

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
  const registration = await Registration.findByIdAndDelete(id).lean();

  if (registration) {
    await Promise.all([
      deleteFileFromR2(registration.profilePicture),
      deleteFileFromR2(registration.cnicImage),
      deleteFileFromR2(registration.feeReceipt),
    ]);
  }

  return NextResponse.json({ ok: true });
}
