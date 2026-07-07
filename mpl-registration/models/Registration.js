import mongoose from "mongoose";

const FileSchema = new mongoose.Schema(
  {
    name: String,
    type: String,
    data: String, // base64 data URL
  },
  { _id: false }
);

const RegistrationSchema = new mongoose.Schema(
  {
    playerName: { type: String, required: true, trim: true },
    fatherName: { type: String, required: true, trim: true },
    age: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    cnicNumber: { type: String, required: true, trim: true },
    area: { type: String, required: true, trim: true },
    preferredTeam: { type: String, required: true, trim: true },
    playingRole: { type: String, required: true, trim: true },
    battingStyle: { type: String, required: true, trim: true },
    bowlingStyle: { type: String, required: true, trim: true },
    experience: { type: String, trim: true },
    notes: { type: String, trim: true },
    profilePicture: FileSchema,
    cnicImage: FileSchema,
    feeReceipt: FileSchema,
  },
  { timestamps: true }
);

export default mongoose.models.Registration ||
  mongoose.model("Registration", RegistrationSchema);
