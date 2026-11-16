import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { loadPublicMatch } from "@/lib/publicMatch";
import { buildOverlayPayload } from "@/lib/overlayServer";

export const dynamic = "force-dynamic";

// Feed for the broadcast overlay (/overlay/[matchId]), polled every 2-4
// seconds by OBS / PRISM. Same shape as /live plus screen data, recent events,
// the operator's control state and the server time. Public
// and read-only. The 1-second CDN cache means many overlays, scorers'
// previews and the OBS bridge polling at once still cost one database read
// per second per match.
const HEADERS = { "Cache-Control": "public, max-age=0, s-maxage=1, stale-while-revalidate=2" };

export async function GET(_request, { params }) {
  await connectToDatabase();
  const data = await loadPublicMatch(params.id);
  if (!data) {
    return NextResponse.json({ error: "Match not found." }, { status: 404, headers: HEADERS });
  }
  return NextResponse.json(await buildOverlayPayload(data), { headers: HEADERS });
}
