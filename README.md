# MPL Registration — Next.js + MongoDB

A simple Next.js site with:
- **Public page (`/`)** — player registration form (based on the MPL design).
- **Admin page (`/admin`)** — password-protected dashboard to view all registrations and export them to Excel (.xlsx).
- **MongoDB** — all registrations are stored in a MongoDB collection.

## 1. Install dependencies

```bash
npm install
```

## 2. Configure environment variables

Copy the example file and fill in your own values:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/mpl?retryWrites=true&w=majority
SESSION_SECRET=any-long-random-string
```

- `MONGODB_URI` — get this from MongoDB Atlas (free tier works fine) or point it at a local MongoDB instance, e.g. `mongodb://localhost:27017/mpl`.
- `SESSION_SECRET` — any random string, used to sign the admin login cookie. Generate one with `openssl rand -hex 32`. Rotating it instantly logs out every admin session, which is a useful "kill switch" if a cookie ever leaks.

Admin accounts live in MongoDB, not an env var. Bootstrap the first one:

```bash
node --env-file=.env.local scripts/create-admin.js --name "Your Name" --email you@example.com --password "a strong password"
```

The first account created becomes an **owner**, who can add or remove teammates from the dashboard's Settings > Team access panel without touching the code. The same script doubles as a break-glass password reset if every owner is ever locked out.

## 3. Run the app

```bash
npm run dev
```

- Registration form: http://localhost:3000
- Admin dashboard: http://localhost:3000/admin

## 4. Deploy

This app works out of the box on Vercel (or any Node host):
1. Push this project to a GitHub repo.
2. Import it into Vercel.
3. Add the two environment variables above (`MONGODB_URI`, `SESSION_SECRET`) in the Vercel project settings.
4. Deploy, then run the `create-admin.js` script once against the production `MONGODB_URI` to create the first owner account.

Make sure your MongoDB Atlas cluster allows connections from your deployment (Atlas → Network Access → allow `0.0.0.0/0`, or add Vercel's IPs).

## How it works

- **Registration flow**: the form on `/` uploads text fields plus 3 files (profile picture, CNIC image, fee receipt), which are converted to base64 in the browser and sent as JSON to `POST /api/register`. This is saved as a new document in the `registrations` MongoDB collection (limit 3MB per file).
- **Admin auth**: `POST /api/admin/login` checks the submitted email + password against the `AdminUser` collection (bcrypt-hashed passwords, with lockout after repeated failed attempts). On success it sets an `httpOnly` signed cookie (12-hour expiry) that embeds the admin's id/name/email/role, so routes can check "is this a valid session" without a database read. All admin API routes (`/api/admin/registrations`, `/api/admin/export`) check this cookie before returning any data. Each admin can change their own password from Settings > Your account (`POST /api/admin/change-password`), and owners can add/remove teammates from Settings > Team access (`/api/admin/admins`).
- **Dashboard**: `/admin` fetches `GET /api/admin/registrations` and renders a table, with a delete button per row (`DELETE /api/admin/registrations`).
- **Excel export**: `GET /api/admin/export` is a protected route that pulls all registrations from MongoDB, builds a `.xlsx` workbook in-memory with the `xlsx` package, and streams it back as a file download.

## Project structure

```
app/
  page.js                        Public registration form
  admin/page.js                  Admin login + dashboard
  api/register/route.js          Save a new registration
  api/admin/login/route.js       Admin login
  api/admin/logout/route.js      Admin logout
  api/admin/session/route.js     Check if admin is logged in
  api/admin/registrations/route.js   List / delete registrations (protected)
  api/admin/export/route.js      Export registrations to Excel (protected)
lib/
  mongodb.js                     MongoDB connection helper
  auth.js                        Simple signed-cookie session helper
models/
  Registration.js                Mongoose schema
```

## Notes / next steps you may want

- This uses a single shared admin password rather than per-user accounts — good enough for one admin, but swap in a users collection + hashed passwords if you need multiple admins.
- Uploaded files are stored as base64 strings directly in MongoDB documents, which is simple but not ideal for large volumes of files — consider moving to a storage bucket (S3, Cloudinary, etc.) if you expect many registrations with images.
