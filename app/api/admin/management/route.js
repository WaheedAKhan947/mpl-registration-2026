import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import ManagementMember from "@/models/ManagementMember";
import { ensureManagementSeeded } from "@/lib/management";
import { parseUploadedFile, buildAssetKey, uploadBufferToR2, deleteFileFromR2, getSignedFileUrl } from "@/lib/r2";

function requireAuth() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

async function toPublicShape(member) {
  return {
    id: member._id.toString(),
    name: member.name,
    role: member.role,
    roleUr: member.roleUr || "",
    copy: member.copy,
    copyUr: member.copyUr || "",
    order: member.order || 0,
    photo: await getSignedFileUrl(member.photo),
  };
}

export async function GET() {
  if (!requireAuth()) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  await connectToDatabase();
  await ensureManagementSeeded();
  const members = await ManagementMember.find().sort({ order: 1, createdAt: 1 }).lean();

  const data = await Promise.all(members.map(toPublicShape));
  return NextResponse.json({ members: data });
}

export async function POST(request) {
  if (!requireAuth()) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json();
  const name = String(body.name || "").trim();
  const role = String(body.role || "").trim();
  const copy = String(body.copy || "").trim();
  if (!name || !role || !copy) {
    return NextResponse.json({ error: "Name, role, and bio are required." }, { status: 400 });
  }

  let photoKey = "";
  try {
    const file = parseUploadedFile(body.photo);
    if (file) {
      photoKey = await uploadBufferToR2(buildAssetKey("management", name, file.contentType), file.buffer, file.contentType);
    }
  } catch (fileError) {
    return NextResponse.json({ error: fileError.message }, { status: 400 });
  }

  await connectToDatabase();
  const last = await ManagementMember.findOne().sort({ order: -1 }).select("order").lean();
  const member = await ManagementMember.create({
    name,
    role,
    roleUr: String(body.roleUr || "").trim(),
    copy,
    copyUr: String(body.copyUr || "").trim(),
    photo: photoKey,
    order: last ? last.order + 1 : 0,
  });

  return NextResponse.json({ ok: true, id: member._id.toString() }, { status: 201 });
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
  const member = await ManagementMember.findById(id);
  if (!member) {
    return NextResponse.json({ error: "Member not found." }, { status: 404 });
  }

  // Reordering is handled on its own -- swap this member's position with
  // its neighbor in the current order, ignoring any other fields in the
  // same request so the admin's up/down clicks stay a single, quick action.
  if (body.move === "up" || body.move === "down") {
    const neighbor = await ManagementMember.findOne({
      order: body.move === "up" ? { $lt: member.order } : { $gt: member.order },
    }).sort({ order: body.move === "up" ? -1 : 1 });

    if (neighbor) {
      const memberOrder = member.order;
      member.order = neighbor.order;
      neighbor.order = memberOrder;
      await Promise.all([member.save(), neighbor.save()]);
    }

    return NextResponse.json({ ok: true });
  }

  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }
    member.name = name;
  }
  if (body.role !== undefined) {
    const role = String(body.role).trim();
    if (!role) {
      return NextResponse.json({ error: "Role is required." }, { status: 400 });
    }
    member.role = role;
  }
  if (body.roleUr !== undefined) {
    member.roleUr = String(body.roleUr).trim();
  }
  if (body.copy !== undefined) {
    const copy = String(body.copy).trim();
    if (!copy) {
      return NextResponse.json({ error: "Bio is required." }, { status: 400 });
    }
    member.copy = copy;
  }
  if (body.copyUr !== undefined) {
    member.copyUr = String(body.copyUr).trim();
  }

  let oldPhotoKey = null;
  if (body.removePhoto) {
    oldPhotoKey = member.photo;
    member.photo = "";
  } else if (body.photo) {
    try {
      const file = parseUploadedFile(body.photo);
      if (file) {
        oldPhotoKey = member.photo;
        member.photo = await uploadBufferToR2(
          buildAssetKey("management", member.name, file.contentType),
          file.buffer,
          file.contentType
        );
      }
    } catch (fileError) {
      return NextResponse.json({ error: fileError.message }, { status: 400 });
    }
  }

  await member.save();
  if (oldPhotoKey) {
    await deleteFileFromR2(oldPhotoKey);
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
  const member = await ManagementMember.findByIdAndDelete(id).lean();
  if (member?.photo) {
    await deleteFileFromR2(member.photo);
  }

  return NextResponse.json({ ok: true });
}
