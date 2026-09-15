import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import mongoose from "mongoose";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Match from "@/models/Match";
import { ROSTER_TEAMS } from "@/lib/siteData";
import { MATCH_STATUSES, isIsoDate, serializeMatch } from "@/lib/matches";

function requireAuth() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

function text(value, max = 120) {
  return String(value ?? "").trim().slice(0, max);
}

// Blank means "not entered"; anything else must be a non-negative whole number.
function optionalCount(value) {
  if (value === "" || value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isFinite(num) && num >= 0 ? Math.floor(num) : null;
}

function readPerformer(input) {
  return { name: text(input?.name), figures: text(input?.figures, 40) };
}

function readInnings(input) {
  const runs = optionalCount(input?.runs);
  const wickets = optionalCount(input?.wickets);
  return {
    runs,
    // A score entered without a wicket count reads as "no wickets lost".
    wickets: runs === null ? null : Math.min(wickets ?? 0, 10),
    overs: text(input?.overs, 10),
    topBatter: readPerformer(input?.topBatter),
    topBowler: readPerformer(input?.topBowler),
  };
}

// Validates a submitted match and returns either { data } or { error }.
function readMatch(body) {
  const date = text(body.date, 10);
  if (!isIsoDate(date)) {
    return { error: "Please choose a valid match date." };
  }

  const teamA = text(body.teamA);
  const teamB = text(body.teamB);
  if (!ROSTER_TEAMS.includes(teamA) || !ROSTER_TEAMS.includes(teamB)) {
    return { error: "Please pick two league teams." };
  }
  if (teamA === teamB) {
    return { error: "A team cannot play against itself." };
  }

  const motmTeam = text(body.manOfTheMatch?.team);

  return {
    data: {
      matchNumber: optionalCount(body.matchNumber),
      date,
      time: text(body.time, 40),
      venue: text(body.venue),
      teamA,
      teamB,
      status: MATCH_STATUSES.includes(body.status) ? body.status : "upcoming",
      teamAInnings: readInnings(body.teamAInnings),
      teamBInnings: readInnings(body.teamBInnings),
      result: text(body.result, 200),
      manOfTheMatch: {
        name: text(body.manOfTheMatch?.name),
        team: motmTeam === teamA || motmTeam === teamB ? motmTeam : "",
        performance: text(body.manOfTheMatch?.performance, 80),
      },
    },
  };
}

export async function GET() {
  if (!requireAuth()) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  await connectToDatabase();
  const matches = await Match.find().sort({ date: -1, matchNumber: -1, createdAt: -1 }).lean();

  return NextResponse.json({ matches: matches.map(serializeMatch) });
}

export async function POST(request) {
  if (!requireAuth()) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { data, error } = readMatch(await request.json());
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  await connectToDatabase();
  const match = await Match.create(data);

  return NextResponse.json({ ok: true, match: serializeMatch(match) }, { status: 201 });
}

export async function PUT(request) {
  if (!requireAuth()) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json();
  if (!body.id || !mongoose.isValidObjectId(body.id)) {
    return NextResponse.json({ error: "Missing id." }, { status: 400 });
  }

  const { data, error } = readMatch(body);
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  await connectToDatabase();
  const match = await Match.findByIdAndUpdate(body.id, data, { new: true, runValidators: true }).lean();
  if (!match) {
    return NextResponse.json({ error: "Match not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, match: serializeMatch(match) });
}

export async function DELETE(request) {
  if (!requireAuth()) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { id } = await request.json();
  if (!id || !mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: "Missing id." }, { status: 400 });
  }

  await connectToDatabase();
  await Match.findByIdAndDelete(id);

  return NextResponse.json({ ok: true });
}
