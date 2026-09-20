import mongoose from "mongoose";

const RegistrationSchema = new mongoose.Schema(
  {
    // Short human-readable ID shown to the player and used on the printed
    // PDF (e.g. "mpl-2026-01001"), separate from Mongo's own _id.
    registrationId: { type: String, required: true, unique: true, index: true },
    // Every new registration starts unverified; an admin confirms it from
    // the dashboard after checking the CNIC and fee receipt.
    verified: { type: Boolean, default: false },
    playerName: { type: String, required: true, trim: true },
    fatherName: { type: String, required: true, trim: true },
    age: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    cnicNumber: { type: String, required: true, trim: true, unique: true },
    area: { type: String, required: true, trim: true },
    preferredTeam: { type: String, required: true, trim: true },
    playingRole: { type: String, required: true, trim: true },
    battingStyle: { type: String, required: true, trim: true },
    bowlingStyle: { type: String, required: true, trim: true },
    cricProId: { type: String, required: true, trim: true },
    notes: { type: String, trim: true },
    agreedToTerms: { type: Boolean, required: true },
    feeNonRefundableAcknowledged: { type: Boolean, required: true },
    // Team the player is actually assigned to after the draft. Distinct from
    // preferredTeam, which is just what the player requested at signup.
    allocatedTeam: { type: String, trim: true, default: "" },
    // R2 object keys (not URLs) -- signed URLs are generated on read.
    profilePicture: { type: String, trim: true },
    cnicFront: { type: String, trim: true },
    cnicBack: { type: String, trim: true },
    feeReceipt: { type: String, trim: true },
    // SHA-256 hashes of the uploaded CNIC/receipt files, used to block the
    // same image being submitted under more than one registration.
    cnicFrontHash: { type: String, unique: true, sparse: true },
    cnicBackHash: { type: String, unique: true, sparse: true },
    feeReceiptHash: { type: String, unique: true, sparse: true },
  },
  { timestamps: true }
);

export default mongoose.models.Registration ||
  mongoose.model("Registration", RegistrationSchema);
