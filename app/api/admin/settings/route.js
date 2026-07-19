import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Settings from "@/models/Settings";
import { getYoutubeVideoId } from "@/lib/youtube";

function requireAuth() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

export async function GET() {
  if (!requireAuth()) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  await connectToDatabase();
  const settings = await Settings.findOne({ key: "site" }).lean();
  return NextResponse.json({ highlightVideoUrl: settings?.highlightVideoUrl || "" });
}

export async function PUT(request) {
  if (!requireAuth()) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { highlightVideoUrl } = await request.json();
  const trimmed = String(highlightVideoUrl || "").trim();

  if (trimmed && !getYoutubeVideoId(trimmed)) {
    return NextResponse.json({ error: "Enter a valid YouTube link." }, { status: 400 });
  }

  await connectToDatabase();
  await Settings.findOneAndUpdate(
    { key: "site" },
    { highlightVideoUrl: trimmed },
    { upsert: true }
  );

  return NextResponse.json({ ok: true, highlightVideoUrl: trimmed });
}
