import crypto from "crypto";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB
const SIGNED_URL_EXPIRY_SECONDS = 60 * 60; // 1 hour

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
