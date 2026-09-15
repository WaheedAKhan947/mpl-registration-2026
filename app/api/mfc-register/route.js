import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import FootballRegistration from "@/models/FootballRegistration";
import Settings from "@/models/Settings";
import { parseUploadedFile, buildFileKey, uploadBufferToR2, deleteFileFromR2 } from "@/lib/r2";

const REQUIRED_FIELDS = [
  "fullName",
  "fatherName",
  "dob",
  "cnicNumber",
  "phone",
  "village",
  "tehsil",
  "district",
  "position",
  "preferredFoot",
  "jerseySize",
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

    if (!body.declarationAgreed) {
      return NextResponse.json(
        { error: "You must confirm that all the information provided is correct." },
        { status: 400 }
      );
    }

    const cnicNumber = body.cnicNumber.trim();

    await connectToDatabase();

    const settings = await Settings.findOne({ key: "site" }).lean();
    if (settings && settings.mfcRegistrationOpen === false) {
      return NextResponse.json(
        { error: "MFC registration is currently closed." },
        { status: 403 }
      );
    }

    const existingCnic = await FootballRegistration.findOne({ cnicNumber }).lean();
    if (existingCnic) {
      return NextResponse.json(
        { error: "This CNIC / B-Form number is already registered." },
        { status: 409 }
      );
    }

    let photo, cnicFile;
    try {
      photo = parseUploadedFile(body.photo);
      cnicFile = parseUploadedFile(body.cnicImage);
    } catch (fileError) {
      return NextResponse.json({ error: fileError.message }, { status: 400 });
    }

    if (cnicFile) {
      const dupCnicImage = await FootballRegistration.findOne({ cnicImageHash: cnicFile.hash }).lean();
      if (dupCnicImage) {
        return NextResponse.json(
          { error: "This CNIC / B-Form image has already been used for another registration." },
          { status: 409 }
        );
      }
    }

    const [photoKey, cnicImageKey] = await Promise.all([
      photo
        ? uploadBufferToR2(
            buildFileKey("mfc-photos", body.fullName, cnicNumber, "photo", photo.contentType),
            photo.buffer,
            photo.contentType
          )
        : null,
      cnicFile
        ? uploadBufferToR2(
            buildFileKey("mfc-cnic", body.fullName, cnicNumber, "cnic", cnicFile.contentType),
            cnicFile.buffer,
            cnicFile.contentType
          )
        : null,
    ]);

    let registration;
    try {
      registration = await FootballRegistration.create({
        fullName: body.fullName,
        fatherName: body.fatherName,
        dob: body.dob,
        cnicNumber,
        phone: body.phone,
        email: body.email || "",
        village: body.village,
        tehsil: body.tehsil,
        district: body.district,
        position: body.position,
        preferredFoot: body.preferredFoot,
        previousClub: body.previousClub || "",
        experience: body.experience || "",
        previousTournaments: body.previousTournaments || "",
        height: body.height || "",
        jerseySize: body.jerseySize,
        jerseyNumber: body.jerseyNumber || "",
        declarationAgreed: Boolean(body.declarationAgreed),
        photo: photoKey || undefined,
        cnicImage: cnicImageKey || undefined,
        cnicImageHash: cnicFile?.hash,
      });
    } catch (createError) {
      await Promise.all([deleteFileFromR2(photoKey), deleteFileFromR2(cnicImageKey)]);
      if (createError.code === 11000) {
        return NextResponse.json(
          { error: "This CNIC / B-Form number or uploaded file is already registered." },
          { status: 409 }
        );
      }
      throw createError;
    }

    return NextResponse.json({ ok: true, id: registration._id.toString() }, { status: 201 });
  } catch (error) {
    console.error("MFC registration error:", error);
    return NextResponse.json(
      { error: error.message || "Could not save registration." },
      { status: 500 }
    );
  }
}
