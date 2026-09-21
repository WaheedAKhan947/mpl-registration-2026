import { safeJsonResponse } from "@/lib/http";

// Kept in sync with MAX_FILE_BYTES in lib/r2.js (the server-enforced limit).
// Duplicated here only as a number, not as logic, so the browser can reject
// an oversized file immediately instead of uploading it first.
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve(null);
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      reject(new Error(`${file.name} is larger than 5MB. Please upload a smaller file.`));
      return;
    }
    const reader = new FileReader();
    reader.onload = () =>
      resolve({ name: file.name, type: file.type || "application/octet-stream", data: reader.result });
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

// Uploads a registration file straight to Cloudflare R2 from the browser,
// using a short-lived presigned URL from /api/register/upload-url. This
// keeps the actual photo/PDF bytes out of the /api/register request body
// entirely -- that body used to carry up to four base64-encoded files at
// once, which was large enough (especially on top of base64's ~37% size
// overhead) to be rejected or dropped by the hosting platform, surfacing to
// players as "Failed to fetch" or a JSON-parsing crash on submit.
//
// Returns null if no file was selected, or { key, name, contentType } to
// send along in the /api/register JSON body once uploaded.
export async function uploadFileDirect(file, { field, playerName, cnicNumber }) {
  if (!file) return null;

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`${file.name} is larger than 5MB. Please upload a smaller file.`);
  }

  const contentType = file.type || "application/octet-stream";

  let presignResponse;
  try {
    presignResponse = await fetch("/api/register/upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ field, contentType, playerName, cnicNumber }),
    });
  } catch {
    throw new Error(`Could not reach the server to upload ${file.name}. Please check your connection and try again.`);
  }

  const presignResult = await safeJsonResponse(presignResponse);
  if (!presignResponse.ok) {
    throw new Error(presignResult.error || `Could not prepare ${file.name} for upload.`);
  }

  const { key, uploadUrl } = presignResult;

  let putResponse;
  try {
    putResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: file,
    });
  } catch {
    throw new Error(`Could not upload ${file.name}. Please check your connection and try again.`);
  }

  if (!putResponse.ok) {
    throw new Error(`Could not upload ${file.name}. Please check your connection and try again.`);
  }

  return { key, name: file.name, contentType };
}
