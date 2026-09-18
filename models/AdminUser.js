import mongoose from "mongoose";

const AdminUserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    passwordHash: { type: String, required: true },
    // "owner" can add/remove other admins from the Team access panel;
    // "admin" can use the rest of the dashboard but not manage accounts.
    role: { type: String, enum: ["owner", "admin"], default: "admin" },
    // Basic brute-force protection on login -- reset on a successful login.
    failedAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.AdminUser || mongoose.model("AdminUser", AdminUserSchema);
