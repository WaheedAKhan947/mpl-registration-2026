import mongoose from "mongoose";

// Backs short, human-readable sequential registration IDs (e.g.
// mpl-2026-01001). One document per "prefix-year" key; findOneAndUpdate
// with $inc is atomic, so concurrent registrations from different
// serverless instances never collide or reuse a number.
const CounterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

export default mongoose.models.Counter || mongoose.model("Counter", CounterSchema);
