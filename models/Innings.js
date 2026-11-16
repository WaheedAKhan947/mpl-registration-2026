import mongoose from "mongoose";

const objectId = mongoose.Schema.Types.ObjectId;

// One innings of a ball-by-ball scored match. The totals here are a cache:
// they are rewritten from the Ball documents (lib/scoring.js replayInnings)
// after every write, and can always be rebuilt from them.
const InningsSchema = new mongoose.Schema(
  {
    match: { type: objectId, ref: "Match", required: true },
    // 1 and 2 for the match; 3 and 4 for a super over.
    number: { type: Number, required: true, min: 1, max: 4 },
    // Team names, matching Match.teamA / Match.teamB.
    battingTeam: { type: String, required: true, trim: true },
    bowlingTeam: { type: String, required: true, trim: true },

    // Runs needed to win (second innings). Set from the first innings, or
    // entered by hand for a rain-revised (DLS) target.
    target: { type: Number, default: null },
    targetRevised: { type: Boolean, default: false },
    // Reduced overs for this innings (rain); null means the match's overs.
    maxOvers: { type: Number, default: null },

    // Cached totals, rebuilt from balls.
    runs: { type: Number, default: 0 },
    wickets: { type: Number, default: 0 },
    legalBalls: { type: Number, default: 0 },
    extras: {
      wides: { type: Number, default: 0 },
      noballs: { type: Number, default: 0 },
      byes: { type: Number, default: 0 },
      legbyes: { type: Number, default: 0 },
      penalty: { type: Number, default: 0 },
    },

    status: { type: String, enum: ["in_progress", "completed"], default: "in_progress" },
    // "overs" | "all_out" | "target" | "declared" (ended by hand)
    endReason: { type: String, default: "" },

    // Who is in right now. These are selections, not stats: the scorer sets
    // them, each ball copies them, and the replay suggests the next ones.
    striker: { type: objectId, ref: "Registration", default: null },
    nonStriker: { type: objectId, ref: "Registration", default: null },
    bowler: { type: objectId, ref: "Registration", default: null },

    // Highest ball seq written so far. A write must name the seq it expects
    // next, so two scorers cannot both append "ball 14".
    lastSeq: { type: Number, default: 0 },
  },
  { timestamps: true }
);

InningsSchema.index({ match: 1, number: 1 }, { unique: true });

// In development Next.js keeps a model compiled from an older version of
// this file across hot reloads, and Mongoose then silently drops any field
// added since. Re-register it so schema edits apply without a restart.
if (process.env.NODE_ENV !== "production" && mongoose.models.Innings) {
  mongoose.deleteModel("Innings");
}

export default mongoose.models.Innings || mongoose.model("Innings", InningsSchema);
