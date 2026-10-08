import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Sponsor, { MAX_SPONSOR_IMAGES } from "@/models/Sponsor";
import { ensureSponsorCategories, sortSponsorsByTier } from "@/lib/sponsors";
import { normalizeSponsorTier, DEFAULT_SPONSOR_TIER } from "@/lib/sponsorTiers";
import { parseUploadedFile, buildAssetKey, uploadBufferToR2, deleteFileFromR2, getSignedFileUrl } from "@/lib/r2";

// Album images are sent one per request (`addImage`) so no single JSON body
// carries more than one base64 file.

const TOO_MANY_IMAGES = `A sponsor can have at most ${MAX_SPONSOR_IMAGES} album images.`;

function requireAuth() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

async function uploadAlbumImage(file, name) {
  const parsed = parseUploadedFile(file);
  if (!parsed) return null;
  if (!parsed.contentType.startsWith("image/")) {
    throw new Error("Please upload an image file.");
  }
  return uploadBufferToR2(buildAssetKey("sponsors/album", name, parsed.contentType), parsed.buffer, parsed.contentType);
}

export async function GET() {
  if (!requireAuth()) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  await connectToDatabase();
  await ensureSponsorCategories();
  const sponsors = await Sponsor.find().sort({ createdAt: 1 }).lean();

  const data = await Promise.all(
    sortSponsorsByTier(sponsors).map(async (sponsor) => ({
      id: sponsor._id.toString(),
      name: sponsor.name,
      url: sponsor.url,
      category: sponsor.category,
      details: sponsor.details || "",
      detailsUr: sponsor.detailsUr || "",
      logo: await getSignedFileUrl(sponsor.logo),
      images: await Promise.all(
        (sponsor.images || []).map(async (key) => ({ key, url: await getSignedFileUrl(key) }))
      ),
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
  const category = body.category === undefined ? DEFAULT_SPONSOR_TIER : normalizeSponsorTier(body.category);
  if (!category) {
    return NextResponse.json({ error: "Choose a valid sponsor category." }, { status: 400 });
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
    category,
    details: String(body.details || "").trim(),
    detailsUr: String(body.detailsUr || "").trim(),
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

  // Album: add one image.
  if (body.addImage) {
    if ((sponsor.images || []).length >= MAX_SPONSOR_IMAGES) {
      return NextResponse.json({ error: TOO_MANY_IMAGES }, { status: 400 });
    }
    let key;
    try {
      key = await uploadAlbumImage(body.addImage, sponsor.name);
    } catch (fileError) {
      return NextResponse.json({ error: fileError.message }, { status: 400 });
    }
    if (key) {
      // The size guard in the filter keeps two quick uploads from pushing past the limit.
      const updated = await Sponsor.findOneAndUpdate(
        { _id: sponsor._id, [`images.${MAX_SPONSOR_IMAGES - 1}`]: { $exists: false } },
        { $push: { images: key } }
      );
      if (!updated) {
        await deleteFileFromR2(key);
        return NextResponse.json({ error: TOO_MANY_IMAGES }, { status: 400 });
      }
    }
    return NextResponse.json({ ok: true });
  }

  // Album: remove one image.
  if (body.removeImage) {
    const key = String(body.removeImage);
    if (!(sponsor.images || []).includes(key)) {
      return NextResponse.json({ error: "Image not found." }, { status: 404 });
    }
    sponsor.images = sponsor.images.filter((image) => image !== key);
    await sponsor.save();
    await deleteFileFromR2(key);
    return NextResponse.json({ ok: true });
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
  if (body.category !== undefined) {
    const category = normalizeSponsorTier(body.category);
    if (!category) {
      return NextResponse.json({ error: "Choose a valid sponsor category." }, { status: 400 });
    }
    sponsor.category = category;
  }
  if (body.details !== undefined) {
    sponsor.details = String(body.details).trim();
  }
  if (body.detailsUr !== undefined) {
    sponsor.detailsUr = String(body.detailsUr).trim();
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
  const keys = [sponsor?.logo, ...(sponsor?.images || [])].filter(Boolean);
  await Promise.all(keys.map((key) => deleteFileFromR2(key)));

  return NextResponse.json({ ok: true });
}
