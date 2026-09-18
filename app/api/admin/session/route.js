import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function GET() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(token);

  if (!session) {
    return NextResponse.json({ authenticated: false });
  }

  // Everything here comes straight from the signed cookie -- no database
  // read needed just to check who's logged in.
  return NextResponse.json({
    authenticated: true,
    id: session.sub,
    name: session.name,
    email: session.email,
    role: session.role,
  });
}
