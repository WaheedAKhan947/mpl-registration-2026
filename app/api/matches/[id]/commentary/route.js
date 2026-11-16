import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { buildCommentary, cacheHeaders, loadPublicMatch } from "@/lib/publicMatch";

export const dynamic = "force-dynamic";

// Ball-by-ball commentary, newest first, 30 at a time.
//   ?cursor=<innings>-<seq>  continue after the last item of the previous page
export async function GET(request, { params }) {
  await connectToDatabase();
  const data = await loadPublicMatch(params.id);
  if (!data) return NextResponse.json({ error: "Match not found." }, { status: 404 });
  const cursor = new URL(request.url).searchParams.get("cursor");
  return NextResponse.json(buildCommentary(data, cursor), { headers: cacheHeaders(data.match) });
}
