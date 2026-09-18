import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import FootballRegistration from "@/models/FootballRegistration";
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
  const registrations = await FootballRegistration.find().sort({ createdAt: -1 }).lean();

  const data = await Promise.all(
    registrations.map(async (r) => ({
      id: r._id.toString(),
      registrationId: r.registrationId || "",
      verified: Boolean(r.verified),
      createdAt: r.createdAt,
      fullName: r.fullName,
      fatherName: r.fatherName,
      dob: r.dob,
      cnicNumber: r.cnicNumber,
      phone: r.phone,
      email: r.email,
      village: r.village,
      tehsil: r.tehsil,
      district: r.district,
      position: r.position,
      preferredFoot: r.preferredFoot,
      previousClub: r.previousClub,
      experience: r.experience,
      previousTournaments: r.previousTournaments,
      height: r.height,
      jerseySize: r.jerseySize,
      jerseyNumber: r.jerseyNumber,
      photo: await getSignedFileUrl(r.photo),
      cnicImage: await getSignedFileUrl(r.cnicImage),
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
  if (!("verified" in body)) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  await connectToDatabase();
  const registration = await FootballRegistration.findByIdAndUpdate(
    id,
    { verified: Boolean(body.verified) },
    { new: true }
  ).lean();

  if (!registration) {
    return NextResponse.json({ error: "Registration not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, verified: registration.verified });
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
  const registration = await FootballRegistration.findByIdAndDelete(id).lean();

  if (registration) {
    await Promise.all([deleteFileFromR2(registration.photo), deleteFileFromR2(registration.cnicImage)]);
  }

  return NextResponse.json({ ok: true });
}
