import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Sponsor from "@/models/Sponsor";
import { parseUploadedFile, buildAssetKey, uploadBufferToR2, deleteFileFromR2, getSignedFileUrl } from "@/lib/r2";

function requireAuth() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

export async function GET() {
  if (!requireAuth()) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  await connectToDatabase();
  const sponsors = await Sponsor.find().sort({ createdAt: 1 }).lean();

  const data = await Promise.all(
    sponsors.map(async (sponsor) => ({
      id: sponsor._id.toString(),
      name: sponsor.name,
      url: sponsor.url,
      logo: await getSignedFileUrl(sponsor.logo),
    }))
  );

  return NextResponse.json({ sponsors: data });
}

export async function POST(request) {
  if (!requireAuth()) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json();
  const name = String(body.name || "").trim();
  if (!name) {
    return NextResponse.json({ error: "Sponsor name is required." }, { status: 400 });
  }

  let logoKey = "";
  try {
    const file = parseUploadedFile(body.logo);
    if (file) {
      logoKey = await uploadBufferToR2(buildAssetKey("sponsors", name, file.contentType), file.buffer, file.contentType);
    }
  } catch (fileError) {
    return NextResponse.json({ error: fileError.message }, { status: 400 });
  }

  await connectToDatabase();
  const sponsor = await Sponsor.create({
    name,
    url: String(body.url || "").trim(),
    logo: logoKey,
  });

  return NextResponse.json({ ok: true, id: sponsor._id.toString() }, { status: 201 });
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

  await connectToDatabase();
  const sponsor = await Sponsor.findById(id);
  if (!sponsor) {
    return NextResponse.json({ error: "Sponsor not found." }, { status: 404 });
  }

  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) {
      return NextResponse.json({ error: "Sponsor name is required." }, { status: 400 });
    }
    sponsor.name = name;
  }
  if (body.url !== undefined) {
    sponsor.url = String(body.url).trim();
  }

  let oldLogoKey = null;
  if (body.removeLogo) {
    oldLogoKey = sponsor.logo;
    sponsor.logo = "";
  } else if (body.logo) {
    try {
      const file = parseUploadedFile(body.logo);
      if (file) {
        oldLogoKey = sponsor.logo;
        sponsor.logo = await uploadBufferToR2(
          buildAssetKey("sponsors", sponsor.name, file.contentType),
          file.buffer,
          file.contentType
        );
      }
    } catch (fileError) {
      return NextResponse.json({ error: fileError.message }, { status: 400 });
    }
  }

  await sponsor.save();
  if (oldLogoKey) {
    await deleteFileFromR2(oldLogoKey);
  }

  return NextResponse.json({ ok: true });
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
  const sponsor = await Sponsor.findByIdAndDelete(id).lean();
  if (sponsor?.logo) {
    await deleteFileFromR2(sponsor.logo);
  }

  return NextResponse.json({ ok: true });
}
