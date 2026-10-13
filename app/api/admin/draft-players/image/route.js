import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Registration from "@/models/Registration";
import Sponsor from "@/models/Sponsor";
import { getFileStream } from "@/lib/r2";

export const dynamic = "force-dynamic";

function requireAuth() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

const TYPE_BY_EXTENSION = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

// Same-origin copy of a player photo or sponsor logo, used only when the
// Draft Board exports a card to PNG: the canvas export needs image bytes it
// is allowed to read, and the private R2 bucket doesn't send CORS headers
// for every origin (e.g. localhost). Only these two image fields can be
// served, so CNIC and receipt files are never reachable through this route.
export async function GET(request) {
  if (!requireAuth()) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const params = new URL(request.url).searchParams;
  const playerId = params.get("player");
  const sponsorId = params.get("sponsor");
  if (!playerId && !sponsorId) {
    return NextResponse.json({ error: "Missing player or sponsor." }, { status: 400 });
  }

  await connectToDatabase();
  let key = "";
  try {
    if (playerId) {
      const player = await Registration.findById(playerId).select("profilePicture").lean();
      key = player?.profilePicture || "";
    } else {
      const sponsor = await Sponsor.findById(sponsorId).select("logo").lean();
      key = sponsor?.logo || "";
    }
  } catch {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }

  const body = key ? await getFileStream(key) : null;
  if (!body) {
    return NextResponse.json({ error: "Image not found." }, { status: 404 });
  }

  const bytes = await body.transformToByteArray();
  const extension = key.split(".").pop().toLowerCase();
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": TYPE_BY_EXTENSION[extension] || "application/octet-stream",
      "Cache-Control": "private, no-store",
    },
  });
}
