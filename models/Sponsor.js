import mongoose from "mongoose";
import { SPONSOR_TIERS, DEFAULT_SPONSOR_TIER } from "@/lib/sponsorTiers";

export const MAX_SPONSOR_IMAGES = 6;

const SponsorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    url: { type: String, trim: true, default: "" },
    // R2 object key (not a URL) -- a signed URL is generated on read.
    logo: { type: String, trim: true, default: "" },
    category: { type: String, enum: SPONSOR_TIERS, default: DEFAULT_SPONSOR_TIER },
    // Optional text and photo album shown in the full-screen sponsor view.
    details: { type: String, trim: true, default: "" },
    detailsUr: { type: String, trim: true, default: "" },
    // R2 object keys (not URLs) -- signed URLs are generated on read.
    images: {
      type: [{ type: String, trim: true }],
      default: [],
      validate: {
        validator: (images) => images.length <= MAX_SPONSOR_IMAGES,
        message: `A sponsor can have at most ${MAX_SPONSOR_IMAGES} album images.`,
      },
    },
  },
  { timestamps: true }
);

// A dev server keeps the compiled model cached across hot reloads. If that
// cached copy predates the current fields or tier list, it would drop or
// reject writes to them, so rebuild it.
const cachedSchema = mongoose.models.Sponsor?.schema;
if (
  cachedSchema &&
  (!cachedSchema.path("images") ||
    !cachedSchema.path("details") ||
    String(cachedSchema.path("category")?.enumValues) !== String(SPONSOR_TIERS))
) {
  mongoose.deleteModel("Sponsor");
}

export default mongoose.models.Sponsor || mongoose.model("Sponsor", SponsorSchema);
