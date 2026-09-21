import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Registration from "@/models/Registration";
import Settings from "@/models/Settings";
import { headFileInfo, downloadAndHashFile, deleteFileFromR2, MAX_FILE_BYTES } from "@/lib/r2";
import { getNextRegistrationId } from "@/lib/registrationId";

const REQUIRED_FIELDS = [
  "playerName",
  "fatherName",
  "age",
  "phone",
  "cnicNumber",
  "area",
  // preferredTeam is intentionally not required here -- the field is
  // disabled on the registration form and defaults to "Any Team" below.
  "playingRole",
  "battingStyle",
  "bowlingStyle",
  "cricProId",
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

    if (!body.agreedToTerms) {
      return NextResponse.json(
        { error: "You must agree to the Official Playing Conditions & Tournament Regulations." },
        { status: 400 }
      );
    }

    if (!body.feeNonRefundableAcknowledged) {
      return NextResponse.json(
        { error: "You must acknowledge that the registration fee is non-refundable." },
        { status: 400 }
      );
    }

    const cnicNumber = body.cnicNumber.trim();

    await connectToDatabase();

    const settings = await Settings.findOne({ key: "site" }).lean();
    if (settings && settings.mplRegistrationOpen === false) {
      return NextResponse.json(
        { error: "MPL registration is currently closed." },
        { status: 403 }
      );
    }

    const existingCnic = await Registration.findOne({ cnicNumber }).lean();
    if (existingCnic) {
      return NextResponse.json(
        { error: "This CNIC number is already registered." },
        { status: 409 }
      );
    }

    // The browser now uploads each file straight to R2 via a presigned URL
    // (see /api/register/upload-url) and only sends us the resulting object
    // key here -- the JSON body for this route stays a few KB regardless of
    // how big the photos are. We still don't trust the client: each key is
    // verified to actually exist in R2 and hashed server-side below, so
    // duplicate-file detection can't be bypassed by sending a fake hash.
    function readFileRef(value) {
      if (!value || typeof value.key !== "string" || !value.key.trim()) return null;
      return { key: value.key.trim() };
    }

    const fileRefs = {
      profilePicture: readFileRef(body.profilePicture),
      cnicFront: readFileRef(body.cnicFront),
      cnicBack: readFileRef(body.cnicBack),
      feeReceipt: readFileRef(body.feeReceipt),
    };

    async function verifyUpload(ref, label) {
      if (!ref) return null;
      const info = await headFileInfo(ref.key);
      if (!info) {
        throw new Error(`${label} upload could not be found. Please re-upload the file and try again.`);
      }
      if (info.size > MAX_FILE_BYTES) {
        await deleteFileFromR2(ref.key);
        throw new Error(`${label} is larger than 5MB.`);
      }
      const { hash, contentType } = await downloadAndHashFile(ref.key);
      return { key: ref.key, hash, contentType: contentType || info.contentType || "application/octet-stream" };
    }

    let profile, cnicFrontFile, cnicBackFile, receipt;
    try {
      [profile, cnicFrontFile, cnicBackFile, receipt] = await Promise.all([
        verifyUpload(fileRefs.profilePicture, "Profile picture"),
        verifyUpload(fileRefs.cnicFront, "CNIC front image"),
        verifyUpload(fileRefs.cnicBack, "CNIC back image"),
        verifyUpload(fileRefs.feeReceipt, "Fee receipt"),
      ]);
    } catch (fileError) {
      await Promise.all(
        Object.values(fileRefs)
          .filter(Boolean)
          .map((ref) => deleteFileFromR2(ref.key).catch(() => {}))
      );
      return NextResponse.json({ error: fileError.message }, { status: 400 });
    }

    if (cnicFrontFile) {
      const dupCnicFront = await Registration.findOne({ cnicFrontHash: cnicFrontFile.hash }).lean();
      if (dupCnicFront) {
        return NextResponse.json(
          { error: "This CNIC front image has already been used for another registration." },
          { status: 409 }
        );
      }
    }
    if (cnicBackFile) {
      const dupCnicBack = await Registration.findOne({ cnicBackHash: cnicBackFile.hash }).lean();
      if (dupCnicBack) {
        return NextResponse.json(
          { error: "This CNIC back image has already been used for another registration." },
          { status: 409 }
        );
      }
    }
    if (receipt) {
      const dupReceipt = await Registration.findOne({ feeReceiptHash: receipt.hash }).lean();
      if (dupReceipt) {
        return NextResponse.json(
          { error: "This fee receipt has already been used for another registration." },
          { status: 409 }
        );
      }
    }

    // Files already live in R2 (uploaded directly by the browser via a
    // presigned URL) and were just verified above -- nothing left to upload.
    const profilePictureKey = profile?.key || null;
    const cnicFrontKey = cnicFrontFile?.key || null;
    const cnicBackKey = cnicBackFile?.key || null;
    const feeReceiptKey = receipt?.key || null;

    const registrationId = await getNextRegistrationId("mpl");

    let registration;
    try {
      registration = await Registration.create({
        registrationId,
        playerName: body.playerName,
        fatherName: body.fatherName,
        age: body.age,
        phone: body.phone,
        cnicNumber,
        area: body.area,
        preferredTeam: body.preferredTeam || "Any Team",
        playingRole: body.playingRole,
        battingStyle: body.battingStyle,
        bowlingStyle: body.bowlingStyle,
        cricProId: body.cricProId || "",
        notes: body.notes || "",
        agreedToTerms: Boolean(body.agreedToTerms),
        feeNonRefundableAcknowledged: Boolean(body.feeNonRefundableAcknowledged),
        profilePicture: profilePictureKey || undefined,
        cnicFront: cnicFrontKey || undefined,
        cnicBack: cnicBackKey || undefined,
        feeReceipt: feeReceiptKey || undefined,
        cnicFrontHash: cnicFrontFile?.hash,
        cnicBackHash: cnicBackFile?.hash,
        feeReceiptHash: receipt?.hash,
      });
    } catch (createError) {
      await Promise.all([
        deleteFileFromR2(profilePictureKey),
        deleteFileFromR2(cnicFrontKey),
        deleteFileFromR2(cnicBackKey),
        deleteFileFromR2(feeReceiptKey),
      ]);
      if (createError.code === 11000) {
        return NextResponse.json(
          { error: "This CNIC number or uploaded file is already registered." },
          { status: 409 }
        );
      }
      throw createError;
    }

    return NextResponse.json({ ok: true, id: registration.registrationId }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: error.message || "Could not save registration." },
      { status: 500 }
    );
  }
}
