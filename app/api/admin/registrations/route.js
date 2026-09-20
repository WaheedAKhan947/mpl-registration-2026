import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Registration from "@/models/Registration";
import Team from "@/models/Team";
import { getSignedFileUrl, deleteFileFromR2 } from "@/lib/r2";
import { ROSTER_TEAMS } from "@/lib/siteData";

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
      registrationId: r.registrationId || "",
      verified: Boolean(r.verified),
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
      cricProId: r.cricProId,
      notes: r.notes,
      allocatedTeam: r.allocatedTeam || "",
      profilePicture: await getSignedFileUrl(r.profilePicture),
      cnicFront: await getSignedFileUrl(r.cnicFront),
      cnicBack: await getSignedFileUrl(r.cnicBack),
      feeReceipt: await getSignedFileUrl(r.feeReceipt),
    }))
  );

  return NextResponse.json({ registrations: data });
}

export async function PUT(request) {
  if (!requireAuth()) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json();
  const { id } = body;
  if (!id) {
    return NextResponse.json({ error: "Missing id." }, { status: 400 });
  }

  // Only touch the fields actually present in the request, so toggling
  // "verified" doesn't accidentally reset the allocated team (and vice
  // versa) -- the admin dashboard calls this for either action separately.
  const update = {};
  if ("allocatedTeam" in body) {
    const team = String(body.allocatedTeam || "").trim();
    if (team && !ROSTER_TEAMS.includes(team)) {
      return NextResponse.json({ error: "Invalid team." }, { status: 400 });
    }
    update.allocatedTeam = team;
  }
  if ("verified" in body) {
    update.verified = Boolean(body.verified);
  }
  if (!Object.keys(update).length) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  await connectToDatabase();
  const registration = await Registration.findByIdAndUpdate(id, update, { new: true }).lean();

  if (!registration) {
    return NextResponse.json({ error: "Registration not found." }, { status: 404 });
  }

  if ("allocatedTeam" in update) {
    // A captain who leaves a team stops being its captain.
    await Team.updateMany(
      { captain: registration._id, name: { $ne: update.allocatedTeam } },
      { captain: null }
    );
  }

  return NextResponse.json({
    ok: true,
    allocatedTeam: registration.allocatedTeam,
    verified: registration.verified,
  });
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
      deleteFileFromR2(registration.cnicFront),
      deleteFileFromR2(registration.cnicBack),
      deleteFileFromR2(registration.feeReceipt),
      Team.updateMany({ captain: registration._id }, { captain: null }),
    ]);
  }

  return NextResponse.json({ ok: true });
}
