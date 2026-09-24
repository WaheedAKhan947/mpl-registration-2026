import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import BrandAmbassador, { MAX_AMBASSADOR_IMAGES } from "@/models/BrandAmbassador";
import { parseUploadedFile, buildAssetKey, uploadBufferToR2, deleteFileFromR2, getSignedFileUrl } from "@/lib/r2";

// Images are sent one per request (a new ambassador is created with its
// first image, then the rest are added with `addImage`) so no single JSON
// body carries more than one base64 file.

const TOO_MANY_IMAGES = `A brand ambassador can have at most ${MAX_AMBASSADOR_IMAGES} images.`;

function requireAuth() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

async function toAdminShape(ambassador) {
  return {
    id: ambassador._id.toString(),
    name: ambassador.name,
    details: ambassador.details,
    detailsUr: ambassador.detailsUr || "",
    order: ambassador.order || 0,
    images: await Promise.all(
      (ambassador.images || []).map(async (key) => ({ key, url: await getSignedFileUrl(key) }))
    ),
  };
}

async function uploadImage(file, name) {
  const parsed = parseUploadedFile(file);
  if (!parsed) return null;
  if (!parsed.contentType.startsWith("image/")) {
    throw new Error("Please upload an image file.");
  }
  return uploadBufferToR2(buildAssetKey("ambassadors", name, parsed.contentType), parsed.buffer, parsed.contentType);
}

export async function GET() {
  if (!requireAuth()) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  await connectToDatabase();
  const ambassadors = await BrandAmbassador.find().sort({ order: 1, createdAt: 1 }).lean();
  const data = await Promise.all(ambassadors.map(toAdminShape));
  return NextResponse.json({ ambassadors: data });
}

export async function POST(request) {
  if (!requireAuth()) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json();
  const name = String(body.name || "").trim();
  const details = String(body.details || "").trim();
  if (!name || !details) {
    return NextResponse.json({ error: "Name and details are required." }, { status: 400 });
  }

  let imageKey = null;
  try {
    imageKey = await uploadImage(body.image, name);
  } catch (fileError) {
    return NextResponse.json({ error: fileError.message }, { status: 400 });
  }

  await connectToDatabase();
  const last = await BrandAmbassador.findOne().sort({ order: -1 }).select("order").lean();
  const ambassador = await BrandAmbassador.create({
    name,
    details,
    detailsUr: String(body.detailsUr || "").trim(),
    images: imageKey ? [imageKey] : [],
    order: last ? last.order + 1 : 0,
  });

  return NextResponse.json({ ok: true, id: ambassador._id.toString() }, { status: 201 });
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
  const ambassador = await BrandAmbassador.findById(id);
  if (!ambassador) {
    return NextResponse.json({ error: "Brand ambassador not found." }, { status: 404 });
  }

  // Reordering: swap positions with the neighbor in the current order.
  if (body.move === "up" || body.move === "down") {
    const neighbor = await BrandAmbassador.findOne({
      order: body.move === "up" ? { $lt: ambassador.order } : { $gt: ambassador.order },
    }).sort({ order: body.move === "up" ? -1 : 1 });

    if (neighbor) {
      const current = ambassador.order;
      ambassador.order = neighbor.order;
      neighbor.order = current;
      await Promise.all([ambassador.save(), neighbor.save()]);
    }
    return NextResponse.json({ ok: true });
  }

  if (body.addImage) {
    if (ambassador.images.length >= MAX_AMBASSADOR_IMAGES) {
      return NextResponse.json({ error: TOO_MANY_IMAGES }, { status: 400 });
    }
    let key;
    try {
      key = await uploadImage(body.addImage, ambassador.name);
    } catch (fileError) {
      return NextResponse.json({ error: fileError.message }, { status: 400 });
    }
    if (key) {
      // The size guard in the filter keeps two quick uploads from pushing past the limit.
      const updated = await BrandAmbassador.findOneAndUpdate(
        { _id: ambassador._id, [`images.${MAX_AMBASSADOR_IMAGES - 1}`]: { $exists: false } },
        { $push: { images: key } }
      );
      if (!updated) {
        await deleteFileFromR2(key);
        return NextResponse.json({ error: TOO_MANY_IMAGES }, { status: 400 });
      }
    }
    return NextResponse.json({ ok: true });
  }

  if (body.removeImage) {
    const key = String(body.removeImage);
    if (!ambassador.images.includes(key)) {
      return NextResponse.json({ error: "Image not found." }, { status: 404 });
    }
    if (ambassador.images.length <= 1) {
      return NextResponse.json(
        { error: "A brand ambassador needs at least one image. Add another image before removing this one." },
        { status: 400 }
      );
    }
    ambassador.images = ambassador.images.filter((image) => image !== key);
    await ambassador.save();
    await deleteFileFromR2(key);
    return NextResponse.json({ ok: true });
  }

  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }
    ambassador.name = name;
  }
  if (body.details !== undefined) {
    const details = String(body.details).trim();
    if (!details) {
      return NextResponse.json({ error: "Details are required." }, { status: 400 });
    }
    ambassador.details = details;
  }
  if (body.detailsUr !== undefined) {
    ambassador.detailsUr = String(body.detailsUr).trim();
  }

  await ambassador.save();
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
  const ambassador = await BrandAmbassador.findByIdAndDelete(id).lean();
  await Promise.all((ambassador?.images || []).map((key) => deleteFileFromR2(key)));

  return NextResponse.json({ ok: true });
}
