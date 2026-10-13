"use client";

import { forwardRef, useLayoutEffect, useRef, useState } from "react";
import { TEAM_CARDS } from "@/lib/siteData";

// Fixed design size: the card is always laid out at 1080x1080 and scaled
// down with a CSS transform by whoever displays it, so a PNG export is the
// same quality on every screen.
export const PLAYER_CARD_SIZE = 1080;

const BADGE_BY_TEAM = Object.fromEntries(TEAM_CARDS.map((team) => [team.name, team.code]));

// Brand colors from tailwind.config.js, written out because the card uses
// inline styles for gradients that Tailwind classes can't express.
const NAVY_DARK = "#060f22";
const NAVY = "#0b1c3d";
const GREEN_DARK = "#064227";
const GOLD = "#f4b63d";
const LIME = "#b8e54a";

// Site fonts (Anton / Inter via next/font) with close system fallbacks, so
// the card still looks right if the web font hasn't loaded.
const DISPLAY_FONT = 'var(--font-display, Impact), Impact, "Arial Narrow", sans-serif';
const BODY_FONT = 'var(--font-body, Arial), Arial, "Segoe UI", sans-serif';

const NAME_MAX_WIDTH = 984;
const NAME_MAX_SIZE = 124;
const NAME_MIN_SIZE = 64;
// Size used when a very long name has to wrap onto two lines.
const NAME_WRAP_MAX_SIZE = 72;

function show(value) {
  const text = String(value ?? "").trim();
  return text || "-";
}

// Shrinks stat values whose longest word wouldn't fit the box width.
function statFontSize(value) {
  const longestWord = Math.max(...String(value).split(/\s+/).map((word) => word.length), 1);
  return Math.round(Math.min(32, Math.max(18, 118 / (longestWord * 0.56))));
}

function display(size, extra = {}) {
  return { fontFamily: DISPLAY_FONT, fontSize: size, lineHeight: 1, textTransform: "uppercase", fontWeight: 400, ...extra };
}

function label(size, extra = {}) {
  return { fontFamily: BODY_FONT, fontSize: size, fontWeight: 800, textTransform: "uppercase", ...extra };
}

function Silhouette() {
  return (
    <div
      className="absolute inset-0 flex items-end justify-center"
      style={{ background: `radial-gradient(circle at 55% 40%, #1d3a6b 0%, ${NAVY} 55%, ${NAVY_DARK} 100%)` }}
    >
      <svg viewBox="0 0 200 200" width="560" height="560" aria-hidden="true" style={{ marginBottom: 160, opacity: 0.3 }}>
        <circle cx="100" cy="70" r="38" fill="#ffffff" />
        <path d="M30 200c0-46 31-78 70-78s70 32 70 78z" fill="#ffffff" />
      </svg>
    </div>
  );
}

function StatBox({ label: title, value }) {
  return (
    <div
      className="flex min-w-0 flex-1 flex-col items-center justify-center text-center"
      style={{
        height: 128,
        padding: "0 10px",
        borderRadius: 18,
        background: "rgba(255,255,255,0.07)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderTop: `5px solid ${GOLD}`,
      }}
    >
      <p style={label(15, { letterSpacing: "0.14em", color: "rgba(255,255,255,0.6)", lineHeight: 1.2 })}>{title}</p>
      <p style={display(statFontSize(value), { marginTop: 10, lineHeight: 1.08, color: "#ffffff", overflowWrap: "anywhere" })}>
        {value}
      </p>
    </div>
  );
}

// Pure presentational stat card: props in, JSX out. `photo` overrides
// player.photo (used to swap in a same-origin data URL for PNG export).
// `sponsors` is a list of { name, logo } with logo already resolved.
const PlayerCard = forwardRef(function PlayerCard({ player, photo, sponsors = [] }, ref) {
  const photoSrc = photo !== undefined ? photo : player?.photo;
  const team = player?.allocatedTeam || "";
  const teamBadge = team ? BADGE_BY_TEAM[team] : null;
  const name = show(player?.playerName);

  // Fit the name on one line by measuring it at full size and scaling
  // down; names too long for that wrap onto two lines instead.
  const nameRef = useRef(null);
  const [nameFit, setNameFit] = useState({ size: NAME_MAX_SIZE, wrap: false });
  useLayoutEffect(() => {
    let cancelled = false;
    function fit() {
      const node = nameRef.current;
      if (!node || cancelled) return;
      node.style.whiteSpace = "nowrap";
      node.style.fontSize = `${NAME_MAX_SIZE}px`;
      const width = node.scrollWidth;
      const single = Math.floor((NAME_MAX_SIZE * NAME_MAX_WIDTH) / width);
      const next =
        single >= NAME_MAX_SIZE
          ? { size: NAME_MAX_SIZE, wrap: false }
          : single >= NAME_MIN_SIZE
            ? { size: single, wrap: false }
            : { size: Math.min(NAME_WRAP_MAX_SIZE, Math.floor(single * 1.8)), wrap: true };
      node.style.whiteSpace = next.wrap ? "normal" : "nowrap";
      node.style.fontSize = `${next.size}px`;
      setNameFit(next);
    }
    fit();
    // Re-fit once web fonts finish loading, since they change the width.
    document.fonts?.ready.then(fit);
    return () => {
      cancelled = true;
    };
  }, [name]);

  const stats = [
    { label: "Role", value: show(player?.playingRole) },
    { label: "Batting", value: show(player?.battingStyle) },
    { label: "Bowling", value: show(player?.bowlingStyle) },
    { label: "Age", value: show(player?.age) },
    { label: "Area", value: show(player?.area) },
  ];
  if (String(player?.cricProId || "").trim()) {
    stats.push({ label: "CricPro ID", value: player.cricProId.trim() });
  }

  const logos = sponsors.filter((sponsor) => sponsor.logo).slice(0, 6);

  return (
    <div
      ref={ref}
      className="relative overflow-hidden"
      style={{
        width: PLAYER_CARD_SIZE,
        height: PLAYER_CARD_SIZE,
        color: "#ffffff",
        fontFamily: BODY_FONT,
        background: `linear-gradient(150deg, ${NAVY} 0%, ${NAVY_DARK} 55%, ${GREEN_DARK} 100%)`,
      }}
    >
      {/* Faint watermark logo behind the left column */}
      <img
        src="/logo.png"
        alt=""
        className="absolute"
        style={{ left: -150, top: 180, width: 620, height: 620, opacity: 0.06 }}
      />

      {/* Photo on the right, fading into the background on the left and bottom */}
      <div className="absolute" style={{ left: 360, right: 0, top: 0, height: 800 }}>
        {photoSrc ? (
          <img src={photoSrc} alt="" className="h-full w-full object-cover" style={{ objectPosition: "center 20%" }} />
        ) : (
          <Silhouette />
        )}
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(90deg, ${NAVY_DARK} 0%, rgba(6,15,34,0.6) 18%, rgba(6,15,34,0) 45%)` }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, rgba(6,15,34,0.5) 0%, rgba(6,15,34,0) 20%, rgba(6,15,34,0) 50%, rgba(6,15,34,0.9) 82%, ${NAVY_DARK} 100%)`,
          }}
        />
      </div>

      {/* Top bar */}
      <div className="absolute flex items-start justify-between" style={{ left: 48, right: 48, top: 40 }}>
        <div className="flex items-center" style={{ gap: 18 }}>
          <img src="/logo.png" alt="MPL" style={{ width: 116, height: 116, filter: "drop-shadow(0 8px 20px rgba(0,0,0,0.45))" }} />
          <div>
            <p style={display(36, { letterSpacing: "0.04em" })}>Maneri</p>
            <p style={display(36, { letterSpacing: "0.04em", color: GOLD, marginTop: 4 })}>Premier League</p>
          </div>
        </div>
        <span
          style={display(34, {
            background: GOLD,
            color: NAVY_DARK,
            padding: "12px 24px",
            borderRadius: 12,
            letterSpacing: "0.06em",
            boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
          })}
        >
          MPL 2026
        </span>
      </div>

      {/* Left column: team the player was drafted to, or "available" */}
      <div className="absolute flex flex-col items-start" style={{ left: 48, top: 220, width: 330 }}>
        {team ? (
          <>
            {teamBadge ? (
              <img
                src={teamBadge}
                alt=""
                style={{
                  width: 190,
                  height: 190,
                  borderRadius: "50%",
                  background: "#ffffff",
                  padding: 6,
                  boxShadow: "0 14px 36px rgba(0,0,0,0.5)",
                }}
              />
            ) : null}
            <p style={label(17, { letterSpacing: "0.24em", color: "rgba(255,255,255,0.65)", marginTop: 22 })}>Drafted by</p>
            <p style={display(46, { color: GOLD, marginTop: 6, lineHeight: 1.02 })}>{team}</p>
          </>
        ) : (
          <>
            <p style={label(17, { letterSpacing: "0.24em", color: "rgba(255,255,255,0.65)" })}>Player Draft</p>
            <p style={display(76, { color: LIME, marginTop: 8 })}>Available</p>
            <span style={{ display: "block", width: 120, height: 6, borderRadius: 3, background: GOLD, marginTop: 18 }} />
          </>
        )}
      </div>

      {/* Name block */}
      <div className="absolute" style={{ left: 48, right: 48, top: nameFit.wrap ? 540 : 570 }}>
        <p style={label(22, { letterSpacing: "0.3em", color: LIME })}>
          {player?.registrationId ? player.registrationId : "Player Profile"}
        </p>
        <h1
          ref={nameRef}
          style={display(nameFit.size, {
            whiteSpace: nameFit.wrap ? "normal" : "nowrap",
            maxWidth: NAME_MAX_WIDTH,
            marginTop: 8,
            letterSpacing: "0.01em",
            textShadow: "0 6px 30px rgba(0,0,0,0.55)",
          })}
        >
          {name}
        </h1>
        <div className="flex items-center" style={{ gap: 16, marginTop: 16 }}>
          <span style={{ width: 90, height: 6, borderRadius: 3, background: GOLD }} />
          <p style={label(22, { letterSpacing: "0.22em", color: "rgba(255,255,255,0.82)" })}>Maneri Premier League</p>
        </div>
      </div>

      {/* Stat strip */}
      <div className="absolute flex" style={{ left: 48, right: 48, top: 808, gap: 12 }}>
        {stats.map((stat) => (
          <StatBox key={stat.label} label={stat.label} value={stat.value} />
        ))}
      </div>

      {/* Sponsor strip */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{ height: 6, bottom: 124, background: `linear-gradient(90deg, ${GOLD}, ${LIME})` }}
      />
      <div
        className="absolute inset-x-0 bottom-0 flex items-center bg-white"
        style={{ height: 124, padding: "0 48px", gap: 28 }}
      >
        <div className="shrink-0" style={{ borderRight: "2px solid rgba(16,32,24,0.12)", paddingRight: 28 }}>
          <p style={label(14, { letterSpacing: "0.22em", color: "#5a6860" })}>Official</p>
          <p style={display(32, { color: GREEN_DARK, marginTop: 4 })}>Sponsors</p>
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-around" style={{ gap: 24 }}>
          {logos.length ? (
            logos.map((sponsor, index) => (
              <img
                key={`${sponsor.name}-${index}`}
                src={sponsor.logo}
                alt={sponsor.name || ""}
                style={{ height: 84, maxWidth: 140, objectFit: "contain" }}
              />
            ))
          ) : (
            <p style={display(32, { color: NAVY })}>Maneri Premier League</p>
          )}
        </div>
      </div>
    </div>
  );
});

export default PlayerCard;
