import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Registration from "@/models/Registration";
import { parseUploadedFile, buildFileKey, uploadBufferToR2, deleteFileFromR2 } from "@/lib/r2";

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

    const cnicNumber = body.cnicNumber.trim();

    await connectToDatabase();

    const existingCnic = await Registration.findOne({ cnicNumber }).lean();
    if (existingCnic) {
      return NextResponse.json(
        { error: "This CNIC number is already registered." },
        { status: 409 }
      );
    }

    let profile, cnicFile, receipt;
    try {
      profile = parseUploadedFile(body.profilePicture);
      cnicFile = parseUploadedFile(body.cnicImage);
      receipt = parseUploadedFile(body.feeReceipt);
    } catch (fileError) {
      return NextResponse.json({ error: fileError.message }, { status: 400 });
    }

    if (cnicFile) {
      const dupCnicImage = await Registration.findOne({ cnicImageHash: cnicFile.hash }).lean();
      if (dupCnicImage) {
        return NextResponse.json(
          { error: "This CNIC image has already been used for another registration." },
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

    const [profilePictureKey, cnicImageKey, feeReceiptKey] = await Promise.all([
      profile
        ? uploadBufferToR2(
            buildFileKey("profile-pictures", body.playerName, cnicNumber, "profile", profile.contentType),
            profile.buffer,
            profile.contentType
          )
        : null,
      cnicFile
        ? uploadBufferToR2(
            buildFileKey("cnic", body.playerName, cnicNumber, "cnic", cnicFile.contentType),
            cnicFile.buffer,
            cnicFile.contentType
          )
        : null,
      receipt
        ? uploadBufferToR2(
            buildFileKey("fee-receipts", body.playerName, cnicNumber, "feeReceipt", receipt.contentType),
            receipt.buffer,
            receipt.contentType
          )
        : null,
    ]);

    let registration;
    try {
      registration = await Registration.create({
        playerName: body.playerName,
        fatherName: body.fatherName,
        age: body.age,
        phone: body.phone,
        cnicNumber,
        area: body.area,
        preferredTeam: body.preferredTeam,
        playingRole: body.playingRole,
        battingStyle: body.battingStyle,
        bowlingStyle: body.bowlingStyle,
        experience: body.experience || "",
        notes: body.notes || "",
        profilePicture: profilePictureKey || undefined,
        cnicImage: cnicImageKey || undefined,
        feeReceipt: feeReceiptKey || undefined,
        cnicImageHash: cnicFile?.hash,
        feeReceiptHash: receipt?.hash,
      });
    } catch (createError) {
      await Promise.all([
        deleteFileFromR2(profilePictureKey),
        deleteFileFromR2(cnicImageKey),
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

    return NextResponse.json({ ok: true, id: registration._id.toString() }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: error.message || "Could not save registration." },
      { status: 500 }
    );
  }
}
