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
    const viceCaptainId = team?.viceCaptain ? team.viceCaptain.toString() : "";
    return {
      name,
      ownerName: team?.ownerName || "",
      // Ignore a captain/vice-captain that has since been moved off this team.
      captainId: teamPlayers.some((p) => p.id === captainId) ? captainId : "",
      viceCaptainId: teamPlayers.some((p) => p.id === viceCaptainId) ? viceCaptainId : "",
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

  const { name, ownerName, captainId, viceCaptainId } = await request.json();
  if (!ROSTER_TEAMS.includes(name)) {
    return NextResponse.json({ error: "Invalid team." }, { status: 400 });
  }

  await connectToDatabase();

  const existingTeam = await Team.findOne({ name }).select("captain viceCaptain").lean();

  async function resolvePlayer(id, label) {
    const trimmed = String(id || "").trim();
    if (!trimmed) return { objectId: null, id: "" };
    if (!mongoose.isValidObjectId(trimmed)) {
      throw new Error(`Invalid ${label}.`);
    }
    const player = await Registration.findById(trimmed).select("allocatedTeam").lean();
    if (!player || player.allocatedTeam !== name) {
      throw new Error(`The ${label} must be a player allocated to this team.`);
    }
    return { objectId: player._id, id: trimmed };
  }

  const update = {};
  if (ownerName !== undefined) {
    update.ownerName = String(ownerName || "").trim();
  }

  let nextCaptainId = existingTeam?.captain ? existingTeam.captain.toString() : "";
  let nextViceCaptainId = existingTeam?.viceCaptain ? existingTeam.viceCaptain.toString() : "";

  try {
    if (captainId !== undefined) {
      const resolved = await resolvePlayer(captainId, "captain");
      update.captain = resolved.objectId;
      nextCaptainId = resolved.id;
    }
    if (viceCaptainId !== undefined) {
      const resolved = await resolvePlayer(viceCaptainId, "vice-captain");
      update.viceCaptain = resolved.objectId;
      nextViceCaptainId = resolved.id;
    }
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  if (nextCaptainId && nextViceCaptainId && nextCaptainId === nextViceCaptainId) {
    return NextResponse.json(
      { error: "The captain and vice-captain must be different players." },
      { status: 400 }
    );
  }

  await Team.findOneAndUpdate({ name }, update, { upsert: true });

  return NextResponse.json({ ok: true });
}
