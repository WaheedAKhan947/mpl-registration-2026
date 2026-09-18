import mongoose from "mongoose";

const FootballRegistrationSchema = new mongoose.Schema(
  {
    // Short human-readable ID shown to the player and used on the printed
    // PDF (e.g. "mfc-2026-00001"), separate from Mongo's own _id.
    registrationId: { type: String, required: true, unique: true, index: true },
    // Every new registration starts unverified; an admin confirms it from
    // the dashboard after checking the CNIC and photo.
    verified: { type: Boolean, default: false },
    fullName: { type: String, required: true, trim: true },
    fatherName: { type: String, required: true, trim: true },
    dob: { type: String, required: true, trim: true },
    cnicNumber: { type: String, required: true, trim: true, unique: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    village: { type: String, required: true, trim: true },
    tehsil: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    position: { type: String, required: true, trim: true },
    preferredFoot: { type: String, required: true, trim: true },
    previousClub: { type: String, trim: true },
    experience: { type: String, trim: true },
    previousTournaments: { type: String, trim: true },
    height: { type: String, trim: true },
    jerseySize: { type: String, required: true, trim: true },
    jerseyNumber: { type: String, trim: true },
    declarationAgreed: { type: Boolean, required: true },
    // R2 object keys (not URLs) -- signed URLs are generated on read.
    photo: { type: String, trim: true },
    cnicImage: { type: String, trim: true },
    // SHA-256 hash of the uploaded CNIC/B-Form image, used to block the
    // same image being submitted under more than one registration.
    cnicImageHash: { type: String, unique: true, sparse: true },
  },
  { timestamps: true }
);

export default mongoose.models.FootballRegistration ||
  mongoose.model("FootballRegistration", FootballRegistrationSchema);
