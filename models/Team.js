import mongoose from "mongoose";

const TeamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    ownerName: { type: String, trim: true, default: "" },
    // The captain and vice-captain must each be one of the players allocated
    // to this team. Stored as references so a name change on the
    // registration is reflected here.
    captain: { type: mongoose.Schema.Types.ObjectId, ref: "Registration", default: null },
    viceCaptain: { type: mongoose.Schema.Types.ObjectId, ref: "Registration", default: null },
  },
  { timestamps: true }
);

export default mongoose.models.Team || mongoose.model("Team", TeamSchema);
