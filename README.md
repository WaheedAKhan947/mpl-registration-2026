# Maneri Premier League (MPL) — Website, Registration & Admin

The official website for the **Maneri Premier League** (cricket) and **Maneri Football Club** (MFC). It combines a public league site, online player registration for both sports, **ball-by-ball live scoring** with player stats and leaderboards, and a password-protected admin dashboard for running the league.

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
| **Points table** | Standings: played, won, lost, tied, no result, points, net run rate. Computed automatically from finished ball-by-ball matches, with manual rows as overrides (see [Points table](#points-table)). Refreshes by itself as soon as the scorecard shows a new result, and every 30 seconds while the page is open | Live Scoring (automatic), Points Table |
| **Scorecard** | Fixtures and results: upcoming / live / completed / abandoned, innings scores, top batter and bowler per side, result text, man of the match. Each card links to its match page. Ball-by-ball matches update by themselves. The section refreshes every 15 seconds on a match day or while a match is live, and every minute otherwise. Dates follow the league time zone (`Asia/Karachi`) | Live Scoring, Scorecard & Fixtures |
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
- **`/match/[id]`** — Match centre: live score header, then tabs for Live (batters, bowler, partnership, recent balls, free hit), Scorecard, Commentary, Squads and Info. Polls every 5 seconds while the match is live and stops once it is finished. Matches that were not scored ball by ball show their Info tab only.
- **`/stats`** — Leaderboards with the **orange cap** (most runs) and **purple cap** (most wickets), and Batting, Bowling and Fielding tabs.
- **`/player/[id]`** — Player profile: photo, team, role, batting and bowling style, captain and cap badges, tournament totals and a match-by-match log. Reached from rosters, scorecards and leaderboards.
- **`/overlay/[matchId]`** and **`/overlay/test`** — the broadcast overlay for live streams, and its setup test page. They are not linked from the site. See [Broadcast overlay](#broadcast-overlay-live-stream-graphics).

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

**League** (also available to scorer accounts)
- **Live Scoring** — set up a match and score it ball by ball from a phone. See [Live ball-by-ball scoring](#live-ball-by-ball-scoring).
- **Stream Overlay** — control the live-stream graphics of a match: force a screen, show a quick panel or a player card, hide sponsors, replay the last four / six / wicket, with a live preview and the overlay link. See [Broadcast overlay](#broadcast-overlay-live-stream-graphics), "Operator control".
- **Scorecard & Fixtures** — create, edit and delete matches: match number, date, time, venue, teams, status, both innings (runs, wickets, overs, top batter, top bowler), result and man of the match. Matches scored ball by ball fill these fields automatically, so use this form only for fixtures and hand-scored matches.
- **Teams & Captains** — set each franchise's owner, captain and vice-captain. The captain and vice-captain must be players allocated to that team.
- **Points Table** — the automatic standings, plus manual rows that override them for a team.

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

### Live ball-by-ball scoring

Balls are the single source of truth. Every score, scorecard, player stat, result and points-table row is worked out by replaying them, so nothing has to be corrected in two places.

**1. Match setup.** Pick a fixture in **Live Scoring**, then set:
- the toss winner and their choice,
- overs per innings (presets 5–20, or any number up to 50),
- match rules: runs for a wide and a no-ball (default 1 each), max overs per bowler (default: a fifth of the innings, rounded up), bowlers allowed one extra over (default 1 in matches under 20 overs, so in a 10-over match every bowler can bowl 2 overs and one bowler 3; 0 from 20 overs), and last man stands,
- each playing XI (2–15 players, chosen from players allocated to that team on the Draft Board),
- the opening batters and opening bowler.

The setup can be changed until the first ball is bowled.

**2. Scoring screen** (built for phones, large buttons):
- Score header with runs, wickets, overs, run rate, target, runs needed, required rate, the last 6 balls and a free-hit badge.
- Batters on strike with R, B, 4s, 6s and strike rate, the partnership, and the bowler's O-M-R-W.
- Buttons for 0, 1, 2, 3, 4, 6, Wd, Nb, Bye, LB, Out and Undo, plus Swap strike, Retire and More.
- The wicket flow asks for the dismissal type, who is out, the fielder and, for a run out, the runs completed and the delivery type.
- After a wicket the next-batter picker opens. After an over, the next-bowler picker opens, with the previous bowler and anyone at their limit greyed out.
- **More** has other runs (overthrows), penalty runs, a mid-over bowler change, ending an innings early, editing an earlier ball, changing the setup, and abandoning the match.
- At the innings break, pick the chasing openers, with an optional manual revised target or overs for rain (DLS).
- When the chase ends, the result is shown for confirmation before **Finish match** saves it.

**3. Rules the engine enforces** (`lib/scoring.js`, unit tested):
- Wides and no-balls are not legal deliveries. Byes and leg byes are legal but go to extras, not the batter.
- Strike changes on odd runs and at the end of every over.
- A bowler cannot bowl consecutive overs, and there is a maximum overs per bowler.
- A no-ball makes the next ball a **free hit**, where only a run out or obstructing the field is possible.
- Bowlers are credited only with the dismissals that are theirs. Retired hurt is not a wicket, and that batter can come back.
- The innings ends on overs, all out, or the target being reached.
- Results read like "X won by N runs", "Y won by N wickets (M balls left)", "Match tied" or "No result".

**Fixing mistakes.**
- **Undo** removes the last ball.
- **Edit an earlier ball** changes or deletes any ball. The whole innings is then re-checked, so a correction cannot leave a later ball impossible (for example a batter out twice). Correcting the first innings also updates the chase target.
- A finished match can be **re-opened** by an owner or admin. Its result, points and player stats return when it is finished again.

**Reliability.**
- Taps update the screen instantly and are sent in the background, in order.
- Failed sends retry automatically. Waiting actions are kept on the scorer's device (`localStorage`), so they survive a refresh or a closed tab.
- Every ball carries a client-generated id, so a retry can never save a ball twice.
- Every write names the ball number it expects next, so two scorers or a stale screen cannot corrupt an innings. The losing write is refused and the screen reloads the latest score.

**What a scored match updates.**
- After every ball, the homepage scorecard fields are filled for both sides: score, overs, top batter and best bowler. While live, the result line shows the situation, such as "Kings need 18 runs from 11 balls".
- When a match is finished, the result is written to the match and `PlayerMatchStats` is rebuilt from the balls. Both feed the points table, player profiles and leaderboards.

### Points table

- **Automatic standings** come from finished ball-by-ball matches. A win is worth 2 points, a tie or no result 1.
- Each winner is worked out from the match's innings, so a match counts the moment it is finished.
- **Net run rate** uses the standard rule: a side that is bowled out is charged its full quota of overs, and abandoned games are left out.
- **Manual rows** from the Points Table page still work as overrides. A manual row with at least one match played replaces the automatic row for its team, which suits seasons that mix hand-scored and live-scored matches.
- A manual row with nothing played is a placeholder. It shows only until the first scored match is finished.
- Manual team names must match the league's team names, or they won't line up with the automatic rows. The admin page flags any that don't.

### Broadcast overlay (live stream graphics)

> **Step-by-step streaming guide and match-day checklist: [docs/STREAMING.md](docs/STREAMING.md)** (PRISM phone, PRISM PC, OBS, Facebook Live, delay, running the graphics, replays, troubleshooting).
>
> **Status: complete (phases 1 to 9 and 11; phase 10, OBS video replays, was skipped because the league streams from PRISM).** The overlay shows the **real live score** of the match in its URL, with the complete score bar, broadcast effects (FOUR, SIX, WICKET, FIFTY, HUNDRED, HAT-TRICK, FREE HIT, over and maiden summaries), and full-screen **coming up, toss, playing XI, innings break and result** screens, a **new-batter card**, a rotating **sponsor panel**, an **operator panel** and a **highlights log** in the admin. Landscape, portrait and light (phone) modes are checked to fit without overlaps. It updates within about 2 seconds of each ball, survives network drops, and can be delayed to match the stream. For video replays when streaming from OBS, use OBS's own Replay Buffer and a hotkey (see the guide).

The overlay is a web page with a **transparent background** that shows TV-style cricket graphics. Add it as a **Web / Browser source** on top of the camera in **PRISM Live Studio** (mobile or PC) or **OBS Studio**, then stream to Facebook Live.

**URLs** (public, no login, never linked from the site):

| URL | Use |
| --- | --- |
| `/overlay/<matchId>` | The overlay for one match. Copy the ready-made link from **Admin > Stream Overlay** (or **Admin > Live Scoring**, open the match, then **Stream overlay link (PRISM / OBS)**). The `matchId` is also the last part of the match's public page address, `/match/<matchId>`. |
| `/overlay/demo` | Sample data with no match needed (also `?demo=1` on any overlay URL). Use it for designing and practising. Keyboard: **4** FOUR, **6** SIX, **M** a six that brings up a fifty (MAXIMUM), **W** WICKET (cycles bowled, caught, LBW, run out, stumped), **F** FIFTY, **H** HUNDRED, **N** no-ball (FREE HIT), **O** end of over, **Z** maiden, **T** HAT-TRICK, **I** new-batter card, **C** player card, **P** cycles the quick panels (partnership, run rate, off), **R** replay the last effect. Screens: **1** coming up, **2** toss and playing XIs, **3** innings break, **5** result, **0** back to the live score bar. |
| `/overlay/test` | Setup test. Load it first to check transparency, size and smoothness in your streaming app. |

**Its own layout.** The overlay has its own root layout (`app/(overlay)/layout.js`), separate from the website's (`app/(site)/layout.js`). It loads no navbar, footer, announcement bar, registration popup, language switcher or **AdSense** script, so ads can never appear on the stream. `html` and `body` are transparent, nothing scrolls, and search engines are told not to index it.

**On screen now.** The MPL logo panel ("Maneri Premier League, Season 2026, Match N") and a pulsing **LIVE** tag sit in the top-left corner. Along the bottom, what shows depends on the match state:

| Match state | Score bar shows |
| --- | --- |
| Before the toss, or a match that is not scored ball by ball | Team A **VS** Team B with badges, and the start time and venue (or the toss result, or the hand-entered result) |
| First innings | Batting team score and overs, both batters, the bowler (O-M-R-W), the run rate, and the last six balls |
| Innings break | Same, with **INNINGS BREAK** and the target |
| Chase | **NEED X OFF Y**, the target and the required rate |
| Finished | **RESULT**, for example "STRIKERS WON BY 3 WICKETS" |

**Details.**
- When a number changes, it rolls into place: the score, a batter's runs, the bowler's figures, and the runs and balls needed. Only the newest ball chip pops in; the others stay still.
- Boundaries show as gold (4) and purple (6) chips, wickets as red, and extras as navy. A **FREE HIT** tag follows a no-ball.
- After a wicket the striker's line shows **NEW BATTER** until the scorer picks the next one.
- Between overs the bar keeps the last bowler's completed figures until the next ball.
- Long names shrink, then cut off with "…".
- Light mode (`lite=1`) switches all of this motion off.

**Effects.** Big moments play a short effect over the camera, then remove themselves:

| Effect | Length | What plays |
| --- | --- | --- |
| FOUR | 2.5 s | A wipe in the batting team's colours, **FOUR** sliding in, a glowing screen edge, and the batter's new score ("Sudais Khan 34 (21)") |
| SIX | 3.5 s | A white flash, a short shake, **SIX** popping in with a burst of 60 confetti pieces, and a ball arcing across the top. A six that brings up a fifty or hundred shows **MAXIMUM** |
| WICKET | 4 s | A red flash, stumps with the bails flying off, **WICKET!** with a BOWLED / CAUGHT / LBW / RUN OUT / STUMPED tag, the dismissed batter's card (photo, how out such as "c Imran Shah b Hamza Afridi", runs, balls, 4s, 6s, strike rate), and the bowler's new figures |
| FIFTY / HUNDRED | 3.5 / 4 s | A gold-framed badge with the batter's photo, a big **50** or **100**, and runs, balls, 4s, 6s and strike rate. Reached with a boundary, it plays straight after the FOUR or SIX |
| HAT-TRICK | 4 s | Three wickets credited to the same bowler on his consecutive legal balls (wides and no-balls in between don't break it; run outs don't count). Gold flash, **HAT-TRICK!**, and the bowler's photo and figures |
| FREE HIT | 2.5 s | A striped gold **FREE HIT** banner across the top after every no-ball, with who is on strike |
| End of over / MAIDEN | 3.5 s | A panel above the score bar: "End of over 15", runs and wickets in the over, its balls as chips, the bowler's figures, the score and run rate. A maiden shows **MAIDEN OVER**. Not shown for the last over of an innings |

- Effects play **one at a time, each exactly once**. A burst of balls keeps at most three waiting.
- A moment more than 10 seconds old is skipped, for example when the scorer's phone was offline and catches up later.
- Reloading the page never replays one.
- Effects wait for `delay` together with the score.
- With `lite=1`, each effect is a single simple card that fades in and out, with no flash, shake or confetti.
- `effects=off` turns them off, and `fx=six,wicket` keeps only the listed ones.
- Batter photos come from `/api/players/<id>/photo`. A missing photo shows initials instead.

**Full-screen screens.** At set points in a match, a full-screen panel replaces the score bar. The MPL logo and LIVE tag stay up. The screen is chosen from the match state, so it needs no operator:

| When | Screen |
| --- | --- |
| Before the toss (and for matches not scored ball by ball that haven't finished) | **Coming up**: both team badges, VS, match number, date, time and venue |
| After the toss, until the first ball | Rotates every 10 seconds: **the toss** ("STRIKERS won the toss and chose to bowl"), then each team's **playing XI**: photo, name, role, captain (C) and vice-captain (VC) |
| Innings break | First-innings score, the top two batters, the two best bowlers, and a big **TARGET** with the overs and the runs an over needed |
| Finished | **Result**: winner's badge and the margin, both innings with each side's best batter and bowler, and the **player of the match** with photo |

- The first ball of each innings brings the score bar back.
- Player of the match comes from the "Man of the match" field in **Scorecard & Fixtures**. The photo appears when that name matches a player in either playing XI.
- `screens=off` turns these screens off and keeps the score bar up throughout.

**New-batter card.** When a wicket falls and the scorer picks the next batter, a lower-third card slides in above the score bar for 6 seconds: photo, name, team, role, the score they come in at, and their **tournament numbers** (matches, runs, average, strike rate, best), or "First MPL innings" for a debut.
- It waits for the WICKET effect to finish, then plays once. Openers get no card, and neither does a retired-hurt batter coming back.
- Numbers come from finished, ball-by-ball scored matches (the same figures as the player's profile page).
- Cards are not shown while a full-screen screen is up. `cards=off` turns them off. They still show in `lite` mode.

**Sponsors.** The top-right corner fades through the sponsors managed in **Admin > Sponsors**, every 6 seconds, highest tier first: just the logo and the sponsor's name, with no panel behind them. Sponsors without a logo are skipped, and nothing shows when there are none. The list is reloaded every 30 minutes; if that fails, the current logos stay. `sponsors=off` hides it.

**Operator control (Admin > Stream Overlay).** The person running the stream controls the graphics from the admin dashboard (owners, admins and the match's scorers), on a phone or a PC, without touching OBS or PRISM. Pick the match, then:

| Control | What the overlay does |
| --- | --- |
| **Replay effect** | Plays the last FOUR, SIX or WICKET again with a REPLAY tag. The button names it ("Replay WICKET · 14.2"). |
| **Screen** | **Automatic** (default) shows coming up, toss and XIs, innings break and result at the right times. **Score bar only** turns those off. **Coming up**, **Toss & XIs**, **Scorecard** (current innings: batting and bowling), **Target** (innings break) and **Result** force that screen until you pick another. A screen whose data doesn't exist yet (Target before the first innings ends) is skipped and the score bar stays. |
| **Quick panel** | A small panel above the score bar, at the right: **Partnership** (runs and balls, both batters, last wicket) or **Run rate** (current and required rate and "Need X off Y" in a chase; current and projected score in the first innings). **Off** hides it. |
| **Player card** | Pick any player in either playing XI: an 8-second lower-third with photo, role, today's figures ("Today 34* (21) · 2-18 (3.0)") and tournament numbers (batting and bowling). |
| **Sponsors** | Show or hide the sponsor panel. |
| **Reset everything to automatic** | Screen automatic, no panel, sponsors on. |

- Every overlay of that match follows within about 2 seconds, plus its `delay`. A reload never replays a card or replay.
- The page also has a **preview** of the overlay on a checkerboard (the see-through parts) and the copy-ready overlay link.
- The state is stored per match in `OverlayState`; the public overlay feed includes it.
- The sponsor panel and quick panels are hidden while a full-screen screen is up.

**Highlights log (Admin > Stream Overlay).** Every four, six, wicket, fifty, hundred and hat-trick of the match, with the clock time it was scored, so whoever edits the stream recording can find each moment. It is built from the balls already saved, so nothing extra has to be recorded, and it refreshes every 30 seconds.
- Press **Started now** when the stream goes live (or type the start time, in Pakistan time, and press **Set time**). Each moment then also gets its **video time**: where it is in the recording.
- **Clip lead** (10 seconds by default) moves each video time earlier, because the scorer taps a ball a few seconds after it happens.
- Filter by wickets, sixes, fours or milestones, and **Download CSV** for the editor.

**Placement.** The stacked graphics are placed from the score bar's edge (`lib/overlay/layout.js`): the over summary and the quick panel just above the bar, the player cards above those. The portrait score bar is stacked and about twice as tall, so in portrait they all sit higher. Automated checks confirm that at 1920x1080, 1280x720, portrait 1080x1920 and a 360x640 phone source the score bar, cards, panels, sponsors and over summary are inside the frame and never overlap.

**How it stays live.**
- The first frame is rendered by the server, so the score is there straight away, even right after the streaming app reloads the page.
- The page then polls `GET /api/matches/<matchId>/overlay` every 2 seconds, or 3.5 seconds in `lite` mode. That response is cached for 1 second, so many viewers cost one database read per second.
- If the network or server fails, the last score **stays on screen**. Retries are quiet and back off up to 10 seconds, so no error ever shows on stream.
- `?delay=N` holds every new score back N seconds, so the graphics change together with the stream video. The video usually reaches viewers a few seconds late.

**Sizing.** Graphics are laid out on a fixed design canvas, 1920x1080 by default. The page scales that canvas to fit whatever size the web source is (1080p, 720p or a phone), centred and letterboxed, and everything stays inside a 5% safe margin.

**URL parameters**

| Parameter | Values (default first) | Works now? |
| --- | --- | --- |
| `bg` | `transparent`, `solid` (dark navy), `chroma` (pure green `#00FF00`, for a chroma-key filter if the app cannot show transparency) | Yes |
| `position` | `bottom`, `top` (where the score bar sits; the logo and LIVE tag move to the opposite corner) | Yes |
| `layout` | `landscape`, `portrait` (stacked score bar on a 1080x1920 canvas, for 9:16 streams) | Yes |
| `w`, `h` | Design canvas size in pixels (1920 x 1080) | Yes |
| `scale` | Multiplier on top of the auto-fit (1, range 0.25 to 3) | Yes |
| `debug` | `1` outlines the canvas and safe area, prints the canvas, source and fit sizes, and shows the feed status, **frames per second**, memory use and time since the last reload (for the phone test below). Take it off the URL before going live | Yes |
| `delay` | Seconds to hold new scores back so they match the stream video (0, max 60) | Yes |
| `poll` | Seconds between score checks (2; 3.5 in `lite`; range 1 to 30) | Yes |
| `lite` | `1` light mode for phones: no animation (cards and panels keep a simple slide), no shadows, blur or filters on any element, simple effect cards, polling every 3.5 seconds | Yes |
| `demo` | `1` shows sample data instead of the match | Yes |
| `effects` | `on`, `off` (all effects) | Yes |
| `fx` | Comma list of effects to keep, from `four`, `six`, `wicket`, `fifty`, `hundred`, `hattrick`, `freehit`, `over`, `maiden`. For example `fx=six,wicket,fifty,hundred` (all) | Yes |
| `screens` | `on`, `off` (the automatic coming up, toss, playing XI, innings break and result screens; screens chosen in Admin > Stream Overlay still show) | Yes |
| `cards` | `on`, `off` (the new-batter card) | Yes |
| `sponsors` | `on`, `off` (the sponsor panel) | Yes |
| `sound`, `lang`, `theme` | See the overlay spec | Read and validated now, take effect in later phases |

Bad or out-of-range values fall back to safe defaults, so a typo in the app's URL field never breaks the stream.

**Test it in PRISM or OBS** (the full setup, with the app settings and Facebook Live, is in [docs/STREAMING.md](docs/STREAMING.md))
1. Deploy, or use your PC's address on the same Wi-Fi, for example `http://192.168.1.10:3000`.
2. **PRISM mobile:** My Studio > Widget > Web, then paste `https://<site>/overlay/test`. **PRISM PC or OBS:** add a Browser source with that URL at the stream size (1920 x 1080 or 1280 x 720).
3. Check the test page over the live camera:
   - you see the camera around the coloured boxes,
   - the "50% see-through" panel shows the camera through it,
   - the four corner boxes are not cropped,
   - the ball moves smoothly, and frames per second stays near 30 or more.
   - Note the **source size** it reports, and whether **Up for (s)** resets when you switch scenes. A reset means the app reloads the page.
4. If the background is **not** transparent, try `/overlay/test?bg=chroma` with the app's chroma-key filter, if it has one.
5. Then load `/overlay/demo` (add `?debug=1` to see sizes) and check the score bar's size and position. Try `?position=top` and, on a vertical stream, `?layout=portrait`.
6. Then a real match. Copy its link from **Admin > Live Scoring**, score a few balls from another phone, and watch them appear on the stream. Add `&debug=1` to see the feed status (last update, retries, delay).
7. Tune the delay: score a ball, count the seconds until the stream video shows that moment, and put that number in the link box's **Delay** field.

**30-minute phone test** (before the first streamed match). The goal is to find out whether the streaming phone stays smooth and cool with the overlay running.
1. On the streaming phone, add the overlay as a web source with `?lite=1&debug=1` (for example `/overlay/<matchId>?lite=1&debug=1`). Stream privately ("Only me") with the camera running.
2. From a **second phone**, score a practice match in Admin > Live Scoring, and use **Admin > Stream Overlay** to show a few cards, panels and replays.
3. Every 10 minutes, note the debug line: **fps** (green at 24 or more, red below), **memory** (should level off, not keep climbing) and **up** (if it drops to 0:00:00, PRISM reloaded the page; the score must still be there straight away).
4. Also note how warm the phone gets and whether the stream video stutters.
5. Repeat for 10 minutes without `lite=1`. Use full mode only if it stays at 24 fps or more and the phone doesn't overheat; otherwise stream with `lite=1`.
6. Remove `&debug=1` from the link before going live.

### Admin accounts & security

- Admin accounts live in the `AdminUser` collection with **bcrypt-hashed passwords**.
- Three roles:
  - An **owner** can manage other admin accounts.
  - An **admin** can use everything else.
  - A **scorer** sees only the **League** section and their own account settings. That covers Live Scoring, Stream Overlay, Scorecard & Fixtures, Draft Board, Teams & Captains and Points Table.
  - On the Draft Board a scorer can allocate players to teams. They cannot verify, list or delete registrations, so they never see CNIC or phone details.
  - Every other admin API refuses scorer sessions, and only owners and admins can re-open a finished match.
  - The owner creates scorer accounts from **Settings > Team access** by choosing the role "Scorer".
  - A match can also be limited to named scorer accounts. If none are named, any scorer can score it.
- The last owner cannot be removed, and you cannot remove your own account.
- **Brute-force protection.** After 5 failed logins an account is locked for 15 minutes.
- Sessions are an `httpOnly`, HMAC-signed cookie valid for **12 hours**. It carries the admin's id, name, email and role, so API routes can authorise requests without a database read. Rotating `SESSION_SECRET` logs out every session instantly.
- Every `/api/admin/*` route checks the session before returning data.
- Public match, player and stats pages only expose player names, photos (through signed URLs), roles and batting and bowling styles. Phone, CNIC and other registration details never leave the server. A player profile exists only for players allocated to a team or with recorded stats.

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

The first account becomes an **owner**, who can add teammates from **Settings > Team access**. Add `--role owner|admin|scorer` to choose a role. The same script doubles as a break-glass password reset if every owner is locked out.

### 5. Run

```bash
npm run dev
```

- Website: http://localhost:3000
- MPL registration: http://localhost:3000/register
- MFC registration: http://localhost:3000/mfc-register
- Admin dashboard: http://localhost:3000/admin
- Leaderboards: http://localhost:3000/stats

Other scripts: `npm run build`, `npm start`, `npm run lint` (ESLint, `next/core-web-vitals`) and `npm test`.

### 6. Tests

```bash
npm test
```

This runs the unit tests in `tests/` with Node's built-in test runner. No extra packages are needed. They cover:
- the scoring engine: extras, strike rotation, free hits, wickets, bowling limits, innings end, results, corrections and batting order,
- points and net run rate,
- career totals and leaderboards,
- overlay URL parameters, canvas fitting, the delay buffer, the effects queue, event detection (milestones, hat-tricks, over summaries), which full-screen screen to show, operator control (forced screens, replays, player cards), graphic placement in landscape and portrait, and the highlights log (video times and CSV).

### 7. Practice match (optional)

To try live scoring end to end, create a practice fixture between two teams that already have allocated players, then score it from **Admin > Live Scoring**:

```bash
node --env-file=.env.local scripts/seed-test-match.js                # or --teamA "Maneri Kings" --teamB "Maneri Azmari"
node --env-file=.env.local scripts/seed-test-match.js --remove       # delete it, with its innings, balls and stats
```

The fixture is marked with the venue "Test match (seeded)". It shows on the public site until it is removed, so use a test database or remove it straight after.

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
| `GET /api/matches/[id]/live` | Live score, batters, bowler, last 6 balls, run rates, partnership, situation |
| `GET /api/matches/[id]/scorecard` | Full scorecard: batting and bowling tables, extras, fall of wickets, playing XIs |
| `GET /api/matches/[id]/commentary?cursor=` | Ball-by-ball commentary, newest first, 30 per page |
| `GET /api/matches/[id]/overlay` | Feed for the stream overlay: the live-score payload, both playing XIs, each innings' top performers, player of the match, the latest events (FOUR, SIX, WICKET, FIFTY, HUNDRED, HATTRICK, FREE_HIT, OVER, MAIDEN, NEW_BATTER and PLAYER_CARD with tournament numbers, and operator replays), the operator's control state, the scorecard when it is on screen, and the server time, cached for 1 second |
| `GET /api/players/[id]/photo` | A player's photo (redirects to a short-lived signed link). Same privacy rule as profiles |
| `GET /api/players/[id]/stats` | Player profile, tournament totals and match log |
| `GET /api/stats/leaders` | Orange / purple cap and batting, bowling and fielding leaderboards |
| `GET /api/points-table` | Standings (automatic, with manual overrides) |
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

Scorer accounts may use the League routes in the table above: matches, teams, points-table, draft-players, and a `PUT` to registrations that changes only `allocatedTeam`. Every other admin route refuses them.

Public match responses are cached briefly at the CDN: 3 seconds while a match is live and 10 seconds otherwise. Player and leaderboard responses are cached for 15 seconds. Many viewers then share one database read, and a result still shows within seconds.

### Live scoring (owner, admin or scorer session)

| Route | Methods | Purpose |
| --- | --- | --- |
| `/api/admin/scoring/matches` | GET | Matches the signed-in account can score |
| `/api/admin/scoring/matches/[id]` | GET | Full scoring state: match, squads, innings and balls |
| `/api/admin/scoring/start` | POST | Toss, overs, rules, playing XIs and openers; starts innings 1 |
| `/api/admin/scoring/ball` | POST | Record a ball (`clientId` for safe retries, `expectedSeq` for ordering) |
| `/api/admin/scoring/ball/[id]` | PUT, DELETE | Correct or delete an earlier ball; the innings is re-checked |
| `/api/admin/scoring/undo` | POST | Undo the last ball, or the start of the second innings |
| `/api/admin/scoring/select-players` | POST | New batter, new bowler or strike change |
| `/api/admin/scoring/end-innings` | POST | Close the innings; after the first, open the chase with its openers and an optional revised target |
| `/api/admin/scoring/finish` | POST | Save the result (or no result), rebuild player stats and update standings |
| `/api/admin/scoring/reopen` | POST | Re-open a finished match for corrections (owner or admin only) |
| `/api/admin/overlay` | GET, POST | Stream overlay control for one match: screen, quick panel, sponsors, player card, replay effect, stream start time, reset |
| `/api/admin/overlay/highlights` | GET | Highlights log: every four, six, wicket, fifty, hundred and hat-trick with its time, and the stream start time |

---

## Data model (MongoDB collections)

| Model | Holds |
| --- | --- |
| `Registration` | MPL cricket players, verification flag, allocated team, R2 file keys and file hashes |
| `FootballRegistration` | MFC football players, verification flag, R2 file keys and file hash |
| `Counter` | Per-prefix, per-year sequence numbers for registration IDs |
| `Team` | Franchise owner, captain and vice-captain (references to registrations) |
| `Match` | Fixtures, innings summary, result and man of the match. For live scoring: toss, overs, playing XIs, scoring status, current innings, scorers, rule settings and a structured result |
| `Innings` | One innings of a scored match: batting and bowling side, target, who is at the crease, and cached totals rebuilt from balls |
| `Ball` | One document per delivery or scoring event (penalty runs, retirement), with a unique `clientId` and a unique match + innings + sequence number |
| `OverlayState` | Per match: the stream overlay's operator choices (screen, quick panel, sponsors), the latest player-card and replay requests, and the stream start time for the highlights log |
| `PlayerMatchStats` | Per-player, per-match batting, bowling and fielding figures, rebuilt from balls when a match is finished |
| `PointsTableRow` | Manual standings rows (override the automatic table for their team) |
| `ManagementMember` | Management members with display order |
| `Sponsor` | Sponsors with logo and tier |
| `BrandAmbassador` | Ambassadors with up to 6 images and display order |
| `Settings` | Single `site` document: announcement, highlight video, registration open flags, MPL fee |
| `AdminUser` | Admin accounts, roles and login lockout state |

---

## Project structure

```
app/
  (site)/                  The website (route group with its own root layout; URLs unchanged)
    layout.js              Site root layout: language provider, AdSense, announcement bar, registration alert
    page.js                Public homepage
    register/page.js       MPL cricket registration
    mfc-register/page.js   MFC football registration
    terms/page.js          Playing conditions & regulations
    match/[id]/page.js     Public match centre
    player/[id]/page.js    Public player profile
    stats/page.js          Leaderboards
    admin/page.js          Admin login + dashboard
  (overlay)/               Broadcast overlay (separate root layout: transparent, no site chrome, no ads)
    layout.js              Bare <html>/<body>, fonts, overlay.css
    overlay/[matchId]/     The stream overlay for one match
    overlay/test/          Transparency / sizing test page for streaming apps
  globals.css              Site styles
  api/                     Public and admin API routes (see API reference)
components/
  site/                    Public site sections, forms, navbar, footer, language toggle
    match/                 Match centre
    player/                Player profile
    stats/                 Leaderboards
  admin/                   Dashboard pages, tables, modals and settings cards
    scoring/               Live scoring: match list, setup, scoring screen, sheets, ball editor
  overlay/                 Stream overlay: canvas auto-fit, live feed, corner logo, score bar, effects, full-screen screens, transparency test
  ui/                      Shared Button, Modal, Carousel, FormField, Reveal
lib/
  mongodb.js               Cached MongoDB connection
  auth.js                  Password hashing and signed-cookie sessions
  r2.js                    R2 uploads, presigned URLs, signed reads, hashing, deletes
  files.js                 Browser-side direct upload helpers
  pdf.js                   Branded registration confirmation PDF
  registrationId.js        Sequential registration IDs
  matches.js               Match statuses and league time-zone helpers
  scoring.js               Ball-by-ball engine: replay, validation, commentary, results (pure, unit tested)
  scoringServer.js         Scoring writes: sessions, innings rebuilds, homepage summary sync, stats rebuild
  standings.js             Points and net run rate (pure, unit tested)
  pointsTable.js           Automatic standings merged with manual rows
  publicMatch.js           Live, scorecard and commentary views for the match centre
  playerStats.js           Career totals and leaderboards (pure, unit tested)
  statsServer.js           Player profiles and leaderboards from PlayerMatchStats
  siteData.js              Teams, villages, roles and other static site data
  sponsorTiers.js          Sponsor tier list and labels
  youtube.js               YouTube URL parsing
  termsData.js             Playing conditions content
  i18n/                    English/Urdu dictionary and language context
  overlay/                 Overlay URL parameters, canvas fit, delay buffer, effect queue, event detection and screen choice (unit tested), wording, team colours, sample and demo data
models/                    Mongoose schemas (see Data model)
scripts/
  create-admin.js          Create an admin or scorer / reset a password
  configure-r2-cors.js     Set the R2 bucket CORS policy
  seed-test-match.js       Create or remove a practice fixture for live scoring
tests/                     Unit tests (node --test)
public/                    Logos, team badges, images, playing conditions .docx
```
