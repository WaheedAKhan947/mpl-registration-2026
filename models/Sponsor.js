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

// A dev server keeps the compiled model cached across hot reloads. If that
// cached copy predates `category` or the current tier list, it would drop or
// reject category writes, so rebuild it.
const cachedCategory = mongoose.models.Sponsor?.schema.path("category");
if (
  mongoose.models.Sponsor &&
  (!cachedCategory || String(cachedCategory.enumValues) !== String(SPONSOR_TIERS))
) {
  mongoose.deleteModel("Sponsor");
}

export default mongoose.models.Sponsor || mongoose.model("Sponsor", SponsorSchema);
