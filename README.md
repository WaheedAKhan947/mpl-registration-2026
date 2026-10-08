# Maneri Premier League (MPL) — Website, Registration & Admin

The official website for the **Maneri Premier League** (cricket) and **Maneri Football Club** (MFC). It combines a public league site, online player registration for both sports, and a password-protected admin dashboard for running the league.

**Stack:** Next.js 14 (App Router) · React 18 · Tailwind CSS · MongoDB (Mongoose) · Cloudflare R2 (S3-compatible file storage) · jsPDF · SheetJS (`xlsx`) · bcryptjs

---

## Features

### Public website (`/`)

The homepage is made up of these sections, most of them driven live from the database and editable from the admin dashboard:

| Section | What it shows | Managed from |
| --- | --- | --- |
| **Announcement bar** | A dismissable site-wide announcement (max 240 chars) | Settings |
| **Hero** | League intro and calls to action for registration | Static |
| **Stats bar** | Live count of registered MPL players (`/api/stats`) | Automatic |
| **About** | About the league | Static |
| **Teams** | The six franchises. Clicking a team opens its **roster**: allocated players with photos and roles, captain first, then vice-captain, plus the team owner | Teams & Captains, MPL Registrations |
| **Points table** | Standings: played, won, lost, tied, no result, points, net run rate | Points Table |
| **Scorecard** | Fixtures and results: upcoming / live / completed / abandoned, innings scores, top batter and bowler per side, result text, man of the match. Dates follow the league time zone (`Asia/Karachi`) | Scorecard & Fixtures |
| **Management** | League management members with photo, role and bio (English + Urdu) | Management |
| **Gallery** | Photo carousel | Static |
| **Highlights** | Embedded YouTube highlight video (any YouTube link format is accepted) | Settings |
| **Brand ambassadors** | Ambassadors with up to 6 images each, details in English + Urdu | Brand Ambassadors |
| **Sponsors** | Sponsor logos grouped by tier: Diamond, Platinum, Gold, Official Partner, Sports Partner, Silver, Bronze, Media Partner | Sponsors |
| **Contact** | Contact details | Static |

Other public pages:

- **`/register`** — MPL cricket player registration.
- **`/mfc-register`** — MFC football player registration.
- **`/terms`** — Official Playing Conditions & Tournament Regulations. The full document is also downloadable from `public/OFFICIALPLAYINGCONDITIONS.docx`.

Site-wide extras:

- **English / Urdu toggle.** Every public page can be switched to Urdu, with right-to-left layout. The choice is remembered in the browser (`localStorage` key `mpl-lang`). Form select values are always stored in English so the database and exports stay consistent. The admin dashboard is English only.
- **Registration alert popup.** A one-time modal tells visitors whether registration is open (remembered per browser so it is not shown again).
- **Google AdSense** script in the root layout, with the matching `Ads.txt`.

### MPL cricket registration (`/register`)

Players submit:

- Personal details: name, father's name, age, phone, CNIC number, area/village.
- Cricket details: preferred team (or "Any Team"), playing role, batting style, bowling style, CricPro ID, notes.
- Files: profile picture, CNIC front, CNIC back, and the fee payment receipt (JPG, PNG, WEBP, GIF or PDF, max 5 MB each).
- Agreement to the playing conditions and acknowledgement that the fee is non-refundable.

Rules enforced on the server:

- Registration can be **opened or closed** from the dashboard. A closed form shows a notice instead.
- The **registration fee** shown on the form is configurable from the dashboard (default Rs 1000).
- **One registration per CNIC number.**
- **Duplicate file detection.** Each CNIC and receipt image is SHA-256 hashed server-side, so the same image cannot be reused for a second registration.
- Every registration gets a short, sequential, human-readable ID such as `mpl-2026-01001`. Counters reset each year and are allocated atomically, so concurrent sign-ups never collide.

On success the player can **download a branded PDF confirmation** containing their registration ID, photo and submitted details.

### MFC football registration (`/mfc-register`)

Same flow as MPL, for football:

- Details: full name, father's name, date of birth, CNIC, phone, email, village / tehsil / district, position, preferred foot, previous club, experience, previous tournaments, height, jersey size and preferred jersey number.
- Files: photo and CNIC / B-Form image.
- Declaration agreement, one registration per CNIC, duplicate-image detection, open/close toggle.
- IDs look like `mfc-2026-00001`, and a PDF confirmation can be downloaded.

### Admin dashboard (`/admin`)

Login is by email + password. The sidebar is grouped as follows:

**Dashboard**
- **Overview** — headline counts (MPL and MFC registrations, allocated, awaiting allocation, pending verification), recent MPL and MFC sign-ups, current site status, and quick links to the league tools.

**Registrations**
- **MPL Registrations** — searchable table (card view on mobile) with stats for total, verified, allocated, unassigned and last-7-days sign-ups. For each player you can:
  - view full details and the uploaded files (via short-lived signed URLs),
  - mark as **verified / unverified** after checking the CNIC and receipt,
  - **allocate to a team** (separate from the team the player asked for),
  - delete the registration (its files are removed from R2 too),
  - **export everything to Excel** (`.xlsx`).
- **MFC Registrations** — the same tools for football: search, details, verify, delete and Excel export.

**League**
- **Scorecard & Fixtures** — create, edit and delete matches: match number, date, time, venue, teams, status, both innings (runs, wickets, overs, top batter, top bowler), result and man of the match.
- **Teams & Captains** — set each franchise's owner, captain and vice-captain. The captain and vice-captain must be players allocated to that team.
- **Points Table** — add, edit and remove standings rows.

**Website**
- **Management** — add, edit, reorder and remove management members, with photo and Urdu translations.
- **Sponsors** — add, edit and remove sponsors with logo, website link and tier.
- **Brand Ambassadors** — add, edit and remove ambassadors, with up to 6 images each and Urdu details.
- **Settings**
  - **Registration status** — open or close MPL and MFC registration independently, and set the MPL fee.
  - **Announcement** — set or disable the announcement bar text.
  - **Highlights** — set the YouTube highlight video.
  - **Your account** — change your own password.
  - **Team access** (owners only) — add or remove admin accounts.

### Admin accounts & security

- Admin accounts live in the `AdminUser` collection with **bcrypt-hashed passwords**.
- Two roles. An **owner** can manage other admin accounts. An **admin** can use everything else. The last owner cannot be removed, and you cannot remove your own account.
- **Brute-force protection.** After 5 failed logins an account is locked for 15 minutes.
- Sessions are an `httpOnly`, HMAC-signed cookie valid for **12 hours**. It carries the admin's id, name, email and role, so API routes can authorise requests without a database read. Rotating `SESSION_SECRET` logs out every session instantly.
- Every `/api/admin/*` route checks the session before returning data.

### File storage

All uploaded files (player photos, CNIC images, receipts, sponsor logos, management photos, ambassador images) are stored in a **private Cloudflare R2 bucket**. MongoDB only stores the object key.

- Public registration uploads go **straight from the browser to R2** using a 10-minute presigned upload URL from `/api/register/upload-url`. The registration request itself only carries the keys, which keeps it small and reliable on serverless hosting. The server then verifies each object exists, checks its size, and hashes it.
- Files are read back through **signed URLs valid for 1 hour**, so nothing in the bucket is publicly listable.

---

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.local.example .env.local
```

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | MongoDB connection string, e.g. from MongoDB Atlas (free tier works) or `mongodb://localhost:27017/mpl` |
| `SESSION_SECRET` | Long random string used to sign admin session cookies. Generate with `openssl rand -hex 32` |
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | R2 API token access key |
| `R2_SECRET_ACCESS_KEY` | R2 API token secret |
| `R2_BUCKET_NAME` | Name of the **private** R2 bucket |

R2 credentials are created in the Cloudflare dashboard under **R2 > Manage API Tokens**.

### 3. Allow browser uploads to R2 (CORS)

Browsers upload directly to R2, so the bucket must allow your site's origins. Run this once per bucket, and again whenever you add a new domain:

```bash
node --env-file=.env.local scripts/configure-r2-cors.js --origin https://mplswabi.com --origin https://www.mplswabi.com
```

Without `--origin` it uses the defaults in the script (the production domains, `*.vercel.app` and `http://localhost:3000`). If this step is skipped, players see a plain "Failed to fetch" when submitting.

### 4. Create the first admin

```bash
node --env-file=.env.local scripts/create-admin.js --name "Your Name" --email you@example.com --password "a strong password"
```

The first account becomes an **owner**, who can add teammates from **Settings > Team access**. The same script doubles as a break-glass password reset if every owner is locked out.

### 5. Run

```bash
npm run dev
```

- Website: http://localhost:3000
- MPL registration: http://localhost:3000/register
- MFC registration: http://localhost:3000/mfc-register
- Admin dashboard: http://localhost:3000/admin

Other scripts: `npm run build`, `npm start`, `npm run lint`.

---

## Deployment

The app runs on Vercel or any Node host.

1. Push the repo to GitHub and import it into Vercel.
2. Add all six environment variables in the project settings.
3. Deploy.
4. Run `configure-r2-cors.js` with your production domain(s).
5. Run `create-admin.js` once against the production `MONGODB_URI` to create the first owner.

Make sure MongoDB Atlas accepts connections from your host (**Atlas > Network Access**: allow `0.0.0.0/0` or add the host's IPs).

---

## API reference

### Public

| Method & route | Purpose |
| --- | --- |
| `POST /api/register/upload-url` | Get a presigned R2 upload URL for a registration file |
| `POST /api/register` | Submit an MPL registration |
| `POST /api/mfc-register` | Submit an MFC registration |
| `GET /api/settings` | Public settings: announcement, highlight video, registration status, fee |
| `GET /api/stats` | Total registered MPL players |
| `GET /api/teams?name=` | Roster, owner and captains of one team |
| `GET /api/matches` | Fixtures and scorecards |
| `GET /api/points-table` | Standings |
| `GET /api/management` | Management members |
| `GET /api/sponsors` | Sponsors |
| `GET /api/brand-ambassadors` | Brand ambassadors |

### Admin (session required)

| Route | Methods | Purpose |
| --- | --- | --- |
| `/api/admin/login` | POST | Log in |
| `/api/admin/logout` | POST | Log out |
| `/api/admin/session` | GET | Current session info |
| `/api/admin/change-password` | POST | Change your own password |
| `/api/admin/admins` | GET, POST, DELETE | Manage admin accounts (owners only) |
| `/api/admin/registrations` | GET, PUT, DELETE | MPL registrations: list, verify / allocate team, delete |
| `/api/admin/export` | GET | MPL registrations as `.xlsx` |
| `/api/admin/mfc-registrations` | GET, PUT, DELETE | MFC registrations: list, verify, delete |
| `/api/admin/mfc-export` | GET | MFC registrations as `.xlsx` |
| `/api/admin/matches` | GET, POST, PUT, DELETE | Fixtures and scorecards |
| `/api/admin/teams` | GET, PUT | Team owners, captains, vice-captains |
| `/api/admin/points-table` | GET, POST, PUT, DELETE | Standings |
| `/api/admin/management` | GET, POST, PUT, DELETE | Management members |
| `/api/admin/sponsors` | GET, POST, PUT, DELETE | Sponsors |
| `/api/admin/brand-ambassadors` | GET, POST, PUT, DELETE | Brand ambassadors |
| `/api/admin/settings` | GET, PUT | Site settings |

---

## Data model (MongoDB collections)

| Model | Holds |
| --- | --- |
| `Registration` | MPL cricket players, verification flag, allocated team, R2 file keys and file hashes |
| `FootballRegistration` | MFC football players, verification flag, R2 file keys and file hash |
| `Counter` | Per-prefix, per-year sequence numbers for registration IDs |
| `Team` | Franchise owner, captain and vice-captain (references to registrations) |
| `Match` | Fixtures, innings, result and man of the match |
| `PointsTableRow` | Standings rows |
| `ManagementMember` | Management members with display order |
| `Sponsor` | Sponsors with logo and tier |
| `BrandAmbassador` | Ambassadors with up to 6 images and display order |
| `Settings` | Single `site` document: announcement, highlight video, registration open flags, MPL fee |
| `AdminUser` | Admin accounts, roles and login lockout state |

---

## Project structure

```
app/
  page.js                  Public homepage
  register/page.js         MPL cricket registration
  mfc-register/page.js     MFC football registration
  terms/page.js            Playing conditions & regulations
  admin/page.js            Admin login + dashboard
  layout.js                Root layout: language provider, AdSense, registration alert
  api/                     Public and admin API routes (see API reference)
components/
  site/                    Public site sections, forms, navbar, footer, language toggle
  admin/                   Dashboard pages, tables, modals and settings cards
  ui/                      Shared Button, Modal, Carousel, FormField, Reveal
lib/
  mongodb.js               Cached MongoDB connection
  auth.js                  Password hashing and signed-cookie sessions
  r2.js                    R2 uploads, presigned URLs, signed reads, hashing, deletes
  files.js                 Browser-side direct upload helpers
  pdf.js                   Branded registration confirmation PDF
  registrationId.js        Sequential registration IDs
  matches.js               Match statuses and league time-zone helpers
  siteData.js              Teams, villages, roles and other static site data
  sponsorTiers.js          Sponsor tier list and labels
  youtube.js               YouTube URL parsing
  termsData.js             Playing conditions content
  i18n/                    English/Urdu dictionary and language context
models/                    Mongoose schemas (see Data model)
scripts/
  create-admin.js          Create an admin / reset a password
  configure-r2-cors.js     Set the R2 bucket CORS policy
public/                    Logos, team badges, images, playing conditions .docx
```
