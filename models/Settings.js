import mongoose from "mongoose";

const SettingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: "site" },
    highlightVideoUrl: { type: String, trim: true, default: "" },
    announcementText: { type: String, trim: true, default: "" },
    announcementEnabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Settings || mongoose.model("Settings", SettingsSchema);
