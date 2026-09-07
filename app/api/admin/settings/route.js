import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Settings from "@/models/Settings";
import { getYoutubeVideoId } from "@/lib/youtube";

const MAX_ANNOUNCEMENT_LENGTH = 240;

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
  return NextResponse.json({
    highlightVideoUrl: settings?.highlightVideoUrl || "",
    announcementText: settings?.announcementText || "",
    announcementEnabled: settings?.announcementEnabled ?? true,
  });
}

export async function PUT(request) {
  if (!requireAuth()) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json();
  const update = {};

  if ("highlightVideoUrl" in body) {
    const trimmed = String(body.highlightVideoUrl || "").trim();
    if (trimmed && !getYoutubeVideoId(trimmed)) {
      return NextResponse.json({ error: "Enter a valid YouTube link." }, { status: 400 });
    }
    update.highlightVideoUrl = trimmed;
  }

  if ("announcementText" in body) {
    const trimmed = String(body.announcementText || "").trim();
    if (trimmed.length > MAX_ANNOUNCEMENT_LENGTH) {
      return NextResponse.json(
        { error: `Announcement must be ${MAX_ANNOUNCEMENT_LENGTH} characters or fewer.` },
        { status: 400 }
      );
    }
    update.announcementText = trimmed;
  }

  if ("announcementEnabled" in body) {
    update.announcementEnabled = Boolean(body.announcementEnabled);
  }

  await connectToDatabase();
  const settings = await Settings.findOneAndUpdate({ key: "site" }, update, {
    upsert: true,
    new: true,
  }).lean();

  return NextResponse.json({
    ok: true,
    highlightVideoUrl: settings.highlightVideoUrl || "",
    announcementText: settings.announcementText || "",
    announcementEnabled: settings.announcementEnabled ?? true,
  });
}
