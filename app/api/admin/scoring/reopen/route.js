import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { canManageScoring } from "@/lib/auth";
import Match from "@/models/Match";
import { afterWrite, clearPlayerStats, getScoringSession, isObjectId, jsonError } from "@/lib/scoringServer";

export const dynamic = "force-dynamic";

// Re-opens a finished match so its balls can be corrected. Owners and admins
// only; scorer accounts cannot change a result once it is final.
//   { matchId }
export async function POST(request) {
  const session = getScoringSession();
  if (!session) return jsonError("Not authenticated.", 401);
  if (!canManageScoring(session)) return jsonError("Only an owner or admin can re-open a finished match.", 403);

  const body = await request.json().catch(() => ({}));
  if (!isObjectId(String(body.matchId || ""))) return jsonError("Match not found.", 404);

  await connectToDatabase();
  const reopened = await Match.updateOne(
    { _id: body.matchId, scoringStatus: "completed" },
    {
      // The result, points and player figures come back when it is finished again.
      $set: {
        scoringStatus: "in_progress",
        status: "live",
        result: "",
        resultInfo: { outcome: "", winner: "", margin: null, marginType: "" },
      },
    }
  );
  if (!reopened.matchedCount) return jsonError("Only a finished match can be re-opened.", 409);
  await clearPlayerStats(body.matchId);

  return NextResponse.json({ ok: true, ...(await afterWrite(body.matchId)) });
}
