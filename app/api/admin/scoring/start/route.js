import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Match from "@/models/Match";
import Innings from "@/models/Innings";
import Ball from "@/models/Ball";
import Registration from "@/models/Registration";
import {
  MAX_XI,
  MIN_XI,
  canScoreMatch,
  getScoringSession,
  isObjectId,
  afterWrite,
  otherTeam,
} from "@/lib/scoringServer";

export const dynamic = "force-dynamic";

function error(message, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function wholeNumber(value, min, max) {
  const num = Number(value);
  return Number.isInteger(num) && num >= min && num <= max ? num : null;
}

function readXI(value) {
  if (!Array.isArray(value)) return null;
  const ids = value.map(String);
  if (!ids.every(isObjectId)) return null;
  return [...new Set(ids)];
}

// Sets the toss, overs, playing XIs and rules, then opens the first innings
// with its two openers and opening bowler. Can be re-run to fix the setup
// until the first ball is bowled.
export async function POST(request) {
  const session = await getScoringSession();
  if (!session) return error("Not authenticated.", 401);

  const body = await request.json().catch(() => ({}));
  if (!isObjectId(body.matchId)) return error("Pick a match.");

  await connectToDatabase();
  const match = await Match.findById(body.matchId);
  if (!match) return error("Match not found.", 404);
  if (!canScoreMatch(session, match)) return error("You are not a scorer for this match.", 403);
  if (match.scoringStatus === "completed") {
    return error("This match is already finished. An admin can re-open it for corrections.", 409);
  }
  if (await Ball.exists({ match: match._id })) {
    return error("Scoring has already started, so the setup can no longer be changed.", 409);
  }

  // Toss
  const tossWinner = String(body.toss?.winner || "");
  const decision = body.toss?.decision;
  if (tossWinner !== match.teamA && tossWinner !== match.teamB) return error("Choose who won the toss.");
  if (decision !== "bat" && decision !== "bowl") return error("Choose whether the toss winner bats or bowls.");
  const battingTeam = decision === "bat" ? tossWinner : otherTeam(match, tossWinner);
  const bowlingTeam = otherTeam(match, battingTeam);

  // Overs and rules
  const overs = wholeNumber(body.overs, 1, 50);
  if (!overs) return error("Overs must be a whole number from 1 to 50.");
  const rules = body.scoringConfig || {};
  const widePenalty = wholeNumber(rules.widePenalty ?? 1, 0, 5);
  const noBallPenalty = wholeNumber(rules.noBallPenalty ?? 1, 0, 5);
  if (widePenalty === null || noBallPenalty === null) return error("Wide and no-ball runs must be 0 to 5.");
  let maxOversPerBowler = null;
  if (rules.maxOversPerBowler !== null && rules.maxOversPerBowler !== undefined && rules.maxOversPerBowler !== "") {
    maxOversPerBowler = wholeNumber(rules.maxOversPerBowler, 1, overs);
    if (!maxOversPerBowler) return error(`Max overs per bowler must be between 1 and ${overs}.`);
  }
  let extraOverBowlers = null;
  if (rules.extraOverBowlers !== null && rules.extraOverBowlers !== undefined && rules.extraOverBowlers !== "") {
    extraOverBowlers = wholeNumber(rules.extraOverBowlers, 0, 11);
    if (extraOverBowlers === null) return error("Bowlers with an extra over must be 0 to 11.");
  }

  // Playing XIs
  const teamAXI = readXI(body.playingXI?.teamA);
  const teamBXI = readXI(body.playingXI?.teamB);
  if (!teamAXI || !teamBXI) return error("Pick the playing XI for both teams.");
  for (const [team, xi] of [
    [match.teamA, teamAXI],
    [match.teamB, teamBXI],
  ]) {
    if (xi.length < MIN_XI || xi.length > MAX_XI) {
      return error(`${team} needs between ${MIN_XI} and ${MAX_XI} players in the playing XI.`);
    }
  }
  if (teamAXI.some((id) => teamBXI.includes(id))) return error("A player cannot be in both playing XIs.");

  const registrations = await Registration.find({ _id: { $in: [...teamAXI, ...teamBXI] } })
    .select("allocatedTeam playerName")
    .lean();
  const teamOf = new Map(registrations.map((r) => [String(r._id), r.allocatedTeam]));
  for (const [team, xi] of [
    [match.teamA, teamAXI],
    [match.teamB, teamBXI],
  ]) {
    if (xi.some((id) => teamOf.get(id) !== team)) {
      return error(`Every ${team} player must be allocated to ${team} on the Draft Board.`);
    }
  }

  // Openers
  const battingXI = battingTeam === match.teamA ? teamAXI : teamBXI;
  const bowlingXI = battingTeam === match.teamA ? teamBXI : teamAXI;
  const striker = String(body.striker || "");
  const nonStriker = String(body.nonStriker || "");
  const bowler = String(body.bowler || "");
  if (!battingXI.includes(striker) || !battingXI.includes(nonStriker)) {
    return error(`Choose two opening batters from the ${battingTeam} XI.`);
  }
  if (striker === nonStriker) return error("The two openers must be different players.");
  if (!bowlingXI.includes(bowler)) return error(`Choose the opening bowler from the ${bowlingTeam} XI.`);

  // Only a match that is still unscored (or re-set up before ball one) moves on.
  const updated = await Match.findOneAndUpdate(
    { _id: match._id, scoringStatus: { $ne: "completed" } },
    {
      $set: {
        toss: { winner: tossWinner, decision },
        overs,
        playingXI: { teamA: teamAXI, teamB: teamBXI },
        scoringConfig: { widePenalty, noBallPenalty, maxOversPerBowler, extraOverBowlers, lastManStands: Boolean(rules.lastManStands) },
        scoringStatus: "in_progress",
        currentInnings: 1,
        // Keeps the existing homepage scorecard in step.
        status: "live",
      },
    },
    { new: true, runValidators: true }
  );
  if (!updated) return error("This match was finished by someone else.", 409);

  await Innings.deleteMany({ match: match._id });
  try {
    await Innings.create({ match: match._id, number: 1, battingTeam, bowlingTeam, striker, nonStriker, bowler });
  } catch (err) {
    if (err?.code === 11000) return error("Another scorer just started this match. Reload to continue.", 409);
    throw err;
  }

  return NextResponse.json({ ok: true, ...(await afterWrite(match._id)) });
}
