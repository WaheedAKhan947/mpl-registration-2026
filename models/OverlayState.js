import mongoose from "mongoose";
import { CONTROL_PANELS, CONTROL_SCREENS } from "@/lib/overlay/control";

const objectId = mongoose.Schema.Types.ObjectId;

// What the stream operator has asked the broadcast overlay to show, one
// document per match, written from Admin > Stream Overlay and read by the
// public overlay feed. A missing document means "all automatic".
const OverlayStateSchema = new mongoose.Schema(
  {
    match: { type: objectId, ref: "Match", required: true, unique: true },
    // "auto" follows the match state; anything else forces that screen.
    screen: { type: String, enum: CONTROL_SCREENS, default: "auto" },
    // Small panel above the score bar.
    panel: { type: String, enum: CONTROL_PANELS, default: "none" },
    sponsors: { type: Boolean, default: true },
    // One-shot requests: each new id plays once on every overlay.
    card: {
      id: { type: String, default: "" },
      player: { type: objectId, ref: "Registration", default: null },
      at: { type: Date, default: null },
    },
    replay: {
      id: { type: String, default: "" },
      at: { type: Date, default: null },
    },
    // When the stream (and its recording) started, for the highlights log's
    // video times. Set from Admin > Stream Overlay.
    streamStartedAt: { type: Date, default: null },
    updatedBy: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

if (process.env.NODE_ENV !== "production" && mongoose.models.OverlayState) {
  mongoose.deleteModel("OverlayState");
}

export default mongoose.models.OverlayState || mongoose.model("OverlayState", OverlayStateSchema);
