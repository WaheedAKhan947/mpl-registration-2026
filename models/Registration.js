import mongoose from "mongoose";

const RegistrationSchema = new mongoose.Schema(
  {
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
    experience: { type: String, trim: true },
    notes: { type: String, trim: true },
    // R2 object keys (not URLs) -- signed URLs are generated on read.
    profilePicture: { type: String, trim: true },
    cnicImage: { type: String, trim: true },
    feeReceipt: { type: String, trim: true },
    // SHA-256 hashes of the uploaded CNIC/receipt files, used to block the
    // same image being submitted under more than one registration.
    cnicImageHash: { type: String, unique: true, sparse: true },
    feeReceiptHash: { type: String, unique: true, sparse: true },
  },
  { timestamps: true }
);

export default mongoose.models.Registration ||
  mongoose.model("Registration", RegistrationSchema);
