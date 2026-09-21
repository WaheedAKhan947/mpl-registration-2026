// One-off CLI to set the CORS policy on the R2 bucket so the browser can
// upload registration files (profile picture, CNIC front/back, fee
// receipt) directly to R2 via a presigned URL. Without this, the site's
// origin isn't on R2's allow-list, so the browser blocks the PUT request
// after a failed CORS preflight -- which surfaces to players as a plain
// "Failed to fetch" with no other explanation.
//
// This only needs to be run once per bucket (re-run any time you add a new
// domain, e.g. a custom domain, a new Vercel preview alias, etc).
//
// Usage (Node 20.6+, for --env-file support):
//   node --env-file=.env scripts/configure-r2-cors.js --origin https://mplswabi.com --origin https://www.mplswabi.com
//
// If you don't pass --origin, it defaults to the origins below.

const { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } = require("@aws-sdk/client-s3");

const DEFAULT_ORIGINS = [
  "https://mplswabi.com",
  "https://www.mplswabi.com",
  "https://*.vercel.app",
  "http://localhost:3000",
];

function parseArgs(argv) {
  const origins = [];
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--origin" && argv[i + 1]) {
      origins.push(argv[i + 1]);
      i += 1;
    }
  }
  return origins;
}

async function main() {
  const required = ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET_NAME"];
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length) {
    console.error(`Missing env vars: ${missing.join(", ")}. Run with --env-file=.env.`);
    process.exit(1);
  }

  const origins = parseArgs(process.argv.slice(2));
  const allowedOrigins = origins.length ? origins : DEFAULT_ORIGINS;

  const client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });

  await client.send(
    new PutBucketCorsCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedOrigins: allowedOrigins,
            AllowedMethods: ["PUT"],
            AllowedHeaders: ["Content-Type"],
            ExposeHeaders: ["ETag"],
            MaxAgeSeconds: 3600,
          },
        ],
      },
    })
  );

  console.log(`R2 bucket "${process.env.R2_BUCKET_NAME}" CORS policy set for origins:`);
  allowedOrigins.forEach((origin) => console.log(`  - ${origin}`));

  const current = await client.send(new GetBucketCorsCommand({ Bucket: process.env.R2_BUCKET_NAME }));
  console.log("\nCurrent policy on the bucket:");
  console.log(JSON.stringify(current.CORSRules, null, 2));
}

main().catch((error) => {
  console.error("Failed to set R2 CORS policy:", error.message || error);
  process.exit(1);
});
