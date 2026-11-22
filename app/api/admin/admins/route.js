import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import AdminUser from "@/models/AdminUser";
import Ball from "@/models/Ball";
import { hashPassword } from "@/lib/auth";
import { sessionCookie, verifyOwnerSession } from "@/lib/adminSession";

export const dynamic = "force-dynamic";

// Team account management -- owners only.
//   GET     every account, with activity (last login, last active, recent
//           logins, failed attempts, balls scored)
//   POST    add an account
//   PATCH   { id, active }  switch an account on or off; off logs it out at once
//   DELETE  { id }          remove an account (its sessions stop at once)

async function requireOwner() {
  return verifyOwnerSession(sessionCookie());
}

function toPublicShape(user, scoring) {
  const id = user._id.toString();
  const s = scoring?.get(id);
  return {
    id,
    name: user.name,
    email: user.email,
    role: user.role,
    active: user.active !== false,
    disabledAt: user.disabledAt || null,
    lastLoginAt: user.lastLoginAt,
    lastActiveAt: user.lastActiveAt || null,
    loginCount: user.loginCount || 0,
    loginHistory: (user.loginHistory || []).slice(-5).reverse(),
    lastFailedLoginAt: user.lastFailedLoginAt || null,
    failedAttempts: user.failedAttempts || 0,
    lockedUntil: user.lockUntil && new Date(user.lockUntil).getTime() > Date.now() ? user.lockUntil : null,
    ballsScored: s?.balls || 0,
    lastBallAt: s?.last || null,
    createdAt: user.createdAt,
  };
}

// Balls recorded by each account (Ball.createdBy).
async function scoringByAccount() {
  const rows = await Ball.aggregate([{ $group: { _id: "$createdBy", balls: { $sum: 1 }, last: { $max: "$createdAt" } } }]);
  return new Map(rows.filter((r) => r._id).map((r) => [String(r._id), { balls: r.balls, last: r.last }]));
}

export async function GET() {
  if (!(await requireOwner())) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  await connectToDatabase();
  const [users, scoring] = await Promise.all([AdminUser.find().sort({ createdAt: 1 }).lean(), scoringByAccount()]);
  return NextResponse.json({ admins: users.map((u) => toPublicShape(u, scoring)) }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request) {
  if (!(await requireOwner())) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const body = await request.json();
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const role = body.role === "owner" || body.role === "scorer" ? body.role : "admin";

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Name, email, and password are required." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  await connectToDatabase();
  const existing = await AdminUser.findOne({ email });
  if (existing) {
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const user = await AdminUser.create({ name, email, passwordHash, role });

  return NextResponse.json({ ok: true, admin: toPublicShape(user.toObject()) }, { status: 201 });
}

export async function PATCH(request) {
  const session = await requireOwner();
  if (!session) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const id = String(body.id || "");
  if (!mongoose.isValidObjectId(id) || typeof body.active !== "boolean") {
    return NextResponse.json({ error: "Send the account id and active: true or false." }, { status: 400 });
  }
  if (id === session.sub) {
    return NextResponse.json({ error: "You can't switch off your own account." }, { status: 400 });
  }

  await connectToDatabase();
  const target = await AdminUser.findById(id);
  if (!target) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }
  if (target.role === "owner") {
    return NextResponse.json({ error: "Owner accounts can't be switched off." }, { status: 400 });
  }

  if (body.active) {
    target.active = true;
    target.disabledAt = null;
    // Logging in again is needed: cookies from before stay invalid.
  } else if (target.active !== false) {
    target.active = false;
    target.disabledAt = new Date();
    target.sessionVersion = (target.sessionVersion || 0) + 1;
  }
  await target.save();

  const scoring = await scoringByAccount();
  return NextResponse.json({ ok: true, admin: toPublicShape(target.toObject(), scoring) });
}

export async function DELETE(request) {
  const session = await requireOwner();
  if (!session) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const body = await request.json();
  const { id } = body;
  if (!id) {
    return NextResponse.json({ error: "Missing id." }, { status: 400 });
  }
  if (id === session.sub) {
    return NextResponse.json(
      { error: "You can't remove your own account. Ask another owner, or use the create-admin script." },
      { status: 400 }
    );
  }

  await connectToDatabase();
  const target = await AdminUser.findById(id);
  if (!target) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  if (target.role === "owner") {
    const ownerCount = await AdminUser.countDocuments({ role: "owner" });
    if (ownerCount <= 1) {
      return NextResponse.json({ error: "Can't remove the last owner." }, { status: 400 });
    }
  }

  await AdminUser.deleteOne({ _id: id });
  return NextResponse.json({ ok: true });
}
