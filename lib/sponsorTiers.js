// Shared by the admin dashboard, the public site, and the API routes, so it
// must stay free of server-only imports. Values are stored in English and
// listed from highest to lowest tier (this is also the display order).
// Mirrors the MPL Season 2 sponsorship tiers poster (01 Diamond ... 07 Official Partner).
export const SPONSOR_TIERS = ["diamond", "platinum", "gold", "silver", "bronze", "media", "official"];

export const SPONSOR_TIER_LABELS = {
  diamond: "Diamond Sponsor",
  platinum: "Platinum Sponsor",
  gold: "Gold Sponsor",
  silver: "Silver Sponsor",
  bronze: "Bronze Sponsor",
  media: "Media Partner",
  official: "Official Partner",
};

export const DEFAULT_SPONSOR_TIER = "silver";

export function normalizeSponsorTier(value) {
  const tier = String(value || "").trim().toLowerCase();
  return SPONSOR_TIERS.includes(tier) ? tier : null;
}
