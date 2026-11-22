// Account-checked admin sessions. Every admin API route calls one of these
// (always with `await`): the cookie must be genuine (lib/auth.js) AND the
// account must still exist, be switched on by the owner, and carry the same
// session version. The role, name and email come from the database, so a
// change by the owner applies on the very next request.
//
// One small read per admin request; the "last active" time is written at most
// once a minute per account.

import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/mongodb";
import AdminUser from "@/models/AdminUser";
import { ADMIN_ROLES, SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";

const ACTIVE_WRITE_MS = 60 * 1000;

// Any switched-on account, or null.
export async function verifyActiveSession(token) {
  const signed = verifySessionToken(token);
  if (!signed) return null;
  await connectToDatabase();
  let user;
  try {
    user = await AdminUser.findById(signed.sub).select("name email role active sessionVersion lastActiveAt").lean();
  } catch {
    return null;
  }
  if (!user || user.active === false) return null;
  if ((user.sessionVersion || 0) !== (signed.sv || 0)) return null;
  if (!ADMIN_ROLES.includes(user.role)) return null;

  const now = Date.now();
  if (!user.lastActiveAt || now - new Date(user.lastActiveAt).getTime() > ACTIVE_WRITE_MS) {
    await AdminUser.updateOne({ _id: user._id }, { $set: { lastActiveAt: new Date(now) } }).catch(() => {});
  }
  return { ...signed, sub: String(user._id), name: user.name, email: user.email, role: user.role };
}

// Dashboard routes outside the League section: owners and admins.
export async function verifyAdminSession(token) {
  const session = await verifyActiveSession(token);
  return session && session.role !== "scorer" ? session : null;
}

// League-section routes: owners, admins and scorers.
export async function verifyLeagueSession(token) {
  return verifyActiveSession(token);
}

// Owners only (Team access).
export async function verifyOwnerSession(token) {
  const session = await verifyActiveSession(token);
  return session && session.role === "owner" ? session : null;
}

// The current request's session cookie.
export function sessionCookie() {
  return cookies().get(SESSION_COOKIE_NAME)?.value;
}
