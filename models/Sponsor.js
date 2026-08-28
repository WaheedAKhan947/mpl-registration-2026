import mongoose from "mongoose";

const SponsorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    url: { type: String, trim: true, default: "" },
    // R2 object key (not a URL) -- a signed URL is generated on read.
    logo: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.Sponsor || mongoose.model("Sponsor", SponsorSchema);
