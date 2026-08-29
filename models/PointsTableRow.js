import mongoose from "mongoose";

const PointsTableRowSchema = new mongoose.Schema(
  {
    team: { type: String, required: true, trim: true },
    played: { type: Number, default: 0 },
    won: { type: Number, default: 0 },
    lost: { type: Number, default: 0 },
    tied: { type: Number, default: 0 },
    noResult: { type: Number, default: 0 },
    points: { type: Number, default: 0 },
    netRunRate: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.PointsTableRow || mongoose.model("PointsTableRow", PointsTableRowSchema);
