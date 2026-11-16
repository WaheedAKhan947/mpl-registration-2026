// A mid-chase snapshot in exactly the shape GET /api/matches/[id]/live
// returns (see buildLive in lib/publicMatch.js). Phase 1 renders the score
// bar from it; later it powers demo mode (/overlay/demo, ?demo=1).

export const MOCK_LIVE = {
  match: {
    id: "demo",
    matchNumber: 7,
    date: "2026-11-15",
    time: "2:00 PM",
    venue: "Maneri Ground",
    teamA: "Maneri Kings",
    teamB: "Maneri Strikers",
    status: "live",
    scored: true,
    scoringStatus: "in_progress",
    currentInnings: 2,
    toss: { winner: "Maneri Kings", decision: "bat" },
    overs: 20,
    result: "Maneri Strikers need 38 runs from 34 balls",
  },
  innings: [
    {
      number: 1,
      battingTeam: "Maneri Kings",
      bowlingTeam: "Maneri Strikers",
      runs: 179,
      wickets: 6,
      overs: "20.0",
      quotaOvers: 20,
      target: null,
      targetRevised: false,
      complete: true,
      endReason: "overs",
    },
    {
      number: 2,
      battingTeam: "Maneri Strikers",
      bowlingTeam: "Maneri Kings",
      runs: 142,
      wickets: 3,
      overs: "14.2",
      quotaOvers: 20,
      target: 180,
      targetRevised: false,
      complete: false,
      endReason: "",
    },
  ],
  situation: { type: "chase", team: "Maneri Strikers", runs: 38, balls: 34 },
  now: {
    inningsNumber: 2,
    battingTeam: "Maneri Strikers",
    bowlingTeam: "Maneri Kings",
    striker: { id: "s1", name: "Muhammad Abdullah Khan", runs: 54, balls: 33, fours: 5, sixes: 3, strikeRate: 163.6 },
    nonStriker: { id: "s2", name: "Bilal Shah", runs: 12, balls: 9, fours: 1, sixes: 0, strikeRate: 133.3 },
    bowler: { id: "b1", name: "Hamza Afridi", overs: "2.2", maidens: 0, runs: 21, wickets: 1, economy: 9 },
    recentBalls: [
      { id: "2-81", label: "1", over: 13, legal: true },
      { id: "2-82", label: "4", over: 13, legal: true },
      { id: "2-83", label: "•", over: 14, legal: true },
      { id: "2-84", label: "Wd", over: 14, legal: false },
      { id: "2-85", label: "6", over: 14, legal: true },
      { id: "2-86", label: "W", over: 14, legal: true },
    ],
    thisOver: ["•", "Wd", "6", "W"],
    runRate: 9.91,
    requiredRate: 6.71,
    runsNeeded: 38,
    ballsRemaining: 34,
    partnership: { runs: 23, balls: 14 },
    freeHit: false,
    lastWicket: { name: "Imran Khan", runs: 31, balls: 22, score: "142/3", overs: "14.2" },
  },
  updatedAt: "2026-11-15T09:00:00.000Z",
};

// Demo-mode events (keyboard shortcuts on /overlay/demo), shaped like the
// `events` the overlay feed sends.
const DEMO_DISMISSALS = [
  { type: "bowled", text: "b Hamza Afridi" },
  { type: "caught", text: "c Imran Shah b Hamza Afridi" },
  { type: "lbw", text: "lbw b Hamza Afridi" },
  { type: "run_out", text: "run out (Waheed Ahmad)" },
  { type: "stumped", text: "st Shawal Ahmad b Hamza Afridi" },
];

export function demoEvent(type, count, { milestone = false } = {}) {
  const striker = MOCK_LIVE.now.striker;
  const base = {
    id: `demo-${Date.now()}-${count}`,
    type,
    at: new Date().toISOString(),
    innings: 2,
    overBall: "14.3",
    team: MOCK_LIVE.now.battingTeam,
    milestone: null,
    bowler: { id: "b1", name: "Hamza Afridi", figures: "2.3-0-25-1" },
    wicket: null,
  };
  if (type === "WICKET") {
    const dismissal = DEMO_DISMISSALS[count % DEMO_DISMISSALS.length];
    return {
      ...base,
      batter: { ...striker, photo: null },
      wicket: dismissal,
      bowler: { ...base.bowler, figures: "2.3-0-21-2" },
    };
  }
  if (type === "FIFTY" || type === "HUNDRED") {
    const runs = type === "HUNDRED" ? 101 : 52;
    return { ...base, batter: { ...striker, runs, balls: type === "HUNDRED" ? 58 : 31, photo: null } };
  }
  if (type === "HATTRICK") {
    return { ...base, team: MOCK_LIVE.now.bowlingTeam, bowler: { ...base.bowler, figures: "3.0-0-22-4", photo: null } };
  }
  if (type === "NEW_BATTER") {
    // Alternates between a batter with tournament numbers and a debutant.
    const debut = count % 2 === 0;
    return {
      ...base,
      id: `demo-${Date.now()}-${count}-in`,
      score: "142/4",
      batter: { id: "nb1", name: debut ? "Sajid Khan" : "Imran Shah", role: debut ? "All-rounder" : "Batsman", photo: null },
      career: debut
        ? { matches: 0, innings: 0, runs: 0, average: null, strikeRate: 0, highest: "", fifties: 0, wickets: 0 }
        : { matches: 4, innings: 4, runs: 137, average: 45.67, strikeRate: 148.9, highest: "61*", fifties: 1, wickets: 2 },
    };
  }
  if (type === "PLAYER_CARD") {
    return {
      ...base,
      id: `demo-${Date.now()}-${count}-card`,
      team: MOCK_LIVE.now.bowlingTeam,
      batter: { id: "b1", name: "Hamza Afridi", role: "Bowler", photo: null },
      today: { batting: null, bowling: { wickets: 1, runs: 21, overs: "2.3" } },
      career: { matches: 5, innings: 3, runs: 41, average: 20.5, strikeRate: 120.6, highest: "22", fifties: 0, wickets: 9, bowlingInnings: 5, economy: 6.85, bestBowling: "3-14" },
    };
  }
  if (type === "FREE_HIT") {
    return { ...base, batter: { ...striker, photo: null } };
  }
  if (type === "OVER" || type === "MAIDEN") {
    const maiden = type === "MAIDEN";
    return {
      ...base,
      over: 15,
      runs: maiden ? 0 : 11,
      wickets: maiden ? 0 : 1,
      balls: maiden ? ["•", "•", "•", "•", "•", "•"] : ["1", "4", "•", "Wd", "6", "W"],
      runRate: 9.91,
      score: "149/4",
      bowler: { ...base.bowler, figures: maiden ? "3.0-1-21-1" : "3.0-0-32-2" },
    };
  }
  const runs = milestone ? 50 : striker.runs + (type === "SIX" ? 6 : 4);
  return {
    ...base,
    milestone: milestone ? "FIFTY" : null,
    batter: { ...striker, runs, balls: striker.balls + 1, photo: null },
  };
}

// Demo data for the full-screen screens (demo keys 1, 2, 3 and 5).
const xi = (names, captainAt, viceAt) =>
  names.map(([name, role], i) => ({
    id: `demo-${name.toLowerCase().replace(/\s+/g, "-")}`,
    name,
    role,
    captain: i === captainAt,
    viceCaptain: i === viceAt,
    photo: null,
  }));

MOCK_LIVE.squads = [
  {
    team: "Maneri Kings",
    players: xi(
      [
        ["Sudais Khan", "Batsman"], ["Rawaid Sarwar", "Batsman"], ["Babar Khan", "All-rounder"], ["Ubaid Ullah", "Batsman"],
        ["Asad Ali", "Wicket Keeper"], ["Zubair Khan", "All-rounder"], ["Hamza Afridi", "Bowler"], ["Kashif Iqbal", "Bowler"],
        ["Noman Ali", "Bowler"], ["Faheem Shah", "Bowler"], ["Junaid Khan", "Bowler"],
      ],
      0,
      2
    ),
  },
  {
    team: "Maneri Strikers",
    players: xi(
      [
        ["Muhammad Abdullah Khan", "Batsman"], ["Bilal Shah", "Batsman"], ["Imran Khan", "Batsman"], ["Waheed Ahmad", "All-rounder"],
        ["Shawal Ahmad", "Wicket Keeper"], ["Imran Shah", "All-rounder"], ["Adil Rashid", "Bowler"], ["Sohail Khan", "Bowler"],
        ["Tariq Mehmood", "Bowler"], ["Yasir Arafat", "Bowler"], ["Wasim Jan", "Bowler"],
      ],
      3,
      0
    ),
  },
];

MOCK_LIVE.performers = [
  {
    number: 1,
    battingTeam: "Maneri Kings",
    bowlingTeam: "Maneri Strikers",
    runs: 179,
    wickets: 6,
    overs: "20.0",
    batters: [
      { id: "demo-sudais", name: "Sudais Khan", runs: 72, balls: 44, out: true, photo: null },
      { id: "demo-babar", name: "Babar Khan", runs: 41, balls: 23, out: false, photo: null },
    ],
    bowlers: [
      { id: "demo-adil", name: "Adil Rashid", wickets: 3, runs: 28, overs: "4.0", photo: null },
      { id: "demo-sohail", name: "Sohail Khan", wickets: 2, runs: 35, overs: "4.0", photo: null },
    ],
  },
  {
    number: 2,
    battingTeam: "Maneri Strikers",
    bowlingTeam: "Maneri Kings",
    runs: 182,
    wickets: 6,
    overs: "19.1",
    batters: [
      { id: "s1", name: "Muhammad Abdullah Khan", runs: 88, balls: 51, out: false, photo: null },
      { id: "s3", name: "Imran Khan", runs: 31, balls: 22, out: true, photo: null },
    ],
    bowlers: [
      { id: "b1", name: "Hamza Afridi", wickets: 3, runs: 31, overs: "4.0", photo: null },
      { id: "demo-noman", name: "Noman Ali", wickets: 1, runs: 29, overs: "3.1", photo: null },
    ],
  },
];

MOCK_LIVE.motm = { name: "Muhammad Abdullah Khan", team: "Maneri Strikers", performance: "88* (51)", photo: null };

// The sample match as it would look before the toss, after it, at the
// innings break and when finished, for previewing each screen in demo mode.
export function demoScreenData(screen) {
  const match = { ...MOCK_LIVE.match };
  switch (screen) {
    case "comingUp":
      return { ...MOCK_LIVE, match: { ...match, scored: false, scoringStatus: "not_started", status: "upcoming" }, now: null, innings: [], situation: null };
    case "preMatch":
      return { ...MOCK_LIVE, situation: { type: "toss", winner: match.toss.winner, decision: match.toss.decision } };
    case "break":
      return { ...MOCK_LIVE, situation: { type: "break", team: "Maneri Strikers", target: 180 } };
    case "result":
      return {
        ...MOCK_LIVE,
        match: { ...match, scoringStatus: "completed", status: "completed" },
        situation: { type: "result", outcome: "win", winner: "Maneri Strikers", margin: 4, marginType: "wickets", ballsLeft: 5, text: "" },
      };
    default:
      return MOCK_LIVE;
  }
}
