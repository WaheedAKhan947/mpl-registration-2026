import { NextResponse } from "next/server";
import { cookies } from "next/headers";
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
  const [teams, counts] = await Promise.all([
    Team.find({ name: { $in: ROSTER_TEAMS } }).lean(),
    Registration.aggregate([
      { $match: { allocatedTeam: { $in: ROSTER_TEAMS } } },
      { $group: { _id: "$allocatedTeam", count: { $sum: 1 } } },
    ]),
  ]);

  const ownerByName = new Map(teams.map((team) => [team.name, team.ownerName || ""]));
  const countByName = new Map(counts.map((c) => [c._id, c.count]));

  const data = ROSTER_TEAMS.map((name) => ({
    name,
    ownerName: ownerByName.get(name) || "",
    playerCount: countByName.get(name) || 0,
  }));

  return NextResponse.json({ teams: data });
}

export async function PUT(request) {
  if (!requireAuth()) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { name, ownerName } = await request.json();
  if (!ROSTER_TEAMS.includes(name)) {
    return NextResponse.json({ error: "Invalid team." }, { status: 400 });
  }

  await connectToDatabase();
  await Team.findOneAndUpdate(
    { name },
    { ownerName: String(ownerName || "").trim() },
    { upsert: true }
  );

  return NextResponse.json({ ok: true });
}
