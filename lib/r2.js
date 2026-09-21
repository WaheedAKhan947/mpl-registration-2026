import crypto from "crypto";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Exported so the client (via /api/register/upload-url) and the register
// route can both check the same limit instead of duplicating the number.
export const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB
const SIGNED_URL_EXPIRY_SECONDS = 60 * 60; // 1 hour
// Short-lived: this URL only needs to live long enough for the browser to
// PUT the file right after requesting it.
const UPLOAD_URL_EXPIRY_SECONDS = 10 * 60; // 10 minutes

const REQUIRED_ENV_VARS = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
];

const EXTENSION_BY_TYPE = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "application/pdf": "pdf",
};

// Content types the public upload endpoints accept. Kept in sync with
// EXTENSION_BY_TYPE so every allowed type resolves to a real extension.
export const ALLOWED_CONTENT_TYPES = Object.keys(EXTENSION_BY_TYPE);

let client;

function getClient() {
  if (client) return client;

  const missing = REQUIRED_ENV_VARS.filter((name) => !process.env[name]);
  if (missing.length) {
    throw new Error(`Missing R2 env vars: ${missing.join(", ")}. Add them to your .env.local file.`);
  }

  client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
  return client;
}

function parseDataUrl(dataUrl) {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl || "");
  if (!match) return null;
  const [, contentType, base64] = match;
  return { contentType, buffer: Buffer.from(base64, "base64") };
}

function slugify(text) {
  const slug = String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return slug || "player";
}

// Decodes a { name, type, data } upload (data = base64 data URL) into a
// buffer, validates its size, and hashes it for duplicate detection.
// Returns null if no file was submitted.
export function parseUploadedFile(file) {
  if (!file || !file.data) return null;

  const parsed = parseDataUrl(file.data);
  if (!parsed) {
    throw new Error(`Could not read uploaded file "${file.name || "file"}".`);
  }
  if (parsed.buffer.length > MAX_FILE_BYTES) {
    throw new Error(`${file.name || "File"} is larger than 5MB.`);
  }

  return {
    buffer: parsed.buffer,
    contentType: file.type || parsed.contentType || "application/octet-stream",
    hash: crypto.createHash("sha256").update(parsed.buffer).digest("hex"),
  };
}

// Builds a human-readable R2 key like "cnic/ali_khan_1234512345671_cnic.jpg".
// The CNIC digits keep the key unique per player even when names repeat.
export function buildFileKey(folder, playerName, cnicNumber, label, contentType) {
  const slug = slugify(playerName);
  const cnicDigits = String(cnicNumber || "").replace(/\D/g, "") || crypto.randomUUID().slice(0, 8);
  const ext = EXTENSION_BY_TYPE[contentType] || "bin";
  return `${folder}/${slug}_${cnicDigits}_${label}.${ext}`;
}

// Builds a unique R2 key for assets that aren't tied to a player, like
// "sponsors/sponsor_name_a1b2c3d4.png".
export function buildAssetKey(folder, label, contentType) {
  const slug = slugify(label);
  const unique = crypto.randomUUID().slice(0, 8);
  const ext = EXTENSION_BY_TYPE[contentType] || "bin";
  return `${folder}/${slug}_${unique}.${ext}`;
}

// Generates a short-lived signed PUT URL so the browser can upload a file
// straight to R2, bypassing the hosting platform's serverless function body
// size limit (e.g. Vercel's ~4.5MB request body cap) entirely -- the file
// bytes never pass through our API route.
export async function createPresignedUploadUrl(key, contentType) {
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(getClient(), command, { expiresIn: UPLOAD_URL_EXPIRY_SECONDS });
}

// Cheap existence/size check (no body downloaded) used to verify a
// client-claimed upload actually landed in R2 before we trust it. Returns
// null if the object doesn't exist.
export async function headFileInfo(key) {
  try {
    const result = await getClient().send(
      new HeadObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key })
    );
    return { size: result.ContentLength ?? 0, contentType: result.ContentType || null };
  } catch (error) {
    if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) return null;
    throw error;
  }
}

// Downloads an object we already confirmed exists (via headFileInfo) and
// hashes its actual bytes server-side. Used instead of trusting a
// client-supplied hash, so duplicate-file detection can't be spoofed by a
// client sending an unrelated hash alongside a direct-to-R2 upload.
export async function downloadAndHashFile(key) {
  const result = await getClient().send(
    new GetObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key })
  );
  const buffer = Buffer.from(await result.Body.transformToByteArray());
  return {
    buffer,
    contentType: result.ContentType || null,
    hash: crypto.createHash("sha256").update(buffer).digest("hex"),
  };
}

export async function uploadBufferToR2(key, buffer, contentType) {
  await getClient().send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );
  return key;
}

// Generates a short-lived signed URL for privately viewing an object.
// Returns null if there's no key to sign.
export async function getSignedFileUrl(key) {
  if (!key) return null;

  const command = new GetObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key });
  return getSignedUrl(getClient(), command, { expiresIn: SIGNED_URL_EXPIRY_SECONDS });
}

export async function deleteFileFromR2(key) {
  if (!key) return;
  await getClient().send(
    new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key })
  );
}
