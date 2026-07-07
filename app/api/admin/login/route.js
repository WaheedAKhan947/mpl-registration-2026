import { NextResponse } from "next/server";
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/lib/auth";

export async function POST(request) {
  try {
    const { password } = await request.json();
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      return NextResponse.json(
        { error: "ADMIN_PASSWORD is not configured on the server." },
        { status: 500 }
      );
    }

    if (!password || password !== adminPassword) {
      return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
    }

    const token = createSessionToken();
    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
    return response;
  } catch (error) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
