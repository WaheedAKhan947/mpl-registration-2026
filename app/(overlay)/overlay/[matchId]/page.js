import OverlayApp from "@/components/overlay/OverlayApp";
import { parseOverlayParams } from "@/lib/overlay/params";
import { connectToDatabase } from "@/lib/mongodb";
import { loadPublicMatch } from "@/lib/publicMatch";
import { buildOverlayPayload } from "@/lib/overlayServer";

export const dynamic = "force-dynamic";

// Broadcast overlay for one match, added as a Browser / Web source in OBS or
// PRISM Live Studio. The first snapshot is rendered on the server, so after
// the streaming app reloads the page the score is there on the first frame;
// the client then polls GET /api/matches/[id]/overlay.
//   /overlay/demo or ?demo=1 shows sample data without a match.
export default async function OverlayPage({ params, searchParams }) {
  const options = parseOverlayParams(searchParams);
  let initial = null;
  if (!options.demo && params.matchId !== "demo") {
    try {
      await connectToDatabase();
      const data = await loadPublicMatch(params.matchId);
      // Plain JSON (dates as strings) so it can cross to the client component.
      if (data) {
        initial = JSON.parse(JSON.stringify(await buildOverlayPayload(data)));
      }
    } catch {
      // The client feed keeps trying; nothing is shown until it succeeds.
    }
  }
  return <OverlayApp matchId={params.matchId} params={options} initial={initial} />;
}
