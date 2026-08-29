import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Team from "@/models/Team";
import Registration from "@/models/Registration";
import { getSignedFileUrl } from "@/lib/r2";
import { ROSTER_TEAMS } from "@/lib/siteData";

export async function GET(request) {
  const name = new URL(request.url).searchParams.get("name");
  if (!ROSTER_TEAMS.includes(name)) {
    return NextResponse.json({ error: "Invalid team." }, { status: 400 });
  }

  await connectToDatabase();
  const [team, players] = await Promise.all([
    Team.findOne({ name }).lean(),
    Registration.find({ allocatedTeam: name }).sort({ playerName: 1 }).lean(),
  ]);

  const data = await Promise.all(
    players.map(async (player) => ({
      id: player._id.toString(),
      playerName: player.playerName,
      playingRole: player.playingRole,
      battingStyle: player.battingStyle,
      bowlingStyle: player.bowlingStyle,
      profilePicture: await getSignedFileUrl(player.profilePicture),
    }))
  );

  return NextResponse.json(
    { name, ownerName: team?.ownerName || "", players: data },
    { headers: { "Cache-Control": "no-store" } }
  );
}
