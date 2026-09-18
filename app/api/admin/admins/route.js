import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/mongodb";
import AdminUser from "@/models/AdminUser";
import { verifySessionToken, hashPassword, SESSION_COOKIE_NAME } from "@/lib/auth";

// Team account management -- restricted to "owner" accounts so a regular
// admin can't add themselves extra accounts or remove teammates.

function getSession() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

function requireOwner() {
  const session = getSession();
  if (!session || session.role !== "owner") return null;
  return session;
}

function toPublicShape(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  };
}

export async function GET() {
  if (!requireOwner()) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  await connectToDatabase();
  const users = await AdminUser.find().sort({ createdAt: 1 }).lean();
  return NextResponse.json({ admins: users.map(toPublicShape) });
}

export async function POST(request) {
  if (!requireOwner()) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const body = await request.json();
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const role = body.role === "owner" ? "owner" : "admin";

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

  return NextResponse.json({ ok: true, admin: toPublicShape(user) }, { status: 201 });
}

export async function DELETE(request) {
  const session = requireOwner();
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
