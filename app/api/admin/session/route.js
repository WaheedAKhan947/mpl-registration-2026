import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/lib/auth";
import { verifyActiveSession } from "@/lib/adminSession";

export const dynamic = "force-dynamic";

// Who is logged in. The account is checked in the database, so an account the
// owner has switched off (or removed) reads as logged out; the dashboard
// polls this and returns to the login screen.
export async function GET() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  const session = await verifyActiveSession(token);

  if (!session) {
    return NextResponse.json({ authenticated: false, signedOut: Boolean(token) }, { headers: { "Cache-Control": "no-store" } });
  }

  return NextResponse.json(
    {
      authenticated: true,
      id: session.sub,
      name: session.name,
      email: session.email,
      role: session.role,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
