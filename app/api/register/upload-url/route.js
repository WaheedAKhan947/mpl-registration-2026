import { NextResponse } from "next/server";
import { buildFileKey, createPresignedUploadUrl, ALLOWED_CONTENT_TYPES } from "@/lib/r2";

// Maps the registration form's file fields to a fixed R2 folder/label pair.
// Keeping this server-side (rather than trusting a client-supplied folder)
// stops a caller from requesting an upload URL for an arbitrary bucket path.
const FIELD_CONFIG = {
  profilePicture: { folder: "profile-pictures", label: "profile" },
  cnicFront: { folder: "cnic", label: "cnic_front" },
  cnicBack: { folder: "cnic", label: "cnic_back" },
  feeReceipt: { folder: "fee-receipts", label: "feeReceipt" },
};

// Issues a short-lived presigned R2 PUT URL so the browser can upload a
// registration file directly to storage instead of embedding it as base64
// inside the /api/register JSON body. That JSON body was previously getting
// large enough (multiple photos, base64-inflated ~37%) to be rejected or
// dropped by the hosting platform, which is what produced the "not valid
// JSON" / "Failed to fetch" / "did not match the expected pattern" errors
// players were seeing on submit.
export async function POST(request) {
  try {
    const body = await request.json();
    const { field, contentType, playerName, cnicNumber } = body || {};

    const config = FIELD_CONFIG[field];
    if (!config) {
      return NextResponse.json({ error: "Unknown upload field." }, { status: 400 });
    }

    if (!contentType || !ALLOWED_CONTENT_TYPES.includes(contentType)) {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload an image or PDF." },
        { status: 400 }
      );
    }

    const key = buildFileKey(
      config.folder,
      String(playerName || "").slice(0, 100),
      String(cnicNumber || "").slice(0, 100),
      config.label,
      contentType
    );

    const uploadUrl = await createPresignedUploadUrl(key, contentType);

    return NextResponse.json({ key, uploadUrl });
  } catch (error) {
    console.error("Upload URL error:", error);
    return NextResponse.json({ error: "Could not prepare the file upload." }, { status: 500 });
  }
}
