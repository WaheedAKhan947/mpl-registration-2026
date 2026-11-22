import crypto from "node:crypto";
import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import OverlayState from "@/models/OverlayState";
import { getScoringSession, canScoreMatch } from "@/lib/scoringServer";
import { buildSquads, loadPublicMatch } from "@/lib/publicMatch";
import { findLastHighlight } from "@/lib/overlayServer";
import { CONTROL_PANELS, CONTROL_SCREENS, DEFAULT_CONTROL, publicControl } from "@/lib/overlay/control";

export const dynamic = "force-dynamic";

// Operator control of the broadcast overlay (Admin > Stream Overlay).
//   GET  ?matchId=            current control state, both XIs, last highlight
//   POST { matchId, action, value }
//     action "screen"   value one of CONTROL_SCREENS
//            "panel"    value one of CONTROL_PANELS
//            "sponsors" value true / false
//            "card"     value a playing-XI player id (shows their card once)
//            "replay"   re-runs the last FOUR / SIX / WICKET once
//            "reset"    everything back to automatic
//            "streamStart" value "now", an ISO time, or null (highlights log)
// Owners, admins and the match's scorers. Overlays pick changes up on their
// next poll (about 2 seconds).

const NO_STORE = { "Cache-Control": "no-store" };

function error(message, status = 400) {
  return NextResponse.json({ error: message }, { status, headers: NO_STORE });
}

async function load(session, matchId) {
  if (!session) return { response: error("Not authenticated.", 401) };
  if (!mongoose.isValidObjectId(String(matchId || ""))) return { response: error("Choose a match.") };
  await connectToDatabase();
  const data = await loadPublicMatch(matchId);
  if (!data) return { response: error("Match not found.", 404) };
  if (!canScoreMatch(session, data.match)) return { response: error("You are not a scorer for this match.", 403) };
  return { data };
}

function describe(event) {
  if (!event) return null;
  return { type: event.type, overBall: event.overBall, innings: event.innings, player: event.batter?.name || "" };
}

async function snapshot(data) {
  const doc = await OverlayState.findOne({ match: data.match._id }).lean();
  return {
    control: publicControl(doc),
    card: doc?.card?.id ? { id: doc.card.id, player: String(doc.card.player || ""), at: doc.card.at } : null,
    replay: doc?.replay?.id ? { id: doc.replay.id, at: doc.replay.at } : null,
    streamStartedAt: doc?.streamStartedAt || null,
    lastHighlight: describe(findLastHighlight(data)),
    squads: buildSquads(data).map((side) => ({
      team: side.team,
      players: side.players.map((p) => ({ id: p.id, name: p.name, role: p.role || "" })),
    })),
    scoringStatus: data.match.scoringStatus || "not_started",
  };
}

export async function GET(request) {
  const matchId = new URL(request.url).searchParams.get("matchId");
  const { data, response } = await load(await getScoringSession(), matchId);
  if (response) return response;
  return NextResponse.json(await snapshot(data), { headers: NO_STORE });
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return error("Invalid request.");
  }
  const session = await getScoringSession();
  const { data, response } = await load(session, body?.matchId);
  if (response) return response;

  const { action, value } = body;
  const now = new Date();
  const oneShotId = () => crypto.randomBytes(6).toString("hex");
  let set;

  if (action === "screen") {
    if (!CONTROL_SCREENS.includes(value)) return error("Unknown screen.");
    set = { screen: value };
  } else if (action === "panel") {
    if (!CONTROL_PANELS.includes(value)) return error("Unknown panel.");
    set = { panel: value };
  } else if (action === "sponsors") {
    if (typeof value !== "boolean") return error("Sponsors must be on or off.");
    set = { sponsors: value };
  } else if (action === "card") {
    const xi = [...(data.match.playingXI?.teamA || []), ...(data.match.playingXI?.teamB || [])].map(String);
    if (!xi.includes(String(value))) return error("Pick a player from either playing XI.");
    set = { card: { id: oneShotId(), player: value, at: now } };
  } else if (action === "replay") {
    if (!findLastHighlight(data)) return error("There is no four, six or wicket to replay yet.");
    set = { replay: { id: oneShotId(), at: now } };
  } else if (action === "streamStart") {
    if (value === null) set = { streamStartedAt: null };
    else {
      const when = value === "now" ? now : new Date(value);
      if (Number.isNaN(when.getTime())) return error("Invalid stream start time.");
      if (Math.abs(when.getTime() - now.getTime()) > 24 * 60 * 60 * 1000) return error("The stream start must be within a day of now.");
      set = { streamStartedAt: when };
    }
  } else if (action === "reset") {
    set = { ...DEFAULT_CONTROL };
  } else {
    return error("Unknown action.");
  }

  await OverlayState.updateOne(
    { match: data.match._id },
    { $set: { ...set, updatedBy: session.email || session.name || "" } },
    { upsert: true }
  );
  return NextResponse.json(await snapshot(data), { headers: NO_STORE });
}
