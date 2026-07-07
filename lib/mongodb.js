import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

// Cache the connection across hot reloads in dev and across serverless
// invocations in production so we don't open a new connection every request.
let cached = global._mongooseConn;
if (!cached) {
  cached = global._mongooseConn = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (!MONGODB_URI) {
    throw new Error(
      "MONGODB_URI is not set. Add it to your .env.local file (see .env.local.example)."
    );
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
      })
      .then((mongooseInstance) => mongooseInstance);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
