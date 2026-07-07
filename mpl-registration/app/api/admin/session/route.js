import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function GET() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  const authenticated = verifySessionToken(token);
  return NextResponse.json({ authenticated });
}
