import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import PointsTableRow from "@/models/PointsTableRow";

function requireAuth() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

function toNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function readStats(body) {
  return {
    played: toNumber(body.played),
    won: toNumber(body.won),
    lost: toNumber(body.lost),
    tied: toNumber(body.tied),
    noResult: toNumber(body.noResult),
    points: toNumber(body.points),
    netRunRate: toNumber(body.netRunRate),
  };
}

export async function GET() {
  if (!requireAuth()) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  await connectToDatabase();
  const rows = await PointsTableRow.find().sort({ points: -1, netRunRate: -1 }).lean();

  const data = rows.map((row) => ({
    id: row._id.toString(),
    team: row.team,
    played: row.played,
    won: row.won,
    lost: row.lost,
    tied: row.tied,
    noResult: row.noResult,
    points: row.points,
    netRunRate: row.netRunRate,
  }));

  return NextResponse.json({ rows: data });
}

export async function POST(request) {
  if (!requireAuth()) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json();
  const team = String(body.team || "").trim();
  if (!team) {
    return NextResponse.json({ error: "Team name is required." }, { status: 400 });
  }

  await connectToDatabase();
  const row = await PointsTableRow.create({ team, ...readStats(body) });

  return NextResponse.json({ ok: true, id: row._id.toString() }, { status: 201 });
}

export async function PUT(request) {
  if (!requireAuth()) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json();
  const { id } = body;
  if (!id) {
    return NextResponse.json({ error: "Missing id." }, { status: 400 });
  }

  await connectToDatabase();
  const row = await PointsTableRow.findById(id);
  if (!row) {
    return NextResponse.json({ error: "Row not found." }, { status: 404 });
  }

  if (body.team !== undefined) {
    const team = String(body.team).trim();
    if (!team) {
      return NextResponse.json({ error: "Team name is required." }, { status: 400 });
    }
    row.team = team;
  }
  Object.assign(row, readStats(body));

  await row.save();

  return NextResponse.json({ ok: true });
}

export async function DELETE(request) {
  if (!requireAuth()) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "Missing id." }, { status: 400 });
  }

  await connectToDatabase();
  await PointsTableRow.findByIdAndDelete(id);

  return NextResponse.json({ ok: true });
}
