import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/mongodb";
import AdminUser from "@/models/AdminUser";
import {
  verifySessionToken,
  verifyPassword,
  hashPassword,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";

function getSession() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

export async function POST(request) {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json();
  const currentPassword = String(body.currentPassword || "");
  const newPassword = String(body.newPassword || "");

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Enter your current and new password." }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 });
  }

  await connectToDatabase();
  const user = await AdminUser.findById(session.sub);
  if (!user) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  const matches = await verifyPassword(currentPassword, user.passwordHash);
  if (!matches) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });
  }

  user.passwordHash = await hashPassword(newPassword);
  await user.save();

  return NextResponse.json({ ok: true });
}
