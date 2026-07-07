import crypto from "crypto";

const COOKIE_NAME = "mpl_admin_session";
const SESSION_HOURS = 12;

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET is not set. Add it to your .env.local file (see .env.local.example)."
    );
  }
  return secret;
}

function sign(value) {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("hex");
}

// Creates a signed token: base64(expiryTimestamp).signature
// This avoids needing an extra JWT dependency for a simple admin-only login.
export function createSessionToken() {
  const expiresAt = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
  const payload = String(expiresAt);
  const signature = sign(payload);
  return `${Buffer.from(payload).toString("base64")}.${signature}`;
}

export function verifySessionToken(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) return false;
  const [encodedPayload, signature] = token.split(".");
  let payload;
  try {
    payload = Buffer.from(encodedPayload, "base64").toString("utf8");
  } catch {
    return false;
  }
  const expectedSignature = sign(payload);

  const sigBuffer = Buffer.from(signature || "");
  const expectedBuffer = Buffer.from(expectedSignature);
  if (sigBuffer.length !== expectedBuffer.length) return false;
  if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) return false;

  const expiresAt = Number(payload);
  if (!expiresAt || Date.now() > expiresAt) return false;

  return true;
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
export const SESSION_MAX_AGE_SECONDS = SESSION_HOURS * 60 * 60;
