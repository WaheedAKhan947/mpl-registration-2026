import mongoose from "mongoose";
import { MATCH_STATUSES, SCORING_STATUSES } from "@/lib/matches";

const objectId = mongoose.Schema.Types.ObjectId;

const PerformerSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: "" },
    figures: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

// `runs` stays null until the side has batted; the site then shows "Yet to bat".
const InningsSchema = new mongoose.Schema(
  {
    runs: { type: Number, default: null },
    wickets: { type: Number, default: null },
    overs: { type: String, trim: true, default: "" },
    topBatter: { type: PerformerSchema, default: () => ({}) },
    // Best bowler *against* this side, i.e. an opposition player.
    topBowler: { type: PerformerSchema, default: () => ({}) },
  },
  { _id: false }
);

const MatchSchema = new mongoose.Schema(
  {
    matchNumber: { type: Number, default: null },
    // Kept as YYYY-MM-DD so the match day never shifts with server time zones.
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    time: { type: String, trim: true, default: "" },
    venue: { type: String, trim: true, default: "" },
    teamA: { type: String, required: true, trim: true },
    teamB: { type: String, required: true, trim: true },
    status: { type: String, enum: MATCH_STATUSES, default: "upcoming" },
    teamAInnings: { type: InningsSchema, default: () => ({}) },
    teamBInnings: { type: InningsSchema, default: () => ({}) },
    // Free text so it can describe a live situation as well as a final result.
    result: { type: String, trim: true, default: "" },
    manOfTheMatch: {
      name: { type: String, trim: true, default: "" },
      team: { type: String, trim: true, default: "" },
      performance: { type: String, trim: true, default: "" },
    },

    // ---- Ball-by-ball scoring. Everything below is optional; a match that is
    // never scored live keeps using the manual fields above.
    toss: {
      // Team name, matching teamA / teamB.
      winner: { type: String, trim: true, default: "" },
      decision: { type: String, enum: ["", "bat", "bowl"], default: "" },
    },
    // Overs per innings for this match (6, 8, 10, 20 ...).
    overs: { type: Number, min: 1, max: 50, default: null },
    playingXI: {
      teamA: [{ type: objectId, ref: "Registration" }],
      teamB: [{ type: objectId, ref: "Registration" }],
    },
    scoringStatus: { type: String, enum: SCORING_STATUSES, default: "not_started" },
    // Structured form of `result` for scored matches, written on finish and
    // recomputable from the balls. Feeds the automatic points table.
    resultInfo: {
      outcome: { type: String, enum: ["", "win", "tie", "no_result"], default: "" },
      winner: { type: String, trim: true, default: "" },
      margin: { type: Number, default: null },
      marginType: { type: String, enum: ["", "runs", "wickets"], default: "" },
    },
    // 0 before the toss, then 1 / 2 (3 / 4 for a super over).
    currentInnings: { type: Number, default: 0 },
    // Accounts allowed to score this match; empty means any admin or scorer.
    scorers: [{ type: objectId, ref: "AdminUser" }],
    // League rule tweaks for this match; blanks fall back to lib/scoring.js defaults.
    scoringConfig: {
      widePenalty: { type: Number, min: 0, max: 5, default: 1 },
      noBallPenalty: { type: Number, min: 0, max: 5, default: 1 },
      maxOversPerBowler: { type: Number, min: 1, max: 50, default: null },
      // Bowlers allowed one over more than the limit (null = league default:
      // 1 under 20 overs, else 0).
      extraOverBowlers: { type: Number, min: 0, max: 11, default: null },
      lastManStands: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

MatchSchema.index({ date: 1, matchNumber: 1 });
MatchSchema.index({ scoringStatus: 1 });

// In development Next.js keeps a model compiled from an older version of
// this file across hot reloads, and Mongoose then silently drops any field
// added since. Re-register it so schema edits apply without a restart.
if (process.env.NODE_ENV !== "production" && mongoose.models.Match) {
  mongoose.deleteModel("Match");
}

export default mongoose.models.Match || mongoose.model("Match", MatchSchema);
