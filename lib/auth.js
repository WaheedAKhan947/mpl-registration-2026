import crypto from "crypto";
import bcrypt from "bcryptjs";

const COOKIE_NAME = "mpl_admin_session";
const SESSION_HOURS = 12;
const BCRYPT_ROUNDS = 10;

// Brute-force protection on login, enforced in app/api/admin/login/route.js.
export const MAX_FAILED_ATTEMPTS = 5;
export const LOCK_MINUTES = 15;

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

// Creates a signed session token: base64(JSON payload).signature
// The payload carries the admin's id, name, email, and role, so every page
// and API route can read "who is this" straight from the cookie without a
// database lookup on every request -- that matters on a free-tier MongoDB
// plan where we want to keep read volume low. The tradeoff: removing a
// teammate's account doesn't instantly kill a cookie they already have: it
// just stops working the next time they'd need to log in again, and expires
// within SESSION_HOURS regardless. Rotating SESSION_SECRET still force-logs
// out everyone immediately if that's ever needed.
export function createSessionToken(user) {
  const expiresAt = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
  const payload = JSON.stringify({
    sub: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    exp: expiresAt,
  });
  const encodedPayload = Buffer.from(payload).toString("base64");
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

// Verifies the signed cookie and returns the embedded session data
// ({ sub, name, email, role, exp }), or null if it's missing, tampered
// with, malformed, or expired.
export function verifySessionToken(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) return null;
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  const expectedSignature = sign(encodedPayload);
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (sigBuffer.length !== expectedBuffer.length) return null;
  if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) return null;

  let payload;
  try {
    payload = JSON.parse(Buffer.from(encodedPayload, "base64").toString("utf8"));
  } catch {
    return null;
  }

  if (!payload || !payload.sub || !payload.exp || Date.now() > payload.exp) return null;

  return payload;
}

// bcryptjs is pure JS (no native bindings to compile), which is the safer
// choice on Vercel's serverless bundler than native bcrypt.
export function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export function verifyPassword(password, hash) {
  if (!hash) return Promise.resolve(false);
  return bcrypt.compare(password, hash);
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
export const SESSION_MAX_AGE_SECONDS = SESSION_HOURS * 60 * 60;
