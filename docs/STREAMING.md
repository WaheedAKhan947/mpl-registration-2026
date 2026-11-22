# Streaming MPL matches to Facebook Live

How to put the MPL score graphics on a live stream with **PRISM Live Studio** (phone or PC) or **OBS Studio**, and what to do on match day.

The graphics are one web page, the **overlay**, with a see-through background. The streaming app lays it over the camera picture. The scorer scores the match ball by ball from a second phone (Admin > Live Scoring), and the overlay follows within about 2 seconds. Every graphic comes from that one page; you never need more than one web source.

Contents:
1. [What you need](#1-what-you-need)
2. [The overlay link](#2-the-overlay-link)
3. [PRISM Live Studio, phone](#3-prism-live-studio-phone)
4. [PRISM Live Studio, PC](#4-prism-live-studio-pc)
5. [OBS Studio](#5-obs-studio)
6. [Facebook Live](#6-facebook-live)
7. [Setting the delay](#7-setting-the-delay)
8. [Running the graphics during the match](#8-running-the-graphics-during-the-match)
9. [Replays](#9-replays)
10. [Dry run and phone test](#10-dry-run-and-phone-test)
11. [Match-day checklist](#11-match-day-checklist)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. What you need

- **Two devices.** One streams (camera, PRISM or OBS). The other scores (any phone with a browser, logged in to `/admin`). Never score on the streaming phone: it slows the stream and the phone heats up.
- **A stable connection** on the streaming device: Wi-Fi or strong 4G/5G, at least 5 Mbps upload for 720p.
- **Power:** keep the streaming phone plugged in, and a power bank for the scorer.
- A **tripod or gimbal** for the camera phone.
- Admin accounts: an owner can create a **scorer** account (Settings > Team access). A scorer can score and run the stream graphics but cannot see registrations or site settings.

## 2. The overlay link

Open **Admin > Stream Overlay**, pick the match, and use **Stream overlay link (PRISM / OBS)**. It builds the link for you:

| Option | When to tick it |
| --- | --- |
| **Phone (light mode)** | Streaming from a phone (adds `lite=1`). Lighter graphics so the phone stays cool and smooth. |
| **Vertical stream** | A 9:16 (portrait) stream (adds `layout=portrait`). |
| **Score bar at top** | The bottom of the picture is busy (adds `position=top`). |
| **Delay** | The seconds the stream video runs behind real life, see [Setting the delay](#7-setting-the-delay). |

Press **Copy** and paste it into the streaming app. The link looks like:

```
https://<your-site>/overlay/<matchId>?lite=1&delay=6
```

Other useful links:
- `https://<your-site>/overlay/test` — setup test page (transparency, size, smoothness). Load this first in a new app or on a new phone.
- `https://<your-site>/overlay/demo` — sample graphics without a match, for practice. On a keyboard: 4, 6, W, F, H, N, O, Z, T, I, C, P, R and screens 1, 2, 3, 5, 0 (listed on the page).

All link options are listed in the README under "URL parameters".

## 3. PRISM Live Studio, phone

1. Install PRISM Live Studio and log in. Add **Facebook** (your page or profile) as the destination.
2. Set video quality to **720p, 30 fps**. It is the safe choice on most phones.
3. Open **My Studio > Widget > Web**. Paste the overlay link (with **Phone (light mode)** ticked).
4. Stretch the web source to cover the **whole frame**.
5. Check that you see the camera around the graphics. If the background is not see-through:
   - try the link with `&bg=chroma` and PRISM's chroma-key (green screen) option, if your version has one;
   - if neither works, tell the developer: the fallback is a solid strip at the bottom of the frame.
6. Phone settings: screen stays on, battery saver off, Do Not Disturb on, notifications off.
7. Score from the **second phone**.

PRISM phone allows up to 4 web sources. You only need one.

## 4. PRISM Live Studio, PC

1. Install PRISM Live Studio for Windows or Mac. Add the camera (or capture card) source.
2. Add a **Web / Browser source** with the overlay link (light mode not needed on a decent PC). Set width and height to the stream size: **1920 x 1080** or **1280 x 720**.
3. Optional custom CSS: `body { background: transparent !important; }`
4. Turn off **"End source when not visible"**, so the overlay stays loaded when you switch scenes.
5. Choose Facebook as the destination and start a private test first ("Only me").

## 5. OBS Studio

1. Install OBS Studio. Add the camera / capture device as a source.
2. Add a **Browser** source on top of it:
   - URL: the overlay link
   - Width **1920**, Height **1080** (or 1280 x 720 to match your output), FPS **30**
   - Custom CSS: `body { background: transparent !important; }`
   - Leave **"Shutdown source when not visible"** unticked.
3. **Settings > Output** (recommended):
   - 1080p30: about 4500 kbps. 720p30: about 3000 kbps.
   - Keyframe interval **2 s**, encoder x264 or your hardware encoder (NVENC, QuickSync, AMF).
   - Audio 128 kbps.
4. A steady upload matters more than resolution: if the stream stutters, drop to 720p.

## 6. Facebook Live

1. Facebook > **Live video** (Live Producer) on the page you stream to.
2. **PRISM:** connect Facebook inside PRISM and pick the page; no key needed.
3. **OBS:** choose **Streaming software**, copy the **Server URL** and **Stream key**, and paste them in OBS under Settings > Stream (Service: Custom).
4. Start with the audience set to **Only me** for testing; switch to Public for the match.

## 7. Setting the delay

The stream video reaches viewers a few seconds after real life, but the scorer's taps reach the overlay in about 2 seconds. Without a delay the score changes *before* viewers see the ball.

1. Go live privately ("Only me") and watch the stream on another device.
2. Score a ball and count the seconds until the stream video shows that ball being bowled.
3. Put that number in the link box's **Delay** field (typically 4 to 10 seconds), copy the new link and paste it into the app.
4. Check again with another ball: the graphics should change together with the video.

## 8. Running the graphics during the match

Everything happens automatically from the scoring: score bar, four / six / wicket effects, milestones, free hit, end of over, new-batter cards, the toss and playing XIs before the first ball, innings break with the target, and the result.

**Admin > Stream Overlay** lets a second person (or the scorer between balls) take control:

| Control | Use it for |
| --- | --- |
| **Replay effect** | Re-run the last four, six or wicket with a REPLAY tag. |
| **Screen** | Keep it on **Automatic**. Pick **Scorecard** during a break or a drinks interval, **Points table** before the match or after the result, **Toss & XIs** or **Coming up** before the match. Remember to go back to **Automatic**. |
| **Quick panel** | **Partnership** or **Run rate** above the score bar. Turn **Off** after a few overs. |
| **Player card** | Introduce a bowler or a fielder who just took a catch. |
| **Sponsors** | Hide the sponsor panel if it covers something. |
| **Reset everything to automatic** | When unsure, press this. |

Changes reach the stream within about 2 seconds, plus the delay.

## 9. Replays

- **Replay effect (PRISM and OBS):** the **Replay effect** button re-runs the last four, six or wicket graphic with a REPLAY tag. It is not video, but works on any setup.
- **Video replays (OBS only):** not built (phase 10 was skipped because the league streams from PRISM). If you move to OBS later, OBS's own Replay Buffer with a hotkey works without any code: enable it under Settings > Output > Replay Buffer, set a hotkey, and add a Media Source that plays the saved file.
- **Highlights after the match:** in **Admin > Stream Overlay > Highlights log**, press **Started now** when you go live. The log then gives each four, six, wicket and milestone a time in the recording (10 seconds early by default), and **Download CSV** hands the list to whoever cuts the highlights video.

## 10. Dry run and phone test

Before the first streamed match:

1. Load `/overlay/test` in the streaming app over the camera. Check: you see the camera around the boxes, the corners are not cropped, the ball moves smoothly.
2. Load `/overlay/demo` and press a few keys (on PC), or use the real match link with a practice fixture.
3. **30-minute phone test:** add the overlay with `?lite=1&debug=1`, stream privately, and score a practice match from the second phone. Every 10 minutes note the debug line:
   - **fps**: green at 24 or more is fine; red means the phone is struggling.
   - **memory**: should level off, not keep climbing.
   - **up**: if it jumps back to 0:00:00, the app reloaded the page. The score must reappear straight away (it does; just note how often it happens).
   - How warm the phone gets and whether the video stutters.
4. Repeat 10 minutes without `lite=1`. Keep full mode only if it holds 24 fps and the phone stays cool; otherwise stream with **Phone (light mode)**.
5. Remove `&debug=1` before going live.

## 11. Match-day checklist

**The day before**
- [ ] The fixture exists in **Scorecard & Fixtures** (teams, date, time, venue).
- [ ] Both teams have their players allocated (Draft Board), with photos where possible.
- [ ] Captains and vice-captains are set (Teams & Captains).
- [ ] The scorer can log in to `/admin` on their phone.
- [ ] Sponsors and logos are up to date (Sponsors).
- [ ] Both phones and power banks charged.

**One hour before**
- [ ] Streaming phone: plugged in, screen stays on, battery saver off, Do Not Disturb on.
- [ ] Internet checked on the streaming phone (upload speed at least 5 Mbps).
- [ ] Admin > Stream Overlay: pick the match, copy the link (light mode on a phone, the delay from your test).
- [ ] Paste the link into PRISM / OBS; the overlay shows **Coming up** with the right teams, date and venue.
- [ ] Facebook Live set up; a short private test stream looks right.
- [ ] Screen on **Automatic**, quick panel **Off**, sponsors **on**.

**At the toss**
- [ ] Scorer: Live Scoring > the match > toss, overs, playing XIs and openers.
- [ ] The overlay switches to **the toss**, then the **playing XIs**.
- [ ] Go live (Public). In Stream Overlay > Highlights log press **Started now**.

**During the match**
- [ ] The first ball brings the score bar back.
- [ ] After each wicket the scorer picks the new batter promptly (the new-batter card follows).
- [ ] Check now and then that the stream video and graphics change together; adjust the delay if not.
- [ ] Use Replay effect, quick panels and player cards in quiet moments; return to Automatic.

**Innings break and end**
- [ ] The **innings break / target** screen shows after the first innings.
- [ ] Scorer opens the chase with its openers; the first ball brings the score bar back.
- [ ] At the end the scorer presses **Finish**; the **result** screen shows. Add the man of the match in Scorecard & Fixtures so it appears with photo.
- [ ] Leave the result up for a minute, then end the stream.
- [ ] Download the highlights CSV for the video editor.

## 12. Troubleshooting

| Problem | Fix |
| --- | --- |
| Black or white box instead of the camera | The app does not show transparency. Try `&bg=chroma` with a chroma-key filter. Check `/overlay/test`. |
| Graphics cut off at the edges | Set the web source to the full frame size (1920x1080 or 1280x720). Add `&debug=1` to see the source size. Use `&scale=0.9` to shrink. |
| Score changes before the video | Increase **Delay** in the link (section 7). |
| Score not updating | Check the scorer is online and scoring the right match. Add `&debug=1`: "feed: ok" and "last ok" should be a few seconds. "MATCH NOT FOUND" means a wrong link: copy it again from Stream Overlay. |
| Overlay shows **Coming up** after the toss | The toss and XIs were not saved in Live Scoring. The scorer must complete the match setup. |
| An effect played twice / old effect replayed | It cannot replay after a reload. If an effect looks wrong, check the ball in Live Scoring (Edit / Undo). |
| A full screen is stuck (scorecard, result) | Admin > Stream Overlay > **Automatic**, or **Reset everything to automatic**. |
| Phone gets hot or stutters | Use **Phone (light mode)**, lower PRISM to 720p, take the phone case off, keep it out of the sun. |
| Sponsor panel covers something | Admin > Stream Overlay > **Hide sponsors**. |
| PRISM reloads the overlay when switching scenes | Harmless: the score is back on the first frame and no effect replays. |
| Internet drops briefly | The overlay keeps the last score and catches up when the connection returns; nothing shows an error on stream. |
