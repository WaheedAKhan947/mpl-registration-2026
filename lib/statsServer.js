// Public player profiles and leaderboards, built from PlayerMatchStats (the
// per-match cache rebuilt from balls whenever a match is finished).
//
// Privacy: only name, photo, role and batting/bowling style are shown, and a
// profile only exists for players who are on a team or have played a scored
// match, so a registration id cannot be used to look up anyone else.

import mongoose from "mongoose";
import Registration from "@/models/Registration";
import PlayerMatchStats from "@/models/PlayerMatchStats";
import Match from "@/models/Match";
import Team from "@/models/Team";
import Innings from "@/models/Innings";
import { outcomeFromInnings } from "@/lib/standings";
import { getSignedFileUrl } from "@/lib/r2";
import { dismissalText } from "@/lib/scoring";
import { aggregateCareer, buildLeaders, careersByPlayer } from "@/lib/playerStats";

const PUBLIC_FIELDS = "playerName playingRole battingStyle bowlingStyle allocatedTeam profilePicture";

export const STATS_CACHE_HEADERS = {
  "Cache-Control": "public, max-age=0, s-maxage=15, stale-while-revalidate=30",
};

async function photoUrl(key) {
  if (!key) return null;
  try {
    return await getSignedFileUrl(key);
  } catch {
    return null;
  }
}

function opponentOf(match, team) {
  if (!match) return "";
  return team === match.teamA ? match.teamB : match.teamA;
}

// Only rows of matches that still exist count (a deleted match's stats must
// never show up, even if they were left behind).
async function liveMatchFilter() {
  return { match: { $in: await Match.distinct("_id") } };
}

export async function leaderboards() {
  const rows = await PlayerMatchStats.find(await liveMatchFilter()).lean();
  const result = buildLeaders(careersByPlayer(rows), rows);

  const lists = [
    ...Object.values(result.batting),
    ...Object.values(result.bowling),
    ...Object.values(result.fielding),
  ];
  const playerIds = new Set(lists.flat().map((e) => e.player));
  const matchIds = new Set(lists.flat().map((e) => e.match).filter(Boolean));

  const [players, matches] = await Promise.all([
    Registration.find({ _id: { $in: [...playerIds] } }).select(PUBLIC_FIELDS).lean(),
    Match.find({ _id: { $in: [...matchIds] } }).select("teamA teamB date matchNumber").lean(),
  ]);
  const playerById = new Map(players.map((p) => [String(p._id), p]));
  const matchById = new Map(matches.map((m) => [String(m._id), m]));

  const decorate = (entry) => {
    const p = playerById.get(entry.player);
    const m = entry.match ? matchById.get(entry.match) : null;
    return {
      ...entry,
      name: p?.playerName || "Unknown",
      role: p?.playingRole || "",
      ...(m ? { opponent: opponentOf(m, entry.team), date: m.date, matchNumber: m.matchNumber ?? null } : {}),
    };
  };
  const decorateGroup = (group) => Object.fromEntries(Object.entries(group).map(([key, list]) => [key, list.map(decorate)]));

  const cap = async (entry) => {
    if (!entry) return null;
    const decorated = decorate(entry);
    return { ...decorated, photo: await photoUrl(playerById.get(entry.player)?.profilePicture) };
  };

  return {
    matchCount: new Set(rows.map((r) => String(r.match))).size,
    orangeCap: await cap(result.orangeCap),
    purpleCap: await cap(result.purpleCap),
    batting: decorateGroup(result.batting),
    bowling: decorateGroup(result.bowling),
    fielding: decorateGroup(result.fielding),
    qualifiers: result.qualifiers,
  };
}

export async function playerProfile(playerId) {
  if (!mongoose.isValidObjectId(String(playerId || ""))) return null;

  const live = await liveMatchFilter();
  const [player, rows] = await Promise.all([
    Registration.findById(playerId).select(PUBLIC_FIELDS).lean(),
    PlayerMatchStats.find({ player: playerId, ...live }).sort({ date: -1, createdAt: -1 }).lean(),
  ]);
  if (!player || (!player.allocatedTeam && rows.length === 0)) return null;

  const matchIds = rows.map((r) => r.match);
  const nameIds = new Set();
  for (const r of rows) {
    if (r.batting?.dismissal?.bowler) nameIds.add(String(r.batting.dismissal.bowler));
    for (const f of r.batting?.dismissal?.fielders || []) nameIds.add(String(f));
  }

  const [matches, dismissers, team, allRows, inningsDocs] = await Promise.all([
    Match.find({ _id: { $in: matchIds } }).select("teamA teamB date matchNumber result resultInfo status").lean(),
    Registration.find({ _id: { $in: [...nameIds] } }).select("playerName").lean(),
    player.allocatedTeam ? Team.findOne({ name: player.allocatedTeam }).select("captain viceCaptain").lean() : null,
    PlayerMatchStats.find(live).select("player match team batting bowling fielding").lean(),
    Innings.find({ match: { $in: matchIds }, number: { $lte: 2 } }).select("match number battingTeam runs target").lean(),
  ]);
  const matchById = new Map(matches.map((m) => [String(m._id), m]));
  // Who won each match, from its innings (not a stored result field).
  const winnerOf = (m) => {
    if (!m) return null;
    const own = inningsDocs.filter((i) => String(i.match) === String(m._id));
    return outcomeFromInnings({
      first: own.find((i) => i.number === 1),
      second: own.find((i) => i.number === 2),
      abandoned: m.status === "abandoned",
    });
  };
  const names = new Map(dismissers.map((p) => [String(p._id), p.playerName]));
  const nameOf = (id) => (id ? names.get(String(id)) || "" : "");

  const caps = buildLeaders(careersByPlayer(allRows), allRows, { limit: 1 });
  const id = String(player._id);

  return {
    player: {
      id,
      name: player.playerName,
      role: player.playingRole || "",
      battingStyle: player.battingStyle || "",
      bowlingStyle: player.bowlingStyle || "",
      team: player.allocatedTeam || rows[0]?.team || "",
      photo: await photoUrl(player.profilePicture),
      captain: String(team?.captain || "") === id,
      viceCaptain: String(team?.viceCaptain || "") === id,
      orangeCap: caps.orangeCap?.player === id,
      purpleCap: caps.purpleCap?.player === id,
    },
    career: aggregateCareer(rows),
    matches: rows.map((r) => {
      const m = matchById.get(String(r.match));
      const dismissal = r.batting?.dismissal?.type ? r.batting.dismissal : null;
      return {
        matchId: String(r.match),
        date: r.date || m?.date || "",
        matchNumber: m?.matchNumber ?? null,
        team: r.team,
        opponent: opponentOf(m, r.team),
        result: m?.result || "",
        won: (() => {
          const decided = winnerOf(m);
          return decided?.outcome === "win" ? decided.winner === r.team : null;
        })(),
        batting: r.batting?.didBat
          ? {
              runs: r.batting.runs,
              balls: r.batting.balls,
              fours: r.batting.fours,
              sixes: r.batting.sixes,
              out: r.batting.out,
              dismissal: dismissal ? dismissalText(dismissal, nameOf) : "",
            }
          : null,
        bowling:
          (r.bowling?.legalBalls || 0) > 0 || (r.bowling?.runs || 0) > 0
            ? { overs: r.bowling.overs, runs: r.bowling.runs, wickets: r.bowling.wickets, maidens: r.bowling.maidens, economy: r.bowling.economy }
            : null,
        fielding: r.fielding || { catches: 0, runOuts: 0, stumpings: 0 },
      };
    }),
  };
}

// Tournament numbers (finished, ball-by-ball scored matches only) for the
// stream overlay's player cards. Adds `career` to each NEW_BATTER and
// PLAYER_CARD event.
const CAREER_EVENTS = new Set(["NEW_BATTER", "PLAYER_CARD"]);

export async function attachCareers(events) {
  const ids = [...new Set(events.filter((e) => CAREER_EVENTS.has(e.type) && e.batter?.id).map((e) => e.batter.id))];
  if (!ids.length) return events;
  const rows = await PlayerMatchStats.find({ player: { $in: ids }, ...(await liveMatchFilter()) }).lean();
  const byPlayer = new Map(ids.map((id) => [id, []]));
  for (const row of rows) byPlayer.get(String(row.player))?.push(row);
  return events.map((event) => {
    if (!CAREER_EVENTS.has(event.type) || !event.batter?.id) return event;
    const c = aggregateCareer(byPlayer.get(event.batter.id) || []);
    return {
      ...event,
      career: {
        matches: c.matches,
        innings: c.batting.innings,
        runs: c.batting.runs,
        average: c.batting.average,
        strikeRate: c.batting.strikeRate,
        highest: c.batting.highestText,
        fifties: c.batting.fifties + c.batting.hundreds,
        wickets: c.bowling.wickets,
        bowlingInnings: c.bowling.innings,
        economy: c.bowling.economy,
        bestBowling: c.bowling.bestText,
      },
    };
  });
}
