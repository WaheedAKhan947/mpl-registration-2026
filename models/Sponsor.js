import mongoose from "mongoose";
import { SPONSOR_TIERS, DEFAULT_SPONSOR_TIER } from "@/lib/sponsorTiers";

const SponsorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    url: { type: String, trim: true, default: "" },
    // R2 object key (not a URL) -- a signed URL is generated on read.
    logo: { type: String, trim: true, default: "" },
    category: { type: String, enum: SPONSOR_TIERS, default: DEFAULT_SPONSOR_TIER },
  },
  { timestamps: true }
);

// A dev server that loaded this model before `category` existed keeps the old
// schema cached across hot reloads, which silently drops category writes.
if (mongoose.models.Sponsor && !mongoose.models.Sponsor.schema.path("category")) {
  mongoose.deleteModel("Sponsor");
}

export default mongoose.models.Sponsor || mongoose.model("Sponsor", SponsorSchema);
