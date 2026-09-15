import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import mongoose from "mongoose";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Team from "@/models/Team";
import Registration from "@/models/Registration";
import { ROSTER_TEAMS } from "@/lib/siteData";

function requireAuth() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

export async function GET() {
  if (!requireAuth()) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  await connectToDatabase();
  const [teams, players] = await Promise.all([
    Team.find({ name: { $in: ROSTER_TEAMS } }).lean(),
    Registration.find({ allocatedTeam: { $in: ROSTER_TEAMS } })
      .select("playerName allocatedTeam")
      .sort({ playerName: 1 })
      .lean(),
  ]);

  const teamByName = new Map(teams.map((team) => [team.name, team]));
  const playersByTeam = new Map();
  for (const player of players) {
    const list = playersByTeam.get(player.allocatedTeam) || [];
    list.push({ id: player._id.toString(), playerName: player.playerName });
    playersByTeam.set(player.allocatedTeam, list);
  }

  const data = ROSTER_TEAMS.map((name) => {
    const team = teamByName.get(name);
    const teamPlayers = playersByTeam.get(name) || [];
    const captainId = team?.captain ? team.captain.toString() : "";
    return {
      name,
      ownerName: team?.ownerName || "",
      // Ignore a captain that has since been moved off this team.
      captainId: teamPlayers.some((p) => p.id === captainId) ? captainId : "",
      players: teamPlayers,
      playerCount: teamPlayers.length,
    };
  });

  return NextResponse.json({ teams: data });
}

export async function PUT(request) {
  if (!requireAuth()) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { name, ownerName, captainId } = await request.json();
  if (!ROSTER_TEAMS.includes(name)) {
    return NextResponse.json({ error: "Invalid team." }, { status: 400 });
  }

  await connectToDatabase();

  const update = {};
  if (ownerName !== undefined) {
    update.ownerName = String(ownerName || "").trim();
  }
  if (captainId !== undefined) {
    const id = String(captainId || "").trim();
    if (!id) {
      update.captain = null;
    } else {
      if (!mongoose.isValidObjectId(id)) {
        return NextResponse.json({ error: "Invalid captain." }, { status: 400 });
      }
      const player = await Registration.findById(id).select("allocatedTeam").lean();
      if (!player || player.allocatedTeam !== name) {
        return NextResponse.json(
          { error: "The captain must be a player allocated to this team." },
          { status: 400 }
        );
      }
      update.captain = player._id;
    }
  }

  await Team.findOneAndUpdate({ name }, update, { upsert: true });

  return NextResponse.json({ ok: true });
}
