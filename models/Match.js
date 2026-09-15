import mongoose from "mongoose";
import { MATCH_STATUSES } from "@/lib/matches";

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
  },
  { timestamps: true }
);

MatchSchema.index({ date: 1, matchNumber: 1 });

export default mongoose.models.Match || mongoose.model("Match", MatchSchema);
