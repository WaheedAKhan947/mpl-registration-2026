// One-off CLI to create or update an admin account.
//
// You need this to bootstrap the very first account (there's no one logged
// in yet to use the "Team access" panel in the dashboard), and it doubles
// as a break-glass way to reset a teammate's password if every owner is
// ever locked out.
//
// Usage (Node 20.6+, for --env-file support):
//   node --env-file=.env.local scripts/create-admin.js --name "Full Name" --email you@example.com --password "a strong password" [--role owner|admin]
//
// If MONGODB_URI is already exported in your shell, you can drop --env-file.
// If an account with that email already exists, this updates its
// name/password/role instead of creating a duplicate -- handy for resetting
// a forgotten password too.

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      args[arg.slice(2)] = argv[i + 1];
      i += 1;
    }
  }
  return args;
}

function printUsageAndExit(message) {
  if (message) console.error(message);
  console.error(
    '\nUsage: node --env-file=.env.local scripts/create-admin.js --name "Full Name" --email you@example.com --password "a strong password" [--role owner|admin]'
  );
  process.exit(1);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const name = args.name;
  const email = String(args.email || "").trim().toLowerCase();
  const password = args.password;
  const requestedRole = args.role === "owner" ? "owner" : args.role === "admin" ? "admin" : null;

  if (!name || !email || !password) {
    printUsageAndExit("Missing --name, --email, or --password.");
  }
  if (password.length < 8) {
    printUsageAndExit("Password must be at least 8 characters.");
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    printUsageAndExit(
      "MONGODB_URI is not set. Run with --env-file=.env.local (Node 20.6+), or export it first."
    );
  }

  await mongoose.connect(uri);

  const AdminUserSchema = new mongoose.Schema(
    {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true, lowercase: true, unique: true },
      passwordHash: { type: String, required: true },
      role: { type: String, enum: ["owner", "admin"], default: "admin" },
      failedAttempts: { type: Number, default: 0 },
      lockUntil: { type: Date, default: null },
      lastLoginAt: { type: Date, default: null },
    },
    { timestamps: true }
  );
  const AdminUser = mongoose.models.AdminUser || mongoose.model("AdminUser", AdminUserSchema);

  const passwordHash = await bcrypt.hash(password, 10);
  const existing = await AdminUser.findOne({ email });

  if (existing) {
    existing.name = name;
    existing.passwordHash = passwordHash;
    existing.failedAttempts = 0;
    existing.lockUntil = null;
    if (requestedRole) existing.role = requestedRole;
    await existing.save();
    console.log(`Updated existing admin: ${existing.email} (role: ${existing.role})`);
  } else {
    // The very first account created becomes an owner automatically, so
    // there's always someone who can add the rest of the team from the
    // dashboard. After that, default to "admin" unless --role is given.
    const ownerCount = await AdminUser.countDocuments({ role: "owner" });
    const finalRole = requestedRole || (ownerCount === 0 ? "owner" : "admin");
    const created = await AdminUser.create({ name, email, passwordHash, role: finalRole });
    console.log(`Created admin: ${created.email} (role: ${created.role})`);
  }

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
