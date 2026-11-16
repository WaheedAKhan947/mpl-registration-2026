// Creates a practice fixture you can score end to end from Admin > Live
// Scoring, and removes it again afterwards.
//
// It never invents players: it picks two league teams that already have at
// least two players allocated on the Draft Board (or the two you name), and
// creates one fixture dated today. Everything it creates is marked with the
// venue "Test match (seeded)" so --remove can find it.
//
// Note: the fixture appears on the public homepage scorecard (and, once
// finished, in stats and the points table) until you remove it. Run it
// against a test database, or remove it as soon as you are done.
//
// Usage (Node 20.6+):
//   node --env-file=.env.local scripts/seed-test-match.js [--teamA "Maneri Eleven" --teamB "Maneri Kings"] [--overs 2]
//   node --env-file=.env.local scripts/seed-test-match.js --remove

const mongoose = require("mongoose");

const SEED_VENUE = "Test match (seeded)";
const LEAGUE_TEAMS = ["Maneri Eleven", "Maneri Baturan", "Maneri Strikers", "Maneri Kings", "Maneri Markhor", "Maneri Azmari"];

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) {
      args[arg.slice(2)] = true;
    } else {
      args[arg.slice(2)] = next;
      i += 1;
    }
  }
  return args;
}

function todayInKarachi() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi", year: "numeric", month: "2-digit", day: "2-digit" }).format(
    new Date()
  );
}

async function remove(db) {
  const matches = await db.collection("matches").find({ venue: SEED_VENUE }).project({ _id: 1 }).toArray();
  const ids = matches.map((m) => m._id);
  if (!ids.length) {
    console.log("No seeded test matches found.");
    return;
  }
  const [balls, innings, stats, removed] = await Promise.all([
    db.collection("balls").deleteMany({ match: { $in: ids } }),
    db.collection("innings").deleteMany({ match: { $in: ids } }),
    db.collection("playermatchstats").deleteMany({ match: { $in: ids } }),
    db.collection("matches").deleteMany({ _id: { $in: ids } }),
  ]);
  console.log(
    `Removed ${removed.deletedCount} seeded match(es), ${innings.deletedCount} innings, ${balls.deletedCount} balls and ${stats.deletedCount} player stat rows.`
  );
}

async function seed(db, args) {
  const counts = await db
    .collection("registrations")
    .aggregate([{ $match: { allocatedTeam: { $in: LEAGUE_TEAMS } } }, { $group: { _id: "$allocatedTeam", players: { $sum: 1 } } }])
    .toArray();
  const squad = new Map(counts.map((c) => [c._id, c.players]));

  let teamA = args.teamA;
  let teamB = args.teamB;
  if (!teamA || !teamB) {
    const ready = LEAGUE_TEAMS.filter((team) => (squad.get(team) || 0) >= 2);
    if (ready.length < 2) {
      throw new Error("Need two league teams with at least 2 allocated players each. Allocate players on the Draft Board first.");
    }
    [teamA, teamB] = ready;
  }
  for (const team of [teamA, teamB]) {
    if (!LEAGUE_TEAMS.includes(team)) throw new Error(`"${team}" is not a league team (${LEAGUE_TEAMS.join(", ")}).`);
    if ((squad.get(team) || 0) < 2) throw new Error(`${team} has fewer than 2 allocated players.`);
  }
  if (teamA === teamB) throw new Error("Pick two different teams.");

  const now = new Date();
  const { insertedId } = await db.collection("matches").insertOne({
    matchNumber: null,
    date: todayInKarachi(),
    time: "",
    venue: SEED_VENUE,
    teamA,
    teamB,
    status: "upcoming",
    teamAInnings: { runs: null, wickets: null, overs: "", topBatter: { name: "", figures: "" }, topBowler: { name: "", figures: "" } },
    teamBInnings: { runs: null, wickets: null, overs: "", topBatter: { name: "", figures: "" }, topBowler: { name: "", figures: "" } },
    result: "",
    manOfTheMatch: { name: "", team: "", performance: "" },
    scoringStatus: "not_started",
    currentInnings: 0,
    overs: null,
    playingXI: { teamA: [], teamB: [] },
    scorers: [],
    createdAt: now,
    updatedAt: now,
  });

  console.log(`Created test fixture ${teamA} vs ${teamB} (${squad.get(teamA)} and ${squad.get(teamB)} players allocated).`);
  console.log(`  Match id: ${insertedId}`);
  console.log(`  Score it: /admin#scoring  (pick the match, choose ${args.overs || 2} overs for a quick game)`);
  console.log(`  Watch it: /match/${insertedId}`);
  console.log("  Remove it afterwards: node --env-file=.env.local scripts/seed-test-match.js --remove");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not set. Run with --env-file=.env.local (Node 20.6+), or export it first.");
    process.exit(1);
  }
  await mongoose.connect(uri);
  try {
    if (args.remove) await remove(mongoose.connection.db);
    else await seed(mongoose.connection.db, args);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
