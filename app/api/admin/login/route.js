import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import AdminUser from "@/models/AdminUser";
import {
  createSessionToken,
  verifyPassword,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  MAX_FAILED_ATTEMPTS,
  LOCK_MINUTES,
} from "@/lib/auth";

// Same message whether the email doesn't exist or the password is wrong --
// never reveal which one it was.
const GENERIC_ERROR = "Incorrect email or password.";

export async function POST(request) {
  let email;
  let password;
  try {
    const body = await request.json();
    email = String(body.email || "").trim().toLowerCase();
    password = String(body.password || "");
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!email || !password) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  await connectToDatabase();
  const user = await AdminUser.findOne({ email });

  if (!user) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  if (user.lockUntil && user.lockUntil.getTime() > Date.now()) {
    const minutesLeft = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
    return NextResponse.json(
      {
        error: `Too many failed attempts. Try again in ${minutesLeft} minute${
          minutesLeft === 1 ? "" : "s"
        }.`,
      },
      { status: 429 }
    );
  }

  const passwordMatches = await verifyPassword(password, user.passwordHash);
  if (!passwordMatches) {
    user.failedAttempts = (user.failedAttempts || 0) + 1;
    if (user.failedAttempts >= MAX_FAILED_ATTEMPTS) {
      user.lockUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
      user.failedAttempts = 0;
    }
    await user.save();
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  user.failedAttempts = 0;
  user.lockUntil = null;
  user.lastLoginAt = new Date();
  await user.save();

  const token = createSessionToken(user);
  const response = NextResponse.json({
    ok: true,
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
  });
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return response;
}
