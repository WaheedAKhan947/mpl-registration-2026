// Broadcast styling for each franchise: a short code for tight spaces, a
// display label, and a primary / accent colour picked from the team badge.
// Badges themselves come from TEAM_CARDS (lib/siteData.js) via teamLogo().
// Edit the colours here to restyle every overlay graphic for that team.

import { teamLogo } from "@/lib/matches";

export const TEAM_STYLES = {
  "Maneri Eleven": { short: "MEL", label: "ELEVEN", color: "#b3122a", accent: "#e8c27a" },
  "Maneri Baturan": { short: "MBA", label: "BATURAN", color: "#b4501a", accent: "#f2a03d" },
  "Maneri Strikers": { short: "MST", label: "STRIKERS", color: "#0d5a30", accent: "#f2c21b" },
  "Maneri Kings": { short: "MKI", label: "KINGS", color: "#1d7a36", accent: "#f4b63d" },
  "Maneri Markhor": { short: "MMA", label: "MARKHOR", color: "#e0720f", accent: "#ffd08a" },
  "Maneri Azmari": { short: "MAZ", label: "AZMARI", color: "#1c3f86", accent: "#f0a73a" },
};

const FALLBACK = { color: "#0b6b3a", accent: "#f4b63d" };

function initials(name = "") {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

// Style for any team name, with a sensible fallback for unknown names.
export function teamStyle(name = "") {
  const known = TEAM_STYLES[name];
  const words = name.trim().split(/\s+/);
  return {
    name,
    short: known?.short || initials(name) || "TBD",
    label: known?.label || (words.length > 1 ? words.slice(1).join(" ") : name).toUpperCase(),
    color: known?.color || FALLBACK.color,
    accent: known?.accent || FALLBACK.accent,
    logo: teamLogo(name) || "",
  };
}
