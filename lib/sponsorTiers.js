// Shared by the admin dashboard, the public site, and the API routes, so it
// must stay free of server-only imports. Values are stored in English and
// listed from highest to lowest tier (this is also the display order).
export const SPONSOR_TIERS = ["platinum", "gold", "silver"];

export const SPONSOR_TIER_LABELS = {
  platinum: "Platinum",
  gold: "Gold",
  silver: "Silver",
};

export const DEFAULT_SPONSOR_TIER = "silver";

export function normalizeSponsorTier(value) {
  const tier = String(value || "").trim().toLowerCase();
  return SPONSOR_TIERS.includes(tier) ? tier : null;
}
