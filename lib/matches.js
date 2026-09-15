import { TEAM_CARDS } from "@/lib/siteData";

export const MATCH_STATUSES = ["upcoming", "live", "completed", "abandoned"];

export const STATUS_LABELS = {
  upcoming: "Upcoming",
  live: "Live",
  completed: "Completed",
  abandoned: "Abandoned",
};

// Every fixture is played in Pakistan, so "today" follows the league's calendar
// day rather than whatever time zone the server happens to run in.
export const LEAGUE_TIME_ZONE = "Asia/Karachi";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function isIsoDate(value) {
  return typeof value === "string" && ISO_DATE.test(value);
}

// YYYY-MM-DD for the current league day (the en-CA locale formats in ISO order).
export function todayInLeagueTimeZone(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: LEAGUE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function shiftIsoDate(isoDate, days) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

// "Mon 14 Sep" (or "Mon 14 Sep 2026"), built by hand so the output does not
// depend on the viewer's locale data.
export function formatMatchDate(isoDate, { withYear = false } = {}) {
  if (!isIsoDate(isoDate)) return isoDate || "";
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const base = `${WEEKDAYS[date.getUTCDay()]} ${day} ${MONTHS[month - 1]}`;
  return withYear ? `${base} ${year}` : base;
}

export function teamLogo(teamName) {
  return TEAM_CARDS.find((team) => team.name === teamName)?.code || "";
}

// "164/6", or just "164" once a side is all out. Empty until the side has batted.
export function formatScore(innings) {
  if (innings?.runs === null || innings?.runs === undefined) return "";
  if (innings.wickets === null || innings.wickets === undefined || innings.wickets >= 10) {
    return String(innings.runs);
  }
  return `${innings.runs}/${innings.wickets}`;
}

function serializePerformer(performer) {
  return { name: performer?.name || "", figures: performer?.figures || "" };
}

function serializeInnings(innings) {
  return {
    runs: innings?.runs ?? null,
    wickets: innings?.wickets ?? null,
    overs: innings?.overs || "",
    topBatter: serializePerformer(innings?.topBatter),
    topBowler: serializePerformer(innings?.topBowler),
  };
}

export function serializeMatch(match) {
  return {
    id: match._id.toString(),
    matchNumber: match.matchNumber ?? null,
    date: match.date,
    time: match.time || "",
    venue: match.venue || "",
    teamA: match.teamA,
    teamB: match.teamB,
    status: match.status || "upcoming",
    teamAInnings: serializeInnings(match.teamAInnings),
    teamBInnings: serializeInnings(match.teamBInnings),
    result: match.result || "",
    manOfTheMatch: {
      name: match.manOfTheMatch?.name || "",
      team: match.manOfTheMatch?.team || "",
      performance: match.manOfTheMatch?.performance || "",
    },
  };
}
