import Sponsor from "@/models/Sponsor";
import { SPONSOR_TIERS } from "@/lib/sponsorTiers";

let backfillPromise = null;

// Sponsors created before categories existed have no `category` field. Give
// each of them a random tier once so the public section can group them; the
// admin then corrects them from the dashboard. A no-op once every sponsor
// has a category, so it's safe to call on every request.
//
// Uses the raw collection so the write can't be stripped by a stale cached
// schema (e.g. a dev server that loaded the model before `category` existed).
export function ensureSponsorCategories() {
  if (!backfillPromise) {
    backfillPromise = Sponsor.collection
      .find({ category: { $exists: false } }, { projection: { _id: 1 } })
      .toArray()
      .then((missing) => {
        if (!missing.length) return;
        return Sponsor.collection.bulkWrite(
          missing.map((sponsor) => ({
            updateOne: {
              filter: { _id: sponsor._id, category: { $exists: false } },
              update: {
                $set: { category: SPONSOR_TIERS[Math.floor(Math.random() * SPONSOR_TIERS.length)] },
              },
            },
          }))
        );
      })
      .catch((error) => {
        // Let the next call retry instead of caching a failure forever.
        backfillPromise = null;
        throw error;
      });
  }
  return backfillPromise;
}

// Sorts sponsors platinum -> gold -> silver, keeping creation order within a tier.
export function sortSponsorsByTier(sponsors) {
  const rank = (sponsor) => {
    const index = SPONSOR_TIERS.indexOf(sponsor.category);
    return index === -1 ? SPONSOR_TIERS.length : index;
  };
  return [...sponsors].sort((a, b) => rank(a) - rank(b));
}
