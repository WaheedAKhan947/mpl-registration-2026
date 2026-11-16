import mongoose from "mongoose";

const objectId = mongoose.Schema.Types.ObjectId;

// Derived cache: one row per player per ball-by-ball scored match, rebuilt
// from the Ball documents (lib/scoring.js buildPlayerMatchStats) whenever a
// match is finished or corrected. Never edited by hand.
const PlayerMatchStatsSchema = new mongoose.Schema(
  {
    match: { type: objectId, ref: "Match", required: true },
    player: { type: objectId, ref: "Registration", required: true },
    team: { type: String, trim: true, default: "" },
    // Copied from the match so a player's log sorts without a join.
    date: { type: String, default: "" },

    batting: {
      didBat: { type: Boolean, default: false },
      order: { type: Number, default: null },
      runs: { type: Number, default: 0 },
      balls: { type: Number, default: 0 },
      fours: { type: Number, default: 0 },
      sixes: { type: Number, default: 0 },
      out: { type: Boolean, default: false },
      dismissal: {
        type: { type: String, default: "" },
        bowler: { type: objectId, ref: "Registration", default: null },
        fielders: [{ type: objectId, ref: "Registration" }],
      },
      strikeRate: { type: Number, default: 0 },
    },
    bowling: {
      legalBalls: { type: Number, default: 0 },
      overs: { type: String, default: "0.0" },
      runs: { type: Number, default: 0 },
      wickets: { type: Number, default: 0 },
      maidens: { type: Number, default: 0 },
      wides: { type: Number, default: 0 },
      noballs: { type: Number, default: 0 },
      dots: { type: Number, default: 0 },
      economy: { type: Number, default: 0 },
    },
    fielding: {
      catches: { type: Number, default: 0 },
      runOuts: { type: Number, default: 0 },
      stumpings: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

PlayerMatchStatsSchema.index({ match: 1, player: 1 }, { unique: true });
PlayerMatchStatsSchema.index({ player: 1, date: -1 });

// In development Next.js keeps a model compiled from an older version of
// this file across hot reloads, and Mongoose then silently drops any field
// added since. Re-register it so schema edits apply without a restart.
if (process.env.NODE_ENV !== "production" && mongoose.models.PlayerMatchStats) {
  mongoose.deleteModel("PlayerMatchStats");
}

export default mongoose.models.PlayerMatchStats || mongoose.model("PlayerMatchStats", PlayerMatchStatsSchema);
