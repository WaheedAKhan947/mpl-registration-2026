import mongoose from "mongoose";

const AdminUserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    passwordHash: { type: String, required: true },
    // "owner" can add/remove other admins from the Team access panel;
    // "admin" can use the rest of the dashboard but not manage accounts.
    // "scorer" can only score matches (see verifyScoringSessionToken).
    role: { type: String, enum: ["owner", "admin", "scorer"], default: "admin" },
    // Basic brute-force protection on login -- reset on a successful login.
    failedAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// In development Next.js keeps a model compiled from an older version of
// this file across hot reloads, and Mongoose then silently drops any field
// added since. Re-register it so schema edits apply without a restart.
if (process.env.NODE_ENV !== "production" && mongoose.models.AdminUser) {
  mongoose.deleteModel("AdminUser");
}

export default mongoose.models.AdminUser || mongoose.model("AdminUser", AdminUserSchema);
