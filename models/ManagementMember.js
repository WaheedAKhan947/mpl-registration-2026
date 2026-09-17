import mongoose from "mongoose";

const ManagementMemberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    roleUr: { type: String, trim: true, default: "" },
    copy: { type: String, required: true, trim: true },
    copyUr: { type: String, trim: true, default: "" },
    // R2 object key (not a URL) -- a signed URL is generated on read.
    photo: { type: String, trim: true, default: "" },
    // Lower numbers show first on the public site; set on create and
    // adjusted via the admin "move up/down" controls.
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ManagementMemberSchema.index({ order: 1, createdAt: 1 });

export default mongoose.models.ManagementMember || mongoose.model("ManagementMember", ManagementMemberSchema);
