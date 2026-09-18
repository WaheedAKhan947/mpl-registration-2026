import Counter from "@/models/Counter";

// Produces short IDs like "mpl-2026-01001": a prefix, the calendar year,
// and a sequential number zero-padded to 5 digits. The counter resets per
// calendar year per prefix (a new "mpl-2027" counter starts fresh) and
// increments atomically, so concurrent registrations across serverless
// instances never collide.
export async function getNextRegistrationId(prefix) {
  const year = new Date().getFullYear();
  const key = `${prefix}-${year}`;
  const counter = await Counter.findOneAndUpdate(
    { _id: key },
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );
  return `${prefix}-${year}-${String(counter.seq).padStart(5, "0")}`;
}
